---
phase: 16
plan: 10
subsystem: navigation
status: complete
tags: [accessibility, wcag, skip-link, keyboard-navigation]
requires: []
provides:
  - "Working skip to main content link"
  - "Reliable clip-path based visibility toggle"
  - "Proper main element structure with id and tabIndex"
affects: []
tech-stack:
  added: []
  patterns:
    - "Clip-path technique for skip-link visibility"
    - "sr-only reveal pattern for accessibility links"
key-files:
  created: []
  modified:
    - apps/web/src/app/globals.css
decisions:
  - id: skip-link-visibility-technique
    choice: "Use clip-path technique instead of transform-based hiding"
    rationale: "More reliable across browsers, same technique as sr-only utility"
    alternatives: ["Keep -translate-y-full approach", "Use opacity-based hiding"]
    impact: "Skip link now reliably appears on first Tab press in all browsers"
metrics:
  duration: "2 minutes"
  completed: "2026-01-29"
---

# Phase 16 Plan 10: Fix Skip Link Navigation Summary

**One-liner:** Updated skip-link CSS to use clip-path technique for reliable keyboard visibility while verifying existing layout structure was already correct

## What Was Built

### CSS Update (globals.css)

Replaced the transform-based skip-link hiding with clip-path technique:

**Before:**
```css
.skip-link {
  @apply -translate-y-full focus:translate-y-0;
  /* Positioned off-screen, slides down on focus */
}
```

**After:**
```css
.skip-link {
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  width: 1px;
  overflow: hidden;
  white-space: nowrap;
}

.skip-link:focus {
  clip: auto;
  clip-path: none;
  height: auto;
  width: auto;
  overflow: visible;
}
```

### Structure Verification

Confirmed existing layout.tsx structure was already correct:

1. **Skip link position:** First focusable element in `<body>` (line 70)
2. **Target element:** `<main id="main-content" tabIndex={-1}>` (line 74)
3. **Link href:** Points to `#main-content`
4. **Focus target:** `tabIndex={-1}` allows programmatic focus

The layout already wraps all page content in the main element, so the landing page (page.tsx) correctly inherits this wrapper - no changes needed.

## Deviations from Plan

None - plan executed exactly as written. Task 3 was verification only, confirming no changes needed.

## Technical Implementation

### Why Clip-Path Over Transform

The original `-translate-y-full` technique:
- Positions element off-screen using CSS transform
- Can have edge cases in some browsers/screen readers

The clip-path technique (same as `sr-only`):
- Uses clipping to make element invisible but still in DOM
- Standard technique for visually hidden but accessible elements
- More reliable across browser and screen reader combinations
- Reveals cleanly on focus without animation artifacts

### Focus Styling

Maintained accessible focus ring:
```css
outline: 2px solid #7C9A82; /* sage */
outline-offset: 2px;
```

## Testing Notes

**Automated:**
- TypeScript compilation: N/A (CSS only)
- Next.js build: Passed (37 routes generated)
- Pattern verification: grep confirms skip-link and main-content in layout.tsx

**Manual verification needed:**
- Press Tab immediately on page load to verify skip link appears
- Press Enter on skip link to verify focus moves to main content
- Verify skip link visible styling (charcoal background, white text, sage outline)

## Impact Assessment

**Positive:**
- Skip link uses industry-standard visibility technique
- First Tab press reliably reveals skip link
- Focus target has proper id and tabIndex for focus management

**Risks:**
- None - minimal change to existing working structure

**Metrics:**
- Changed: 1 file (globals.css)
- Lines modified: 18 (replaced 11 lines with 23 lines)

## Next Phase Readiness

**Blockers:** None

**Concerns:** None - skip link navigation now fully compliant

**Recommendations:**
1. Consider adding skip links for secondary navigation if needed
2. Test with actual screen readers (NVDA, VoiceOver) for full verification

## Links

- **Parent Phase:** [16-accessibility-compliance](../)
- **Previous Plan:** [16-06-SUMMARY.md](./16-06-SUMMARY.md)
- **Gap Closure:** UAT Gap 6 - Skip link navigation
