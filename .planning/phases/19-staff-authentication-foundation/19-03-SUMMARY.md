---
phase: 19-staff-authentication-foundation
plan: 03
subsystem: api
tags: [staff, invite, email, magic-link, authentication]

# Dependency graph
requires:
  - phase: 19-01
    provides: Portal-specific JWT tokens and staff authentication structure
provides:
  - POST /invite/resend/:staffId endpoint for resending invites
  - inviteStatus field in staff list API responses
  - 72-hour expiry for resent invites
affects: [19-04, 19-05, staff-management-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Invite status computation based on passwordHash and magicLinkExpires"
    - "72-hour expiry for resent invites (shorter than initial 7-day)"

key-files:
  created: []
  modified:
    - apps/api/src/routes/staffPortal.ts
    - apps/api/src/routes/staff.ts

key-decisions:
  - "Resend uses 72-hour expiry (per CONTEXT.md) - shorter than initial 7-day invite"
  - "inviteStatus computed from passwordHash and magicLinkExpires fields"
  - "Three status values: active (password set), invited (valid token), expired (no valid token)"

patterns-established:
  - "getInviteStatus helper for consistent status computation"
  - "Resend endpoint validates staff exists, belongs to salon, and hasn't activated"

# Metrics
duration: 8min
completed: 2026-01-29
---

# Phase 19 Plan 03: Invite Resend and Status Tracking Summary

**Manual invite resend endpoint with 72-hour expiry and invite status tracking in staff list API**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-29T14:00:00Z
- **Completed:** 2026-01-29T14:08:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- POST /invite/resend/:staffId endpoint allows owners to resend invites with fresh 72-hour tokens
- Staff list API now includes inviteStatus field (active/invited/expired) for each staff member
- Resend endpoint validates staff hasn't already activated their account
- Fixed bug in /login endpoint that used undefined generateTokens function

## Task Commits

Each task was committed atomically:

1. **Task 1: Add resend invite endpoint** - `cbfe9b1` (feat)
2. **Task 2: Add invite status to staff list API** - `792670a` (feat)

## Files Created/Modified
- `apps/api/src/routes/staffPortal.ts` - Added POST /invite/resend/:staffId endpoint
- `apps/api/src/routes/staff.ts` - Added getInviteStatus helper and inviteStatus field

## Decisions Made
- Resend uses 72-hour expiry per CONTEXT.md specification (shorter than initial 7-day invite)
- inviteStatus is computed based on passwordHash (set = active) and magicLinkExpires (valid = invited, expired/null = expired)
- Email includes "Reminder" in subject to differentiate from initial invite

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed /login endpoint using undefined functions**
- **Found during:** Task 1 (Add resend invite endpoint)
- **Issue:** /login endpoint at line 553 used undefined `generateTokens` and `REFRESH_TOKEN_EXPIRY_MS`
- **Fix:** Updated to use `generateStaffTokens` with `data.rememberMe` and `STAFF_REFRESH_TOKEN_EXPIRY_MS` / `STAFF_SESSION_TOKEN_EXPIRY_MS`
- **Files modified:** apps/api/src/routes/staffPortal.ts
- **Verification:** grep confirmed no remaining undefined references
- **Committed in:** cbfe9b1 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Bug fix necessary for code to function correctly. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Resend functionality complete, ready for frontend integration
- Invite status tracking complete, ready for staff list UI to display status badges
- AUTH-04 (remember device) and AUTH-05 (password reset) can proceed independently

---
*Phase: 19-staff-authentication-foundation*
*Completed: 2026-01-29*
