# Phase 20: Staff Portal Core - Context

**Gathered:** 2026-01-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Staff can view their schedule, appointment details, and manage their profile with location-aware filtering. This phase establishes the core staff portal experience: dashboard with today's appointments, week view for upcoming schedule, appointment detail display, and basic profile management (phone/avatar).

Out of scope: Availability management (Phase 21), time tracking (Phase 22), earnings (Phase 23).

</domain>

<decisions>
## Implementation Decisions

### Dashboard Layout
- Card-based layout for today's appointments — each appointment is a distinct card
- Cards show: time, client name (respecting visibility settings), service name, duration
- Chronological order, upcoming first with past appointments dimmed
- Empty state: friendly message when no appointments today
- Mobile-first design — cards stack vertically, no horizontal scroll

### Week View Navigation
- Horizontal day tabs at top (Mon-Sun) with today highlighted
- Tap/click day to see that day's appointments in same card format
- Date picker for jumping to specific weeks
- Swipe gestures on mobile to navigate between days
- Current week loads by default, can navigate to future weeks

### Appointment Details
- Tap card to expand inline or show detail modal (Claude's discretion on pattern)
- Details include: full client name, phone (if visibility allows), all services with prices, appointment notes, total duration
- Read-only — staff cannot edit appointments from this portal
- Location badge if staff works multiple locations

### Profile Editing
- Simple form: phone number field with validation, avatar upload
- Avatar: click to upload, accepts jpg/png, auto-crops to square
- Phone: standard format validation, optional field
- Save button with loading state, success toast on save
- Display-only fields: name, email, assigned services, assigned locations

### Location Filtering
- Appointments automatically filter to staff's assigned locations
- If staff has multiple locations, show location indicator on each card
- No manual location filter needed — use assignment data from StaffMember model

### Claude's Discretion
- Exact card styling and spacing
- Loading skeleton patterns
- Error state UI
- Animation/transitions
- Whether detail view is modal or inline expand

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Should feel consistent with the existing owner portal patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 20-staff-portal-core*
*Context gathered: 2026-01-29*
