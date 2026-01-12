/**
 * Payment Routes
 * Handles payment intent creation, booking confirmation, and Stripe webhooks
 */

import { Router, Request, Response } from 'express'
import * as stripeService from '../services/stripe.service'
import express from 'express'

const router = Router()

/**
 * POST /api/v1/payments/create-intent
 * Create a Stripe payment intent for a booking
 */
router.post('/create-intent', async (req: Request, res: Response) => {
  try {
    const {
      salonId,
      serviceId,
      staffId,
      startTime,
      customerName,
      customerEmail,
      customerPhone,
      amount,
    } = req.body

    // Validate required fields
    if (!salonId || !serviceId || !staffId || !startTime || !amount) {
      return res.status(400).json({
        error: 'Missing required fields: salonId, serviceId, staffId, startTime, amount',
      })
    }

    if (!customerName || !customerEmail || !customerPhone) {
      return res.status(400).json({
        error: 'Missing customer information: customerName, customerEmail, customerPhone',
      })
    }

    const result = await stripeService.createPaymentIntent({
      salonId,
      serviceId,
      staffId,
      startTime,
      customerName,
      customerEmail,
      customerPhone,
      amount,
    })

    res.json(result)
  } catch (error: any) {
    console.error('Payment intent creation error:', error)
    res.status(500).json({
      error: error.message || 'Failed to create payment intent',
    })
  }
})

/**
 * POST /api/v1/payments/confirm-booking
 * Confirm a payment and create the appointment
 */
router.post('/confirm-booking', async (req: Request, res: Response) => {
  try {
    const {
      paymentIntentId,
      salonId,
      serviceId,
      staffId,
      startTime,
      customerName,
      customerEmail,
      customerPhone,
      price,
    } = req.body

    // Validate required fields
    if (!paymentIntentId || !salonId || !serviceId || !staffId) {
      return res.status(400).json({
        error: 'Missing required fields: paymentIntentId, salonId, serviceId, staffId',
      })
    }

    if (!startTime || !customerName || !customerEmail || !customerPhone || price === undefined) {
      return res.status(400).json({
        error:
          'Missing required fields: startTime, customerName, customerEmail, customerPhone, price',
      })
    }

    const appointment = await stripeService.confirmPaymentIntent({
      paymentIntentId,
      salonId,
      serviceId,
      staffId,
      startTime,
      customerName,
      customerEmail,
      customerPhone,
      price,
    })

    res.json({
      success: true,
      appointment: {
        id: appointment.id,
        status: appointment.status,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        price: appointment.price,
        clientName: appointment.client?.firstName + ' ' + appointment.client?.lastName,
        serviceName: appointment.service?.name,
        staffName: appointment.staff?.firstName + ' ' + appointment.staff?.lastName,
      },
    })
  } catch (error: any) {
    console.error('Booking confirmation error:', error)
    res.status(500).json({
      error: error.message || 'Failed to confirm booking',
    })
  }
})

/**
 * POST /api/v1/payments/webhook
 * Stripe webhook handler - must use raw body
 */
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

    if (!signature || !webhookSecret) {
      return res.status(400).json({
        error: 'Missing webhook signature or secret',
      })
    }

    try {
      const event = stripeService.constructWebhookEvent(req.body, signature, webhookSecret)

      // Handle the event
      await stripeService.handleStripeWebhook(event)

      res.json({ received: true })
    } catch (error: any) {
      console.error('Webhook signature verification failed:', error.message)
      res.status(400).json({
        error: `Webhook Error: ${error.message}`,
      })
    }
  }
)

export default router
