---
phase: 19-staff-authentication-foundation
plan: 05
subsystem: auth
tags: [logout, staff-portal, jwt, session]

# Dependency graph
requires:
  - phase: 19-01
    provides: StaffAuthContext with token management
provides:
  - Staff logout button in portal sidebar
  - Complete token clearing on logout
  - Server-side session invalidation
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Logout clears both client state and server tokens"
    - "Sidebar-based navigation with persistent logout access"

key-files:
  created: []
  modified: []

key-decisions:
  - "Logout button placement in sidebar (already implemented) - provides consistent access from any page"
  - "StaffHeader component exists as optional secondary logout location"

patterns-established:
  - "Staff portal uses sidebar navigation pattern with logout at bottom"
  - "Logout flow: stop timer -> API call -> clear localStorage -> clear state -> redirect"

# Metrics
duration: 5min
completed: 2026-01-29
---

# Phase 19 Plan 05: Logout Flow and Session Cleanup Summary

**Staff portal logout functionality verified complete - sidebar button on all pages with full token clearing**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-29T18:47:29Z
- **Completed:** 2026-01-29T18:52:54Z
- **Tasks:** 3
- **Files modified:** 0 (verification only - functionality existed)

## Accomplishments

- Verified logout button exists in StaffPortalSidebar on all staff pages
- Verified StaffAuthContext.logout properly clears all tokens
- Verified StaffHeader.tsx component exists with logout functionality
- Confirmed redirect to /staff/login after logout

## Task Commits

All functionality was already implemented in previous plans:

1. **Task 1: Check existing staff layout and header** - No commit (verification)
2. **Task 2: Implement or verify logout button in staff header** - Already in `cbfe9b1` (19-03)
3. **Task 3: Verify logout clears all tokens** - No commit (verification)

**Plan metadata:** Committed with this summary

## Files Created/Modified

No files were modified - this plan verified existing functionality:

- `apps/web/src/components/StaffPortalSidebar.tsx` - Contains logout button (lines 134-143)
- `apps/web/src/components/staff/StaffHeader.tsx` - Optional header with logout (created in 19-03)
- `apps/web/src/contexts/StaffAuthContext.tsx` - Logout function implementation (lines 274-285)

## Verification Results

### Logout Button Visibility
- StaffPortalSidebar includes logout at bottom of navigation
- Present on: dashboard, schedule, profile, earnings, time-off pages
- StaffHeader provides optional secondary logout location

### Token Clearing Verification
Logout function (StaffAuthContext.tsx:274-285) performs:
1. `stopTokenRefreshTimer()` - Stops background refresh
2. `api.post('/staff-portal/auth/logout')` - Server invalidation
3. `clearTokens()` which:
   - `localStorage.removeItem(STAFF_ACCESS_TOKEN_KEY)`
   - `localStorage.removeItem(STAFF_REFRESH_TOKEN_KEY)`
   - `api.setAccessToken(null)`
4. `setStaff(null)` - Clears React state

### Redirect Verification
- StaffPortalSidebar handleLogout: `router.push('/staff/login')`
- StaffHeader handleLogout: `router.push('/staff/login')`

## Decisions Made

- No new implementation needed - all logout functionality was already properly implemented
- Sidebar serves as primary logout location (consistent with existing UI pattern)
- StaffHeader available for pages that want header-based logout as well

## Deviations from Plan

None - plan executed exactly as written (verification mode since implementation existed)

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Staff authentication foundation is complete
- Login, session management, invite flow, and logout all functional
- Ready for Phase 20: Staff Portal Core functionality

---
*Phase: 19-staff-authentication-foundation*
*Completed: 2026-01-29*
