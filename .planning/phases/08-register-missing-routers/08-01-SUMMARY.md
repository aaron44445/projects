---
phase: 08-register-missing-routers
plan: 01
subsystem: api
tags: [express, router, vercel, serverless, production]

# Dependency graph
requires:
  - phase: 05-notification-system
    provides: notificationsRouter, ownerNotificationsRouter
  - phase: 06-settings-persistence
    provides: accountRouter, teamRouter
provides:
  - Production router parity with development
  - /api/v1/notifications endpoint in production
  - /api/v1/owner-notifications endpoint in production
  - /api/v1/account endpoint in production
  - /api/v1/team endpoint in production
  - /api/v1/integrations endpoint in production
affects: [production-deployment, notification-history, account-settings, team-management]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Router registration block comments for section organization

key-files:
  created: []
  modified:
    - apps/api/src/index.ts

key-decisions:
  - "Match exact route paths from app.ts for consistency"
  - "Group new routers by functional area with comments"

patterns-established:
  - "Maintain parity between app.ts (dev) and index.ts (prod) entry points"

# Metrics
duration: 3min
completed: 2026-01-28
---

# Phase 8 Plan 1: Register Missing Routers Summary

**Added 5 missing routers to production entry point (index.ts) achieving parity with development entry point (app.ts)**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-28T03:43:57Z
- **Completed:** 2026-01-28T03:47:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Registered notificationsRouter at /api/v1/notifications
- Registered ownerNotificationsRouter at /api/v1/owner-notifications
- Registered accountRouter at /api/v1/account
- Registered teamRouter at /api/v1/team
- Registered integrationsRouter at /api/v1/integrations
- Verified 100% router parity between app.ts and index.ts (28 routes each)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add missing router imports and registrations to index.ts** - `80d9613` (feat)
2. **Task 2: Verify router parity between app.ts and index.ts** - verification only, no code changes

## Files Created/Modified
- `apps/api/src/index.ts` - Added 5 router imports and 5 app.use() registrations

## Decisions Made
- Matched exact route paths from app.ts (/api/v1/account, /api/v1/team, /api/v1/owner-notifications, /api/v1/notifications, /api/v1/integrations)
- Added descriptive comments grouping routers by functional area (Account/Team, Notifications, Integrations)

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None - TypeScript compiled successfully, all router files existed as expected.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Production entry point now has full router parity with development
- Notification history page should work after deployment
- Account, team, and integrations APIs should respond after deployment
- Ready for Phase 9 (cleanup) if needed

---
*Phase: 08-register-missing-routers*
*Completed: 2026-01-28*
