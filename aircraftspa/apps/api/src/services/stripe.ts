import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10" as any,
});

export async function createConnectedAccount(businessEmail: string, businessName: string) {
  return stripe.accounts.create({
    type: "express",
    email: businessEmail,
    business_profile: { name: businessName },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
}

export async function createAccountLink(accountId: string, returnUrl: string) {
  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${returnUrl}?refresh=true`,
    return_url: returnUrl,
    type: "account_onboarding",
  });
}

export async function createDepositIntent(
  amount: number,
  currency: string,
  connectedAccountId: string,
  platformFeePercent: number,
  metadata: Record<string, string>
) {
  const platformFee = Math.round(amount * (platformFeePercent / 100));
  return stripe.paymentIntents.create({
    amount,
    currency,
    metadata,
    application_fee_amount: platformFee,
    transfer_data: {
      destination: connectedAccountId,
    },
  });
}

export async function captureBalance(
  amount: number,
  currency: string,
  connectedAccountId: string,
  platformFeePercent: number,
  paymentMethodId: string,
  customerId: string,
  metadata: Record<string, string>
) {
  const platformFee = Math.round(amount * (platformFeePercent / 100));
  return stripe.paymentIntents.create({
    amount,
    currency,
    payment_method: paymentMethodId,
    customer: customerId,
    confirm: true,
    metadata,
    application_fee_amount: platformFee,
    transfer_data: {
      destination: connectedAccountId,
    },
  });
}
