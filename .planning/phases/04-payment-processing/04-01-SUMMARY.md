---
phase: 04-payment-processing
plan: 01
subsystem: database
tags: [prisma, stripe, webhooks, idempotency, deposits]

# Dependency graph
requires:
  - phase: 03-online-booking-widget
    provides: Transactional booking service with appointment model
provides:
  - WebhookEvent model for idempotent webhook processing
  - Salon deposit configuration fields (depositPercentage, requireDeposit)
  - Appointment payment tracking fields (depositAmount, depositStatus, stripePaymentIntentId)
  - webhookEvents.ts idempotency service
affects: [04-02, 04-03, 04-04, webhooks, payments, deposit-collection]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Insert-or-conflict idempotency pattern using Prisma unique constraint (P2002)
    - Atomic checkAndMarkEventProcessed for race-safe webhook deduplication

key-files:
  created:
    - apps/api/src/services/webhookEvents.ts
  modified:
    - packages/database/prisma/schema.prisma

key-decisions:
  - "WebhookEvent uses stripeEventId as unique constraint for race-safe deduplication"
  - "Deposit fields on Salon (configuration) and Appointment (tracking) follow existing naming conventions"
  - "cancellationPolicy stored as JSON string for flexibility"
  - "All new fields nullable or have defaults - no breaking changes"

patterns-established:
  - "Insert-or-conflict pattern: Try insert, catch P2002 for duplicates"
  - "Idempotency service pattern: checkAndMarkEventProcessed for webhooks"

# Metrics
duration: 8min
completed: 2026-01-25
---

# Phase 04 Plan 01: Payment Schema Foundation Summary

**WebhookEvent model with idempotency service, plus deposit and payment tracking fields on Salon and Appointment models**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-25T20:57:42Z
- **Completed:** 2026-01-25T21:06:02Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments
- WebhookEvent model for tracking processed Stripe webhooks with unique constraint
- webhookEvents.ts idempotency service with checkAndMarkEventProcessed function
- Salon model extended with deposit configuration (depositPercentage, requireDeposit, cancellationPolicy)
- Appointment model extended with payment tracking (depositAmount, depositStatus, stripePaymentIntentId)
- Schema pushed to database and Prisma client regenerated

## Task Commits

Each task was committed atomically:

1. **Task 1: Add WebhookEvent model and update Salon/Appointment models** - `08aa9d9` (feat)
2. **Task 2: Create webhook events idempotency service** - `44c1e30` (feat)
3. **Task 3: Run Prisma migration and generate client** - No commit (runtime operation)

## Files Created/Modified
- `packages/database/prisma/schema.prisma` - Added WebhookEvent model, deposit fields on Salon, payment fields on Appointment
- `apps/api/src/services/webhookEvents.ts` - Idempotency service for race-safe webhook deduplication

## Decisions Made
- **Insert-or-conflict pattern:** Uses Prisma unique constraint violation (P2002) for idempotency rather than SELECT-then-INSERT which has race conditions
- **Separate check function:** Added wasEventProcessed() for debugging without marking
- **JSON cancellationPolicy:** Stored as string for flexible policy rules (timeframes, refund percentages, etc.)
- **All additive changes:** New fields are nullable or have defaults, ensuring no breaking changes to existing data

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Windows file lock on Prisma query engine DLL prevented initial regeneration
- **Resolution:** Deleted locked file and re-ran prisma generate successfully
- This is a common Windows-specific issue, not a code problem

## User Setup Required

None - no external service configuration required. Schema changes are additive and auto-applied.

## Next Phase Readiness
- WebhookEvent model ready for webhook handlers in 04-02
- Salon deposit fields ready for deposit calculation in 04-02
- Appointment payment fields ready for payment intent tracking in 04-02
- Idempotency service ready to import in webhook routes

---
*Phase: 04-payment-processing*
*Completed: 2026-01-25*
