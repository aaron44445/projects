---
phase: 07-dashboard-validation
plan: 02
subsystem: ui
tags: [tanstack-query, react-query, auto-refresh, polling, dashboard]

# Dependency graph
requires:
  - phase: 07-01
    provides: Dashboard API endpoints with accurate calculations
provides:
  - Dashboard auto-refresh every 60 seconds via TanStack Query
  - Background tab refresh capability
  - Stale-while-revalidate pattern for instant cached display
  - Retry logic with exponential backoff
affects: [future dashboard enhancements, other hooks needing TanStack Query]

# Tech tracking
tech-stack:
  added: []
  patterns: [useQuery with refetchInterval, QueryClient provider setup for Next.js]

key-files:
  modified:
    - apps/web/src/hooks/useDashboard.ts
    - apps/web/src/app/providers.tsx

key-decisions:
  - "QueryClient created with useState to avoid SSR state sharing"
  - "refetchIntervalInBackground: true keeps dashboard fresh in background tabs"
  - "staleTime: 30000 shows cached data immediately while fetching fresh"
  - "gcTime: 300000 keeps cached data for 5 minutes"
  - "isFetching exposed for subtle background refresh indicators"

patterns-established:
  - "TanStack Query useQuery pattern: Create QueryClientProvider at app root with useState"
  - "Auto-refresh pattern: refetchInterval + refetchIntervalInBackground for live dashboards"
  - "Cache key pattern: Include locationId in queryKey for per-location caching"

# Metrics
duration: 4min
completed: 2026-01-27
---

# Phase 7 Plan 02: Dashboard Auto-Refresh Summary

**Dashboard auto-refresh using TanStack Query with 60-second polling, background tab support, and stale-while-revalidate caching**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-27T22:42:19Z
- **Completed:** 2026-01-27T22:46:26Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Dashboard now auto-refreshes every 60 seconds automatically
- Background tabs continue refreshing (owners leaving dashboard open all day)
- Cached data shown immediately while fetching fresh data (no flicker)
- Retry logic with exponential backoff handles transient network errors
- Manual refetch still works via exposed refetch function

## Task Commits

Each task was committed atomically:

1. **Task 1: Convert useDashboard to TanStack Query with auto-refresh** - `c3bdb79` (feat)
2. **Task 2: Ensure QueryClientProvider is configured in providers** - `4887b8d` (feat)

## Files Created/Modified
- `apps/web/src/hooks/useDashboard.ts` - Rewritten to use useQuery with refetchInterval, retry, staleTime
- `apps/web/src/app/providers.tsx` - Added QueryClientProvider wrapping entire app

## Decisions Made
- **QueryClient in useState:** Standard Next.js pattern to avoid sharing query cache between SSR requests
- **QueryClientProvider at root:** Placed outside ThemeProvider to ensure all components have query access
- **isFetching exposure:** Allows UI to show subtle indicator during background refresh without full loading state
- **gcTime 5 minutes:** Keeps cache warm for 5 minutes even if component unmounts

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - TanStack Query was already installed, just needed provider setup.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Dashboard now has production-ready auto-refresh capability
- QueryClientProvider is available for other hooks that may need TanStack Query
- Ready for Plan 03 (timestamp display formatting)

---
*Phase: 07-dashboard-validation*
*Completed: 2026-01-27*
