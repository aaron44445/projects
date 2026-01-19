# Peacase Platform Audit - January 19, 2026

## Executive Summary

Comprehensive audit of all Peacase platform features. Found **12 critical issues** that need fixing for the platform to be fully functional for clients.

---

## Feature-by-Feature Breakdown

### 1. Online Booking Widget

**Status:** Working (behind paywall)

**How it works:**
- Salon owners get an embed code: `<script src="https://peacase.com/book.js" data-salon="slug">`
- Widget creates a "Book Now" button that opens a modal
- Modal shows 5-step booking flow: Service > Staff > Date/Time > Details > Confirmation
- API endpoints at `/api/v1/public/:slug/*` handle data fetching and booking

**How clients use it:**
- Enable the Online Booking add-on ($25/mo) in Settings > Subscription
- Go to Settings > Online Booking to get embed code
- Copy code to website (WordPress, Squarespace, etc.)
- Customize button text, color, and position

**Issue Found:**
- Settings shows "locked" state until add-on is enabled - this is working as designed

**Status: WORKING**

---

### 2. Gift Cards

**Status:** PARTIALLY BROKEN

**How it works:**
- Admin creates gift cards with amount, recipient info
- Codes are generated (format: XXXX-XXXX-XXXX-XXXX)
- Can email to recipient or print physical card
- Redeem at checkout by entering code
- Balance tracked, partial redemptions supported

**How clients should use it:**
- Share URL shows `https://yoursite.com/your-salon/gift-cards`
- Clients visit page, select amount, pay via Stripe
- Webhook creates gift card and emails recipient

**CRITICAL BUGS:**
1. **No public gift card purchase page exists** - The share URL `/${salonSlug}/gift-cards` leads to a 404
2. Checkout API endpoint exists (`/api/v1/gift-cards/checkout`) but no frontend uses it
3. "Resend email" button doesn't actually send email (just shows success toast)

**Admin side works:** Creating, viewing, redeeming, printing, checking balance

**Priority: HIGH - Need to create public gift card purchase page**

---

### 3. Packages & Memberships

**Status:** PARTIALLY FUNCTIONAL

**How it works:**
- **Packages:** One-time purchase, set number of services, validity period (e.g., 5 haircuts for $200, valid 6 months)
- **Memberships:** Monthly recurring, services per month (e.g., VIP Monthly - 2 services/month for $99)
- Track services remaining per client
- Can pause/resume memberships

**How clients should use it:**
- Create packages/memberships in Packages page
- Assign to clients manually OR clients purchase via public page

**ISSUES:**
1. **No public purchase page for packages** - Clients can't buy online
2. **Membership recurring billing not implemented** - No Stripe subscription creation
3. Package services aren't being linked properly when creating packages (services are just names, not actual Service records)

**Admin side works:** Creating, editing, viewing, pausing memberships

**Priority: MEDIUM - Need public purchase flow and Stripe subscriptions for memberships**

---

### 4. Marketing Automation

**Status:** MOSTLY UI ONLY

**How it works:**
- Create email/SMS campaigns with audience targeting (all, new, inactive, VIP clients)
- Set up automations (welcome, birthday, re-engagement, review request, post-visit)
- Track open rates and campaign performance

**How clients should use it:**
- Go to Marketing page
- Create campaign with message and audience
- Send immediately or schedule
- View analytics

**ISSUES:**
1. **Automations don't actually run** - They're stored but no cron job processes them
2. **Birthday automation not implemented** - No cron job to check birthdays
3. **Email sending depends on SendGrid config** - May silently fail if not configured
4. Campaign "sent" count doesn't update after sending (shows as draft)

**Priority: MEDIUM - Need automation processing cron jobs**

---

### 5. Reviews

**Status:** PARTIALLY FUNCTIONAL

**How it works:**
- Reviews collected after appointments
- Admin can approve/respond to reviews
- Display approved reviews on booking page

**How clients should use it:**
- Reviews appear in Reviews page
- Approve to publish, respond to engage
- "Request Reviews" sends to recent clients

**ISSUES:**
1. **"Request Reviews" button doesn't do anything** - Just shows success toast
2. **No automatic review request after appointments** - Manual only
3. **No public review submission page** - Clients can't leave reviews online
4. Review request email not implemented

**Priority: MEDIUM - Need review request emails and public review page**

---

### 6. Payment Processing

**Status:** WORKING (requires configuration)

**How it works:**
- Stripe integration for all payments
- Payment intents for one-time charges
- Checkout sessions for gift cards and packages
- Webhooks handle payment completion

**How clients should use it:**
- Connect Stripe in Settings > Payments
- All checkouts go through Stripe
- Refunds handled via API

**REQUIREMENTS:**
- `STRIPE_SECRET_KEY` must be set
- `STRIPE_WEBHOOK_SECRET` must be set
- Stripe account must be connected

**Status: WORKING if configured**

---

### 7. Notifications & Reminders

**Status:** WORKING

**How it works:**
- Appointment reminders sent via email/SMS
- Cron job runs every 15 minutes
- Checks for appointments 24h and 2h away
- Sends reminder if not already sent

**How clients should use it:**
- Configure in Settings > Notifications
- Choose 24h or 48h reminder timing
- Customize message templates

**ISSUES:**
1. **Birthday reminders not implemented** - No cron job
2. SMS requires Twilio configuration
3. Email requires SendGrid configuration

**Status: WORKING for appointment reminders**

---

### 8. Reports & Analytics

**Status:** FULLY WORKING

**How it works:**
- Dashboard shows overview stats
- Detailed reports: Revenue, Services, Staff, Clients
- Date range filtering (presets and custom)
- Export to CSV

**How clients should use it:**
- Go to Reports page
- Select date range
- View charts and tables
- Export for accounting

**Status: WORKING**

---

### 9. Calendar & Appointments

**Status:** FULLY WORKING

**How it works:**
- Week and day views
- Staff color-coded
- Create/edit/cancel appointments
- Mark complete, no-show, cancel
- Filter by staff and search

**How clients should use it:**
- Calendar is the main hub
- Click to create appointment
- Drag to reschedule (not implemented)
- View all staff schedules

**Status: WORKING**

---

### 10. Staff Management

**Status:** WORKING

**How it works:**
- Add staff members with contact info
- Set availability schedule
- Assign services to staff
- View staff appointments

**How clients should use it:**
- Go to Staff page
- Add team members
- Set their schedules
- Assign which services they can perform

**Status: WORKING**

---

### 11. Client Management

**Status:** WORKING

**How it works:**
- Client database with contact info
- View appointment history
- Package/membership tracking
- Notes and preferences

**How clients should use it:**
- Go to Clients page
- Add new clients
- View client profiles
- Track their history

**Status: WORKING**

---

### 12. Settings Page

**Status:** MOSTLY WORKING

**How it works:**
- Multiple tabs: Business, Hours, Payments, Notifications, Booking, Branding, Subscription

**ISSUES:**
1. Some tab links in SubscriptionContext point to non-existent routes
2. Booking settings were minimal - now enhanced with embed code

**Status: WORKING with minor issues**

---

## Priority Action List

### CRITICAL (Blocking core functionality)

| # | Issue | Feature | Fix Required |
|---|-------|---------|--------------|
| 1 | No public gift card purchase page | Gift Cards | Create `/[slug]/gift-cards` page with Stripe checkout |
| 2 | No public review submission page | Reviews | Create `/[slug]/review` page |

### HIGH (Significant functionality gaps)

| # | Issue | Feature | Fix Required |
|---|-------|---------|--------------|
| 3 | Membership recurring billing not implemented | Packages | Add Stripe subscription creation for memberships |
| 4 | Review request emails don't work | Reviews | Implement review request email service |
| 5 | Marketing automations don't process | Marketing | Add cron job to process automation triggers |

### MEDIUM (Missing but workarounds exist)

| # | Issue | Feature | Fix Required |
|---|-------|---------|--------------|
| 6 | No public package purchase page | Packages | Create `/[slug]/packages` page |
| 7 | Birthday automation not implemented | Marketing | Add birthday cron job |
| 8 | "Resend email" for gift cards doesn't work | Gift Cards | Implement actual email resend |
| 9 | Package services not linked to real Services | Packages | Fix service linking in package creation |

### LOW (Nice to have)

| # | Issue | Feature | Fix Required |
|---|-------|---------|--------------|
| 10 | Campaign analytics don't update | Marketing | Track and update open rates |
| 11 | No drag-to-reschedule in calendar | Calendar | Add drag-drop functionality |
| 12 | Some settings tab URLs incorrect | Settings | Fix helpUrl paths in SubscriptionContext |

---

## Environment Requirements

For full functionality, these environment variables must be configured:

### API (.env)
```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
JWT_SECRET=...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SENDGRID_API_KEY=SG....
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
```

### Frontend (.env)
```
NEXT_PUBLIC_API_URL=https://api.peacase.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## Recommended Implementation Order

1. **Week 1:** Fix critical gift card and review public pages
2. **Week 2:** Implement membership recurring billing
3. **Week 3:** Marketing automation processing
4. **Week 4:** Polish and minor fixes

---

## Files That Need Changes

### New Files to Create
- `apps/web/src/app/[slug]/gift-cards/page.tsx` - Public gift card purchase
- `apps/web/src/app/[slug]/review/page.tsx` - Public review submission
- `apps/web/src/app/[slug]/packages/page.tsx` - Public package purchase
- `apps/api/src/cron/marketingAutomations.ts` - Automation processing
- `apps/api/src/cron/birthdayReminders.ts` - Birthday automation

### Files to Modify
- `apps/api/src/routes/packages.ts` - Add Stripe subscription for memberships
- `apps/api/src/services/email.ts` - Add review request email template
- `apps/api/src/cron/index.ts` - Register new cron jobs
- `apps/web/src/contexts/SubscriptionContext.tsx` - Fix helpUrl paths
