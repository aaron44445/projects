# Multi-Location System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete multi-location system with structured hours, per-location staff schedules, booking flow, dashboard/reports filtering, and billing integration.

**Architecture:** Extend existing Location model with LocationHours, modify StaffAvailability to support per-location schedules, add location filtering throughout dashboard/reports/booking APIs, integrate with Stripe for per-location billing.

**Tech Stack:** Prisma, Express.js, Next.js 14, React, Stripe, PostgreSQL (Supabase)

---

## Phase 1: Database Schema Updates

### Task 1.1: Add LocationHours Model

**Files:**
- Modify: `packages/database/prisma/schema.prisma:257-280`

**Step 1: Add LocationHours model after Location model**

Add this after the Location model (around line 280):

```prisma
model LocationHours {
  id         String   @id @default(uuid())
  locationId String   @map("location_id")
  dayOfWeek  Int      @map("day_of_week")
  openTime   String?  @map("open_time")
  closeTime  String?  @map("close_time")
  isClosed   Boolean  @default(false) @map("is_closed")
  location   Location @relation(fields: [locationId], references: [id], onDelete: Cascade)

  @@unique([locationId, dayOfWeek])
  @@index([locationId])
  @@map("location_hours")
}
```

**Step 2: Update Location model to add relation**

Add to Location model relations:

```prisma
model Location {
  // ... existing fields ...
  hours            LocationHours[]    // ADD THIS LINE after staffLocations
  // ... rest of model ...
}
```

**Step 3: Verify schema is valid**

Run: `cd packages/database && npx prisma format`
Expected: Schema formatted successfully

---

### Task 1.2: Add locationId to StaffAvailability

**Files:**
- Modify: `packages/database/prisma/schema.prisma:229-240`

**Step 1: Update StaffAvailability model**

Replace the existing StaffAvailability model with:

```prisma
model StaffAvailability {
  id          String    @id @default(uuid())
  staffId     String    @map("staff_id")
  locationId  String?   @map("location_id")
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

**Step 2: Add relation to Location model**

Add to Location model:

```prisma
  staffAvailability StaffAvailability[]
```

---

### Task 1.3: Add Billing Fields to Subscription

**Files:**
- Modify: `packages/database/prisma/schema.prisma:617-636`

**Step 1: Add additionalLocations field to Subscription**

Add after `trialEndsAt` field:

```prisma
  additionalLocations  Int       @default(0) @map("additional_locations")
```

---

### Task 1.4: Add Flagship Sync Fields to Salon

**Files:**
- Modify: `packages/database/prisma/schema.prisma:11-75`

**Step 1: Add sync fields to Salon model**

Add after `multiLocationEnabled` field:

```prisma
  syncServicesFromFlagship   Boolean  @default(false) @map("sync_services_from_flagship")
  syncPricingFromFlagship    Boolean  @default(false) @map("sync_pricing_from_flagship")
  syncSettingsFromFlagship   Boolean  @default(false) @map("sync_settings_from_flagship")
```

---

### Task 1.5: Generate and Push Migration

**Step 1: Generate Prisma client**

Run: `cd packages/database && npx prisma generate`
Expected: Prisma Client generated

**Step 2: Push schema to database**

Run: `cd packages/database && npx prisma db push`
Expected: Database synced with schema

**Step 3: Build database package**

Run: `cd packages/database && pnpm build`
Expected: Build successful

**Step 4: Commit schema changes**

```bash
git add packages/database/prisma/schema.prisma
git commit -m "feat(db): add LocationHours, per-location StaffAvailability, billing fields"
```

---

## Phase 2: Location Hours API

### Task 2.1: Add Location Hours Endpoints

**Files:**
- Modify: `apps/api/src/routes/locations.ts`

**Step 1: Add GET endpoint for location hours**

Add after the GET `/:id/services` endpoint (around line 427):

```typescript
/**
 * GET /api/v1/locations/:id/hours
 * Get structured business hours for a location
 */
locationsRouter.get('/:id/hours', asyncHandler(async (req, res, next) => {
  try {
    const { salonId } = req.user!;
    const { id } = req.params;

    const location = await prisma.location.findFirst({
      where: { id, salonId },
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Location not found' },
      });
    }

    const hours = await prisma.locationHours.findMany({
      where: { locationId: id },
      orderBy: { dayOfWeek: 'asc' },
    });

    // If no hours exist, return default template
    if (hours.length === 0) {
      const defaultHours = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
        dayOfWeek: day,
        openTime: day === 0 ? null : '09:00',
        closeTime: day === 0 ? null : '17:00',
        isClosed: day === 0,
      }));
      return res.json({ success: true, data: defaultHours });
    }

    res.json({ success: true, data: hours });
  } catch (error) {
    next(error);
  }
}));
```

**Step 2: Add PUT endpoint to update location hours**

```typescript
/**
 * PUT /api/v1/locations/:id/hours
 * Update structured business hours for a location
 */
locationsRouter.put('/:id/hours', authorize('admin', 'owner'), asyncHandler(async (req, res, next) => {
  try {
    const { salonId } = req.user!;
    const { id } = req.params;
    const { hours } = req.body;

    if (!Array.isArray(hours) || hours.length !== 7) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Hours must be array of 7 days' },
      });
    }

    const location = await prisma.location.findFirst({
      where: { id, salonId },
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Location not found' },
      });
    }

    // Upsert all 7 days
    const upsertedHours = await Promise.all(
      hours.map((h: { dayOfWeek: number; openTime?: string; closeTime?: string; isClosed?: boolean }) =>
        prisma.locationHours.upsert({
          where: {
            locationId_dayOfWeek: {
              locationId: id,
              dayOfWeek: h.dayOfWeek,
            },
          },
          create: {
            locationId: id,
            dayOfWeek: h.dayOfWeek,
            openTime: h.isClosed ? null : h.openTime,
            closeTime: h.isClosed ? null : h.closeTime,
            isClosed: h.isClosed ?? false,
          },
          update: {
            openTime: h.isClosed ? null : h.openTime,
            closeTime: h.isClosed ? null : h.closeTime,
            isClosed: h.isClosed ?? false,
          },
        })
      )
    );

    res.json({ success: true, data: upsertedHours });
  } catch (error) {
    next(error);
  }
}));
```

**Step 3: Verify API compiles**

Run: `cd apps/api && pnpm build`
Expected: Build successful

**Step 4: Commit**

```bash
git add apps/api/src/routes/locations.ts
git commit -m "feat(api): add location hours endpoints"
```

---

## Phase 3: Staff Per-Location Schedules API

### Task 3.1: Update Staff Availability Endpoints

**Files:**
- Modify: `apps/api/src/routes/users.ts`

**Step 1: Update GET availability endpoint to support locationId**

Find the existing availability endpoint and update to filter by locationId:

```typescript
/**
 * GET /api/v1/users/:id/availability
 * Get staff availability (optionally per location)
 */
router.get('/:id/availability', authenticate, asyncHandler(async (req, res) => {
  const { salonId } = req.user!;
  const { id } = req.params;
  const { locationId } = req.query;

  const staff = await prisma.user.findFirst({
    where: { id, salonId },
  });

  if (!staff) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Staff not found' },
    });
  }

  // Get availability - if locationId specified, get location-specific + global fallback
  const availability = await prisma.staffAvailability.findMany({
    where: {
      staffId: id,
      ...(locationId ? {
        OR: [
          { locationId: locationId as string },
          { locationId: null },
        ],
      } : {}),
    },
    orderBy: [{ locationId: 'asc' }, { dayOfWeek: 'asc' }],
  });

  // If locationId specified, merge location-specific over global
  if (locationId) {
    const merged: Record<number, any> = {};
    availability.forEach((a) => {
      // Location-specific takes precedence
      if (a.locationId === locationId || !merged[a.dayOfWeek]) {
        merged[a.dayOfWeek] = a;
      }
    });
    return res.json({ success: true, data: Object.values(merged) });
  }

  res.json({ success: true, data: availability });
}));
```

**Step 2: Update PUT availability endpoint to support locationId**

```typescript
/**
 * PUT /api/v1/users/:id/availability
 * Update staff availability (optionally per location)
 */
router.put('/:id/availability', authenticate, authorize('admin', 'owner', 'manager'), asyncHandler(async (req, res) => {
  const { salonId } = req.user!;
  const { id } = req.params;
  const { availability, locationId } = req.body;

  if (!Array.isArray(availability)) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Availability must be an array' },
    });
  }

  const staff = await prisma.user.findFirst({
    where: { id, salonId },
  });

  if (!staff) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Staff not found' },
    });
  }

  // If locationId provided, verify staff is assigned to that location
  if (locationId) {
    const staffLocation = await prisma.staffLocation.findUnique({
      where: { staffId_locationId: { staffId: id, locationId } },
    });
    if (!staffLocation) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_LOCATION', message: 'Staff not assigned to this location' },
      });
    }
  }

  // Upsert availability records
  const updated = await Promise.all(
    availability.map((a: { dayOfWeek: number; startTime: string; endTime: string; isAvailable: boolean }) =>
      prisma.staffAvailability.upsert({
        where: {
          staffId_locationId_dayOfWeek: {
            staffId: id,
            locationId: locationId || null,
            dayOfWeek: a.dayOfWeek,
          },
        },
        create: {
          staffId: id,
          locationId: locationId || null,
          dayOfWeek: a.dayOfWeek,
          startTime: a.startTime,
          endTime: a.endTime,
          isAvailable: a.isAvailable,
        },
        update: {
          startTime: a.startTime,
          endTime: a.endTime,
          isAvailable: a.isAvailable,
        },
      })
    )
  );

  res.json({ success: true, data: updated });
}));
```

**Step 3: Commit**

```bash
git add apps/api/src/routes/users.ts
git commit -m "feat(api): add per-location staff availability"
```

---

## Phase 4: Reports Location Filtering

### Task 4.1: Add Location Filter to Reports

**Files:**
- Modify: `apps/api/src/routes/reports.ts`

**Step 1: Update revenue report to filter by locationId**

Add after `const { startDate, endDate, groupBy = 'daily' } = req.query;`:

```typescript
const { locationId } = req.query;
const locationFilter = locationId ? { appointment: { locationId: locationId as string } } : {};
```

Update queries to include filter:

```typescript
const currentRevenue = await prisma.payment.aggregate({
  where: {
    salonId,
    status: 'completed',
    createdAt: { gte: start, lte: end },
    ...locationFilter,
  },
  // ...
});
```

**Step 2: Update services report**

Add location filter to appointments query:

```typescript
const { locationId } = req.query;
const locationFilter = locationId ? { locationId: locationId as string } : {};

const appointments = await prisma.appointment.findMany({
  where: {
    salonId,
    startTime: { gte: start, lte: end },
    status: { notIn: ['cancelled'] },
    ...locationFilter,
  },
  // ...
});
```

**Step 3: Update staff report**

Add location filter:

```typescript
const { locationId } = req.query;
const locationFilter = locationId ? { locationId: locationId as string } : {};

// In appointments query for each staff member:
const appointments = await prisma.appointment.findMany({
  where: {
    salonId,
    staffId: s.id,
    startTime: { gte: start, lte: end },
    status: { notIn: ['cancelled'] },
    ...locationFilter,
  },
  // ...
});
```

**Step 4: Update clients report**

Add location filter to appointment queries:

```typescript
const { locationId } = req.query;
const locationFilter = locationId ? { locationId: locationId as string } : {};
```

**Step 5: Update overview report**

Add location filter to all queries.

**Step 6: Add location comparison endpoint**

Add new endpoint after `/overview`:

```typescript
/**
 * GET /api/v1/reports/by-location
 * Compare metrics across all locations
 */
router.get('/by-location', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const salonId = req.user!.salonId;
  const { startDate, endDate } = req.query;

  const { start, end } = getDateRange(startDate as string, endDate as string);

  // Get all locations
  const locations = await prisma.location.findMany({
    where: { salonId, isActive: true },
    select: { id: true, name: true, isPrimary: true },
  });

  // Get metrics per location
  const locationStats = await Promise.all(
    locations.map(async (loc) => {
      const [revenue, appointments, clients] = await Promise.all([
        prisma.payment.aggregate({
          where: {
            salonId,
            status: 'completed',
            createdAt: { gte: start, lte: end },
            appointment: { locationId: loc.id },
          },
          _sum: { totalAmount: true },
        }),
        prisma.appointment.count({
          where: {
            salonId,
            locationId: loc.id,
            startTime: { gte: start, lte: end },
            status: { notIn: ['cancelled'] },
          },
        }),
        prisma.appointment.findMany({
          where: {
            salonId,
            locationId: loc.id,
            startTime: { gte: start, lte: end },
            status: { notIn: ['cancelled'] },
          },
          select: { clientId: true },
          distinct: ['clientId'],
        }),
      ]);

      return {
        id: loc.id,
        name: loc.name,
        isPrimary: loc.isPrimary,
        revenue: revenue._sum.totalAmount || 0,
        appointments,
        uniqueClients: clients.length,
      };
    })
  );

  res.json({
    success: true,
    data: {
      locations: locationStats.sort((a, b) => b.revenue - a.revenue),
      totals: {
        revenue: locationStats.reduce((sum, l) => sum + l.revenue, 0),
        appointments: locationStats.reduce((sum, l) => sum + l.appointments, 0),
      },
    },
  });
}));
```

**Step 7: Commit**

```bash
git add apps/api/src/routes/reports.ts
git commit -m "feat(api): add location filtering to all reports"
```

---

## Phase 5: Booking Flow Location Selection

### Task 5.1: Update Public API for Location-Aware Booking

**Files:**
- Modify: `apps/api/src/routes/public.ts`

**Step 1: Update availability endpoint to check location hours**

Find the `/:slug/availability` endpoint and update:

```typescript
router.get('/:slug/availability', asyncHandler(async (req: Request, res: Response) => {
  const { date, serviceId, staffId, locationId } = req.query;

  // ... existing salon/service validation ...

  const dayOfWeek = new Date(date as string).getDay();

  // Check location hours if locationId provided
  let locationHours = null;
  if (locationId) {
    locationHours = await prisma.locationHours.findUnique({
      where: {
        locationId_dayOfWeek: {
          locationId: locationId as string,
          dayOfWeek,
        },
      },
    });

    // If location is closed, return empty slots
    if (locationHours?.isClosed || (!locationHours?.openTime && !locationHours?.closeTime)) {
      return res.json({ success: true, data: [] });
    }
  }

  // Use location hours if available, otherwise default
  const openTime = locationHours?.openTime || '09:00';
  const closeTime = locationHours?.closeTime || '17:00';

  // ... rest of availability logic using openTime/closeTime ...
}));
```

**Step 2: Update staff filter in availability to respect location**

When building staff filter, add location check:

```typescript
if (locationId) {
  const availableStaff = await prisma.user.findMany({
    where: {
      salonId: salon.id,
      isActive: true,
      staffServices: {
        some: {
          serviceId: serviceId as string,
          isAvailable: true,
        },
      },
      staffLocations: {
        some: {
          locationId: locationId as string,
        },
      },
    },
    select: { id: true },
  });
  staffFilter = { staffId: { in: availableStaff.map((s) => s.id) } };
}
```

**Step 3: Add endpoint to find soonest available across locations**

```typescript
/**
 * GET /api/v1/public/:slug/soonest-available
 * Find soonest available slot across all locations
 */
router.get('/:slug/soonest-available', asyncHandler(async (req: Request, res: Response) => {
  const { serviceId } = req.query;

  if (!serviceId) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_PARAMS', message: 'serviceId is required' },
    });
  }

  const salon = await prisma.salon.findUnique({
    where: { slug: req.params.slug },
    select: { id: true },
  });

  if (!salon) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Salon not found' },
    });
  }

  const locations = await prisma.location.findMany({
    where: { salonId: salon.id, isActive: true },
    select: { id: true, name: true, address: true, city: true, state: true },
  });

  // Check next 14 days for availability at each location
  const results: Array<{
    locationId: string;
    locationName: string;
    address: string;
    date: string;
    time: string;
  }> = [];

  for (const location of locations) {
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const checkDate = new Date();
      checkDate.setDate(checkDate.getDate() + dayOffset);
      const dateStr = checkDate.toISOString().split('T')[0];

      // Get availability for this location/date (reuse existing logic)
      // If slot found, add to results and break inner loop
      // ... simplified for plan - actual implementation would call availability logic
    }
  }

  res.json({
    success: true,
    data: results.sort((a, b) =>
      new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime()
    ),
  });
}));
```

**Step 4: Commit**

```bash
git add apps/api/src/routes/public.ts
git commit -m "feat(api): add location-aware booking availability"
```

---

## Phase 6: Frontend - Location Hours UI

### Task 6.1: Add Hours Editor to Locations Page

**Files:**
- Modify: `apps/web/src/app/locations/page.tsx`
- Modify: `apps/web/src/hooks/useLocations.tsx`

**Step 1: Add hours state and API calls to useLocations hook**

Add to useLocations.tsx:

```typescript
interface LocationHours {
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
}

// Add to return type and implementation:
const getLocationHours = useCallback(async (locationId: string): Promise<LocationHours[]> => {
  try {
    const response = await api.get<LocationHours[]>(`/locations/${locationId}/hours`);
    if (response.success && response.data) {
      return response.data;
    }
    return [];
  } catch (err) {
    setError(err instanceof ApiError ? err.message : 'Failed to fetch hours');
    return [];
  }
}, []);

const updateLocationHours = useCallback(async (locationId: string, hours: LocationHours[]): Promise<void> => {
  try {
    await api.put(`/locations/${locationId}/hours`, { hours });
  } catch (err) {
    setError(err instanceof ApiError ? err.message : 'Failed to update hours');
    throw err;
  }
}, []);
```

**Step 2: Add Hours Editor component to locations page**

Add HoursEditor component in locations/page.tsx:

```typescript
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function HoursEditor({
  hours,
  onChange
}: {
  hours: LocationHours[];
  onChange: (hours: LocationHours[]) => void;
}) {
  const updateDay = (dayOfWeek: number, updates: Partial<LocationHours>) => {
    const newHours = hours.map((h) =>
      h.dayOfWeek === dayOfWeek ? { ...h, ...updates } : h
    );
    onChange(newHours);
  };

  return (
    <div className="space-y-3">
      {DAYS.map((day, index) => {
        const dayHours = hours.find((h) => h.dayOfWeek === index) || {
          dayOfWeek: index,
          openTime: '09:00',
          closeTime: '17:00',
          isClosed: false,
        };

        return (
          <div key={day} className="flex items-center gap-4">
            <span className="w-24 text-sm font-medium">{day}</span>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={dayHours.isClosed}
                onChange={(e) => updateDay(index, { isClosed: e.target.checked })}
                className="rounded border-charcoal/20"
              />
              <span className="text-sm text-charcoal/60">Closed</span>
            </label>
            {!dayHours.isClosed && (
              <>
                <input
                  type="time"
                  value={dayHours.openTime || '09:00'}
                  onChange={(e) => updateDay(index, { openTime: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-charcoal/20 text-sm"
                />
                <span className="text-charcoal/40">to</span>
                <input
                  type="time"
                  value={dayHours.closeTime || '17:00'}
                  onChange={(e) => updateDay(index, { closeTime: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-charcoal/20 text-sm"
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

**Step 3: Add hours tab to location edit modal**

Update the location edit modal to include a "Business Hours" section with the HoursEditor.

**Step 4: Commit**

```bash
git add apps/web/src/app/locations/page.tsx apps/web/src/hooks/useLocations.tsx
git commit -m "feat(web): add structured hours editor to locations"
```

---

## Phase 7: Frontend - Dashboard Location Filtering

### Task 7.1: Connect Dashboard to Location Switcher

**Files:**
- Modify: `apps/web/src/app/dashboard/page.tsx`
- Modify: `apps/web/src/hooks/useSalon.ts` (or create useDashboard hook)

**Step 1: Pass locationId to dashboard API calls**

Update dashboard data fetching to include selectedLocationId:

```typescript
const { selectedLocationId } = useLocations();

// In fetch calls:
const statsUrl = selectedLocationId
  ? `/dashboard/stats?locationId=${selectedLocationId}`
  : '/dashboard/stats';
```

**Step 2: Add location comparison cards**

When no specific location is selected ("All Locations"), show comparison:

```typescript
{!selectedLocationId && locations.length > 1 && (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
    {locations.map((loc) => (
      <div key={loc.id} className="bg-white rounded-xl p-4 border border-charcoal/10">
        <h4 className="font-medium text-charcoal">{loc.name}</h4>
        {/* Show per-location quick stats */}
      </div>
    ))}
  </div>
)}
```

**Step 3: Commit**

```bash
git add apps/web/src/app/dashboard/page.tsx
git commit -m "feat(web): connect dashboard to location switcher"
```

---

## Phase 8: Frontend - Reports Location Filtering

### Task 8.1: Add Location Filter to Reports Page

**Files:**
- Modify: `apps/web/src/app/reports/page.tsx`

**Step 1: Add LocationSwitcher to reports page header**

**Step 2: Pass locationId to all report API calls**

**Step 3: Add "By Location" report section**

```typescript
// Add new tab or section for location comparison
<TabsContent value="by-location">
  <LocationComparisonChart data={locationData} />
</TabsContent>
```

**Step 4: Commit**

```bash
git add apps/web/src/app/reports/page.tsx
git commit -m "feat(web): add location filtering to reports"
```

---

## Phase 9: Booking Widget Location Selection

### Task 9.1: Update Embed Booking Page

**Files:**
- Modify: `apps/web/src/app/embed/[slug]/page.tsx`

**Step 1: Add location selection as first step**

Update booking flow state:

```typescript
type BookingStep = 'location' | 'service' | 'staff' | 'time' | 'details' | 'confirm';

const [step, setStep] = useState<BookingStep>('location');
const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
```

**Step 2: Create LocationStep component**

```typescript
function LocationStep({
  locations,
  onSelect,
  onFindSoonest
}: {
  locations: Location[];
  onSelect: (id: string) => void;
  onFindSoonest: () => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Select a Location</h2>

      <button
        onClick={onFindSoonest}
        className="w-full p-4 border-2 border-dashed border-sage/50 rounded-xl text-sage hover:bg-sage/5"
      >
        Find Soonest Available Across All Locations
      </button>

      <div className="space-y-3">
        {locations.map((loc) => (
          <button
            key={loc.id}
            onClick={() => onSelect(loc.id)}
            className="w-full p-4 bg-white border border-charcoal/10 rounded-xl text-left hover:border-sage"
          >
            <p className="font-medium">{loc.name}</p>
            <p className="text-sm text-charcoal/60">
              {loc.address}, {loc.city}, {loc.state}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Step 3: Filter services and staff by selected location**

Update service fetch to include locationId:

```typescript
const servicesUrl = selectedLocationId
  ? `/public/${slug}/services?locationId=${selectedLocationId}`
  : `/public/${slug}/services`;
```

**Step 4: Update confirmation to show location details**

**Step 5: Commit**

```bash
git add apps/web/src/app/embed/[slug]/page.tsx
git commit -m "feat(web): add location selection to booking widget"
```

---

## Phase 10: Final Integration & Testing

### Task 10.1: End-to-End Testing

**Step 1: Create test locations**

1. Log in as owner
2. Go to Settings → Enable multi-location
3. Go to Locations → Add "Downtown" location
4. Add "Uptown" location

**Step 2: Test staff assignment**

1. Assign staff member to both locations
2. Set different schedules per location

**Step 3: Test service overrides**

1. Set different price for service at Uptown
2. Disable one service at Downtown

**Step 4: Test booking flow**

1. Open booking widget
2. Select Downtown → verify services/staff filtered
3. Select Uptown → verify different pricing shown

**Step 5: Test dashboard/reports**

1. Switch location in dashboard → verify filtered metrics
2. View "All Locations" → verify aggregated data
3. Check reports by location

### Task 10.2: Final Commit

```bash
git add -A
git commit -m "feat: complete multi-location system implementation"
```

---

## Implementation Checklist

- [ ] Phase 1: Database schema updates
- [ ] Phase 2: Location hours API
- [ ] Phase 3: Staff per-location schedules API
- [ ] Phase 4: Reports location filtering
- [ ] Phase 5: Booking flow location selection
- [ ] Phase 6: Frontend location hours UI
- [ ] Phase 7: Dashboard location filtering
- [ ] Phase 8: Reports location filtering UI
- [ ] Phase 9: Booking widget location step
- [ ] Phase 10: End-to-end testing
