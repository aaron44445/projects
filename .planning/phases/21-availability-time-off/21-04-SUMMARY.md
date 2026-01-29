---
phase: 21-availability-time-off
plan: 04
subsystem: ui
tags: [react, availability, schedule, staff-portal]

# Dependency graph
requires:
  - phase: 20-staff-portal-core
    provides: Staff portal schedule page with weekly availability editor
provides:
  - Copy to weekdays shortcut for faster availability setup
  - Enhanced availability editor UX
affects: [staff-onboarding, availability-validation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "copyToWeekdays pattern for bulk day updates"

key-files:
  created: []
  modified:
    - "apps/web/src/app/staff/schedule/page.tsx"

key-decisions:
  - "Copy first working day's hours to weekdays (simpler UX than dropdown selector)"

patterns-established:
  - "Bulk schedule update: copy source day to filtered day range (Mon-Fri = dayOfWeek 1-5)"

# Metrics
duration: 5min
completed: 2026-01-29
---

# Phase 21 Plan 04: Availability Editor Shortcut Summary

**Added Copy to weekdays button for faster staff availability setup - copies first working day's schedule to Mon-Fri**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-29T20:35:21Z
- **Completed:** 2026-01-29T20:40:45Z
- **Tasks:** 3 (1 audit, 1 feature, 1 verification)
- **Files modified:** 1

## Accomplishments
- Verified existing availability editor meets all CONTEXT.md requirements
- Added copyToWeekdays function for bulk schedule updates
- Added "Copy to weekdays" button in edit mode UI
- Confirmed API integration via updateSchedule hook to PUT /my-schedule

## Task Commits

Each task was committed atomically:

1. **Task 1: Audit existing availability editor** - (verification only, no commit)
2. **Task 2: Add "Copy to weekdays" shortcut** - `fc55ff0` (feat)
3. **Task 3: Verify availability API integration** - (verification only, no commit)

## Files Created/Modified
- `apps/web/src/app/staff/schedule/page.tsx` - Added copyToWeekdays function and button in edit mode header

## Decisions Made
- Used simple button approach instead of dropdown selector for cleaner UX
- Button copies first working day's schedule (finds first day where isWorking=true)
- Applied to weekdays only (Mon-Fri, dayOfWeek 1-5) - weekends remain unchanged

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Availability editor complete with all AVAIL-01 requirements covered
- Ready for time-off request plans (21-01, 21-02, 21-03)

---
*Phase: 21-availability-time-off*
*Completed: 2026-01-29*
