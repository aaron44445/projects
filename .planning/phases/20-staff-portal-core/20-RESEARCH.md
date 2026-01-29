# Phase 20: Staff Portal Core - Research

**Researched:** 2026-01-29
**Domain:** Staff Portal UI/UX, Next.js 14 App Router, React Custom Hooks
**Confidence:** HIGH

## Summary

Phase 20 builds on the authentication foundation from Phase 19 to create the core staff portal experience: dashboard with today's appointments, week view for upcoming schedule, appointment details, and profile management. The existing codebase already has substantial staff portal infrastructure in place - the dashboard, schedule, and profile pages are implemented with full functionality including availability management, time off requests, and appointment calendar views. Research reveals these pages use established patterns that should be maintained.

The key technical implementation involves:
1. **Dashboard API route** already exists (`GET /staff-portal/dashboard`) returning today's appointments, weekly stats, and monthly earnings
2. **Profile API route** exists (`GET /staff-portal/profile`, `PATCH /staff-portal/profile`) with avatar upload support
3. **Location-aware filtering** handled server-side via StaffLocation assignments and `staffCanViewClientContact` salon setting
4. **Custom React hooks** pattern established for data fetching (useStaffPortal.ts, useStaffAuth.ts)
5. **Next.js 14 App Router** with client components for interactivity

Research focused on validating existing patterns, identifying any missing functionality for Phase 20 requirements, and documenting best practices for maintaining consistency.

**Primary recommendation:** Audit existing implementation against Phase 20 requirements, enhance dashboard data structure to match CONTEXT.md decisions (chronological ordering with dimmed past appointments), verify location filtering works correctly, and ensure client visibility respects `staffCanViewClientContact` setting.

## Standard Stack

The established stack for staff portal features:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 14.1.0 | App Router framework | Official React framework, server components for data fetching |
| React | 18.2.0 | UI library | Industry standard, server/client component model |
| TypeScript | 5.x | Type safety | Strict typing enforced (noImplicitAny: true) |
| TailwindCSS | 3.x | Styling | Design system already implemented with custom tokens |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| focus-trap-react | 11.0.6 | Modal accessibility | All modal interactions (required pattern) |
| lucide-react | 0.309.0 | Icons | Consistent icon system across app |
| date-fns | 3.2.0 | Date formatting | Time/date display and manipulation |
| axios | 1.6.0 | API calls | Centralized via api.ts wrapper |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom hooks | @tanstack/react-query | TanStack Query adds caching/refetching but current pattern works well for staff portal needs |
| Client components | Server components | Already using client components with 'use client' for interactive UI - appropriate for staff portal |
| Inline styles | CSS-in-JS | TailwindCSS already standard, switching would break consistency |

**Installation:**
```bash
# All dependencies already installed
# No new packages needed for Phase 20
```

## Architecture Patterns

### Recommended Project Structure
```
apps/web/src/
├── app/
│   └── staff/
│       ├── dashboard/page.tsx      # Today's appointments dashboard
│       ├── schedule/page.tsx       # Week view + availability management
│       └── profile/page.tsx        # Profile editing
├── components/
│   ├── StaffAuthGuard.tsx         # Wraps all staff routes
│   ├── StaffPortalSidebar.tsx     # Navigation sidebar
│   └── staff/
│       └── StaffHeader.tsx        # Reusable header component
├── contexts/
│   └── StaffAuthContext.tsx       # Staff auth state management
└── hooks/
    ├── useStaffAuth.ts            # Authentication hooks
    └── useStaffPortal.ts          # Data fetching hooks
```

### Pattern 1: Client Component with Custom Hook
**What:** Page component marked with 'use client', wraps content in StaffAuthGuard, uses custom hook for data fetching
**When to use:** All staff portal pages requiring authentication and data
**Example:**
```typescript
// Source: apps/web/src/app/staff/dashboard/page.tsx
'use client';

function DashboardContent() {
  const { staff } = useStaffAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  const fetchDashboardData = useCallback(async () => {
    const response = await api.get<DashboardData>('/staff-portal/dashboard');
    if (response.success && response.data) {
      setDashboardData(response.data);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="min-h-screen bg-cream flex">
      <StaffPortalSidebar sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 flex flex-col min-w-0">
        {/* Content */}
      </main>
    </div>
  );
}

export default function StaffDashboardPage() {
  return (
    <StaffAuthGuard>
      <DashboardContent />
    </StaffAuthGuard>
  );
}
```

### Pattern 2: Location-Aware Data Filtering
**What:** Server-side filtering based on StaffLocation assignments, automatically applied to all appointment queries
**When to use:** Any appointment/schedule data that should be location-scoped
**Example:**
```typescript
// Source: apps/api/src/routes/staffPortal.ts (lines 700-713)
const todayAppointments = await prisma.appointment.findMany({
  where: {
    staffId,
    salonId,
    startTime: { gte: today, lt: tomorrow },
    status: { notIn: ['cancelled'] },
  },
  include: {
    client: { select: { id: true, firstName: true, lastName: true, phone: true } },
    service: { select: { id: true, name: true, durationMinutes: true, color: true } },
  },
  orderBy: { startTime: 'asc' },
});
```

### Pattern 3: Client Visibility Controls
**What:** Conditional display of client contact information based on `salon.staffCanViewClientContact` setting
**When to use:** When displaying client data (phone, email) to staff
**Example:**
```typescript
// Fetch salon settings and conditionally show client info
const salon = await prisma.salon.findUnique({
  where: { id: salonId },
  select: { staffCanViewClientContact: true }
});

// In component:
{salon.staffCanViewClientContact && (
  <p className="text-sm text-charcoal/60">{client.phone}</p>
)}
```

### Pattern 4: Status Colors with Design Tokens
**What:** Centralized status color mapping using STATUS_COLORS constant
**When to use:** All status badges, appointment cards, indicators
**Example:**
```typescript
// Source: apps/web/src/lib/statusColors.ts
import { STATUS_COLORS } from '@/lib/statusColors';

const getStatusColor = (status: string) => {
  const statusMap = {
    confirmed: 'confirmed',
    'in-progress': 'in-progress',
    completed: 'completed',
    cancelled: 'cancelled',
  };
  const colors = STATUS_COLORS[statusMap[status]];
  return `${colors.bg} ${colors.text}`;
};
```

### Pattern 5: EmptyState Component
**What:** Consistent empty state display from @peacase/ui package
**When to use:** Any empty list, no results, or zero-data scenarios
**Example:**
```typescript
// Source: packages/ui/src/components/EmptyState.tsx
import { EmptyState } from '@peacase/ui';
import { Calendar } from 'lucide-react';

<EmptyState
  icon={Calendar}
  title="No appointments scheduled for today"
  description="Enjoy your free time!"
/>
```

### Pattern 6: Modal with Focus Trap
**What:** Modal component using focus-trap-react for accessibility
**When to use:** All modal interactions (detail views, forms)
**Example:**
```typescript
// Source: packages/ui/src/components/Modal.tsx
import { Modal } from '@peacase/ui';

<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Appointment Details"
  size="md"
>
  {/* Content */}
</Modal>
```

### Anti-Patterns to Avoid
- **Direct database queries in components:** Always use API routes, never expose Prisma client to frontend
- **Mixing portal tokens:** Staff and owner tokens are separate - never accept owner token in staff routes (ownerPortalOnly middleware on owner routes)
- **Client-side location filtering:** Location filtering must happen server-side for security
- **Inconsistent empty states:** Always use EmptyState component from @peacase/ui
- **Status color inline definitions:** Always use STATUS_COLORS constant, never hardcode colors

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Authentication guard | Custom auth wrapper | StaffAuthGuard component | Already handles loading states, redirects, and token validation |
| API calls | fetch() directly | api.ts wrapper | Handles token injection, error parsing, response typing |
| Modal accessibility | Custom modal | Modal from @peacase/ui | Includes focus trap, escape handling, ARIA attributes |
| Date formatting | Manual date parsing | date-fns | Handles timezones, locales, edge cases |
| Loading states | Custom spinners | LoadingSkeleton patterns | Consistent with design system |
| Empty views | Custom empty messages | EmptyState component | Consistent styling, icon patterns |
| Status badges | Inline className strings | STATUS_COLORS utility | Single source of truth, type-safe |

**Key insight:** The codebase has well-established patterns for common UI/UX needs. Phase 20 should maintain these patterns rather than introduce new approaches. The staff portal pages already exist with sophisticated functionality - audit them against requirements rather than rebuild.

## Common Pitfalls

### Pitfall 1: Ignoring Client Visibility Settings
**What goes wrong:** Displaying client phone/email to all staff regardless of salon.staffCanViewClientContact setting
**Why it happens:** Easy to forget conditional rendering when client data is already in the response
**How to avoid:**
- Check salon.staffCanViewClientContact in API response
- Conditionally render contact fields in UI
- Server should still return data (needed for owner role checking)
**Warning signs:** Staff seeing full client contact info when salon policy restricts it

### Pitfall 2: Not Filtering by Staff Locations
**What goes wrong:** Staff sees appointments from all salon locations, not just their assigned ones
**Why it happens:** Query filters by staffId and salonId but forgets location assignments
**How to avoid:**
- Server-side: JOIN with StaffLocation table or filter by locationId IN (staff's assigned locations)
- Client-side: Location badges on multi-location appointments
- Verify staff.assignedLocations populated in StaffAuthContext
**Warning signs:** Staff with multiple locations seeing appointments from unassigned locations

### Pitfall 3: Breaking Established Patterns
**What goes wrong:** New code uses different patterns than existing codebase (e.g., TanStack Query instead of custom hooks)
**Why it happens:** Researcher familiar with newer patterns tries to "improve" the codebase
**How to avoid:**
- Read existing staff pages (dashboard, schedule, profile) before implementing
- Match naming conventions (DashboardContent, fetchDashboardData)
- Use same loading/error patterns
**Warning signs:** Mix of useState + useCallback with useQuery, different error handling styles

### Pitfall 4: Card Styling Inconsistency
**What goes wrong:** Appointment cards have different spacing, rounded corners, shadows than established design
**Why it happens:** Claude's discretion on "exact card styling" interpreted too freely
**How to avoid:**
- Follow established card patterns: `bg-white rounded-2xl shadow-soft border border-charcoal/5`
- Use design tokens: cream (background), sage (primary), lavender (secondary), charcoal (text)
- Match existing dashboard appointment list styling
**Warning signs:** Cards look different from rest of staff portal

### Pitfall 5: Past Appointments Not Dimmed
**What goes wrong:** Today's past appointments displayed at same prominence as upcoming ones
**Why it happens:** Chronological order implemented but visual dimming forgotten
**How to avoid:**
- Compare appointment.startTime to current time
- Apply opacity classes: `opacity-50` or `text-charcoal/40` to past items
- Keep chronological order but add visual hierarchy
**Warning signs:** 8am appointment (now 3pm) looks as important as 4pm upcoming appointment

## Code Examples

Verified patterns from existing implementation:

### Appointment Card Structure
```typescript
// Source: apps/web/src/app/staff/dashboard/page.tsx (lines 268-298)
<div
  key={appointment.id}
  className="p-4 hover:bg-charcoal/5 transition-colors"
>
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-sage/10 flex items-center justify-center">
        <Clock className="w-5 h-5 text-sage" />
      </div>
      <div>
        <p className="font-medium text-charcoal">
          {appointment.clientName}
        </p>
        <p className="text-sm text-charcoal/60">
          {appointment.serviceName}
        </p>
      </div>
    </div>
    <div className="text-right">
      <p className="font-medium text-charcoal">
        {formatTime(appointment.startTime)}
      </p>
      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(appointment.status)}`}>
        {appointment.status}
      </span>
    </div>
  </div>
</div>
```

### Week View Day Tabs
```typescript
// Source: Phase context - horizontal day tabs pattern
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

<div className="flex border-b border-charcoal/10 overflow-x-auto">
  {DAYS.map((day, index) => {
    const isToday = index === new Date().getDay();
    return (
      <button
        key={day}
        onClick={() => setSelectedDay(index)}
        className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
          isToday
            ? 'text-sage border-b-2 border-sage'
            : 'text-charcoal/60 hover:text-charcoal'
        }`}
      >
        {day}
      </button>
    );
  })}
</div>
```

### Profile Avatar Upload
```typescript
// Source: apps/web/src/app/staff/profile/page.tsx (lines 125-176)
const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validate file type and size
  if (!file.type.startsWith('image/')) {
    setError('Please select an image file');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    setError('Image must be less than 5MB');
    return;
  }

  setIsUploading(true);

  const uploadFormData = new FormData();
  uploadFormData.append('avatar', file);

  const response = await fetch(
    `${API_CONFIG.apiUrl}/staff-portal/profile/avatar`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem(TOKEN_KEYS.staff.access)}`,
      },
      body: uploadFormData,
    }
  );

  const data = await response.json();
  if (data.success && data.data?.avatarUrl) {
    setProfile((prev) => (prev ? { ...prev, avatarUrl: data.data.avatarUrl } : null));
    setSuccessMessage('Avatar updated successfully');
  }
};
```

### Location-Filtered Appointments Query
```typescript
// Server-side pattern from staffPortal.ts
// Get staff's assigned locations
const staffLocations = await prisma.staffLocation.findMany({
  where: { staffId },
  select: { locationId: true }
});

const locationIds = staffLocations.map(sl => sl.locationId);

// Filter appointments by staff's locations
const appointments = await prisma.appointment.findMany({
  where: {
    staffId,
    salonId,
    locationId: { in: locationIds }, // Location filtering
    startTime: { gte: today, lt: tomorrow },
  }
});
```

### Client Visibility Control
```typescript
// Fetch salon setting
const salon = await prisma.salon.findUnique({
  where: { id: salonId },
  select: { staffCanViewClientContact: true }
});

// In API response, include setting
res.json({
  success: true,
  data: {
    appointments: todayAppointments,
    canViewClientContact: salon.staffCanViewClientContact
  }
});

// In component, conditionally render
{canViewClientContact && client.phone && (
  <p className="text-sm text-charcoal/60">{client.phone}</p>
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pages Router | App Router | Next.js 13+ | Server components by default, parallel data fetching |
| getServerSideProps | Direct fetch in Server Components | Next.js 13+ | Simpler code, better performance |
| Class components | Function components + Hooks | React 16.8+ | All staff portal uses hooks pattern |
| Prop drilling | Context API | React 16.3+ | StaffAuthContext for global auth state |
| Manual focus management | focus-trap-react | Established pattern | Accessibility requirement, enforced in Modal |

**Deprecated/outdated:**
- Pages Router: App Router is standard for new Next.js apps
- withAuth HOC: Replaced by StaffAuthGuard component pattern
- Direct Prisma in API routes: Use withSalonId utility for tenant filtering

## Open Questions

Things that couldn't be fully resolved:

1. **Appointment Detail View Pattern**
   - What we know: CONTEXT.md says "Claude's discretion on pattern" for inline expand vs modal
   - What's unclear: Which pattern fits better with existing codebase style
   - Recommendation: Review existing appointment interactions in owner portal for consistency. Modal seems to match existing patterns better (time-off requests, booking modals all use Modal component).

2. **Dashboard API Data Structure Mismatch**
   - What we know: Current /staff-portal/dashboard returns `todayAppointments` array, but doesn't include chronological ordering requirement or past/future distinction
   - What's unclear: Whether to modify API response structure or handle sorting client-side
   - Recommendation: Client-side sorting is sufficient - API already returns chronological order, just add isPast boolean check in component. Server change would break any existing consumers.

3. **Week View Date Picker Implementation**
   - What we know: CONTEXT.md requires "Date picker for jumping to specific weeks"
   - What's unclear: Whether to use native date input, third-party library, or custom component
   - Recommendation: Check if date-fns is sufficient for a simple week picker, or use native HTML date input with week type if browser support is adequate. Avoid adding new dependencies.

4. **Multi-Location Badge Placement**
   - What we know: "Location badge if staff works multiple locations" on appointment cards
   - What's unclear: Exact placement - near client name, near service, or in card header
   - Recommendation: Place near service name in secondary info line, consistent with existing service display patterns. Only show if staff has assignedLocations.length > 1.

## Sources

### Primary (HIGH confidence)
- **Codebase inspection:** apps/web/src/app/staff/dashboard/page.tsx, schedule/page.tsx, profile/page.tsx - Complete implementation review
- **API routes:** apps/api/src/routes/staffPortal.ts - Lines 680-780 (dashboard), 1078-1111 (profile), 1214-1298 (schedule)
- **Database schema:** packages/database/prisma/schema.prisma - Appointment, StaffLocation, Salon models
- **UI components:** packages/ui/src/components/EmptyState.tsx, Modal.tsx - Established component API
- **Auth context:** apps/web/src/contexts/StaffAuthContext.tsx - Location access helpers, staff user type
- **Custom hooks:** apps/web/src/hooks/useStaffPortal.ts - Data fetching patterns

### Secondary (MEDIUM confidence)
- [Next.js Official Docs: Data Fetching Patterns](https://nextjs.org/docs/14/app/building-your-application/data-fetching/patterns) - App Router best practices for server/client components
- [Next.js Architecture in 2026](https://www.yogijs.tech/blog/nextjs-project-architecture-app-router) - Server-first patterns, client-islands approach
- [React Dashboard Best Practices 2026](https://xpertlab.com/react-js-latest-features-and-best-practices-in-2026/) - Modern React patterns for dashboard UIs

### Tertiary (LOW confidence)
- [React Appointment Scheduling](https://www.nylas.com/blog/appointment-scheduler-in-your-react-app/) - General patterns, not specific to this codebase
- [React Admin Dashboards 2026](https://colorlib.com/wp/react-dashboard-templates/) - Template review, design inspiration only

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified in package.json and actively used
- Architecture: HIGH - Patterns extracted from existing implementations in codebase
- Pitfalls: HIGH - Based on common mistakes in similar patterns and CONTEXT.md constraints

**Research date:** 2026-01-29
**Valid until:** 60 days (stable patterns, minimal framework churn expected for Next.js 14)

## Key Findings for Planner

1. **Existing implementation is substantial** - Dashboard, schedule, and profile pages already exist with full functionality. Phase 20 planning should audit these against requirements rather than build from scratch.

2. **Dashboard needs enhancement** - Current implementation shows appointments but doesn't explicitly handle:
   - Chronological ordering with past appointments dimmed
   - Empty state when no appointments (has empty message but not using EmptyState component)
   - Location filtering verification for multi-location staff

3. **Missing appointment detail view** - Current dashboard shows appointment cards but no detail view. CONTEXT.md requires clicking to see full details including all services with prices, appointment notes, total duration.

4. **Profile page mostly complete** - Profile editing exists with avatar upload, phone/name editing, assigned services display. Meets PROF-01 and PROF-02 requirements.

5. **Location filtering uncertain** - API query filters by staffId but unclear if location filtering is implemented. StaffLocation join needed or verify existing implementation.

6. **Week view exists but complex** - Schedule page has week view + availability management + time off requests. May need simplification or separate component for appointment viewing vs availability editing.

7. **Client visibility setting not used** - staffCanViewClientContact from Salon model exists but not being checked in dashboard responses. Need to implement conditional display.

8. **No new dependencies needed** - All required functionality achievable with existing tech stack. Don't add new libraries.
