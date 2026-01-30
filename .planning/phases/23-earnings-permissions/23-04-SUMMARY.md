---
phase: 23-earnings-permissions
plan: 04
subsystem: ui
tags: [settings, permissions, staff, client-visibility, toggle]

# Dependency graph
requires:
  - phase: 23-01
    provides: staffCanViewClientContact field in database schema
provides:
  - Client visibility toggle in Staff Policies settings
  - Owner can configure staffCanViewClientContact setting
affects: [23-03, staff-portal]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - apps/web/src/hooks/useSalon.ts
    - apps/web/src/app/settings/page.tsx

key-decisions:
  - "Toggle defaults to checked (staffCanViewClientContact defaults to true) matching existing database default"
  - "Placed Client Information Visibility card after Time-Off Approval card in Staff Policies section"

patterns-established:
  - "Settings toggle pattern: handler function + checkbox with descriptive label and help text"

# Metrics
duration: 5min
completed: 2026-01-30
---

# Phase 23 Plan 04: Client Visibility Control Summary

**Owner toggle in Staff Policies settings to control whether staff can view full client contact info or only first name + last initial**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-30T03:37:35Z
- **Completed:** 2026-01-30T03:42:21Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added staffCanViewClientContact field to Salon TypeScript interface
- Added Client Information Visibility toggle to Staff Policies settings section
- Toggle includes descriptive help text explaining the privacy behavior

## Task Commits

Each task was committed atomically:

1. **Task 1: Verify staffCanViewClientContact in Salon interface** - `c81569a` (feat)
2. **Task 2: Add client visibility toggle to Staff Policies section** - `8b06c0d` (feat)

## Files Created/Modified
- `apps/web/src/hooks/useSalon.ts` - Added staffCanViewClientContact boolean to Salon interface
- `apps/web/src/app/settings/page.tsx` - Added handleToggleClientVisibility handler and Client Information Visibility card with checkbox toggle

## Decisions Made
- Toggle defaults to checked (staffCanViewClientContact defaults to true) - consistent with database schema default and existing decision in STATE.md
- Positioned Client Information Visibility card after Time-Off Approval card in the natural reading flow of Staff Policies section

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Client visibility control complete for PERM-01 requirement
- Staff portal dashboard (23-03) already implements the client masking logic using this setting
- Owners can now toggle the setting to control staff visibility of client contact info

---
*Phase: 23-earnings-permissions*
*Completed: 2026-01-30*
