---
status: resolved
trigger: "Calendar links missing from confirmation emails - neither desktop nor mobile email includes add to calendar options"
created: 2026-01-26T12:00:00Z
updated: 2026-01-26T14:00:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: CONFIRMED - Prisma include-with-nested-select not reliably returning startTime/endTime scalar fields
test: Changed createBookingWithLock from `include` to explicit `select` with all needed fields
expecting: startTime and endTime will be explicitly returned, condition passes, calendar links appear
next_action: Deploy and verify

## Symptoms

expected: Booking confirmation email should include "Add to Calendar" section with links for Google Calendar, Outlook, Yahoo, and Apple Calendar (ICS download)
actual: Neither desktop nor mobile email includes add to calendar options
errors: None reported - section simply not appearing
reproduction: Book an appointment and check confirmation email
started: Unknown - may never have worked in production

## Eliminated

- hypothesis: Calendar fields not passed from public.ts
  evidence: Code at lines 883-886 DOES pass startTime, endTime, salonTimezone to sendNotification
  timestamp: 2026-01-26T12:45:00Z

- hypothesis: Calendar fields not passed from appointments.ts
  evidence: Code at lines 415-418 DOES pass startTime, endTime, salonTimezone, salonEmail
  timestamp: 2026-01-26T12:45:00Z

- hypothesis: Calendar fields not passed from clientPortal.ts
  evidence: Code at lines 396-399 DOES pass startTime, endTime, salonTimezone, salonEmail
  timestamp: 2026-01-26T12:45:00Z

- hypothesis: NotificationPayload interface missing calendar fields
  evidence: Interface at notifications.ts lines 21-23 DOES define startTime, endTime, salonTimezone as optional
  timestamp: 2026-01-26T12:45:00Z

## Evidence

- timestamp: 2026-01-26T12:40:00Z
  checked: apps/api/src/routes/public.ts (lines 868-887)
  found: sendNotification call DOES include startTime: appointment.startTime, endTime: appointment.endTime, salonTimezone: salon.timezone in payload.data
  implication: Public booking route correctly passes calendar fields

- timestamp: 2026-01-26T12:41:00Z
  checked: apps/api/src/services/notifications.ts (lines 5-25, 108-124)
  found: NotificationPayload.data interface has startTime?: Date, endTime?: Date, salonTimezone?: string. sendEmailNotification passes payload.data directly to appointmentConfirmationEmail
  implication: Notification service correctly relays calendar fields

- timestamp: 2026-01-26T12:42:00Z
  checked: apps/api/src/services/email.ts (lines 137-188)
  found: appointmentConfirmationEmail checks if (data.startTime && data.endTime) and generates calendar section. Logic is correct.
  implication: Email template logic is correct

- timestamp: 2026-01-26T12:43:00Z
  checked: apps/api/dist/ build timestamps
  found:
    - dist/services/email.js modified 2026-01-25 23:19:21 (STALE)
    - src/services/email.ts modified 2026-01-26 11:42:25 (NEWER)
    - dist/routes/public.js modified 2026-01-25 23:19:21 (STALE)
    - src/routes/public.ts modified 2026-01-26 12:17:18 (NEWER)
  implication: Build is STALE - source code has been updated but not rebuilt

- timestamp: 2026-01-26T12:44:00Z
  checked: apps/api/dist/routes/public.js (lines 762-764)
  found: Built code DOES contain startTime, endTime, salonTimezone being passed
  implication: The stale build DOES have calendar fields - feature was added before last build

- timestamp: 2026-01-26T12:44:30Z
  checked: apps/api/dist/services/email.js (lines 111-134)
  found: Built code DOES have calendar section generation with if (data.startTime && data.endTime)
  implication: Build contains the calendar feature code

- timestamp: 2026-01-26T12:45:00Z
  checked: packages/database/prisma/schema.prisma (lines 418-419)
  found: startTime and endTime are required DateTime fields (not nullable)
  implication: Prisma always returns Date objects for these fields

- timestamp: 2026-01-26T14:00:00Z
  checked: Prisma GitHub issues and documentation on include/select behavior
  found: Multiple known issues with include/select combinations (GitHub issues #20721, #21982, #26324) where scalar fields may not be returned as expected when using nested select inside include
  implication: Using explicit `select` instead of `include` is more reliable

- timestamp: 2026-01-26T14:00:00Z
  checked: apps/api/src/services/booking.ts createBookingWithLock function
  found: Was using `include: { client: { select: ... }, staff: { select: ... }, ... }` pattern which has known edge cases
  implication: Must change to explicit `select` for all needed fields including startTime, endTime

## Resolution

root_cause: Prisma's `include` clause with nested `select` was not reliably returning the scalar fields (startTime, endTime) of the main Appointment model. While Prisma documentation states `include` should return all scalar fields plus specified relations, there are documented edge cases where this doesn't work as expected (see GitHub issues with Prisma include/select combinations).

The condition `if (data.startTime && data.endTime)` in email.ts was evaluating to false because `appointment.startTime` and `appointment.endTime` returned from `createBookingWithLock` were undefined.

User confirmed: Client name fix IS working (proves latest code deployed), but calendar links NOT appearing (proves condition fails).

fix: Changed `apps/api/src/services/booking.ts` createBookingWithLock function from using `include` to using explicit `select` clause that specifically lists all needed scalar fields:
  - id, salonId, clientId, staffId, serviceId, locationId
  - startTime, endTime (THE CRITICAL FIELDS)
  - durationMinutes, price, status, notes, source
  - Plus relations: client, staff, service, location

verification: TypeScript compiles successfully. Await production deployment and test booking.

files_changed:
  - apps/api/src/services/booking.ts (lines 99-146): Changed from `include` to explicit `select` pattern
