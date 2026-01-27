---
status: resolved
trigger: "Calendar links still not appearing in booking confirmation emails after fix in commit 5702a3a"
created: 2026-01-26T22:00:00Z
updated: 2026-01-26T22:30:00Z
---

## Current Focus

hypothesis: CONFIRMED - The commit 5702a3a changed source but dist was never rebuilt
test: Compare source and dist file contents and timestamps
expecting: Source has explicit select, dist has old include pattern
next_action: Rebuild the API and redeploy

## Symptoms

expected: Booking confirmation email should include "Add to Calendar" section with links for Google Calendar, Outlook, Yahoo, and Apple Calendar (ICS download)
actual: Neither desktop nor mobile email includes add to calendar options - calendar links still missing after "fix"
errors: None reported - section simply not appearing
reproduction: Book an appointment and check confirmation email
started: Issue persisted after commit 5702a3a which was supposed to fix it

## Eliminated

- hypothesis: startTime/endTime not being passed to sendNotification
  evidence: public.ts lines 883-885 correctly passes startTime, endTime, salonTimezone
  timestamp: 2026-01-26T22:10:00Z

- hypothesis: NotificationPayload interface missing fields
  evidence: Interface has startTime, endTime, salonTimezone defined (lines 21-23)
  timestamp: 2026-01-26T22:10:00Z

- hypothesis: appointmentConfirmationEmail logic wrong
  evidence: Condition `if (data.startTime && data.endTime)` is correct (line 164)
  timestamp: 2026-01-26T22:10:00Z

## Evidence

- timestamp: 2026-01-26T22:15:00Z
  checked: apps/api/src/services/booking.ts (source)
  found: Lines 119-146 use explicit `select` with `startTime: true, endTime: true`
  implication: Source code has the fix

- timestamp: 2026-01-26T22:16:00Z
  checked: apps/api/dist/services/booking.js (built)
  found: Lines 88-101 use `include` pattern WITHOUT explicit startTime/endTime selection
  implication: Built code does NOT have the fix - still using old include pattern

- timestamp: 2026-01-26T22:17:00Z
  checked: File modification timestamps
  found: |
    - Source booking.ts: Modified 2026-01-26 16:44 (NEWER)
    - Built booking.js: Modified 2026-01-26 13:28 (OLDER - 3+ hours before source change)
    - Commit 5702a3a: Created 2026-01-26 16:47
  implication: Build predates the fix commit by over 3 hours - fix was NEVER BUILT

- timestamp: 2026-01-26T22:18:00Z
  checked: Git commit 5702a3a contents
  found: Commit message says "fix: use explicit select to ensure startTime/endTime in booking response"
  implication: The fix exists in git but was not deployed

## Resolution

root_cause: **Build/deploy mismatch** - The fix in commit 5702a3a correctly changed booking.ts from `include` to explicit `select` with startTime/endTime, but the dist files were NEVER REBUILT after the commit. The deployed code is still running the old version with `include`, which has the known Prisma edge case where scalar fields may not be reliably returned.

Specifically:
- Source `apps/api/src/services/booking.ts` has explicit `select: { startTime: true, endTime: true, ... }`
- Built `apps/api/dist/services/booking.js` still has `include: { client: { select: ... }, ... }` without scalar field selection
- This means `appointment.startTime` and `appointment.endTime` may be undefined at runtime
- The condition `if (data.startTime && data.endTime)` in email.ts evaluates to false
- Calendar links section is never generated

fix: Rebuild the API project to regenerate dist files with the source changes:
```bash
cd apps/api
npm run build
```

Then redeploy the API.

**FIX APPLIED:** Rebuilt API at 2026-01-26 17:12. Verified dist/services/booking.js now contains:
- Line 90: `select: {`
- Line 97: `startTime: true,`
- Line 98: `endTime: true,`

verification: After rebuild and deploy:
1. [x] Check dist/services/booking.js contains `select: { ... startTime: true, endTime: true, ... }` - VERIFIED
2. [ ] Redeploy API to production
3. [ ] Book a new appointment
4. [ ] Verify confirmation email contains "Add to Calendar" section

files_changed:
  - apps/api/dist/services/booking.js (regenerated with correct select pattern)
