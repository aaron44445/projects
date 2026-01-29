---
phase: 16
plan: 09
status: complete
subsystem: booking-widget
tags: [accessibility, aria, radiogroup, booking]

dependency-graph:
  requires: []
  provides:
    - accessible-booking-widget
    - screen-reader-announcements
  affects: []

tech-stack:
  added: []
  patterns:
    - radiogroup-semantics
    - aria-live-announcements

key-files:
  created: []
  modified:
    - apps/web/src/app/embed/[slug]/page.tsx

decisions:
  - id: radiogroup-over-pressed
    choice: Use role="radio" with aria-checked instead of aria-pressed for selection groups
    why: radiogroup semantics are more appropriate for mutually exclusive selections

metrics:
  duration: 7 min
  completed: 2026-01-29
---

# Phase 16 Plan 09: Booking Widget Accessibility Summary

**One-liner:** Added proper radiogroup semantics and aria-live announcements to booking widget date/time picker

## What Was Done

### Task 1: Debug and fix time slot accessibility
Added proper ARIA semantics to the DateTimeStep component:

1. **Date selector container:** Added `role="radiogroup"` with `aria-labelledby="date-label"` to wrap the date buttons
2. **Date buttons:** Added `role="radio"` and `aria-checked={isSelected}`, replaced `aria-pressed` (radiogroup pattern is more appropriate for mutually exclusive selections)
3. **Date selection announcements:** Added `setAnnouncement()` call to trigger aria-live region updates on date change
4. **Time slots container:** Added `role="radiogroup"` with `aria-labelledby="time-label"` to wrap time slot buttons
5. **Time slot buttons:** Added `role="radio"` and `aria-checked={isSelected}` to communicate selection state
6. **Unavailable slot styling:** Improved visual feedback with `bg-gray-100 text-gray-400 cursor-not-allowed` for unavailable slots

## Commits

| Commit | Description | Files |
|--------|-------------|-------|
| 71c46af | feat(16-09): add radiogroup semantics to booking widget datetime picker | apps/web/src/app/embed/[slug]/page.tsx |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added improved unavailable slot styling**
- **Found during:** Task 1
- **Issue:** Unavailable time slots lacked visual distinction besides being disabled
- **Fix:** Added `bg-gray-100 text-gray-400 cursor-not-allowed` styling for unavailable slots
- **Files modified:** apps/web/src/app/embed/[slug]/page.tsx
- **Commit:** 71c46af

## Verification

All success criteria met:
- [x] Time slot container has `role="radiogroup"` with `aria-labelledby`
- [x] Each time slot has `role="radio"` and `aria-checked`
- [x] Date container has `role="radiogroup"` with `aria-labelledby`
- [x] Each date has `role="radio"` and `aria-checked`
- [x] Selection changes trigger aria-live announcements
- [x] aria-live region exists with sr-only class

## Next Phase Readiness

**Pre-existing blockers remain:**
- TypeScript build errors in subscription-related files (unrelated to this work)
- Build errors during static page generation for /login (pre-existing)

These are documented in STATE.md and do not block accessibility work.

---
*Generated: 2026-01-29*
