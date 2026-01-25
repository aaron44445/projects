---
phase: 04-payment-processing
plan: 04
subsystem: payments
tags: [stripe, refunds, cancellation-policy, payment-capture]

# Dependency graph
requires:
  - phase: 04-02
    provides: Payment service with manual capture deposit flow
provides:
  - Refund helper module with time-based policy enforcement
  - Appointment cancellation with automatic refund processing
  - Payment capture endpoint for completing authorized deposits
affects: [04-04, online-booking, appointment-management]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Time-based refund policy (24h threshold)"
    - "Authorization cancellation vs refund based on capture status"
    - "Graceful refund failure handling (log but don't block cancellation)"

key-files:
  created:
    - apps/api/src/lib/refundHelper.ts
  modified:
    - apps/api/src/routes/appointments.ts

key-decisions:
  - "24-hour cancellation policy: full refund if cancelled >24h in advance"
  - "Salon cancellations always trigger full refund regardless of timing"
  - "Authorized (uncaptured) payments are cancelled, captured payments are refunded"
  - "Late cancellations marked requiresManualReview for business decision"
  - "Refund failures don't block appointment cancellation (log error, continue)"

patterns-established:
  - "Refund policy logic centralized in refundHelper, not in route handlers"
  - "Deposit status tracking: authorized -> captured/cancelled/refunded/no_refund"
  - "Payment record updates synchronize with appointment status changes"

# Metrics
duration: 3min
completed: 2026-01-25
---

# Phase 04 Plan 04: Refund Flow Summary

**Time-based refund policy with automatic processing for cancellations, distinguishing authorization cancellation from captured payment refunds**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-25T22:12:17Z
- **Completed:** 2026-01-25T22:15:25Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments
- Refund helper implements 24-hour cancellation policy with automatic refund decisions
- Appointment cancel endpoint processes refunds based on cancelledBy parameter
- Capture payment endpoint enables finalizing authorized deposits after service completion
- Authorized payments cancelled (no charge), captured payments refunded (money returned)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create refund helper with policy logic** - `27abf1f` (feat)
2. **Task 2: Integrate refund processing into cancel endpoint** - `b0673b2` (feat)
3. **Task 3: Add capture payment endpoint** - `f7e8a85` (feat)

## Files Created/Modified
- `apps/api/src/lib/refundHelper.ts` - Refund policy logic and Stripe refund/cancellation processing
- `apps/api/src/routes/appointments.ts` - Cancel endpoint with refund integration, capture payment endpoint

## Decisions Made

1. **24-hour refund threshold**: Business policy requires 24h notice for automatic refund
   - Configurable via DEFAULT_POLICY constant for future flexibility

2. **Salon vs client cancellation**: Salon cancellations always refund (fault attribution)
   - Client cancellations evaluated against time-based policy

3. **Cancel vs refund logic**: Check depositStatus to determine if payment was captured
   - authorized -> cancel payment intent (no charge occurred)
   - captured -> issue refund (money already collected)

4. **Graceful failure handling**: Refund errors logged but don't block appointment cancellation
   - Business decision: appointment status change more critical than payment reversal
   - Allows manual resolution of payment issues without preventing cancellation

5. **Manual review flag**: Late cancellations marked requiresManualReview: true
   - Enables business owner to make case-by-case refund decisions

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed successfully on first attempt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Refund flow complete and ready for testing:
- Webhook handler (04-03) updates deposit status on payment events
- Refund helper uses that status to choose cancel vs refund
- Cancel endpoint exposes cancelledBy parameter for policy enforcement
- Capture endpoint enables completing authorized payments

Testing readiness:
- Need Stripe test mode for end-to-end refund flow verification
- Should test both cancel (authorized) and refund (captured) paths
- Should verify 24h policy calculation with various appointment times

---
*Phase: 04-payment-processing*
*Completed: 2026-01-25*
