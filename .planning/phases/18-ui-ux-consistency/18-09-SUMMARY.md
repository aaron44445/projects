---
phase: 18
plan: "09"
subsystem: modal-components
tags: [modal, ui-consistency, accessibility, focus-trap]
requires: []
provides: [unified-modal-pattern]
affects: []
decisions: []
tech-stack:
  added: []
  patterns: [packages-ui-modal]
key-files:
  created: []
  modified:
    - apps/web/src/app/staff/page.tsx
    - apps/web/src/app/staff/schedule/page.tsx
    - apps/web/src/app/staff/time-off/page.tsx
    - apps/web/src/app/portal/data/page.tsx
metrics:
  duration: "12 minutes"
  completed: "2026-01-29"
---

# Phase 18 Plan 09: Staff, Schedule, Time-Off, Portal Modals Migration Summary

Migrated staff, staff/schedule, staff/time-off, and portal/data page modals to packages/ui Modal.

## What Was Done

### Task 1: Staff Page Modal Migration
Replaced 3 custom FocusTrap-wrapped modals with packages/ui Modal:
- Location Assignment Modal
- New/Edit Staff Modal
- Delete Confirmation Modal

Removed:
- Manual FocusTrap import and usage
- useId hooks for ARIA IDs (Modal handles accessibility)
- Custom escape key handlers (Modal provides this)
- Fixed inset-0 z-50/z-60 overlay patterns

### Task 2: Staff Schedule Page Modal Migration
Updated TimeOffRequestModal component:
- Added isOpen prop for controlled visibility
- Replaced custom overlay with Modal component
- Modal already uses packages/ui Modal pattern

### Task 3: Staff Time-Off and Portal Data Modal Migration
Staff time-off page:
- New Request Modal migrated to packages/ui Modal
- Delete Confirmation Modal migrated to packages/ui Modal

Portal data page:
- DeleteAccountModal migrated to packages/ui Modal
- Removed `if (!isOpen) return null` pattern
- Added description prop for modal subtitle

## Commits

| Commit | Description | Files |
|--------|-------------|-------|
| 51552e5 | Staff page modal migration | apps/web/src/app/staff/page.tsx |
| 21fe0c0 | Staff time-off page modal migration | apps/web/src/app/staff/time-off/page.tsx |
| 8a2b533 | Portal data page modal migration | apps/web/src/app/portal/data/page.tsx |

Note: Staff schedule page was already migrated in a previous session (Modal import present, no custom patterns).

## Verification

- [x] Staff page uses packages/ui Modal
- [x] Staff schedule page uses packages/ui Modal
- [x] Staff time-off page uses packages/ui Modal
- [x] Portal data page uses packages/ui Modal
- [x] No custom fixed inset-0 z-50+ modal patterns in these files
- [x] TypeScript compiles without errors
- [x] All 4 pages import Modal from @peacase/ui

## Deviations from Plan

None - plan executed exactly as written.

## Files Modified

1. **apps/web/src/app/staff/page.tsx**
   - Removed FocusTrap and useId imports
   - Removed escape key handler useEffect
   - Replaced 3 modals with packages/ui Modal

2. **apps/web/src/app/staff/schedule/page.tsx**
   - Already migrated (Modal import present)
   - TimeOffRequestModal uses Modal component

3. **apps/web/src/app/staff/time-off/page.tsx**
   - Added Modal import
   - Replaced 2 custom modals with packages/ui Modal

4. **apps/web/src/app/portal/data/page.tsx**
   - Added Modal import
   - Replaced DeleteAccountModal implementation with Modal

## Impact

This completes part 4 of Gap 1 (UI-01) closure - remaining pages with modals now use the unified packages/ui Modal component, ensuring consistent:
- Accessibility (ARIA attributes, focus trap)
- Escape key behavior
- Overlay styling
- Animation patterns
