---
phase: 03-online-booking-widget
plan: 01
subsystem: api
tags: [prisma, transactions, locking, booking, concurrency]

# Dependency graph
requires:
  - phase: 02-core-data-flows
    provides: Appointment model, public booking endpoint, staff/service/client models
provides:
  - Booking service with transactional guarantees
  - Pessimistic locking for appointment creation
  - P2034 retry logic for write conflicts
  - BookingConflictError for conflict handling
affects: [03-02, 03-03, 04-payment-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Prisma interactive transactions with RepeatableRead isolation
    - SELECT FOR UPDATE SKIP LOCKED for pessimistic locking
    - Exponential backoff retry for P2034 transaction conflicts

key-files:
  created:
    - apps/api/src/services/booking.ts
    - apps/api/src/__tests__/booking-service.test.ts
  modified:
    - apps/api/src/routes/public.ts

key-decisions:
  - "Use RepeatableRead isolation level to prevent phantom reads during booking"
  - "Use FOR UPDATE SKIP LOCKED to fail fast when slot is locked rather than waiting"
  - "5 retry attempts with exponential backoff (100ms base) for P2034 write conflicts"
  - "BookingConflictError is not retryable - throw immediately to client"

patterns-established:
  - "Service module pattern: booking logic extracted to services/booking.ts"
  - "Transaction wrapper: createBookingWithLock encapsulates all atomic operations"
  - "Error class pattern: BookingConflictError with code property for API responses"

# Metrics
duration: 9min
completed: 2026-01-25
---

# Phase 03 Plan 01: Transactional Booking Service Summary

**Pessimistic locking booking service using Prisma RepeatableRead transactions with SELECT FOR UPDATE SKIP LOCKED to prevent double-bookings**

## Performance

- **Duration:** 9 min
- **Started:** 2026-01-25T18:52:18Z
- **Completed:** 2026-01-25T19:01:04Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Created booking service with database-level locking to prevent race conditions
- Refactored public booking endpoint to use atomic transaction-based approach
- Removed duplicate conflict check code (now handled inside transaction)
- Added comprehensive unit tests for retry logic and conflict detection

## Task Commits

Each task was committed atomically:

1. **Task 1: Create booking service with transaction handling** - `cf48f72` (feat)
2. **Task 2: Refactor booking endpoint to use booking service** - `560283d` (refactor)
3. **Task 3: Add unit test for booking service retry logic** - `fe59aa6` (test)

## Files Created/Modified
- `apps/api/src/services/booking.ts` - New booking service with createBookingWithLock function
- `apps/api/src/routes/public.ts` - Refactored POST /:slug/book to use booking service
- `apps/api/src/__tests__/booking-service.test.ts` - Unit tests for booking service (12 tests)

## Decisions Made
- **RepeatableRead isolation level:** Prevents phantom reads where concurrent transactions could both see no conflicts
- **FOR UPDATE SKIP LOCKED:** Immediately returns if rows are locked rather than waiting, enabling fast failure for concurrent requests
- **5 retries with exponential backoff:** Handles transient P2034 write conflicts gracefully with 100ms, 200ms, 400ms, 800ms, 1600ms delays
- **BookingConflictError not retried:** When a conflict is detected (slot actually booked), fail immediately - retrying won't help

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None - implementation proceeded smoothly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Booking service ready for availability endpoint integration (03-02)
- Transaction pattern established for other concurrent operations
- Test infrastructure in place for booking service unit tests

---
*Phase: 03-online-booking-widget*
*Plan: 01*
*Completed: 2026-01-25*
