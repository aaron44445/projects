---
phase: 19-staff-authentication-foundation
plan: 01
subsystem: auth
tags: [jwt, staff-portal, middleware, refresh-tokens, remember-me]

# Dependency graph
requires:
  - phase: 17-typescript-strictness
    provides: TypeScript strict mode foundation
provides:
  - Portal-specific JWT tokens with portalType claim
  - staffPortalOnly middleware for staff route protection
  - ownerPortalOnly middleware to reject staff tokens
  - Remember-me functionality with 30d/24h refresh tokens
  - 15-minute access token expiry for security
affects: [19-04, 19-05, 20-staff-portal-core, owner-routes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Portal-specific JWT claims (portalType, staffId)
    - Short-lived access tokens (15m) with configurable refresh

key-files:
  created: []
  modified:
    - apps/api/src/routes/staffPortal.ts
    - apps/api/src/middleware/staffAuth.ts
    - apps/api/src/middleware/auth.ts

key-decisions:
  - "15-minute access tokens for staff (vs 7-day for owners)"
  - "portalType claim for portal discrimination"
  - "rememberMe: 30-day refresh (true) vs 24-hour (false)"
  - "ownerPortalOnly returns 401 not 403 per CONTEXT.md"

patterns-established:
  - "Portal discrimination: check portalType claim in middleware"
  - "Staff tokens include staffId for explicit identification"

# Metrics
duration: 7min
completed: 2026-01-29
---

# Phase 19 Plan 01: Portal-Specific JWT Tokens Summary

**Staff JWT tokens with portalType:'staff' claim, 15-minute access expiry, and rememberMe-controlled refresh tokens (30d/24h)**

## Performance

- **Duration:** 7 min
- **Started:** 2026-01-29T18:47:29Z
- **Completed:** 2026-01-29T18:54:34Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Staff tokens now include `portalType: 'staff'` and `staffId` claims
- Access token expiry reduced from 7 days to 15 minutes for security
- Remember-me functionality: 30-day refresh tokens when enabled, 24-hour when not
- ownerPortalOnly middleware protects owner routes from staff tokens
- staffPortalOnly middleware ensures staff-only route access

## Task Commits

Each task was committed atomically:

1. **Task 1 & 2: JWT tokens with rememberMe** - (previously committed in cbfe9b1)
2. **Task 3: Portal-only middleware** - `254ac3d` (feat)

**Note:** Tasks 1 and 2 were already completed in a prior session (commit cbfe9b1). Task 3 was the remaining work.

## Files Created/Modified
- `apps/api/src/routes/staffPortal.ts` - Portal-specific token generation with portalType claim
- `apps/api/src/middleware/staffAuth.ts` - Added staffPortalOnly and ownerPortalOnly middleware
- `apps/api/src/middleware/auth.ts` - Extended JWTPayload with portalType and staffId

## Decisions Made
- **15-minute access tokens:** Short-lived for security, mitigates token theft risk
- **portalType claim:** Enables middleware to distinguish staff vs owner tokens
- **401 for cross-portal rejection:** ownerPortalOnly returns 401 (unauthorized) not 403 per CONTEXT.md
- **rememberMe default false:** New account setup defaults to 24-hour refresh for security

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Tasks 1 and 2 were already completed in a prior execution session - verified existing state met requirements and proceeded with Task 3 only.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Staff tokens now distinguishable from owner tokens
- Middleware ready to protect routes from cross-portal access
- Ready for Plan 02 (Remember Me checkbox UI) and Plan 04 (Apply middleware to owner routes)

---
*Phase: 19-staff-authentication-foundation*
*Completed: 2026-01-29*
