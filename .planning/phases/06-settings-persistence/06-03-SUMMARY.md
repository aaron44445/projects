---
phase: 06-settings-persistence
plan: 03
subsystem: ui
tags: [react, hooks, state-management, localStorage]

# Dependency graph
requires:
  - phase: 06-01
    provides: Location hours UI and useLocationHours hook
  - phase: 02-02
    provides: LocationContext with localStorage persistence
provides:
  - Race-condition-free location context initialization
  - Lazy state initialization pattern for localStorage
  - Correct location selection on page refresh
affects: [06-04, any-future-location-context-users]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Lazy state initialization for localStorage reads"]

key-files:
  created: []
  modified:
    - apps/web/src/hooks/useLocations.tsx

key-decisions:
  - "Lazy state initialization ensures selectedLocationId has correct value before first render"
  - "Belt-and-suspenders approach: lazy init + double-check in fetchLocations"
  - "Removed duplicate localStorage read from useEffect to eliminate race"

patterns-established:
  - "Lazy state initialization pattern: useState(() => { return localStorage.getItem(...); })"
  - "Always initialize state from localStorage before useEffect runs"

# Metrics
duration: 4min
completed: 2026-01-27
---

# Phase 06-03: Fix Location Context Race Condition

**Lazy state initialization eliminates race condition where settings appear not to persist due to stale closure values**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-27T19:55:50Z
- **Completed:** 2026-01-27T19:59:49Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Fixed race condition where fetchLocations captured stale null value for selectedLocationId
- Eliminated auto-selection of primary location when localStorage contains different selection
- Users now experience correct persistence: saved location restored on page refresh
- Business hours now display for the correct location after refresh

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix location context initialization race condition** - `fdabc02` (fix)

## Files Created/Modified
- `apps/web/src/hooks/useLocations.tsx` - Added lazy state initialization for selectedLocationId, removed duplicate localStorage read from useEffect, added belt-and-suspenders check in fetchLocations

## Decisions Made

**1. Lazy state initialization pattern**
- Used `useState(() => localStorage.getItem(...))` instead of `useState(null)` followed by useEffect
- Ensures selectedLocationId has correct value on FIRST render, before any closures capture it
- Eliminates entire class of race conditions with async state updates

**2. Belt-and-suspenders approach**
- Kept double-check in fetchLocations auto-selection logic
- Handles edge cases where lazy init might not fire (SSR, unusual render timing)
- Low cost, high safety

**3. Removed duplicate localStorage read**
- useEffect no longer reads localStorage (already handled by lazy init)
- Simplified useEffect to only call fetchLocations
- Cleaner code, no redundant operations

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - implementation was straightforward. The race condition was exactly as diagnosed in 06-02 verification.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Gap 1 closed:** Location context now initializes correctly from localStorage before fetchLocations runs.

**Remaining gap:** Gap 2 (booking widget missing locationId) addressed in 06-04.

**Verification needed:** Manual test after both gaps closed:
1. Edit hours for Location B
2. Save changes
3. Hard refresh page
4. Verify Location B still selected (not switched to primary)
5. Verify hours shown match Location B's saved hours
6. Check booking widget uses Location B's hours for availability

---
*Phase: 06-settings-persistence*
*Completed: 2026-01-27*
