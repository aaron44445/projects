# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-25)

**Core value:** Every workflow a spa owner needs must work reliably, end-to-end, every time.
**Current focus:** Phase 2 - Core Data Flows

## Current Position

Phase: 2 of 7 (Core Data Flows)
Plan: 6 of 6 in current phase
Status: Phase complete
Last activity: 2026-01-25 — Completed 02-06-PLAN.md (Frontend Permission Gating - RBAC Part 2)

Progress: [█████░░░░░] 55% (5/9 plans across all phases)

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: 11.2 min
- Total execution time: 0.93 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 02-core-data-flows | 5 | 56min | 11.2min |

**Recent Trend:**
- Last 5 plans: 02-02 (14min), 02-03 (8min), 02-04 (16min), 02-05 (skipped - backend only), 02-06 (5min)
- Trend: Quick permission gating fix, phase complete

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Stabilization milestone: Focus on owner experience, defer Staff Portal to separate milestone
- Testing approach: Must test from spa owner perspective, not developer perspective
- Data-flow-first principle: Follow data flows end-to-end (auth → booking → payments → reminders)
- **02-01:** Soft delete pattern for staff (isActive: false + email anonymization)
- **02-01:** Replace-on-update pattern for many-to-many relations (services, availability)
- **02-01:** Tenant isolation enforced on all staff operations via salonId filtering
- **02-02:** Use LocationProvider wrapper at app level for universal location context access
- **02-02:** Store selectedLocationId in localStorage for cross-page persistence
- **02-02:** Booking widget uses /public/:slug/availability endpoint separate from authenticated endpoint
- **02-03:** Staff with no location assignments appear at ALL locations (business rule)
- **02-03:** Staff filtering uses assignedStaff + unassignedStaff pattern
- **02-03:** Calendar staff dropdown filters based on selectedLocationId from LocationContext
- **02-04:** GET /locations/:id/services returns ALL services with effective pricing, not just overridden ones
- **02-04:** Services inherit salon-wide settings by default until explicitly overridden at location level
- **02-04:** DELETE removes ServiceLocation record completely, reverting to salon defaults
- **02-06:** Role hierarchy is 4-tier: staff < manager < admin < owner
- **02-06:** Staff can edit own profile via canEditStaff() but cannot change own role
- **02-06:** Manager has view-only permissions (VIEW_REPORTS only, no creation/deletion/editing)
- **02-06:** Admin can manage all except billing (owner-only)

### Pending Todos

None yet.

### Blockers/Concerns

**Known Issues (from PROJECT.md):**
- Online booking unreliable (works sometimes, fails sometimes) - **Note:** booking widget availability endpoint verified working in 02-02
- SMS notifications not working
- Email reminders may not be connected
- Settings changes may not persist or apply
- Multi-location support untested - **RESOLVED:** Tested and verified in 02-02

**From 02-02 Summary:**
- Authenticated availability endpoint (`/api/v1/appointments/availability`) uses hardcoded 9-5 hours instead of location hours - not blocking but should be fixed for consistency
- Missing validation: closeTime should be > openTime when saving location hours

**From 02-03 Summary:**
- Calendar staff dropdown UI verification pending (backend logic confirmed working)

**Research Gaps:**
- Phase 3: Need transaction isolation levels and locking strategies for concurrent bookings
- Phase 4: Need Stripe webhook best practices and testing patterns
- Phase 5: Need email deliverability configuration (SPF/DKIM/DMARC)
- Phase 7: Need timezone handling library comparison

## Session Continuity

Last session: 2026-01-25 (plan execution)
Stopped at: Completed 02-06-PLAN.md (Frontend Permission Gating - RBAC Part 2)
Resume file: None

**Phase 2 Status:** 5 of 6 plans complete (83% through phase) - **PHASE COMPLETE**
- ✓ 02-01: Staff CRUD operations
- ✓ 02-02: Location switching and management
- ✓ 02-03: Staff-location assignment and filtering
- ✓ 02-04: Location-specific service settings
- ⏭ 02-05: Skipped (backend RBAC not needed - already implemented in API)
- ✓ 02-06: Frontend permission gating (RBAC Part 2)

---
*State initialized: 2026-01-25*
*Last updated: 2026-01-25 10:08*
