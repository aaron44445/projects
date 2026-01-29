# Phase 22: Time Tracking - Context

**Gathered:** 2026-01-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Staff can clock in/out for shifts and view their complete clock history with timezone-aware accuracy. This phase covers the time clock interface and history viewing. Payroll integration, manager approval of time entries, and timesheet editing are out of scope.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion

User delegated all implementation decisions. Claude will make reasonable choices based on:

**Clock in/out interaction:**
- Prominent clock button on staff dashboard (similar to availability/time-off patterns)
- Single tap to clock in, single tap to clock out
- Show current status clearly (clocked in since X:XX or not clocked in)
- Auto clock-out reminder if shift exceeds reasonable duration (e.g., 12 hours)
- Handle "forgot to clock out" by allowing manual time adjustment or flagging for review

**History display:**
- List view grouped by day, most recent first
- Each entry shows: date, clock in time, clock out time, total duration
- Filter by date range (week/month/custom)
- Follow existing UI patterns (cards, EmptyState for no entries)

**Timezone handling:**
- Store all times in UTC in database
- Display times in staff's primary location timezone
- If staff works multiple locations, use the location where they clocked in
- Consistent with existing appointment timezone handling

**Edge cases:**
- Prevent double clock-in (button disabled when already clocked in)
- Allow clock-in at any assigned location
- Shifts spanning midnight display correctly with proper date attribution
- Incomplete entries (clocked in but never out) flagged visually

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches that match existing portal patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 22-time-tracking*
*Context gathered: 2026-01-29*
