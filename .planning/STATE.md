# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-25)

**Core value:** Every workflow a spa owner needs must work reliably, end-to-end, every time.
**Current focus:** Phase 8 - Register Missing Routers - COMPLETE

## Current Position

Phase: 8 of 9 (Register Missing Routers - Gap Closure)
Plan: 1 of 1 (08-01-PLAN.md)
Status: Phase complete
Last activity: 2026-01-28 - Completed 08-01-PLAN.md (Register Missing Routers)

Progress: [████████████████████] 100% (27/27 plans completed across all phases)

## Performance Metrics

**Velocity:**
- Total plans completed: 25
- Average duration: 7.3 min
- Total execution time: 3.15 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 02-core-data-flows | 6 | 69min | 11.5min |
| 03-online-booking-widget | 3 | 35min | 11.7min |
| 04-payment-processing | 4 | 17min | 4.25min |
| 05-notification-system | 5 | 31min | 6.2min |
| 06-settings-persistence | 3 | 18min | 6.0min |
| 07-dashboard-validation | 4 | 22min | 5.5min |
| 08-register-missing-routers | 1 | 3min | 3.0min |

**Recent Trend:**
- Last 8 plans: 06-04 (6min), 07-01 (4min), 07-02 (4min), 07-03 (7min), 07-04 (7min), 07-05 (5min), 08-01 (3min)
- Trend: Consistent execution (3-7min for gap closure)

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
- **05-01:** NotificationLog tracks both email and SMS status separately for delivery analysis
- **05-01:** SMS failure triggers email fallback if email is available and not already attempted
- **05-01:** Notification service never throws - always logs failures and returns result
- **05-01:** Status is 'sent' if at least one channel succeeds, 'failed' if all channels fail
- **05-02:** Webhook endpoints respond immediately with 200 OK before processing to avoid retries
- **05-02:** SMS service returns SendSmsResult with messageSid for tracking instead of boolean
- **05-02:** Twilio status callbacks update NotificationLog via twilioMessageSid matching
- **05-02:** Status callback URLs use API_URL env var or fallback to production URL
- **05-04:** NotificationSettings interface matches between salon.ts and appointmentReminders.ts for consistency
- **05-04:** ReminderType changed from enum to string to support dynamic timing values
- **05-04:** Default settings provide backward compatibility (24h and 2h reminders)
- **05-04:** Timing validation limits to 1-168 hours (1 week max)
- **05-04:** Only owner/admin roles can modify notification settings for security
- **05-04:** Salons without notification_settings JSON use sensible defaults
- **05-06:** Calendar fields pattern: pass startTime, endTime, salonTimezone, salonEmail to appointmentConfirmationEmail
- **05-06:** Calculate endTime from startTime + service durationMinutes at call site
- **05-06:** Fetch salon timezone and email fields for calendar event generation
- **05-07:** Auto-save pattern for settings: onChange immediately triggers API update (no explicit Save button)
- **05-07:** Console logging for save feedback instead of toast library (no toast library installed)
- **06-01:** Save button pattern for business hours (explicit save vs auto-save for structural changes)
- **06-01:** editingHours local state pattern: separate in-progress edits from API data
- **06-01:** Display format helpers in hooks: getDisplayHours() and setDisplayHours() convert between API and UI formats
- **06-03:** Lazy state initialization pattern for localStorage: useState(() => localStorage.getItem(...))
- **06-03:** Initialize state from localStorage before useEffect runs to avoid race conditions
- **06-03:** Belt-and-suspenders approach: lazy init + double-check in fetchLocations
- **06-04:** Optional parameter pattern for fetch functions: add param, conditionally append to URL
- **06-04:** Booking widget passes locationId to availability API for location-aware slot generation
- **07-01:** getTodayBoundariesInTimezone helper using Intl.DateTimeFormat for DST-safe timezone conversion
- **07-01:** Default to 'UTC' if salon.timezone is null/undefined
- **07-01:** Net revenue = totalAmount - refundAmount for accurate dashboard metrics
- **07-01:** Appointment counts exclude both 'cancelled' and 'no_show' status
- **07-02:** QueryClient created with useState for SSR-safe state isolation
- **07-02:** refetchIntervalInBackground: true keeps dashboard fresh in background tabs
- **07-02:** staleTime: 30000 shows cached data immediately (stale-while-revalidate)
- **07-02:** isFetching exposed for subtle background refresh indicators
- **07-03:** Three independent useQuery calls for stats, appointments, activity (partial failures)
- **07-03:** formatError() converts technical errors to user-friendly messages
- **07-03:** Per-section error states and retry buttons for graceful degradation
- **07-04:** Timezone flows from API -> hook -> page (single source of truth)
- **07-04:** Default to UTC if salon timezone not configured
- **07-04:** toLocaleTimeString with timeZone option for timezone conversion
- **07-05:** Use Intl.DateTimeFormat.formatToParts() with Date.UTC() for DST-safe timezone offset calculation
- **07-05:** Inline TanStack Query refetchInterval options directly into useQuery calls (not spread from shared object)
- **08-01:** Maintain parity between app.ts (dev) and index.ts (prod) entry points
- **08-01:** Group routers by functional area with comments for organization

### Pending Todos

None yet.

### Blockers/Concerns

**Known Issues (from PROJECT.md):**
- Online booking unreliable (works sometimes, fails sometimes) - **RESOLVED in Phase 3**
- SMS notifications not working - **Phase 5 target**
- Email reminders may not be connected - **Phase 5 target**
- Settings changes may not persist or apply - **RESOLVED in 05-07 (notification settings now persist)**
- Multi-location support untested - **RESOLVED in Phase 2**

**Minor issues (non-blocking):**
- Authenticated availability endpoint uses hardcoded 9-5 hours instead of location hours
- Missing validation: closeTime > openTime when saving location hours
- Booking widget input fields have white text on white background - **FIXED in 04-05**

**Research Gaps:**
- Phase 3: Transaction isolation levels and locking strategies - **RESOLVED in 03-01**
- Phase 4: Need Stripe webhook best practices and testing patterns
- Phase 5: Need email deliverability configuration (SPF/DKIM/DMARC)
- Phase 7: Need timezone handling library comparison - **RESOLVED in 07-01 (used native Intl.DateTimeFormat)**

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

Last session: 2026-01-28T03:47:00Z
Stopped at: Completed 08-01-PLAN.md - Register Missing Routers
Resume file: None

**Phase 8 Status:** COMPLETE
- 08-01: Register Missing Routers - COMPLETE

**Phase 7 Status:** COMPLETE - VERIFIED
- 07-01: Dashboard API Validation - COMPLETE
- 07-02: Dashboard Auto-Refresh - COMPLETE
- 07-03: Partial Error States - COMPLETE
- 07-04: Timezone Display - COMPLETE
- 07-05: End-to-End Verification - COMPLETE (with gap closure)

**Phase 7 Gap Closure (from 07-05 verification):**
1. Timezone calculation bug - **FIXED** - Used Intl.DateTimeFormat.formatToParts() with Date.UTC()
2. Auto-refresh not working - **FIXED** - Inlined refetchInterval options into each useQuery call

**Phase 6 Status:** COMPLETE - GAP CLOSURE VERIFIED
- 06-01: Wire Business Hours to API - COMPLETE
- 06-02: Verify Settings Persistence - GAPS FOUND
- 06-03: Fix Location Context Race Condition - COMPLETE
- 06-04: Fix Booking Widget LocationId - COMPLETE

**Phase 6 Gaps (from 06-02 verification):**
1. Location context race condition - **FIXED in 06-03** - Lazy state initialization eliminates race
2. Booking widget missing locationId - **FIXED in 06-04** - fetchAvailability now passes locationId to API, respects location hours

**Phase 5 Status:** AWAITING UAT RE-TEST
- 05-01: Notification Foundation - COMPLETE
- 05-02: SMS Status Webhooks - COMPLETE
- 05-03: Calendar Integration - COMPLETE (via 05-06 gap closure)
- 05-04: Configurable Reminder Timing - COMPLETE
- 05-05: Notification History - COMPLETE
- 05-06: Calendar Links in Confirmation Emails - COMPLETE (gap closure)
- 05-07: Wire Notification Settings to API - COMPLETE (gap closure)

**Verification Status:** 3/5 verified, 2 awaiting UAT re-test (Test 2 + Test 5)
**Report:** .planning/phases/05-notification-system/05-VERIFICATION.md

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
*Last updated: 2026-01-28T03:47:00Z*
