import { Router, Request, Response } from 'express';
import { constructWebhookEvent } from '../services/payments.js';
import { sendEmail, giftCardEmail } from '../services/email.js';
import {
  handleCheckoutCompleted,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaymentFailed,
  handleInvoicePaid,
} from '../services/subscriptions.js';
import { prisma } from '@peacase/database';
import { randomBytes } from 'crypto';
import { env } from '../lib/env.js';

const router = Router();

function generateGiftCardCode(): string {
  return randomBytes(8).toString('hex').toUpperCase().match(/.{1,4}/g)!.join('-');
}

router.post('/stripe', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    return res.status(400).json({ error: 'Missing signature' });
  }

  let event;
  try {
    if (!env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured');
      return res.status(500).json({ error: 'Webhook not configured' });
    }
    event = constructWebhookEvent(
      req.body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Invalid signature' });
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
          const salon = await prisma.salon.findUnique({
            where: { id: metadata.salonId },
          });

          if (salon) {
            const code = generateGiftCardCode();
            const amount = session.amount_total / 100;

            await prisma.giftCard.create({
              data: {
                salonId: metadata.salonId,
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
        await prisma.payment.updateMany({
          where: { stripePaymentId: paymentIntent.id },
          data: { status: 'completed' },
        });
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as any;
        await prisma.payment.updateMany({
          where: { stripePaymentId: paymentIntent.id },
          data: { status: 'failed' },
        });
        break;
      }
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    // Still return 200 to acknowledge receipt
  }

  res.json({ received: true });
});

export { router as webhooksRouter };
