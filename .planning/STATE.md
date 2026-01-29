# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-28)

**Core value:** Every workflow a spa owner needs must work reliably, end-to-end, every time.
**Current focus:** v1.1 Audit Remediation - Phase 18: UI/UX (next)

## Current Position

Phase: 17 of 18 (Code Quality) - COMPLETE
Plan: 10 of 10 complete (9 requirements + 1 gap closure)
Status: Phase complete
Last activity: 2026-01-29 - Completed 17-10-PLAN.md (adopt withSalonId in appointments.ts)

Progress: [████████████████░░░░] 84%

## Milestone Context

**v1.1 Audit Remediation** (6 phases, 24 requirements)

| Phase | Category | Requirements | Status |
|-------|----------|--------------|--------|
| 13 | Security | SEC-01 to SEC-04 | Complete |
| 14 | Performance | PERF-01 to PERF-04 | Complete |
| 15 | SEO | SEO-01 to SEO-04 | Complete |
| 16 | Accessibility | A11Y-01 to A11Y-04 | Complete |
| 17 | Code Quality | CODE-01 to CODE-04 | Complete |
| 18 | UI/UX | UI-01 to UI-04 | Pending |

## Performance Metrics

**Velocity:**
- Total plans completed: 29 (v1.1)
- Average duration: 7.2 minutes
- Total execution time: 208 minutes

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 13 | 3/3 | 18 min | 6 min |
| 14 | 4/4 | 12 min | 3 min |
| 15 | 2/2 | 11 min | 5.5 min |
| 16 | 10/10 | 31 min | 3.1 min |
| 17 | 10/10 | 142 min | 14.2 min |

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

### Pending Todos

None yet.

### Blockers/Concerns

None - Phase 17 subscription TypeScript issues resolved by updating to new Stripe API patterns.

## Session Continuity

Last session: 2026-01-29
Stopped at: Completed 17-10-PLAN.md (Gap closure - adopt withSalonId in appointments.ts)
Resume file: None

---
*State initialized: 2026-01-25*
*Last updated: 2026-01-29 (17-10 complete - Gap closure withSalonId adoption)*
