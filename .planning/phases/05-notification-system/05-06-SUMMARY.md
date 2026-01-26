---
phase: 05-notification-system
plan: 06
subsystem: notifications
tags: [email, calendar, ics, google-calendar, outlook, appointments]

# Dependency graph
requires:
  - phase: 05-01
    provides: appointmentConfirmationEmail template with calendar link support
  - phase: 02-01
    provides: Salon timezone and email fields
provides:
  - Calendar links (Google, Outlook, Yahoo, Apple ICS) in all booking confirmation emails
  - Appointment calendar data passed from all confirmation call sites
affects: [uat-testing, client-experience, email-notifications]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Calendar fields pattern: pass startTime, endTime, salonTimezone, salonEmail to email templates"

key-files:
  created: []
  modified:
    - apps/api/src/routes/appointments.ts
    - apps/api/src/routes/clientPortal.ts

key-decisions:
  - "Pass all 4 calendar fields (startTime, endTime, salonTimezone, salonEmail) to enable calendar links"
  - "Calculate endTime from startTime + service durationMinutes at call site"
  - "Fetch salon timezone and email fields in addition to name and address"

patterns-established:
  - "Calendar-enabled confirmations: Always calculate endTime and pass 4 calendar fields when sending appointment confirmations"

# Metrics
duration: 3min
completed: 2026-01-26
---

# Phase 05 Plan 06: Calendar Links Summary

**Booking confirmation emails now include Add to Calendar links for Google, Outlook, Yahoo, and Apple across all booking flows**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-26T16:03:33Z
- **Completed:** 2026-01-26T16:06:32Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Fixed missing calendar links in appointments.ts booking flow (admin/owner manual bookings)
- Fixed missing calendar links in clientPortal.ts booking flow (client self-service bookings)
- All 3 booking confirmation call sites now pass calendar fields consistently

## Task Commits

Each task was committed atomically:

1. **Task 1: Add calendar fields to appointments.ts confirmation email** - `adcd7dc` (feat)
2. **Task 2: Add calendar fields to clientPortal.ts confirmation email** - `9ea2be2` (feat)

## Files Created/Modified
- `apps/api/src/routes/appointments.ts` - Updated salon query to include timezone/email, calculated endTime, passed 4 calendar fields to appointmentConfirmationEmail
- `apps/api/src/routes/clientPortal.ts` - Updated salon query to include timezone/email, calculated endTime, passed 4 calendar fields to appointmentConfirmationEmail

## Decisions Made
- **Calculate endTime at call site:** Each booking flow calculates `endTime = startTime + service.durationMinutes` rather than expecting it from the database (appointment.endTime exists but requires consistency)
- **Fetch additional salon fields:** Extended salon queries to include `timezone` and `email` fields needed for calendar event generation
- **Consistent pattern across all flows:** public.ts was already correct, now appointments.ts and clientPortal.ts match the same pattern

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Pre-existing TypeScript error:** `Cannot find module './routes/clientAuth.js'` in src/app.ts and src/index.ts. This is unrelated to the current changes and was already present. Did not block execution as the modified routes compile correctly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for UAT verification:**
- UAT Test 2 gap now closed: Calendar links should appear in booking confirmation emails
- All booking flows (public widget, admin bookings, client portal) now consistent
- Email template will render calendar section when these 4 fields are present

**No blockers for Phase 6 (Settings UI)**

---
*Phase: 05-notification-system*
*Completed: 2026-01-26*
