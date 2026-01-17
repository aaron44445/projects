# Multi-Tenant Marketing & Reminders Add-On Design

**Date:** 2026-01-14
**Status:** Approved
**Feature:** Salon owners bring their own SendGrid/Twilio API keys

---

## Overview

Enable spa owners to use their own SendGrid (email) and Twilio (SMS) API keys for appointment reminders and marketing campaigns. This is a $25/month add-on that requires salon owners to provide and pay for their own messaging services.

---

## Business Requirements

### Pricing Model
- Base plan: $50/month
- Marketing & Reminders add-on: +$25/month
- Salon owners bring their own API keys (they pay SendGrid/Twilio directly)

### Feature Scope
The $25/month add-on unlocks:
- 24-hour appointment reminders (email/SMS)
- 2-hour appointment reminders (email/SMS)
- Marketing campaigns (bulk email/SMS to clients)
- Both SendGrid and Twilio are optional (can use one or both)

### Email Separation
- **Platform emails** (password reset, email verification): Use Peacase's SendGrid keys
- **Salon emails** (reminders, marketing, confirmations): Use salon's keys (if add-on enabled)

---

## User Flow

### Signup Flow
1. User selects base plan ($50/month)
2. Presented with optional add-ons: "Marketing & Reminders (+$25/month)"
3. Clear disclaimer: "Requires your own SendGrid/Twilio API keys"
4. If selected, subscription starts immediately
5. 7-day grace period to configure API keys

### Settings Page
- Owner/Admin can manage API keys
- Input fields with "Test Connection" buttons
- Masked key display (sk_•••••••)
- Validation status indicators
- Setup wizard with step-by-step guide

### Add-Ons Page
- Dedicated page showing available add-ons
- Clear feature list and pricing
- Enable/disable buttons
- Links to documentation

---

## Technical Design

### Database Schema (Prisma)

```prisma
model Salon {
  // ... existing fields ...

  // Marketing & Reminders Add-On
  marketingAddonEnabled     Boolean   @default(false) @map("marketing_addon_enabled")
  marketingAddonSuspended   Boolean   @default(false) @map("marketing_addon_suspended")
  marketingAddonEnabledAt   DateTime? @map("marketing_addon_enabled_at")
  stripeMarketingSubId      String?   @map("stripe_marketing_sub_id")

  // SendGrid (Encrypted)
  sendgridApiKeyEncrypted   String?   @map("sendgrid_api_key_encrypted")
  sendgridFromEmail         String?   @map("sendgrid_from_email")
  sendgridValidated         Boolean   @default(false) @map("sendgrid_validated")
  sendgridLastValidatedAt   DateTime? @map("sendgrid_last_validated_at")

  // Twilio (Encrypted)
  twilioAccountSidEncrypted String?   @map("twilio_account_sid_encrypted")
  twilioAuthTokenEncrypted  String?   @map("twilio_auth_token_encrypted")
  twilioPhoneNumber         String?   @map("twilio_phone_number")
  twilioValidated           Boolean   @default(false) @map("twilio_validated")
  twilioLastValidatedAt     DateTime? @map("twilio_last_validated_at")
}
```

### Encryption Strategy

- Algorithm: AES-256-GCM (authenticated encryption)
- Master key stored in environment variable: `ENCRYPTION_KEY`
- Format: `iv:authTag:encryptedData`
- New IV generated for each encryption

### API Endpoints

```
POST   /api/integrations/marketing-addon/enable
POST   /api/integrations/marketing-addon/disable
PUT    /api/integrations/sendgrid
POST   /api/integrations/sendgrid/test
DELETE /api/integrations/sendgrid
PUT    /api/integrations/twilio
POST   /api/integrations/twilio/test
DELETE /api/integrations/twilio
GET    /api/integrations/status
```

All endpoints require `owner` or `admin` role.

### Multi-Tenant Service Layer

Email/SMS services check salon's keys first:
1. If platform email (auth, verification) → Use Peacase's keys
2. If salon email AND add-on enabled AND keys validated → Use salon's keys
3. Otherwise → Don't send (return false)

### Stripe Integration

- Separate subscription for add-on (price_marketing_addon_monthly)
- Webhook events: subscription.deleted, invoice.payment_failed
- Cancel at period end (don't cut off immediately)

---

## Error Handling

### Key Validation
- Format validation before test (SG. prefix, AC prefix)
- Live test sends actual email/SMS
- Test message: "This is a test from Peacase. Your integration is working!"

### Key Failure Recovery
- If send fails with 401/403: Mark keys as invalid
- Send platform email to salon owner
- Show dashboard alert
- Keep subscription active (user's responsibility)

### Grace Period
- 7 days after enabling to configure keys
- If no keys after 7 days: Keep charging, reminders just don't send
- No auto-suspension (user chose "E" - their responsibility)

---

## Access Control

- Only `owner` and `admin` roles can manage API keys
- Keys are never returned in API responses
- Keys displayed masked in UI (sk_•••••••)

---

## Implementation Phases

### Phase 1: Foundation
- Database migration (new Salon fields)
- Encryption utility module
- Environment variable setup

### Phase 2: API Key Management
- CRUD endpoints for SendGrid/Twilio
- Test connection functionality
- Status endpoint

### Phase 3: Settings UI
- Integrations settings page
- Setup wizard modal
- Documentation/help content

### Phase 4: Multi-Tenant Services
- Refactor email.ts and sms.ts
- Update reminder cron job
- Error handling and invalidation

### Phase 5: Stripe Integration
- Add-on subscription endpoints
- Webhook handling
- Billing page updates

### Phase 6: Signup Flow
- Add-on selection during registration
- Checkout integration
- Onboarding checklist

### Phase 7: Add-Ons Page
- Dedicated page for add-on discovery
- Marketing and upsell prompts

### Phase 8: Monitoring
- Health check cron job
- Dashboard alerts
- Metrics and logging

---

## Test Messages

**SendGrid test:**
> "This is a test email from Peacase. Your SendGrid integration is working!"

**Twilio test:**
> "Peacase: Your Twilio SMS integration is working!"

---

## Environment Variables

```env
# Encryption
ENCRYPTION_KEY=<32-byte-hex-key>

# Stripe Add-On
STRIPE_MARKETING_ADDON_PRICE_ID=price_xxxxx
```

---

## Success Metrics

- Adoption: % of salons enabling add-on
- Setup completion: % configuring keys within 7 days
- Reliability: <5% reminder failure rate
- Revenue: Additional MRR from add-on subscriptions

---

## Approved Decisions Summary

| Question | Decision |
|----------|----------|
| Who can use? | Any tier, $25/month add-on |
| Where to enable? | Settings, Add-ons page, Signup |
| SendGrid vs Twilio | Both optional, one add-on covers both |
| Keys fail? | Email + Dashboard alert + Keep charging |
| Setup guidance | Full docs + wizard + test buttons |
| Signup flow | Show after plan selection |
| Grace period | 7 days, then keep charging anyway |
| Test messages | Simple "it's working" messages |
| Key storage | Encrypted in Salon table |
| Access control | Owner and Admin roles only |
| What's included | Reminders + Marketing campaigns |
| Other emails | Split (platform vs salon) |
| Without add-on | Completely disabled |
