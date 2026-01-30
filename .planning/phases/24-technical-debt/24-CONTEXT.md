# Phase 24: Technical Debt - Context

**Gathered:** 2026-01-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Resolve 4 deferred technical debt items: booking widget styling, low-contrast text patterns, NotificationLog routing for cron, and API client consolidation. This is cleanup work — no new features, no architectural changes.

</domain>

<decisions>
## Implementation Decisions

### Booking Widget Styling (DEBT-01)
- Fix white-on-white input issue in booking widget
- Apply consistent input styling across all widget form fields
- Match existing app input patterns (charcoal text, proper borders)
- Scope: booking widget components only, not app-wide input audit

### Contrast Fixes (DEBT-02)
- Target the 327 identified low-contrast patterns (charcoal/50, /60, /70)
- Use batch approach: update color token definitions where possible
- Individual fixes only where tokens can't be changed globally
- Accept WCAG 2.1 AA as the target (4.5:1 for normal text, 3:1 for large)
- If a pattern is intentionally dimmed (e.g., disabled states), leave it

### NotificationLog Routing (DEBT-03)
- Route cron reminder notifications through NotificationLog
- Capture: recipientId, type, channel, status, sentAt, metadata
- Same pattern as existing webhook-triggered notifications
- No changes to reminder logic, just add logging wrapper

### API Client Consolidation (DEBT-04)
- Migrate all direct fetch() calls to centralized api client
- Exceptions: external API calls (Stripe, SendGrid) stay as-is
- Internal API calls only — anything hitting our own endpoints

### Claude's Discretion
- Exact color values for contrast fixes
- Order of file updates
- Whether to batch commits or do atomic per-fix
- Test approach for visual changes

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. This is mechanical cleanup work with clear targets.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 24-technical-debt*
*Context gathered: 2026-01-29*
