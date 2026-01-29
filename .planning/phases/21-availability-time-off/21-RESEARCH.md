# Phase 21: Availability & Time Off - Research

**Researched:** 2026-01-29
**Domain:** Staff Availability Management, Time-Off Request Workflows, Weekly Schedule UI
**Confidence:** HIGH

## Summary

Phase 21 enables staff self-service for availability management and time-off requests. The codebase already has substantial infrastructure: StaffAvailability and TimeOff database models exist, time-off request UI is implemented (apps/web/src/app/staff/time-off/page.tsx), and API routes handle time-off CRUD operations. The existing schedule page (apps/web/src/app/staff/schedule/page.tsx) manages weekly availability with a simple 7-day grid using select dropdowns for time input - this pattern should be maintained.

The key technical implementation involves:
1. **Database models already exist**: StaffAvailability (recurring weekly schedule), TimeOff (date-range requests with approval status)
2. **Time-off UI complete**: Full request submission, list view, cancel flow already implemented
3. **Availability editor exists**: Weekly grid with checkbox toggles and time dropdowns in schedule page
4. **Approval workflow partial**: Default auto-approve behavior exists, but `requireTimeOffApproval` salon setting needs implementation
5. **Notification integration**: Existing NotificationLog system ready for status change notifications

Research focused on auditing existing patterns, identifying gaps (approval workflow, salon setting, owner review UI), and documenting established component patterns for consistency.

**Primary recommendation:** Audit existing time-off and availability implementations against Phase 21 requirements. The core functionality exists - focus on adding the approval workflow toggle (`requireTimeOffApproval` salon setting), owner approval UI in staff management area, and status change notifications. Maintain existing UI patterns (select dropdowns for time, STATUS_COLORS for badges, Modal component from @peacase/ui).

## Standard Stack

The established stack for availability and time-off features:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | 5.8 | Database ORM | StaffAvailability and TimeOff models already defined |
| Next.js | 14.1.0 | Frontend framework | Existing schedule and time-off pages use App Router |
| React | 18.2.0 | UI library | Client components with hooks pattern |
| date-fns | 3.2.0 | Date manipulation | Used in time-off page for date formatting |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Modal (@peacase/ui) | Current | Modal dialogs | Time-off request form, delete confirmations |
| STATUS_COLORS | Current | Status badges | pending (lavender), approved (sage), rejected (rose) |
| lucide-react | 0.309.0 | Icons | Calendar, Clock, X, CheckCircle2, XCircle icons |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native select for time | react-datepicker or custom time picker | Existing pattern uses select dropdowns - simpler, no new dependencies |
| Native date input | Third-party date picker | Native input works well for date ranges, browser support excellent in 2026 |
| Custom approval workflow | External workflow engine | Salon needs are simple (boolean toggle), over-engineering to add complexity |

**Installation:**
```bash
# No new packages needed - all functionality achievable with existing stack
```

## Architecture Patterns

### Recommended Project Structure
```
apps/web/src/app/staff/
├── schedule/page.tsx           # Availability editor (already exists)
├── time-off/page.tsx           # Time-off requests (already exists)

apps/api/src/routes/
├── staffPortal.ts              # Time-off CRUD routes (already exist)
├── salon.ts                    # Add requireTimeOffApproval setting endpoint

apps/web/src/app/staff-management/ # Owner's view
└── [staffId]/
    └── time-off-requests/      # NEW - Owner approval UI
```

### Pattern 1: Weekly Availability Grid with Select Dropdowns
**What:** 7-day grid, checkbox for "working" toggle, select dropdowns for start/end time
**When to use:** Staff editing their recurring weekly availability
**Example:**
```typescript
// Source: apps/web/src/app/staff/schedule/page.tsx (lines 246-306)
const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6; // 6am to 7pm
  const min = (i % 2) * 30;
  return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
});

{DAYS.map((day, index) => (
  <div key={day} className="flex items-center gap-4 py-2">
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
            <select value={startTime} onChange={(e) => updateDay(index, { startTime: e.target.value })}>
              {TIME_OPTIONS.map(t => <option key={t} value={t}>{formatTime(t)}</option>)}
            </select>
            <span className="text-charcoal/40">to</span>
            <select value={endTime} onChange={(e) => updateDay(index, { endTime: e.target.value })}>
              {TIME_OPTIONS.map(t => <option key={t} value={t}>{formatTime(t)}</option>)}
            </select>
          </>
        )}
      </>
    ) : (
      <span>{isWorking ? `${formatTime(startTime)} - ${formatTime(endTime)}` : 'OFF'}</span>
    )}
  </div>
))}
```

### Pattern 2: Time-Off Request with Native Date Inputs
**What:** Form with native date inputs, textarea for reason, type dropdown
**When to use:** Staff submitting time-off requests
**Example:**
```typescript
// Source: apps/web/src/app/staff/time-off/page.tsx (lines 337-378)
<form onSubmit={handleSubmit} className="space-y-5">
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium text-charcoal mb-2">Start Date</label>
      <input
        type="date"
        value={formData.startDate}
        onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
        min={getMinDate()}
        required
        className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-charcoal mb-2">End Date</label>
      <input
        type="date"
        value={formData.endDate}
        onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
        min={formData.startDate || getMinDate()}
        required
        className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20"
      />
    </div>
  </div>
  <div>
    <label className="block text-sm font-medium text-charcoal mb-2">Reason</label>
    <textarea
      value={formData.reason}
      onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
      placeholder="e.g., Family vacation, Medical appointment, Personal day..."
      required
      rows={3}
      className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20"
    />
  </div>
</form>
```

### Pattern 3: Status Badges with STATUS_COLORS
**What:** Consistent status badges using centralized color mapping
**When to use:** All status indicators (pending, approved, rejected)
**Example:**
```typescript
// Source: apps/web/src/app/staff/schedule/page.tsx (lines 28-40)
import { STATUS_COLORS } from '@/lib/statusColors';

function getTimeOffStatusClasses(status: 'pending' | 'approved' | 'rejected'): string {
  const statusMap: Record<string, keyof typeof STATUS_COLORS> = {
    pending: 'pending',      // lavender (neutral/waiting)
    approved: 'confirmed',   // sage (success)
    rejected: 'cancelled',   // rose (negative)
  };
  const colors = STATUS_COLORS[statusMap[status]];
  return `${colors.bg} ${colors.text}`;
}

// Usage:
<span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${getTimeOffStatusClasses(request.status)}`}>
  {status === 'approved' && <CheckCircle2 className="w-4 h-4" />}
  {status === 'rejected' && <XCircle className="w-4 h-4" />}
  {status === 'pending' && <Clock className="w-4 h-4" />}
  {status}
</span>
```

### Pattern 4: Salon Setting Boolean Toggle
**What:** Boolean setting in Salon model with default value, API endpoint to update
**When to use:** Configurable workflow behavior (approval required vs auto-approve)
**Example:**
```typescript
// Database schema pattern:
model Salon {
  requireTimeOffApproval Boolean @default(false) @map("require_time_off_approval")
  // ... other fields
}

// API endpoint pattern (similar to existing salon settings):
router.patch('/settings', authenticate, ownerPortalOnly, asyncHandler(async (req, res) => {
  const { requireTimeOffApproval } = req.body;
  const salon = await prisma.salon.update({
    where: { id: req.user.salonId },
    data: { requireTimeOffApproval }
  });
  res.json({ success: true, data: salon });
}));

// Frontend toggle pattern:
<label className="flex items-center gap-3">
  <input
    type="checkbox"
    checked={settings.requireTimeOffApproval}
    onChange={(e) => updateSetting('requireTimeOffApproval', e.target.checked)}
    className="rounded border-charcoal/20 text-sage focus:ring-sage"
  />
  <span className="text-sm text-charcoal">Require manager approval for time-off requests</span>
</label>
```

### Pattern 5: Notification Integration
**What:** Use existing NotificationJob queue for status change notifications
**When to use:** Owner approves/rejects time-off request
**Example:**
```typescript
// Similar to existing appointment notification pattern:
// Source: Existing notification patterns in codebase

async function notifyStaffTimeOffStatusChange(timeOffId: string, status: 'approved' | 'rejected') {
  const timeOff = await prisma.timeOff.findUnique({
    where: { id: timeOffId },
    include: { staff: true }
  });

  if (!timeOff) return;

  await prisma.notificationJob.create({
    data: {
      salonId: timeOff.staff.salonId,
      clientId: timeOff.staffId, // Using clientId field for staff notifications
      type: `time_off_${status}`,
      payload: JSON.stringify({
        staffName: `${timeOff.staff.firstName} ${timeOff.staff.lastName}`,
        startDate: timeOff.startDate,
        endDate: timeOff.endDate,
        status,
        reviewNotes: timeOff.reviewNotes
      }),
      status: 'pending'
    }
  });
}
```

### Anti-Patterns to Avoid
- **Complex calendar libraries:** Don't add react-big-calendar or fullcalendar - existing UI uses simple grids with native inputs
- **Custom time pickers:** Stick with select dropdowns (existing pattern) - accessible, keyboard-friendly, no dependencies
- **Separate availability tables per location:** StaffAvailability has optional locationId - global availability is the default (locationId: null)
- **Client-side approval logic:** Approval workflow must be server-side, checking salon.requireTimeOffApproval setting
- **Hardcoded status colors:** Always use STATUS_COLORS constant, never inline Tailwind classes for status badges

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Time-off request form | Custom form component | Existing time-off/page.tsx pattern | Already handles validation, date min/max, error states |
| Weekly availability grid | Custom calendar widget | Existing schedule/page.tsx pattern | Checkbox + select dropdowns work well, accessible |
| Status badges | Custom badge component | STATUS_COLORS utility | Centralized color mapping, type-safe |
| Approval workflow | Custom workflow engine | Simple boolean check + Prisma status field | Over-engineering for simple approve/reject flow |
| Date range validation | Custom validation | Native date input min/max attributes | Browser handles validation, better UX |
| Notification delivery | Direct email/SMS calls | NotificationJob queue | Existing async queue handles retries, tracking |

**Key insight:** The codebase already has 80% of Phase 21 functionality. Time-off requests are fully implemented. Availability editing exists. The missing pieces are: (1) salon setting for approval toggle, (2) owner approval UI, (3) notification integration. Don't rebuild what exists - extend it.

## Common Pitfalls

### Pitfall 1: Breaking Existing Time-Off UI
**What goes wrong:** Modifying time-off page breaks existing functionality (request submission, cancel flow)
**Why it happens:** Assumption that "Phase 21" means rebuild everything from scratch
**How to avoid:**
- Read apps/web/src/app/staff/time-off/page.tsx before making changes
- Existing UI handles submission, list view, cancel logic - only add approval workflow integration
- Don't change request form fields unless CONTEXT.md explicitly requires it
**Warning signs:** Tests for time-off submission start failing, staff can't cancel pending requests

### Pitfall 2: Not Respecting Default Auto-Approve
**What goes wrong:** All time-off requests go to pending status, blocking small salons that don't need approval
**Why it happens:** Forgetting that requireTimeOffApproval defaults to false
**How to avoid:**
- When creating TimeOff record, check salon.requireTimeOffApproval
- If false: set status to 'approved' immediately
- If true: set status to 'pending' and create owner notification
- Never hardcode status to 'pending'
**Warning signs:** Small salon owners complaining that time-off requests need manual approval when they didn't enable it

### Pitfall 3: Adding Time Picker Dependencies
**What goes wrong:** Installing react-datepicker or similar library for time selection
**Why it happens:** Research shows fancy time pickers in 2026 best practices
**How to avoid:**
- CONTEXT.md says "Claude's discretion on exact time picker component"
- Existing pattern uses select dropdowns (TIME_OPTIONS array)
- Select dropdowns are accessible, keyboard-friendly, work on all devices
- Don't add dependencies when existing pattern works
**Warning signs:** package.json has new date/time picker libraries

### Pitfall 4: Per-Location Availability Complexity
**What goes wrong:** Creating separate availability records for each location, complex UI for location-specific schedules
**Why it happens:** Misunderstanding CONTEXT.md "Global availability (not per-location)"
**How to avoid:**
- StaffAvailability.locationId should be null for global schedule
- Locations inherit staff's base schedule unless overridden
- UI should default to global (no location selector needed)
- Only show location-specific overrides if salon is multi-location AND staff explicitly sets them
**Warning signs:** Availability form has location dropdown when staff only works at one location

### Pitfall 5: Calendar Visualization Over-Engineering
**What goes wrong:** Building separate calendar view component with drag-drop, color-coding, timeline grid
**Why it happens:** CONTEXT.md mentions "calendar visualization" and research shows fancy scheduler libraries
**How to avoid:**
- CONTEXT.md says "No separate calendar page — integrated into existing schedule views"
- Availability = subtle background shading on schedule
- Time-off = blocked-out overlay with "Time Off" label
- Don't build new calendar page - enhance existing schedule view
**Warning signs:** New calendar route created, using react-big-calendar or similar

## Code Examples

Verified patterns from existing implementation:

### Existing Time-Off Request Hook
```typescript
// Source: apps/web/src/hooks/useStaffPortal.ts (lines 250-310)
export function useTimeOff() {
  const [timeOffs, setTimeOffs] = useState<TimeOffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<TimeOffRequest[]>('/staff-portal/time-off');
      if (response.success && response.data) {
        setTimeOffs(response.data);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load time-off requests');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTimeOff = useCallback(async (data: {
    startDate: string;
    endDate: string;
    type?: 'vacation' | 'sick' | 'personal' | 'other';
    reason?: string;
  }) => {
    const response = await api.post<TimeOffRequest>('/staff-portal/time-off', data);
    if (response.success && response.data) {
      setTimeOffs((prev) => [response.data!, ...prev]);
      return response.data;
    }
    throw new ApiError('CREATE_FAILED', 'Failed to create time-off request');
  }, []);

  const cancelTimeOff = useCallback(async (id: string) => {
    const response = await api.delete<void>(`/staff-portal/time-off/${id}`);
    if (response.success) {
      setTimeOffs((prev) => prev.filter((r) => r.id !== id));
    }
  }, []);

  return { timeOffs, loading, error, createTimeOff, cancelTimeOff, refetch: fetchRequests };
}
```

### Time-Off API Route (Existing)
```typescript
// Source: apps/api/src/routes/staffPortal.ts (lines 959-1014)
// POST /api/v1/staff-portal/time-off
router.post('/time-off', authenticate, staffOnly, asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate, reason, notes, type = 'vacation' } = req.body;
  const staffId = req.user!.id;
  const salonId = req.user!.salonId;

  // Validation
  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Start and end dates are required' }
    });
  }

  // Check if salon requires approval
  const salon = await prisma.salon.findUnique({
    where: { id: salonId },
    select: { staffCanRequestTimeOff: true }
  });

  if (!salon?.staffCanRequestTimeOff) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Time-off requests are not enabled' }
    });
  }

  // Create time-off request
  const timeOff = await prisma.timeOff.create({
    data: {
      staffId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      notes,
      type,
      status: 'pending', // Default to pending, will need approval logic
    },
  });

  res.json({ success: true, data: timeOff });
}));
```

### Availability Data Structure (Database)
```typescript
// Source: packages/database/prisma/schema.prisma (lines 275-290)
model StaffAvailability {
  id          String    @id @default(uuid())
  staffId     String    @map("staff_id")
  dayOfWeek   Int       @map("day_of_week")    // 0 = Sunday
  startTime   String    @map("start_time")      // "HH:mm" format
  endTime     String    @map("end_time")        // "HH:mm" format
  isAvailable Boolean   @default(true) @map("is_available")
  locationId  String?   @map("location_id")     // null = global availability
  location    Location? @relation(fields: [locationId], references: [id], onDelete: Cascade)
  staff       User      @relation(fields: [staffId], references: [id], onDelete: Cascade)

  @@unique([staffId, locationId, dayOfWeek])
  @@index([staffId])
  @@index([locationId])
  @@map("staff_availability")
}
```

### TimeOff Model with Approval Fields
```typescript
// Source: packages/database/prisma/schema.prisma (lines 292-312)
model TimeOff {
  id          String    @id @default(uuid())
  staffId     String    @map("staff_id")
  startDate   DateTime  @map("start_date")
  endDate     DateTime  @map("end_date")
  reason      String?
  notes       String?
  createdAt   DateTime  @default(now()) @map("created_at")
  reviewNotes String?   @map("review_notes")   // Owner's note when approving/rejecting
  reviewedAt  DateTime? @map("reviewed_at")    // Timestamp of review
  reviewedBy  String?   @map("reviewed_by")    // User ID of reviewer
  status      String    @default("pending")     // pending | approved | rejected
  type        String    @default("vacation")    // vacation | sick | personal | other
  reviewer    User?     @relation("TimeOffReviewer", fields: [reviewedBy], references: [id])
  staff       User      @relation(fields: [staffId], references: [id], onDelete: Cascade)

  @@index([staffId])
  @@index([startDate])
  @@index([status])
  @@map("time_off")
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Drag-drop calendar widgets | Simple grid with select inputs | 2024-2025 | Better accessibility, keyboard navigation, mobile support |
| Third-party date pickers | Native date input type | 2024+ | Browser support excellent, consistent UX, no dependencies |
| Separate approval system | Database status field + boolean toggle | Always standard | Simpler, no external services needed |
| Real-time approval notifications | Async notification queue | v1.1 (2026-01) | Better reliability, retry logic, delivery tracking |
| Multiple availability tables | Single table with optional locationId | Always standard | Simpler schema, supports global + location-specific |

**Deprecated/outdated:**
- react-big-calendar: Over-engineered for simple weekly schedule grid
- react-datepicker: Native inputs are sufficient for date ranges
- Custom approval workflow engines: Overkill for simple approve/reject binary

## Open Questions

Things that couldn't be fully resolved:

1. **Type Dropdown Values**
   - What we know: CONTEXT.md says "type dropdown (PTO, Sick, Personal)"
   - What's unclear: Database schema has type field with default "vacation", but doesn't constrain values
   - Recommendation: Add type dropdown with options: 'PTO', 'Sick', 'Personal', 'Other'. Map 'PTO' to database 'vacation' value for backward compatibility. Existing requests with type='vacation' display as 'PTO'.

2. **Approval Setting Location**
   - What we know: Need `requireTimeOffApproval` salon setting (boolean, defaults false)
   - What's unclear: Where in owner UI to place this toggle
   - Recommendation: Add to Settings > Staff Policies section alongside existing staffCanRequestTimeOff, staffCanEditSchedule, staffScheduleNeedsApproval settings. Groups all staff-related policies together.

3. **Owner Approval UI Integration**
   - What we know: CONTEXT.md says "owner sees pending requests in existing staff management area"
   - What's unclear: Exact placement - dedicated tab, inline in staff profile, or dashboard widget
   - Recommendation: Add "Time-Off Requests" tab to apps/web/src/app/staff-management page, showing pending requests across all staff. Click staff name to see request details and approve/reject. Badge count on tab shows pending count.

4. **Calendar Visualization Details**
   - What we know: "Availability shown as subtle background shading on schedule view"
   - What's unclear: Exact opacity, color choice, which schedule view (staff portal's schedule page vs owner calendar)
   - Recommendation: On staff portal schedule page, show availability as bg-sage/5 on working days, bg-charcoal/5 on off days. Time-off shown as bg-rose/10 overlay with "Time Off" text. Don't modify owner calendar - that's out of scope.

## Sources

### Primary (HIGH confidence)
- **Codebase inspection:**
  - apps/web/src/app/staff/time-off/page.tsx - Complete time-off request UI implementation
  - apps/web/src/app/staff/schedule/page.tsx - Weekly availability editor with select dropdowns
  - apps/web/src/hooks/useStaffPortal.ts - useTimeOff hook with CRUD operations
  - apps/api/src/routes/staffPortal.ts - Time-off API routes (POST, GET, DELETE)
  - packages/database/prisma/schema.prisma - StaffAvailability and TimeOff models
- **Existing patterns:**
  - apps/web/src/lib/statusColors.ts - STATUS_COLORS for status badges
  - packages/ui/src/components/Modal.tsx - Modal component for forms
  - Phase 20 research - Staff portal UI patterns and authentication

### Secondary (MEDIUM confidence)
- [React Calendar Date & Time picker Example | Mobiscroll](https://demo.mobiscroll.com/react/calendar/date-time-picker) - Time picker patterns (verified native inputs are sufficient)
- [GitHub - remotelock/react-week-scheduler](https://github.com/remotelock/react-week-scheduler) - Weekly schedule grid patterns (verified existing pattern is simpler)
- [7 Best shadcn/ui Date Picker Components (2026)](https://www.jqueryscript.net/blog/best-shadcn-ui-date-picker.html) - Date picker options (verified native inputs preferred)

### Tertiary (LOW confidence)
- [8 Tips for Managing Time-Off Requests | Paychex](https://www.paychex.com/articles/human-resources/managing-employee-pto) - General best practices
- [25 Best Leave Management Software of 2026](https://peoplemanagingpeople.com/tools/best-leave-management-software/) - Industry trends (AI-powered features not applicable to small salons)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified in package.json and actively used
- Architecture: HIGH - Patterns extracted from existing implementations (time-off page, schedule page)
- Pitfalls: HIGH - Based on CONTEXT.md constraints and existing codebase patterns

**Research date:** 2026-01-29
**Valid until:** 60 days (stable patterns, no framework changes expected)

## Key Findings for Planner

1. **Time-off functionality 90% complete** - Request form, list view, cancel flow all exist. Missing: approval workflow, salon setting, owner UI.

2. **Availability editor exists** - Weekly grid with checkbox + select dropdowns in schedule page. No rebuild needed - audit against requirements.

3. **Database models ready** - StaffAvailability and TimeOff models have all required fields. TimeOff has reviewedBy, reviewedAt, reviewNotes for approval workflow.

4. **Missing salon setting** - `requireTimeOffApproval` field needs to be added to Salon model (boolean, default false). Migration required.

5. **Approval workflow server-side** - When creating TimeOff: check salon.requireTimeOffApproval. If false, set status='approved'. If true, set status='pending' and notify owner.

6. **Owner approval UI needed** - New page/tab in staff management area showing pending time-off requests. Actions: approve (with note), reject (with note). Updates TimeOff.status, sets reviewedBy/reviewedAt.

7. **Notification integration straightforward** - Use existing NotificationJob queue. Create notification when status changes from pending to approved/rejected.

8. **No new dependencies** - All functionality achievable with existing tech stack (Prisma, Next.js, React, date-fns, Modal component, STATUS_COLORS).

9. **Calendar visualization simple** - Add background shading to existing schedule view. Don't create new calendar page.

10. **Type dropdown mismatch** - CONTEXT.md says "PTO, Sick, Personal" but database has "vacation" as default. Map PTO→vacation for compatibility.
