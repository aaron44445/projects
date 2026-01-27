# Phase 7: Dashboard & Validation - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Dashboard displays accurate business metrics and handles edge cases gracefully. Owners see correct appointment counts, revenue totals, and today's schedule in their timezone. Error states show helpful messages. This phase does NOT add new dashboard features — it ensures existing data is accurate and edge cases handled.

</domain>

<decisions>
## Implementation Decisions

### Metric calculations
- **Appointments count:** Only confirmed/completed appointments (exclude cancelled, no-show)
- **Revenue calculation:** Sum of paid amounts minus refunds for the period
- **Period comparisons:** Compare to same period last week/month (e.g., "This Monday vs last Monday")
- **Client count:** Unique clients with at least one completed appointment in period
- **"Today" definition:** Starts at midnight in the salon's timezone, not server time

### Timezone display
- **Owner timezone:** Use salon's configured timezone for all dashboard displays
- **Multi-location:** Each location has its own timezone; dashboard shows selected location's timezone
- **Time format:** 12-hour format with AM/PM for consistency with booking widget
- **DST handling:** Use established timezone library (date-fns-tz or similar) — never manual offset math
- **"Today's appointments":** Calculated using location timezone, not browser/server timezone

### Data freshness
- **Initial load:** Fetch fresh data on page load (no stale cache on first view)
- **Auto-refresh:** Every 60 seconds for today's appointments (owners leave dashboard open)
- **Manual refresh:** Pull-to-refresh or refresh button available
- **Stale indicator:** No explicit "last updated" — data should just be current
- **Background updates:** SWR pattern — show cached data immediately, fetch fresh in background

### Error states
- **Network failure:** Show "Unable to load dashboard. Check your connection." with retry button
- **Partial data:** Show what loaded, gray out failed sections with "Could not load [section]"
- **Empty states:** Friendly messages like "No appointments today" (not blank areas)
- **Loading states:** Skeleton loaders matching card shapes (not spinners)
- **Retry behavior:** Automatic retry 3x with exponential backoff, then show error with manual retry

### Claude's Discretion
- Exact skeleton loader animation
- Specific card layouts and spacing
- Chart library selection (if any charts needed)
- Caching strategy implementation details
- Exact retry timing intervals

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The focus is accuracy and reliability, not visual redesign.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-dashboard-validation*
*Context gathered: 2026-01-27*
