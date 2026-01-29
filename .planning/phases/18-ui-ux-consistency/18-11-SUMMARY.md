---
phase: 18
plan: 11
subsystem: ui-design-tokens
tags: [rose, error-states, design-system, gap-closure]
depends_on:
  requires: [18-02, 18-03]
  provides: [rose-token-migration-medium-pages]
  affects: []
tech-stack:
  added: []
  patterns: [rose-design-tokens, error-state-styling]
key-files:
  created: []
  modified:
    - apps/web/src/app/marketing/page.tsx
    - apps/web/src/app/gift-cards/page.tsx
    - apps/web/src/app/notifications/page.tsx
    - apps/web/src/app/packages/page.tsx
decisions:
  - Use bg-rose/10, border-rose/20, text-rose-dark pattern for all error states
  - Standardize both light and dark mode using rose tokens
  - Also migrate green/blue status colors to sage/lavender tokens for consistency
metrics:
  duration: ~18 minutes
  completed: 2026-01-29
---

# Phase 18 Plan 11: Medium Page Rose Migration Summary

Migrated marketing, gift-cards, notifications, and packages pages from hardcoded red colors to rose design tokens.

## What Changed

### Marketing Page (10+ replacements)
- Error state banners: `bg-red-50` -> `bg-rose/10`, `border-red-200` -> `border-rose/20`
- Error icons: `text-red-500` -> `text-rose-dark`
- Error text: `text-red-700` -> `text-rose-dark`
- Retry button: `bg-red-100` -> `bg-rose/20`

### Gift-Cards Page (8+ replacements)
- Page-level error state: `text-red-500` -> `text-rose-dark`
- Cancelled status badge: `bg-red-100 text-red-700` -> `bg-rose/10 text-rose-dark`
- Balance error modal: `bg-red-50` -> `bg-rose/10`, `border-red-200` -> `border-rose/20`
- Redeem error modal: Same pattern applied

### Notifications Page (8+ replacements)
- Failed status icon: `text-red-500` -> `text-rose-dark`
- Failed badge: `bg-red-100 text-red-800` -> `bg-rose/10 text-rose-dark`
- Failed stats count: `text-red-600` -> `text-rose-dark`
- Error message: `text-red-500` -> `text-rose-dark`
- Also migrated delivered (green) to sage tokens and sent (blue) to lavender tokens

### Packages Page (5+ replacements)
- Page error icon: `text-red-500` -> `text-rose-dark`
- Delete buttons: `text-red-600` -> `text-rose-dark`
- Inactive member status: `text-red-600` -> `text-rose-dark`

## Verification

- [x] Marketing page uses rose design tokens
- [x] Gift-cards page uses rose design tokens
- [x] Notifications page uses rose design tokens
- [x] Packages page uses rose design tokens
- [x] No hardcoded red patterns remain in these files
- [x] TypeScript compiles without errors

## Decisions Made

1. **Pattern standardization**: All error states now use `bg-rose/10 border-rose/20 text-rose-dark` for consistency
2. **Dark mode simplification**: Use `bg-rose/20` in dark mode instead of complex `dark:bg-red-900/30` patterns
3. **Full status color migration**: In notifications page, also migrated green (delivered) to sage and blue (sent) to lavender tokens for complete design system compliance

## Deviations from Plan

### Auto-added Improvements

**[Rule 2 - Missing Critical] Migrated green/blue status colors in notifications**
- **Found during:** Task 3
- **Issue:** While migrating red colors, noticed green (delivered) and blue (sent) status colors were also using hardcoded Tailwind colors
- **Fix:** Migrated to sage-dark/lavender-dark tokens for design system consistency
- **Files modified:** notifications/page.tsx

## Commits

| Hash | Message |
|------|---------|
| 6d8d38b | feat(18-11): migrate marketing page to rose design tokens |
| 427134d | feat(18-11): migrate gift-cards page to rose design tokens |
| c77cd80 | feat(18-11): migrate notifications and packages pages to rose design tokens |

## Next Phase Readiness

This completes Gap 3 (UI-03) part 2. The medium-sized pages are now fully migrated to rose design tokens. Remaining work for Gap 3 would include any remaining pages with hardcoded red colors.
