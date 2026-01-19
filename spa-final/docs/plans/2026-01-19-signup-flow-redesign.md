# Signup Flow Redesign

**Date:** 2026-01-19
**Status:** Approved
**Author:** Claude (with Aaron McBride)

---

## Overview

Redesign the Peacase signup flow to be streamlined, functional, and logically connected. The current flow is broken - emails don't send, "Continue to Dashboard" appears prematurely, and the flow doesn't lead into proper onboarding.

## Key Decisions

- **No email verification blocking** - Users get in immediately, verify later
- **No free trial** - Payment required before accessing platform (too much integration effort for trials to be useful)
- **Payment in middle of onboarding** - Get commitment after initial investment, before full setup
- **Optional steps on single screen** - Checklist style, skip all with one click
- **Dashboard only after onboarding complete** - Real data exists before showing dashboard

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  SIGNUP PAGE                                                │
│  Email, Password, Owner Name, Business Name, Type, Phone    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  ONBOARDING WIZARD (Required Steps)                         │
│                                                             │
│  Step 1: Business Info (address, contact details)           │
│  Step 2: Select Plan & Payment (Stripe checkout)            │
│  Step 3: Working Hours                                      │
│  Step 4: Services (add at least one)                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  OPTIONAL SETUP (Single Screen)                             │
│                                                             │
│  ☐ Add Staff Members                                        │
│  ☐ Customize Branding (logo, colors)                        │
│  ☐ Set Up Client Payments                                   │
│  ☐ Configure Notifications                                  │
│                                                             │
│  [Set Up Selected]  or  [Skip All & Go to Dashboard]        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  DASHBOARD                                                  │
│  (Now has real data: business, hours, services)             │
└─────────────────────────────────────────────────────────────┘
```

---

## Signup Page

**URL:** `/signup`

### Fields

| Field | Type | Validation |
|-------|------|------------|
| Owner Name | Text | Required, 2+ chars |
| Email | Email | Required, valid email format |
| Phone | Tel | Required, valid phone |
| Business Name | Text | Required, 2+ chars |
| Business Type | Dropdown | Required, select one |
| Password | Password | Required, 8+ chars |

### Business Type Options

- Salon
- Spa
- Barbershop
- Med Spa
- Nail Salon
- Massage Studio
- Other

### Behavior

1. On submit → Create user + salon in database
2. Set `emailVerified: false` but don't block anything
3. Generate auth tokens immediately
4. Redirect straight to `/onboarding` (step 1)
5. No "check your email" screen

### Design Notes

- Single column form, clean and simple
- Show password strength indicator
- "Already have an account? Log in" link at bottom

---

## Onboarding Wizard - Required Steps

**URL:** `/onboarding`

Progress indicator shows steps 1-4 at top, highlights current step.

### Step 1: Business Info

| Field | Type | Required |
|-------|------|----------|
| Street Address | Text | Yes |
| City | Text | Yes |
| State | Dropdown | Yes |
| ZIP Code | Text | Yes |
| Business Phone | Tel | Pre-filled from signup |
| Business Email | Email | Pre-filled from signup |
| Website | URL | No |

### Step 2: Select Plan & Payment

**Display:**
- Show 2-3 plan tiers with features and pricing
- Monthly/Annual toggle (discount for annual)
- Stripe payment element for card entry
- "You can change plans anytime in Settings"

**Behavior:**
- Create Stripe subscription on submit
- Store subscription status in database
- Cannot proceed without valid payment

### Step 3: Working Hours

**Display:**
- List of days (Mon-Sun)
- Each day: toggle on/off + start/end time pickers
- "Copy to all days" button for efficiency
- Common presets: "9-5 weekdays", "10-7 every day"

### Step 4: Services

**Display:**
- "Add your first service" prompt
- Fields: Name, Duration, Price, Category (optional)
- Quick-add templates based on business type
- Must add at least 1 service to proceed

**Behavior:**
- Can add multiple services
- Shows list of added services with edit/delete

---

## Optional Setup Screen

**URL:** `/onboarding` (step 5)

**Header:** "Want to set up any of these now?"
**Subtext:** "You can always do this later from Settings"

### Checklist

| Option | Description | What it opens |
|--------|-------------|---------------|
| ☐ Add Staff Members | "Add your team and set their schedules" | Staff mini-wizard |
| ☐ Customize Branding | "Upload logo and pick your colors" | Logo upload + color picker |
| ☐ Set Up Client Payments | "Accept cards and online payments" | Stripe Connect onboarding |
| ☐ Configure Notifications | "Email and SMS settings" | Notification preferences |

### Buttons

- **[Set Up Selected]** - Opens each selected option in sequence
- **[Skip All & Go to Dashboard →]** - Goes straight to completion

### Behavior

- Checkboxes default to unchecked
- If user selects items, walk through each one
- Each mini-setup has "Done" / "Skip this one" buttons
- After all selected items complete, go to completion screen

---

## Completion Screen

**URL:** `/onboarding` (final step)

**Display:**
- Success illustration/animation
- "You're all set, [Owner Name]!"
- Quick summary: "Business: [Name] • [X] services • Open [days]"
- **[Go to Dashboard →]** button

**Behavior:**
- Mark onboarding complete: `salon.onboardingComplete = true`
- Redirect to `/dashboard`

---

## Technical Implementation

### Frontend Changes (`apps/web`)

| File | Change |
|------|--------|
| `/signup/page.tsx` | Rewrite with 6 fields, remove verification screen, redirect to `/onboarding` |
| `/onboarding/page.tsx` | Rebuild wizard with new step order, add optional checklist |
| `/verify-email/page.tsx` | Keep but make non-blocking |
| `AuthContext.tsx` | Remove verification checks from protected routes |
| New: `OnboardingGuard.tsx` | Redirect to `/onboarding` if not complete |

### Backend Changes (`apps/api`)

| File | Change |
|------|--------|
| `/routes/auth.ts` | Accept new fields (ownerName, businessType), skip verification email |
| `/routes/onboarding.ts` | New endpoints for each step + completion |
| Prisma schema | Add `businessType` to Salon, `onboardingComplete` boolean |

### Database Schema Changes

```prisma
model Salon {
  // existing fields...
  businessType        String?
  onboardingComplete  Boolean @default(false)
  onboardingStep      Int     @default(1)
}

model User {
  // existing fields...
  // ownerName stored in firstName + lastName
}
```

### New API Endpoints

```
POST /api/v1/onboarding/business-info
POST /api/v1/onboarding/subscription
POST /api/v1/onboarding/working-hours
POST /api/v1/onboarding/services
POST /api/v1/onboarding/optional-setup
POST /api/v1/onboarding/complete
GET  /api/v1/onboarding/status
```

### Key Logic Changes

1. **Remove email verification blocking** - Auth works immediately
2. **Add onboarding guard** - Can't access dashboard until complete
3. **Payment before platform access** - Subscription required at step 2
4. **Track onboarding progress** - Store step for resume capability

---

## Migration Path

1. Update Prisma schema with new fields
2. Run migration
3. Rebuild signup page
4. Rebuild onboarding wizard
5. Add OnboardingGuard to protected routes
6. Update API endpoints
7. Test full flow end-to-end

---

## Success Criteria

- [ ] User can complete signup in under 60 seconds
- [ ] User goes directly from signup to onboarding (no verification screen)
- [ ] Payment is collected before dashboard access
- [ ] User can skip all optional steps with one click
- [ ] Dashboard shows real data on first visit
- [ ] Existing users with incomplete onboarding are prompted to complete it
