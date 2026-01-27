---
phase: 06-settings-persistence
plan: 02
subsystem: settings-verification
status: gaps_found
created: 2026-01-27
completed: 2026-01-27
duration: 15min

tags:
  - verification
  - settings
  - business-hours
  - booking-widget

requires:
  - 06-01: Business hours UI wired to API

provides:
  - gap-identification: Critical gaps identified in settings persistence flow

affects:
  - 06-03: Gap closure plan needed for location context race condition
  - 06-04: Gap closure plan needed for booking widget locationId

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified: []

decisions: []
---

# Phase 06 Plan 02: Settings Persistence Verification Summary

**One-liner:** Verification FAILED - identified 2 critical gaps in settings persistence flow

## Verification Results

### SET-01: Settings persist across refresh ❌ FAILED

**Expected:** Business hours changes persist after page refresh
**Actual:** Hours reset to defaults after refresh

**Root Cause:** Race condition in LocationContext initialization

```typescript
// In useLocations.tsx, the useEffect at line 347-355:
useEffect(() => {
  if (typeof window !== 'undefined') {
    const savedId = localStorage.getItem('selectedLocationId');
    if (savedId) {
      setSelectedLocationId(savedId);  // ← Queues state update
    }
  }
  fetchLocations();  // ← Called immediately with stale closure
}, [fetchLocations]);
```

The problem:
1. `setSelectedLocationId(savedId)` queues a state update (async)
2. `fetchLocations()` is called IMMEDIATELY in the same effect
3. The `fetchLocations` callback has `selectedLocationId` in its dependency array
4. But the callback was created with the CLOSURE VALUE at render time (null)
5. So `fetchLocations` runs with `selectedLocationId=null` in its closure
6. Lines 131-137 auto-select primary location when `!selectedLocationId`
7. This may select a DIFFERENT location than where hours were saved
8. User sees default hours for the auto-selected location

**Fix Required:** Separate the localStorage read from the fetchLocations call, or ensure fetchLocations uses the current state value.

### SET-02: Business hours affect booking widget ❌ FAILED

**Expected:** Setting Tuesday to CLOSED removes Tuesday slots from booking widget
**Actual:** Tuesday shows full availability (9 AM - 5 PM slots)

**Root Cause:** fetchAvailability doesn't pass locationId

```typescript
// In apps/web/src/app/embed/[slug]/page.tsx
async function fetchAvailability(
  slug: string,
  date: string,
  serviceId: string,
  staffId?: string  // ← locationId NOT accepted!
): Promise<TimeSlot[]> {
  let url = `${API_BASE}/api/v1/public/${slug}/availability?date=${date}&serviceId=${serviceId}`;
  if (staffId) url += `&staffId=${staffId}`;  // ← locationId NOT passed!
  // ...
}

// Call site (line 1138):
fetchAvailability(slug, booking.date, booking.serviceId, booking.staffId || undefined)
// ← booking.locationId exists but is NOT passed!
```

The availability API accepts `locationId` as optional parameter. Without it, `getBusinessHours` falls back to hardcoded defaults:

```typescript
// In availability.ts lines 134-144:
const defaultHours: Record<number, BusinessHours | null> = {
  0: null, // Sunday closed
  1: { open: '09:00', close: '17:00' },
  2: { open: '09:00', close: '17:00' },
  // ...
};
return defaultHours[dayOfWeek];
```

**Fix Required:** Update `fetchAvailability` to accept and pass `locationId` parameter.

### SET-03: Service pricing via API ❌ COULD NOT COMPLETE

**Expected:** API call updates price, widget shows new price
**Actual:** User reported 404 error

**Analysis:** The API endpoint exists and works:
- `PUT /api/v1/locations/:id/services/:serviceId` at locations.ts:450
- Requires admin/owner authorization
- Accepts `priceOverride` in request body

**Likely Issues:**
1. Missing or invalid auth token
2. Incorrect location/service IDs
3. Network tab auth header format mismatch

**Fix Required:** None for API - provide clearer testing instructions or build test script.

## Automated Verification (Tasks 1-3)

### Task 1: Service pricing API ✓ VERIFIED
- PUT endpoint exists at `/api/v1/locations/:id/services/:serviceId`
- Accepts `priceOverride` field
- Public services endpoint applies `effectivePrice: override.priceOverride ?? service.price`
- No UI exists for price overrides (documented as out of scope)

### Task 2: Availability service uses LocationHours ✓ VERIFIED
- `getBusinessHours` queries `prisma.locationHours.findUnique`
- Falls back to hardcoded defaults when no record found
- No application-level caching

### Task 3: Public services endpoint fresh data ✓ VERIFIED
- Queries `prisma.service.findMany` on each request
- Applies `locationSettings?.priceOverride` for location-specific pricing
- No cache headers or application cache

## Gaps Identified

### Gap 1: Location Context Race Condition
**File:** `apps/web/src/hooks/useLocations.tsx`
**Impact:** Settings appear not to persist (but actually saved to different location)
**Priority:** HIGH - breaks user experience

### Gap 2: Booking Widget Missing locationId
**File:** `apps/web/src/app/embed/[slug]/page.tsx`
**Impact:** Business hours have no effect on booking availability
**Priority:** HIGH - breaks core booking functionality

## Recommendations

1. **Create 06-03-PLAN.md**: Fix location context initialization race condition
   - Separate localStorage read from fetchLocations
   - Use ref or callback to ensure current state value

2. **Create 06-04-PLAN.md**: Fix booking widget locationId passing
   - Add locationId parameter to fetchAvailability
   - Pass booking.locationId to availability API
   - Ensure location selection is required before date selection

## Success Criteria Status

- [x] Service pricing API confirmed to exist
- [x] Availability service confirmed to query LocationHours from database
- [x] Public services endpoint confirmed to apply location price overrides
- [ ] Human verification: SET-01 (settings persist) - **FAILED**
- [ ] Human verification: SET-02 (hours affect availability) - **FAILED**
- [ ] Human verification: SET-03 (pricing via API reflects in widget) - **COULD NOT COMPLETE**

## Next Steps

Phase 6 cannot be marked complete. Gap closure plans are needed:
- `/gsd:plan-phase 6 --gaps` to create fix plans
- Execute gap closure plans
- Re-verify all three tests
