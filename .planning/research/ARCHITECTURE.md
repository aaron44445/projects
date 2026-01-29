# Architecture Research: Staff Portal

**Researched:** 2026-01-29
**Confidence:** HIGH

## Executive Summary

The Staff Portal integrates into Peacase's existing multi-tenant architecture using **shared authentication infrastructure with role-based routing** rather than completely separate systems. The existing JWT middleware, permission system, and tenant isolation utilities will be extended, not duplicated. Frontend uses dedicated `/staff` routes with StaffAuthContext (already scaffolded), backend adds `/api/v1/staff-portal/*` routes that leverage existing auth middleware with staff-specific permissions.

**Build Approach:** Extend existing auth → Add staff routes → Build staff UI components → Integrate with existing data models.

## Integration Points

### 1. Authentication System (Shared with Extensions)

**Existing Infrastructure:**
- `apps/api/src/middleware/auth.ts` - JWT verification middleware
- `apps/api/src/routes/auth.ts` - Login/registration endpoints
- Token storage: localStorage with `peacase_access_token` and `peacase_refresh_token` keys
- JWT payload structure: `{ userId, salonId, role }`

**Staff Portal Integration:**
- **Reuse existing JWT middleware** - Same `authenticate()` function validates staff tokens
- **Extend auth routes** - Add `/api/v1/auth/staff/login` and `/api/v1/auth/staff/setup` (for magic link onboarding)
- **Separate token storage keys** - Use `peacase_staff_access_token` and `peacase_staff_refresh_token` to prevent cross-contamination with owner sessions
- **Frontend context separation** - `StaffAuthContext.tsx` already exists, mirrors `AuthContext.tsx` pattern

**Why Shared Auth Works:**
- JWT payload already includes `role` field (owner, admin, staff, manager, receptionist)
- Middleware already handles role-based filtering (see `hasPermission()` in appointments.ts)
- Multi-tenant isolation via `withSalonId()` utility already enforced
- Token refresh mechanism already implemented

**What Needs Building:**
- `/api/v1/auth/staff/login` endpoint (validates staff user, returns JWT)
- `/api/v1/auth/staff/setup` endpoint (magic link token → password setup → JWT)
- Frontend login page at `/staff/login`
- Frontend setup page at `/staff/setup`

### 2. Database Schema (Minimal Changes)

**Existing User Model (Prisma):**
```prisma
model User {
  id                String       @id @default(uuid())
  salonId           String       @map("salon_id")
  email             String
  passwordHash      String?      @map("password_hash")
  firstName         String       @map("first_name")
  lastName          String       @map("last_name")
  role              String       @default("staff")
  magicLinkToken    String?      @map("magic_link_token")
  magicLinkExpires  DateTime?    @map("magic_link_expires")
  isActive          Boolean      @default(true)

  staffAvailability StaffAvailability[]
  staffServices     StaffService[]
  appointments      Appointment[]
  commissionRecords CommissionRecord[]
  // ... other relations
}
```

**No Schema Changes Required:**
- `magicLinkToken` and `magicLinkExpires` already exist for invite flow
- `passwordHash` is nullable, supports staff who haven't set passwords yet
- `role` field distinguishes staff from owners
- `staffAvailability`, `staffServices` relations already defined

**Email Invitation Flow (Already Implemented):**
- Owner creates staff via `/api/v1/staff` (POST)
- System generates `magicLinkToken`, sets 7-day expiry
- Email sent with link: `${FRONTEND_URL}/staff/setup?token=${inviteToken}`
- Staff clicks link → Frontend validates token → Staff sets password → Login

### 3. Permissions System (Extend Existing)

**Current Implementation (apps/api/src/middleware/permissions.ts):**
```typescript
export const PERMISSIONS = {
  VIEW_ALL_APPOINTMENTS: ['owner', 'admin', 'manager'],
  MANAGE_STAFF: ['owner', 'admin'],
  MANAGE_CLIENTS: ['owner', 'admin', 'manager', 'receptionist'],
  // ... etc
};

export function hasPermission(role: string, permission: string[]): boolean {
  return permission.includes(role);
}
```

**Staff Portal Permissions to Add:**
```typescript
// New permissions for staff portal features
PERMISSIONS.VIEW_OWN_SCHEDULE = ['owner', 'admin', 'manager', 'staff', 'receptionist'];
PERMISSIONS.VIEW_OWN_APPOINTMENTS = ['owner', 'admin', 'manager', 'staff', 'receptionist'];
PERMISSIONS.COMPLETE_OWN_APPOINTMENTS = ['owner', 'admin', 'staff'];
PERMISSIONS.REQUEST_TIME_OFF = ['owner', 'admin', 'manager', 'staff'];
PERMISSIONS.VIEW_OWN_EARNINGS = ['owner', 'admin', 'staff'];
```

**Pattern to Follow:**
- Owner/admin routes use `requirePermission(PERMISSIONS.MANAGE_STAFF)`
- Staff routes use `requireAnyPermission([PERMISSIONS.VIEW_OWN_SCHEDULE])`
- Self-service routes check `req.user.userId === req.params.staffId` for ownership

### 4. Multi-Tenant Isolation (Already Solved)

**Existing Pattern (Used Throughout):**
```typescript
// apps/api/src/lib/prismaUtils.ts
export function withSalonId(salonId: string): { salonId: string } {
  return { salonId };
}

// Usage in routes
const appointments = await prisma.appointment.findMany({
  where: {
    ...withSalonId(req.user!.salonId),
    staffId: req.user!.userId,
  },
});
```

**Staff Portal Reuses This:**
- Every staff API route uses `withSalonId(req.user!.salonId)`
- JWT payload includes `salonId`, middleware validates before route execution
- No cross-tenant data leakage possible (already verified in production)

### 5. Frontend Routing Structure

**Existing Routes:**
- `/dashboard/*` - Owner/admin interface (uses `AuthContext`)
- `/portal/*` - Client booking portal (uses `ClientAuthContext`)
- `/embed/*` - Embeddable booking widget

**New Staff Routes:**
- `/staff/login` - Staff login page
- `/staff/setup` - Staff password setup (magic link)
- `/staff/dashboard` - Staff overview (appointments, earnings)
- `/staff/schedule` - View/edit schedule and availability
- `/staff/appointments` - View assigned appointments
- `/staff/earnings` - View commissions and payments
- `/staff/profile` - Edit profile and settings
- `/staff/time-off` - Request time off

**Layout Architecture:**
```typescript
// apps/web/src/app/staff/layout.tsx (ALREADY EXISTS)
export default function StaffPortalLayout({ children }) {
  return (
    <StaffAuthProvider>
      {children}
    </StaffAuthProvider>
  );
}
```

**Auth Context Separation:**
- `/dashboard/*` wrapped by `AuthProvider` (owners)
- `/staff/*` wrapped by `StaffAuthProvider` (staff)
- No context collision, separate token storage keys

## New Components

### Backend: New API Routes

#### 1. Staff Portal Auth Routes
**Path:** `/api/v1/staff-portal/auth/*`

**Endpoints:**
- `POST /staff-portal/auth/login` - Staff login (email + password)
  - Validates user exists, has `role: 'staff'`, `isActive: true`
  - Returns JWT with staff permissions
  - Response: `{ staff: StaffUser, tokens: { accessToken, refreshToken } }`

- `POST /staff-portal/auth/setup` - Password setup via magic link
  - Validates `magicLinkToken`, checks expiry
  - Sets `passwordHash`, clears magic link fields
  - Auto-login with JWT
  - Response: `{ staff: StaffUser, tokens: { accessToken, refreshToken } }`

- `POST /staff-portal/auth/refresh` - Token refresh
  - Reuses existing refresh token logic
  - Returns new access token

- `POST /staff-portal/auth/logout` - Logout
  - Clears refresh token from database
  - Response: `{ success: true }`

#### 2. Staff Profile Routes
**Path:** `/api/v1/staff-portal/profile`

**Endpoints:**
- `GET /staff-portal/me` - Get current staff user
  - Returns staff details with assigned locations
  - Includes `staffServices`, `staffAvailability`

- `PATCH /staff-portal/profile` - Update own profile
  - Staff can edit: firstName, lastName, phone, avatarUrl
  - Cannot edit: role, commissionRate, isActive (owner only)

#### 3. Staff Schedule Routes
**Path:** `/api/v1/staff-portal/schedule`

**Endpoints:**
- `GET /staff-portal/schedule` - Get own schedule
  - Returns `staffAvailability` for current user
  - Grouped by location if multi-location enabled

- `PUT /staff-portal/schedule` - Update own schedule
  - Direct update if `salon.staffScheduleNeedsApproval === false`
  - Creates `ScheduleChangeRequest` if approval required

#### 4. Staff Appointments Routes
**Path:** `/api/v1/staff-portal/appointments`

**Endpoints:**
- `GET /staff-portal/appointments` - List own appointments
  - Filters: `WHERE staffId = req.user.userId`
  - Includes client name, service, time, status
  - Pagination support

- `PATCH /staff-portal/appointments/:id/complete` - Mark appointment complete
  - Permission check: Can only complete own appointments
  - Updates status, records completion time

- `GET /staff-portal/appointments/:id` - Get appointment details
  - Includes consultation form responses if any
  - Client contact info based on `salon.staffCanViewClientContact`

#### 5. Staff Earnings Routes
**Path:** `/api/v1/staff-portal/earnings`

**Endpoints:**
- `GET /staff-portal/earnings` - Get commission records
  - Filters: `WHERE staffId = req.user.userId`
  - Groups by pay period
  - Response: `{ commissions: CommissionRecord[], summary: { total, paid, unpaid } }`

#### 6. Staff Time Off Routes
**Path:** `/api/v1/staff-portal/time-off`

**Endpoints:**
- `GET /staff-portal/time-off` - List own time off requests
- `POST /staff-portal/time-off` - Request time off
  - Creates `TimeOff` with `status: 'pending'`
  - Auto-approve if `salon.staffScheduleNeedsApproval === false`
- `DELETE /staff-portal/time-off/:id` - Cancel time off request

### Frontend: New Pages and Components

#### 1. Staff Auth Pages
- `/staff/login` - Login form (email, password)
- `/staff/setup` - Password setup form (validates token, sets password)

#### 2. Staff Dashboard Pages
- `/staff/dashboard` - Overview (today's appointments, earnings summary, notifications)
- `/staff/schedule` - Schedule view/edit (calendar component, availability editor)
- `/staff/appointments` - Appointment list (filterable, paginated)
- `/staff/earnings` - Earnings view (commission breakdown, payment history)
- `/staff/time-off` - Time off management (request form, status list)
- `/staff/profile` - Profile editor (name, phone, avatar)

#### 3. Reusable Components
- `StaffNav` - Navigation sidebar for staff portal
- `AppointmentCard` - Display appointment details
- `ScheduleEditor` - Availability time block editor
- `EarningsChart` - Commission visualization
- `TimeOffForm` - Request time off modal

## Modified Components

### Backend: Existing Routes to Extend

#### 1. `/api/v1/staff` (Owner-side staff management)
**Current State:** CRUD for staff members (owner/admin only)

**No Changes Required:**
- Already handles staff creation with magic link email
- Already returns staff with availability and services
- Already enforces tenant isolation

**Optional Enhancement:**
- Add `GET /api/v1/staff/:id/schedule` for owner to view staff schedule
- Add `POST /api/v1/staff/:id/approve-schedule` for approving schedule changes

#### 2. `/api/v1/appointments` (Shared appointments)
**Current State:** Manages appointments with permission checks

**Modification:**
- Add `staffCanCompleteAppointment()` helper:
  ```typescript
  function staffCanCompleteAppointment(userId: string, appointment: Appointment): boolean {
    return appointment.staffId === userId;
  }
  ```
- Expose `PATCH /api/v1/appointments/:id/complete` with staff permission check

**Alternative:** Create staff-specific endpoint at `/api/v1/staff-portal/appointments/:id/complete` to avoid permission collision

#### 3. Middleware: Permission System
**File:** `apps/api/src/middleware/permissions.ts`

**Add Staff Permissions:**
```typescript
export const PERMISSIONS = {
  // Existing owner/admin permissions...

  // Staff portal permissions
  VIEW_OWN_SCHEDULE: ['owner', 'admin', 'manager', 'staff', 'receptionist'],
  EDIT_OWN_SCHEDULE: ['owner', 'admin', 'staff'],
  VIEW_OWN_APPOINTMENTS: ['owner', 'admin', 'manager', 'staff', 'receptionist'],
  COMPLETE_OWN_APPOINTMENTS: ['owner', 'admin', 'staff'],
  VIEW_OWN_EARNINGS: ['owner', 'admin', 'staff'],
  REQUEST_TIME_OFF: ['owner', 'admin', 'manager', 'staff'],
};
```

### Frontend: Existing Contexts

#### 1. Token Storage Utilities
**File:** `apps/web/src/types/auth.ts` (create if not exists)

**Add Token Key Constants:**
```typescript
export const TOKEN_KEYS = {
  owner: {
    access: 'peacase_access_token',
    refresh: 'peacase_refresh_token',
  },
  staff: {
    access: 'peacase_staff_access_token',
    refresh: 'peacase_staff_refresh_token',
  },
  client: {
    access: 'peacase_client_access_token',
    refresh: 'peacase_client_refresh_token',
  },
};
```

**Note:** StaffAuthContext.tsx already uses these constants (line 72-73)

#### 2. API Client Configuration
**File:** `apps/web/src/lib/api.ts`

**No Changes Required:**
- API client already supports setting access token dynamically
- Staff portal routes will use same base URL and error handling

## Data Flow

### 1. Staff Onboarding Flow

```
[Owner Creates Staff]
  ↓
POST /api/v1/staff
  ↓
Prisma creates User with role='staff', generates magicLinkToken
  ↓
Email sent with setup link: /staff/setup?token=xyz
  ↓
[Staff Clicks Link]
  ↓
GET /staff/setup validates token via API
  ↓
Staff enters password
  ↓
POST /staff-portal/auth/setup
  ↓
Updates passwordHash, returns JWT
  ↓
StaffAuthContext stores tokens
  ↓
Redirect to /staff/dashboard
```

### 2. Staff Login Flow

```
[Staff Visits /staff/login]
  ↓
Enters email + password
  ↓
POST /staff-portal/auth/login
  ↓
Middleware: authenticate() validates JWT (if exists)
Route: Validates email, passwordHash, role='staff'
  ↓
Generates new JWT with { userId, salonId, role: 'staff' }
  ↓
Returns { staff: {...}, tokens: {...} }
  ↓
StaffAuthContext.login() stores tokens
  ↓
Redirect to /staff/dashboard
```

### 3. Viewing Appointments Flow

```
[Staff Views /staff/appointments]
  ↓
GET /staff-portal/appointments
  ↓
Middleware: authenticate() extracts JWT
Middleware: requireActiveSubscription() checks salon subscription
Route: Filters WHERE staffId = req.user.userId AND salonId = req.user.salonId
  ↓
Prisma query with withSalonId() + staffId filter
  ↓
Returns appointments[] with client, service, location
  ↓
Frontend renders AppointmentCard components
```

### 4. Completing Appointment Flow

```
[Staff Clicks "Mark Complete" on Appointment]
  ↓
PATCH /staff-portal/appointments/:id/complete
  ↓
Middleware: authenticate()
Route: Verifies appointment.staffId === req.user.userId
Route: Updates appointment.status = 'completed'
  ↓
Webhook: Triggers commission calculation if payment exists
  ↓
Creates CommissionRecord for staff
  ↓
Returns updated appointment
  ↓
Frontend updates UI, shows success message
```

### 5. Multi-Location Data Access

```
[Staff Has Multiple Locations Assigned]
  ↓
Staff.staffLocations = [{ locationId: 'loc1', isPrimary: true }, { locationId: 'loc2' }]
  ↓
GET /staff-portal/schedule
  ↓
Returns availability grouped by location:
{
  loc1: [{ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }],
  loc2: [{ dayOfWeek: 3, startTime: '10:00', endTime: '15:00' }]
}
  ↓
Frontend shows location tabs or selector
```

## Suggested Build Order

### Phase 1: Authentication Foundation (Week 1)
**Priority: CRITICAL - Nothing works without auth**

1. **Backend Auth Routes**
   - Create `apps/api/src/routes/staff-portal-auth.ts`
   - Implement `POST /staff-portal/auth/login`
   - Implement `POST /staff-portal/auth/setup` (magic link)
   - Add to `apps/api/src/index.ts`: `app.use('/api/v1/staff-portal/auth', staffPortalAuthRouter)`

2. **Frontend Auth Pages**
   - Create `/staff/login/page.tsx`
   - Create `/staff/setup/page.tsx`
   - Wire up `StaffAuthContext.login()`

3. **Testing**
   - Verify magic link email flow
   - Verify staff login works
   - Verify token refresh works
   - Verify logout clears tokens

**Deliverable:** Staff can receive invite, set password, log in, and be authenticated.

### Phase 2: Core Staff Routes (Week 2)
**Priority: HIGH - Basic functionality**

4. **Profile Routes**
   - `GET /staff-portal/me`
   - `PATCH /staff-portal/profile`

5. **Appointments Routes**
   - `GET /staff-portal/appointments`
   - `GET /staff-portal/appointments/:id`
   - `PATCH /staff-portal/appointments/:id/complete`

6. **Frontend Dashboard**
   - Create `/staff/dashboard/page.tsx`
   - Create `/staff/appointments/page.tsx`
   - Implement `StaffNav` component

**Deliverable:** Staff can view their profile, see appointments, mark complete.

### Phase 3: Schedule Management (Week 3)
**Priority: MEDIUM - Staff needs to manage availability**

7. **Schedule Routes**
   - `GET /staff-portal/schedule`
   - `PUT /staff-portal/schedule`
   - Handle `salon.staffScheduleNeedsApproval` logic

8. **Time Off Routes**
   - `GET /staff-portal/time-off`
   - `POST /staff-portal/time-off`
   - `DELETE /staff-portal/time-off/:id`

9. **Frontend Pages**
   - Create `/staff/schedule/page.tsx`
   - Create `/staff/time-off/page.tsx`
   - Build `ScheduleEditor` component

**Deliverable:** Staff can view/edit schedule, request time off.

### Phase 4: Earnings and Analytics (Week 4)
**Priority: LOW - Nice to have, not critical path**

10. **Earnings Routes**
    - `GET /staff-portal/earnings`
    - Group by pay period
    - Calculate totals

11. **Frontend Earnings Page**
    - Create `/staff/earnings/page.tsx`
    - Build `EarningsChart` component
    - Show commission breakdown

**Deliverable:** Staff can view earnings and commission history.

### Phase 5: Multi-Location Support (Week 5)
**Priority: OPTIONAL - Only if salon has multiLocationEnabled**

12. **Location-Aware Filtering**
    - Update schedule routes to handle locationId
    - Update appointments to show location
    - Filter by staff's assigned locations

13. **Frontend Location Selector**
    - Add location dropdown to nav
    - Filter data by selected location
    - Show "All Locations" option

**Deliverable:** Staff with multiple locations can switch between them.

### Phase 6: Polish and Permissions (Week 6)
**Priority: MEDIUM - Security and UX**

14. **Permission Refinements**
    - Add all staff permissions to middleware
    - Test role-based access
    - Verify tenant isolation

15. **UI/UX Polish**
    - Empty states for no appointments
    - Loading skeletons
    - Error handling
    - Responsive design

**Deliverable:** Production-ready staff portal with security hardening.

## Architecture Decisions

### Decision 1: Shared Auth vs Separate Auth
**Choice:** Shared JWT middleware with separate token storage

**Rationale:**
- Existing middleware already handles role-based access
- JWT payload includes `role`, sufficient for routing
- Tenant isolation via `withSalonId()` already proven secure
- Separate token keys prevent owner/staff session conflicts

**Alternative Rejected:** Completely separate auth system (duplication, maintenance burden)

### Decision 2: Route Structure (/staff-portal vs /staff)
**Choice:** `/api/v1/staff-portal/*` for backend, `/staff/*` for frontend

**Rationale:**
- Backend: `/staff-portal/*` clearly distinguishes from `/staff` (owner managing staff)
- Frontend: `/staff/*` is concise, user-friendly URL
- No collision between owner routes and staff routes

**Alternative Rejected:** Same route paths with role middleware (confusing, error-prone)

### Decision 3: Permission System Extension
**Choice:** Add staff-specific permissions to existing `PERMISSIONS` object

**Rationale:**
- Centralizes all permissions in one place
- Reuses existing `hasPermission()` and `requirePermission()` middleware
- Easy to audit and maintain

**Alternative Rejected:** Separate permission system for staff (duplication, complexity)

### Decision 4: Frontend Context Separation
**Choice:** Dedicated `StaffAuthContext` wrapping `/staff/*` routes

**Rationale:**
- Prevents token collision between owner and staff sessions
- Allows concurrent owner and staff portals in different tabs
- Clear separation of concerns

**Alternative Rejected:** Shared AuthContext with role switching (state management complexity)

### Decision 5: Appointment Completion
**Choice:** Staff-specific endpoint `/staff-portal/appointments/:id/complete`

**Rationale:**
- Avoids permission collision with owner appointment management
- Clear intent: staff completing their own appointments
- Easier to add staff-specific logic (notifications, commission triggers)

**Alternative Rejected:** Extending `/api/v1/appointments/:id/complete` (permission complexity)

## Research Sources

**Multi-Tenant SaaS Architecture:**
- [Building Role-Based Access Control for a Multi-Tenant SaaS Startup | Medium](https://medium.com/@my_journey_to_be_an_architect/building-role-based-access-control-for-a-multi-tenant-saas-startup-26b89d603fdb)
- [Best Practices for Multi-Tenant Authorization | Permit.io](https://www.permit.io/blog/best-practices-for-multi-tenant-authorization)
- [Multi-tenant Role-based Access Control (RBAC) | Aserto](https://www.aserto.com/use-cases/multi-tenant-saas-rbac)

**Next.js Authentication Patterns:**
- [Guides: Authentication | Next.js](https://nextjs.org/docs/app/guides/authentication)
- [Implement Role-Based Access Control in Next.js 15 | Clerk](https://clerk.com/blog/nextjs-role-based-access-control)
- [Safeguarding User Role-Based Private Routes in Next.js 13 or 14 | Medium](https://medium.com/@suhag_alamin/safeguarding-user-role-based-private-routes-in-next-js-13-or-14-app-router-a-step-by-step-guide-5ab5d4b4c0fb)

**Express.js API Design:**
- [How to structure an Express.js REST API with best practices | Treblle](https://treblle.com/blog/egergr)
- [Creating a Secure Node.js REST API | Toptal](https://www.toptal.com/nodejs/secure-rest-api-in-nodejs)
- [Top Node.js Design Patterns You Should Know in 2026 | NareshIT](https://nareshit.com/blogs/top-nodejs-design-patterns-2026)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Authentication Integration | HIGH | Existing JWT middleware is production-proven, just needs new routes |
| Database Schema | HIGH | No changes required, all fields exist |
| Multi-Tenant Isolation | HIGH | withSalonId() pattern already verified secure |
| Permission System | HIGH | Extending existing system, clear patterns |
| Frontend Routing | HIGH | Layout structure already exists, follows Next.js best practices |
| API Route Structure | MEDIUM | New routes, but following established patterns |
| Build Order | MEDIUM | Based on dependency analysis, may need adjustment in practice |

## Gaps and Open Questions

1. **Notification Preferences:** Should staff have separate notification settings? (Email for new appointments, etc.)
   - **Resolution:** Phase 6 enhancement, use existing notification system

2. **Mobile Responsiveness:** Staff portal likely used on mobile devices in salon
   - **Resolution:** Phase 6 polish, ensure responsive design

3. **Multi-Language Support:** Staff may prefer different language than owner
   - **Resolution:** Future enhancement, out of scope for v1.2

4. **Staff Avatar Uploads:** Should staff be able to upload their own photos?
   - **Resolution:** Yes, use existing Cloudinary integration (already in User model)

5. **Commission Auto-Calculation:** When does commission get calculated?
   - **Resolution:** Existing webhook on payment completion, no changes needed

## Next Steps for Roadmap Creation

This architecture research informs the following roadmap decisions:

1. **Phase Structure:** Build authentication first (critical path), then core features, then enhancements
2. **Technology Choices:** No new libraries needed, leverage existing stack
3. **Integration Testing:** Each phase should include integration tests with existing owner routes
4. **Migration Strategy:** No data migration needed, just feature addition
5. **Deployment:** Staff portal can be deployed incrementally, no downtime required

**Ready for roadmap creation.**
