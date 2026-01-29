---
phase: 22
plan: 02
subsystem: staff-portal-time-tracking
status: complete
completed: 2026-01-29
duration: 5.3 minutes
requires: [22-01]
provides:
  - Time clock UI for staff portal
  - Clock in/out functionality with status display
  - Time entry history view with timezone-aware formatting
affects: []
tech-stack:
  added: []
  patterns:
    - date-fns-tz for timezone-aware formatting
    - Primary location detection from staff.assignedLocations
key-files:
  created:
    - apps/web/src/hooks/useTimeClock.ts
  modified:
    - apps/web/src/app/staff/dashboard/page.tsx
decisions: []
tags: [staff-portal, time-tracking, time-clock, ui, hooks, timezone]
---

# Phase 22 Plan 02: Time Clock UI & History View Summary

**One-liner:** Staff dashboard time clock UI with tap-to-clock in/out button, timezone-aware history, and visual status indicators.

## What Was Built

### Hook Layer
- **useTimeClock hook** (`apps/web/src/hooks/useTimeClock.ts`)
  - Manages time clock state (status, history)
  - Provides clockIn/clockOut functions
  - Separate loading states for status and history
  - Auto-fetches data on mount
  - Follows existing hook patterns (useStaffPortal, useTimeOff)

### UI Layer
- **Time Clock Section** in staff dashboard
  - Prominent clock button showing current status
  - Visual distinction: sage for clocked in (with pulse animation), gray for not clocked in
  - Shows "Clocked in since [time]" with location name
  - Clock in/out button with loading states
  - Error display for failed operations

- **Time History Section**
  - Recent 10 time entries displayed
  - Grouped by date with duration display
  - Timezone-aware formatting using date-fns-tz
  - Active entries visually distinct (sage/5 background, sage/20 border)
  - Completed entries show duration (Xh Ym format)
  - Active entries show "In progress" badge
  - EmptyState when no history exists

### Technical Implementation
- **Primary location detection**: Uses `staff.assignedLocations.find(l => l.isPrimary)` from StaffAuthContext
- **Timezone formatting**: Uses `formatInTimeZone` and `parseISO` from date-fns-tz/date-fns
- **Error handling**: Displays user-friendly errors for clock operations
- **Loading states**: Separate loaders for initial fetch vs history fetch

## Verification

✅ useTimeClock hook created with status, history, clockIn, clockOut functions
✅ Time Clock section visible on staff dashboard
✅ Shows "Not clocked in" when staff not clocked in
✅ Shows "Clocked in since X:XX" with location when clocked in
✅ Clock in button works (creates entry, updates status)
✅ Clock out button works (completes entry, shows confirmation)
✅ History displays with dates, times, durations
✅ Times shown in location timezone (not UTC)
✅ Active entries visually distinct from completed
✅ EmptyState shown when no history
✅ Error handling for failed operations
✅ TypeScript compiles without errors

## Commits

| Task | Commit | Files Changed | Description |
|------|--------|---------------|-------------|
| 1 | 5faa614 | apps/web/src/hooks/useTimeClock.ts | Create useTimeClock hook for state management |
| 2 | ec042df | apps/web/src/app/staff/dashboard/page.tsx | Add Time Clock UI to staff dashboard |

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Phase 22 Plan 03** can proceed immediately. The time clock UI is functional and ready for staff use.

**What's ready:**
- Time clock hook with full API integration
- Staff can clock in/out from dashboard
- History view shows timezone-aware entries
- Visual status indicators working

**No blockers identified.**

---

*Completed: 2026-01-29*
*Duration: 5.3 minutes*
*Files: 2 created/modified, 2 commits*
