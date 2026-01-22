# Multi-Location System Design

**Date:** 2026-01-22
**Status:** Approved

## Overview

Complete multi-location system for Peacase spa/salon SaaS, based on Mindbody and Vagaro patterns. Everything is flexible with OPTIONS, not forced choices.

## Pricing Model

- Base plan includes 1 location
- Additional locations: $100/month each
- Tracked in subscription/billing

## Current State

### Already Built
- Location model with address, timezone, isPrimary, isActive
- StaffLocation junction table (staff → multiple locations)
- ServiceLocation junction table with price/duration overrides
- Appointment.locationId (optional)
- Complete API routes for locations CRUD
- Location switcher component
- Locations management page
- `multiLocationEnabled` feature flag on Salon

### Gaps to Fill
1. Staff schedules per location
2. Location hours as structured data
3. Dashboard/Reports location filtering
4. Booking flow location selection
5. Location-based permissions for managers
6. Billing integration for additional locations
7. Flagship syncing feature

---

## Feature 1: Location Hours (Structured Data)

### Database Schema
```prisma
model LocationHours {
  id         String   @id @default(uuid())
  locationId String   @map("location_id")
  dayOfWeek  Int      @map("day_of_week")  // 0=Sunday, 6=Saturday
  openTime   String?  @map("open_time")     // "09:00" or null if closed
  closeTime  String?  @map("close_time")    // "18:00" or null if closed
  isClosed   Boolean  @default(false)
  location   Location @relation(fields: [locationId], references: [id], onDelete: Cascade)

  @@unique([locationId, dayOfWeek])
  @@map("location_hours")
}
```

### Behavior
- Each location has 7 rows (one per day)
- `isClosed = true` OR `openTime/closeTime = null` means closed that day
- Booking system checks: staff available AND location open
- Keep existing `hours` text field for display purposes

### UI
- Location edit modal gets structured hours grid
- Day | Open Time | Close Time | Closed toggle
- "Copy from another location" button

---

## Feature 2: Staff Schedules Per Location

### Database Schema
```prisma
model StaffAvailability {
  id          String    @id @default(uuid())
  staffId     String    @map("staff_id")
  locationId  String?   @map("location_id")  // null = default/all locations
  dayOfWeek   Int       @map("day_of_week")
  startTime   String    @map("start_time")
  endTime     String    @map("end_time")
  isAvailable Boolean   @default(true) @map("is_available")
  staff       User      @relation(fields: [staffId], references: [id], onDelete: Cascade)
  location    Location? @relation(fields: [locationId], references: [id], onDelete: Cascade)

  @@unique([staffId, locationId, dayOfWeek])
  @@index([staffId])
  @@index([locationId])
  @@map("staff_availability")
}
```

### Behavior
- If `locationId` is null → applies to all locations (backward compatible)
- If `locationId` is set → applies only to that location
- Location-specific schedule overrides global schedule
- When checking availability: first check location-specific, fall back to global

### UI
- Staff profile → Schedule tab shows location dropdown
- "Default Schedule" + per-location schedules
- Copy schedule from one location to another

---

## Feature 3: Dashboard & Reports Location Filtering

### API Changes
Add optional `locationId` query param:
- `GET /api/v1/dashboard/stats?locationId=xxx`
- `GET /api/v1/reports/revenue?locationId=xxx`
- `GET /api/v1/reports/appointments?locationId=xxx`
- `GET /api/v1/appointments?locationId=xxx`

### Query Pattern
```typescript
where: {
  salonId,
  ...(locationId && { locationId }),
}
```

### Reports Additions
- Location filter dropdown
- "Revenue by Location" report - bar chart comparing locations
- "Bookings by Location" report
- "Staff Performance by Location" report
- Export includes location column

---

## Feature 4: Booking Flow Location Selection

### Updated Flow
1. **Select Location** (new first step)
   - Show all active locations with address
   - "Find soonest available" option searches across all
2. Select Service → only services enabled at that location
3. Select Staff → only staff assigned to that location
4. Select Time → location open AND staff available
5. Confirm → shows location address, map link

### API Changes
- `GET /api/v1/public/locations/:slug` - locations for booking widget
- `GET /api/v1/public/services/:slug?locationId=xxx` - filter by location
- `GET /api/v1/public/availability/:slug?locationId=xxx&serviceId=xxx`
- `POST /api/v1/public/book` - include `locationId` in payload

### "Find Soonest Available"
- Client picks service but not location
- System queries all locations for next available slot
- Returns soonest option per location
- Client picks which one

---

## Feature 5: Location-Based Permissions

### Permission Rules
| Role | Location Access |
|------|----------------|
| Owner | All locations |
| Admin | All locations |
| Manager | Only assigned locations |
| Staff | Only assigned locations |
| Receptionist | Only assigned locations |

### Implementation
```typescript
async function getUserLocationIds(userId: string, role: string): Promise<string[] | null> {
  if (role === 'owner' || role === 'admin') return null;

  const assignments = await prisma.staffLocation.findMany({
    where: { staffId: userId },
    select: { locationId: true }
  });
  return assignments.map(a => a.locationId);
}
```

### What Gets Filtered
- Appointments list/calendar
- Staff list (only staff at their locations)
- Reports data
- Dashboard metrics

### What's NOT Filtered
- Services (global catalog)
- Clients (unified database)

---

## Feature 6: Billing Integration

### Database Changes
```prisma
model Subscription {
  // existing fields...
  additionalLocations  Int  @default(0) @map("additional_locations")
}
```

### Pricing Logic
- Base plan includes 1 location (free)
- Each additional location = $100/month
- Total = Base + (additionalLocations × $100)

### When Location Added
1. Count current locations
2. If count > 1 and `multiLocationEnabled` false → reject
3. Update `subscription.additionalLocations`
4. Update Stripe subscription
5. Prorate for current billing period

### When Location Deleted
1. Update `subscription.additionalLocations`
2. Update Stripe subscription
3. Credit prorated amount

---

## Feature 7: Flagship Syncing (Optional)

### Database Changes
```prisma
model Salon {
  // existing fields...
  syncServicesFromFlagship   Boolean @default(false) @map("sync_services_from_flagship")
  syncPricingFromFlagship    Boolean @default(false) @map("sync_pricing_from_flagship")
  syncSettingsFromFlagship   Boolean @default(false) @map("sync_settings_from_flagship")
}
```

### What CAN Sync
| Category | Sync Behavior |
|----------|--------------|
| Services | New services auto-enabled at all locations |
| Pricing | Price changes propagate (clears overrides) |
| Settings | Widget colors, notifications |

### What NEVER Syncs
- Business hours
- Staff schedules
- Staff assignments
- Contact info / address

### Behavior
- Owner can still set per-location overrides even with sync on
- Override "pins" that location's value

---

## Implementation Priority

| Priority | Feature | Dependency |
|----------|---------|------------|
| 1 | Location Hours | None |
| 2 | Staff Schedules per Location | None |
| 3 | Booking Flow Location Selection | 1, 2 |
| 4 | Dashboard Location Filtering | None |
| 5 | Reports Location Filtering | None |
| 6 | Location-Based Permissions | None |
| 7 | Billing Integration | None |
| 8 | Flagship Syncing | None |

---

## Files to Modify

### Database
- `packages/database/prisma/schema.prisma`

### API
- `apps/api/src/routes/locations.ts`
- `apps/api/src/routes/users.ts`
- `apps/api/src/routes/public.ts`
- `apps/api/src/routes/dashboard.ts`
- `apps/api/src/routes/reports.ts`
- `apps/api/src/middleware/permissions.ts`

### Frontend
- `apps/web/src/app/locations/page.tsx`
- `apps/web/src/app/embed/[slug]/page.tsx`
- `apps/web/src/app/dashboard/page.tsx`
- `apps/web/src/app/reports/page.tsx`
- `apps/web/src/app/staff/page.tsx`
- `apps/web/src/hooks/useLocations.tsx`
