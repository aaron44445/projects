# Architecture Audit Methodology

**Domain:** Multi-tenant Spa/Salon SaaS
**Stack:** Next.js 14, Express.js, Prisma, PostgreSQL (Supabase)
**Researched:** 2026-01-25

## Executive Summary

Peacase exhibits the classic symptoms of "feature-complete but unreliable" SaaS: features marked done that fail in production, edge cases unhandled, multi-tenant isolation untested, and data flows unverified end-to-end. The solution is not more testing tools, but a **systematic audit methodology** that follows data through the full system lifecycle, validates component boundaries, and verifies multi-tenant isolation at every layer.

**Critical finding:** Multi-tenant SaaS audits must verify tenant isolation in EVERY component—database queries, API endpoints, frontend hooks, authentication flows. A single missing `salonId` filter creates data leakage.

**Recommended approach:** Audit by data flow, not by feature list. Follow each entity (Appointment, Client, Service, User) from creation → storage → retrieval → display → modification → deletion, validating tenant isolation at every step.

---

## Systematic Audit Methodology

### The Problem with Feature-Based Audits

**Why "test each feature" fails:**
- Features span multiple components (API route → service → database → hook → component)
- Missing one component breaks the whole flow
- Multi-tenant bugs hide in unexpected places (reports, analytics, webhooks)
- Edge cases exist at component boundaries

**What happens:**
- "Appointments work" but filtering by location fails
- "Services display" but pricing overrides don't apply
- "Booking widget loads" but staff availability is wrong

### Data Flow Audit Approach

**Principle:** Follow data through the entire system, validating correctness at every transformation.

**For each core entity (Appointment, Client, Service, User, Location):**

1. **Creation Flow**
   - API endpoint receives request
   - Validates input (Zod schema)
   - Adds tenant context (salonId from auth)
   - Writes to database (with tenant filter)
   - Returns response
   - Frontend hook updates cache
   - UI reflects new state

2. **Retrieval Flow**
   - API endpoint receives query
   - Extracts tenant context
   - Filters database query by salonId
   - Transforms for API response
   - Frontend hook caches result
   - Component renders data

3. **Update Flow**
   - API receives update request
   - Validates ownership (tenant check)
   - Updates database (with tenant filter)
   - Invalidates affected caches
   - Returns updated state
   - Frontend re-renders

4. **Deletion Flow**
   - API validates deletion permission
   - Checks referential integrity
   - Soft delete or cascade delete
   - Invalidates caches
   - Frontend updates

**Validate at each step:**
- ✓ Tenant isolation maintained
- ✓ Error handling present
- ✓ Edge cases handled
- ✓ Data transformations correct
- ✓ Cache invalidation works
- ✓ UI updates correctly

---

## Component Audit Framework

### Layer 1: Database Schema & Queries

**What to audit:**

| Check | How to Verify | Red Flags |
|-------|---------------|-----------|
| Every model has `salonId` or foreign key to Salon | Review schema.prisma | Models without tenant link |
| Every query filters by tenant | Search codebase for `prisma.*.find*` | Queries without `where: { salonId }` |
| Indexes exist on tenant columns | Check `@@index([salonId])` in schema | Missing indexes on filtered columns |
| Cascade deletes configured | Check `onDelete: Cascade` | Orphaned records possible |
| Multi-location support works | Test location filtering queries | Appointments without locationId filter |

**Audit script:**
```bash
# Find all Prisma queries
grep -r "prisma\." apps/api/src/routes/ | grep -v "where.*salonId"

# Find models without salonId
grep "^model" packages/database/prisma/schema.prisma | while read -r model; do
  name=$(echo $model | awk '{print $2}')
  if ! grep -A 30 "^model $name" packages/database/prisma/schema.prisma | grep -q "salonId"; then
    echo "MISSING TENANT ID: $name"
  fi
done
```

**Known patterns from schema:**

| Model | Tenant Link | Method |
|-------|-------------|--------|
| Appointment | `salonId` | Direct |
| Client | `salonId` | Direct |
| Service | `salonId` | Direct |
| User | `salonId` | Direct |
| Location | `salonId` | Direct |
| StaffAvailability | `staffId` → User → salonId | Foreign key chain |
| Payment | `salonId` | Direct |
| Review | `salonId` | Direct |

**Critical audit points:**
- StaffService joins: Must filter both staff AND service by same salonId
- Appointment queries: Must respect locationId when multi-location enabled
- Client queries: Check preferredStaff belongs to same salon

### Layer 2: API Routes & Business Logic

**What to audit:**

| Component | Validation Required | Common Bugs |
|-----------|---------------------|-------------|
| Authentication flow | User → Salon linkage correct | Session persists wrong tenant |
| Input validation | Zod schemas match business rules | Type coercion allows bad data |
| Authorization checks | Tenant ownership verified | Cross-tenant access via ID guessing |
| Error responses | No data leakage in errors | Stack traces reveal structure |
| Rate limiting | Per-tenant, not global | One tenant DoS's all |

**Audit methodology:**

For each route file in `apps/api/src/routes/`:

```typescript
// CHECKLIST PER ENDPOINT

1. Does it extract tenant from auth?
   ✓ const { salonId } = req.user
   ✗ No auth middleware

2. Do all database queries filter by tenant?
   ✓ where: { salonId, id: req.params.id }
   ✗ where: { id: req.params.id }  // MISSING TENANT FILTER

3. Are errors handled explicitly?
   ✓ try/catch with user-friendly messages
   ✗ Let errors bubble (stack trace to client)

4. Is input validated?
   ✓ Zod schema parse before use
   ✗ Direct use of req.body

5. Are rate limits appropriate?
   ✓ Per-endpoint limits configured
   ✗ Global limit only
```

**Critical flows to audit end-to-end:**

1. **Registration → Onboarding → First Appointment**
   - Register creates Salon + User
   - Tokens include salonId
   - Onboarding creates Services
   - Services filtered by salonId
   - First appointment links to correct salon

2. **Staff Invitation → Setup → Appointment Assignment**
   - Invite token includes salonId
   - Staff user links to correct salon
   - Staff can only see own salon's data
   - Appointments only assigned to same-salon staff

3. **Client Booking → Appointment → Payment → Review**
   - Booking widget loads salonId from slug
   - Appointment created with correct salon
   - Payment links to appointment's salon
   - Review cannot leak to other salons

**From auth.ts analysis:**
- ✓ Input normalization (email lowercase/trim)
- ✓ Zod validation with user-friendly errors
- ✓ Token includes salonId
- ✓ Login history tracking
- ✓ Session management with token hashing
- ⚠ Need to audit: Does token refresh maintain correct salonId?
- ⚠ Need to audit: Can you reset password for another salon's user?

### Layer 3: Frontend Data Flow

**What to audit:**

| Component | Validation Required | Common Bugs |
|-----------|---------------------|-------------|
| Authentication context | Persists across refreshes | Session lost on reload |
| API client hooks | Include auth headers | Requests fail silently |
| Error boundaries | Catch and display errors | White screen of death |
| Cache invalidation | Mutations update cache | Stale data displayed |
| Loading states | Show during async ops | Infinite spinners |

**Audit by hook:**

For each hook in `apps/web/src/hooks/`:

```typescript
// CHECKLIST PER HOOK

1. Does it handle loading state?
   ✓ const [loading, setLoading] = useState(false)
   ✗ No loading indicator

2. Does it handle error state?
   ✓ const [error, setError] = useState<string | null>(null)
   ✗ Errors swallowed

3. Does it invalidate cache on mutation?
   ✓ mutate('/api/appointments') after create
   ✗ Optimistic update without revalidation

4. Does it include auth token?
   ✓ headers: { Authorization: `Bearer ${token}` }
   ✗ Unauthenticated requests

5. Does it handle 401 (session expired)?
   ✓ Redirect to login
   ✗ Silent failure
```

**Critical user flows to walk through:**

1. **Dashboard Load**
   - Auth check redirects if not logged in
   - Dashboard fetches stats for correct salon
   - Recent activity filtered by salon
   - Location switcher only shows owned locations

2. **Appointment Creation**
   - Service list filtered by salon
   - Staff list filtered by salon + location
   - Client autocomplete filtered by salon
   - Created appointment appears immediately

3. **Calendar View**
   - Appointments filtered by salon + location
   - Staff availability respects time zones
   - Drag-and-drop updates correctly
   - Multi-day view doesn't lose data

### Layer 4: Multi-Tenant Isolation Verification

**Critical audit:** The "noisy neighbor" test.

**Setup:**
1. Create two test salons (Salon A, Salon B)
2. Populate each with data (clients, services, appointments, staff)
3. Log in as Salon A
4. Attempt to access Salon B's data

**Test matrix:**

| Attack Vector | Test Method | Expected Result |
|---------------|-------------|-----------------|
| Direct ID access | GET /api/appointments/{salon_b_appt_id} | 403 Forbidden or 404 Not Found |
| Query parameter injection | GET /api/clients?salonId={salon_b_id} | Ignored, returns Salon A clients |
| Slug enumeration | GET /embed/{salon_b_slug} | Shows Salon B widget (public) |
| Dashboard crossover | Login as Salon A, check all pages | No Salon B data visible |
| Report crossover | Run reports as Salon A | Only Salon A data |
| Webhook data | Trigger webhooks | Only relevant salon notified |

**From schema analysis - High-risk cross-tenant scenarios:**

| Scenario | Risk | Verification Method |
|----------|------|---------------------|
| Staff shared between salons | Data leakage | Query: Can one user have multiple salonIds? (No, unique constraint) |
| Preferred staff from other salon | Access escalation | Check: Client.preferredStaffId foreign key same salon |
| Service assigned to wrong location | Data confusion | Check: ServiceLocation validates location belongs to salon |
| Appointment cross-booking | Availability leak | Check: Staff availability query filters by salonId |
| Payment to wrong salon | Revenue leak | Check: Payment.salonId matches Appointment.salonId |

**Automated multi-tenant audit script:**

```typescript
// test-multi-tenant-isolation.ts
// Run against staging environment with two test salons

const salonA = { id: 'test-salon-a', token: 'token-a' }
const salonB = { id: 'test-salon-b', token: 'token-b' }

// Test 1: Direct resource access
const salonBAppointment = await createAppointment(salonB.token)
const crossAccess = await fetch(`/api/appointments/${salonBAppointment.id}`, {
  headers: { Authorization: `Bearer ${salonA.token}` }
})
expect(crossAccess.status).toBe(403) // Must not return Salon B data

// Test 2: List endpoints respect tenant
const salonAClients = await fetch('/api/clients', {
  headers: { Authorization: `Bearer ${salonA.token}` }
})
const clientIds = salonAClients.json().data.map(c => c.id)
expect(clientIds).not.toContain(salonBClient.id)

// Test 3: Query parameter injection doesn't override
const injectionAttempt = await fetch(`/api/clients?salonId=${salonB.id}`, {
  headers: { Authorization: `Bearer ${salonA.token}` }
})
const clients = injectionAttempt.json().data
expect(clients.every(c => c.salonId === salonA.id)).toBe(true)
```

---

## Audit Order: Critical Path First

**Principle:** Audit in dependency order. Foundation before features.

### Phase 1: Authentication & Session Management (CRITICAL)

**Why first:** If auth is broken, all tenant isolation fails.

**Audit steps:**
1. Registration creates Salon + User atomically
2. Login returns tokens with correct salonId
3. Token refresh maintains salonId
4. Session persists across page refresh
5. Logout invalidates all tokens
6. Password reset cannot be used cross-tenant

**Validation:**
- Create account → verify Salon created
- Login → decode JWT → verify salonId matches
- Refresh token → verify salonId unchanged
- Reload page → verify session restored
- Logout → verify tokens deleted

**Tools:**
- Manual testing with browser DevTools
- JWT decoder (jwt.io)
- Database inspection

### Phase 2: Core Data Models (FOUNDATION)

**Why second:** All features depend on correct data storage.

**Audit steps:**
1. Every model with `salonId` has index
2. Foreign key chains maintain tenant link
3. Cascade deletes configured
4. Soft deletes where appropriate (Clients, Appointments)
5. Unique constraints scoped to tenant

**Validation:**
- Run schema linter
- Test cascade delete (delete Salon → all data removed)
- Test unique constraints (two salons can have same service name)

**Tools:**
- Prisma schema validator
- Custom migration review script

### Phase 3: API Tenant Filtering (SECURITY)

**Why third:** Without this, data leaks happen.

**Audit steps:**
1. Extract all Prisma queries
2. Verify each includes `salonId` filter
3. Check authorization middleware applied
4. Verify ownership checks before mutations
5. Test error handling doesn't leak data

**Validation:**
- Code search for Prisma queries without tenant filter
- Manual review of each route file
- Multi-tenant isolation tests (Phase 1 auth + Phase 2 models working)

**Tools:**
- grep/ripgrep for pattern matching
- Custom AST parser for Prisma calls
- Manual code review

### Phase 4: Frontend Data Fetching (USER-FACING)

**Why fourth:** Now that backend is secure, verify frontend shows correct data.

**Audit steps:**
1. All hooks include auth headers
2. Error states displayed to user
3. Loading states prevent double-submission
4. Cache invalidation after mutations
5. Optimistic updates roll back on error

**Validation:**
- Walk through each user flow
- Verify loading spinners appear
- Verify error messages display
- Verify data refreshes after create/update/delete

**Tools:**
- Manual testing with network throttling
- React DevTools for state inspection

### Phase 5: End-to-End User Flows (INTEGRATION)

**Why fifth:** With components working, verify full workflows.

**Critical flows:**

1. **New Salon Onboarding**
   - Register → Dashboard → Setup Services → Create Staff → First Appointment

2. **Daily Operations**
   - Login → Check Calendar → Create Appointment → Mark Complete → View Reports

3. **Client Self-Booking**
   - Visit /embed/slug → Select Service → Choose Time → Book → Receive Confirmation

4. **Multi-Location**
   - Enable multi-location → Create second location → Assign staff → Location-specific booking

**Validation:**
- Playwright E2E tests for critical paths
- Manual testing with production-like data

### Phase 6: Edge Cases & Error Scenarios (RELIABILITY)

**Why last:** Foundation working, now handle the unusual.

**Test categories:**

| Category | Example Scenarios |
|----------|-------------------|
| Concurrent updates | Two users edit same appointment |
| Network failures | API timeout mid-operation |
| Invalid state transitions | Cancel already-completed appointment |
| Data migration | Import clients from CSV with duplicates |
| Time zone edge cases | Appointment at DST boundary |
| Multi-location conflicts | Staff double-booked at different locations |

**Validation:**
- Chaos engineering (kill API mid-request)
- Concurrent user simulation
- Boundary value testing

---

## Automated Audit Tools

### Tool 1: Tenant Isolation Scanner

**Purpose:** Find Prisma queries missing tenant filters.

```bash
# tenant-isolation-scan.sh
#!/bin/bash

echo "Scanning for potential tenant isolation issues..."

# Find all Prisma queries
grep -rn "prisma\.\w*\.find" apps/api/src/routes/ | \
  grep -v "where.*salonId" | \
  grep -v "where.*salon:" | \
  grep -v "// SAFE: Public endpoint" | \
  grep -v "include.*salon" > potential-issues.txt

if [ -s potential-issues.txt ]; then
  echo "⚠️  POTENTIAL TENANT ISOLATION ISSUES FOUND:"
  cat potential-issues.txt
  exit 1
else
  echo "✓ No obvious tenant isolation issues found"
fi
```

### Tool 2: API Endpoint Coverage Check

**Purpose:** Ensure all endpoints have auth middleware.

```typescript
// check-endpoint-auth.ts
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const routesDir = 'apps/api/src/routes';
const routeFiles = readdirSync(routesDir).filter(f => f.endsWith('.ts'));

const issues = [];

for (const file of routeFiles) {
  const content = readFileSync(join(routesDir, file), 'utf8');

  // Find route definitions
  const routes = content.match(/router\.(get|post|put|patch|delete)\(['"](.*?)['"]/g);

  if (!routes) continue;

  for (const route of routes) {
    const [, method, path] = route.match(/router\.(\w+)\(['"](.*?)['"]/) || [];

    // Check if route is public or has auth middleware
    const isPublic = path?.includes('/public/') ||
                     content.includes('// PUBLIC ENDPOINT') ||
                     path === '/health';

    const hasAuth = content.includes('authenticate,') ||
                    content.includes('requireAuth');

    if (!isPublic && !hasAuth) {
      issues.push(`${file}: ${method.toUpperCase()} ${path} - No auth middleware`);
    }
  }
}

if (issues.length > 0) {
  console.error('⚠️  ENDPOINTS WITHOUT AUTH:');
  issues.forEach(i => console.error(`  - ${i}`));
  process.exit(1);
} else {
  console.log('✓ All endpoints have auth middleware');
}
```

### Tool 3: Data Flow Tracer

**Purpose:** Follow an entity through full lifecycle.

```typescript
// trace-appointment-flow.ts
// Traces appointment from creation to completion

async function traceAppointmentFlow() {
  console.log('🔍 Tracing Appointment data flow...\n');

  // 1. CREATE
  console.log('Step 1: Create appointment via API');
  const createResponse = await fetch('/api/appointments', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(appointmentData)
  });
  const created = await createResponse.json();
  console.log(`✓ Created appointment ${created.data.id}`);

  // 2. VERIFY DATABASE
  console.log('\nStep 2: Verify database record');
  const dbRecord = await prisma.appointment.findUnique({
    where: { id: created.data.id },
    include: { salon: true }
  });
  console.log(`✓ DB record has salonId: ${dbRecord.salonId}`);
  console.log(`✓ Matches auth salonId: ${dbRecord.salonId === authSalonId}`);

  // 3. RETRIEVE VIA API
  console.log('\nStep 3: Retrieve via API');
  const getResponse = await fetch(`/api/appointments/${created.data.id}`, {
    headers: authHeaders
  });
  const retrieved = await getResponse.json();
  console.log(`✓ Retrieved appointment matches created`);

  // 4. VERIFY FRONTEND DISPLAY
  console.log('\nStep 4: Check frontend hook');
  const { appointments } = useAppointments();
  const frontendAppt = appointments.find(a => a.id === created.data.id);
  console.log(`✓ Appears in frontend hook: ${!!frontendAppt}`);

  // 5. UPDATE
  console.log('\nStep 5: Update appointment');
  const updateResponse = await fetch(`/api/appointments/${created.data.id}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ status: 'completed' })
  });
  console.log(`✓ Updated successfully`);

  // 6. DELETE
  console.log('\nStep 6: Delete appointment');
  await fetch(`/api/appointments/${created.data.id}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  const afterDelete = await prisma.appointment.findUnique({
    where: { id: created.data.id }
  });
  console.log(`✓ Deleted: ${!afterDelete}`);

  console.log('\n✅ Full appointment lifecycle verified');
}
```

---

## Testing Strategy by Component Type

### Database Layer Testing

**Approach:** Direct Prisma queries in isolated tests.

```typescript
// Database isolation test
describe('Multi-tenant isolation', () => {
  it('prevents cross-tenant appointment access', async () => {
    const salonA = await createTestSalon('Salon A');
    const salonB = await createTestSalon('Salon B');

    const apptA = await prisma.appointment.create({
      data: { salonId: salonA.id, /* ... */ }
    });

    // Attempt to query Salon B's appointments from Salon A context
    const results = await prisma.appointment.findMany({
      where: { salonId: salonB.id }
    });

    expect(results).not.toContain(apptA);
  });
});
```

**What to test:**
- Tenant filtering works
- Cascade deletes work
- Unique constraints scoped correctly
- Foreign key constraints prevent orphans

### API Layer Testing

**Approach:** Supertest for endpoint testing.

```typescript
// API authorization test
describe('POST /api/appointments', () => {
  it('creates appointment for authenticated salon only', async () => {
    const response = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${salonAToken}`)
      .send(appointmentData);

    expect(response.body.data.salonId).toBe(salonA.id);

    // Verify cannot be retrieved by Salon B
    const crossTenantAccess = await request(app)
      .get(`/api/appointments/${response.body.data.id}`)
      .set('Authorization', `Bearer ${salonBToken}`);

    expect(crossTenantAccess.status).toBe(403);
  });
});
```

**What to test:**
- Auth middleware blocks unauthenticated requests
- Tenant filter applied to all queries
- Ownership checked before mutations
- Errors don't leak sensitive data

### Frontend Layer Testing

**Approach:** React Testing Library + MSW for API mocking.

```typescript
// Hook testing with MSW
describe('useAppointments', () => {
  it('filters appointments by authenticated salon', async () => {
    // Mock API response
    server.use(
      rest.get('/api/appointments', (req, res, ctx) => {
        const authHeader = req.headers.get('authorization');
        const salonId = decodeSalonId(authHeader);

        return res(ctx.json({
          data: mockAppointments.filter(a => a.salonId === salonId)
        }));
      })
    );

    const { result, waitForNextUpdate } = renderHook(() => useAppointments(), {
      wrapper: AuthProvider
    });

    await waitForNextUpdate();

    expect(result.current.appointments).toHaveLength(3);
    expect(result.current.appointments.every(a => a.salonId === testSalonId)).toBe(true);
  });
});
```

**What to test:**
- Hooks include auth headers
- Loading states work
- Error states work
- Cache invalidation works

### End-to-End Testing

**Approach:** Playwright for full user flows.

```typescript
// E2E test
test('complete appointment lifecycle', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name=email]', 'owner@salon.com');
  await page.fill('[name=password]', 'password123');
  await page.click('button[type=submit]');

  // Navigate to calendar
  await page.waitForURL('/dashboard');
  await page.click('a[href="/calendar"]');

  // Create appointment
  await page.click('button:has-text("New Appointment")');
  await page.selectOption('[name=clientId]', testClient.id);
  await page.selectOption('[name=serviceId]', testService.id);
  await page.selectOption('[name=staffId]', testStaff.id);
  await page.click('button:has-text("Create")');

  // Verify appears on calendar
  await expect(page.locator('.appointment-card')).toContainText(testClient.name);

  // Complete appointment
  await page.click('.appointment-card');
  await page.click('button:has-text("Mark Complete")');

  // Verify status updated
  await expect(page.locator('.status-badge')).toHaveText('Completed');
});
```

**What to test:**
- Critical user paths work end-to-end
- Error handling shows user-friendly messages
- Loading states prevent double-clicks
- Navigation works correctly

---

## Audit Checklist Template

For each feature/component, complete this checklist:

```markdown
## Feature: [Name]

### Database Layer
- [ ] Model has salonId or foreign key chain to Salon
- [ ] Indexes on tenant columns
- [ ] Cascade deletes configured
- [ ] Unique constraints scoped to tenant

### API Layer
- [ ] Auth middleware applied
- [ ] Tenant filter in all queries
- [ ] Ownership check before mutations
- [ ] Input validation (Zod)
- [ ] Error handling doesn't leak data
- [ ] Rate limiting per-tenant

### Frontend Layer
- [ ] Hook includes auth headers
- [ ] Loading state shown
- [ ] Error state shown
- [ ] Cache invalidation on mutation
- [ ] Optimistic updates rollback on error

### Multi-Tenant Isolation
- [ ] Cannot access other salon's data via direct ID
- [ ] Cannot access via query parameter injection
- [ ] List endpoints filter correctly
- [ ] Reports/analytics scoped to salon

### End-to-End Flow
- [ ] Create → appears in list
- [ ] Update → reflects changes
- [ ] Delete → removes from list
- [ ] Error scenarios handled gracefully

### Edge Cases
- [ ] Concurrent updates handled
- [ ] Network failures handled
- [ ] Invalid state transitions blocked
- [ ] Time zone handling correct
```

---

## Known Anti-Patterns from Research

Based on 2026 SaaS audit best practices research:

### Anti-Pattern 1: Global Rate Limiting

**Problem:** One tenant can DoS all tenants.

**Example:**
```typescript
// BAD: Global rate limit
app.use(rateLimit({ max: 100, windowMs: 60000 }));

// GOOD: Per-tenant rate limit
app.use(rateLimitByTenant({ max: 100, windowMs: 60000 }));
```

**From Peacase:** API uses in-memory rate limiting (resets on deploy). Verify limits are per-tenant, not global.

### Anti-Pattern 2: Implicit Tenant Context

**Problem:** Relying on "current salon" state instead of explicit filtering.

**Example:**
```typescript
// BAD: Assumes current salon
const clients = await prisma.client.findMany();

// GOOD: Explicit filter
const clients = await prisma.client.findMany({
  where: { salonId: req.user.salonId }
});
```

**Audit:** Search for Prisma queries without explicit `where: { salonId }`.

### Anti-Pattern 3: Client-Side Tenant Filtering

**Problem:** Send all data, filter on frontend.

**Example:**
```typescript
// BAD: Filter client-side
const allAppointments = await fetch('/api/appointments');
const myAppointments = allAppointments.filter(a => a.salonId === currentSalon);

// GOOD: Filter server-side
const myAppointments = await fetch(`/api/appointments?salonId=${currentSalon}`);
// (But also validate salonId on server against auth context)
```

**Audit:** Check API responses don't include cross-tenant data.

### Anti-Pattern 4: Cascade Delete Without Safeguards

**Problem:** Deleting salon deletes all data without confirmation.

**Example:**
```typescript
// BAD: Immediate cascade
await prisma.salon.delete({ where: { id } });

// GOOD: Soft delete with grace period
await prisma.salon.update({
  where: { id },
  data: {
    isActive: false,
    scheduledDeletion: addDays(new Date(), 30)
  }
});
```

**From schema:** Peacase has cascade deletes configured. Verify UI requires confirmation and implements grace period.

### Anti-Pattern 5: Swallowing Errors

**Problem:** Silent failures leave users confused.

**Example:**
```typescript
// BAD: Swallow error
try {
  await createAppointment(data);
} catch (e) {
  console.error(e);
}

// GOOD: Show user-friendly error
try {
  await createAppointment(data);
} catch (e) {
  setError('Unable to create appointment. Please try again.');
  console.error('Appointment creation failed:', e);
}
```

**Audit:** Verify all API errors return user-friendly messages and frontend displays them.

---

## Sources

### SaaS Audit Methodologies
- [SaaS Security Audit Checklist & Best Practices](https://ardas-it.com/saas-security-audit-checklist-best-practices-and-principles)
- [How to Audit SaaS: A Step-by-Step Guide](https://www.hubifi.com/blog/saas-audit-guide)
- [SaaS Operational Audit Case Study](https://theagencyauditor.com/transforming-saas-internal-operations-with-audit/)

### Multi-Tenant Best Practices
- [Implementing Secure Multi-Tenancy in SaaS Applications](https://dzone.com/articles/secure-multi-tenancy-saas-developer-checklist)
- [Multitenancy Checklist on Azure](https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/checklist)
- [SaaS Multitenancy: Components, Pros and Cons and 5 Best Practices](https://frontegg.com/blog/saas-multitenancy)

### Testing Methodologies
- [Best 20 SaaS Testing Tools in 2026](https://testgrid.io/blog/saas-testing-tools/)
- [SaaS Testing Guide and Tools in 2025](https://bugbug.io/blog/software-testing/saas-testing-guide-and-tools/)
- [SaaS Application Testing - Automation & Best Practices](https://www.virtuosoqa.com/post/testing-saas-applications)

### Data Flow Testing
- [What is Data Flow Testing?](https://www.lambdatest.com/learning-hub/data-flow-testing)
- [Data Flow Testing - GeeksforGeeks](https://www.geeksforgeeks.org/software-testing/data-flow-testing/)
- [Data Flow Testing: A Comprehensive Guide](https://www.stickyminds.com/article/data-flow-testing-comprehensive-guide)

### Critical Path Analysis
- [The critical path method in project management: 2026 guide](https://www.wrike.com/blog/critical-path-is-easy-as-123/)
- [Critical Path Method (CPM): Complete Guide for Project Managers](https://instituteprojectmanagement.com/blog/critical-path-method/)
