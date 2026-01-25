# 04-02 Summary: Backend Payment Endpoints

## Status: COMPLETE

## What Was Built

### 1. Stripe Helper Functions (apps/api/src/lib/stripeHelpers.ts)
- `calculateDepositCents(servicePrice, depositPercentage)` - Calculates deposit in cents for Stripe API
- `getDeclineMessage(declineCode)` - Maps Stripe decline codes to user-friendly messages
- `formatCentsToDollars(cents)` - Formats cents to dollar display string

### 2. Payment Service Extensions (apps/api/src/services/payments.ts)
- `createDepositPaymentIntent(options)` - Creates payment intent with manual capture for deposits
  - Uses `capture_method: 'manual'` so deposit is authorized but not charged until service rendered
  - Includes metadata for salon tracking (salonId, serviceId, clientId, etc.)
- `capturePaymentIntent(paymentIntentId)` - Captures authorized payment
- `cancelPaymentIntent(paymentIntentId)` - Cancels uncaptured authorization
- `refundPayment(paymentIntentId, amountCents?, reason?)` - Refunds captured payments

### 3. Webhook Handler Updates (apps/api/src/routes/webhooks.ts)
- Added idempotency check using `checkAndMarkEventProcessed()` before processing
- Updated `payment_intent.succeeded` handler for booking deposits:
  - Looks up appointment by `stripePaymentIntentId` field
  - Updates appointment `depositStatus` and `depositAmount`
  - Upserts Payment record to prevent duplicates
- Updated `payment_intent.payment_failed` handler for deposit failures
- Added `charge.refunded` handler to update deposit status and payment records

## Key Decisions

1. **Manual Capture Pattern**: Deposits use `capture_method: 'manual'` so authorization happens at booking, capture happens when service is rendered
2. **Appointment Lookup**: Webhooks find appointments by `stripePaymentIntentId` field, not metadata (appointment created AFTER payment)
3. **Graceful Handling**: If webhook fires before appointment exists, log and continue (normal for booking flow)
4. **Idempotency First**: Check `WebhookEvent` table before processing to prevent duplicate charges

## Verification

- TypeScript compiles without errors
- All exports accessible from payments.ts
- Webhook handler imports checkAndMarkEventProcessed
- Decline messages cover all common Stripe codes

## Duration
~12 minutes

## Commits
- fc28da2: feat(04-02): add Stripe helper functions
- 15887d0: feat(04-02): add deposit payment intent functions
