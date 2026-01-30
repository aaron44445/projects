# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-29)

**Core value:** Every workflow a spa owner needs must work reliably, end-to-end, every time.
**Current focus:** Phase 23 - Earnings & Permissions

## Current Position

Phase: 23 of 24 (Earnings & Permissions)
Plan: 2 of 4 complete (23-02, 23-04)
Status: In progress
Last activity: 2026-01-29 - Completed 23-02-PLAN.md (CSV Export)

Progress: v1.0 ████████████ v1.1 ████████████ v1.2 ██████████░░░

## Milestone History

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v1.0 Stabilization | 2-12 | 40 | Complete | 2026-01-28 |
| v1.1 Audit Remediation | 13-18 | 46 | Complete | 2026-01-29 |
| v1.2 Staff Portal | 19-24 | TBD | In Progress | - |

## Accumulated Context

### Key Decisions (from v1.0 + v1.1 + v1.2)

**Architecture:**
- Defense-in-depth salonId filtering on all queries
- Advisory locks for booking concurrency
- Insert-or-conflict idempotency for webhooks
- Database-backed notification queue (not external broker)
- Portal-specific JWT tokens with portalType claim for staff/owner discrimination
- 15-minute staff access tokens (vs 7-day owner tokens) for security
- ownerPortalOnly middleware on all owner routes for cross-portal token rejection
- Location filter applied only when staff has >0 location assignments (otherwise show all)
- staffCanViewClientContact defaults to true if salon setting not found
- Time-off auto-approve: when requireTimeOffApproval=false, requests auto-approve with reviewNotes='Auto-approved'
- Owner approval UI: Staff Policies settings section with pending requests list, approve/reject modal with optional notes
- NotificationJob clientId optional with staffId field for staff-targeted notifications (time_off_approved, time_off_rejected)
- Timezone capture at clock-in: TimeEntry stores location timezone at clock-in time for immutable audit trail
- Application-level concurrency for time clock: Check for active entry before clock-in to prevent double clock-in
- CSV export uses fast-csv library for RFC 4180 compliance and streaming response
- Client name masking shows "FirstName L." format when staffCanViewClientContact is false

**Code Quality:**
- noImplicitAny: true baseline TypeScript strictness
- withSalonId utility for all Prisma tenant filters
- pino structured logging (JSON in prod, pretty in dev)

**UI/UX:**
- focus-trap-react for all modals
- STATUS_COLORS with as const for TypeScript inference
- rose-* design tokens for error states
- EmptyState for all empty views
- Primary location badge: sage/20 background with sage/30 border plus 'Primary' badge
- opacity-50 for past appointments (visual dimming)
- Click-to-expand appointment detail modal pattern

### v1.2 Roadmap Structure

**Phase 19:** Staff Authentication Foundation (AUTH-01 to AUTH-05) - COMPLETE
- Portal-specific JWT tokens
- Magic link invites
- Remember device functionality

**Phase 20:** Staff Portal Core (SCHED-01 to SCHED-04, PROF-01, PROF-02) - COMPLETE
- Schedule viewing (today + week)
- Profile management with assigned locations
- Location-filtered appointments
- Past appointment dimming, EmptyState, detail modal

**Phase 21:** Availability & Time Off (AVAIL-01 to AVAIL-03) - COMPLETE
- Weekly availability management (21-04 complete)
- Time-off auto-approve setting (21-01 complete)
- Owner approval UI (21-02 complete)
- Time-off approval notifications (21-03 complete)

**Phase 22:** Time Tracking (TIME-01 to TIME-03) - COMPLETE
- TimeEntry model with timezone capture (22-01 complete)
- Time clock API endpoints (22-01 complete)
- Clock in/out UI (22-02 complete)
- Timezone-aware history view (22-02 complete)

**Phase 23:** Earnings & Permissions (EARN-01 to EARN-04, PERM-01) - IN PROGRESS
- Earnings transparency (23-01 pending)
- CSV export (23-02 complete)
- Client masking in staff dashboard (23-03 pending)
- Client visibility control toggle (23-04 complete)

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

None - fresh slate for v1.2.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-01-29
Stopped at: Completed 23-02-PLAN.md (CSV Export)
Resume file: None

---
*State initialized: 2026-01-25*
*Last updated: 2026-01-29 (23-02 complete: CSV Export)*
