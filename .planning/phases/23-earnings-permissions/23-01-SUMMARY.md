---
phase: 23-earnings-permissions
plan: 01
subsystem: ui, api
tags: [date-fns, weekly-periods, pay-periods, earnings, staff-portal]

# Dependency graph
requires:
  - phase: 22-time-tracking
    provides: Staff portal foundation with authentication and time clock
provides:
  - Weekly pay period support in earnings API
  - Pay period selector dropdown in earnings page
  - /staff-portal/earnings/periods endpoint
affects: [24-technical-debt, earnings-export, payroll-integration]

# Tech tracking
tech-stack:
  added: [date-fns@3.2.0]
  patterns: [weekly-pay-period-calculation, period-selector-pattern]

key-files:
  created: []
  modified:
    - apps/api/src/routes/staffPortal.ts
    - apps/web/src/app/staff/earnings/page.tsx
    - apps/api/package.json

key-decisions:
  - "Sunday-Saturday pay period: weekStartsOn: 0 aligns with typical US spa payroll"
  - "12 weeks lookback: Covers quarterly earnings review needs"
  - "Period label format: 'MMM d - MMM d, yyyy' for clarity"

patterns-established:
  - "Pay period selector: Fetch periods list, use index-based selection"
  - "Weekly period calculation: startOfWeek/endOfWeek with weekStartsOn option"

# Metrics
duration: 12min
completed: 2026-01-29
---

# Phase 23 Plan 01: Weekly Pay Period Support Summary

**Weekly pay period selector with Sunday-Saturday boundaries using date-fns for 12-week lookback**

## Performance

- **Duration:** 12 min
- **Started:** 2026-01-29T22:35:00Z
- **Completed:** 2026-01-29T22:47:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Updated /earnings API to default to current weekly pay period (Sun-Sat)
- Added /earnings/periods endpoint returning last 12 weekly periods
- Replaced complex date filter UI with simple period selector dropdown
- Added date-fns as direct dependency for reliable date calculations

## Task Commits

Each task was committed atomically:

1. **Task 1: Update earnings API with weekly period calculation** - Already bundled in `71b1f5f` (feat 23-02: CSV export also included weekly period changes)
2. **Task 2: Update earnings page UI with period selector** - `ca48157` (feat)

**Supporting commits:**
- `ac3851c` - chore: add date-fns as direct dependency

_Note: Task 1 API changes were already committed as part of 23-02 execution (CSV export plan included weekly periods as prerequisite)_

## Files Created/Modified
- `apps/api/src/routes/staffPortal.ts` - Weekly period calculation in /earnings, new /earnings/periods endpoint
- `apps/web/src/app/staff/earnings/page.tsx` - Period selector dropdown replacing date filter
- `apps/api/package.json` - Added date-fns dependency

## Decisions Made
- **Sunday-Saturday week:** Used `weekStartsOn: 0` to align with typical US spa payroll cycles
- **12-week lookback:** Provides 3 months of history for quarterly reviews
- **Simple dropdown over calendar:** Staff need quick period selection, not arbitrary date ranges
- **Label format 'MMM d - MMM d, yyyy':** Unambiguous and easy to read

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added date-fns as direct dependency**
- **Found during:** Task 1 (API update)
- **Issue:** date-fns was only available as transitive dependency, causing TypeScript errors
- **Fix:** Added date-fns@3.2.0 as direct dependency in apps/api/package.json
- **Files modified:** apps/api/package.json, pnpm-lock.yaml
- **Verification:** TypeScript compilation passes
- **Committed in:** ac3851c

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Dependency fix necessary for compilation. No scope creep.

## Issues Encountered
- API changes were already committed in 23-02 plan execution (plans executed out of order in phase)
- Verified changes present before proceeding with UI task only

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Earnings page now shows weekly pay periods
- CSV export (23-02) can leverage period boundaries
- Ready for earnings export button integration
- Ready for client visibility controls (23-04 already complete)

---
*Phase: 23-earnings-permissions*
*Completed: 2026-01-29*
