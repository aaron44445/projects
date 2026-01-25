import Stripe from 'stripe';
import { env } from '../lib/env.js';
import { calculateDepositCents } from '../lib/stripeHelpers.js';

// Stripe is initialized lazily to handle optional configuration in development
function getStripeClient(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured. Stripe features are unavailable.');
  }
  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
  });
}

// Lazy initialization - only create client when needed
let stripeClient: Stripe | null = null;

function stripe(): Stripe {
  if (!stripeClient) {
    stripeClient = getStripeClient();
  }
  return stripeClient;
}

interface CreatePaymentIntentOptions {
  amount: number;
  currency?: string;
  customerId?: string;
  metadata?: Record<string, string>;
  description?: string;
}

interface CreateCustomerOptions {
  email: string;
  name: string;
  phone?: string;
  metadata?: Record<string, string>;
}

/**
 * Options for creating a deposit payment intent for booking.
 */
interface CreateDepositPaymentIntentOptions {
  salonId: string;
  serviceId: string;
  clientId: string;
  clientEmail: string;
  servicePrice: number;
  depositPercentage: number;
  appointmentDate: string;
  staffId?: string;
  locationId?: string;
}

export async function createStripeCustomer(options: CreateCustomerOptions): Promise<Stripe.Customer> {
  return stripe().customers.create({
    email: options.email,
    name: options.name,
    phone: options.phone,
    metadata: options.metadata,
  });
}

export async function getOrCreateStripeCustomer(
  email: string,
  name: string,
  existingCustomerId?: string
): Promise<Stripe.Customer> {
  if (existingCustomerId) {
    try {
      return await stripe().customers.retrieve(existingCustomerId) as Stripe.Customer;
    } catch {
      // Customer doesn't exist, create new
    }
  }

  const existingCustomers = await stripe().customers.list({ email, limit: 1 });
  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0];
  }

  return createStripeCustomer({ email, name });
}

export async function createPaymentIntent(options: CreatePaymentIntentOptions): Promise<Stripe.PaymentIntent> {
  return stripe().paymentIntents.create({
    amount: options.amount,
    currency: options.currency || 'usd',
    customer: options.customerId,
    metadata: options.metadata,
    description: options.description,
    automatic_payment_methods: { enabled: true },
  });
}

/**
 * Create a payment intent for booking deposits.
 * Uses manual capture so the deposit is authorized but not charged until service is rendered.
 *
 * @param options - Deposit payment options including service price and salon settings
 * @returns Object with clientSecret for Stripe Elements and deposit amount in cents
 *
 * @example
 * const { clientSecret, depositAmountCents } = await createDepositPaymentIntent({
 *   salonId: 'salon_123',
 *   serviceId: 'service_456',
 *   clientId: 'client_789',
 *   clientEmail: 'client@example.com',
 *   servicePrice: 100,
 *   depositPercentage: 20,
 *   appointmentDate: '2026-02-01T10:00:00Z',
 * });
 */
export async function createDepositPaymentIntent(
  options: CreateDepositPaymentIntentOptions
): Promise<{ clientSecret: string; depositAmountCents: number }> {
  const depositAmountCents = calculateDepositCents(options.servicePrice, options.depositPercentage);

  const paymentIntent = await stripe().paymentIntents.create({
    amount: depositAmountCents,
    currency: 'usd',
    capture_method: 'manual', // Authorization only - capture when service is rendered
    receipt_email: options.clientEmail,
    metadata: {
      type: 'booking_deposit',
      salonId: options.salonId,
      serviceId: options.serviceId,
      clientId: options.clientId,
      appointmentDate: options.appointmentDate,
      staffId: options.staffId || '',
      locationId: options.locationId || '',
      depositPercentage: options.depositPercentage.toString(),
      servicePrice: options.servicePrice.toString(),
    },
    automatic_payment_methods: { enabled: true },
  });

  if (!paymentIntent.client_secret) {
    throw new Error('Failed to create payment intent: no client secret returned');
  }

  return {
    clientSecret: paymentIntent.client_secret,
    depositAmountCents,
  };
}

export async function confirmPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  return stripe().paymentIntents.retrieve(paymentIntentId);
}

/**
 * Capture a payment intent that was previously authorized.
 * Use when the service is rendered and you want to collect the deposit.
 *
 * @param paymentIntentId - The Stripe payment intent ID
 * @returns The captured payment intent
 */
export async function capturePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  return stripe().paymentIntents.capture(paymentIntentId);
}

/**
 * Cancel a payment intent that was authorized but not captured.
 * Use when booking is cancelled before the service is rendered.
 *
 * @param paymentIntentId - The Stripe payment intent ID
 * @returns The canceled payment intent
 */
export async function cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  return stripe().paymentIntents.cancel(paymentIntentId);
}

/**
 * Refund a captured payment intent.
 * Use for cancellations after the deposit has been captured.
 *
 * @param paymentIntentId - The Stripe payment intent ID
 * @param amountCents - Amount to refund in cents (partial refund), or undefined for full refund
 * @param reason - Optional reason for the refund (for Stripe records)
 * @returns The refund object
 */
export async function refundPayment(
  paymentIntentId: string,
  amountCents?: number,
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
): Promise<Stripe.Refund> {
  return stripe().refunds.create({
    payment_intent: paymentIntentId,
    amount: amountCents,
    reason,
  });
}

export async function createGiftCardCheckoutSession(options: {
  amount: number;
  recipientEmail: string;
  recipientName: string;
  senderEmail: string;
  message?: string;
  salonId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  return stripe().checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Gift Card - $${(options.amount / 100).toFixed(2)}`,
            description: `Gift card for ${options.recipientName}`,
          },
          unit_amount: options.amount,
        },
        quantity: 1,
      },
    ],
    customer_email: options.senderEmail,
    metadata: {
      type: 'gift_card',
      salonId: options.salonId,
      recipientEmail: options.recipientEmail,
      recipientName: options.recipientName,
      message: options.message || '',
    },
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
  });
}

export async function createPackageCheckoutSession(options: {
  packageId: string;
  packageName: string;
  price: number;
  clientId: string;
  salonId: string;
  successUrl: string;
  cancelUrl: string;
  customerId?: string;
}): Promise<Stripe.Checkout.Session> {
  return stripe().checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: options.packageName,
          },
          unit_amount: Math.round(options.price * 100),
        },
        quantity: 1,
      },
    ],
    customer: options.customerId,
    metadata: {
      type: 'package',
      packageId: options.packageId,
      clientId: options.clientId,
      salonId: options.salonId,
    },
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
  });
}

export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  return stripe().webhooks.constructEvent(payload, signature, webhookSecret);
}

export { stripe, env };
