# Staff Self-Service Schedule Management Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable staff members to view and edit their working hours, see their assignments, request time off with approval workflow, and view appointments—all from the /staff/schedule page.

**Architecture:** Extend existing StaffAvailability model for per-location schedules, add approval workflow fields to TimeOff model, create new staff-portal API endpoints for self-service, rebuild /staff/schedule page with working hours editor, assignments display, and time-off management integrated with existing appointments calendar.

**Tech Stack:** Prisma, Express.js, Next.js 14, React, TailwindCSS, TypeScript

---

## Phase 1: Database Schema Updates

### Task 1.1: Update TimeOff Model for Approval Workflow

**Files:**
- Modify: `packages/database/prisma/schema.prisma:242-255`

**Step 1: Update TimeOff model**

Find the existing TimeOff model and replace with:

```prisma
model TimeOff {
  id           String    @id @default(uuid())
  staffId      String    @map("staff_id")
  startDate    DateTime  @map("start_date")
  endDate      DateTime  @map("end_date")
  type         String    @default("vacation") // vacation, sick, personal, other
  reason       String?
  notes        String?
  status       String    @default("pending") // pending, approved, rejected
  reviewedAt   DateTime? @map("reviewed_at")
  reviewedBy   String?   @map("reviewed_by")
  reviewNotes  String?   @map("review_notes")
  createdAt    DateTime  @default(now()) @map("created_at")
  staff        User      @relation(fields: [staffId], references: [id], onDelete: Cascade)
  reviewer     User?     @relation("TimeOffReviewer", fields: [reviewedBy], references: [id])

  @@index([staffId])
  @@index([startDate])
  @@index([status])
  @@map("time_off")
}
```

**Step 2: Add reverse relation to User model**

Find User model and add after the existing `timeOff` relation:

```prisma
  timeOffReviewed     TimeOff[]            @relation("TimeOffReviewer")
```

**Step 3: Validate schema**

Run: `cd packages/database && npx prisma format`
Expected: Schema formatted successfully

---

### Task 1.2: Add ScheduleChangeRequest Model (for approval workflow)

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

**Step 1: Add new model after TimeOff**

```prisma
model ScheduleChangeRequest {
  id            String    @id @default(uuid())
  staffId       String    @map("staff_id")
  locationId    String?   @map("location_id")
  dayOfWeek     Int       @map("day_of_week")
  newStartTime  String?   @map("new_start_time")
  newEndTime    String?   @map("new_end_time")
  newIsWorking  Boolean   @map("new_is_working")
  status        String    @default("pending") // pending, approved, rejected
  requestedAt   DateTime  @default(now()) @map("requested_at")
  reviewedAt    DateTime? @map("reviewed_at")
  reviewedBy    String?   @map("reviewed_by")
  reviewNotes   String?   @map("review_notes")
  staff         User      @relation(fields: [staffId], references: [id], onDelete: Cascade)
  location      Location? @relation(fields: [locationId], references: [id], onDelete: Cascade)
  reviewer      User?     @relation("ScheduleChangeReviewer", fields: [reviewedBy], references: [id])

  @@index([staffId])
  @@index([status])
  @@map("schedule_change_requests")
}
```

**Step 2: Add relations to User and Location models**

In User model, add:
```prisma
  scheduleChangeRequests    ScheduleChangeRequest[]
  scheduleChangesReviewed   ScheduleChangeRequest[] @relation("ScheduleChangeReviewer")
```

In Location model, add:
```prisma
  scheduleChangeRequests ScheduleChangeRequest[]
```

---

### Task 1.3: Add Staff Settings to Salon Model

**Files:**
- Modify: `packages/database/prisma/schema.prisma:11-75`

**Step 1: Add staff settings fields to Salon model**

Add after `syncSettingsFromFlagship`:

```prisma
  staffCanEditSchedule        Boolean  @default(true) @map("staff_can_edit_schedule")
  staffScheduleNeedsApproval  Boolean  @default(false) @map("staff_schedule_needs_approval")
  staffCanRequestTimeOff      Boolean  @default(true) @map("staff_can_request_time_off")
  staffCanViewClientContact   Boolean  @default(true) @map("staff_can_view_client_contact")
  staffCanCompleteAppointments Boolean @default(true) @map("staff_can_complete_appointments")
```

---

### Task 1.4: Generate and Push Migration

**Step 1: Generate Prisma client**

Run: `cd packages/database && npx prisma generate`

**Step 2: Push schema to database**

Run: `cd packages/database && npx prisma db push`

**Step 3: Build database package**

Run: `cd packages/database && pnpm build`

**Step 4: Commit**

```bash
git add packages/database/prisma/schema.prisma
git commit -m "feat(db): add TimeOff approval workflow and ScheduleChangeRequest model"
```

---

## Phase 2: Staff Portal API Endpoints

### Task 2.1: Add My Schedule Endpoints

**Files:**
- Modify: `apps/api/src/routes/staffPortal.ts`

**Step 1: Add GET /my-schedule endpoint**

Add after existing routes:

```typescript
// ============================================
// GET /api/v1/staff-portal/my-schedule
// Get current staff member's working hours
// ============================================
router.get('/my-schedule', authenticate, staffOnly, asyncHandler(async (req: Request, res: Response) => {
  const staffId = req.user!.userId;
  const { locationId } = req.query;

  // Get staff's location assignments
  const staffLocations = await prisma.staffLocation.findMany({
    where: { staffId },
    include: {
      location: {
        select: { id: true, name: true, isPrimary: true },
      },
    },
  });

  // Get availability for all locations or specific location
  const availability = await prisma.staffAvailability.findMany({
    where: {
      staffId,
      ...(locationId ? { locationId: locationId as string } : {}),
    },
    orderBy: [{ locationId: 'asc' }, { dayOfWeek: 'asc' }],
  });

  // Group by location
  const scheduleByLocation: Record<string, any> = {};

  for (const loc of staffLocations) {
    const locationAvailability = availability.filter(a =>
      a.locationId === loc.locationId || (a.locationId === null && !locationId)
    );

    // Create 7-day schedule with defaults
    const days = [0, 1, 2, 3, 4, 5, 6].map(dayOfWeek => {
      const existing = locationAvailability.find(a => a.dayOfWeek === dayOfWeek);
      return existing || {
        dayOfWeek,
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: false,
        locationId: loc.locationId,
      };
    });

    scheduleByLocation[loc.locationId] = {
      location: loc.location,
      isPrimary: loc.isPrimary,
      schedule: days,
    };
  }

  // Calculate total hours per week
  const totalHoursPerWeek = availability
    .filter(a => a.isAvailable)
    .reduce((total, a) => {
      const [startH, startM] = a.startTime.split(':').map(Number);
      const [endH, endM] = a.endTime.split(':').map(Number);
      const hours = (endH + endM / 60) - (startH + startM / 60);
      return total + hours;
    }, 0);

  res.json({
    success: true,
    data: {
      locations: staffLocations.map(sl => sl.location),
      scheduleByLocation,
      totalHoursPerWeek: Math.round(totalHoursPerWeek * 10) / 10,
    },
  });
}));
```

**Step 2: Add PUT /my-schedule endpoint**

```typescript
// ============================================
// PUT /api/v1/staff-portal/my-schedule
// Update staff member's working hours
// ============================================
router.put('/my-schedule', authenticate, staffOnly, asyncHandler(async (req: Request, res: Response) => {
  const staffId = req.user!.userId;
  const salonId = req.user!.salonId;
  const { locationId, schedule } = req.body;

  if (!Array.isArray(schedule) || schedule.length !== 7) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Schedule must be array of 7 days' },
    });
  }

  // Check salon settings
  const salon = await prisma.salon.findUnique({
    where: { id: salonId },
    select: {
      staffCanEditSchedule: true,
      staffScheduleNeedsApproval: true,
    },
  });

  if (!salon?.staffCanEditSchedule) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Schedule editing is disabled. Contact your manager.' },
    });
  }

  // Verify staff is assigned to this location (if locationId provided)
  if (locationId) {
    const staffLocation = await prisma.staffLocation.findUnique({
      where: { staffId_locationId: { staffId, locationId } },
    });
    if (!staffLocation) {
      return res.status(400).json({
        success: false,
        error: { code: 'NOT_ASSIGNED', message: 'You are not assigned to this location' },
      });
    }
  }

  // If approval required, create change requests instead
  if (salon.staffScheduleNeedsApproval) {
    const requests = await Promise.all(
      schedule.map((s: { dayOfWeek: number; startTime: string; endTime: string; isWorking: boolean }) =>
        prisma.scheduleChangeRequest.create({
          data: {
            staffId,
            locationId: locationId || null,
            dayOfWeek: s.dayOfWeek,
            newStartTime: s.isWorking ? s.startTime : null,
            newEndTime: s.isWorking ? s.endTime : null,
            newIsWorking: s.isWorking,
            status: 'pending',
          },
        })
      )
    );

    return res.json({
      success: true,
      data: {
        pendingApproval: true,
        message: 'Schedule changes submitted for approval',
        requests,
      },
    });
  }

  // Direct update (no approval needed)
  const updated = await Promise.all(
    schedule.map((s: { dayOfWeek: number; startTime: string; endTime: string; isWorking: boolean }) =>
      prisma.staffAvailability.upsert({
        where: {
          staffId_locationId_dayOfWeek: {
            staffId,
            locationId: locationId || null,
            dayOfWeek: s.dayOfWeek,
          },
        },
        create: {
          staffId,
          locationId: locationId || null,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          isAvailable: s.isWorking,
        },
        update: {
          startTime: s.startTime,
          endTime: s.endTime,
          isAvailable: s.isWorking,
        },
      })
    )
  );

  res.json({
    success: true,
    data: {
      pendingApproval: false,
      schedule: updated,
    },
  });
}));
```

**Step 3: Commit**

```bash
git add apps/api/src/routes/staffPortal.ts
git commit -m "feat(api): add staff my-schedule endpoints"
```

---

### Task 2.2: Add My Assignments Endpoint

**Files:**
- Modify: `apps/api/src/routes/staffPortal.ts`

**Step 1: Add GET /my-assignments endpoint**

```typescript
// ============================================
// GET /api/v1/staff-portal/my-assignments
// Get staff's location and service assignments
// ============================================
router.get('/my-assignments', authenticate, staffOnly, asyncHandler(async (req: Request, res: Response) => {
  const staffId = req.user!.userId;

  // Get location assignments
  const locations = await prisma.staffLocation.findMany({
    where: { staffId },
    include: {
      location: {
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          state: true,
          isPrimary: true,
        },
      },
    },
    orderBy: { isPrimary: 'desc' },
  });

  // Get service assignments
  const services = await prisma.staffService.findMany({
    where: { staffId, isAvailable: true },
    include: {
      service: {
        select: {
          id: true,
          name: true,
          price: true,
          durationMinutes: true,
          category: {
            select: { name: true },
          },
        },
      },
    },
  });

  res.json({
    success: true,
    data: {
      locations: locations.map(l => ({
        ...l.location,
        isPrimaryForStaff: l.isPrimary,
      })),
      services: services.map(s => ({
        id: s.service.id,
        name: s.service.name,
        price: s.service.price,
        durationMinutes: s.service.durationMinutes,
        category: s.service.category?.name || 'Uncategorized',
      })),
    },
  });
}));
```

**Step 2: Commit**

```bash
git add apps/api/src/routes/staffPortal.ts
git commit -m "feat(api): add staff my-assignments endpoint"
```

---

### Task 2.3: Update Time Off Endpoints for Approval

**Files:**
- Modify: `apps/api/src/routes/staffPortal.ts`

**Step 1: Update POST /time-off to include type**

Find existing POST /time-off and update to:

```typescript
// ============================================
// POST /api/v1/staff-portal/time-off
// Request time off
// ============================================
router.post('/time-off', authenticate, staffOnly, asyncHandler(async (req: Request, res: Response) => {
  const staffId = req.user!.userId;
  const salonId = req.user!.salonId;
  const { startDate, endDate, type = 'vacation', reason, notes } = req.body;

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_FIELDS', message: 'Start date and end date are required' },
    });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end < start) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_DATES', message: 'End date must be after start date' },
    });
  }

  // Check if staff can request time off
  const salon = await prisma.salon.findUnique({
    where: { id: salonId },
    select: { staffCanRequestTimeOff: true },
  });

  if (!salon?.staffCanRequestTimeOff) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Time off requests are disabled. Contact your manager.' },
    });
  }

  // Check for overlapping requests
  const overlapping = await prisma.timeOff.findFirst({
    where: {
      staffId,
      status: { not: 'rejected' },
      OR: [
        { startDate: { lte: end }, endDate: { gte: start } },
      ],
    },
  });

  if (overlapping) {
    return res.status(400).json({
      success: false,
      error: { code: 'OVERLAP', message: 'You already have a time off request for these dates' },
    });
  }

  const timeOff = await prisma.timeOff.create({
    data: {
      staffId,
      startDate: start,
      endDate: end,
      type,
      reason,
      notes,
      status: 'pending',
    },
  });

  res.status(201).json({
    success: true,
    data: timeOff,
  });
}));
```

**Step 2: Update GET /time-off to return type and status**

Find existing GET /time-off and ensure it returns all fields:

```typescript
// ============================================
// GET /api/v1/staff-portal/time-off
// Get staff's time off requests
// ============================================
router.get('/time-off', authenticate, staffOnly, asyncHandler(async (req: Request, res: Response) => {
  const staffId = req.user!.userId;
  const { status } = req.query;

  const timeOffs = await prisma.timeOff.findMany({
    where: {
      staffId,
      ...(status ? { status: status as string } : {}),
    },
    orderBy: { startDate: 'desc' },
    include: {
      reviewer: {
        select: { firstName: true, lastName: true },
      },
    },
  });

  res.json({
    success: true,
    data: timeOffs.map(t => ({
      id: t.id,
      startDate: t.startDate,
      endDate: t.endDate,
      type: t.type,
      reason: t.reason,
      status: t.status,
      reviewedAt: t.reviewedAt,
      reviewedBy: t.reviewer ? `${t.reviewer.firstName} ${t.reviewer.lastName}` : null,
      reviewNotes: t.reviewNotes,
      createdAt: t.createdAt,
    })),
  });
}));
```

**Step 3: Commit**

```bash
git add apps/api/src/routes/staffPortal.ts
git commit -m "feat(api): add approval workflow to time-off endpoints"
```

---

## Phase 3: Frontend - Staff Schedule Page

### Task 3.1: Add useStaffSchedule Hook

**Files:**
- Modify: `apps/web/src/hooks/useStaffPortal.ts`

**Step 1: Add schedule-related types and hook**

Add to useStaffPortal.ts:

```typescript
// Types
interface StaffScheduleDay {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  locationId: string | null;
}

interface StaffScheduleLocation {
  location: {
    id: string;
    name: string;
    isPrimary: boolean;
  };
  isPrimary: boolean;
  schedule: StaffScheduleDay[];
}

interface StaffScheduleData {
  locations: Array<{ id: string; name: string; isPrimary: boolean }>;
  scheduleByLocation: Record<string, StaffScheduleLocation>;
  totalHoursPerWeek: number;
}

interface StaffAssignments {
  locations: Array<{
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    isPrimary: boolean;
    isPrimaryForStaff: boolean;
  }>;
  services: Array<{
    id: string;
    name: string;
    price: number;
    durationMinutes: number;
    category: string;
  }>;
}

// Hook
export function useStaffSchedule() {
  const [schedule, setSchedule] = useState<StaffScheduleData | null>(null);
  const [assignments, setAssignments] = useState<StaffAssignments | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<StaffScheduleData>('/staff-portal/my-schedule');
      if (response.success && response.data) {
        setSchedule(response.data);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to fetch schedule');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAssignments = useCallback(async () => {
    try {
      const response = await api.get<StaffAssignments>('/staff-portal/my-assignments');
      if (response.success && response.data) {
        setAssignments(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
    }
  }, []);

  const updateSchedule = useCallback(async (
    locationId: string | null,
    newSchedule: Array<{ dayOfWeek: number; startTime: string; endTime: string; isWorking: boolean }>
  ): Promise<{ success: boolean; pendingApproval?: boolean; message?: string }> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.put('/staff-portal/my-schedule', {
        locationId,
        schedule: newSchedule,
      });
      if (response.success) {
        await fetchSchedule(); // Refresh
        return {
          success: true,
          pendingApproval: response.data?.pendingApproval,
          message: response.data?.message,
        };
      }
      return { success: false };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update schedule';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [fetchSchedule]);

  useEffect(() => {
    fetchSchedule();
    fetchAssignments();
  }, [fetchSchedule, fetchAssignments]);

  return {
    schedule,
    assignments,
    loading,
    error,
    fetchSchedule,
    fetchAssignments,
    updateSchedule,
  };
}
```

**Step 2: Commit**

```bash
git add apps/web/src/hooks/useStaffPortal.ts
git commit -m "feat(web): add useStaffSchedule hook"
```

---

### Task 3.2: Rebuild Staff Schedule Page

**Files:**
- Modify: `apps/web/src/app/staff/schedule/page.tsx`

**Step 1: Rewrite the schedule page with all sections**

Replace the entire file content with the new implementation that includes:
- Location dropdown (if multi-location)
- My Working Hours section with view/edit modes
- My Assignments section
- Time Off section with request modal
- Appointments calendar (existing functionality preserved)

```typescript
'use client';

import { useState, useEffect } from 'react';
import {
  Calendar, Clock, MapPin, Scissors, ChevronLeft, ChevronRight,
  Edit3, Save, X, Plus, CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';
import { useStaffSchedule, useStaffAppointments, useTimeOff } from '@/hooks/useStaffPortal';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6; // 6am to 7pm
  const min = (i % 2) * 30;
  return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
});

export default function StaffSchedulePage() {
  const { schedule, assignments, loading, error, updateSchedule } = useStaffSchedule();
  const { timeOffs, createTimeOff, cancelTimeOff, loading: timeOffLoading } = useTimeOff();
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedSchedule, setEditedSchedule] = useState<any[]>([]);
  const [showTimeOffModal, setShowTimeOffModal] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Set default location when schedule loads
  useEffect(() => {
    if (schedule?.locations && schedule.locations.length > 0 && !selectedLocationId) {
      const primary = schedule.locations.find(l => l.isPrimary);
      setSelectedLocationId(primary?.id || schedule.locations[0].id);
    }
  }, [schedule, selectedLocationId]);

  // Get current location's schedule
  const currentSchedule = selectedLocationId && schedule?.scheduleByLocation
    ? schedule.scheduleByLocation[selectedLocationId]?.schedule || []
    : [];

  // Initialize edit mode
  const startEdit = () => {
    setEditedSchedule(currentSchedule.map(s => ({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime || '09:00',
      endTime: s.endTime || '17:00',
      isWorking: s.isAvailable,
    })));
    setEditMode(true);
    setSaveMessage(null);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditedSchedule([]);
    setSaveMessage(null);
  };

  const saveSchedule = async () => {
    const result = await updateSchedule(selectedLocationId, editedSchedule);
    if (result.success) {
      setEditMode(false);
      if (result.pendingApproval) {
        setSaveMessage('Changes submitted for manager approval');
      } else {
        setSaveMessage('Schedule saved successfully');
      }
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const updateDay = (dayOfWeek: number, updates: Partial<typeof editedSchedule[0]>) => {
    setEditedSchedule(prev => prev.map(s =>
      s.dayOfWeek === dayOfWeek ? { ...s, ...updates } : s
    ));
  };

  // Calculate total hours
  const calculateTotalHours = (sched: any[]) => {
    return sched
      .filter(s => s.isWorking || s.isAvailable)
      .reduce((total, s) => {
        const [startH, startM] = (s.startTime || '09:00').split(':').map(Number);
        const [endH, endM] = (s.endTime || '17:00').split(':').map(Number);
        return total + (endH + endM / 60) - (startH + startM / 60);
      }, 0);
  };

  const totalHours = editMode
    ? calculateTotalHours(editedSchedule)
    : calculateTotalHours(currentSchedule);

  if (loading && !schedule) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-cream min-h-screen">
      <h1 className="text-2xl font-semibold text-charcoal">My Schedule</h1>

      {/* Location Selector */}
      {schedule?.locations && schedule.locations.length > 1 && (
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-charcoal/60" />
          <select
            value={selectedLocationId || ''}
            onChange={(e) => {
              setSelectedLocationId(e.target.value);
              setEditMode(false);
            }}
            className="px-4 py-2 rounded-lg border border-charcoal/20 bg-white text-charcoal"
          >
            {schedule.locations.map(loc => (
              <option key={loc.id} value={loc.id}>
                {loc.name} {loc.isPrimary ? '(Primary)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Success Message */}
      {saveMessage && (
        <div className="p-4 bg-sage/10 border border-sage/20 rounded-xl text-sage flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          {saveMessage}
        </div>
      )}

      {/* Working Hours Section */}
      <div className="bg-white rounded-xl border border-charcoal/10 overflow-hidden">
        <div className="p-4 border-b border-charcoal/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-sage" />
            <h2 className="font-semibold text-charcoal">My Working Hours</h2>
          </div>
          {!editMode ? (
            <button
              onClick={startEdit}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-sage hover:bg-sage/10 rounded-lg transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={cancelEdit}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-charcoal/60 hover:bg-charcoal/5 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={saveSchedule}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-sage hover:bg-sage/90 rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          {DAYS.map((day, index) => {
            const daySchedule = editMode
              ? editedSchedule.find(s => s.dayOfWeek === index)
              : currentSchedule.find(s => s.dayOfWeek === index);

            const isWorking = editMode ? daySchedule?.isWorking : daySchedule?.isAvailable;
            const startTime = daySchedule?.startTime || '09:00';
            const endTime = daySchedule?.endTime || '17:00';

            return (
              <div key={day} className="flex items-center gap-4">
                <span className="w-28 text-sm font-medium text-charcoal">{day}</span>

                {editMode ? (
                  <>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isWorking}
                        onChange={(e) => updateDay(index, { isWorking: e.target.checked })}
                        className="rounded border-charcoal/20 text-sage focus:ring-sage"
                      />
                      <span className="text-sm text-charcoal/60">Working</span>
                    </label>
                    {isWorking && (
                      <>
                        <select
                          value={startTime}
                          onChange={(e) => updateDay(index, { startTime: e.target.value })}
                          className="px-3 py-1.5 rounded-lg border border-charcoal/20 text-sm"
                        >
                          {TIME_OPTIONS.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <span className="text-charcoal/40">to</span>
                        <select
                          value={endTime}
                          onChange={(e) => updateDay(index, { endTime: e.target.value })}
                          className="px-3 py-1.5 rounded-lg border border-charcoal/20 text-sm"
                        >
                          {TIME_OPTIONS.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </>
                    )}
                  </>
                ) : (
                  <span className={`text-sm ${isWorking ? 'text-charcoal' : 'text-charcoal/40'}`}>
                    {isWorking ? `${formatTime(startTime)} - ${formatTime(endTime)}` : 'OFF'}
                  </span>
                )}
              </div>
            );
          })}

          <div className="pt-3 mt-3 border-t border-charcoal/10">
            <span className="text-sm text-charcoal/60">
              Total: <strong className="text-charcoal">{totalHours.toFixed(1)} hours/week</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Assignments Section */}
      {assignments && (
        <div className="bg-white rounded-xl border border-charcoal/10 overflow-hidden">
          <div className="p-4 border-b border-charcoal/10">
            <h2 className="font-semibold text-charcoal">My Assignments</h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-charcoal/60 mb-2">
                <MapPin className="w-4 h-4" />
                Locations
              </div>
              <div className="flex flex-wrap gap-2">
                {assignments.locations.map(loc => (
                  <span
                    key={loc.id}
                    className="px-3 py-1 bg-sage/10 text-sage rounded-full text-sm"
                  >
                    {loc.name}
                    {loc.isPrimaryForStaff && ' (Primary)'}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm text-charcoal/60 mb-2">
                <Scissors className="w-4 h-4" />
                Services
              </div>
              <div className="flex flex-wrap gap-2">
                {assignments.services.length > 0 ? (
                  assignments.services.map(svc => (
                    <span
                      key={svc.id}
                      className="px-3 py-1 bg-lavender/20 text-charcoal rounded-full text-sm"
                    >
                      {svc.name} (${svc.price})
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-charcoal/40">
                    No services assigned. Contact your manager.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time Off Section */}
      <div className="bg-white rounded-xl border border-charcoal/10 overflow-hidden">
        <div className="p-4 border-b border-charcoal/10 flex items-center justify-between">
          <h2 className="font-semibold text-charcoal">Time Off</h2>
          <button
            onClick={() => setShowTimeOffModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-sage hover:bg-sage/90 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Request Time Off
          </button>
        </div>
        <div className="p-4">
          {timeOffs && timeOffs.length > 0 ? (
            <div className="space-y-3">
              {timeOffs.slice(0, 5).map(request => (
                <TimeOffRow key={request.id} request={request} onCancel={cancelTimeOff} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-charcoal/40">No time off requests</p>
          )}
        </div>
      </div>

      {/* Appointments Section - Use existing calendar component */}
      <AppointmentsCalendar />

      {/* Time Off Request Modal */}
      {showTimeOffModal && (
        <TimeOffRequestModal
          onClose={() => setShowTimeOffModal(false)}
          onSubmit={async (data) => {
            await createTimeOff(data);
            setShowTimeOffModal(false);
          }}
          loading={timeOffLoading}
        />
      )}
    </div>
  );
}

// Helper function
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

// Time Off Row Component
function TimeOffRow({ request, onCancel }: { request: any; onCancel: (id: string) => void }) {
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric'
  });

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  const StatusIcon = {
    pending: AlertCircle,
    approved: CheckCircle2,
    rejected: XCircle,
  }[request.status as keyof typeof statusColors] || AlertCircle;

  return (
    <div className="flex items-center justify-between p-3 bg-charcoal/5 rounded-lg">
      <div className="flex items-center gap-3">
        <StatusIcon className={`w-5 h-5 ${
          request.status === 'approved' ? 'text-green-600' :
          request.status === 'rejected' ? 'text-red-600' : 'text-amber-600'
        }`} />
        <div>
          <p className="text-sm font-medium text-charcoal">
            {formatDate(request.startDate)}
            {request.startDate !== request.endDate && ` - ${formatDate(request.endDate)}`}
          </p>
          <p className="text-xs text-charcoal/60 capitalize">{request.type}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 text-xs rounded-full ${statusColors[request.status as keyof typeof statusColors]}`}>
          {request.status}
        </span>
        {request.status === 'pending' && (
          <button
            onClick={() => onCancel(request.id)}
            className="text-xs text-red-600 hover:text-red-700"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

// Time Off Request Modal Component
function TimeOffRequestModal({
  onClose,
  onSubmit,
  loading
}: {
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  loading: boolean;
}) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState('vacation');
  const [reason, setReason] = useState('');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ startDate, endDate: endDate || startDate, type, reason });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6 m-4">
        <h2 className="text-lg font-semibold text-charcoal mb-4">Request Time Off</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-charcoal/60 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={minDate}
                required
                className="w-full px-3 py-2 rounded-lg border border-charcoal/20"
              />
            </div>
            <div>
              <label className="block text-sm text-charcoal/60 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || minDate}
                className="w-full px-3 py-2 rounded-lg border border-charcoal/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-charcoal/60 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-charcoal/20"
            >
              <option value="vacation">Vacation</option>
              <option value="sick">Sick</option>
              <option value="personal">Personal</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-charcoal/60 mb-1">Reason (optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-charcoal/20 resize-none"
              placeholder="Add a note for your manager..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-charcoal/60 hover:bg-charcoal/5 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !startDate}
              className="px-4 py-2 bg-sage text-white rounded-lg hover:bg-sage/90 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Appointments Calendar Component (simplified version of existing)
function AppointmentsCalendar() {
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    return new Date(today.setDate(diff));
  });

  const { appointments, loading, fetchAppointments } = useStaffAppointments();

  useEffect(() => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    fetchAppointments(weekStart.toISOString(), weekEnd.toISOString());
  }, [weekStart, fetchAppointments]);

  const prevWeek = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() - 7);
    setWeekStart(newStart);
  };

  const nextWeek = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() + 7);
    setWeekStart(newStart);
  };

  const goToToday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    setWeekStart(new Date(today.setDate(diff)));
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  return (
    <div className="bg-white rounded-xl border border-charcoal/10 overflow-hidden">
      <div className="p-4 border-b border-charcoal/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-sage" />
          <h2 className="font-semibold text-charcoal">My Appointments</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goToToday} className="px-3 py-1.5 text-sm text-sage hover:bg-sage/10 rounded-lg">
            Today
          </button>
          <button onClick={prevWeek} className="p-1.5 hover:bg-charcoal/5 rounded-lg">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={nextWeek} className="p-1.5 hover:bg-charcoal/5 rounded-lg">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-charcoal/10">
        {weekDays.map((date, i) => (
          <div key={i} className="p-2 text-center border-r border-charcoal/10 last:border-r-0">
            <p className="text-xs text-charcoal/60">{DAYS[date.getDay()].slice(0, 3)}</p>
            <p className="text-sm font-medium text-charcoal">{date.getDate()}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 min-h-[200px]">
        {weekDays.map((date, i) => {
          const dateStr = date.toISOString().split('T')[0];
          const dayAppointments = appointments?.filter(apt =>
            apt.startTime.startsWith(dateStr)
          ) || [];

          return (
            <div key={i} className="border-r border-charcoal/10 last:border-r-0 p-2 space-y-1">
              {dayAppointments.map(apt => (
                <div
                  key={apt.id}
                  className="p-2 rounded-lg text-xs"
                  style={{ backgroundColor: apt.service?.color + '20' }}
                >
                  <p className="font-medium truncate">{apt.client?.firstName}</p>
                  <p className="text-charcoal/60">
                    {new Date(apt.startTime).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="p-4 text-center text-charcoal/40">Loading appointments...</div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/app/staff/schedule/page.tsx
git commit -m "feat(web): rebuild staff schedule page with self-service features"
```

---

## Phase 4: Admin Review Endpoints (Optional)

### Task 4.1: Add Admin Endpoints for Approvals

**Files:**
- Modify: `apps/api/src/routes/users.ts` or create new file

**Step 1: Add time-off approval endpoints**

```typescript
// ============================================
// GET /api/v1/users/time-off-requests
// Get all pending time off requests (for managers)
// ============================================
router.get('/time-off-requests', authenticate, authorize('admin', 'owner', 'manager'), asyncHandler(async (req: Request, res: Response) => {
  const salonId = req.user!.salonId;
  const { status = 'pending' } = req.query;

  const requests = await prisma.timeOff.findMany({
    where: {
      staff: { salonId },
      status: status as string,
    },
    include: {
      staff: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: requests });
}));

// ============================================
// PATCH /api/v1/users/time-off-requests/:id
// Approve or reject time off request
// ============================================
router.patch('/time-off-requests/:id', authenticate, authorize('admin', 'owner', 'manager'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, reviewNotes } = req.body;
  const reviewerId = req.user!.userId;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_STATUS', message: 'Status must be approved or rejected' },
    });
  }

  const updated = await prisma.timeOff.update({
    where: { id },
    data: {
      status,
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
      reviewNotes,
    },
  });

  res.json({ success: true, data: updated });
}));
```

**Step 2: Commit**

```bash
git add apps/api/src/routes/users.ts
git commit -m "feat(api): add admin time-off approval endpoints"
```

---

## Implementation Checklist

- [ ] Phase 1: Database schema updates (TimeOff approval, ScheduleChangeRequest, Salon settings)
- [ ] Phase 2: Staff Portal API endpoints (my-schedule, my-assignments, updated time-off)
- [ ] Phase 3: Frontend schedule page rebuild
- [ ] Phase 4: Admin approval endpoints (optional)

---

## Test Scenarios

1. **Single Location Staff:**
   - View working hours (no location dropdown)
   - Edit hours → save → see changes immediately
   - Request time off → appears in list as "pending"

2. **Multi-Location Staff:**
   - See location dropdown
   - Switch locations → see different schedules
   - Edit hours for Location A → switch to Location B → hours preserved separately

3. **Approval Workflow (if enabled):**
   - Edit hours → save → shows "submitted for approval" message
   - Time off shows as "pending"
   - Manager approves → status changes to "approved"

4. **Permissions:**
   - If staffCanEditSchedule = false → Edit button hidden
   - If staffCanRequestTimeOff = false → Request Time Off button hidden
