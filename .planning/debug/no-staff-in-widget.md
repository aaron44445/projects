---
status: investigating
trigger: "Booking widget not showing any staff to select"
created: 2026-01-26T00:00:00Z
updated: 2026-01-26T00:00:00Z
---

## Current Focus

hypothesis: Staff data exists but fails one or more filter conditions
test: Analyzed the public staff endpoint query logic
expecting: Identify all conditions that could filter out staff
next_action: Document findings and potential root causes

## Symptoms

expected: Staff members should appear in booking widget staff selection step
actual: No staff appear in the booking widget
errors: None reported
reproduction: Visit booking widget at peacase.com
started: Unknown

## Eliminated

## Evidence

- timestamp: 2026-01-26T00:00:00Z
  checked: GET /api/v1/public/:slug/staff endpoint (apps/api/src/routes/public.ts:230-345)
  found: Staff query has multiple filter conditions
  implication: Staff must pass ALL conditions to appear in widget

- timestamp: 2026-01-26T00:00:00Z
  checked: Query conditions in staff endpoint
  found: |
    Base conditions (lines 249-253):
    1. salonId: must match salon
    2. isActive: true (default true, but can be set false)
    3. onlineBookingEnabled: true (default true, but can be set false)

    Service filter (lines 256-263, when serviceId provided):
    4. staffServices.some.serviceId = serviceId
    5. staffServices.some.isAvailable = true

    Location filter (lines 267-315, when locationId provided):
    6. EITHER staffLocations.some.locationId = locationId
       OR staffLocations.none: {} (no location assignments = available everywhere)
  implication: Multiple conditions could cause empty results

- timestamp: 2026-01-26T00:00:00Z
  checked: Recent git history for public.ts
  found: No breaking changes in staff endpoint; recent commits related to notifications and payments
  implication: Logic unchanged recently; issue likely in data state

## Investigation Summary

### The Staff Query Logic (apps/api/src/routes/public.ts:230-345)

The endpoint `GET /api/v1/public/:slug/staff` returns staff who can be booked online.

**Required conditions for staff to appear:**
1. `isActive: true` - Staff member is active (User.isActive)
2. `onlineBookingEnabled: true` - Staff allows online booking (User.onlineBookingEnabled)

**Conditional filters (when query params provided):**

3. **When `serviceId` is provided:**
   - Staff must have a `StaffService` record for that service
   - That record must have `isAvailable: true`
   - This means staff must be explicitly assigned to perform the service

4. **When `locationId` is provided:**
   - Staff must EITHER:
     - Have a `StaffLocation` record for that location, OR
     - Have NO `StaffLocation` records at all (interpreted as "available at all locations")

### Potential Root Causes (in order of likelihood)

1. **Staff not assigned to services** (most likely)
   - If user selects a service, but no staff have `StaffService` records linking them to that service
   - Check: Are there any `StaffService` records for the selected service?

2. **onlineBookingEnabled = false**
   - Staff exists but has online booking disabled
   - Check: Is `online_booking_enabled` column true for staff?

3. **isActive = false**
   - Staff has been deactivated
   - Check: Is `is_active` column true for staff?

4. **Location assignment mismatch**
   - Staff are assigned to specific locations, but not the selected location
   - AND they don't have empty location assignments (which would make them available everywhere)
   - Check: Do staff have `StaffLocation` records? Do they match the selected location?

5. **StaffService.isAvailable = false**
   - Staff is assigned to service but marked as unavailable for that service
   - Check: Is `is_available` true in staff_services table?

### Database Queries to Diagnose

Run these queries against the production database to identify the specific cause:

```sql
-- 1. Count active staff with online booking enabled
SELECT COUNT(*) as bookable_staff
FROM users
WHERE salon_id = '<SALON_ID>'
  AND is_active = true
  AND online_booking_enabled = true;

-- 2. Check if staff are assigned to services
SELECT u.id, u.first_name, u.last_name, COUNT(ss.id) as service_count
FROM users u
LEFT JOIN staff_services ss ON ss.staff_id = u.id AND ss.is_available = true
WHERE u.salon_id = '<SALON_ID>'
  AND u.is_active = true
  AND u.online_booking_enabled = true
GROUP BY u.id, u.first_name, u.last_name;

-- 3. Check staff location assignments
SELECT u.id, u.first_name, u.last_name, COUNT(sl.id) as location_count
FROM users u
LEFT JOIN staff_locations sl ON sl.staff_id = u.id
WHERE u.salon_id = '<SALON_ID>'
  AND u.is_active = true
  AND u.online_booking_enabled = true
GROUP BY u.id, u.first_name, u.last_name;

-- 4. For a specific service, check who can perform it
SELECT u.id, u.first_name, u.last_name
FROM users u
JOIN staff_services ss ON ss.staff_id = u.id
WHERE u.salon_id = '<SALON_ID>'
  AND u.is_active = true
  AND u.online_booking_enabled = true
  AND ss.service_id = '<SERVICE_ID>'
  AND ss.is_available = true;
```

### Recommended Fix Direction

Once root cause is identified via database queries:

1. **If no StaffService records:** Need to assign staff to services via salon admin panel
2. **If onlineBookingEnabled = false:** Need to enable online booking for staff in admin
3. **If isActive = false:** Need to reactivate staff in admin
4. **If location mismatch:** Either assign staff to the location or remove all location assignments to make them available everywhere

## Resolution

root_cause: Awaiting database investigation to confirm which filter condition is failing
fix:
verification:
files_changed: []
