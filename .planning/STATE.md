# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-29)

**Core value:** Every workflow a spa owner needs must work reliably, end-to-end, every time.
**Current focus:** Phase 19 - Staff Authentication Foundation

## Current Position

Phase: 19 of 24 (Staff Authentication Foundation)
Plan: 05 complete (19-02, 19-03, 19-05 done; 19-01, 19-04 pending)
Status: In progress
Last activity: 2026-01-29 — Completed 19-05-PLAN.md (Logout flow verification)

Progress: v1.0 ████████████ v1.1 ████████████ v1.2 ██░░░░░░░░░░

## Milestone History

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v1.0 Stabilization | 2-12 | 40 | Complete | 2026-01-28 |
| v1.1 Audit Remediation | 13-18 | 46 | Complete | 2026-01-29 |
| v1.2 Staff Portal | 19-24 | TBD | Planning | — |

## Accumulated Context

### Key Decisions (from v1.0 + v1.1)

**Architecture:**
- Defense-in-depth salonId filtering on all queries
- Advisory locks for booking concurrency
- Insert-or-conflict idempotency for webhooks
- Database-backed notification queue (not external broker)

**Code Quality:**
- noImplicitAny: true baseline TypeScript strictness
- withSalonId utility for all Prisma tenant filters
- pino structured logging (JSON in prod, pretty in dev)

**UI/UX:**
- focus-trap-react for all modals
- STATUS_COLORS with as const for TypeScript inference
- rose-* design tokens for error states
- EmptyState for all empty views

### v1.2 Roadmap Structure

**Phase 19:** Staff Authentication Foundation (AUTH-01 to AUTH-05)
- Portal-specific JWT tokens
- Magic link invites
- Remember device functionality

**Phase 20:** Staff Portal Core (SCHED-01 to SCHED-04, PROF-01, PROF-02)
- Schedule viewing (today + week)
- Profile management
- Location-filtered appointments

**Phase 21:** Availability & Time Off (AVAIL-01 to AVAIL-03)
- Weekly availability management
- Time-off requests with approval

**Phase 22:** Time Tracking (TIME-01 to TIME-03)
- Clock in/out
- Timezone-aware history

**Phase 23:** Earnings & Permissions (EARN-01 to EARN-04, PERM-01)
- Earnings transparency
- CSV export
- Client info visibility controls

**Phase 24:** Technical Debt (DEBT-01 to DEBT-04)
- Booking widget styling
- Contrast fixes
- NotificationLog routing
- API client consolidation

### Known Technical Debt

- 327 low-contrast text patterns in secondary UI elements
- Booking widget input fields styling (white on white)
- Cron reminders bypass NotificationLog
- Some direct fetch calls instead of api client

### Pending Todos

None — fresh slate for v1.2.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-01-29
Stopped at: Completed 19-05-PLAN.md
Resume file: None

---
*State initialized: 2026-01-25*
*Last updated: 2026-01-29 (19-05 complete)*
