# Phase 18: UI/UX Consistency - Research

**Researched:** 2026-01-29
**Domain:** React design systems, design tokens, component standardization
**Confidence:** HIGH

## Summary

Research focused on implementing consistent UI patterns across the application through standardized modals, centralized status colors, design token-based error states, and reusable empty state components. The codebase already has strong foundations: a well-structured packages/ui library with Modal component using focus-trap-react, Badge/Button components using class-variance-authority (CVA), and a comprehensive Tailwind design system with semantic colors (sage, lavender, mint, rose, peach).

The standard approach for 2026 is design token-based systems with semantic naming (not appearance-based), TypeScript for type safety, CVA for variant management, and accessibility-first patterns. Current inconsistencies include: BookingModal duplicating Modal functionality, scattered status color definitions across pages, legacy red-50/red-200 colors instead of rose design tokens, and ad-hoc empty state implementations without a shared component.

**Primary recommendation:** Create statusColors.ts utility with semantic mappings to design tokens, build EmptyState component in packages/ui, migrate BookingModal to use packages/ui Modal as base, and replace all legacy error colors with rose/10 and rose/20 design token pattern.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| class-variance-authority | 0.7.0 | Type-safe component variants | Industry standard for managing component variations with TypeScript, already used in Badge/Button |
| focus-trap-react | 11.0.6 | Modal focus management | WCAG 2.1 AA compliant focus trapping, already integrated in Modal component |
| tailwind-merge | 2.2.0 | Class conflict resolution | Standard utility for merging Tailwind classes safely (cn helper) |
| lucide-react | 0.309.0 | Icon system | Consistent, accessible SVG icons already used throughout codebase |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React.useId() | React 18.2+ | Server-safe unique IDs | Generate ARIA labelledby/describedby IDs in components (already used in Modal) |
| TypeScript enums/const objects | Built-in | Type-safe color tokens | Define status color mappings with IntelliSense support |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CVA variants | Inline Tailwind classes | CVA provides type safety, consistency, and better maintainability for shared components |
| TypeScript objects | CSS variables only | TypeScript objects enable IntelliSense, static type checking, and compile-time validation |
| focus-trap-react | Custom focus management | Hand-rolling focus traps is error-prone and fails edge cases; library is battle-tested |

**Installation:**
No new packages needed - all required dependencies already installed in packages/ui and apps/web.

## Architecture Patterns

### Recommended Project Structure
```
packages/ui/src/
├── components/
│   ├── Modal.tsx          # Already exists - standard base modal
│   ├── EmptyState.tsx     # Create - reusable empty state
│   ├── ErrorBox.tsx       # Create - consistent error display
│   └── Badge.tsx          # Already exists - status badges
apps/web/src/
├── lib/
│   └── statusColors.ts    # Create - single source of status color truth
└── components/
    └── BookingModal.tsx   # Refactor to use packages/ui Modal
```

### Pattern 1: Design Token Status Colors

**What:** Single source of truth for status colors using semantic design system tokens
**When to use:** Any status indicator (badges, pills, appointment states, booking statuses)
**Example:**
```typescript
// apps/web/src/lib/statusColors.ts
// Source: Design token best practices (Contentful, UXPin)

export const STATUS_COLORS = {
  // Confirmed/Success states - sage (design system success color)
  confirmed: {
    bg: 'bg-sage/10',
    text: 'text-sage-dark',
    border: 'border-sage/20',
  },
  completed: {
    bg: 'bg-sage/10',
    text: 'text-sage-dark',
    border: 'border-sage/20',
  },

  // Pending/Waiting states - lavender (neutral)
  scheduled: {
    bg: 'bg-soft-lavender',
    text: 'text-charcoal',
    border: 'border-lavender/20',
  },
  pending: {
    bg: 'bg-soft-lavender',
    text: 'text-charcoal',
    border: 'border-lavender/20',
  },

  // In-progress - lavender-dark
  'in-progress': {
    bg: 'bg-lavender/20',
    text: 'text-lavender-dark',
    border: 'border-lavender/30',
  },

  // Negative states - rose (design system error color)
  cancelled: {
    bg: 'bg-rose/10',
    text: 'text-rose-dark',
    border: 'border-rose/20',
  },
  'no-show': {
    bg: 'bg-rose/10',
    text: 'text-rose-dark',
    border: 'border-rose/20',
  },
  expired: {
    bg: 'bg-rose/10',
    text: 'text-rose-dark',
    border: 'border-rose/20',
  },

  // Inactive/Draft - charcoal muted
  draft: {
    bg: 'bg-charcoal/5',
    text: 'text-text-muted',
    border: 'border-charcoal/10',
  },
} as const;

// Type-safe status keys
export type StatusKey = keyof typeof STATUS_COLORS;

// Helper to get full class string for Badge component
export function getStatusClasses(status: StatusKey): string {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return `${colors.bg} ${colors.text} ${colors.border}`;
}
```

### Pattern 2: Modal Composition Over Configuration

**What:** Use packages/ui Modal as structure, compose page-specific content
**When to use:** All modal dialogs (booking, forms, confirmations)
**Example:**
```typescript
// Source: React modal patterns (Developerway, LogRocket)
import { Modal, type ModalProps } from '@peacase/ui';

export function BookingModal({ isOpen, onClose, prefilledClientId }: BookingModalProps) {
  // Page-specific state and logic
  const [formData, setFormData] = useState({...});

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Book Appointment"
      description={prefilledClientName ? `for ${prefilledClientName}` : undefined}
      size="lg"
    >
      {/* Custom form content here */}
      <form onSubmit={handleSubmit}>
        {/* ... */}
      </form>
    </Modal>
  );
}
```
**Benefits:** Automatic focus trap, escape key handling, backdrop click, ARIA attributes, consistent styling

### Pattern 3: EmptyState Component with Semantic Props

**What:** Reusable empty state component with icon, title, description, optional CTA
**When to use:** Empty lists, tables, search results, filtered views
**Example:**
```typescript
// Source: Empty state best practices (Shopify Polaris, Atlassian Design System, Eleken UX)
// packages/ui/src/components/EmptyState.tsx

export interface EmptyStateProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<{ size?: number }>;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-charcoal/5 flex items-center justify-center mb-4">
        <Icon size={32} className="text-text-muted" />
      </div>
      <h3 className="text-lg font-semibold text-charcoal mb-2">{title}</h3>
      <p className="text-text-muted max-w-sm mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-sage text-white rounded-lg hover:bg-sage-dark transition-colors"
        >
          {action.icon && <action.icon size={16} />}
          {action.label}
        </button>
      )}
    </div>
  );
}
```

### Pattern 4: Error State with Design Tokens

**What:** Error highlighting using rose/10, rose/20 design tokens (not hardcoded hex)
**When to use:** Form validation errors, error messages, failed states
**Example:**
```typescript
// Source: WCAG accessible error patterns (Auf Ait UX, DeveloperUX)
// packages/ui/src/components/ErrorBox.tsx

export interface ErrorBoxProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBox({ message, onRetry }: ErrorBoxProps) {
  return (
    <div className="p-4 bg-rose/10 border border-rose/20 rounded-xl text-rose-dark flex items-start gap-3">
      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-medium hover:underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}

// Form input error state
<input
  className={cn(
    'form-input',
    error && 'border-rose/20 focus:border-rose focus:ring-rose/20'
  )}
/>
```

### Anti-Patterns to Avoid

- **Hardcoded color values:** Never use `bg-red-50 border-red-200 text-red-700` - use design tokens `bg-rose/10 border-rose/20 text-rose-dark`
- **Inline status colors:** Don't define colors in components - import from single statusColors.ts source
- **Custom modal structure:** Don't duplicate Modal's backdrop/focus-trap/escape-key logic - use Modal component
- **Scattered empty states:** Don't create unique empty state markup in each page - use EmptyState component
- **Appearance-based naming:** Don't use "red", "green", "yellow" - use semantic names "error", "success", "warning"

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Focus trapping in modals | Custom tab key handler | focus-trap-react | Handles edge cases: nested modals, dynamically added elements, screen readers, Return key on buttons |
| Unique ARIA IDs | Custom ID generator | React.useId() | Server-safe, collision-free, works with SSR/hydration |
| Component variants | Conditional className logic | class-variance-authority (CVA) | Type-safe, composable, prevents class conflicts |
| Status color mapping | Switch statements per component | Centralized statusColors.ts | Single source of truth, easier to update design system |
| Empty state layouts | Custom markup per page | Shared EmptyState component | Consistent messaging patterns, accessibility, maintainability |

**Key insight:** Modal accessibility alone has 15+ edge cases (keyboard navigation, screen readers, focus return, nested modals, backdrop scroll lock, escape key with nested dialogs). Focus-trap-react handles all of them. Manual implementation will miss cases.

## Common Pitfalls

### Pitfall 1: Opacity Modifiers Fail WCAG Contrast

**What goes wrong:** Using `text-charcoal/50` or `text-charcoal/60` results in insufficient contrast (below 4.5:1 ratio)
**Why it happens:** Opacity reduces contrast unpredictably across different backgrounds
**How to avoid:** Use semantic text tokens: `text-text-primary` (14:1), `text-text-secondary` (9:1), `text-text-muted` (4.6:1)
**Warning signs:** Text looks faded, accessibility audits fail, users report readability issues
**Source:** Codebase already documented in tailwind.config.ts comments (lines 58-68)

### Pitfall 2: Modal State Leaks Across Opens

**What goes wrong:** Form data, errors, success states persist when modal reopens
**Why it happens:** State not reset in useEffect on isOpen change
**How to avoid:** Reset all form state in useEffect with isOpen dependency:
```typescript
useEffect(() => {
  if (isOpen) {
    // Reset form
    setFormData(initialState);
    setError(null);
    setSuccess(false);
  }
}, [isOpen]);
```
**Warning signs:** Old error messages appear, form shows previous values, success message stuck
**Source:** Already correctly implemented in BookingModal.tsx (lines 56-70)

### Pitfall 3: Status Color Divergence

**What goes wrong:** Different pages use different colors for same status (calendar uses green/red, dashboard uses sage/rose)
**Why it happens:** No single source of truth, developers copy-paste color classes
**How to avoid:** Import from statusColors.ts, never define colors inline
**Warning signs:** "Confirmed" looks different on calendar vs dashboard, design system violations
**Source:** Identified in codebase - calendar.tsx uses standard Tailwind colors, dashboard uses design tokens

### Pitfall 4: Empty State Messaging Confusion

**What goes wrong:** "No items found" when user hasn't added any (confusing - sounds like search failed)
**Why it happens:** Not distinguishing between empty-by-design vs empty-after-filter
**How to avoid:**
  - Use "No [items] yet" for initial empty state (implies can be added)
  - Use "No [items] found" for filtered/search results (implies filter is active)
**Warning signs:** Users ask "did something break?" on empty list pages
**Source:** UX best practices from Eleken UX empty state research

### Pitfall 5: Tailwind Class Conflicts in Conditional Styling

**What goes wrong:** `className="bg-red-50 ${error && 'bg-rose/10'}"` - both classes applied, wrong one wins
**Why it happens:** Tailwind classes don't override, last one in source order wins (not DOM order)
**How to avoid:** Use cn() helper with tailwind-merge:
```typescript
className={cn('bg-white', error && 'bg-rose/10')}
```
**Warning signs:** Conditional styles don't apply, inspecting shows both classes present
**Source:** Already using cn() helper from tailwind-merge in Button/Badge components

## Code Examples

Verified patterns from codebase and official sources:

### Status Colors Implementation
```typescript
// apps/web/src/lib/statusColors.ts
export const STATUS_COLORS = {
  confirmed: { bg: 'bg-sage/10', text: 'text-sage-dark', border: 'border-sage/20' },
  pending: { bg: 'bg-soft-lavender', text: 'text-charcoal', border: 'border-lavender/20' },
  cancelled: { bg: 'bg-rose/10', text: 'text-rose-dark', border: 'border-rose/20' },
  // ... complete mappings
} as const;

// Usage in component
import { STATUS_COLORS } from '@/lib/statusColors';

<Badge className={`${STATUS_COLORS[appointment.status].bg} ${STATUS_COLORS[appointment.status].text}`}>
  {appointment.status}
</Badge>
```

### Modal Migration Pattern
```typescript
// Before: BookingModal duplicates Modal structure (143 lines with backdrop/focus-trap)
// After: BookingModal uses packages/ui Modal (saves ~60 lines, consistent behavior)

import { Modal } from '@peacase/ui';

export function BookingModal({ isOpen, onClose, prefilledClientId }: BookingModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Book Appointment"
      size="lg"
    >
      {/* Only form content - structure comes from Modal */}
      <div className="space-y-5">
        {/* Client selection */}
        {/* Service selection */}
        {/* Date/time pickers */}
      </div>
      <div className="flex gap-3 pt-6 border-t">
        <button onClick={onClose}>Cancel</button>
        <button onClick={handleSubmit}>Book Appointment</button>
      </div>
    </Modal>
  );
}
```

### EmptyState Usage Patterns
```typescript
// Dashboard empty appointments
<EmptyState
  icon={Calendar}
  title="No appointments yet"
  description="Schedule your first appointment to get started."
  action={{
    label: "Book Appointment",
    onClick: () => setShowBookingModal(true),
    icon: Plus
  }}
/>

// Clients page after search with no results
<EmptyState
  icon={Search}
  title="No clients found"
  description="Try adjusting your search or filters."
/>

// Services page initial state
<EmptyState
  icon={Scissors}
  title="No services yet"
  description="Add your first service to start booking appointments."
  action={{
    label: "Add Service",
    onClick: () => setShowAddModal(true),
    icon: Plus
  }}
/>
```

### Error State Pattern
```typescript
// Form validation error
{submitError && (
  <ErrorBox
    message={submitError}
    onRetry={handleSubmit}
  />
)}

// Input validation
<input
  className={cn(
    'form-input',
    validationError && 'border-rose/20 focus:border-rose focus:ring-rose/20'
  )}
/>
{validationError && (
  <p className="text-sm text-rose-dark mt-1">{validationError}</p>
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSS color variables | Design tokens in Tailwind config | 2024-2025 | Better DX with IntelliSense, type safety, semantic naming |
| Inline className conditionals | class-variance-authority | 2023-2024 | Type-safe variants, composable, prevents class conflicts |
| Custom focus management | focus-trap-react library | Ongoing | WCAG compliant, handles edge cases, less code to maintain |
| Appearance-based naming (red/green) | Semantic naming (error/success) | 2025-2026 | Design system flexibility, rebrand without code changes |
| Component-level empty states | Shared EmptyState component | 2024-2025 | Consistency, accessibility, faster development |

**Deprecated/outdated:**
- **Hardcoded hex colors:** Use design tokens from Tailwind config
- **bg-red-50/red-200/red-700 pattern:** Replaced by bg-rose/10, border-rose/20, text-rose-dark
- **Manual focus trap logic:** Use focus-trap-react
- **Scattered status color objects:** Centralize in statusColors.ts
- **charcoal/XX opacity modifiers for text:** Use semantic text-text-muted/secondary/primary tokens

## Open Questions

Things that couldn't be fully resolved:

1. **Should ErrorBox be in packages/ui or apps/web/src/components?**
   - What we know: It's application-specific (uses app error patterns), but generic enough for reuse
   - What's unclear: Whether future apps would use same error display pattern
   - Recommendation: Start in packages/ui for consistency with EmptyState. Can move to apps/web later if divergence occurs

2. **Status color system for calendar view conflicts?**
   - What we know: Calendar currently uses green/yellow/red, dashboard uses sage/lavender/rose
   - What's unclear: Whether calendar needs different colors for visual distinction (many colors on screen)
   - Recommendation: Migrate calendar to design system colors first, observe if color overload is issue, then decide if calendar needs unique palette

3. **Should we create a StatusBadge component or just export utility functions?**
   - What we know: Badge component already exists with CVA variants
   - What's unclear: Whether status-specific Badge wrapper adds value or just adds abstraction
   - Recommendation: Export utility functions (getStatusClasses) initially. If we find repeated patterns, create StatusBadge wrapper

## Sources

### Primary (HIGH confidence)
- [Class Variance Authority Documentation](https://cva.style/docs) - Component variant patterns
- [focus-trap-react GitHub](https://github.com/focus-trap/focus-trap-react) - Modal focus management
- [React useId() Documentation](https://react.dev/reference/react/useId) - Server-safe ID generation
- Codebase: packages/ui/src/components/Modal.tsx - Current modal implementation
- Codebase: packages/ui/src/components/Badge.tsx - CVA variant pattern already in use
- Codebase: apps/web/tailwind.config.ts - Design system tokens and contrast documentation

### Secondary (MEDIUM confidence)
- [Implementing Your Design System in React: Best Practices and Patterns - Mindful Chase](https://www.mindfulchase.com/deep-dives/design-system-framework/implementing-your-design-system-in-react-best-practices-and-patterns.html) - Design token patterns
- [Design tokens with confidence - UX Collective](https://uxdesign.cc/design-tokens-with-confidence-862119eb819b) - W3C design token standard
- [Accessible Color Tokens for Enterprise Design Systems - Auf Ait UX](https://www.aufaitux.com/blog/color-tokens-enterprise-design-systems-best-practices/) - WCAG-compliant color systems
- [UI best practices for loading, error, and empty states in React - LogRocket](https://blog.logrocket.com/ui-design-best-practices-loading-error-empty-state-react/) - Empty/error state patterns
- [Empty state UX examples and design rules - Eleken](https://www.eleken.co/blog-posts/empty-state-ux) - Empty state messaging
- [Empty state - Shopify Polaris](https://polaris-react.shopify.com/components/layout-and-structure/empty-state) - Production example
- [Existential React questions and a perfect Modal Dialog - Developerway](https://www.developerway.com/posts/hard-react-questions-and-modal-dialog) - Modal edge cases

### Tertiary (LOW confidence)
- [Tailwind CSS Best Practices 2025-2026 - Frontend Tools](https://www.frontendtools.tech/blog/tailwind-css-best-practices-design-system-patterns) - General Tailwind patterns (not component-specific)
- [The best React modal dialog libraries of 2026 - Croct Blog](https://blog.croct.com/post/best-react-modal-dialog-libraries) - Library comparison (our choice already made)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and in use, versions verified
- Architecture: HIGH - Patterns extracted from existing codebase (Modal, Badge) and verified with official docs
- Pitfalls: HIGH - Identified from codebase issues (calendar colors, BookingModal duplication) and WCAG standards
- EmptyState patterns: MEDIUM - Based on design system examples (Shopify, Atlassian) but not yet implemented in codebase
- Status color mapping: HIGH - Extracted from existing dashboard implementation and context decisions

**Research date:** 2026-01-29
**Valid until:** ~60 days (stable ecosystem - React 18, established patterns, no major framework changes expected)
