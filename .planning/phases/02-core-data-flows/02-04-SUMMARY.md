---
phase: 02-core-data-flows
plan: 04
subsystem: api
tags: [express, prisma, service-management, multi-location]

# Dependency graph
requires:
  - phase: 02-02
    provides: Location management and switching infrastructure
provides:
  - Location-specific service pricing and availability
  - Service override management endpoints
  - Public booking widget integration with location services
affects: [03-booking-engine, 04-payments]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ServiceLocation join table for location-specific settings"
    - "Effective pricing pattern (basePrice + override → effectivePrice)"
    - "GET endpoint returns all resources with optional overrides applied"

key-files:
  created: []
  modified:
    - apps/api/src/routes/locations.ts

key-decisions:
  - "GET /locations/:id/services returns ALL services with effective pricing, not just overridden ones"
  - "Services inherit salon-wide settings by default until explicitly overridden at location level"
  - "DELETE removes ServiceLocation record completely, reverting to salon defaults"

patterns-established:
  - "Service override pattern: base + override → effective value"
  - "Boolean override detection: hasOverride flag indicates location-specific customization"
  - "Public endpoints filter by isEnabled flag for disabled services"

# Metrics
duration: 16min
completed: 2026-01-25
---

# Phase 2 Plan 4: Location-Specific Service Settings Summary

**All salon services display with location-specific effective pricing, duration, and availability via GET endpoint serving both admin UI and booking widget**

## Performance

- **Duration:** 16 min
- **Started:** 2026-01-25T09:42:08Z
- **Completed:** 2026-01-25T09:58:19Z
- **Tasks:** 3 (1 implementation task, 2 verification tasks)
- **Files modified:** 1

## Accomplishments
- Fixed GET /locations/:id/services to return all services (not just overridden ones) with effective pricing
- Verified price override functionality works correctly
- Verified duration override functionality works correctly
- Verified enable/disable per location works correctly
- Verified public booking endpoint correctly filters disabled services
- Verified reset operation removes all location-specific settings

## Task Commits

Each task was committed atomically:

1. **Task 1-3: Test and fix location-specific service settings** - `79b28d7` (feat)

_Note: Tasks 2 and 3 were verification tasks. Implementation was already present but had one bug._

## Files Created/Modified
- `apps/api/src/routes/locations.ts` - Fixed GET /locations/:id/services to show all services with effective pricing

## Decisions Made

**1. GET endpoint should return ALL services, not just overridden ones**
- Previous implementation only returned services with ServiceLocation records
- This hid services from location view unless explicitly overridden
- Fixed to show all salon services at each location with effective values
- Rationale: Users need to see all available services and their effective pricing at each location

**2. Effective pricing calculation**
- basePrice and baseDuration preserved from Service model
- effectivePrice = priceOverride ?? basePrice
- effectiveDuration = durationOverride ?? baseDuration
- hasOverride flag indicates if any location-specific settings exist

**3. Null override handling**
- Setting priceOverride or durationOverride to null reverts to base value
- DELETE /locations/:id/services/:serviceId removes entire ServiceLocation record
- isEnabled defaults to true if no ServiceLocation record exists

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed null reference error in GET /locations/:id/services**
- **Found during:** Task 1 (Initial testing)
- **Issue:** `override?.priceOverride` incorrectly used optional chaining - threw error when override was undefined
- **Fix:** Changed to explicit null checks: `override && override.priceOverride !== null`
- **Files modified:** apps/api/src/routes/locations.ts
- **Verification:** GET endpoint returns 200 with all services
- **Committed in:** 79b28d7 (Task 1 commit)

**2. [Rule 2 - Missing Critical] Changed GET endpoint to return all services**
- **Found during:** Task 1 (Testing service listing)
- **Issue:** Original implementation only returned services WITH ServiceLocation records - hid unmodified services from location view
- **Fix:** Query all active services, LEFT JOIN with ServiceLocation, calculate effective values for all
- **Files modified:** apps/api/src/routes/locations.ts
- **Verification:** All services appear at location with correct effective pricing
- **Committed in:** 79b28d7 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical)
**Impact on plan:** Both fixes necessary for correct functionality. No scope creep.

## Issues Encountered

**Issue:** Test data mismatch - initial test used wrong salon slug
- Problem: Hardcoded "stencilwash" slug in test but owner account had different salon
- Resolution: Made test dynamic by fetching salon slug from database
- No impact on implementation

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready:**
- Service overrides fully functional (price, duration, enable/disable)
- Public booking endpoint correctly filters disabled services
- Public booking endpoint uses location-specific pricing
- Reset functionality removes all overrides cleanly

**No blockers for next phase**

**Note for future phases:**
- Booking widget should use GET /public/:slug/services?locationId=X to get location-specific services
- Booking creation (POST /public/:slug/book) already uses ServiceLocation overrides for appointment pricing
- Admin UI should use GET /locations/:id/services to show all services with effective pricing

---
*Phase: 02-core-data-flows*
*Completed: 2026-01-25*
