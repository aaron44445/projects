import { Router, Request, Response } from 'express';
import express from 'express';
import twilio from 'twilio';
import { constructWebhookEvent } from '../services/payments.js';
import { sendEmail, giftCardEmail } from '../services/email.js';
import {
  handleCheckoutCompleted,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaymentFailed,
  handleInvoicePaid,
} from '../services/subscriptions.js';
import { checkAndMarkEventProcessed } from '../services/webhookEvents.js';
import { prisma } from '@peacase/database';
import { randomBytes } from 'crypto';
import { env } from '../lib/env.js';
import { asyncHandler } from '../lib/errorUtils.js';
import logger from '../lib/logger.js';

const router = Router();

function generateGiftCardCode(): string {
  return randomBytes(8).toString('hex').toUpperCase().match(/.{1,4}/g)!.join('-');
}

// Twilio SMS status callback webhook
// Twilio sends form-encoded data, NOT JSON
router.post('/sms-status', express.urlencoded({ extended: true }), asyncHandler(async (req: Request, res: Response) => {
  // Validate Twilio signature for security
  if (!env.TWILIO_AUTH_TOKEN) {
    logger.error('TWILIO_AUTH_TOKEN not configured for SMS webhook');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  const twilioSignature = req.headers['x-twilio-signature'] as string;
  if (twilioSignature) {
    // Build the URL Twilio used to sign the request
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['host'];
    const url = `${protocol}://${host}${req.originalUrl}`;

    const isValid = twilio.validateRequest(
      env.TWILIO_AUTH_TOKEN,
      twilioSignature,
      url,
      req.body
    );

    if (!isValid) {
      logger.warn('Invalid Twilio signature on SMS webhook');
      return res.status(403).json({ error: 'Invalid signature' });
    }
  } else if (env.NODE_ENV === 'production') {
    // In production, require signature
    logger.warn('Missing Twilio signature on SMS webhook');
    return res.status(403).json({ error: 'Missing signature' });
  }

  // Respond immediately to avoid Twilio timeout retries
  res.status(200).send('OK');

  // Extract Twilio callback data
  const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = req.body;

  if (!MessageSid || !MessageStatus) {
    logger.warn('Missing MessageSid or MessageStatus in SMS webhook');
    return;
  }

  // Map Twilio status to our status
  const statusMap: Record<string, string> = {
    'accepted': 'pending',
    'queued': 'pending',
    'sending': 'pending',
    'sent': 'sent',
    'delivered': 'delivered',
    'undelivered': 'failed',
    'failed': 'failed',
  };

  const smsStatus = statusMap[MessageStatus] || 'unknown';

  try {
    // Find notification first for tenant verification and audit trail
    const notification = await prisma.notificationLog.findFirst({
      where: { twilioMessageSid: MessageSid },
      select: { id: true, salonId: true }
    });

    if (!notification) {
      logger.warn({ messageSid: MessageSid }, 'No notification found for MessageSid in SMS webhook');
      return;
    }

    // Log the update with salonId context for audit trail
    logger.info({ notificationId: notification.id, salonId: notification.salonId, smsStatus }, 'Updating SMS notification status');

    // Update NotificationLog entry by ID (more precise than MessageSid)
    await prisma.notificationLog.update({
      where: { id: notification.id },
      data: {
        smsStatus,
        smsError: ErrorMessage || null,
        smsErrorCode: ErrorCode || null,
        smsDeliveredAt: smsStatus === 'delivered' ? new Date() : undefined,
        // Update overall status if SMS was the only/primary channel
        // Leave as-is if email already succeeded
        updatedAt: new Date(),
      },
    });

    // Handle bounced/invalid numbers - mark client phone as invalid
    if (smsStatus === 'failed' && ErrorCode) {
      // Common invalid number error codes: 21211, 21214, 21217, 21610, 21612
      const invalidNumberCodes = ['21211', '21214', '21217', '21610', '21612'];
      if (invalidNumberCodes.includes(ErrorCode)) {
        const notification = await prisma.notificationLog.findFirst({
          where: { twilioMessageSid: MessageSid },
          select: { clientId: true },
        });

        if (notification) {
          logger.info({ clientId: notification.clientId }, 'Marking client phone as invalid');
          // Note: We don't have a phoneBounced field yet - just log for now
          // Could add this field in a future update if needed
        }
      }
    }
  } catch (error) {
    logger.error({ err: error, messageSid: MessageSid }, 'Error processing SMS webhook status callback');
    // Don't throw - we already sent 200 OK
  }
}));

router.post('/stripe', asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    return res.status(400).json({ error: 'Missing signature' });
  }

  let event;
  try {
    if (!env.STRIPE_WEBHOOK_SECRET) {
      logger.error('STRIPE_WEBHOOK_SECRET is not configured');
      return res.status(500).json({ error: 'Webhook not configured' });
    }
    event = constructWebhookEvent(
      req.body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error({ err }, 'Stripe webhook signature verification failed');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Idempotency check - has this event been processed?
  // This prevents duplicate processing on webhook retries
  const { alreadyProcessed } = await checkAndMarkEventProcessed(event.id, event.type);
  if (alreadyProcessed) {
    return res.json({ received: true, alreadyProcessed: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const metadata = session.metadata;

        // Handle subscription checkout
        if (metadata?.type === 'subscription') {
          await handleCheckoutCompleted(session);
        }
        // Handle gift card checkout
        else if (metadata?.type === 'gift_card') {
          // Verify salon exists (security: don't trust metadata blindly)
          const salon = await prisma.salon.findUnique({
            where: { id: metadata.salonId },
            select: { id: true, name: true, stripeCustomerId: true }
          });

          if (!salon) {
            logger.error({ salonId: metadata.salonId }, 'Invalid salonId in gift card metadata');
            break;
          }

          const code = generateGiftCardCode();
          const amount = session.amount_total / 100;

          logger.info({ salonId: salon.id, amount }, 'Creating gift card');

          await prisma.giftCard.create({
            data: {
              salonId: salon.id, // Use verified ID from database
              code,
              initialAmount: amount,
              balance: amount,
              purchaserEmail: session.customer_email,
              recipientEmail: metadata.recipientEmail,
              recipientName: metadata.recipientName,
              message: metadata.message || null,
            },
          });

          if (metadata.recipientEmail) {
            await sendEmail({
              to: metadata.recipientEmail,
              subject: `You've received a gift card from ${salon.name}!`,
              html: giftCardEmail({
                recipientName: metadata.recipientName,
                senderName: 'A friend',
                amount,
                code,
                message: metadata.message,
                salonName: salon.name,
              }),
            });
          }
        }
        // Handle package checkout
        else if (metadata?.type === 'package') {
          const pkg = await prisma.package.findUnique({
            where: { id: metadata.packageId },
            include: { packageServices: true },
          });

          if (pkg) {
            const totalServices = pkg.packageServices.reduce((sum, ps) => sum + ps.quantity, 0);

            await prisma.clientPackage.create({
              data: {
                clientId: metadata.clientId,
                packageId: pkg.id,
                purchaseDate: new Date(),
                expirationDate: pkg.durationDays
                  ? new Date(Date.now() + pkg.durationDays * 24 * 60 * 60 * 1000)
                  : null,
                servicesRemaining: totalServices,
                totalServices,
              },
            });
          }
        }
        break;
      }

      // Subscription lifecycle events
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      // Invoice events
      case 'invoice.paid': {
        const invoice = event.data.object as any;
        await handleInvoicePaid(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      // Payment intent events (for non-subscription payments)
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as any;
        const metadata = paymentIntent.metadata;

        // Handle booking deposit payments
        if (metadata?.type === 'booking_deposit') {
          // Look up appointment by stripePaymentIntentId (appointment created after payment succeeds)
          // The appointment may not exist yet if webhook fires before booking completion
          const appointment = await prisma.appointment.findFirst({
            where: { stripePaymentIntentId: paymentIntent.id },
          });

          if (appointment) {
            // Appointment exists - update deposit status
            await prisma.appointment.update({
              where: { id: appointment.id },
              data: {
                depositStatus: 'authorized',
                depositAmount: paymentIntent.amount / 100,
              },
            });

            // Upsert payment record (prevent duplicates if webhook retries)
            await prisma.payment.upsert({
              where: { stripePaymentId: paymentIntent.id },
              create: {
                salonId: metadata.salonId,
                clientId: metadata.clientId,
                appointmentId: appointment.id,
                amount: paymentIntent.amount / 100,
                totalAmount: paymentIntent.amount / 100,
                status: 'completed',
                stripePaymentId: paymentIntent.id,
                method: 'card',
              },
              update: {
                status: 'completed',
              },
            });

            logger.info({ appointmentId: appointment.id }, 'Deposit authorized for appointment');
          } else {
            // Appointment not created yet - this is normal for booking flow
            // The booking endpoint will create the appointment with depositStatus: 'authorized'
            // after confirming the payment. Log for debugging but no action needed.
            logger.info({ paymentIntentId: paymentIntent.id }, 'Payment intent succeeded, awaiting appointment creation');
          }
        } else {
          // Existing behavior for other payments (subscriptions, full payments, etc.)
          await prisma.payment.updateMany({
            where: { stripePaymentId: paymentIntent.id },
            data: { status: 'completed' },
          });
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as any;
        const metadata = paymentIntent.metadata;

        if (metadata?.type === 'booking_deposit') {
          // Look up appointment by stripePaymentIntentId
          const appointment = await prisma.appointment.findFirst({
            where: { stripePaymentIntentId: paymentIntent.id },
          });

          if (appointment) {
            await prisma.appointment.update({
              where: { id: appointment.id },
              data: {
                depositStatus: 'failed',
              },
            });
            logger.info({ appointmentId: appointment.id }, 'Deposit failed for appointment');
          } else {
            // No appointment yet - payment failed before booking completed
            // User will see decline message in UI and can retry
            logger.info({ paymentIntentId: paymentIntent.id }, 'Payment intent failed, no appointment to update');
          }
        } else {
          await prisma.payment.updateMany({
            where: { stripePaymentId: paymentIntent.id },
            data: { status: 'failed' },
          });
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as any;
        const paymentIntentId = charge.payment_intent;

        if (paymentIntentId) {
          // Update appointment deposit status
          await prisma.appointment.updateMany({
            where: { stripePaymentIntentId: paymentIntentId },
            data: { depositStatus: 'refunded' },
          });

          // Update payment record
          await prisma.payment.updateMany({
            where: { stripePaymentId: paymentIntentId },
            data: {
              status: 'refunded',
              refundAmount: charge.amount_refunded / 100,
              refundedAt: new Date(),
            },
          });

          logger.info({ paymentIntentId }, 'Refund processed for payment intent');
        }
        break;
      }
    }
  } catch (error) {
    logger.error({ err: error, eventType: event?.type }, 'Error processing Stripe webhook');
    // Still return 200 to acknowledge receipt
  }

  res.json({ received: true });
}));

export { router as webhooksRouter };
