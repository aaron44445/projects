---
phase: 20-staff-portal-core
plan: 01
subsystem: api
tags: [staff-portal, location-filtering, visibility-controls, dashboard]

# Dependency graph
requires:
  - phase: 19-staff-auth-foundation
    provides: Staff authentication with portal-specific JWT tokens
provides:
  - Location-filtered dashboard appointments for multi-location staff
  - staffCanViewClientContact visibility flag from salon settings
  - hasMultipleLocations flag for conditional UI rendering
  - Enhanced appointment data with notes, price, and location
affects: [20-staff-portal-core, 21-availability-time-off, 23-earnings-permissions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Conditional location filtering (apply filter only if staff has location assignments)
    - Visibility setting pass-through from salon to API response

key-files:
  created: []
  modified:
    - apps/api/src/routes/staffPortal.ts
    - apps/web/src/app/staff/dashboard/page.tsx

key-decisions:
  - "Location filter applied only when staff has >0 location assignments; otherwise show all salon appointments"
  - "staffCanViewClientContact defaults to true if salon setting not found"
  - "hasMultipleLocations derived from staffLocationIds.length > 1"

patterns-established:
  - "Conditional spread for Prisma where clause: ...(condition && { field: value })"
  - "Location badge shown only for multi-location staff via hasMultipleLocations flag"

# Metrics
duration: 12min
completed: 2026-01-29
---

# Phase 20 Plan 01: Location-Aware Dashboard Summary

**Staff dashboard now filters appointments by assigned locations and conditionally shows client phone based on salon's staffCanViewClientContact setting**

## Performance

- **Duration:** 12 min
- **Started:** 2026-01-29T19:42:00Z
- **Completed:** 2026-01-29T19:54:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Dashboard API filters appointments to staff's assigned locations (or all if no assignments)
- API returns staffCanViewClientContact boolean from salon settings
- API returns hasMultipleLocations flag for conditional UI rendering
- Frontend conditionally shows client phone when visibility setting allows
- Multi-location staff see location badges on appointment cards

## Task Commits

Each task was committed atomically:

1. **Task 1: Add location filtering and visibility setting to dashboard API** - `71546f8` (feat)
2. **Task 2: Update frontend to respect client visibility and show location badges** - `aef687a` (feat)

_Note: Task 1 API changes were bundled with an earlier commit from a previous session_

## Files Created/Modified
- `apps/api/src/routes/staffPortal.ts` - Added location filtering to dashboard route, staffCanViewClientContact and hasMultipleLocations flags
- `apps/web/src/app/staff/dashboard/page.tsx` - Updated DashboardData interface, conditional phone display, location badges

## Decisions Made
- Location filter uses conditional spread: `...(staffLocationIds.length > 0 && { locationId: { in: staffLocationIds } })` to only apply filter when staff has assignments
- staffCanViewClientContact defaults to true via nullish coalescing: `salon?.staffCanViewClientContact ?? true`
- hasMultipleLocations is strictly > 1 (not >= 1) to only show badges when staff works at multiple locations

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Dashboard API enhanced with location and visibility controls
- Ready for Plan 02 (profile page with location assignments) - already partially implemented
- SCHED-03 location filtering requirement satisfied

---
*Phase: 20-staff-portal-core*
*Completed: 2026-01-29*
