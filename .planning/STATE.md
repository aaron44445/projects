# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-28)

**Core value:** Every workflow a spa owner needs must work reliably, end-to-end, every time.
**Current focus:** v1.1 Audit Remediation - Phase 15: SEO Fundamentals

## Current Position

Phase: 15 of 18 (SEO Fundamentals)
Plan: 1 of 5 complete
Status: In progress
Last activity: 2026-01-29 - Completed 15-01-PLAN.md (Sitemap and Robots.txt)

Progress: [████████████████░░░░] 84%

## Milestone Context

**v1.1 Audit Remediation** (6 phases, 24 requirements)

| Phase | Category | Requirements | Status |
|-------|----------|--------------|--------|
| 13 | Security | SEC-01 to SEC-04 | Complete |
| 14 | Performance | PERF-01 to PERF-04 | Complete |
| 15 | SEO | SEO-01 to SEO-04 | In Progress (1/5) |
| 16 | Accessibility | A11Y-01 to A11Y-04 | Pending |
| 17 | Code Quality | CODE-01 to CODE-04 | Pending |
| 18 | UI/UX | UI-01 to UI-04 | Pending |

## Performance Metrics

**Velocity:**
- Total plans completed: 8 (v1.1)
- Average duration: 4.4 minutes
- Total execution time: 35 minutes

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 13 | 3/3 | 18 min | 6 min |
| 14 | 4/4 | 12 min | 3 min |
| 15 | 1/5 | 5 min | 5 min |

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

### Pending Todos

None yet.

### Blockers/Concerns

- Pre-existing TypeScript build errors in subscription-related files (unrelated to phase 13 work)

## Session Continuity

Last session: 2026-01-29
Stopped at: Completed 15-01-PLAN.md (Sitemap and Robots.txt)
Resume file: None

---
*State initialized: 2026-01-25*
*Last updated: 2026-01-29 (Phase 15 in progress - 1/5 plans)*
