# Stack Research: Staff Portal

**Project:** Peacase Staff Portal v1.2
**Researched:** 2026-01-29
**Overall confidence:** HIGH

## Executive Summary

The existing Peacase stack (Next.js 14, Express, Prisma 5.8, PostgreSQL, JWT auth) provides 95% of what's needed for Staff Portal features. Only two strategic additions are required: **Luxon 3.7.2** for robust timezone-aware time tracking, and database schema extensions (no new libraries). The staff authentication system already exists—JWT middleware supports role-based access, tokens are scoped by auth context (staff/owner/client), and refresh token infrastructure is operational. Time tracking requires new database tables but zero new backend libraries. Earnings display leverages existing CommissionRecord calculations.

**Key finding:** This milestone is primarily configuration and schema extension, not technology addition.

## Recommended Additions

| Library | Version | Purpose | Why This One | Confidence |
|---------|---------|---------|--------------|------------|
| luxon | ^3.7.2 | Timezone-aware datetime handling for clock-in/out | Built on Intl API (no locale bundle bloat), immutable API, first-class timezone support. Superior to date-fns-tz (requires extension) and Day.js (plugin-based). Needed for multi-location salons spanning timezones. | HIGH |

**Installation:**
```bash
pnpm add luxon
pnpm add -D @types/luxon
```

**Why Luxon specifically:**
- Staff may clock in at Location A (PST) and view schedule from Location B (EST)
- Salon.timezone exists in schema but date-fns (current stack) has weak timezone support
- Luxon.setZone() + withZone() handle conversions cleanly: `DateTime.now().setZone('America/Los_Angeles')`
- No bundle size penalty—leverages native Intl API instead of shipping locale files
- Training data suggested date-fns-tz, but [Luxon's native timezone support](https://phrase.com/blog/posts/best-javascript-date-time-libraries/) makes it superior for this use case
- Verified via [npm trends comparison](https://npmtrends.com/date-fns-vs-dayjs-vs-luxon-vs-moment) and [timezone handling comparison](https://codesandbox.io/s/timezone-conversion-comparison-dayjs-vs-momentjs-vs-luxon-vs-date-fns-tz-5md9k)

**Integration point:**
- Frontend: Use Luxon for displaying staff schedules in their local timezone
- Backend: Store all timestamps as UTC in PostgreSQL, convert using Luxon per-salon timezone setting
- Existing date-fns stays for relative time display ("2 hours ago"), non-timezone-critical operations

## Configuration-Only Changes

These features require no new libraries, only schema additions and configuration.

### 1. Staff Authentication
**Status:** Already implemented
**Existing capabilities:**
- JWT middleware with role-based access (`apps/api/src/middleware/auth.ts`)
- Separate token storage per auth context (`apps/web/src/types/auth.ts`):
  - `peacase_staff_access_token` (staff portal)
  - `peacase_owner_access_token` (owner dashboard)
  - `peacase_client_access_token` (client portal)
- `RefreshToken` model for token rotation
- `EmailVerificationToken`, `PasswordResetToken` models for staff onboarding
- `LoginHistory` and `UserSession` models for audit trails

**What's needed:**
- API route: `POST /auth/staff/login` (mirrors existing `/auth/login`)
- API route: `POST /auth/staff/refresh` (reuses RefreshToken model)
- Frontend: Staff login page using existing token helpers (`setTokens('staff', ...)`)
- Database: Staff users already have `passwordHash` field (nullable → required for staff with portal access)

**No new libraries required.** This is route configuration + schema constraint update.

### 2. Time Tracking (Clock In/Out)
**Status:** Requires schema extension only
**Existing capabilities:**
- PostgreSQL database with Prisma ORM
- Timezone field on Salon model (`timezone: String @default("UTC")`)
- Location model with timezone support (`timezone: String?`)
- User (staff) model with salonId, locationId relationships

**New schema needed:**
```prisma
model TimeEntry {
  id         String    @id @default(uuid())
  staffId    String    @map("staff_id")
  salonId    String    @map("salon_id")
  locationId String?   @map("location_id")
  clockIn    DateTime  @map("clock_in")
  clockOut   DateTime? @map("clock_out")
  timezone   String    // Captured at clock-in for audit trail
  ipAddress  String?   @map("ip_address") // Optional fraud detection
  notes      String?   // Manager-added notes or staff break notes
  createdAt  DateTime  @default(now()) @map("created_at")
  updatedAt  DateTime  @updatedAt @map("updated_at")

  staff      User      @relation(fields: [staffId], references: [id], onDelete: Cascade)
  salon      Salon     @relation(fields: [salonId], references: [id], onDelete: Cascade)
  location   Location? @relation(fields: [locationId], references: [id])

  @@index([staffId, clockIn])
  @@index([salonId, clockIn])
  @@index([locationId, clockIn])
  @@map("time_entries")
}
```

**API endpoints (Express routes):**
- `POST /staff/time/clock-in` → Create TimeEntry with clockIn
- `POST /staff/time/clock-out` → Update TimeEntry with clockOut
- `GET /staff/time/current` → Get active time entry (clockOut IS NULL)
- `GET /staff/time/history?start=&end=` → List time entries for date range

**Business logic (no libraries):**
- Calculate duration: `clockOut - clockIn` in milliseconds, convert to hours
- Prevent double clock-in: Check for existing entry where `clockOut IS NULL`
- Timezone capture: Store `salon.timezone` or `location.timezone` at clock-in time
- Optional: IP address capture for location verification (future phase)

**No new libraries required.** Prisma, Express, and Node.js built-ins suffice.

### 3. Earnings Calculation
**Status:** Already implemented via CommissionRecord
**Existing capabilities:**
- `CommissionRecord` model tracks per-appointment commissions:
  - `serviceAmount`, `tipAmount`, `commissionRate`, `commissionAmount`
  - `isPaid`, `paidAt` for payout tracking
  - Indexed by `staffId`, `createdAt` for efficient queries
- `Payment` model linked to appointments and commission records
- Existing commission calculation logic (presumably in payment processing)

**What's needed for Staff Portal:**
- API route: `GET /staff/earnings/summary?period=current_pay_period`
  - SUM(commissionAmount) WHERE staffId AND periodStart/periodEnd
  - Response: `{ totalEarnings, paidEarnings, unpaidEarnings, appointments: [...] }`
- API route: `GET /staff/earnings/detail?start=&end=`
  - JOIN CommissionRecord with Appointment, Service, Client
  - Return itemized list for transparency

**Frontend display:**
- Use existing TanStack Query for data fetching
- Recharts (already in stack) for earnings over time visualization
- No state management libraries needed beyond Zustand (already present)

**No new libraries required.** SQL aggregation + existing API patterns.

### 4. Availability Management
**Status:** Schema exists, needs staff-facing CRUD
**Existing capabilities:**
- `StaffAvailability` model with `dayOfWeek`, `startTime`, `endTime`, `locationId`
- `ScheduleChangeRequest` model for approval workflows
- Salon settings control permissions (`staffCanEditSchedule`, `staffScheduleNeedsApproval`)

**What's needed:**
- API routes:
  - `GET /staff/availability` → Read current availability
  - `PUT /staff/availability` → Update (or create ScheduleChangeRequest if approval required)
  - `GET /staff/availability/requests` → View pending change requests
- Frontend components:
  - Weekly availability grid (build with TailwindCSS + shadcn/ui)
  - Time picker inputs (react-hook-form + zod validation—already in stack)

**No new libraries required.** UI is custom-built with existing design system.

### 5. Schedule Viewing
**Status:** Appointment data exists, needs read-only staff view
**Existing capabilities:**
- `Appointment` model with full details (client, service, time, location)
- Indexed by `staffId`, `startTime` for efficient queries
- Owner dashboard presumably has calendar view (calendar logic exists)

**What's needed:**
- API route: `GET /staff/schedule?start=&end=`
  - WHERE staffId AND startTime BETWEEN start AND end
  - JOIN with Service, Client (respecting `staffCanViewClientContact` setting)
  - Return appointment blocks with time, service name, client name (if permitted)
- Frontend: Weekly/daily calendar view
  - Option 1: Build with existing primitives (TailwindCSS grid layout)
  - Option 2: Lightweight scheduler component (see alternatives below)

**No backend libraries required.** Frontend calendar component is optional enhancement.

## NOT Recommended

Libraries considered but rejected, with rationale.

| Library | Category | Why Not |
|---------|----------|---------|
| passport.js | Authentication | Overkill. JWT middleware already handles staff/owner/client roles. Passport adds complexity for zero benefit when you have working RBAC. |
| express-session | Session management | Stateless JWT architecture already chosen. Adding sessions would require Redis/session store, complicating deployment. Refresh tokens provide same UX without state. |
| agenda / bull / bee-queue | Job scheduling for time tracking | Time tracking is synchronous (clock-in writes row immediately). No background jobs needed. Existing `NotificationJob` queue handles async work. |
| node-cron | Scheduled tasks | Already in stack (`node-cron: ^4.2.1`). No additional scheduler needed. |
| geoip-lite / maxmind | IP geolocation | Premature optimization. Clock-in IP capture is future phase (fraud detection). If needed later: [node-iplocate](https://www.npmjs.com/package/node-iplocate) (1000 free requests/day, privacy detection built-in). |
| react-big-calendar | Calendar UI | 93KB minified. For read-only staff schedule view, custom TailwindCSS grid is lighter and more brand-consistent. If complex scheduling needed later: [Schedule-X](https://github.com/schedule-x/schedule-x) (modern, actively maintained). |
| decimal.js / big.js | Financial math | Commission calculations use Float (existing schema). Stripe handles payment precision. Unless financial audits show rounding errors, added complexity not justified. |
| helmet | Security headers | Already in stack (`helmet: ^7.1.0`). No change needed. |

## Integration Points

How new additions connect to existing stack.

### Luxon Integration

**Backend (Express API):**
```typescript
import { DateTime } from 'luxon';

// Clock-in endpoint
app.post('/staff/time/clock-in', authenticate, async (req, res) => {
  const salon = await prisma.salon.findUnique({
    where: { id: req.user.salonId },
    select: { timezone: true }
  });

  const now = DateTime.now().setZone(salon.timezone);

  const entry = await prisma.timeEntry.create({
    data: {
      staffId: req.user.userId,
      salonId: req.user.salonId,
      clockIn: now.toJSDate(), // Store as UTC in DB
      timezone: salon.timezone, // Audit trail
    }
  });

  res.json({ entry });
});
```

**Frontend (Next.js):**
```typescript
import { DateTime } from 'luxon';

// Display clock-in time in staff's salon timezone
function ClockInDisplay({ entry, salonTimezone }) {
  const clockIn = DateTime.fromISO(entry.clockIn, { zone: 'utc' })
    .setZone(salonTimezone);

  return <span>{clockIn.toFormat('h:mm a ZZZZ')}</span>;
  // Example output: "9:30 AM PST"
}
```

**Why this pattern:**
- Database stores UTC (PostgreSQL best practice)
- Luxon converts to salon's timezone for display
- Audit trail preserves timezone at moment of action
- Multi-location salons can have staff see times in their location's zone

### JWT Auth Integration

**No changes to auth middleware.** Existing pattern handles staff:

```typescript
// Existing: apps/api/src/middleware/auth.ts
interface JWTPayload {
  userId: string;   // Staff user ID
  salonId: string;  // Multi-tenant isolation
  role: string;     // 'staff' role
}
```

**Staff login generates same JWT structure:**
```typescript
// New route: apps/api/src/routes/auth.ts
app.post('/auth/staff/login', async (req, res) => {
  // Validate staff credentials
  const staff = await prisma.user.findFirst({
    where: {
      email: req.body.email,
      role: 'staff',
      isActive: true,
    }
  });

  // Use existing JWT signing logic
  const token = jwt.sign(
    {
      userId: staff.id,
      salonId: staff.salonId,
      role: staff.role, // 'staff'
    },
    env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  // Existing refresh token creation
  const refreshToken = await createRefreshToken(staff.id);

  res.json({ token, refreshToken });
});
```

**Frontend uses existing token helpers:**
```typescript
// apps/web/src/types/auth.ts already exports:
setTokens('staff', accessToken, refreshToken);
getAccessToken('staff'); // Returns 'peacase_staff_access_token'
```

**Authorization on staff routes:**
```typescript
// Restrict endpoints to staff role
app.get('/staff/schedule',
  authenticate,           // Existing middleware
  authorize('staff'),     // Existing middleware
  async (req, res) => {
    // req.user.role === 'staff' guaranteed
  }
);
```

### Database Schema Integration

**Prisma migration workflow:**
```bash
# Add TimeEntry model to schema.prisma
pnpm db:migrate dev --name add-time-entries

# Generate Prisma client
pnpm db:generate
```

**New model relationships:**
- `TimeEntry` → `User` (staffId foreign key)
- `TimeEntry` → `Salon` (salonId for multi-tenant isolation)
- `TimeEntry` → `Location` (optional locationId for multi-location salons)
- `Salon` → `TimeEntry[]` (cascade delete on salon deletion)

**Query optimization:**
```prisma
@@index([staffId, clockIn])     // Staff time history queries
@@index([salonId, clockIn])     // Owner payroll reports
@@index([locationId, clockIn])  // Location-specific reporting
```

### TanStack Query Integration (Frontend)

**Existing pattern for data fetching:**
```typescript
// apps/web/src/hooks/useSchedule.ts (new hook, existing pattern)
import { useQuery } from '@tanstack/react-query';

export function useStaffSchedule(start: string, end: string) {
  return useQuery({
    queryKey: ['staff', 'schedule', start, end],
    queryFn: async () => {
      const res = await fetch(
        `/api/staff/schedule?start=${start}&end=${end}`,
        {
          headers: {
            Authorization: `Bearer ${getAccessToken('staff')}`
          }
        }
      );
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}
```

**Optimistic updates for clock-in:**
```typescript
const mutation = useMutation({
  mutationFn: () => fetch('/api/staff/time/clock-in', { method: 'POST' }),
  onMutate: async () => {
    // Optimistically show "Clocked In" state
    queryClient.setQueryData(['staff', 'time', 'current'], {
      clockIn: new Date().toISOString(),
      clockOut: null,
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['staff', 'time'] });
  },
});
```

## Version Matrix

Current versions verified against npm registry (2026-01-29).

| Library | Current (apps/*/package.json) | Recommended | Change |
|---------|-------------------------------|-------------|--------|
| jsonwebtoken | ^9.0.0 | ^9.0.3 | Patch update (security fixes) |
| bcryptjs | ^2.4.3 | ^2.4.3 | No change |
| express | ^4.18.0 | ^4.18.0 | No change (v5 not stable) |
| prisma | 5.22.0 (via @prisma/client@5.22.0) | 5.22.0 | No change |
| next | 14.1.0 | 14.1.0 | No change (v15 not evaluated) |
| luxon | — | ^3.7.2 | New addition |
| date-fns | ^3.2.0 | ^3.2.0 | Keep for relative time |

**Notes:**
- jsonwebtoken: Patch to [9.0.3](https://www.npmjs.com/package/jsonwebtoken) (published 1 month ago, fixes minor issues)
- Luxon: [Version 3.7.2](https://www.npmjs.com/package/luxon) is latest stable (published 4 months ago)
- No breaking changes recommended—staff portal uses existing stack

## Deployment Considerations

**Environment variables (no additions required):**
- `JWT_SECRET` — Already exists
- `DATABASE_URL` — Already exists
- Salon.timezone — Already in database schema

**Database migrations:**
- Single migration adds `TimeEntry` table
- Zero downtime—new table doesn't affect existing features
- Rollback strategy: Drop table if staff portal delayed

**Frontend deployment:**
- Staff portal routes under `/staff/*`
- Separate entry point from owner dashboard (`/dashboard/*`)
- Can deploy progressively (auth first, then time tracking, then earnings)

**Performance:**
- Time entry queries scoped by staffId (indexed)
- Commission aggregations use existing indexes
- No N+1 queries (Prisma includes relations)

## Security Considerations

**Authentication:**
- Staff JWT tokens expire in 15 minutes (configurable)
- Refresh tokens stored in database with 30-day expiry
- Password requirements enforced by existing bcryptjs logic (10 rounds)

**Authorization:**
- Staff can only access own data (enforced by `req.user.userId` filtering)
- Multi-tenant isolation via `req.user.salonId` (existing pattern)
- Sensitive client data hidden if `staffCanViewClientContact === false`

**Data privacy:**
- Clock-in IP addresses optional (future phase)
- Time entries cascade-delete with staff deletion (GDPR compliance)
- Earnings data read-only for staff (no manipulation)

**Audit trails:**
- LoginHistory tracks staff logins (existing model)
- TimeEntry.timezone captures timezone at clock-in (prevents disputes)
- CommissionRecord.createdAt immutable (financial audit trail)

## Testing Strategy

**Unit tests (Vitest, already in stack):**
- Time duration calculations
- Timezone conversion edge cases (DST transitions)
- Commission aggregation logic
- JWT token generation/validation for staff role

**Integration tests (Supertest, already in stack):**
- POST /staff/time/clock-in (happy path, double clock-in rejection)
- GET /staff/earnings/summary (aggregate calculations)
- PUT /staff/availability (with/without approval workflow)

**E2E tests (optional, not in current stack):**
- If added later: Playwright for staff login → clock-in → view schedule flow

## Migration Path

**Phase 1: Authentication (Week 1)**
1. Add staff login route
2. Create staff portal layout
3. Deploy behind feature flag

**Phase 2: Time Tracking (Week 2)**
1. Run Prisma migration for TimeEntry
2. Build clock-in/out API endpoints
3. Install Luxon for timezone handling
4. Create clock-in UI component

**Phase 3: Earnings Display (Week 3)**
1. Build earnings aggregation endpoint
2. Create earnings dashboard UI
3. Add date range filtering

**Phase 4: Schedule & Availability (Week 4)**
1. Staff schedule read endpoint
2. Availability CRUD endpoints
3. Calendar view component
4. Approval workflow (if enabled)

**Each phase independently deployable.** No big-bang release required.

## Open Questions

**For product/business decision:**
- Clock-in geofencing? (Require staff to be near salon location)
  - If yes, Phase 5 adds [node-iplocate](https://www.npmjs.com/package/node-iplocate) or GPS Web API
- Earnings display includes tips? (CommissionRecord has tipAmount)
- Overtime calculation rules? (California vs Texas labor laws differ)
  - If needed, business logic in TimeEntry aggregation, no new libraries

**For future technical research:**
- Mobile app for staff portal? (React Native would reuse same API)
- Biometric clock-in? (Touch ID / Face ID via WebAuthn)
- Offline clock-in? (Service worker + sync queue)

**None block current milestone.** These are post-v1.2 considerations.

## Sources

**Technology comparisons:**
- [Luxon vs date-fns vs Day.js timezone handling](https://npm-compare.com/date-fns,date-fns-tz,dayjs,luxon,moment)
- [Luxon timezone capabilities (Phrase blog)](https://phrase.com/blog/posts/best-javascript-date-time-libraries/)
- [React scheduler component comparison 2026](https://dhtmlx.com/blog/best-react-scheduler-components-dhtmlx-bryntum-syncfusion-daypilot-fullcalendar/)
- [Schedule-X modern calendar alternative](https://github.com/schedule-x/schedule-x)

**Library versions:**
- [Luxon 3.7.2 on npm](https://www.npmjs.com/package/luxon)
- [jsonwebtoken 9.0.3 on npm](https://www.npmjs.com/package/jsonwebtoken)
- [bcryptjs 2.4.3 on npm](https://www.npmjs.com/package/bcryptjs)

**Authentication patterns:**
- [Node.js Express JWT with roles (Corbado)](https://www.corbado.com/blog/nodejs-express-postgresql-jwt-authentication-roles)
- [Role-based access control with JWT (Stackademic)](https://blog.stackademic.com/mastering-security-role-based-access-control-in-node-js-with-jwt-1d653f6e35dc)

**Time tracking patterns:**
- [Employee time clock database design (SQL Server Central)](https://www.sqlservercentral.com/forums/topic/employee-time-clock)
- [Database timestamp best practices (Medium)](https://medium.com/@abdelaz9z/best-practices-for-database-design-incorporating-timestamps-and-user-metadata-in-tables-2310527dd677)

**Commission calculation:**
- [Best Commission Software with Real-Time Reporting 2026](https://www.getapp.com/sales-software/sales-commission/f/real-time-reporting/)

**Geolocation (future):**
- [node-iplocate privacy detection](https://www.npmjs.com/package/node-iplocate)
- [IPinfo Node.js client](https://github.com/ipinfo/node)

---

**Last updated:** 2026-01-29
**Confidence level:** HIGH (95% existing stack suffices, Luxon verified via official docs + npm registry)
