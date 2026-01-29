---
phase: 17-code-quality
plan: 05
subsystem: api
tags: [prisma, pino, typescript, logging, tenant-isolation]

# Dependency graph
requires:
  - phase: 17-01
    provides: logger utility and withSalonId helper
provides:
  - System/core route files with explicit Prisma types
  - Structured logging in auth, dashboard, locations, salon, team, notifications
  - withSalonId usage for tenant filtering in notifications
affects: [17-06, 17-07, 17-08, 17-09]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Prisma.{Model}WhereInput for dynamic where clauses"
    - "logger.error({ err, context }, message) for error logging"
    - "withSalonId(salonId) for tenant filtering"

key-files:
  created: []
  modified:
    - apps/api/src/routes/auth.ts
    - apps/api/src/routes/dashboard.ts
    - apps/api/src/routes/locations.ts
    - apps/api/src/routes/salon.ts
    - apps/api/src/routes/team.ts
    - apps/api/src/routes/notifications.ts

key-decisions:
  - "Import Prisma from @peacase/database not @prisma/client for consistency"
  - "Use Prisma.DateTimeFilter cast for dynamic date range filters"

patterns-established:
  - "Pattern: logger.error({ err, ...context }, message) for structured error context"

# Metrics
duration: 4min
completed: 2026-01-29
---

# Phase 17 Plan 05: System/Core Route Migration Summary

**Six system/core route files migrated to explicit Prisma types and structured logging with zero any types and zero console calls**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-29T12:00:00Z
- **Completed:** 2026-01-29T12:04:00Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Replaced 1 console.error in auth.ts with structured logger.error
- Replaced 2 console.error calls in team.ts with structured logger.error
- Replaced 2 any types in notifications.ts with Prisma.NotificationLogWhereInput
- Added logger and Prisma imports to all 6 system/core route files
- Used withSalonId for tenant filtering in notifications.ts

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate auth.ts and dashboard.ts** - `0af005f` (refactor)
2. **Task 2: Migrate locations.ts and salon.ts** - `5d45efe` (refactor)
3. **Task 3: Migrate team.ts and notifications.ts** - `c8ed51f` (refactor)

## Files Modified
- `apps/api/src/routes/auth.ts` - Authentication routes with structured security logging
- `apps/api/src/routes/dashboard.ts` - Dashboard stats with Prisma types
- `apps/api/src/routes/locations.ts` - Location management with logger import
- `apps/api/src/routes/salon.ts` - Salon settings with logger import
- `apps/api/src/routes/team.ts` - Team management with structured error logging
- `apps/api/src/routes/notifications.ts` - Notification queries with typed where clauses

## Decisions Made
- Import Prisma from `@peacase/database` instead of `@prisma/client` to match project patterns
- Use `Prisma.DateTimeFilter` cast for dynamic date range filters in notifications.ts

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript build errors in other route files (appointments.ts, clientPortal.ts, etc.) due to importing from `@prisma/client` instead of `@peacase/database`. These are outside the scope of this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- System/core route files complete
- Ready for wave 2 continuation with other route files

---
*Phase: 17-code-quality*
*Completed: 2026-01-29*
