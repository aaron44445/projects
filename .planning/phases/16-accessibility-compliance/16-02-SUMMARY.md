# Phase 16 Plan 02: Booking Widget Live Regions and Time Slot Labels Summary

**One-liner:** Screen reader announcements for time slot availability and selection in booking widget via ARIA live regions.

---

## Frontmatter

```yaml
phase: 16-accessibility-compliance
plan: 02
subsystem: booking-widget
completed: 2026-01-28
duration: 5 minutes
status: complete

# Dependencies
requires:
  - "16-01 (sr-only utility class for visually-hidden live region)"
provides:
  - "Accessible time slot selection with screen reader feedback"
  - "ARIA live region pattern for dynamic content announcements"
affects:
  - "Future booking widget enhancements requiring accessible dynamic updates"

# Technical
tech-stack:
  added: []
  patterns:
    - "ARIA live regions for screen reader announcements"
    - "Descriptive aria-labels with state information"
    - "Visually-hidden status announcements (sr-only)"

# Key Changes
key-files:
  created: []
  modified:
    - path: "apps/web/src/app/embed/[slug]/page.tsx"
      purpose: "Added ARIA live region and aria-labels to DateTimeStep component"
      key-exports: ["DateTimeStep"]

# Decisions
decisions:
  - id: "aria-live-polite"
    title: "Use aria-live=polite instead of assertive"
    context: "Screen readers can interrupt or queue announcements"
    decision: "Used aria-live='polite' for non-urgent time slot selections"
    alternatives:
      - "aria-live='assertive' - would interrupt current announcements"
    rationale: "Time slot selection is not urgent enough to interrupt other content"
    impact: "Announcements wait for current speech to finish, better UX"

  - id: "availability-in-label"
    title: "Include availability status in aria-label"
    context: "Screen readers need to know if slot is available before selecting"
    decision: "Added 'available' or 'unavailable' to each time slot button aria-label"
    alternatives:
      - "Only announce availability on selection"
      - "Use aria-disabled without availability text"
    rationale: "Users need availability info before clicking, not after"
    impact: "Screen reader users can efficiently scan available slots"

  - id: "selection-confirmation"
    title: "Announce selection in live region"
    context: "Users need confirmation when time slot is selected"
    decision: "Update live region with '{time} selected' on click"
    alternatives:
      - "No announcement (rely on visual feedback only)"
      - "Announce full appointment details"
    rationale: "Brief confirmation is sufficient, full details shown in summary"
    impact: "Immediate feedback without overwhelming information"

# Metrics
metrics:
  tasks-completed: 2
  commits: 2
  files-changed: 1
  tests-added: 0
  accessibility-score: "Improved WCAG 2.1 Level A compliance for dynamic content"
```

---

## What Was Done

### Objective
Add ARIA live region and descriptive labels to booking widget time slots so screen reader users receive announcements about availability and selection confirmation.

### Changes Made

**1. ARIA Live Region (Task 1)**
- Added `announcement` state to DateTimeStep component
- Created visually-hidden live region with:
  - `role="status"` - identifies as status update
  - `aria-live="polite"` - queues announcements without interrupting
  - `aria-atomic="true"` - announces entire message when updated
  - `className="sr-only"` - visually hidden but accessible to screen readers

**2. Time Slot Accessibility (Task 2)**
- Added `aria-label` to each time slot button with format: `{time}, {available|unavailable}`
- Updated onClick handler to announce selection: `setAnnouncement(\`${formatTime(slot.time)} selected\`)`
- Added `disabled={slot.available === false}` for unavailable slots

### Before/After

**Before:**
```tsx
<button
  key={slot.time}
  onClick={() => onTimeSelect(slot.time)}
  className={...}
>
  {formatTime(slot.time)}
</button>
```

**After:**
```tsx
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {announcement}
</div>

<button
  key={slot.time}
  onClick={() => {
    setAnnouncement(`${formatTime(slot.time)} selected`);
    onTimeSelect(slot.time);
  }}
  aria-label={`${formatTime(slot.time)}, ${slot.available !== false ? 'available' : 'unavailable'}`}
  disabled={slot.available === false}
  className={...}
>
  {formatTime(slot.time)}
</button>
```

---

## Technical Details

### ARIA Live Region Pattern

Live regions announce dynamic content changes to screen readers without requiring focus.

**Structure:**
```tsx
const [announcement, setAnnouncement] = useState('');

<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
  {announcement}
</div>
```

**How it works:**
1. Component state `announcement` starts empty
2. User clicks time slot button
3. onClick updates `announcement` state
4. React re-renders live region with new text
5. Screen reader detects change and announces it
6. User hears confirmation without losing context

**Why `sr-only`:**
- Sighted users see visual selection feedback
- Screen reader users need audible feedback
- Live region text would be redundant visually
- `sr-only` makes it accessible but invisible

### Aria-Label with Status

Each time slot button includes current availability state:

```tsx
aria-label={`${formatTime(slot.time)}, ${slot.available !== false ? 'available' : 'unavailable'}`}
```

Screen reader announces: "2:30 PM, available" or "3:00 PM, unavailable"

This allows users to:
- Navigate slots with arrow keys
- Hear availability immediately
- Make informed selection without trial and error

### Integration with Existing Flow

The live region works alongside the existing booking flow:
1. User navigates to DateTimeStep
2. Selects date (triggers availability fetch)
3. Navigates time slot buttons (hears availability)
4. Selects available slot (hears confirmation)
5. Proceeds to next step

No changes to business logic - purely additive accessibility layer.

---

## Verification

### Success Criteria
- [x] Time slot buttons have `aria-label` with time and availability
- [x] Live region with `role="status"` and `aria-live="polite"` exists
- [x] Selecting a time slot updates the live region text

### Manual Testing
To test with screen reader (NVDA/JAWS/VoiceOver):
1. Navigate to booking widget demo at `/embed/demo`
2. Progress to date/time selection step
3. Tab to time slot grid
4. Use arrow keys to navigate slots - should hear "{time}, available/unavailable"
5. Press Enter on available slot - should hear "{time} selected"

### Code Verification
```bash
# Verify aria-label on time slots
grep -A 2 "slot.time" apps/web/src/app/embed/[slug]/page.tsx | grep "aria-label"

# Verify aria-live region
grep "aria-live" apps/web/src/app/embed/[slug]/page.tsx
```

Both checks pass ✅

---

## Deviations from Plan

### Commit Structure Deviation
**Issue:** Task 2 changes were committed under wrong label

**What happened:**
- Task 1: Committed correctly as `b73ce28 feat(16-02): add aria-live region to DateTimeStep`
- Task 2: Changes included in `4bd442c feat(16-03): add sr-only utility class` (mislabeled)

**Impact:** No functional impact - all code is correct and committed. Just inconsistent commit labeling.

**Reason:** Previous execution included task 2 changes in a commit meant for a different plan.

---

## Next Phase Readiness

### Blockers
None.

### Concerns
None.

### Recommendations
1. Test with multiple screen readers (NVDA, JAWS, VoiceOver) to ensure consistent behavior
2. Consider adding similar live region patterns to other dynamic UI updates (e.g., service selection, staff availability)
3. Monitor for ARIA live region announcement timing issues on slower devices

---

## Key Learnings

### What Went Well
- ARIA live region pattern is straightforward and self-contained
- Adding descriptive labels minimal code change with high impact
- Pattern is reusable across other components with dynamic updates

### What Could Be Improved
- Could add aria-describedby for additional context about time slot constraints
- Could announce count of available slots when date changes
- Could provide keyboard shortcuts to jump to first/last available slot

### For Next Time
- Consider batch announcement for multiple related changes (e.g., "5 slots available")
- Test with screen reader users to validate announcement timing and verbosity
- Document live region patterns in component library for reuse

---

## Commits

| Commit | Type | Description | Files |
|--------|------|-------------|-------|
| b73ce28 | feat | Add aria-live region to DateTimeStep | apps/web/src/app/embed/[slug]/page.tsx |
| 4bd442c* | feat | Add aria-label to time slot buttons (mislabeled as 16-03) | apps/web/src/app/embed/[slug]/page.tsx |

*Note: Task 2 commit was mislabeled but contains correct implementation

---

**Summary prepared:** 2026-01-28
**Phase 16 Plan 02 - Complete**
