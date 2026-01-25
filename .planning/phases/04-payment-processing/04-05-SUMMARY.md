# Plan 04-05 Summary: End-to-End Payment Integration

## Status: COMPLETE

## What Was Built

### 1. Public Payment Intent Endpoint
**File:** `apps/api/src/routes/public.ts`

- `POST /api/v1/public/:slug/create-payment-intent` - Creates Stripe payment intent for deposits
- Validates salon has deposits enabled
- Verifies service exists and uses server-side price (security)
- Creates/finds client record for metadata
- Returns clientSecret and depositAmountCents

### 2. Booking Endpoint Payment Integration
**File:** `apps/api/src/routes/public.ts`

- Updated `POST /api/v1/public/:slug/book` to accept `stripePaymentIntentId`
- Links payment to appointment for webhook processing
- Sets initial `depositStatus: 'authorized'`

### 3. Booking Widget Payment Step
**File:** `apps/web/src/app/embed/[slug]/page.tsx`

- Added payment step when `salon.requireDeposit` is true
- Integrates with Stripe Elements via PaymentForm component
- Shows BookingSummary with deposit breakdown
- Passes `paymentIntent.id` (not clientSecret) to booking API

### 4. PaymentForm Component
**File:** `apps/web/src/components/booking/PaymentForm.tsx`

- Stripe Payment Element integration
- 40+ decline code mappings to friendly messages
- Retry functionality on decline
- Passes correct `paymentIntent.id` to parent on success

### 5. BookingSummary Component
**File:** `apps/web/src/components/booking/BookingSummary.tsx`

- Shows service, location, staff, date/time
- Displays deposit amount due now
- Shows balance due at appointment

## Commits

| Commit | Description |
|--------|-------------|
| 550697e | feat(04-05): add public payment intent creation endpoint |
| 91679e6 | feat(04-05): integrate payment into booking widget |

## Verification

Human testing completed:
- [x] Payment step appears when salon requires deposits
- [x] Card input fields render (Stripe Elements)
- [x] Test card 4242... processes successfully
- [x] Confirmation screen appears after payment
- [x] Non-deposit flow still works (skips payment step)

## Decisions Made

- **04-05:** Public endpoint creates client record if not exists (needed for metadata)
- **04-05:** Server-side price used for security (don't trust client-provided price)
- **04-05:** PaymentForm passes paymentIntent.id not clientSecret to booking API

## Issues Fixed During Execution

1. Stripe API version was invalid (`2025-12-15.clover`) - fixed to `2024-06-20`
2. Frontend env variable was `NEXT_PUBLIC_STRIPE_KEY` but code expected `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Input fields had white text on white background - added `text-gray-900 bg-white` classes
