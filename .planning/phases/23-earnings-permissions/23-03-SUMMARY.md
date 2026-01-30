---
phase: 23-earnings-permissions
plan: 03
subsystem: ui
tags: [react, csv-export, client-privacy, staff-portal]

# Dependency graph
requires:
  - phase: 23-01
    provides: Weekly pay period selector and /earnings/periods endpoint
  - phase: 23-02
    provides: CSV export endpoint at /earnings/export with fast-csv streaming
provides:
  - Export button in earnings UI triggering CSV download
  - Client name masking in table based on staffCanViewClientContact setting
  - staffCanViewClientContact boolean in earnings API response
affects: [staff-portal, earnings]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Client name masking pattern using formatClientName helper
    - Fetch-based file download with auth token injection

key-files:
  created: []
  modified:
    - apps/api/src/routes/staffPortal.ts
    - apps/web/src/app/staff/earnings/page.tsx

key-decisions:
  - "Transform API response to flatten client firstName/lastName for frontend consumption"
  - "Use fetch with blob for authenticated CSV download instead of window.location"
  - "Add totalEarnings and averagePerAppointment to summary for frontend display"

patterns-established:
  - "formatClientName pattern: Show 'FirstName L.' when client visibility disabled"
  - "Authenticated file download pattern: fetch with token, create blob URL, trigger download"

# Metrics
duration: 8min
completed: 2026-01-29
---

# Phase 23 Plan 03: Export Button and Client Masking Summary

**Export button triggers CSV download for selected period, client names masked to "FirstName L." format when staffCanViewClientContact is false**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-30T03:52:00Z
- **Completed:** 2026-01-30T04:00:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Export button in earnings header triggers CSV download via authenticated fetch
- Export disabled when no records available for selected period
- Client names in table respect staffCanViewClientContact salon setting
- API response now includes staffCanViewClientContact boolean and flattened record structure

## Task Commits

Each task was committed atomically:

1. **Task 1: Add staffCanViewClientContact to earnings API response** - `87ace20` (feat)
2. **Task 2: Add Export button and client name masking to earnings page** - `57320d7` (feat)

## Files Created/Modified
- `apps/api/src/routes/staffPortal.ts` - Added staffCanViewClientContact to response, transformed records to flat shape
- `apps/web/src/app/staff/earnings/page.tsx` - Added Download icon, Export button, formatClientName helper, updated EarningsData interface

## Decisions Made
- **Transform API response:** Flattened client firstName/lastName fields at response level rather than parsing combined clientName in frontend - cleaner separation of concerns
- **Use fetch for download:** Used fetch with Bearer token for authenticated CSV download, then create blob URL - handles auth properly unlike direct window.location
- **Add summary fields:** Added totalEarnings and averagePerAppointment to summary calculation in API to support existing frontend display expectations

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] API response shape mismatch**
- **Found during:** Task 2 (Export button and client name masking)
- **Issue:** Frontend EarningsRecord interface expected flat clientFirstName/clientLastName fields but API returned nested appointment.client.firstName/lastName
- **Fix:** Added transformedRecords mapping in API to flatten client name fields to match frontend interface
- **Files modified:** apps/api/src/routes/staffPortal.ts
- **Verification:** TypeScript compilation passes, build succeeds
- **Committed in:** 57320d7 (Task 2 commit)

**2. [Rule 1 - Bug] Missing summary fields**
- **Found during:** Task 2 (Export button and client name masking)
- **Issue:** Frontend displayed totalEarnings and averagePerAppointment but API summary didn't include these fields
- **Fix:** Added totalEarnings and averagePerAppointment calculations to summary object
- **Files modified:** apps/api/src/routes/staffPortal.ts
- **Verification:** TypeScript compilation passes, build succeeds
- **Committed in:** 57320d7 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for correct frontend/backend integration. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Export functionality complete for staff portal earnings
- Client visibility control toggle (23-04) already implemented
- Ready for Phase 24 (Technical Debt)

---
*Phase: 23-earnings-permissions*
*Completed: 2026-01-29*
