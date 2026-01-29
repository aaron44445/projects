import Stripe from 'stripe';
import { prisma } from '@peacase/database';
import { env } from '../lib/env.js';
import logger from '../lib/logger.js';

// Stripe is initialized lazily to handle optional configuration in development
function getStripeClient(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured. Subscription features are unavailable.');
  }
  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
  });
}

let stripeClient: Stripe | null = null;

function stripe(): Stripe {
  if (!stripeClient) {
    stripeClient = getStripeClient();
  }
  return stripeClient;
}

// Subscription plan definitions - Professional only (no free tier)
export const SUBSCRIPTION_PLANS = {
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'Full features for growing businesses',
    price: 49,
    priceId: env.STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional',
    features: [
      'Unlimited staff members',
      'Unlimited clients',
      'Full scheduling system',
      'Priority email support',
    ],
    limits: {
      maxStaff: null, // unlimited
      maxClients: null, // unlimited
    },
  },
} as const;

export type SubscriptionPlanId = keyof typeof SUBSCRIPTION_PLANS;

// Add-on price mappings
export const ADDON_PRICES: Record<string, string | undefined> = {
  online_booking: env.STRIPE_ADDON_ONLINE_BOOKING_PRICE_ID,
  payment_processing: env.STRIPE_ADDON_PAYMENT_PROCESSING_PRICE_ID,
  reminders: env.STRIPE_ADDON_REMINDERS_PRICE_ID,
  reports: env.STRIPE_ADDON_REPORTS_PRICE_ID,
  memberships: env.STRIPE_ADDON_MEMBERSHIPS_PRICE_ID,
  gift_cards: env.STRIPE_ADDON_GIFT_CARDS_PRICE_ID,
  marketing: env.STRIPE_ADDON_MARKETING_PRICE_ID,
};

export const ADDON_PRICE_AMOUNT = 25; // $25/month for each add-on
export const EXTRA_LOCATION_PRICE = 100; // $100/month per extra location

export const ADDON_DETAILS: Record<string, { name: string; description: string }> = {
  online_booking: { name: 'Online Booking', description: 'Let clients book 24/7 from your website' },
  payment_processing: { name: 'Payment Processing', description: 'Accept cards, Apple Pay, Google Pay' },
  reminders: { name: 'SMS/Email Reminders', description: 'Reduce no-shows with automated reminders' },
  reports: { name: 'Reports & Analytics', description: 'Revenue dashboards, staff performance' },
  memberships: { name: 'Packages & Memberships', description: 'Sell packages and recurring memberships' },
  gift_cards: { name: 'Gift Cards', description: 'Sell and redeem digital gift cards' },
  marketing: { name: 'Marketing Automation', description: 'Automated campaigns and promotions' },
};

interface CreateCheckoutSessionOptions {
  salonId: string;
  planId: SubscriptionPlanId;
  successUrl: string;
  cancelUrl: string;
  addonIds?: string[];
}

interface CreatePortalSessionOptions {
  salonId: string;
  returnUrl: string;
}

/**
 * Get or create a Stripe customer for a salon
 */
export async function getOrCreateStripeCustomer(salonId: string): Promise<string> {
  const salon = await prisma.salon.findUnique({
    where: { id: salonId },
    include: { users: { where: { role: 'admin' }, take: 1 } },
  });

  if (!salon) {
    throw new Error('Salon not found');
  }

  // Return existing customer ID if available
  if (salon.stripeCustomerId) {
    return salon.stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripe().customers.create({
    email: salon.email,
    name: salon.name,
    metadata: {
      salonId: salon.id,
    },
  });

  // Save customer ID to salon
  await prisma.salon.update({
    where: { id: salonId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createCheckoutSession(
  options: CreateCheckoutSessionOptions
): Promise<Stripe.Checkout.Session> {
  const { salonId, planId, successUrl, cancelUrl, addonIds = [] } = options;

  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan || !plan.priceId) {
    throw new Error('Invalid plan or plan does not require payment');
  }

  const customerId = await getOrCreateStripeCustomer(salonId);

  // Build line items: plan + any add-ons
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price: plan.priceId,
      quantity: 1,
    },
  ];

  // Add any requested add-ons
  for (const addonId of addonIds) {
    const priceId = ADDON_PRICES[addonId];
    if (priceId) {
      lineItems.push({
        price: priceId,
        quantity: 1,
      });
    }
  }

  const session = await stripe().checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: lineItems,
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      trial_period_days: 14,
      metadata: {
        salonId,
        planId,
        addonIds: addonIds.join(','),
      },
    },
    metadata: {
      salonId,
      planId,
      type: 'subscription',
      addonIds: addonIds.join(','),
    },
    allow_promotion_codes: true,
  });

  return session;
}

/**
 * Create a Stripe Customer Portal session
 */
export async function createPortalSession(
  options: CreatePortalSessionOptions
): Promise<Stripe.BillingPortal.Session> {
  const { salonId, returnUrl } = options;

  const customerId = await getOrCreateStripeCustomer(salonId);

  const session = await stripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Get the current subscription for a salon (with add-ons)
 */
export async function getSubscription(salonId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { salonId },
    include: {
      addons: {
        where: { status: 'active' },
      },
    },
  });

  if (!subscription) {
    // No subscription = no access (must subscribe)
    return {
      id: null,
      plan: null,
      status: 'none',
      currentPeriodEnd: null,
      currentPeriodStart: null,
      cancelAtPeriodEnd: false,
      trialEndsAt: null,
      graceEndsAt: null,
      addons: [] as string[],
      planDetails: null,
    };
  }

  return {
    ...subscription,
    addons: subscription.addons.map((a) => a.addonId),
    planDetails: SUBSCRIPTION_PLANS[subscription.plan as SubscriptionPlanId] || SUBSCRIPTION_PLANS.professional,
  };
}

/**
 * Get billing history for a salon
 */
export async function getBillingHistory(salonId: string, limit = 10) {
  const history = await prisma.billingHistory.findMany({
    where: { salonId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return history;
}

/**
 * Add an add-on to an existing subscription
 */
export async function addAddon(salonId: string, addonId: string) {
  // Get the subscription
  const subscription = await prisma.subscription.findUnique({
    where: { salonId },
    include: { addons: true },
  });

  if (!subscription || !subscription.stripeSubscriptionId) {
    throw new Error('No active subscription found. Please subscribe to a plan first.');
  }

  if (!subscription.plan || subscription.status === 'none') {
    throw new Error('Add-ons require an active subscription.');
  }

  // Check if add-on already exists
  const existingAddon = subscription.addons.find((a) => a.addonId === addonId);
  if (existingAddon && existingAddon.status === 'active') {
    throw new Error('This add-on is already active on your subscription.');
  }

  // Get the Stripe price ID for this add-on
  const priceId = ADDON_PRICES[addonId];
  if (!priceId) {
    throw new Error(`Add-on "${addonId}" is not available or not configured.`);
  }

  // Add the item to Stripe subscription
  const subscriptionItem = await stripe().subscriptionItems.create({
    subscription: subscription.stripeSubscriptionId,
    price: priceId,
    proration_behavior: 'create_prorations',
    metadata: {
      addonId,
      salonId,
    },
  });

  // Create or update the addon record
  const addon = await prisma.subscriptionAddon.upsert({
    where: {
      subscriptionId_addonId: {
        subscriptionId: subscription.id,
        addonId,
      },
    },
    create: {
      subscriptionId: subscription.id,
      addonId,
      stripeSubscriptionItemId: subscriptionItem.id,
      status: 'active',
      enabledAt: new Date(),
    },
    update: {
      stripeSubscriptionItemId: subscriptionItem.id,
      status: 'active',
      enabledAt: new Date(),
      canceledAt: null,
    },
  });

  return addon;
}

/**
 * Remove an add-on from a subscription
 */
export async function removeAddon(salonId: string, addonId: string) {
  // Get the subscription with addons
  const subscription = await prisma.subscription.findUnique({
    where: { salonId },
    include: { addons: true },
  });

  if (!subscription) {
    throw new Error('No subscription found.');
  }

  // Find the addon record
  const addon = subscription.addons.find((a) => a.addonId === addonId && a.status === 'active');
  if (!addon) {
    throw new Error('This add-on is not active on your subscription.');
  }

  // Remove from Stripe if we have the subscription item ID
  if (addon.stripeSubscriptionItemId) {
    try {
      await stripe().subscriptionItems.del(addon.stripeSubscriptionItemId, {
        proration_behavior: 'create_prorations',
      });
    } catch (error) {
      logger.error({ err: error, addonId, salonId }, 'Failed to remove Stripe subscription item');
      // Continue anyway to update our database
    }
  }

  // Update the addon record
  await prisma.subscriptionAddon.update({
    where: { id: addon.id },
    data: {
      status: 'canceled',
      canceledAt: new Date(),
    },
  });

  return { success: true, addonId };
}

/**
 * Get checkout preview with pricing breakdown
 */
export async function getCheckoutPreview(
  planId: SubscriptionPlanId,
  addonIds: string[] = []
) {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) {
    throw new Error('Invalid plan');
  }

  const planPrice = plan.price;
  const addonTotal = addonIds.length * ADDON_PRICE_AMOUNT;
  const monthlyTotal = planPrice + addonTotal;

  const addons = addonIds.map((id) => ({
    id,
    name: ADDON_DETAILS[id]?.name || id,
    price: ADDON_PRICE_AMOUNT,
  }));

  return {
    plan: {
      id: planId,
      name: plan.name,
      price: planPrice,
    },
    addons,
    addonTotal,
    monthlyTotal,
    trialDays: 14, // All plans have 14-day trial
    currency: 'USD',
  };
}

/**
 * Accept terms of service
 */
export async function acceptTerms(salonId: string, version: string) {
  await prisma.salon.update({
    where: { id: salonId },
    data: {
      termsAcceptedAt: new Date(),
      termsVersion: version,
    },
  });

  return { success: true, version };
}

/**
 * Handle checkout session completed webhook
 */
export async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const salonId = session.metadata?.salonId;
  const planId = session.metadata?.planId as SubscriptionPlanId;
  const addonIdsString = session.metadata?.addonIds;

  if (!salonId || !planId || session.metadata?.type !== 'subscription') {
    return; // Not a subscription checkout
  }

  const subscriptionId = session.subscription as string;

  // Get the subscription from Stripe
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stripeSubscription = await stripe().subscriptions.retrieve(subscriptionId, {
    expand: ['items.data'],
  }) as any;

  // Upsert subscription record
  const subscription = await prisma.subscription.upsert({
    where: { salonId },
    create: {
      salonId,
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: session.customer as string,
      plan: planId,
      status: stripeSubscription.status,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      trialEndsAt: stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000)
        : null,
    },
    update: {
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: session.customer as string,
      plan: planId,
      status: stripeSubscription.status,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      trialEndsAt: stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000)
        : null,
      graceEndsAt: null, // Clear any grace period
    },
  });

  // Sync add-ons from Stripe subscription items
  if (addonIdsString) {
    const addonIds = addonIdsString.split(',').filter(Boolean);
    for (const item of stripeSubscription.items.data) {
      const addonId = item.metadata?.addonId || item.price?.metadata?.peacase_addon_id;
      if (addonId && addonIds.includes(addonId)) {
        await prisma.subscriptionAddon.upsert({
          where: {
            subscriptionId_addonId: {
              subscriptionId: subscription.id,
              addonId,
            },
          },
          create: {
            subscriptionId: subscription.id,
            addonId,
            stripeSubscriptionItemId: item.id,
            status: 'active',
          },
          update: {
            stripeSubscriptionItemId: item.id,
            status: 'active',
            canceledAt: null,
          },
        });
      }
    }
  }

  // Update salon subscription tier
  await prisma.salon.update({
    where: { id: salonId },
    data: {
      subscriptionTier: planId,
      stripeCustomerId: session.customer as string,
    },
  });
}

/**
 * Handle subscription updated webhook
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleSubscriptionUpdated(subscription: any) {
  const metadataSalonId = subscription.metadata?.salonId;

  // Always lookup existing subscription first for security
  const existingSub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
    select: { id: true, salonId: true }
  });

  if (!existingSub) {
    logger.warn({ stripeSubscriptionId: subscription.id }, 'No subscription found for webhook update');
    return;
  }

  // If metadata has salonId, verify it matches (defense against metadata tampering)
  if (metadataSalonId && metadataSalonId !== existingSub.salonId) {
    logger.error({ metadataSalonId, existingSalonId: existingSub.salonId, stripeSubscriptionId: subscription.id }, 'Subscription metadata salonId mismatch - possible tampering');
    return; // Reject mismatched updates
  }

  // Use verified salonId from database
  const salonId = existingSub.salonId;
  const planId = subscription.metadata?.planId as SubscriptionPlanId || 'professional';

  logger.info({ salonId, stripeSubscriptionId: subscription.id, status: subscription.status }, 'Updating subscription');

  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      plan: planId,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    },
  });

  // Sync subscription items (add-ons)
  if (subscription.items?.data) {
    await syncSubscriptionAddons(existingSub.id, subscription.items.data);
  }

  // Update salon subscription tier if subscription is active
  if (subscription.status === 'active') {
    await prisma.salon.update({
      where: { id: salonId },
      data: { subscriptionTier: planId },
    });
  }
}

/**
 * Sync subscription add-ons from Stripe subscription items
 */
async function syncSubscriptionAddons(subscriptionId: string, items: any[]) {
  // Get current addon records
  const currentAddons = await prisma.subscriptionAddon.findMany({
    where: { subscriptionId },
  });

  const stripeItemIds = new Set<string>();

  // Process each Stripe item
  for (const item of items) {
    const addonId = item.metadata?.addonId || item.price?.metadata?.peacase_addon_id;
    if (!addonId) continue; // Skip non-addon items (like the base plan)

    stripeItemIds.add(item.id);

    // Upsert the addon record
    await prisma.subscriptionAddon.upsert({
      where: {
        subscriptionId_addonId: {
          subscriptionId,
          addonId,
        },
      },
      create: {
        subscriptionId,
        addonId,
        stripeSubscriptionItemId: item.id,
        status: 'active',
      },
      update: {
        stripeSubscriptionItemId: item.id,
        status: 'active',
        canceledAt: null,
      },
    });
  }

  // Mark addons as canceled if they're no longer in Stripe
  for (const addon of currentAddons) {
    if (addon.stripeSubscriptionItemId && !stripeItemIds.has(addon.stripeSubscriptionItemId)) {
      await prisma.subscriptionAddon.update({
        where: { id: addon.id },
        data: {
          status: 'canceled',
          canceledAt: new Date(),
        },
      });
    }
  }
}

/**
 * Handle subscription deleted webhook
 */
export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const existingSub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!existingSub) return;

  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'canceled',
      canceledAt: new Date(),
    },
  });

  // Cancel all addons
  await prisma.subscriptionAddon.updateMany({
    where: { subscriptionId: existingSub.id },
    data: {
      status: 'canceled',
      canceledAt: new Date(),
    },
  });

  // Mark salon subscription as canceled (no free tier)
  await prisma.salon.update({
    where: { id: existingSub.salonId },
    data: { subscriptionTier: 'canceled' },
  });
}

/**
 * Handle invoice payment failed webhook - set grace period
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleInvoicePaymentFailed(invoice: any) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) return;

  // Set 7-day grace period
  const graceEndsAt = new Date();
  graceEndsAt.setDate(graceEndsAt.getDate() + 7);

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscriptionId },
    data: {
      status: 'past_due',
      graceEndsAt,
    },
  });

  logger.warn({ stripeSubscriptionId: subscriptionId, graceEndsAt: graceEndsAt.toISOString() }, 'Invoice payment failed, grace period started');
}

/**
 * Handle invoice paid - record billing history and clear grace period
 */
export async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Find the salon by Stripe customer ID with subscription
  const salon = await prisma.salon.findFirst({
    where: { stripeCustomerId: customerId },
    include: { subscription: true }
  });

  if (!salon) {
    logger.warn({ stripeCustomerId: customerId, invoiceId: invoice.id }, 'No salon found for invoice customer');
    return;
  }

  // Verify invoice subscription belongs to this customer (defense-in-depth)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoiceSubscriptionId = (invoice as any).subscription as string;
  if (invoiceSubscriptionId && salon.subscription?.stripeSubscriptionId !== invoiceSubscriptionId) {
    logger.error({ salonId: salon.id, invoiceSubscriptionId, salonSubscriptionId: salon.subscription?.stripeSubscriptionId }, 'Invoice subscription mismatch');
    return;
  }

  logger.info({ salonId: salon.id, invoiceId: invoice.id, amount: invoice.amount_paid / 100 }, 'Recording billing history');

  // Clear grace period on successful payment
  if (salon.subscription) {
    await prisma.subscription.update({
      where: { id: salon.subscription.id },
      data: {
        status: 'active',
        graceEndsAt: null,
      },
    });
  }

  await prisma.billingHistory.upsert({
    where: { stripeInvoiceId: invoice.id },
    create: {
      salonId: salon.id,
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency,
      status: invoice.status || 'paid',
      description: invoice.lines.data[0]?.description || 'Subscription payment',
      invoicePdfUrl: invoice.invoice_pdf || null,
      hostedInvoiceUrl: invoice.hosted_invoice_url || null,
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
      paidAt: invoice.status_transitions?.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000)
        : new Date(),
    },
    update: {
      amount: invoice.amount_paid / 100,
      status: invoice.status || 'paid',
      invoicePdfUrl: invoice.invoice_pdf || null,
      hostedInvoiceUrl: invoice.hosted_invoice_url || null,
      paidAt: invoice.status_transitions?.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000)
        : new Date(),
    },
  });
}

/**
 * Check if a salon has access to a feature based on their subscription
 * With single-tier (Professional), all features are available when subscribed
 */
export function checkFeatureAccess(plan: SubscriptionPlanId, feature: string): boolean {
  const planDetails = SUBSCRIPTION_PLANS[plan];
  if (!planDetails) return false;

  // Professional has access to all core features
  return true;
}

/**
 * Check if a salon is within their plan limits
 */
export async function checkPlanLimits(salonId: string): Promise<{
  withinLimits: boolean;
  currentStaff: number;
  maxStaff: number | null;
  currentClients: number;
  maxClients: number | null;
}> {
  const salon = await prisma.salon.findUnique({
    where: { id: salonId },
    include: {
      users: { where: { isActive: true } },
      clients: { where: { isActive: true } },
    },
  });

  if (!salon) {
    throw new Error('Salon not found');
  }

  const planDetails = SUBSCRIPTION_PLANS[salon.subscriptionTier as SubscriptionPlanId] || SUBSCRIPTION_PLANS.professional;
  const { maxStaff, maxClients } = planDetails.limits;

  const currentStaff = salon.users.length;
  const currentClients = salon.clients.length;

  const staffWithinLimits = maxStaff === null || currentStaff <= maxStaff;
  const clientsWithinLimits = maxClients === null || currentClients <= maxClients;

  return {
    withinLimits: staffWithinLimits && clientsWithinLimits,
    currentStaff,
    maxStaff,
    currentClients,
    maxClients,
  };
}

export { stripe, env };
