/**
 * Stripe Payment Service
 * Handles Stripe payment intents, confirmations, and webhooks
 */

import Stripe from 'stripe'
import { prisma } from '@pecase/database'

// Initialize Stripe only if API key is provided
const stripeKey = process.env.STRIPE_SECRET_KEY
let stripe: any = null

if (stripeKey && stripeKey !== 'sk_test_demo') {
  stripe = new Stripe(stripeKey)
} else {
  // Mock stripe for demo mode
  stripe = {
    paymentIntents: {
      create: async () => ({ id: 'pi_demo', client_secret: 'test' }),
      confirm: async () => ({ id: 'pi_demo', status: 'succeeded' }),
      retrieve: async () => ({ id: 'pi_demo', status: 'succeeded' })
    },
    refunds: {
      create: async () => ({ id: 're_demo', status: 'succeeded' })
    }
  }
}

export interface CreatePaymentIntentData {
  salonId: string
  serviceId: string
  staffId: string
  startTime: string
  customerName: string
  customerEmail: string
  customerPhone: string
  amount: number
}

export interface ConfirmPaymentData {
  price?: number
  paymentIntentId: string
  paymentMethodId?: string
  salonId?: string
  serviceId?: string
  staffId?: string
  startTime?: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
}

export interface RefundData {
  paymentIntentId: string
  amount?: number
}

export async function createPaymentIntent(data: CreatePaymentIntentData) {
  if (!stripe || !stripe.paymentIntents) {
    throw new Error('Stripe not properly configured')
  }

  const intent = await stripe.paymentIntents.create({
    amount: Math.round(data.amount * 100),
    currency: 'usd',
    description: `Appointment for ${data.customerName}`,
    metadata: {
      salonId: data.salonId,
      serviceId: data.serviceId,
      staffId: data.staffId,
      startTime: data.startTime
    }
  })

  return intent
}

export async function confirmPaymentIntent(data: ConfirmPaymentData) {
  if (!stripe || !stripe.paymentIntents) {
    throw new Error('Stripe not properly configured')
  }

  const intent = await stripe.paymentIntents.confirm(data.paymentIntentId, {
    payment_method: data.paymentMethodId
  })

  return intent
}

export async function createRefund(data: RefundData) {
  if (!stripe || !stripe.refunds) {
    throw new Error('Stripe not properly configured')
  }

  const refund = await stripe.refunds.create({
    payment_intent: data.paymentIntentId,
    amount: data.amount ? Math.round(data.amount * 100) : undefined
  })

  return refund
}

export async function captureCharge(chargeId: string, amount: number) {
  if (!stripe) {
    throw new Error('Stripe not properly configured')
  }

  return stripe.charges.capture(chargeId, { amount: Math.round(amount * 100) })
}

export async function createConnectAccount(email: string, businessName: string) {
  if (!stripe || !stripe.accounts) {
    return { id: 'acct_demo', charges_enabled: true }
  }

  return stripe.accounts.create({
    type: 'express',
    email,
    business_name: businessName,
    business_type: 'individual'
  })
}

export async function retrieveAccount(accountId: string) {
  if (!stripe || !stripe.accounts) {
    return { id: accountId, charges_enabled: true }
  }

  return stripe.accounts.retrieve(accountId)
}

export async function constructWebhookEvent(body: Buffer, signature: string, secret: string) {
  if (!stripe || !stripe.webhooks) {
    return JSON.parse(body.toString())
  }

  return stripe.webhooks.constructEvent(body, signature, secret)
}

export async function handleStripeWebhook(event: any) {
  // Mock webhook handling for demo
  return { received: true }
}

export default { 
  createPaymentIntent, 
  confirmPaymentIntent, 
  createRefund,
  constructWebhookEvent,
  handleStripeWebhook
}
