---
milestone: v1-stabilization
audited: 2026-01-28T03:07:13Z
status: gaps_found
scores:
  requirements: 18/24
  phases: 6/7
  integration: 23/24
  flows: 4/5
gaps:
  requirements:
    - AUTH-01: Multi-tenant isolation (Phase 1 not executed)
    - AUTH-02: Session persistence (Phase 1 not executed)
    - AUTH-03: Token refresh (Phase 1 not executed)
    - NOTF-03: Notification history (partial - route not registered in production)
  integration:
    - notificationsRouter not registered in production index.ts
    - accountRouter missing from production index.ts
    - teamRouter missing from production index.ts
  flows:
    - "Owner Daily Operations: View notifications history broken (404)"
tech_debt:
  - phase: 03-online-booking
    items:
      - "UI: Booking widget input fields have white text on white background"
  - phase: 05-notification-system
    items:
      - "Cron reminders use direct sendEmail/sendSms instead of sendNotification (no NotificationLog)"
      - "TODO in webhooks.ts: phoneBounced field not implemented in DB"
      - "UAT re-test needed for calendar links in confirmation emails"
      - "UAT re-test needed for notification settings persistence"
---

# Milestone Audit: v1 Stabilization

**Audited:** 2026-01-28T03:07:13Z
**Status:** GAPS FOUND
**Overall Score:** 18/24 requirements satisfied

## Executive Summary

The stabilization milestone is **largely complete** with 6 of 7 phases executed and verified. However, critical gaps remain:

1. **Phase 1 (Authentication & Tenant Isolation) was never executed** - 3 requirements blocked
2. **Notifications router missing from production** - breaks notification history page
3. **Phase 5 awaiting UAT re-test** for 2 closed gaps

## Phase Status Summary

| Phase | Status | Verification | Plans |
|-------|--------|--------------|-------|
| 1. Authentication & Tenant Isolation | **NOT STARTED** | No | 0/0 |
| 2. Core Data Flows | PASSED | Yes | 6/6 |
| 3. Online Booking Widget | PASSED | Yes | 3/3 |
| 4. Payment Processing | COMPLETE (no verification) | No | 5/5 |
| 5. Notification System | GAPS FOUND | Yes | 7/7 |
| 6. Settings Persistence | PASSED | Yes | 4/4 |
| 7. Dashboard & Validation | PASSED | Yes | 5/5 |

## Requirements Coverage

### Satisfied (18/24)

| Requirement | Phase | Evidence |
|-------------|-------|----------|
| BOOK-01: Reliable booking flow | Phase 3 | createBookingWithLock with advisory locks, Serializable isolation |
| BOOK-02: Double-booking prevention | Phase 3 | Integration tests verify 20 concurrent requests → 1 success |
| BOOK-03: Accurate availability | Phase 3 | Buffer time, hours, staff availability all checked |
| STAFF-01: Add/edit staff | Phase 2 | CRUD routes with authorization verified |
| STAFF-02: Staff scheduling | Phase 2 | StaffLocation assignments and filtering work |
| STAFF-03: Staff permissions | Phase 2 | RBAC on API + frontend, self-edit restrictions |
| LOC-01: Location switching | Phase 2 | LocationSwitcher + localStorage verified |
| LOC-02: Location-specific data | Phase 2 | Filtering by locationId throughout |
| LOC-03: Location settings | Phase 2 | LocationHours and ServiceLocation functional |
| PAY-01: Payment processing | Phase 4 | Stripe integration, test cards work |
| PAY-02: Webhook handling | Phase 4 | Idempotent webhook processing |
| PAY-03: Refund flow | Phase 4 | Time-based policy, cancel triggers refund |
| SET-01: Settings apply immediately | Phase 6 | No caching, fresh DB queries |
| SET-02: Hours affect availability | Phase 6 | Booking widget passes locationId, respects hours |
| SET-03: Pricing updates reflect | Phase 6 | PUT endpoint + public services apply priceOverride |
| DASH-01: Accurate statistics | Phase 7 | Database counts with proper filters |
| DASH-02: Timezone-aware display | Phase 7 | Salon timezone flows through entire stack |
| DASH-03: Revenue with refunds | Phase 7 | Net calculation: gross - refunds |
| NOTF-01: SMS delivery tracking | Phase 5 | Twilio webhook updates NotificationLog |
| NOTF-02: Email reminders | Phase 5 | Cron job with configurable timing |

### Unsatisfied (6/24)

| Requirement | Phase | Reason |
|-------------|-------|--------|
| **AUTH-01**: Multi-tenant isolation | Phase 1 | **Phase not executed** |
| **AUTH-02**: Session persistence | Phase 1 | **Phase not executed** |
| **AUTH-03**: Token refresh | Phase 1 | **Phase not executed** |
| **NOTF-03**: Notification history | Phase 5 | Route not registered in production `index.ts` |

## Critical Integration Gaps

### 1. Notifications Router Not Registered (CRITICAL)

**Impact:** Notification history page returns 404 in production

**Location:** `apps/api/src/index.ts`

**Issue:** The `notificationsRouter` is imported and registered in `app.ts` but NOT in `index.ts`, which is the production entry point.

**Evidence:**
- `app.ts` line 34: `import { notificationsRouter }`
- `app.ts` line 110: `app.use('/api/v1/notifications', notificationsRouter)`
- `index.ts`: MISSING both import and route registration

**Fix:** Add to `apps/api/src/index.ts`:
```typescript
import { notificationsRouter } from './routes/notifications.js';
// After other routers:
app.use('/api/v1/notifications', notificationsRouter);
```

### 2. Additional Missing Routers (MEDIUM)

Also missing from `index.ts` but present in `app.ts`:
- `accountRouter`
- `teamRouter`
- `ownerNotificationsRouter`
- `integrationsRouter`

## E2E Flow Verification

### Flow 1: New Salon Onboarding - COMPLETE
User signup → business creation → location setup → staff add → service creation → business hours → first booking

All steps verified through code tracing.

### Flow 2: Client Booking - COMPLETE
Widget loads → select location → select service → select staff → select time → enter details → payment (if required) → confirmation → notification sent → appears on dashboard

All steps verified. Payment integration properly passes `stripePaymentIntentId` to booking endpoint.

### Flow 3: Owner Daily Operations - **BROKEN**
Login → dashboard ✓ → **notifications history FAILS (404)** → stats ✓ → switch locations ✓

**Breaking point:** `useNotifications` hook calls `/api/v1/notifications` which returns 404 because router not registered.

### Flow 4: Settings Change - COMPLETE
Change hours → save → widget shows new availability → book during new hours → appointment created

LocationId properly threaded through entire flow.

### Flow 5: Payment + Refund - COMPLETE
Book with deposit → payment processes → cancel → refund initiated → webhook updates → revenue adjusted

Dashboard stats properly subtract refunds from gross revenue.

## Tech Debt Summary

### Phase 3: Online Booking Widget
- **UI Issue:** Booking widget input fields have white text on white background (functional but invisible text)

### Phase 5: Notification System
- **Architecture:** Cron reminders use direct `sendEmail`/`sendSms` instead of `sendNotification` service
  - Impact: Reminders work but don't appear in notification history
- **TODO:** `phoneBounced` field mentioned in webhooks.ts not implemented in DB
- **UAT Pending:** Calendar links in confirmation emails need human verification
- **UAT Pending:** Notification settings persistence needs human verification

## Anti-Patterns Found

| Phase | File | Pattern | Severity |
|-------|------|---------|----------|
| 5 | appointmentReminders.ts | Direct email/SMS instead of notification service | Warning |
| 5 | webhooks.ts | TODO comment for phoneBounced | Info |

## Unverified Phase

### Phase 4: Payment Processing

Phase 4 has 5/5 plans executed with summaries but no formal VERIFICATION.md file. Human testing was performed during 04-05 execution (per summary), but no aggregated verification exists.

**Evidence from 04-05-SUMMARY.md:**
- [x] Payment step appears when salon requires deposits
- [x] Test card 4242... processes successfully
- [x] Confirmation screen appears after payment
- [x] Non-deposit flow still works

## Recommendations

### Must Fix Before Completion

1. **Execute Phase 1** - Authentication and tenant isolation requirements are unverified
2. **Register notificationsRouter** in production `index.ts` - critical for NOTF-03

### Should Fix

3. **Sync app.ts and index.ts** - Multiple routers missing from production
4. **Complete UAT re-tests** for Phase 5 closed gaps
5. **Create Phase 4 verification** - document the human testing formally

### Can Defer

6. **Migrate cron to sendNotification** - reminders work, just not in history
7. **Fix booking widget text visibility** - functional, just ugly
8. **Add phoneBounced DB field** - logged only, not blocking

## Milestone Status

**CANNOT COMPLETE** - Critical gaps block milestone completion:

1. Phase 1 has 0 requirements satisfied (3 blocked)
2. Integration gap breaks notification history (1 partial)

**Requirements coverage:** 18/24 (75%)
**Target for completion:** 24/24 (100%)

---

*Audited: 2026-01-28T03:07:13Z*
*Auditor: Claude (gsd-integration-checker + orchestrator)*
