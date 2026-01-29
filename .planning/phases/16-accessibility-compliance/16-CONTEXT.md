# Phase 16: Accessibility Compliance - Context

**Gathered:** 2026-01-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Application meets WCAG 2.1 AA standards for keyboard and screen reader users. Specifically: modal focus trapping, screen reader announcements for booking widget, skip-to-content navigation, and text contrast compliance.

</domain>

<decisions>
## Implementation Decisions

### Focus Trapping (A11Y-01)
- Modals must trap focus when open (Tab cycles within modal only)
- Pressing Escape closes modal and returns focus to trigger element
- Use existing Dialog/Modal component patterns from packages/ui

### Screen Reader Announcements (A11Y-02)
- Booking widget time slots must have descriptive ARIA labels
- Format: "9:00 AM, available" or "9:00 AM, booked"
- Use aria-live regions for dynamic updates (slot selection feedback)

### Skip Navigation (A11Y-03)
- Skip link appears as first focusable element on every page
- Visible only on keyboard focus (not always visible)
- Target: main content area with id="main-content"
- Text: "Skip to main content"

### Color Contrast (A11Y-04)
- All body text must use charcoal/80 or darker (4.5:1 minimum ratio)
- Audit existing gray text and upgrade to compliant values
- Use design tokens for consistency (no hardcoded hex)

### Claude's Discretion
- Specific focus-trap library choice (or native implementation)
- Exact ARIA role patterns for booking calendar
- Skip link styling and animation
- Which specific elements need contrast fixes

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard WCAG 2.1 AA approaches. Follow established accessibility patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 16-accessibility-compliance*
*Context gathered: 2026-01-28*
