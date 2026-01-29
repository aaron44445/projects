---
phase: 16-accessibility-compliance
plan: 07
subsystem: ui-components
tags: [accessibility, focus-management, modals, a11y]

dependency-graph:
  requires: [16-01]  # Focus trap library installation
  provides: [modal-focus-restoration]
  affects: [uat-verification]

tech-stack:
  added: []
  patterns: [visibility-hiding-for-focus, explicit-escape-handlers]

key-files:
  created: []
  modified:
    - packages/ui/src/components/Modal.tsx
    - apps/web/src/components/BookingModal.tsx

decisions:
  - id: visibility-hiding-pattern
    choice: "Use hidden class instead of conditional rendering for modals"
    reason: "FocusTrap's returnFocusOnDeactivate needs DOM to persist briefly"
  - id: explicit-escape-handlers
    choice: "Add manual escape key handlers since escapeDeactivates is false"
    reason: "Maintain control over escape behavior while still closing modals"

metrics:
  duration: ~2min
  completed: 2026-01-29
---

# Phase 16 Plan 07: Fix Modal Focus Trap Summary

**One-liner:** Replaced conditional rendering with visibility hiding to allow FocusTrap focus restoration.

## What Was Done

### Task 1: Fix Modal.tsx focus restoration
**Commit:** 95c230d

Modified `packages/ui/src/components/Modal.tsx`:
- Removed `if (!isOpen) return null;` early return pattern
- Added visibility-based hiding: `className={cn("fixed...", !isOpen && "hidden")}`
- Added `aria-hidden={!isOpen}` for accessibility when modal is hidden
- Changed FocusTrap `active={true}` to `active={isOpen}`

This change allows the focus-trap-react library's `returnFocusOnDeactivate` option to work properly by keeping the DOM intact when modal closes.

### Task 2: Fix BookingModal.tsx focus restoration
**Commit:** bc9c611

Modified `apps/web/src/components/BookingModal.tsx`:
- Removed `if (!isOpen) return null;` early return pattern
- Added visibility-based hiding using template string
- Added `aria-hidden={!isOpen}` for accessibility
- Changed FocusTrap `active={true}` to `active={isOpen}`
- Added explicit `handleEscape` useEffect for manual escape key handling

## Why This Matters

UAT Gap 1 revealed that focus wasn't returning to trigger elements when modals closed. The root cause was that `if (!isOpen) return null` unmounted the FocusTrap component immediately, before focus-trap-react could execute its `returnFocusOnDeactivate` logic.

By keeping the modal in the DOM (but visually hidden), the FocusTrap has time to properly deactivate and restore focus to the element that opened the modal.

## Technical Pattern

```tsx
// BEFORE (broken focus restoration):
if (!isOpen) return null;
return <div>...</div>;

// AFTER (working focus restoration):
return (
  <div className={!isOpen ? "hidden" : ""} aria-hidden={!isOpen}>
    <FocusTrap active={isOpen}>...</FocusTrap>
  </div>
);
```

## Files Modified

| File | Changes |
|------|---------|
| packages/ui/src/components/Modal.tsx | Visibility hiding, aria-hidden, FocusTrap active prop |
| apps/web/src/components/BookingModal.tsx | Visibility hiding, aria-hidden, FocusTrap active prop, escape handler |

## Verification

- TypeScript compilation: PASSED
- Both packages/ui and apps/web type-check successfully

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

Gap closure plan 07 complete. Focus restoration should now work for both Modal and BookingModal components. This can be verified in UAT by:
1. Opening a modal
2. Pressing Escape or clicking close
3. Confirming focus returns to the button/element that triggered the modal
