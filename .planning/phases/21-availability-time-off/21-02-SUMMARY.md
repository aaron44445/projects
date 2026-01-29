---
phase: 21-availability-time-off
plan: 02
subsystem: api, ui
tags: [time-off, approval-workflow, settings, react, express]

# Dependency graph
requires:
  - phase: 21-01
    provides: requireTimeOffApproval salon field and auto-approve logic
provides:
  - GET /salon/time-off-requests endpoint for listing staff requests
  - PATCH /salon/time-off-requests/:id endpoint for approve/reject
  - Staff Policies settings section with approval toggle
  - Pending requests UI with approve/reject modal
affects: [staff-portal, notifications]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Modal for approval confirmation with optional notes field
    - Settings section with conditional child sections

key-files:
  created: []
  modified:
    - apps/api/src/routes/salon.ts
    - apps/web/src/hooks/useSalon.ts
    - apps/web/src/hooks/index.ts
    - apps/web/src/app/settings/page.tsx

key-decisions:
  - "Filter pending requests with status query param in GET endpoint"
  - "Review modal requires explicit approve/reject action with optional notes"
  - "Staff Policies section only shows pending list when toggle is ON"

patterns-established:
  - "Settings section with conditional content based on feature toggle"
  - "Approval workflow: modal with action buttons, optional notes, loading state"

# Metrics
duration: 5min
completed: 2026-01-29
---

# Phase 21 Plan 02: Owner Approval UI Summary

**Owner time-off approval UI with GET/PATCH API endpoints, useSalon hook methods, and Staff Policies settings section with pending requests list and approve/reject modal**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-29T20:36:35Z
- **Completed:** 2026-01-29T20:41:44Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- GET /salon/time-off-requests endpoint lists all staff time-off requests with optional status filter
- PATCH /salon/time-off-requests/:id approves or rejects with review notes
- Staff Policies section in settings page with requireTimeOffApproval toggle
- Pending requests list with approve/reject buttons and confirmation modal

## Task Commits

Each task was committed atomically:

1. **Task 1: Add owner time-off API endpoints** - `90402ca` (feat)
2. **Task 2: Add time-off requests hook to useSalon** - `a837823` (feat)
3. **Task 3: Add Staff Policies section to settings page** - `3143f90` (feat)

## Files Created/Modified

- `apps/api/src/routes/salon.ts` - Added GET/PATCH time-off-requests endpoints with validation
- `apps/web/src/hooks/useSalon.ts` - Added TimeOffRequestWithStaff type, fetchTimeOffRequests and reviewTimeOff functions
- `apps/web/src/hooks/index.ts` - Exported TimeOffRequestWithStaff type
- `apps/web/src/app/settings/page.tsx` - Added StaffPoliciesSection component with toggle, pending list, and review modal

## Decisions Made

- **Status filter via query param:** GET endpoint accepts ?status=pending to filter requests - allows future expansion to show all/approved/rejected
- **Modal confirmation pattern:** Used Modal component from @peacase/ui with optional notes field, consistent with existing patterns
- **Conditional rendering:** Pending requests list only renders when requireTimeOffApproval is enabled - reduces visual noise when feature is off

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Owner approval workflow complete
- Ready for Phase 21-03 (notification when requests are approved/rejected)
- Staff can submit requests (21-01), owners can approve them (21-02)

---
*Phase: 21-availability-time-off*
*Completed: 2026-01-29*
