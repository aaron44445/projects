---
phase: 02-core-data-flows
plan: 06
subsystem: ui
tags: [react, typescript, rbac, permissions, frontend-auth]

# Dependency graph
requires:
  - phase: 02-05
    provides: Backend RBAC API enforcement
provides:
  - Frontend permission system with role hierarchy (staff < manager < admin < owner)
  - canEditStaff() function for granular edit permissions
  - Staff can edit own profile but not change own role
  - Manager role UI properly gated (view-only, no creation/deletion)
affects: [calendar, reports, settings, billing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "canEditStaff pattern: granular permission checking for resource-specific actions"
    - "Role hierarchy with 4 tiers: staff, manager, admin, owner"
    - "Permission gating via RequirePermission component + isAtLeast() checks"

key-files:
  created: []
  modified:
    - apps/web/src/hooks/usePermissions.ts
    - apps/web/src/app/staff/page.tsx
    - apps/web/src/components/RequirePermission.tsx

key-decisions:
  - "Manager role added to hierarchy between staff and admin"
  - "Staff can edit own profile via canEditStaff() but role dropdown disabled for self-edit"
  - "Admin can manage all except billing (owner-only)"
  - "Manager has view-only permissions (VIEW_REPORTS only)"

patterns-established:
  - "Resource-specific permissions: use canEdit{Resource}(id) pattern for granular checks"
  - "Permission constants mapped to role capabilities in hasPermission() function"
  - "isAtLeast() for hierarchical role checks in UI gating"

# Metrics
duration: 5min
completed: 2026-01-25
---

# Phase 02 Plan 06: Frontend Permission Gating Summary

**Role-based UI system with 4-tier hierarchy, staff self-edit capability, and manager view-only access**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-25T10:04:01Z
- **Completed:** 2026-01-25T10:08:48Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments
- Fixed missing 'manager' role in hierarchy (was staff → admin → owner, now staff → manager → admin → owner)
- Implemented granular permission mapping: owner (all), admin (all except billing), manager (view-only), staff (none)
- Added canEditStaff() function so staff can edit own profile but not change own role
- Verified manager cannot see Add/Delete/Edit buttons (view-only access confirmed)

## Task Commits

Each task was committed atomically:

1. **Task 1: Audit and fix frontend permission system** - `a9d0400` (fix)
2. **Task 2: Audit and fix staff page permission gating** - `2c0f769` (feat)
3. **Task 3: Test manager role specific UI permissions** - `eacac71` (docs)

## Files Created/Modified
- `apps/web/src/hooks/usePermissions.ts` - Added manager to roleHierarchy, implemented role-specific hasPermission logic, added canEditStaff() and isManager property
- `apps/web/src/app/staff/page.tsx` - Added canEditStaff check for edit button, disabled role dropdown for self-edit, imported useAuth for user ID

## Decisions Made

**1. Manager role placement in hierarchy**
- Placed manager between staff and admin in roleHierarchy array
- Gives managers isAtLeast('staff') and isAtLeast('manager') permissions
- Denies managers isAtLeast('admin') and isAtLeast('owner') permissions

**2. Manager permission scope**
- Manager gets VIEW_REPORTS permission only
- Cannot create, edit, or delete staff
- Cannot manage locations or billing
- Can view all staff details (read-only)

**3. Staff self-edit pattern**
- Staff can edit own profile (name, email, phone, certifications, commission)
- Staff cannot change own role (dropdown disabled when editingStaff.id === user.id)
- Higher roles (admin/owner) can change anyone's role

**4. Permission check granularity**
- Generic permissions (CREATE_STAFF, DELETE_STAFF) for broad actions
- Resource-specific checks (canEditStaff) for granular actions
- Pattern: canEdit{Resource}(resourceId) for entity-specific permissions

## Deviations from Plan

None - plan executed exactly as written. All permission gating was already in place, just needed role hierarchy fix and self-edit capability.

## Issues Encountered

None - permission system was well-structured, just missing manager role in hierarchy constant.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Frontend RBAC complete. Ready for:
- Calendar page permission gating (manager can assign, cannot delete)
- Reports page permission gating (manager has VIEW_REPORTS)
- Settings page permission gating (owner-only for billing)
- Testing role-based workflows end-to-end

**Known limitations:**
- Backend API permission checks (02-05) verify role on every request
- Frontend gating is UX enhancement, not security (API is source of truth)

---
*Phase: 02-core-data-flows*
*Completed: 2026-01-25*
