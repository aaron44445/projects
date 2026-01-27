---
phase: 06-settings-persistence
plan: 04
subsystem: ui
tags: [booking-widget, react, typescript, availability-api, location-context]

# Dependency graph
requires:
  - phase: 06-01
    provides: useLocationHours hook and API integration for location-specific hours
  - phase: 02-02
    provides: LocationContext and booking widget foundation
provides:
  - Booking widget passes locationId to availability API
  - Location-specific business hours respected in booking flow
  - Gap closure: settings changes now affect booking widget time slots
affects: [future booking features, multi-location workflows]

# Tech tracking
tech-stack:
  added: []
  patterns: [parameter threading pattern for optional IDs in fetch functions]

key-files:
  created: []
  modified:
    - apps/web/src/app/embed/[slug]/page.tsx

key-decisions:
  - "fetchAvailability function accepts optional locationId parameter"
  - "Pass booking.locationId through to availability API for location-aware slot generation"
  - "Booking widget now respects location-specific hours configured in Settings"

patterns-established:
  - "Optional parameter pattern: add locationId? param, conditionally append to URL"

# Metrics
duration: 6min
completed: 2026-01-27
---

# Phase 6 Plan 4: Fix Booking Widget LocationId Summary

**Booking widget now passes locationId to availability API, ensuring location-specific business hours affect time slot generation**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-27T19:56:04Z
- **Completed:** 2026-01-27T20:02:13Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Added locationId parameter to fetchAvailability function
- Updated URL building to include locationId query parameter
- Modified call site to pass booking.locationId from user selection
- Closed Gap 2 from 06-02 verification: booking widget respects location hours

## Task Commits

Each task was committed atomically:

1. **Task 1: Add locationId parameter to fetchAvailability function** - `fdabc02` (fix)
   - Note: Committed as part of 06-03 execution which addressed both gaps

**Plan metadata:** (pending - to be created at summary completion)

## Files Created/Modified
- `apps/web/src/app/embed/[slug]/page.tsx` - Added locationId to fetchAvailability function signature, URL building, and call site

## Decisions Made

**Parameter threading pattern**
- Added locationId as optional parameter to fetchAvailability
- Conditionally append to URL only when provided
- Pass booking.locationId || undefined from call site
- Rationale: Booking widget already captures locationId in BookingData interface, just needed to pass it through to API

**Gap closure timing**
- 06-03 and 06-04 both addressed gaps identified in 06-02 verification
- Both changes were straightforward parameter additions
- Committed together in single commit for atomic fix
- Rationale: Both gaps were simple parameter threading, no architectural changes needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The BookingData interface already contained locationId field, so fix was straightforward parameter threading.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Gap Closure Complete**
- Gap 1 (location context race): Fixed in 06-03
- Gap 2 (booking widget locationId): Fixed in 06-04
- Phase 6 verification gaps now resolved

**Ready for re-verification:**
- Business hours changes in Settings should now affect booking widget
- Closed days should show no available slots
- Location-specific hours should apply correctly

**Blockers:** None

---
*Phase: 06-settings-persistence*
*Completed: 2026-01-27*
