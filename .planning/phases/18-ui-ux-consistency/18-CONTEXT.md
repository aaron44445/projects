# Phase 18: UI/UX Consistency - Context

**Gathered:** 2026-01-29
**Status:** Ready for planning

<domain>
## Phase Boundary

UI components follow consistent patterns with shared design tokens. This phase consolidates scattered UI implementations into reusable components: modals use packages/ui Modal, status colors come from a single source, error states use design tokens, and empty states use a shared component.

</domain>

<decisions>
## Implementation Decisions

### Modal Standardization
- Migrate BookingModal to use packages/ui Modal as base (it currently duplicates Modal functionality)
- Page-specific modals in clients/page.tsx, gift-cards/page.tsx should use packages/ui Modal
- Keep modal content/logic in page components, but structure/backdrop/focus-trap comes from Modal
- Preserve existing escape key and backdrop click behavior (already implemented in Modal)

### Status Color System
- Create `apps/web/src/lib/statusColors.ts` as single source of truth
- Use design system colors (sage, lavender, mint, rose) not standard Tailwind colors
- Calendar page currently uses green/yellow/red - migrate to design system for consistency
- Status mappings:
  - confirmed/completed: sage (success)
  - scheduled/pending: lavender (neutral/waiting)
  - in-progress: lavender-dark
  - cancelled/no-show/expired: rose (negative)
  - draft: charcoal/10 (inactive)
- Export both background classes and text classes for flexible usage

### Error Highlighting
- Use design tokens: `bg-rose/10 border-rose/20 text-rose` pattern
- Replace any `bg-red-50 border-red-200 text-red-700` legacy patterns
- Form validation errors show rose border on invalid inputs
- Create ErrorBox component in packages/ui with icon, message, optional retry action
- Required field indicator stays as `text-rose` asterisk (already consistent)

### EmptyState Component
- Create packages/ui EmptyState component
- Props: icon (Lucide icon component), title, description, action (optional button)
- Consistent styling: centered, muted text, generous padding
- Use "No [items] yet" messaging (implies can be added) vs "No [items] found" (for search results)
- Migrate dashboard, clients, services, staff, calendar empty states

### Claude's Discretion
- Exact component API design (prop names, variants)
- Whether to create StatusBadge component or just export color utilities
- Order of file migrations within each requirement
- Whether to split large files during refactor

</decisions>

<specifics>
## Specific Ideas

- Design system colors already defined in globals.css (--color-success, --color-warning, --color-error) should be utilized
- Badge component in packages/ui already has variant system - status colors should align with it
- Calendar page is the main outlier using standard Tailwind colors instead of design system

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope

</deferred>

---

*Phase: 18-ui-ux-consistency*
*Context gathered: 2026-01-29*
