# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-25)

**Core value:** Every workflow a spa owner needs must work reliably, end-to-end, every time.
**Current focus:** Phase 4 - Payment Processing - IN PROGRESS

## Current Position

Phase: 4 of 7 (Payment Processing)
Plan: 4 of 4 in current phase (04-01, 04-02, 04-03, 04-04 complete)
Status: In progress
Last activity: 2026-01-25 - Completed 04-04-PLAN.md (Refund Flow)

Progress: [██████████] 100% (13/13 plans estimated across all phases)

## Performance Metrics

**Velocity:**
- Total plans completed: 13
- Average duration: 9.3 min
- Total execution time: 2.01 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 02-core-data-flows | 6 | 69min | 11.5min |
| 03-online-booking-widget | 3 | 35min | 11.7min |
| 04-payment-processing | 4 | 17min | 4.25min |

**Recent Trend:**
- Last 7 plans: 02-06 (8min), 03-01 (9min), 03-02 (11min), 03-03 (~15min), 04-01 (8min), 04-02 (3min), 04-03 (3min), 04-04 (3min)
- Trend: Phase 4 completed with accelerated pace

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Stabilization milestone: Focus on owner experience, defer Staff Portal to separate milestone
- Testing approach: Must test from spa owner perspective, not developer perspective
- Data-flow-first principle: Follow data flows end-to-end (auth -> booking -> payments -> reminders)
- **02-01:** Soft delete pattern for staff (isActive: false + email anonymization)
- **02-01:** Replace-on-update pattern for many-to-many relations (services, availability)
- **02-01:** Tenant isolation enforced on all staff operations via salonId filtering
- **02-02:** Use LocationProvider wrapper at app level for universal location context access
- **02-02:** Store selectedLocationId in localStorage for cross-page persistence
- **02-02:** Booking widget uses /public/:slug/availability endpoint separate from authenticated endpoint
- **02-03:** Staff with no location assignments appear at ALL locations (business rule)
- **02-03:** Staff filtering uses assignedStaff + unassignedStaff pattern
- **02-03:** Calendar staff dropdown filters based on selectedLocationId from LocationContext
- **02-04:** GET /locations/:id/services returns ALL services with effective pricing, not just overridden ones
- **02-04:** Services inherit salon-wide settings by default until explicitly overridden at location level
- **02-04:** DELETE removes ServiceLocation record completely, reverting to salon defaults
- **02-05:** Staff can edit own basic profile but not role/commission/status (self-edit with field-level protection)
- **02-05:** Staff can manage own availability schedule (reduces admin burden)
- **02-05:** Service assignment to staff requires admin/owner (prevents privilege escalation)
- **02-05:** Manager role cannot modify service catalog or pricing (structural business decisions remain with admin/owner)
- **02-06:** 4-tier role hierarchy: staff < manager < admin < owner
- **02-06:** canEditStaff() enables self-edit but prevents role changes on own profile
- **03-01:** RepeatableRead isolation level for booking transactions to prevent phantom reads
- **03-01:** FOR UPDATE SKIP LOCKED for pessimistic locking - fail fast rather than wait
- **03-01:** 5 retries with exponential backoff for P2034 transaction write conflicts
- **03-01:** BookingConflictError is not retryable - fail immediately to client
- **03-02:** Buffer time always added to slot duration (durationMinutes + bufferMinutes)
- **03-02:** Alternative slots search same day first, then expand to 7 days
- **03-02:** Alternatives respect staffId constraint if client selected specific staff
- **03-02:** Return up to 3 alternative slots on booking conflict
- **03-03:** 20 concurrent requests in integration tests (enough to catch race conditions)
- **03-03:** Advisory locks (pg_advisory_xact_lock) instead of FOR UPDATE SKIP LOCKED for better Prisma compatibility
- **03-03:** k6 load test with 100 VUs and threshold assertions for CI/CD integration
- **04-01:** WebhookEvent uses stripeEventId as unique constraint for race-safe deduplication
- **04-01:** Insert-or-conflict pattern: Try insert, catch P2002 for duplicates
- **04-01:** Deposit fields on Salon (configuration) and Appointment (tracking) follow existing naming conventions
- **04-01:** cancellationPolicy stored as JSON string for flexibility
- **04-02:** Manual capture pattern: deposits authorized at booking, captured when service rendered
- **04-02:** Appointment lookup via stripePaymentIntentId field (not metadata)
- **04-02:** Idempotency check before webhook processing prevents duplicate charges
- **04-03:** Payment intent flow uses Stripe Elements for PCI compliance
- **04-03:** Public payment endpoints (no auth) for client-side booking widget
- **04-04:** 24-hour cancellation policy: full refund if cancelled >24h in advance
- **04-04:** Salon cancellations always trigger full refund regardless of timing
- **04-04:** Authorized payments cancelled (not refunded), captured payments refunded
- **04-04:** Refund failures don't block appointment cancellation (log error, continue)

### Pending Todos

None yet.

### Blockers/Concerns

**Known Issues (from PROJECT.md):**
- Online booking unreliable (works sometimes, fails sometimes) - **RESOLVED in Phase 3**
- SMS notifications not working - **Phase 5 target**
- Email reminders may not be connected - **Phase 5 target**
- Settings changes may not persist or apply - **Phase 6 target**
- Multi-location support untested - **RESOLVED in Phase 2**

**Minor issues (non-blocking):**
- Authenticated availability endpoint uses hardcoded 9-5 hours instead of location hours
- Missing validation: closeTime > openTime when saving location hours
- Booking widget input fields have white text on white background - **FIXED in 04-05**

**Research Gaps:**
- Phase 3: Transaction isolation levels and locking strategies - **RESOLVED in 03-01**
- Phase 4: Need Stripe webhook best practices and testing patterns
- Phase 5: Need email deliverability configuration (SPF/DKIM/DMARC)
- Phase 7: Need timezone handling library comparison

## Phase 3 Verification Summary

**Status:** COMPLETE (all plans executed and verified)
**Report:** Manual verification during 03-03 checkpoint

Phase 3 accomplishments:
1. Transactional booking service with pessimistic locking (03-01)
2. Availability service with buffer time and alternative slots (03-02)
3. Concurrent booking tests verifying 0% double-bookings (03-03)
4. k6 load test script ready for CI/CD integration

## Phase 2 Verification Summary

**Status:** PASSED (6/6 must-haves verified)
**Report:** .planning/phases/02-core-data-flows/02-VERIFICATION.md

All success criteria verified against actual codebase:
1. Owner can add, edit, and remove staff members without errors
2. Staff assignments to locations persist and display correctly in scheduling
3. Staff permissions apply correctly based on role (staff vs manager vs owner)
4. Owner can switch between locations and see correct location-specific data
5. Appointments, staff, and services filtered correctly by selected location
6. Location-specific settings (hours, services) apply only to that location

## Session Continuity

Last session: 2026-01-25T22:15:25Z
Stopped at: Completed 04-04-PLAN.md - Refund Flow
Resume file: None

**Phase 4 Status:** COMPLETE (verified by human testing)
- 04-01: Payment Schema Foundation - COMPLETE
- 04-02: Deposit Collection Flow - COMPLETE
- 04-03: Stripe Webhook Handler - COMPLETE
- 04-04: Refund Flow - COMPLETE
- 04-05: End-to-End Payment Integration - COMPLETE

**Phase 3 Status:** COMPLETE
- 03-01: Transactional booking service - COMPLETE
- 03-02: Availability endpoint improvements - COMPLETE
- 03-03: Concurrent booking tests - COMPLETE

**Phase 2 Status:** COMPLETE
- 02-01: Staff CRUD operations
- 02-02: Location switching and management
- 02-03: Staff-location assignment and filtering
- 02-04: Location-specific service settings
- 02-05: API route permissions audit (RBAC Part 1)
- 02-06: Frontend permission gating (RBAC Part 2)

---
*State initialized: 2026-01-25*
*Last updated: 2026-01-25T22:15:25Z*
