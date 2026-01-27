# Phase 6: Settings Persistence - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Ensure all configuration changes apply immediately and persist correctly. Settings save successfully, apply immediately to the booking widget, caches invalidate properly, and the deployment stays consistent. This phase stabilizes existing settings infrastructure—not adding new settings types.

</domain>

<decisions>
## Implementation Decisions

### Save Feedback Behavior
- Keep existing manual save pattern (button-based) for complex forms
- Use optimistic updates: UI updates immediately, rolls back on API failure
- Toast notifications on save success/failure (console.log fallback if no toast library)
- Disable save button while request in-flight to prevent double-submission
- Show inline validation errors before save attempt (Zod on frontend mirrors backend)

### Immediate Apply Strategy
- Database is source of truth—no application-level caching on API
- Public widget endpoints serve fresh data on each request (no TTL caching)
- When dashboard saves settings → widget gets new values on next user interaction
- No polling or push—explicit user action (date/service selection) triggers fresh fetch
- Acceptable latency: Settings apply within 1 request cycle (user won't notice)

### Cache Invalidation Approach
- No Redis or application cache to invalidate (current architecture is stateless)
- Browser tab sync not required—acceptable for user to refresh other tabs manually
- React state updates via context providers on successful API response
- If React Query added later: `invalidateQueries(['salon'])` pattern recommended

### Multi-Instance Sync
- Vercel serverless (frontend) is stateless—no sync needed
- Render single instance (API)—no distributed locking concerns currently
- Database as single source of truth eliminates consistency issues
- CSRF token in-memory store is acceptable for current scale (noted for future Redis migration)
- Cron jobs run on single API instance—no duplication risk at current scale

### Claude's Discretion
- Exact loading spinner placement and animation
- Error message wording (following existing UI patterns)
- Whether to add React Query now or keep current useState/useEffect pattern
- Form validation timing (on blur vs on change vs on submit)

</decisions>

<specifics>
## Specific Ideas

- Existing `useNotificationSettings` hook has optimistic update pattern—extend to other settings
- Settings page already 1,600+ lines—avoid adding complexity, focus on wiring existing UI
- Phase 5 fixed notification settings wiring (05-07)—verify other settings sections follow same pattern
- API already returns detailed validation errors—frontend should display them inline

</specifics>

<deferred>
## Deferred Ideas

- Redis caching layer—not needed at current scale, add when scaling to multi-instance API
- Real-time cross-tab sync (WebSocket/BroadcastChannel)—low value, manual refresh acceptable
- Settings versioning/migration—handle when schema changes require it
- React Query migration—evaluate after stabilization complete

</deferred>

---

*Phase: 06-settings-persistence*
*Context gathered: 2026-01-27*
