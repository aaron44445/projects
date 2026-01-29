# Phase 21: Availability & Time Off - Context

**Gathered:** 2026-01-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Staff can self-manage recurring weekly availability (e.g., Mon-Fri 9am-5pm) and submit time-off requests with date range and reason. Staff can view request status (pending/approved/rejected). Changes respect salon's approval workflow settings.

</domain>

<decisions>
## Implementation Decisions

### Availability Editor
- Simple weekly grid: 7 days × time slots
- Per-day start/end time inputs (not draggable blocks)
- "Copy to all weekdays" shortcut for common patterns
- Global availability (not per-location) — locations inherit staff's base schedule
- Toggle to mark day as "not available" (no time inputs needed)

### Time-Off Request Flow
- Form fields: start date, end date, reason (optional text), type dropdown (PTO, Sick, Personal)
- Submit creates request in "pending" status
- Staff can cancel pending requests (not approved ones)
- No edit — cancel and resubmit if changes needed
- List view shows all requests with status badge (pending=amber, approved=sage, rejected=rose)

### Approval Workflow
- Default: auto-approve (most small salons don't need owner review)
- Salon setting: `requireTimeOffApproval` (boolean, defaults false)
- If approval required: owner sees pending requests in existing staff management area
- Owner can approve/reject with optional note
- Notification to staff when status changes (uses existing notification system)

### Calendar Visualization
- Availability shown as subtle background shading on schedule view
- Time-off shown as blocked-out overlay with "Time Off" label
- No separate calendar page — integrated into existing schedule views
- Consistent with Phase 20's visual patterns (sage for positive states, rose for conflicts)

### Claude's Discretion
- Exact time picker component (native vs custom)
- Specific grid layout spacing
- Animation/transition details
- API endpoint naming conventions

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Should feel consistent with existing staff portal patterns from Phase 20.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 21-availability-time-off*
*Context gathered: 2026-01-29*
