# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-28)

**Core value:** Every workflow a spa owner needs must work reliably, end-to-end, every time.
**Current focus:** v1.1 Audit Remediation COMPLETE - All requirements verified

## Current Position

Phase: 18 of 18 (UI/UX Consistency) - COMPLETE
Plan: 13 of 13 complete
Status: MILESTONE COMPLETE
Last activity: 2026-01-29 - Phase 18 verified, v1.1 milestone complete

Progress: [████████████████████] 100%

## Milestone Context

**v1.1 Audit Remediation** (6 phases, 24 requirements)

| Phase | Category | Requirements | Status |
|-------|----------|--------------|--------|
| 13 | Security | SEC-01 to SEC-04 | Complete |
| 14 | Performance | PERF-01 to PERF-04 | Complete |
| 15 | SEO | SEO-01 to SEO-04 | Complete |
| 16 | Accessibility | A11Y-01 to A11Y-04 | Complete |
| 17 | Code Quality | CODE-01 to CODE-04 | Complete |
| 18 | UI/UX | UI-01 to UI-04 | Complete ✓ |

## Performance Metrics

**Velocity:**
- Total plans completed: 48 (v1.1)
- Average duration: 6.5 minutes
- Total execution time: 312 minutes

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 13 | 3/3 | 18 min | 6 min |
| 14 | 4/4 | 12 min | 3 min |
| 15 | 2/2 | 11 min | 5.5 min |
| 16 | 10/10 | 31 min | 3.1 min |
| 17 | 14/14 | 170 min | 12.1 min |
| 18 | 13/13 | 78 min | 6 min |

*Updated after each plan completion*

## Accumulated Context

### Decisions

From v1.0 (affecting v1.1 work):
- Defense-in-depth salonId filtering on all queries
- Advisory locks for booking concurrency
- Insert-or-conflict idempotency for webhooks

From v1.1 Phase 13:
- Use Zod superRefine for conditional production-only validation (13-01)
- Fail fast in production with stderr messages and exit code 1 (13-01)
- Zod refinement chain for password validation with granular error messages (13-02)
- Shared validation logic between frontend and backend for consistency (13-02)
- Return 404 for unauthorized file access to prevent enumeration attacks (13-03)
- Database-authoritative ownership verification, not path-based checks (13-03)
- Audit logging for suspicious file access with full context (13-03)

From v1.1 Phase 14:
- 5-second polling interval for notification jobs (14-01)
- Database-based queue instead of external message broker (14-01)
- 3 retry attempts with pending status reset on failure (14-01)
- 5-minute stale job recovery for crash scenarios (14-01)
- Single Promise.all for all dashboard queries instead of sequential (14-02)
- vipClients placeholder until Client.tags schema field added (14-02)
- Disable background polling with refetchIntervalInBackground: false (14-03)
- Keep refetchOnWindowFocus: true for immediate refresh on tab return (14-03)
- Use PostgreSQL String[] array type with default([]) for tags field (14-04)
- Query VIP clients using Prisma has filter on tags array (14-04)
- Add VIP count to existing Promise.all for zero-overhead parallel execution (14-04)

From v1.1 Phase 15:
- Use Next.js native MetadataRoute convention instead of static files (15-01)
- Block all authenticated routes from crawling via robots.txt (15-01)
- Set homepage priority to 1.0, signup/pricing to 0.8 (15-01)
- Use NEXT_PUBLIC_APP_URL env var with peacase.com fallback (15-01)
- Use metadataBase with alternates.canonical for automatic canonical URLs (15-02)
- Render JSON-LD in client component body (valid for Google parsing) (15-02)
- Hardcoded schema data is safe for inserting as HTML (15-02)

From v1.1 Phase 16:
- Use focus-trap-react library instead of custom focus management (16-01)
- Install focus-trap-react in both packages/ui and apps/web (16-01)
- Configure escapeDeactivates: false to maintain existing escape key handler (16-01)
- Use React.useId() for server-safe ARIA ID generation (16-01)
- Export ModalProps type from Modal.tsx for type safety (16-01)
- Use text-text-muted (4.6:1 ratio) for all secondary/caption text instead of charcoal/XX opacity (16-05)
- Upgrade dark mode text-white/40 to text-white/60 for better visibility (16-05)
- Document contrast ratios in Tailwind config to establish codebase pattern (16-05)
- Use manual edits for small files, PowerShell bulk replacement for large files (16-06)
- Replace text-charcoal/50, /60, /70 with semantic text-text-muted/text-text-secondary (16-06)
- Use clip-path technique instead of transform for skip-link visibility (16-10)
- Use hidden class instead of conditional rendering for modal focus restoration (16-07)
- Use single escape handler with priority stacking for multiple modal states (16-08)
- Use role="radio" with aria-checked instead of aria-pressed for selection groups (16-09)

From v1.1 Phase 17:
- JSON format in production, pino-pretty in development (17-01)
- LOG_LEVEL env var for runtime log level control (17-01)
- ISO timestamp format for consistency (17-01)
- withSalonId returns simple typed object, not Prisma-dependent (17-01)
- Import Prisma from @peacase/database not @prisma/client (17-02, 17-03)
- Use error: unknown with instanceof Error for type-safe error handling (17-02)
- Use Prisma.DateTimeFilter cast for dynamic date range filters (17-05)
- Include reportType context in all report error logs (17-04)
- Declare explicit Prisma.XxxWhereInput before queries for type safety (17-03)
- Use debug level for intermediate steps, info for success, warn for recoverable issues, error for failures (17-07)
- Include context identifiers (salonId, userId, to, provider) in all log calls for traceability (17-07)
- Consolidate multi-line startup logs into single structured log call (17-08)
- Use context objects for job tracking (jobId, attempt, maxAttempts) (17-08)
- Production startup errors still use stderr for fail-fast behavior (17-08)
- Use unknown + type assertion instead of : any for error parameters (17-06)
- Include salonId context in all log messages for multi-tenant tracing (17-06)
- noImplicitAny: true as baseline TypeScript strictness (17-09)
- Use Options type from express-rate-limit for handler callback (17-09)
- Access subscription billing period from subscription items (new Stripe API) (17-09)
- Extract subscription ID from invoice.parent.subscription_details (new Stripe API) (17-09)
- Use spread operator pattern for withSalonId in all Prisma where/data clauses (17-10)
- Logger context patterns should NOT use withSalonId - it's for database filters only (17-14)
- Function parameters to service methods keep direct salonId assignment, not withSalonId spread (17-13)

From v1.1 Phase 18:
- Use as const for STATUS_COLORS to enable TypeScript inference (18-01)
- Export getStatusClasses helper for combined class strings (18-01)
- EmptyState uses design system colors (sage, charcoal, text-muted) (18-01)
- EmptyState action button optional with icon support (18-01)
- Map underscore status variants (no_show) to hyphenated keys (no-show) for STATUS_COLORS lookup (18-03)
- Use peach design token for warning actions (No Show) to differentiate from errors (rose) (18-03)
- Use Modal title/description props for header instead of custom markup (18-02)
- Error message styling: bg-rose/10 border-rose/20 text-rose-dark (18-02)
- Success message styling: bg-sage/10 border-sage/20 text-sage-dark (18-02)
- Use "No X yet" for initial empty state, "No X found" for search/filter results (18-04)
- Only show action button for initial empty state, not search results (18-04)
- EmptyState icon size prop accepts string | number for Lucide icon compatibility (18-04)
- Use text-rose-dark for error icon and text colors (better contrast than text-rose) (18-12)
- Use hover:text-rose for interactive error elements (lighter on hover) (18-12)
- Error pattern: bg-rose/10 border-rose/20 text-rose-dark for all error states (18-12)
- Use size=lg for complex form modals, size=md for standard dialogs, size=sm for confirmations (18-08)
- Conditional rendering inside Modal for null-safe dynamic titles (18-08)
- Drawers (inset-y-0 right-0) remain as slide-out panels, only centered modals migrated (18-06)
- Modal migration: import Modal from @peacase/ui, use isOpen/onClose/title props (18-06)
- text-red-500/600 -> text-rose-dark for accessible error text contrast (18-10)
- dark:text-red-400 -> dark:text-rose for dark mode error visibility (18-10)
- hover:bg-red-50 -> hover:bg-rose/10 for opacity-based hover tokens (18-10)
- Dynamic Modal title for edit states: title={editing ? 'Edit X' : 'Add X'} (18-07)
- Custom footer inside Modal children with pt-6 border-t mt-6 pattern (18-07)
- Remove unused icon imports when migrating modals (X, Bell, Ban, MapPin, Globe) (18-07)
- Use bg-rose/10 border-rose/20 text-rose-dark pattern for all error states (18-11)
- Migrate green/blue status colors to sage/lavender tokens for consistency (18-11)
- Map staff active/inactive to confirmed/draft tokens, keep amber for on-leave (18-05)
- Map transaction refunded to cancelled styling for consistent negative states (18-05)
- Map time off pending/approved/rejected to pending/confirmed/cancelled tokens (18-05)
- Calendar page has no empty state - grid always renders (standard calendar UX) (18-13)
- Use 'No X yet' for initial empty state, 'No X found' for search/filter results (18-13)
- Only show action button for initial empty state, not search results (18-13)

### Pending Todos

None yet.

### Blockers/Concerns

None - Phase 17 subscription TypeScript issues resolved by updating to new Stripe API patterns.

## Session Continuity

Last session: 2026-01-29
Stopped at: v1.1 Audit Remediation COMPLETE - all phases verified
Resume file: None

---
*State initialized: 2026-01-25*
*Last updated: 2026-01-29 (v1.1 Audit Remediation complete - 6 phases, 48 plans, 24 requirements)*
