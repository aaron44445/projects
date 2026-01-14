import Stripe from 'stripe';
import { prisma } from '@peacase/database';
import { env } from '../lib/env.js';

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

// Subscription plan definitions
export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Basic features for getting started',
    price: 0,
    priceId: null, // No Stripe price for free tier
    features: [
      'Basic appointment scheduling',
      '1 staff member',
      'Up to 50 clients',
      'Email support',
    ],
    limits: {
      maxStaff: 1,
      maxClients: 50,
    },
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'Full features for growing businesses',
    price: 49,
    priceId: env.STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional',
    features: [
      'All Free features',
      'Up to 5 staff members',
      'Unlimited clients',
      'Online booking',
      'Payment processing',
      'SMS & Email reminders',
      'Reports & Analytics',
      'Priority email support',
    ],
    limits: {
      maxStaff: 5,
      maxClients: null, // unlimited
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'All features with priority support',
    price: 149,
    priceId: env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
    features: [
      'All Professional features',
      'Unlimited staff members',
      'Advanced marketing automation',
      'Custom branding',
      'API access',
      'Dedicated account manager',
      'Priority phone & email support',
      'Custom integrations',
    ],
    limits: {
      maxStaff: null, // unlimited
      maxClients: null, // unlimited
    },
  },
} as const;

export type SubscriptionPlanId = keyof typeof SUBSCRIPTION_PLANS;

interface CreateCheckoutSessionOptions {
  salonId: string;
  planId: SubscriptionPlanId;
  successUrl: string;
  cancelUrl: string;
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
  const { salonId, planId, successUrl, cancelUrl } = options;

  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan || !plan.priceId) {
    throw new Error('Invalid plan or plan does not require payment');
  }

  const customerId = await getOrCreateStripeCustomer(salonId);

  const session = await stripe().checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [
      {
        price: plan.priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: {
        salonId,
        planId,
      },
    },
    metadata: {
      salonId,
      planId,
      type: 'subscription',
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
 * Get the current subscription for a salon
 */
export async function getSubscription(salonId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { salonId },
  });

  if (!subscription) {
    // Return default free subscription data
    return {
      id: null,
      plan: 'free' as SubscriptionPlanId,
      status: 'active',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      planDetails: SUBSCRIPTION_PLANS.free,
    };
  }

  return {
    ...subscription,
    planDetails: SUBSCRIPTION_PLANS[subscription.plan as SubscriptionPlanId] || SUBSCRIPTION_PLANS.free,
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
 * Handle checkout session completed webhook
 */
export async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const salonId = session.metadata?.salonId;
  const planId = session.metadata?.planId as SubscriptionPlanId;

  if (!salonId || !planId || session.metadata?.type !== 'subscription') {
    return; // Not a subscription checkout
  }

  const subscriptionId = session.subscription as string;

  // Get the subscription from Stripe
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stripeSubscription = await stripe().subscriptions.retrieve(subscriptionId) as any;

  // Upsert subscription record
  await prisma.subscription.upsert({
    where: { salonId },
    create: {
      salonId,
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: session.customer as string,
      plan: planId,
      status: stripeSubscription.status,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    },
    update: {
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: session.customer as string,
      plan: planId,
      status: stripeSubscription.status,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    },
  });

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
  const salonId = subscription.metadata?.salonId;

  if (!salonId) {
    // Try to find by subscription ID
    const existingSub = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    });
    if (!existingSub) return;
  }

  const planId = subscription.metadata?.planId as SubscriptionPlanId || 'professional';

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      plan: planId,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    },
  });

  // Update salon subscription tier if subscription is active
  if (subscription.status === 'active') {
    const sub = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    });
    if (sub) {
      await prisma.salon.update({
        where: { id: sub.salonId },
        data: { subscriptionTier: planId },
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

  // Downgrade salon to free tier
  await prisma.salon.update({
    where: { id: existingSub.salonId },
    data: { subscriptionTier: 'free' },
  });
}

/**
 * Handle invoice payment failed webhook
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleInvoicePaymentFailed(invoice: any) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) return;

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscriptionId },
    data: { status: 'past_due' },
  });
}

/**
 * Handle invoice paid - record billing history
 */
export async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Find the salon by Stripe customer ID
  const salon = await prisma.salon.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!salon) return;

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
 */
export function checkFeatureAccess(plan: SubscriptionPlanId, feature: string): boolean {
  const planDetails = SUBSCRIPTION_PLANS[plan];
  if (!planDetails) return false;

  // Enterprise has access to everything
  if (plan === 'enterprise') return true;

  // Professional has access to most features
  if (plan === 'professional') {
    const restrictedFeatures = ['api_access', 'custom_integrations', 'dedicated_manager'];
    return !restrictedFeatures.includes(feature);
  }

  // Free has limited access
  const freeFeatures = ['basic_scheduling', 'email_support'];
  return freeFeatures.includes(feature);
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

  const planDetails = SUBSCRIPTION_PLANS[salon.subscriptionTier as SubscriptionPlanId] || SUBSCRIPTION_PLANS.free;
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
