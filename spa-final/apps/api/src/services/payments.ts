import Stripe from 'stripe';
import { env } from '../lib/env.js';

// Stripe is initialized lazily to handle optional configuration in development
function getStripeClient(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured. Stripe features are unavailable.');
  }
  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
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

export async function confirmPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  return stripe().paymentIntents.retrieve(paymentIntentId);
}

export async function refundPayment(
  paymentIntentId: string,
  amount?: number,
  reason?: string
): Promise<Stripe.Refund> {
  return stripe().refunds.create({
    payment_intent: paymentIntentId,
    amount: amount,
    reason: reason as Stripe.RefundCreateParams.Reason,
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
