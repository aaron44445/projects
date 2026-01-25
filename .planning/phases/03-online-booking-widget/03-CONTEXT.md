# Phase 3: Online Booking Widget - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Stabilize the client-facing booking widget to work reliably without double-bookings or failures. The widget exists but is unreliable — this phase audits and fixes the booking flow end-to-end. New booking features (deposits, packages, recurring) belong in other phases.

</domain>

<decisions>
## Implementation Decisions

### Conflict handling
- Show conflict message with alternative time slots when a slot is taken
- Alternatives must be for the same service the client selected
- If client picked a specific staff member, alternatives are for that same staff member
- Number of alternatives and exact wording: Claude's discretion

### Availability display
- Time slot increments based on service duration (30min service = 30min slots)
- Staff selection is optional — client can choose "Any available" or pick a specific person
- When "Any available" selected: show combined availability, assign at booking time to whoever is free

### Booking confirmation UX
- Show dedicated confirmation page after successful booking
- Include "Add to Calendar" buttons (Google Calendar, Apple Calendar, Outlook)
- Content details and whether to show cancel/reschedule links: Claude's discretion

### Claude's Discretion
- Whether to show all slots with unavailable grayed out, or only show available slots
- Number of alternative slots to suggest on conflict (pick reasonable number for UI)
- Conflict message wording (simple vs. explanatory)
- Confirmation page detail level (essentials vs. full details)
- Whether to show cancel/reschedule links on confirmation page

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Focus is on reliability and working correctly, not visual redesign.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-online-booking-widget*
*Context gathered: 2026-01-25*
