---
phase: 05-notification-system
plan: 04
subsystem: api
tags: [notifications, cron, settings, json, reminder-timing]

# Dependency graph
requires:
  - phase: 05-01
    provides: Notification foundation with email/SMS services and NotificationLog tracking
provides:
  - Configurable reminder timing per salon (1-168 hours)
  - API endpoints for managing notification settings
  - Channel-level control (email/sms can be enabled/disabled)
  - Per-salon reminder enable/disable
affects: [05-03, notifications, settings, admin-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - JSON-based salon settings storage
    - Per-salon notification configuration
    - Dynamic ReminderType generation from settings

key-files:
  created: []
  modified:
    - apps/api/src/routes/salon.ts
    - apps/api/src/cron/appointmentReminders.ts

key-decisions:
  - "NotificationSettings interface matches between salon.ts and appointmentReminders.ts for consistency"
  - "ReminderType changed from enum to string to support dynamic timing values"
  - "Default settings provide backward compatibility (24h and 2h reminders)"
  - "Timing validation limits to 1-168 hours (1 week max)"
  - "Only owner/admin roles can modify notification settings for security"
  - "Salons without notification_settings JSON use sensible defaults"

patterns-established:
  - "JSON settings pattern: Parse with try/catch, fall back to defaults on error"
  - "Settings merge pattern: Merge incoming changes with existing settings"
  - "Per-salon iteration pattern: Loop through salons, apply their settings"

# Metrics
duration: 7min
completed: 2026-01-26
---

# Phase 5 Plan 4: Configurable Reminder Timing Summary

**Per-salon reminder timing configuration (1-168 hours) with channel control and API endpoints for notification settings management**

## Performance

- **Duration:** 7 min
- **Started:** 2026-01-26T00:53:45Z
- **Completed:** 2026-01-26T01:00:37Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- API endpoints (GET/PUT) for managing salon notification settings
- Configurable reminder timing per salon (any hours between 1-168)
- Email and SMS channels can be independently enabled/disabled
- Cron job respects per-salon timing and channel configuration
- Backward compatible with existing salons (defaults to 24h + 2h)

## Task Commits

Each task was committed atomically:

1. **Task 1: Define notification settings structure and API** - `68345ff` (feat)
2. **Task 2: Update cron job for configurable reminder timing** - `cacaff8` (feat)

## Files Created/Modified
- `apps/api/src/routes/salon.ts` - Added GET/PUT /notification-settings endpoints with validation
- `apps/api/src/cron/appointmentReminders.ts` - Updated to read salon settings and process dynamic timings

## Decisions Made

**1. NotificationSettings interface duplicated between files**
- Defined same interface in both salon.ts and appointmentReminders.ts
- Rationale: Avoids circular dependencies, keeps files self-contained
- Future: Could extract to shared types package

**2. ReminderType changed from enum to dynamic string**
- Was: `enum ReminderType { REMINDER_24H, REMINDER_2H }`
- Now: `type ReminderType = string` (e.g., 'REMINDER_48H', 'REMINDER_2H')
- Rationale: Supports salon-specific timing values (any hours 1-168)
- Impact: Maintains backward compatibility with existing reminder types

**3. Timing validation range: 1-168 hours**
- Minimum 1 hour prevents near-instant reminders
- Maximum 168 hours (1 week) prevents excessive advance notices
- Rationale: Reasonable boundaries for appointment reminders

**4. Settings access control: owner/admin only**
- Only owner and admin roles can update notification settings
- Staff and manager roles cannot change reminder timing
- Rationale: Prevents unauthorized changes to business notification policies

**5. Default settings provide backward compatibility**
- New field default: `notification_settings: "{}"`
- Parser falls back to DEFAULT_NOTIFICATION_SETTINGS
- Defaults: 24h + 2h reminders, both channels enabled
- Rationale: Existing salons continue working without migration

**6. Channel configuration respected at send time**
- Email sent only if `channels.email === true` AND client prefers email
- SMS sent only if `channels.sms === true` AND client prefers SMS
- Rationale: Salon-level control overrides client preference (business policy)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for:**
- Plan 05-03 (Automated Reminder Jobs) can now use configured timing
- Frontend settings UI can use GET/PUT /notification-settings endpoints
- Admin dashboard can display/edit reminder timing per salon

**Notes:**
- Email templates currently hardcoded for 24h vs 2h (generic "soon" for other timings)
- Future enhancement: Dynamic email templates based on actual timing
- Future enhancement: Time-of-day preferences (send at specific hours)

---
*Phase: 05-notification-system*
*Completed: 2026-01-26*
