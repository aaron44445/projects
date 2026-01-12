# Stripe Payment Integration - Quick Start Guide

## Setup (5 minutes)

### 1. Get Stripe API Keys
1. Visit https://dashboard.stripe.com/apikeys
2. Ensure you're in **Test Mode** (toggle at top right)
3. Copy your keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

### 2. Configure Environment Variables

Edit `.env` or `.env.local`:

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_WEBHOOK_KEY (optional for local testing)
```

### 3. Install Dependencies

Dependencies are already installed via:
```bash
pnpm add stripe --filter @pecase/api
pnpm add @stripe/react-stripe-js stripe zustand axios --filter @pecase/booking
```

### 4. Start the Application

```bash
# Terminal 1: Start backend API
pnpm dev --filter @pecase/api

# Terminal 2: Start booking app
pnpm dev --filter @pecase/booking
```

## Test the Payment Flow

### Using Test Card

| Field | Value |
|-------|-------|
| Card Number | `4242 4242 4242 4242` |
| Expiry | Any future date (e.g., 12/25) |
| CVC | Any 3 digits (e.g., 123) |

### Payment Scenarios

```
Test Success:     4242 4242 4242 4242
Test Decline:     4000 0000 0000 0002
Test 3D Secure:   4000 0025 0000 3155
```

### Testing Steps

1. Open booking app: http://localhost:3002
2. Go through booking wizard:
   - Select salon
   - Select service
   - Select staff
   - Select date/time
   - Enter customer details
3. On Review page: Click "Pay & Confirm"
4. Enter test card details
5. Click "Pay" button
6. Should show success and redirect to confirmation page

## Key Files

| File | Purpose |
|------|---------|
| `apps/api/src/services/stripe.service.ts` | Stripe operations |
| `apps/api/src/routes/payments.routes.ts` | Payment API endpoints |
| `apps/booking/src/components/booking/PaymentForm.tsx` | Payment UI |
| `apps/booking/src/stores/booking.store.ts` | Booking state |
| `packages/database/prisma/schema.prisma` | Database schema |

## API Endpoints

### Create Payment Intent
```bash
POST http://localhost:3001/api/v1/payments/create-intent

{
  "salonId": "...",
  "serviceId": "...",
  "staffId": "...",
  "startTime": "2024-01-15T14:00:00Z",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+1234567890",
  "amount": 99.99
}
```

### Confirm Booking
```bash
POST http://localhost:3001/api/v1/payments/confirm-booking

{
  "paymentIntentId": "pi_...",
  "salonId": "...",
  "serviceId": "...",
  "staffId": "...",
  "startTime": "2024-01-15T14:00:00Z",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+1234567890",
  "price": 99.99
}
```

## Debugging

### Check Payment Status
1. Go to https://dashboard.stripe.com/payments (test mode)
2. Look for your test payment
3. Click to see details and events

### View Logs
```bash
# Terminal with running API
curl http://localhost:3001/health
```

### Common Issues

**Issue**: "Stripe not initialized"
- Check `STRIPE_SECRET_KEY` in `.env`
- Restart API server

**Issue**: "Payment method is invalid"
- Use correct test card: `4242 4242 4242 4242`
- Check expiry date is in future

**Issue**: "Card declined"
- Use test card `4242 4242 4242 4242` for success
- Use `4000 0000 0000 0002` to test decline flow

## Production Setup

When deploying to production:

1. Switch Stripe dashboard to **Live Mode**
2. Get live API keys
3. Update environment variables with live keys
4. Set webhook URL to production domain
5. Test with real card (low amount)
6. Enable email receipts
7. Set up monitoring and alerting

## Webhook Setup (Optional for Local Testing)

For local webhook testing, use Stripe CLI:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local endpoint
stripe listen --forward-to localhost:3001/api/v1/payments/webhook

# Get webhook signing secret
# Add to .env as STRIPE_WEBHOOK_SECRET
```

## Next Steps

- [ ] Test payment flow with test card
- [ ] Verify appointment is created in database
- [ ] Check payment record in database
- [ ] Implement email receipts (Task 8)
- [ ] Add appointment reminders (Task 8)
- [ ] Set up monitoring
- [ ] Deploy to staging
- [ ] Go live with production keys

## Support

- **Stripe Docs**: https://stripe.com/docs
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Contact Support**: support@stripe.com

---

**Status**: Ready for Testing ✅
