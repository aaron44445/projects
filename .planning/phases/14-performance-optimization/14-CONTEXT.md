# Phase 14: Performance Optimization - Context

**Gathered:** 2026-01-28
**Status:** Ready for planning

<domain>
## Phase Boundary

API responses must be fast (<200ms) and dashboard queries must be efficient (no N+1). Booking confirmation returns before email/SMS is sent. Dashboard makes 2-3 queries instead of 8. VIP count uses database COUNT. Background refetch pauses when tab is hidden.

</domain>

<decisions>
## Implementation Decisions

### Async notification queue
- Use database job table (not Redis or in-memory queue)
- Booking confirmation inserts notification job and returns immediately
- Background worker polls job table on interval (5-10 seconds)
- Rationale: No new infrastructure needed, jobs survive server restart, fits existing Prisma/PostgreSQL stack

### Dashboard query strategy
- Consolidate into 2-3 parallel optimized queries using Prisma's groupBy and aggregate
- Single round-trip per query type: today's bookings, stats aggregation, recent activity
- Avoid single mega-query (harder to maintain, worse error isolation)
- Use Promise.all for parallel execution

### Background refetch behavior
- Pause refetch entirely when tab is backgrounded (visibilitychange API)
- Resume on tab focus with immediate stale check
- React Query's focusManager handles this natively — configure, don't rebuild

### VIP count optimization
- Database COUNT query with WHERE clause (not client-side filter)
- Include in dashboard stats aggregation query
- Real-time accuracy — VIP status changes rarely, no caching complexity needed

### Claude's Discretion
- Exact polling interval for notification worker
- Query batching strategy details
- Error retry logic for failed notifications

</decisions>

<specifics>
## Specific Ideas

No specific requirements — standard performance optimization patterns apply.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 14-performance-optimization*
*Context gathered: 2026-01-28*
