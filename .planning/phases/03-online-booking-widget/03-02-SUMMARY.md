---
phase: 03-online-booking-widget
plan: 02
subsystem: api
tags: [availability, booking, conflict-resolution, buffer-time]

# Dependency graph
requires:
  - phase: 03-01
    provides: "Transactional booking service with pessimistic locking"
  - phase: 02-03
    provides: "Staff-location assignment pattern (assigned + unassigned)"
provides:
  - "Availability service module with reusable slot calculation"
  - "Buffer time consistently included in slot duration"
  - "Alternative slot suggestions on booking conflict"
affects:
  - 03-03  # Widget UX will use alternatives for conflict handling

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Service module pattern for availability calculation"
    - "Search same day first, then expand to next 7 days for alternatives"

key-files:
  created:
    - apps/api/src/services/availability.ts
  modified:
    - apps/api/src/routes/public.ts

key-decisions:
  - "Buffer time always added to service duration for slot calculation"
  - "Alternatives search same day first, then expand to 7 days"
  - "Alternatives respect staffId constraint if client selected specific staff"
  - "Return up to 3 alternative slots (configurable via limit param)"

patterns-established:
  - "hasConflict() helper for reusable conflict detection"
  - "AvailableSlot interface includes full datetime for booking"
  - "calculateAvailableSlots() encapsulates all slot generation logic"
  - "findAlternativeSlots() uses calculateAvailableSlots() internally"

# Metrics
duration: 11min
completed: 2026-01-25
---

# Phase 3 Plan 2: Availability Service & Alternative Slots Summary

**Availability calculation service with buffer time handling and alternative slot suggestions when booking conflicts occur**

## Performance

- **Duration:** 11 min
- **Started:** 2026-01-25T19:05:37Z
- **Completed:** 2026-01-25T19:16:11Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments
- Created availability service module with calculateAvailableSlots and findAlternativeSlots functions
- Buffer time consistently included in slot duration (durationMinutes + bufferMinutes)
- Refactored availability endpoint to use service (reduced from 300+ to 80 lines)
- Booking conflict response now includes up to 3 alternative time slots
- Staff filtering uses established assigned + unassigned pattern from 02-03

## Task Commits

Each task was committed atomically:

1. **Task 1: Create availability service module** - `c1d42e9` (feat)
2. **Task 2: Refactor availability endpoint to use service** - `248848a` (refactor)
3. **Task 3: Add alternative slots to booking conflict response** - `b5806f4` (feat)

## Files Created/Modified
- `apps/api/src/services/availability.ts` - New service with calculateAvailableSlots, findAlternativeSlots, hasConflict helpers
- `apps/api/src/routes/public.ts` - Refactored to use availability service, enhanced booking conflict with alternatives

## Decisions Made
- **Buffer time inclusion:** totalDuration = service.durationMinutes + (service.bufferMinutes || 0) - ensures back-to-back appointments have proper spacing
- **Alternative search strategy:** Same day first, then expand to next 7 days - provides most relevant suggestions to client
- **Staff constraint for alternatives:** If client selected specific staff, alternatives must be for same staff - respects client preference
- **Default limit of 3 alternatives:** Balances useful suggestions vs performance/UI complexity

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed successfully.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Availability service ready for use by other endpoints
- Booking conflict alternatives ready for frontend integration in 03-03
- All must-haves from plan verified:
  - Buffer time in slot calculations
  - Business hours/staff availability respected
  - Alternatives returned on conflict
  - Alternatives respect staff selection

---
*Phase: 03-online-booking-widget*
*Completed: 2026-01-25*
