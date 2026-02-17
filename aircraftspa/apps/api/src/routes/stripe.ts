import { Router, Request, Response } from "express";
import { prisma } from "@aircraftspa/database";
import { stripe } from "../services/stripe";
import Stripe from "stripe";

export const stripeRouter = Router();

// POST /api/stripe/webhook — Stripe webhook handler
stripeRouter.post("/webhook", async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await prisma.payment.updateMany({
        where: { stripePaymentIntentId: paymentIntent.id },
        data: { status: "succeeded" },
      });

      // If this was a deposit, confirm the booking
      if (paymentIntent.metadata.type === "deposit") {
        await prisma.booking.updateMany({
          where: { id: paymentIntent.metadata.bookingId },
          data: { depositPaid: true, status: "confirmed" },
        });
      }

      // If this was a balance, mark booking balance paid
      if (paymentIntent.metadata.type === "balance") {
        await prisma.booking.updateMany({
          where: { id: paymentIntent.metadata.bookingId },
          data: { balancePaid: true },
        });
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await prisma.payment.updateMany({
        where: { stripePaymentIntentId: paymentIntent.id },
        data: { status: "failed" },
      });
      break;
    }

    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      if (account.charges_enabled) {
        await prisma.business.updateMany({
          where: { stripeAccountId: account.id },
          data: { stripeOnboarded: true },
        });
      }
      break;
    }
  }

  res.json({ received: true });
});
