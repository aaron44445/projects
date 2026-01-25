# Phase 2: Core Data Flows - Research

**Researched:** 2026-01-25
**Domain:** Multi-tenant data flows, role-based access control, location-based filtering
**Confidence:** HIGH

## Summary

Phase 2 focuses on stabilizing staff management and multi-location data flows in a brownfield multi-tenant SaaS application. The codebase already has the fundamental infrastructure in place (Prisma ORM with PostgreSQL, Express.js API, Next.js frontend with React hooks), but needs systematic testing and bug fixes to ensure reliable daily operations.

The research reveals this is a **Pool Model** multi-tenant architecture (shared schema with tenant isolation via `salonId` field), with location-based filtering implemented through join tables (`StaffLocation`, `ServiceLocation`) and optional `locationId` fields on appointments. The role-based access control (RBAC) system uses JWT tokens with role claims and Express middleware for authorization.

**Key findings:**
- Existing architecture is sound but needs verification of data flow integrity
- Location filtering is partially implemented but needs consistency across all pages
- Role-based permissions exist via middleware but may not be comprehensively applied
- Testing infrastructure exists (Vitest) but coverage is sparse

**Primary recommendation:** Focus on data-flow testing and verification rather than architectural changes. Test from the owner's perspective using existing patterns, fixing bugs as discovered.

## Standard Stack

The project uses an established, modern stack for multi-tenant SaaS applications.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | Latest | Database ORM | Industry standard for type-safe database access in Node.js, excellent multi-tenant support |
| PostgreSQL | Latest | Relational database | Proven choice for multi-tenant SaaS, supports advanced features like RLS (not currently used) |
| Express.js | Latest | API framework | Lightweight, flexible, well-understood for Node.js APIs |
| Next.js | 14 | Frontend framework | Modern React framework with SSR/SSG capabilities |
| TypeScript | Latest | Type safety | Essential for large codebases, catches errors at compile time |
| jsonwebtoken | Latest | Authentication | Standard JWT implementation for Node.js |
| Vitest | Latest | Testing framework | Modern, fast test runner compatible with TypeScript |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | Latest | Runtime validation | API input validation, type-safe schemas |
| React hooks | Built-in | State management | Custom hooks pattern for data fetching (`useStaff`, `useLocations`, etc.) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Prisma | TypeORM | TypeORM offers more flexibility but Prisma's type generation and migration workflow is superior for this use case |
| Pool model | Schema-per-tenant | Would provide stronger isolation but massively increase complexity and cost for this scale |
| Express | NestJS | NestJS offers better structure but Express is simpler and the codebase is already established |

**Installation:**
```bash
# Already installed - this is brownfield
pnpm install
```

## Architecture Patterns

### Multi-Tenant Data Isolation (Pool Model)

**Pattern:** Shared schema with tenant-scoped queries
```typescript
// EVERY database query MUST filter by salonId
const users = await prisma.user.findMany({
  where: {
    salonId: req.user!.salonId, // CRITICAL - tenant isolation
    isActive: true,
  },
});
```

**Why this pattern:**
- Cost-effective for small-medium tenants
- Simpler deployment and maintenance
- Adequate security when implemented correctly
- All queries already follow this pattern in the codebase

**Source:** [Multi-tenant data isolation with PostgreSQL](https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql/)

### Location-Based Filtering Architecture

**Pattern:** Join tables for many-to-many relationships with nullable locationId for appointments

```typescript
// Staff can be assigned to specific locations
model StaffLocation {
  id         String   @id @default(uuid())
  staffId    String   @map("staff_id")
  locationId String   @map("location_id")
  isPrimary  Boolean  @default(false) @map("is_primary")
  // ...
  @@unique([staffId, locationId])
}

// Appointments can optionally be linked to a location
model Appointment {
  locationId String? @map("location_id")
  location   Location? @relation(fields: [locationId], references: [id])
  // ...
}
```

**Data flow for location filtering:**
1. Owner selects location in `LocationSwitcher` component
2. `selectedLocationId` stored in React context (`useLocationContext`) and localStorage
3. Data fetching hooks (`useAppointments`, `useStaff`) accept `locationId` parameter
4. API endpoints filter data via Prisma queries:
   - Staff: Join through `StaffLocation` table
   - Appointments: Direct `locationId` field match OR null (unassigned)
   - Services: Join through `ServiceLocation` table with overrides

**Implementation status (from existing code):**
- ✅ Location context provider exists (`useLocations`)
- ✅ LocationSwitcher component exists
- ✅ Staff API filters by location (lines 15-103 in `apps/api/src/routes/staff.ts`)
- ✅ Appointments API supports locationId filter
- ⚠️ May not be consistently applied across all pages (needs testing)

**Source:** [Multi-Region SaaS Architecture](https://www.tenupsoft.com/blog/architectural-considerations-for-cloud-based-multi-region-saas-product.html)

### Role-Based Access Control (RBAC)

**Pattern:** JWT token with role claim + middleware authorization

```typescript
// Authentication extracts role from JWT
interface JWTPayload {
  userId: string;
  salonId: string;
  role: string; // 'owner', 'admin', 'manager', 'staff'
}

// Authorization middleware checks role
export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'UNAUTHORIZED' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }
    next();
  };
}

// Usage in routes
router.post('/', authenticate, authorize('admin', 'owner'), handler);
```

**Role hierarchy (from schema and code):**
- `owner`: Full access, can manage billing, delete salon
- `admin`: Manage staff, locations, services, settings
- `manager`: Assign staff, manage schedules (limited settings access)
- `staff`: View own schedule, limited client access

**Current implementation:**
- ✅ JWT-based authentication middleware (`authenticate`)
- ✅ Role-based authorization middleware (`authorize`)
- ✅ Applied to sensitive routes (staff creation/deletion, location management)
- ⚠️ May have gaps in coverage (needs systematic audit)

**Source:** [Implementing RBAC in Node.js and Express](https://permify.co/post/role-based-access-control-rbac-nodejs-expressjs/)

### Frontend Data Fetching Pattern

**Pattern:** Custom React hooks with consistent API

```typescript
// Example: useStaff hook
export function useStaff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStaff = useCallback(async (locationId?: string | null) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (locationId) params.append('locationId', locationId);
      const response = await api.get<StaffMember[]>(`/staff?${params}`);
      if (response.success && response.data) {
        setStaff(response.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { staff, isLoading, error, fetchStaff, ... };
}
```

**Consistency across hooks:**
- All data hooks follow same pattern (loading/error states)
- All accept optional filtering parameters (locationId, dateRange, etc.)
- All use the shared `api` client with consistent error handling
- All return CRUD operations following RESTful conventions

**Benefits:**
- Predictable behavior across the application
- Easy to test
- Clear separation of concerns (UI vs data fetching)

### Recommended Project Structure (Already Implemented)

```
apps/
├── api/
│   └── src/
│       ├── routes/          # Route handlers (staff.ts, locations.ts, etc.)
│       ├── middleware/      # Auth, error handling
│       ├── services/        # Business logic (email, sms)
│       └── __tests__/       # API tests
└── web/
    └── src/
        ├── app/             # Next.js pages
        ├── components/      # Reusable UI components
        ├── hooks/           # Custom React hooks (data fetching)
        └── contexts/        # React contexts (auth, locations)
```

## Don't Hand-Roll

Problems that have existing solutions in the codebase - use these, don't rebuild:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-tenant data isolation | Custom query builder | Existing pattern: `where: { salonId: req.user!.salonId }` | Already consistently applied, tested in production |
| Location filtering | New filtering system | Existing `useLocationContext` + `LocationSwitcher` | Already implemented, just needs testing |
| RBAC | Custom permission system | Existing `authorize()` middleware | Works well, just needs comprehensive application |
| Data fetching | Direct fetch calls | Existing custom hooks (`useStaff`, `useAppointments`) | Consistent pattern, handles loading/error states |
| Authentication | Custom auth | Existing JWT + middleware | Standard approach, already implemented |
| Email sending | Direct SMTP | Existing `sendEmail()` service | Abstracts SendGrid, handles errors gracefully |
| Database queries | Raw SQL | Prisma ORM | Type-safe, handles migrations, already in use |

**Key insight:** This is a stabilization phase, not a greenfield build. The architecture is solid - focus on testing and fixing what exists rather than rewriting.

## Common Pitfalls

### Pitfall 1: Missing Tenant Isolation in Queries

**What goes wrong:** Forgetting to filter by `salonId` allows data leaks between tenants.

**Why it happens:** Easy to forget in join queries or when adding new endpoints.

**How to avoid:**
- ALWAYS include `salonId` in where clauses
- Use TypeScript to enforce (consider making `salonId` required in types)
- Test with multiple tenants to verify isolation
- Code review checklist item: "Does this query filter by salonId?"

**Warning signs:**
- Seeing other tenants' data in development
- Test failures when running with multiple tenants
- Missing `salonId` in Prisma queries

**Example from codebase (CORRECT):**
```typescript
// staff.ts line 23-30 - filters by salonId AND location
const staffAtLocation = await prisma.staffLocation.findMany({
  where: {
    locationId: locationId as string,
    staff: {
      salonId: req.user!.salonId, // ✅ TENANT ISOLATION
      isActive: true,
    },
  },
  // ...
});
```

### Pitfall 2: Inconsistent Location Filtering

**What goes wrong:** Some pages filter by location, others show all locations, creating confusion.

**Why it happens:** Location filtering added incrementally, not all pages updated.

**How to avoid:**
- Use `useLocationContext` consistently across all pages
- Pass `selectedLocationId` to all data hooks
- Document which pages should filter vs aggregate
- Create a location filtering test suite

**Warning signs:**
- Calendar shows staff from all locations when one is selected
- Dashboard stats don't match location selection
- User confusion about what data they're viewing

**Evidence in codebase:**
- `docs/plans/2026-01-24-location-filtering.md` shows recent work to add filtering
- Suggests this was a known gap being addressed

### Pitfall 3: Role Permission Gaps

**What goes wrong:** Staff can access owner-only features, or managers can't perform their duties.

**Why it happens:** Authorization middleware not applied to all sensitive endpoints.

**How to avoid:**
- Audit all routes for appropriate `authorize()` calls
- Test with different role types
- Document expected permissions per route
- Use integration tests with different user roles

**Warning signs:**
- Staff member can delete other staff
- Manager cannot assign staff to locations
- Regular users can access billing settings

**Example from codebase (CORRECT):**
```typescript
// staff.ts line 149-152 - only admin/owner can create staff
router.post(
  '/',
  authenticate,
  authorize('admin', 'owner'), // ✅ RBAC PROTECTION
  asyncHandler(async (req: Request, res: Response) => {
    // ...
  })
);
```

### Pitfall 4: Stale Data After Mutations

**What goes wrong:** UI doesn't update after creating/editing/deleting items.

**Why it happens:** Hooks don't refetch after mutations, or optimistic updates aren't applied.

**How to avoid:**
- Call `fetchX()` after successful mutations
- Update local state optimistically for better UX
- Consider using a library like React Query for cache management
- Test the full create → display → edit → display flow

**Warning signs:**
- Need to refresh page to see changes
- Data appears correct in API response but not in UI
- Race conditions when multiple users edit simultaneously

**Example from codebase (CORRECT):**
```typescript
// useTeam.ts lines 88-92 - refetches after mutation
const sendInvite = useCallback(async (data: InviteInput) => {
  const response = await api.post<TeamInvite>('/team/invite', data);
  if (response.success && response.data) {
    await fetchInvites(); // ✅ REFETCH TO UPDATE UI
    return response.data;
  }
}, [fetchInvites]);
```

### Pitfall 5: Staff Assignment Ambiguity

**What goes wrong:** Staff with no location assignments don't appear in location-filtered views, OR appear everywhere when they shouldn't.

**Why it happens:** Unclear business rule about staff with no assigned locations.

**How to avoid:**
- Define clear rule: "Staff with no locations work at ALL locations" OR "must be explicitly assigned"
- Implement consistently in API queries
- Document the rule in code comments
- Test edge case: staff with zero location assignments

**Warning signs:**
- Staff disappear when locations are added
- Staff appear at locations where they don't work
- Booking widget shows wrong staff for location

**Evidence in codebase:**
```typescript
// staff.ts lines 54-78 - IMPLEMENTS "no assignment = all locations" rule
const unassignedStaff = await prisma.user.findMany({
  where: {
    salonId: req.user!.salonId,
    isActive: true,
    staffLocations: {
      none: {}, // ✅ Staff with NO assignments included
    },
  },
});

users = [...assignedStaff, ...unassignedStaff]; // ✅ Combined result
```

**Decision appears to be:** Staff with no location assignments work at all locations. This should be verified as correct business logic.

## Code Examples

Verified patterns from official implementation:

### Multi-Tenant Query Pattern
```typescript
// Source: apps/api/src/routes/staff.ts:83-102
// ALWAYS filter by salonId to enforce tenant isolation
router.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    where: {
      salonId: req.user!.salonId, // CRITICAL: Tenant isolation
      isActive: true,
    },
    include: {
      staffServices: { include: { service: true } },
      staffAvailability: true,
      staffLocations: {
        include: {
          location: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: users });
}));
```

### Location Filtering with Join Tables
```typescript
// Source: apps/api/src/routes/staff.ts:20-48
// Filter staff by location using StaffLocation join table
if (locationId) {
  const staffAtLocation = await prisma.staffLocation.findMany({
    where: {
      locationId: locationId as string,
      staff: {
        salonId: req.user!.salonId,
        isActive: true,
      },
    },
    include: {
      staff: {
        include: {
          staffServices: { include: { service: true } },
          staffAvailability: true,
          staffLocations: {
            include: {
              location: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  const assignedStaff = staffAtLocation.map((sl) => sl.staff);

  // ALSO include staff with NO assignments (work at all locations)
  const unassignedStaff = await prisma.user.findMany({
    where: {
      salonId: req.user!.salonId,
      isActive: true,
      staffLocations: { none: {} },
      id: { notIn: assignedStaffIds },
    },
    // ... same includes
  });

  users = [...assignedStaff, ...unassignedStaff];
}
```

### Role-Based Authorization
```typescript
// Source: apps/api/src/middleware/auth.ts:95-115
// Protect routes with role-based middleware
export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
      });
    }

    next();
  };
}

// Usage:
router.post('/', authenticate, authorize('admin', 'owner'), handler);
```

### Frontend Hook Pattern
```typescript
// Source: apps/web/src/hooks/useStaff.ts
// Standard pattern for data fetching hooks
export function useStaff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStaff = useCallback(async (locationId?: string | null) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (locationId) params.append('locationId', locationId);

      const endpoint = params.toString() ? `/staff?${params}` : '/staff';
      const response = await api.get<StaffMember[]>(endpoint);

      if (response.success && response.data) {
        setStaff(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch staff';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { staff, isLoading, error, fetchStaff, ... };
}
```

### Location Context Provider
```typescript
// Source: apps/web/src/hooks/useLocations.tsx:232-242
// Persist location selection across page navigation
const selectLocation = useCallback((id: string | null) => {
  setSelectedLocationId(id);
  // Persist to localStorage for page reloads
  if (typeof window !== 'undefined') {
    if (id) {
      localStorage.setItem('selectedLocationId', id);
    } else {
      localStorage.removeItem('selectedLocationId');
    }
  }
}, []);
```

## State of the Art

Current best practices vs. what's implemented:

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Schema-per-tenant | Pool model with row filtering | Industry standard 2024+ | Simpler, cost-effective for small-medium SaaS |
| Global permission checks | JWT role claims + middleware | Express.js standard | Stateless, scalable authorization |
| Direct fetch calls | Custom React hooks | React best practice 2023+ | Reusable, testable, consistent error handling |
| Server-side filtering only | Context + localStorage | Modern SPA pattern | Better UX, survives page refresh |
| Separate database per location | Join tables with locationId | Multi-location SaaS standard | Flexible, supports location-specific settings |

**Deprecated/outdated:**
- PostgreSQL RLS not used: Could add extra security layer, but pool model with disciplined queries is sufficient for this scale
- No React Query/SWR: Custom hooks work well for this use case, migration would be premature optimization
- Soft deletes for staff: Implemented via `isActive` flag - this is correct, hard deletes would break referential integrity

**Current implementation status:** Modern and appropriate for a brownfield SaaS application at this scale.

## Open Questions

Things that couldn't be fully resolved - require testing or business logic decisions:

1. **Staff Assignment Business Rule**
   - What we know: Code treats unassigned staff as "works at all locations"
   - What's unclear: Is this the desired business logic, or should staff require explicit assignment?
   - Recommendation: Test with owners to confirm this behavior matches expectations

2. **Location Filtering Completeness**
   - What we know: Recent plan document shows location filtering was being added incrementally
   - What's unclear: Which pages are fully implemented vs. partial?
   - Recommendation: Systematic testing of Calendar, Dashboard, Staff, Clients pages with location selection

3. **Permission Matrix Coverage**
   - What we know: `authorize()` middleware exists and is used on some routes
   - What's unclear: Complete matrix of which roles can access which endpoints
   - Recommendation: Create permission matrix document and audit routes against it

4. **Test Coverage Gaps**
   - What we know: Test infrastructure exists (Vitest, helpers for authenticated requests)
   - What's unclear: Coverage percentage, which critical paths are tested
   - Recommendation: Run coverage report, prioritize testing critical owner workflows

5. **Staff Scheduling vs. Availability**
   - What we know: `StaffAvailability` table exists with location-specific availability
   - What's unclear: How scheduling interacts with location assignments and permissions
   - Recommendation: Test staff scheduling workflow end-to-end, verify location constraints work

6. **Appointment Location Assignment**
   - What we know: Appointments have nullable `locationId`
   - What's unclear: When is locationId null vs assigned? Is it required for multi-location salons?
   - Recommendation: Test appointment creation flow, verify location assignment logic

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `packages/database/prisma/schema.prisma`
- Codebase analysis: `apps/api/src/routes/staff.ts`, `locations.ts`, `team.ts`
- Codebase analysis: `apps/web/src/hooks/useStaff.ts`, `useLocations.tsx`, `useTeam.ts`
- Codebase analysis: `apps/api/src/middleware/auth.ts`
- Implementation plan: `docs/plans/2026-01-24-location-filtering.md`

### Secondary (MEDIUM confidence)
- [Multi-tenant data isolation with PostgreSQL Row Level Security](https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security/)
- [Implementing RBAC in Node.js and Express](https://permify.co/post/role-based-access-control-rbac-nodejs-expressjs/)
- [Multi-Region SaaS Architecture](https://www.tenupsoft.com/blog/architectural-considerations-for-cloud-based-multi-region-saas-product.html)
- [Building RBAC in Express.js](https://medium.com/@jayantchoudhary271/building-role-based-access-control-rbac-in-node-js-and-express-js-bc870ec32bdb)

### Tertiary (LOW confidence)
- [Multi-tenancy with Prisma and PostgreSQL](https://medium.com/@francolabuschagne90/securing-multi-tenant-applications-using-row-level-security-in-postgresql-with-prisma-orm-4237f4d4bd35) - Covers RLS which isn't used in this codebase
- [Location Intelligence SaaS patterns](https://www.maptive.com/best-location-intelligence-software/) - High-level overview, not specific to implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified in package.json and actively used
- Architecture: HIGH - Patterns confirmed by reading actual implementation code
- Pitfalls: MEDIUM - Based on code review and common multi-tenant issues, but not all tested
- Location filtering: MEDIUM - Implementation exists but completeness requires testing
- RBAC coverage: MEDIUM - Middleware exists but full route audit needed

**Research date:** 2026-01-25
**Valid until:** 2026-02-25 (30 days - stack is stable, patterns are established)

**Key uncertainties requiring validation:**
- Exact business rules for staff without location assignments
- Complete list of pages with/without location filtering
- Full permission matrix for all roles
- Test coverage percentage for critical paths
