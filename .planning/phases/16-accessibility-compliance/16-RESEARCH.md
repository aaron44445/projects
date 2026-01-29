# Phase 16: Accessibility Compliance - Research

**Researched:** 2026-01-28
**Domain:** Web Accessibility (WCAG 2.1 AA)
**Confidence:** HIGH

## Summary

WCAG 2.1 Level AA accessibility compliance focuses on four key areas: focus management, screen reader support, keyboard navigation, and visual contrast. The standard approach combines well-established libraries (focus-trap-react, Radix UI), native ARIA attributes (aria-live, aria-label), and design system adjustments to meet minimum contrast ratios.

Modern React applications should integrate accessibility testing early through linting (eslint-plugin-jsx-a11y) and runtime validation (@axe-core/react), though automated tools only catch ~57-60% of issues. Manual testing with screen readers (NVDA, JAWS, VoiceOver) remains essential for validating dynamic interactions like booking widgets.

The European Accessibility Act became legally applicable on June 28, 2025, making WCAG 2.1 AA compliance mandatory in the EU. Combined with ongoing ADA requirements in the US, accessibility is now a legal requirement rather than a best practice.

**Primary recommendation:** Use Radix UI Dialog (already provides focus trap + ARIA), add aria-live regions for booking widget announcements, implement skip link in root layout, and audit/fix text contrast with automated tools before manual verification.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @radix-ui/react-dialog | 1.1.15 | Modal dialogs with built-in accessibility | Industry standard, comprehensive ARIA support, automatic focus management |
| focus-trap-react | 11.0.6 | Focus trapping for modals/overlays | Most popular React wrapper for focus-trap (84k+ weekly downloads), maintained by focus-trap ecosystem |
| eslint-plugin-jsx-a11y | 6.10.2 | Static accessibility linting | Industry standard for JSX accessibility, catches ~30% of issues at development time |
| @axe-core/react | 4.11.0 | Runtime accessibility testing | Deque's accessibility engine (57% issue coverage), integrates with React DevTools |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-focus-lock | 2.13.7 | Alternative focus trap library | Only if focus-trap-react doesn't meet needs (lighter weight, different API) |
| color-contrast-checker | various | CLI/web-based contrast validators | During design audit phase, before manual testing |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| focus-trap-react | Custom useEffect with focus management | Custom solutions miss edge cases (nested traps, returnFocus on portals), extensive testing burden |
| Radix UI Dialog | Native `<dialog>` element | Native dialog includes browser chrome (address bar) in focus trap, requires additional scripting for expected UX |
| @axe-core/react | Manual ARIA audit | Automated testing provides instant feedback, catches common mistakes before QA |

**Installation:**
```bash
npm install focus-trap-react @radix-ui/react-dialog
npm install -D eslint-plugin-jsx-a11y @axe-core/react
```

## Architecture Patterns

### Pattern 1: Modal Focus Trap (Radix UI Dialog)
**What:** Use Radix UI Dialog component which includes automatic focus trap, ARIA attributes, and keyboard handling
**When to use:** All modal dialogs requiring WCAG 2.1 AA compliance
**Example:**
```typescript
// Source: https://www.radix-ui.com/primitives/docs/components/dialog
import * as Dialog from '@radix-ui/react-dialog';

<Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
  <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 bg-black/50" />
    <Dialog.Content
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      onEscapeKeyDown={() => setIsOpen(false)}
      onOpenAutoFocus={(e) => {
        // Optionally customize which element receives focus
        const firstInput = e.currentTarget.querySelector('input');
        firstInput?.focus();
      }}
    >
      <Dialog.Title>Book Appointment</Dialog.Title>
      <Dialog.Description>Select your preferred time slot</Dialog.Description>
      {/* Modal content */}
      <Dialog.Close asChild>
        <button>Close</button>
      </Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

**Built-in features:**
- `role="dialog"` and `aria-modal="true"` automatically applied
- Focus trap activated when dialog opens
- Escape key closes dialog by default
- Focus returns to trigger element on close
- Screen reader announcements via Title/Description

### Pattern 2: Focus Trap for Custom Components (focus-trap-react)
**What:** Wrap non-dialog components (drawers, dropdowns, custom overlays) with FocusTrap component
**When to use:** Custom UI elements that need focus containment but aren't dialogs
**Example:**
```typescript
// Source: https://github.com/focus-trap/focus-trap-react
import FocusTrap from 'focus-trap-react';

<FocusTrap
  active={isActive}
  focusTrapOptions={{
    initialFocus: '#first-input',
    allowOutsideClick: true,
    escapeDeactivates: true,
    onDeactivate: handleClose,
    returnFocusOnDeactivate: true
  }}
>
  <div className="custom-overlay">
    {/* Focusable content */}
  </div>
</FocusTrap>
```

### Pattern 3: ARIA Live Regions for Dynamic Announcements
**What:** Use aria-live regions to announce dynamic content changes to screen readers
**When to use:** Booking widget slot selection, form validation feedback, status updates
**Example:**
```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions

// 1. Create empty live region on mount
<div
  id="booking-status"
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {/* Initially empty */}
</div>

// 2. Update content dynamically when user selects time slot
function handleSlotSelection(time: string) {
  const statusEl = document.getElementById('booking-status');
  if (statusEl) {
    statusEl.textContent = `${time} selected. Proceed to confirm booking.`;
  }
}
```

**Key attributes:**
- `aria-live="polite"` - Announces when user is idle (use for most updates)
- `aria-live="assertive"` - Interrupts current speech (use sparingly, only for critical alerts)
- `aria-atomic="true"` - Announces entire region content (provides context)
- `role="status"` - Semantic role for status messages (implicitly polite)
- `role="alert"` - Semantic role for alerts (implicitly assertive)

### Pattern 4: Descriptive ARIA Labels for Time Slots
**What:** Add aria-label to time slot buttons with full context
**When to use:** Interactive buttons/elements where visible text is insufficient
**Example:**
```typescript
// Source: https://www.aditus.io/aria/aria-label/

interface TimeSlot {
  time: string;
  available: boolean;
  date: Date;
}

function TimeSlotButton({ slot }: { slot: TimeSlot }) {
  const dateStr = slot.date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });

  return (
    <button
      aria-label={`${slot.time}, ${dateStr}, ${slot.available ? 'available' : 'booked'}`}
      disabled={!slot.available}
      onClick={() => handleSlotSelection(slot)}
    >
      {slot.time}
    </button>
  );
}

// Screen reader announces: "9:00 AM, Monday, January 29, 2026, available"
```

### Pattern 5: Skip to Main Content Link
**What:** First focusable element on page that skips navigation and jumps to main content
**When to use:** Every page with repeating navigation elements
**Example:**
```typescript
// Source: https://www.w3.org/TR/WCAG20-TECHS/G1.html

// In root layout:
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main-content"
          className="skip-link"
        >
          Skip to main content
        </a>
        <Navigation />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
      </body>
    </html>
  );
}

// CSS (visible on focus only):
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

### Pattern 6: Contrast-Compliant Design Tokens
**What:** Define color tokens with verified contrast ratios in design system
**When to use:** All text colors, ensuring 4.5:1 minimum for normal text
**Example:**
```typescript
// Tailwind config with WCAG-compliant colors
const config = {
  theme: {
    extend: {
      colors: {
        // ✓ 4.5:1+ contrast on white background
        'text-primary': '#1A1A1A',     // ~14:1 ratio
        'text-secondary': '#4A4A4A',   // ~9:1 ratio
        'text-muted': '#7A7A7A',       // ~4.6:1 ratio

        // ✗ Avoid these for body text
        // 'text-light': '#B0B0B0',    // Only 2.7:1 ratio
      }
    }
  }
}

// Use semantic tokens, not opacity modifiers
<p className="text-text-primary">High contrast text</p>  // ✓ Correct
<p className="text-charcoal/60">Low contrast text</p>    // ✗ May fail 4.5:1
```

### Anti-Patterns to Avoid
- **Manual focus management in modals:** Don't build custom focus trap logic with useEffect—use focus-trap-react or Radix UI instead. Edge cases (nested modals, portal components, browser quirks) are already handled.
- **Opacity modifiers for text color:** Avoid `text-charcoal/70` or similar Tailwind opacity modifiers for body text. Use semantic color tokens with verified contrast ratios instead.
- **Missing aria-label on icon-only buttons:** Close buttons with only an X icon need `aria-label="Close"` for screen reader users.
- **Using div/span for interactive elements:** Always use semantic HTML (`<button>`, `<a>`) rather than `<div onClick>` for keyboard accessibility.
- **Hardcoded color values:** Don't use inline styles or hex codes (`#888`) for text. Use design system tokens that have been audited for contrast.
- **Live regions that aren't empty on load:** aria-live regions must be empty when first added to DOM, then populated dynamically. Pre-filled content won't be announced.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal focus trapping | Custom keyboard event handlers, manual focus() calls, document.activeElement tracking | Radix UI Dialog or focus-trap-react | Misses edge cases: nested traps, focus return on portal unmount, browser back button, tabindex=-1 elements, shadow DOM |
| Color contrast validation | Visual inspection, manual contrast calculation | WebAIM Contrast Checker, axe DevTools, or automated CI checks | Human perception is unreliable, calculations are complex (relative luminance formula), automated tools test against actual WCAG algorithm |
| Accessibility testing | Manual screen reader testing only | eslint-plugin-jsx-a11y + @axe-core/react + manual testing | Linting catches 30% of issues instantly, axe catches another 30%, manual testing catches final 40%—skip automated tools and you're debugging blind |
| Skip link functionality | Custom scroll behavior with smooth scrolling animations | Standard anchor link with `href="#main-content"` | Browser handles focus management, works with assistive tech, respects user motion preferences, no JS required |
| ARIA attributes on common patterns | Custom role/aria attributes based on "what feels right" | ARIA Authoring Practices Guide (APG) patterns | W3C documents tested patterns for common UI (modals, tabs, accordions). Custom ARIA is often worse than no ARIA. |

**Key insight:** Accessibility is a solved problem for common UI patterns. The hard work is done by Radix UI, Deque (axe), and W3C. Custom implementations introduce bugs that only appear with assistive technology, which most developers don't test. Use established libraries and patterns.

## Common Pitfalls

### Pitfall 1: Focus Trap Includes Browser Chrome (Native Dialog)
**What goes wrong:** Using native `<dialog>` element results in focus trap that includes browser address bar and UI, not just modal content
**Why it happens:** Native dialog spec treats entire browser as the trap boundary, which differs from user expectations
**How to avoid:** Use Radix UI Dialog or focus-trap-react which limit trap to modal content only
**Warning signs:** Users can Tab into browser UI while modal is open, breaking expected keyboard flow

### Pitfall 2: ARIA Live Region Pre-Populated on Load
**What goes wrong:** Screen readers don't announce content that's present when live region first appears in DOM
**Why it happens:** Assistive tech only announces *changes* to live regions, not initial state
**How to avoid:** Render empty live region on mount, wait 2+ seconds if adding dynamically, then populate with announcements
**Warning signs:** Status messages aren't announced during testing with NVDA/JAWS despite visible updates

### Pitfall 3: Opacity Modifiers Fail Contrast Requirements
**What goes wrong:** Using `text-charcoal/70` in Tailwind creates ~3:1 contrast ratio, failing WCAG 2.1 AA (needs 4.5:1)
**Why it happens:** Opacity modifiers reduce contrast unpredictably depending on background color
**How to avoid:** Define semantic color tokens (text-primary, text-secondary, text-muted) with verified ratios
**Warning signs:** Automated tools (axe, Lighthouse) flag contrast failures on text that "looks fine" visually

### Pitfall 4: Keyboard Focus Not Visible
**What goes wrong:** Custom focus styles removed or made too subtle, keyboard users can't see current focus
**Why it happens:** Designers remove browser default outline without replacing it with sufficient alternative
**How to avoid:** Ensure focus indicator has 3:1 contrast ratio and is at least 2px thick (WCAG 2.1 SC 1.4.11)
**Warning signs:** Tabbing through page shows no visual indicator, or indicator disappears on certain elements

### Pitfall 5: Missing Focus Return After Modal Close
**What goes wrong:** Closing modal doesn't return focus to trigger element, keyboard user loses place on page
**Why it happens:** Manual modal implementations forget to store and restore previous activeElement
**How to avoid:** Use Radix UI (handles automatically) or focus-trap-react with `returnFocusOnDeactivate: true`
**Warning signs:** After closing modal with Escape, focus is on document body, user must Tab from page start

### Pitfall 6: Icon-Only Buttons Missing Accessible Names
**What goes wrong:** Screen readers announce "button" without describing purpose (e.g., X close button)
**Why it happens:** Developers assume icon is self-explanatory, forget screen reader users can't see it
**How to avoid:** Add `aria-label="Close"` to all icon-only buttons
**Warning signs:** Screen reader announces "button" repeatedly without context

### Pitfall 7: Automated Testing Overconfidence
**What goes wrong:** Team assumes passing axe/eslint means fully accessible, ships inaccessible UI
**Why it happens:** Automated tools catch ~60% of issues, remaining 40% require manual testing
**How to avoid:** Combine automated tools with keyboard-only testing and screen reader validation
**Warning signs:** Automated tests pass but actual keyboard/screen reader usage reveals major issues

## Code Examples

Verified patterns from official sources:

### Focus Trap with Return Focus
```typescript
// Source: https://github.com/focus-trap/focus-trap-react
import FocusTrap from 'focus-trap-react';
import { useRef } from 'react';

function Modal({ isOpen, onClose }) {
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button ref={triggerRef} onClick={() => setIsOpen(true)}>
        Open Modal
      </button>

      {isOpen && (
        <FocusTrap
          focusTrapOptions={{
            onDeactivate: () => {
              onClose();
              triggerRef.current?.focus(); // Return focus
            },
            escapeDeactivates: true,
          }}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <h2 id="modal-title">Modal Title</h2>
            {/* Content */}
          </div>
        </FocusTrap>
      )}
    </>
  );
}
```

### Complete Radix UI Dialog Example
```typescript
// Source: https://www.radix-ui.com/primitives/docs/components/dialog
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

function BookingDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button>Book Appointment</button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md">
          <Dialog.Title className="text-xl font-semibold mb-2">
            Book Appointment
          </Dialog.Title>
          <Dialog.Description className="text-sm text-gray-600 mb-4">
            Select your preferred time slot
          </Dialog.Description>

          {/* Form content */}

          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 p-2"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

### ARIA Live Region for Booking Widget
```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions
import { useState, useEffect } from 'react';

function BookingWidget() {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const handleSlotClick = (time: string, available: boolean) => {
    if (!available) {
      setAnnouncement(`${time} is not available. Please select another time.`);
      return;
    }

    setSelectedSlot(time);
    setAnnouncement(`${time} selected. Proceed to confirm your booking.`);
  };

  return (
    <div>
      {/* Live region - empty on mount */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      {/* Time slot grid */}
      <div className="grid grid-cols-3 gap-2">
        {slots.map((slot) => (
          <button
            key={slot.time}
            onClick={() => handleSlotClick(slot.time, slot.available)}
            disabled={!slot.available}
            aria-label={`${slot.time}, ${slot.available ? 'available' : 'booked'}`}
          >
            {slot.time}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### Skip to Main Content Implementation
```typescript
// Source: https://www.w3.org/TR/WCAG20-TECHS/G1.html

// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        <header>
          <nav>{/* Navigation */}</nav>
        </header>

        <main id="main-content" tabIndex={-1}>
          {children}
        </main>

        <footer>{/* Footer */}</footer>
      </body>
    </html>
  );
}

// globals.css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px 16px;
  text-decoration: none;
  z-index: 100;
  transition: top 0.2s;
}

.skip-link:focus {
  top: 0;
}

/* Screen reader only class for live regions */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### ESLint Configuration for Accessibility
```javascript
// Source: https://github.com/jsx-eslint/eslint-plugin-jsx-a11y
// .eslintrc.js or eslint.config.js
module.exports = {
  extends: [
    'plugin:jsx-a11y/recommended'
  ],
  plugins: ['jsx-a11y'],
  rules: {
    // Enforce specific accessibility rules
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-proptypes': 'error',
    'jsx-a11y/aria-role': 'error',
    'jsx-a11y/role-has-required-aria-props': 'error',
    'jsx-a11y/role-supports-aria-props': 'error',

    // Focus management
    'jsx-a11y/no-autofocus': 'warn',
    'jsx-a11y/tabindex-no-positive': 'error',

    // Interactive elements
    'jsx-a11y/click-events-have-key-events': 'error',
    'jsx-a11y/no-static-element-interactions': 'error',
    'jsx-a11y/interactive-supports-focus': 'error',

    // Labels and alternatives
    'jsx-a11y/label-has-associated-control': 'error',
    'jsx-a11y/img-redundant-alt': 'error',
  }
};
```

### Axe-Core Runtime Testing
```typescript
// Source: https://github.com/dequelabs/axe-core-npm/tree/develop/packages/react

// Development only - add to _app.tsx or main entry point
if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
  import('@axe-core/react').then((axe) => {
    axe.default(React, ReactDOM, 1000);
  });
}

// Console will log accessibility violations during development
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom focus trap with useEffect | focus-trap-react or Radix UI Dialog | ~2020 | Native solutions emerged but lack polish; React wrappers remain standard |
| Manual ARIA role assignment | Semantic HTML + Radix UI primitives | ~2021 | Radix UI provides tested ARIA patterns, reduces custom implementation errors |
| aria-labelledby for everything | Prefer aria-label for simple cases | ~2022 | aria-label simpler for icon buttons, aria-labelledby for complex references |
| Remove all focus outlines | Visible focus indicators required | 2021 (WCAG 2.2 draft) | WCAG 2.1 SC 1.4.11 now requires 3:1 contrast, 2px thickness for focus indicators |
| WCAG 2.0 AA compliance | WCAG 2.1 AA compliance (legally required) | 2025-06-28 (EU) | European Accessibility Act enforcement began, US ADA ongoing |

**Deprecated/outdated:**
- **Native `<dialog>` without additional scripting**: While native dialog has built-in focus trap, it includes browser chrome in the trap boundary. Use Radix UI or add focus-trap-react for expected UX.
- **aria-labelledby for simple labels**: Prefer `aria-label` for icon-only buttons and simple cases. aria-labelledby is best when referencing visible text elsewhere in DOM.
- **Opacity modifiers for text color (text-gray-500/70)**: Creates unpredictable contrast ratios. Use semantic tokens with verified ratios instead.
- **Testing only with one screen reader**: Different screen readers (NVDA, JAWS, VoiceOver) interpret ARIA differently. Test with at least two.

## Open Questions

Things that couldn't be fully resolved:

1. **Current text color contrast in existing codebase**
   - What we know: Tailwind config defines text-muted with #7A7A7A (~4.6:1 ratio on white)
   - What's unclear: Actual usage of charcoal/60 or charcoal/70 opacity modifiers in components (grep didn't find instances but may be dynamically applied)
   - Recommendation: Run automated axe audit on running app to identify actual contrast failures, then fix with semantic tokens

2. **Existing modal implementations**
   - What we know: Found Modal.tsx in packages/ui and BookingModal.tsx, both use custom implementations
   - What's unclear: Whether existing modals have focus trap, return focus, or proper ARIA
   - Recommendation: Audit both modals with axe-core, likely need to migrate to Radix UI Dialog or wrap with focus-trap-react

3. **Main content landmark structure**
   - What we know: Skip link pattern requires `id="main-content"` target
   - What's unclear: Current layout structure, whether main landmark exists
   - Recommendation: Check app/layout.tsx for main element, add if missing along with skip link

4. **Screen reader testing availability**
   - What we know: Manual testing required for 40% of issues automated tools miss
   - What's unclear: Whether team has access to NVDA (Windows), JAWS (Windows paid), VoiceOver (macOS/iOS)
   - Recommendation: Minimally use NVDA (free) on Windows or VoiceOver (built-in) on Mac for validation. Document testing procedure in phase plan.

## Sources

### Primary (HIGH confidence)
- [W3C WCAG 2.1 Contrast Requirements](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html) - Contrast ratio requirements
- [MDN ARIA Live Regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions) - ARIA live implementation guide
- [Radix UI Dialog Documentation](https://www.radix-ui.com/primitives/docs/components/dialog) - Official Radix accessibility features
- [focus-trap-react GitHub](https://github.com/focus-trap/focus-trap-react) - Focus trap library documentation
- [W3C G1 Technique](https://www.w3.org/TR/WCAG20-TECHS/G1.html) - Skip navigation link pattern
- npm registry versions (checked 2026-01-28):
  - focus-trap-react@11.0.6
  - react-focus-lock@2.13.7
  - @radix-ui/react-dialog@1.1.15
  - @axe-core/react@4.11.0
  - eslint-plugin-jsx-a11y@6.10.2

### Secondary (MEDIUM confidence)
- [How to Build Accessible Modals with Focus Traps | UXPin](https://www.uxpin.com/studio/blog/how-to-build-accessible-modals-with-focus-traps/) - Modal focus trap best practices
- [The Complete Guide to ARIA Live Regions | A11y Collective](https://www.a11y-collective.com/blog/aria-live/) - ARIA live region guidance
- [How to Implement Skip Navigation Links | TestParty](https://testparty.ai/blog/skip-navigation-links) - Skip link implementation
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) - Contrast testing tool
- [Accessibility audit with react-axe and eslint-plugin-jsx-a11y | web.dev](https://web.dev/articles/accessibility-auditing-react) - Automated testing setup
- [ARIA Labels for Web Accessibility: Complete 2025 Guide](https://allaccessible.org/implementing-aria-labels-for-web-accessibility) - ARIA label usage
- [WCAG 2.2: What You Need to Know in 2026 | accessiBe](https://accessibe.com/blog/knowledgebase/wcag-two-point-two) - Current WCAG status

### Tertiary (LOW confidence)
- Various WebSearch results for booking widget aria-label examples - No specific 2026 examples found, patterns extrapolated from general ARIA guidance

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified package versions, official docs, established patterns
- Architecture: HIGH - All patterns from W3C, MDN, or library official docs
- Pitfalls: MEDIUM - Based on community experience articles + official docs, not firsthand testing in this codebase

**Research date:** 2026-01-28
**Valid until:** 2026-04-28 (90 days - accessibility standards stable, library versions may update)
