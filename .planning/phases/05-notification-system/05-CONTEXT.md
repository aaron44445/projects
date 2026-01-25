# Phase 5: Notification System - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

SMS and email notifications send reliably with delivery confirmation. Includes appointment reminders, booking confirmations, and owner visibility into notification history. This phase fixes the broken Twilio integration and connects email reminders.

</domain>

<decisions>
## Implementation Decisions

### Reminder Timing
- Configurable per salon — let each salon choose when reminders send
- If a client has multiple appointments on the same day, send separate reminders for each
- Clients can opt out per channel (unsubscribe from SMS and/or email independently)

### Message Content
- Customizable templates — salons can write their own message templates
- Booking confirmation emails include:
  - Appointment details
  - Cancel/reschedule links
  - Add-to-calendar (.ics file or calendar links)
- Emails include salon logo/branding from salon settings

### Delivery Handling
- If SMS fails, fallback to email
- If email fails (bounce/reject), retry once after 1 hour, then mark client email as invalid for owner attention
- No proactive alerts to owners on failure — they check history manually

### Owner Visibility
- Notification history accessible in two places:
  - Dedicated notifications page in nav
  - Per-client view on client profile
- One-click resend button for failed notifications
- 90-day retention for notification history

### Claude's Discretion
- Reminder timing preset options (reasonable defaults like 24h, 2h)
- Template variables to expose (useful set covering common needs)
- Filters for notifications page (practical filter set)
- Sync vs async architecture for sending (background queue preferred)

</decisions>

<specifics>
## Specific Ideas

- Confirmation emails should be "full featured" — appointment facts, modify links, and calendar integration
- Salon branding (logo) should appear in email templates
- Failed notifications need visibility but not interrupting alerts

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-notification-system*
*Context gathered: 2026-01-25*
