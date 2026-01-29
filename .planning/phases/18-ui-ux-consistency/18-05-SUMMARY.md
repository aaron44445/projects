---
phase: 18-ui-ux-consistency
plan: 05
subsystem: ui-constants
tags: [status-colors, design-system, consistency, gap-closure]
dependency-graph:
  requires: [18-01]
  provides: [centralized-status-colors-usage]
  affects: []
tech-stack:
  added: []
  patterns:
    - centralized-status-colors
    - status-to-design-token-mapping
key-files:
  created: []
  modified:
    - apps/web/src/app/dashboard/page.tsx
    - apps/web/src/app/reports/page.tsx
    - apps/web/src/app/staff/page.tsx
    - apps/web/src/app/staff/schedule/page.tsx
decisions:
  - id: staff-status-mapping
    choice: Map staff active/inactive to confirmed/draft tokens, keep amber for on-leave
    reason: Staff statuses don't map directly to appointment statuses
  - id: transaction-status-mapping
    choice: Map refunded to cancelled styling (rose colors)
    reason: Refunded is a negative outcome like cancelled
  - id: timeoff-status-mapping
    choice: Map pending to pending, approved to confirmed, rejected to cancelled
    reason: Time off statuses map cleanly to existing design tokens
metrics:
  duration: 21 minutes
  completed: 2026-01-29
---

# Phase 18 Plan 05: Migrate Status Colors to Centralized Constants Summary

Migrated 4 pages from local statusColors definitions to centralized STATUS_COLORS from @/lib/statusColors, closing Gap 2 (UI-02).

## What Changed

### Dashboard Page
- Removed local statusColors definition for appointment statuses
- Added import for STATUS_COLORS and StatusKey
- Created getStatusClasses helper with underscore-to-hyphen normalization
- Updated appointment badge to use centralized colors

### Reports Page
- Removed local statusColors for transaction statuses (completed/pending/refunded)
- Added getTransactionStatusClasses helper
- Mapped refunded to cancelled styling (rose colors)

### Staff Page
- Removed local statusColors for staff statuses (active/inactive/on-leave)
- Added getStaffStatusClasses helper function
- Mapped active to confirmed (sage), inactive to draft (charcoal muted)
- Preserved amber styling for on-leave (unique to staff)

### Staff/Schedule Page
- Removed local statusColors from TimeOffRow component
- Added getTimeOffStatusClasses helper at module level
- Mapped pending to pending (lavender), approved to confirmed, rejected to cancelled
- Updated status icon colors to use design token colors

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Staff status mapping | Map active->confirmed, inactive->draft | Staff statuses don't map 1:1 to appointment statuses |
| On-leave styling | Keep amber (not in STATUS_COLORS) | Unique to staff - no appointment equivalent |
| Transaction refunded | Map to cancelled styling | Both are negative outcomes |
| Time off statuses | Use matching STATUS_COLORS tokens | Clean semantic mapping exists |

## Deviations from Plan

None - plan executed exactly as written.

## Files Modified

| File | Change |
|------|--------|
| apps/web/src/app/dashboard/page.tsx | Removed local statusColors, added centralized import and helper |
| apps/web/src/app/reports/page.tsx | Removed local statusColors, added transaction-specific helper |
| apps/web/src/app/staff/page.tsx | Removed local statusColors, added staff-specific helper |
| apps/web/src/app/staff/schedule/page.tsx | Removed local statusColors from TimeOffRow, added module-level helper |

## Verification

- [x] Dashboard page imports STATUS_COLORS, no local statusColors
- [x] Reports page imports STATUS_COLORS, no local statusColors
- [x] Staff page imports STATUS_COLORS, no local statusColors
- [x] Staff/schedule page imports STATUS_COLORS, no local statusColors
- [x] TypeScript compiles without errors
- [x] No files define local const statusColors in apps/web/src

## Commits

| Hash | Message |
|------|---------|
| 53cd94b | feat(18-05): migrate dashboard to centralized STATUS_COLORS |
| ca8bbef | feat(18-05): migrate reports to centralized STATUS_COLORS |
| 45301d1 | feat(18-05): migrate staff pages to centralized STATUS_COLORS |

## Next Phase Readiness

Gap 2 (UI-02) closed. All status color definitions now use centralized constants.

This completes the gap closure plans for Phase 18. All UI/UX consistency gaps identified in verification have been addressed.
