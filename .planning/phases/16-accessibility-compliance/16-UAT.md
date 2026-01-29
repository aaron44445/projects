---
status: diagnosed
phase: 16-accessibility-compliance
source: 16-01-SUMMARY.md, 16-02-SUMMARY.md, 16-03-SUMMARY.md, 16-04-SUMMARY.md, 16-05-SUMMARY.md, 16-06-SUMMARY.md
started: 2026-01-29T10:00:00Z
updated: 2026-01-29T10:30:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Modal Focus Trap
expected: Opening a modal traps Tab focus within it. Pressing Escape closes modal and returns focus to the trigger button.
result: issue
reported: "Focus escapes modal to sidebar (Clients link). Escape key doesn't close modal. Focus goes to BODY instead of trigger button on close. Missing role=dialog, aria-modal=true, aria-labelledby. 17 focusable elements in modal but 39 total accessible via Tab."
severity: blocker

### 2. Modal Screen Reader Announcements
expected: When modal opens, screen reader announces it as a "dialog". Modal title is announced. Close button is labeled "Close".
result: issue
reported: "No role=dialog, no aria-modal=true, no aria-labelledby/aria-label for title, close button has no aria-label (just SVG icon). Screen reader users would only hear 'button' with no context."
severity: blocker

### 3. Time Slot Availability Announcements
expected: In booking widget date/time step, navigating time slot buttons with arrow keys announces "{time}, available" or "{time}, unavailable".
result: issue
reported: "All time slot buttons have aria-label: null. No role=radiogroup on container, no role=radio on buttons. No aria-checked/aria-pressed for selection state. Screen readers only hear 'button, 9:00 AM' with no availability info."
severity: blocker

### 4. Time Slot Selection Confirmation
expected: Clicking an available time slot announces "{time} selected" via screen reader.
result: issue
reported: "Zero aria-live regions exist on the page. No role=status or sr-only announcement containers. No aria-pressed/selected/checked on buttons. Page navigates to next step immediately with no announcement. Complete absence of announcement infrastructure."
severity: blocker

### 5. Date Button Selection State
expected: In booking widget, date buttons announce selection state. Selected date says "{date}, selected". Unselected says "{date}, select this date".
result: issue
reported: "All 30 date buttons have aria-label: null. No aria-pressed/selected/checked attributes. No role=radiogroup container. Selection state only conveyed through visual styling. 0% of buttons have proper ARIA."
severity: blocker

### 6. Skip to Main Content Link
expected: Pressing Tab on any page shows "Skip to main content" link at top-left. Pressing Enter moves focus to main content area.
result: issue
reported: "No skip link exists on landing page or booking widget. skipLinksFound: 0. Landing page has no <main> element. Booking widget has <main> but no id attribute. First Tab focuses help button instead. WCAG 2.4.1 Level A violation."
severity: blocker

### 7. Modal Text Contrast
expected: Text in modals (BookingModal, shared Modal) is clearly readable - no washed-out gray text that's hard to see.
result: pass

### 8. Dashboard Text Contrast
expected: Dashboard page text (stats, appointments, activity) is clearly readable with good contrast.
result: pass

### 9. Landing Page Text Contrast
expected: Landing page text (hero, features, pricing, testimonials) is clearly readable.
result: pass

### 10. Settings Page Text Contrast
expected: Settings page text (labels, descriptions, values) is clearly readable throughout all sections.
result: pass

## Summary

total: 10
passed: 4
issues: 6
pending: 0
skipped: 0

## Gaps

- truth: "Modal traps Tab focus within it, Escape closes modal, focus returns to trigger"
  status: failed
  reason: "User reported: Focus escapes modal to sidebar (Clients link). Escape key doesn't close modal. Focus goes to BODY instead of trigger button on close."
  severity: blocker
  test: 1
  root_cause: "FocusTrap destroyed by 'if (!isOpen) return null' before focus restoration. BookingModal has no escape handler despite escapeDeactivates:false. Add Staff modal uses different implementation than Modal.tsx/BookingModal.tsx"
  artifacts:
    - path: "packages/ui/src/components/Modal.tsx"
      issue: "Line 55: returns null destroying FocusTrap before focus restore"
    - path: "apps/web/src/components/BookingModal.tsx"
      issue: "Line 122: same null return pattern; no escape key handler"
  missing:
    - "Keep modal in DOM with hidden visibility instead of null return"
    - "Add escape key handler to BookingModal"
    - "Investigate which modal component Add Staff modal uses"

- truth: "Modal announces as dialog, title announced, close button labeled"
  status: failed
  reason: "User reported: No role=dialog, no aria-modal=true, no aria-labelledby/aria-label for title, close button has no aria-label."
  severity: blocker
  test: 2
  root_cause: "ARIA attributes ARE in Modal.tsx/BookingModal.tsx code but Add Staff modal may use different component. Conditional rendering (aria-labelledby only when title exists) may cause attributes to not render."
  artifacts:
    - path: "packages/ui/src/components/Modal.tsx"
      issue: "Lines 73-77: ARIA attrs present but conditional on title/description props"
    - path: "apps/web/src/components/BookingModal.tsx"
      issue: "Lines 135-139: ARIA attrs present; need to verify Add Staff modal source"
  missing:
    - "Identify which component renders Add Staff modal"
    - "Ensure ARIA attributes always render (not conditional)"
    - "Add aria-label='Close' to all close buttons"

- truth: "Time slot buttons announce availability status"
  status: failed
  reason: "User reported: All time slot buttons have aria-label: null. No role=radiogroup on container."
  severity: blocker
  test: 3
  root_cause: "Code at embed/[slug]/page.tsx:656 HAS aria-labels but testing shows null. Either different component rendered or attributes not reaching DOM. Missing radiogroup semantics entirely."
  artifacts:
    - path: "apps/web/src/app/embed/[slug]/page.tsx"
      issue: "Line 656: aria-label exists in code but not rendering. Lines 646-669 missing role=radiogroup/radio"
  missing:
    - "Add role='radiogroup' to time slot container"
    - "Add role='radio' and aria-checked to each time button"
    - "Debug why aria-label not rendering in DOM"

- truth: "Time slot selection announces '{time} selected' via aria-live region"
  status: failed
  reason: "User reported: Zero aria-live regions exist on the page."
  severity: blocker
  test: 4
  root_cause: "Code at embed/[slug]/page.tsx:593-600 HAS aria-live region with sr-only class but testing found 0 live regions. Either sr-only CSS missing or component not rendering."
  artifacts:
    - path: "apps/web/src/app/embed/[slug]/page.tsx"
      issue: "Lines 593-600: aria-live region exists in code but not in DOM"
    - path: "apps/web/src/app/globals.css"
      issue: "Line 153: sr-only class should exist - verify it's defined correctly"
  missing:
    - "Debug why aria-live region not rendering"
    - "Verify sr-only class in globals.css"
    - "Ensure announcement state updates trigger re-render"

- truth: "Date buttons announce selection state with '{date}, selected' or 'select this date'"
  status: failed
  reason: "User reported: All 30 date buttons have aria-label: null. No aria-pressed attributes."
  severity: blocker
  test: 5
  root_cause: "Code at embed/[slug]/page.tsx:616-617 HAS aria-label and aria-pressed but testing shows null. Same issue as time slots - attributes in code but not in DOM."
  artifacts:
    - path: "apps/web/src/app/embed/[slug]/page.tsx"
      issue: "Lines 616-617: aria-label and aria-pressed exist but not rendering"
  missing:
    - "Debug why attributes not rendering in DOM"
    - "Add role='radiogroup' to date container"
    - "Add role='radio' and aria-checked to each date button"

- truth: "Skip to main content link appears on Tab and moves focus to main"
  status: failed
  reason: "User reported: No skip link exists on any page. Landing page has no <main> element."
  severity: blocker
  test: 6
  root_cause: "Skip link IS in layout.tsx:70-72 but main element nested inside Providers incorrectly. Landing page (page.tsx) has NO <main> element - just a div wrapper. Individual page <main> elements lack id='main-content'."
  artifacts:
    - path: "apps/web/src/app/layout.tsx"
      issue: "Lines 67-81: skip link exists but <main> incorrectly nested inside Providers"
    - path: "apps/web/src/app/page.tsx"
      issue: "No <main> element at all - returns div wrapper"
  missing:
    - "Move <main id='main-content'> outside Providers in layout.tsx"
    - "Add <main> element to landing page"
    - "Ensure skip link is truly first focusable element"

