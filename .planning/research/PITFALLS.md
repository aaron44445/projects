# Pitfalls Research: Staff Portal Addition

**Domain:** Adding Staff Portal to existing spa/salon SaaS
**Context:** Peacase production system with existing multi-tenant architecture
**Researched:** 2026-01-29
**Risk Profile:** HIGH - Integration with production system serving paying customers

## Executive Summary

Adding staff portal functionality to an existing multi-tenant SaaS introduces critical integration risks that can compromise tenant isolation, data privacy, and existing booking workflows. Research shows that 82% of organizations have suffered security breaches from authentication changes, and improper multi-tenant access patterns are the #1 cause of data leakage in SaaS platforms. The primary danger is not building new features incorrectly—it's breaking existing security boundaries that protect customer data. Staff access introduces new attack surfaces: a second authentication path, additional role complexity, and potential for privilege escalation through misconfigured permissions.

## Critical Pitfalls

High-impact mistakes that cause data breaches, privilege escalation, or production incidents.

### Pitfall 1: Dual Authentication Paths Create Session Confusion

**What goes wrong:** Implementing separate staff login (`/staff-portal/auth/login`) alongside owner login (`/auth/login`) creates two authentication paths that share JWT infrastructure but have different validation logic, leading to role confusion, privilege escalation, or bypassed tenant isolation.

**Why it happens:**
- Both paths issue JWTs with identical structure (`{ userId, salonId, role }`)
- Frontend stores token without tracking which portal issued it
- Middleware (`authenticate`) validates token signature but doesn't verify portal-appropriate roles
- Staff token used against owner-only endpoints or vice versa
- Token refresh logic doesn't maintain portal context

**Consequences:**
- Staff member logs in via staff portal, token validates on owner portal routes
- Owner logs in, uses admin routes, token erroneously grants access to staff routes
- Role escalation: staff member modifies their role claim in storage, token refresh accepts it
- Cross-portal session confusion after refresh token rotation
- Audit logs show action by User A but was actually User B (token confusion)

**Warning signs:**
- Two separate login endpoints with duplicate token generation logic
- Single `authenticate` middleware used for both portals without role verification
- Frontend localStorage stores token without `portalType` metadata
- No portal-specific claims in JWT payload
- Token refresh endpoint doesn't verify original portal context

**Real-world example from codebase:**
```typescript
// staffPortal.ts line 60 generates tokens identical to auth.ts line 123
function generateTokens(userId: string, salonId: string, role: string) {
  const accessToken = jwt.sign({ userId, salonId, role }, ...);
  // Missing: portal: 'staff' claim
}

// This staff token can authenticate against owner routes because
// authenticate middleware only checks signature and expiry, not portal
```

**Prevention:**
1. **Add portal claim to JWT:** Include `portal: 'staff' | 'owner'` in token payload
2. **Portal-specific middleware:** Create `authenticateStaff` that verifies `portal === 'staff'` claim
3. **Separate token secrets:** Use `JWT_STAFF_SECRET` and `JWT_OWNER_SECRET` for complete isolation
4. **Frontend portal tracking:** Store `{ token, portal, role }` together in auth context
5. **Audit existing routes:** Ensure staff-portal routes use `authenticateStaff`, owner routes use `authenticateOwner`

**Which phase addresses this:** Phase 1 (Authentication Migration) - Must fix before expanding features

**Detection:**
- Monitor auth error rates by endpoint prefix (`/staff-portal/*` vs `/api/v1/*`)
- Alert on role mismatches (staff role accessing owner endpoints)
- Log analysis: token issued by portal X used against portal Y endpoints

---

### Pitfall 2: Multi-Tenant Isolation Weakened by Staff Queries

**What goes wrong:** Adding staff access introduces queries that filter by `staffId` but forget to also filter by `salonId`, allowing staff from Salon A to access data from Salon B if they guess the correct IDs.

**Why it happens:**
- Existing codebase has strict `salonId` filtering on all owner queries
- Staff queries add `staffId` filter and assume that's sufficient
- Attacker manipulates request: changes `staffId` in URL/body to another salon's staff ID
- Query filters by that staffId but doesn't verify staffId belongs to requester's salon
- Database returns data from different salon

**Consequences:**
- Cross-tenant data leak: Staff at Salon A views appointments from Salon B
- Privacy violation: Staff sees client names, phone numbers, notes from other salons
- Compliance breach: GDPR/CCPA violations from unauthorized data access
- Earnings theft: Staff views commission records from other salons
- Customer trust destroyed if discovered

**Warning signs:**
- Staff routes only filter by `staffId` in query
- Missing `salonId` in WHERE clauses
- No verification that `req.params.staffId` belongs to `req.user.salonId`
- Direct database queries without tenant isolation wrapper
- Copy-pasted owner route logic with staffId substituted for salonId

**Real-world example from codebase:**
```typescript
// BAD - Missing salonId filter (hypothetical vulnerability)
router.get('/appointments/:id', authenticate, staffOnly, async (req, res) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: req.params.id, staffId: req.user.userId }
    // MISSING: salonId: req.user.salonId
  });
  // If req.params.id is from different salon, still returns data!
});

// GOOD - Always filter by both
router.get('/appointments/:id', authenticate, staffOnly, async (req, res) => {
  const appointment = await prisma.appointment.findUnique({
    where: {
      id: req.params.id,
      staffId: req.user.userId,
      salonId: req.user.salonId  // Critical!
    }
  });
});
```

**Prevention:**
1. **Mandatory dual-filter rule:** ALL staff queries MUST filter by BOTH `staffId` AND `salonId`
2. **Create query helper:** `staffQuery({ staffId: req.user.userId, salonId: req.user.salonId })` wrapper
3. **Verify staff ownership first:** Before any operation, verify `staffId` param belongs to `req.user.salonId`
4. **Code review checklist:** "Does this query filter by salonId?" required YES before merge
5. **Integration tests:** Test with multi-tenant fixtures, verify Staff A cannot access Salon B data

**Which phase addresses this:** Phase 2 (Data Visibility Rules) - Core security foundation

**Detection:**
- Audit all Prisma queries in staff routes for missing `salonId`
- Automated test: Staff token from Salon A attempts to access Salon B resource IDs
- Monitor logs for 403 errors (staff accessing forbidden salon data)

---

### Pitfall 3: Client PII Exposure Through Overly Permissive Staff Access

**What goes wrong:** Staff portal returns full client records (email, phone, address, notes, payment history) when staff only need name and appointment details, exposing sensitive PII that staff shouldn't access for privacy/compliance.

**Why it happens:**
- Owner portal clients endpoint returns all fields, staff route reuses same logic
- Prisma `include` statements pull in related data (payment methods, medical history)
- "Staff should see everything about their clients" assumption without data minimization
- No field-level access control, only route-level

**Consequences:**
- Privacy violation: Staff sees client credit card last-4, CVV security codes
- GDPR violation: Processing more PII than necessary for staff's job function
- Medical privacy breach: Staff sees client allergy notes intended only for owner
- Regulatory fines: CCPA/HIPAA violations for unnecessary data access
- Trust damage: Client discovers staff can see their payment methods

**Warning signs:**
- Staff routes use same Prisma includes as owner routes
- No `select` statements limiting fields in staff queries
- Client notes field exposed to staff without sanitization
- Payment method data accessible via staff endpoints
- Medical/allergy information visible in staff responses

**Real-world example from codebase:**
```typescript
// staffPortal.ts line 1071 - Returns full client data
const clients = await prisma.client.findMany({
  where: { id: { in: clientIds }, isActive: true },
  select: {
    id: true,
    firstName: true,
    lastName: true,
    phone: true,
    email: true,
    notes: true,  // May contain sensitive info
    // Missing explicit exclusions: paymentMethods, address, allergies
  },
});
```

**Prevention:**
1. **Create staff-specific data transfer objects:** `ClientSummaryForStaff` with only necessary fields
2. **Explicit field selection:** Use Prisma `select` to whitelist allowed fields
3. **Sanitize notes:** Remove owner-only content from client notes before returning to staff
4. **Separate endpoints:** `/clients` (owner) vs `/my-clients` (staff) with different field sets
5. **Field-level permissions:** Document which roles can access which client fields

**Which phase addresses this:** Phase 2 (Data Visibility Rules) - Privacy compliance critical

**Detection:**
- Data flow analysis: Map which fields flow to staff vs owner
- Compliance audit: Review staff responses against GDPR data minimization
- Privacy scan: Grep for PII fields (email, phone, address) in staff responses

---

### Pitfall 4: Earnings Calculation Corruption from Race Conditions

**What goes wrong:** Commission and tip calculations happen during appointment completion, time-off approval, and schedule updates, creating race conditions where multiple operations update the same commission record simultaneously, resulting in incorrect earnings totals.

**Why it happens:**
- Owner marks appointment complete → calculates commission
- Staff marks same appointment complete → recalculates commission
- Both operations read current commission record, modify, save (read-modify-write race)
- Final save overwrites previous save, losing data
- No database transaction wrapping commission + appointment updates
- No optimistic locking on commission records

**Consequences:**
- Staff earnings understated: Lost commission from race condition overwrite
- Staff earnings overstated: Double-counted commissions from concurrent operations
- Payroll errors: Staff paid incorrect amount based on corrupted data
- Audit trail breaks: Commission amount changes without history
- Staff dispute: "I earned $500 but system shows $350"

**Warning signs:**
- Commission calculation outside database transaction
- Read-modify-write pattern without locking
- No version field on CommissionRecord for optimistic locking
- Concurrent appointment completion possible (owner + staff both have button)
- Commission recalculation triggered by multiple events

**Real-world example:**
```typescript
// VULNERABLE - Race condition (hypothetical based on common patterns)
async function calculateCommission(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  const existingRecord = await prisma.commissionRecord.findFirst({ where: { appointmentId } });

  // RACE: Another request could modify existingRecord here

  const newAmount = appointment.price * staff.commissionRate;
  await prisma.commissionRecord.update({
    where: { id: existingRecord.id },
    data: { commissionAmount: newAmount }
    // Overwrites any concurrent updates!
  });
}

// SAFE - Use transaction with atomic operations
async function calculateCommission(appointmentId: string) {
  await prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.findUnique({ where: { id: appointmentId } });
    const newAmount = appointment.price * staff.commissionRate;

    await tx.commissionRecord.upsert({
      where: { appointmentId },  // Unique constraint prevents duplicates
      create: { appointmentId, commissionAmount: newAmount, ... },
      update: { commissionAmount: newAmount }
    });
  });
}
```

**Prevention:**
1. **Wrap in transactions:** All commission calculations inside `prisma.$transaction`
2. **Idempotent operations:** Use `upsert` with unique constraints instead of update
3. **Single source of truth:** Only calculate commission once per appointment
4. **Optimistic locking:** Add `version` field to CommissionRecord, increment on update
5. **Prevent duplicate actions:** Disable completion button after first click (frontend)

**Which phase addresses this:** Phase 3 (Time Tracking & Earnings) - Financial accuracy critical

**Detection:**
- Monitor for duplicate CommissionRecord entries with same appointmentId
- Alert on commission amount changes without corresponding appointment updates
- Compare sum of commissions to sum of completed appointment prices (should match)

---

### Pitfall 5: Retroactive Permission Changes Break Existing Staff Sessions

**What goes wrong:** Owner changes staff permissions (disables schedule editing, removes location access) but changes don't take effect until staff logs out and back in, causing confusion and allowing actions that should now be forbidden.

**Why it happens:**
- Permissions stored in database (Salon.staffCanEditSchedule)
- JWT contains role but not individual permissions
- Staff's token issued before permission change remains valid
- Token validation only checks signature/expiry, doesn't re-query permissions
- No cache invalidation or session revocation mechanism

**Consequences:**
- Staff edits schedule after owner disabled feature (permission lag)
- Removed staff retains access until token expires (7 days!)
- Security bypass: Terminated staff can access system for days
- Owner confusion: "I disabled that feature, why can they still use it?"
- Audit compliance: Staff performed action they shouldn't have permission for

**Warning signs:**
- Long-lived access tokens (7+ days)
- Permissions stored in database but not checked on each request
- No session revocation mechanism
- Settings changes don't invalidate existing sessions
- No "force logout all users" admin capability

**Real-world example from codebase:**
```typescript
// auth.ts line 118 - 7-day access token
const ACCESS_TOKEN_EXPIRY = '7d';  // Long-lived!

// staffPortal.ts line 1203 - Permission check only queries DB, doesn't invalidate tokens
const salon = await prisma.salon.findUnique({
  where: { id: salonId },
  select: { staffCanEditSchedule: true },
});
if (!salon?.staffCanEditSchedule) {
  return res.status(403).json({ ... });
}
// But staff's valid token allows request to reach here for 7 days!
```

**Prevention:**
1. **Shorten token expiry:** Reduce to 1 hour for access tokens, use refresh tokens for long sessions
2. **Check permissions on every request:** Query `Salon.staff*` settings from DB, not just at login
3. **Session revocation table:** Track active sessions, revoke on permission changes
4. **Permission claims in token:** Include `canEditSchedule` in JWT, but short-lived
5. **Real-time permission sync:** WebSocket broadcast of permission changes to active sessions

**Which phase addresses this:** Phase 1 (Authentication) + Phase 4 (Permission System)

**Detection:**
- Audit logs: Staff action after permission disabled (timestamp comparison)
- Monitor session age: Alert on tokens older than permission change time
- Test: Disable feature, verify staff cannot use it without re-login

---

## Common Mistakes

Frequently made errors that cause delays, data inconsistencies, or user confusion.

### Pitfall 6: Appointment Status Confusion Between Owner and Staff Updates

**What goes wrong:** Owner and staff both mark appointments as complete/no-show/cancelled, creating conflicting status updates that overwrite each other without conflict resolution.

**Why it happens:**
- Both portals have "Mark Complete" button for same appointment
- No last-write-wins warning or conflict detection
- Status transitions not validated (can go from completed → cancelled)
- No audit trail of who changed status when

**Prevention:**
1. Status transition rules: Define valid state machine (pending → confirmed → completed/cancelled/no-show)
2. Optimistic concurrency: Include `updatedAt` in update WHERE clause
3. Audit trail: Log all status changes with userId and timestamp
4. UI warning: "Owner already marked this complete. Override?"

**Which phase:** Phase 5 (Appointment Management Integration)

---

### Pitfall 7: Time Zone Handling Breaks Cross-Location Staff Schedules

**What goes wrong:** Staff assigned to multiple locations in different time zones see schedule conflicts because availability stored in salon's default timezone, not per-location.

**Why it happens:**
- `StaffAvailability.startTime` stored as string "09:00" without timezone
- Salon has single `timezone` field but multiple locations in different zones
- Staff works 9am-5pm at Location A (EST) and Location B (PST)
- System shows 9am-5pm for both, but means different absolute times

**Prevention:**
1. Store availability in UTC with location-specific display
2. Validate staff can't be double-booked across locations considering timezones
3. Show timezone indicator in staff schedule UI: "9:00 AM EST" not just "9:00 AM"

**Which phase:** Phase 3 (Schedule Management)

---

### Pitfall 8: Commission Rate Changes Applied Retroactively

**What goes wrong:** Owner updates staff commission rate from 40% to 50%, and system recalculates ALL past commissions, changing historical earnings records that were already paid.

**Why it happens:**
- `User.commissionRate` stored as single current value
- Commission calculation queries current rate, not rate-at-time-of-service
- No commission rate history table
- Past appointments recalculated when viewing earnings report

**Prevention:**
1. Store commission rate on CommissionRecord at creation time (snapshot)
2. Rate changes only affect future commissions
3. Earnings report shows: "Earned at 40% rate (rate changed to 50% on 2026-02-01)"
4. Audit trail of rate changes with effective dates

**Which phase:** Phase 3 (Earnings Calculation)

---

### Pitfall 9: Staff Can See Deleted Client Data Through Appointments

**What goes wrong:** Owner soft-deletes client (sets `isActive: false`), but staff can still see full client info via past appointments because appointment includes don't filter by client.isActive.

**Why it happens:**
- Client deletion is soft delete (sets flag, doesn't remove row)
- Appointment queries include client data without checking isActive
- Privacy expectation: deleted client shouldn't appear anywhere
- GDPR "right to be forgotten" incomplete

**Prevention:**
1. All client includes must filter: `client: { where: { isActive: true } }`
2. Show "[Deleted Client]" placeholder for inactive clients in appointments
3. Anonymize deleted client data after grace period
4. Test deletion: Verify client doesn't appear in any staff responses

**Which phase:** Phase 2 (Data Visibility Rules)

---

### Pitfall 10: Concurrent Time-Off Approval Creates Double-Booking

**What goes wrong:** Staff requests time off for Jan 15. While request is pending, owner books appointment for staff on Jan 15. Admin approves time off, creating conflict.

**Why it happens:**
- Time-off approval doesn't check for existing appointments in that date range
- Appointment creation doesn't check for pending/approved time-off
- No blocking mechanism between these workflows

**Prevention:**
1. Time-off approval checks: "Staff has 3 appointments during this period. Cancel them first?"
2. Appointment booking checks: "Staff has pending time-off. Book anyway?"
3. Validation on both sides prevents double-booking
4. Consider: Auto-cancel appointments when time-off approved

**Which phase:** Phase 6 (Time-Off Management)

---

### Pitfall 11: Staff Notification Spam from Owner Activity

**What goes wrong:** Owner creates 50 appointments for staff, triggering 50 individual notification emails/SMS, overwhelming staff inbox.

**Why it happens:**
- Notification triggers fire on every appointment create event
- No batching mechanism for bulk operations
- Staff gets notification for owner-created appointments (not just client bookings)

**Prevention:**
1. Detect bulk operations: If >5 appointments created in <1 minute, batch notifications
2. Single digest email: "You have 50 new appointments this week"
3. Notification preferences: "Notify me only for client bookings, not owner-created"
4. Rate limiting on notifications per staff per hour

**Which phase:** Phase 7 (Notification Integration)

---

## Integration Risks

Risks specific to adding staff portal to existing owner portal system.

### Pitfall 12: Breaking Existing Booking Widget Flow

**What goes wrong:** Adding staff authentication changes how booking widget identifies available staff, breaking public booking flow where clients select staff before authenticating.

**Why it happens:**
- Booking widget queries `/api/v1/staff` for available staff list
- New staff auth requires authentication to list staff
- Public endpoint now returns 401 Unauthorized
- Client booking page shows "No staff available"

**Prevention:**
1. Audit all endpoints used by booking widget (public, no auth)
2. Keep separate public endpoints: `/public/staff` vs `/staff-portal/profile`
3. Staff listing for booking must remain unauthenticated
4. Feature flag: Deploy staff portal without affecting booking flow
5. Integration tests: Booking widget tests must pass after staff portal addition

**Which phase:** Pre-launch verification checklist

---

### Pitfall 13: Owner Dashboard Breaks When Filtering by Staff Role

**What goes wrong:** Owner dashboard shows "All Staff" filter. After adding staff portal, query breaks because some users are now role: 'staff' with passwordHash, conflicting with previous assumption that staff are profiles without auth.

**Why it happens:**
- Original codebase: staff are User records with no passwordHash
- New system: staff have passwordHash and can log in
- Dashboard query assumes: `role = 'staff' AND passwordHash = null`
- Mixing old inactive staff profiles with new active staff accounts

**Prevention:**
1. Migration script: Mark old staff profiles with special flag or deactivate
2. Query clarification: Use `isActive` to distinguish old profiles from new accounts
3. Staff listing shows: active authenticated staff, not legacy profiles
4. Data cleanup: Archive or delete old staff profile records

**Which phase:** Phase 1 (Migration) - Data schema transition

---

### Pitfall 14: Appointment Calendar Events Show Wrong Staff Names

**What goes wrong:** Calendar displays staff name from User.firstName, but after staff sets password, their profile updates name field, causing mismatch in historical appointments.

**Why it happens:**
- Appointment stores `staffId` foreign key but not staff name snapshot
- Staff name rendered by joining User table at query time
- Staff updates name → all past appointments show new name
- Historical reports now inaccurate: "John Smith" served appointment that "Jane Smith" actually did

**Prevention:**
1. Snapshot pattern: Store `staffName` on Appointment at creation time
2. Show: "Served by: John Smith (now Jane Smith)" if name changed
3. Audit trail: Track name changes with effectiveDate
4. Reports: Use name-at-time-of-service, not current name

**Which phase:** Phase 5 (Appointment Integration)

---

### Pitfall 15: Staff Deletion Breaks Foreign Key Constraints

**What goes wrong:** Owner tries to delete staff member who has appointments, commissions, and time-off records. Deletion fails due to foreign key constraints, or worse, cascades and deletes all related data.

**Why it happens:**
- User table has ON DELETE CASCADE for appointments
- Deleting staff deletes all their historical appointments
- OR foreign keys prevent deletion: "Cannot delete user with appointments"
- No soft-delete pattern for staff

**Prevention:**
1. Soft delete only: Set `isActive: false`, never hard delete staff
2. UI: "Deactivate Staff" not "Delete Staff"
3. Deactivation: Revoke access, hide from lists, preserve history
4. Anonymization: After X months, anonymize deactivated staff data
5. Foreign keys: Use `ON DELETE RESTRICT` to prevent cascades

**Which phase:** Phase 8 (Staff Management) - Deactivation workflow

---

## Phase-Specific Warnings

Mapping pitfalls to likely development phases and how to mitigate.

| Phase | Focus | Highest Risk Pitfall | Mitigation Strategy |
|-------|-------|---------------------|---------------------|
| **Phase 1: Authentication Setup** | Staff login, tokens, middleware | Dual auth path confusion (#1) | Add `portal` claim to JWT, create `authenticateStaff` middleware |
| **Phase 2: Data Visibility Rules** | What staff can see | Multi-tenant isolation weakening (#2), PII exposure (#3) | Mandatory dual-filter (staffId + salonId), explicit field selection |
| **Phase 3: Time Tracking & Earnings** | Schedule, commission calculation | Earnings race conditions (#4), commission rate retroactive (#8) | Wrap calculations in transactions, snapshot rates |
| **Phase 4: Permission System** | Feature gating, owner controls | Retroactive permission lag (#5) | Shorten token expiry, check permissions on each request |
| **Phase 5: Appointment Management** | Staff view/complete appointments | Appointment status confusion (#6), calendar name mismatch (#14) | Status state machine, snapshot staff name |
| **Phase 6: Time-Off Management** | Request/approve time-off | Concurrent double-booking (#10) | Cross-check appointments during approval |
| **Phase 7: Notification Integration** | Staff notifications | Notification spam (#11) | Batch bulk operations, rate limit notifications |
| **Phase 8: Staff Lifecycle** | Invite, deactivate, remove | Staff deletion breaking (#15) | Soft delete only, preserve history |

---

## Prevention Checklist

Actionable items to prevent pitfalls during staff portal development.

### Before Starting Development

- [ ] Audit all existing User queries for `salonId` filtering patterns
- [ ] Document which endpoints are public (booking widget) vs authenticated
- [ ] Map all owner portal routes that will need staff portal equivalents
- [ ] Review Prisma schema foreign key constraints (CASCADE vs RESTRICT)
- [ ] Identify PII fields that staff should NOT access

### During Authentication Implementation (Phase 1)

- [ ] Add `portal: 'staff' | 'owner'` claim to all JWTs
- [ ] Create separate `authenticateStaff` and `authenticateOwner` middleware
- [ ] Test: Staff token should 401 on owner routes and vice versa
- [ ] Shorten access token expiry to 1 hour max
- [ ] Implement session revocation table for permission changes

### During Data Visibility Implementation (Phase 2)

- [ ] Every staff query MUST include BOTH `staffId` AND `salonId` filters
- [ ] Create `StaffClientView` DTO with limited fields (no PII)
- [ ] Test with multi-tenant fixtures: Staff A cannot access Salon B data
- [ ] Add integration test: Staff from Salon 1 attempts to guess Salon 2 IDs
- [ ] Audit all Prisma `include` statements in staff routes

### During Earnings Implementation (Phase 3)

- [ ] Wrap all commission calculations in `prisma.$transaction`
- [ ] Snapshot `commissionRate` on CommissionRecord at creation
- [ ] Add unique constraint: `appointmentId` on CommissionRecord (prevent duplicates)
- [ ] Test concurrent appointment completion from owner + staff simultaneously
- [ ] Compare sum of commissions to sum of completed appointments (integrity check)

### During Appointment Integration (Phase 5)

- [ ] Implement appointment status state machine with validation
- [ ] Snapshot `staffName` on Appointment at creation time
- [ ] Add audit log for all status changes (who, when, old → new)
- [ ] Test: Owner and staff both mark same appointment complete (conflict resolution)
- [ ] Verify booking widget still works after staff auth changes

### Before Launch (Pre-Production)

- [ ] Run booking widget tests (public flow must work)
- [ ] Load test with 100+ concurrent staff logins
- [ ] Security audit: Attempt cross-tenant access with staff tokens
- [ ] Data integrity check: Commission totals match appointment sums
- [ ] Permission lag test: Change setting, verify immediate effect

---

## Testing Protocol for Staff Portal Integration

### Security Testing

**Multi-tenant isolation:**
```bash
# Create two salons with staff
POST /api/v1/staff-portal/invite (Salon A creates Staff A)
POST /api/v1/staff-portal/invite (Salon B creates Staff B)

# Attempt cross-tenant access
GET /api/v1/staff-portal/appointments?staffId={StaffB_ID}
Authorization: Bearer {StaffA_Token}
# Expected: 403 Forbidden or empty results (not Salon B data!)

# Attempt appointment access by guessing IDs
GET /api/v1/staff-portal/appointments/{SalonB_AppointmentID}
Authorization: Bearer {StaffA_Token}
# Expected: 404 Not Found (don't reveal existence of other salon's data)
```

**Permission enforcement:**
```bash
# Owner disables schedule editing
PATCH /api/v1/salons/{id}/settings { staffCanEditSchedule: false }

# Staff attempts to edit schedule (with existing valid token)
PUT /api/v1/staff-portal/my-schedule
Authorization: Bearer {ExistingStaffToken}
# Expected: 403 Forbidden (immediately enforced, not after token expiry)
```

### Race Condition Testing

**Concurrent appointment completion:**
```javascript
// Simulate owner and staff both clicking "Complete" at same time
const [ownerResponse, staffResponse] = await Promise.all([
  fetch('/api/v1/appointments/{id}/complete', {
    headers: { Authorization: `Bearer ${ownerToken}` }
  }),
  fetch('/api/v1/staff-portal/appointments/{id}/complete', {
    headers: { Authorization: `Bearer ${staffToken}` }
  })
]);

// Verify:
// 1. No duplicate CommissionRecord entries
// 2. Final commission amount is correct (not doubled or lost)
// 3. Both requests succeed or one gets 409 Conflict
```

### Data Integrity Testing

**Commission calculation accuracy:**
```sql
-- After week of staff activity, verify integrity
SELECT
  SUM(price) as total_services,
  SUM(commissionAmount) as total_commissions,
  (SUM(commissionAmount) / SUM(price)) as avg_rate
FROM Appointment a
JOIN CommissionRecord c ON c.appointmentId = a.id
WHERE a.status = 'completed'
  AND a.salonId = '{salonId}'
  AND a.staffId = '{staffId}';

-- avg_rate should match staff's commission rate (accounting for rate changes)
```

### Integration Testing

**Booking widget unaffected:**
```bash
# Public booking flow must work without authentication
GET /api/v1/public/salons/{slug}/staff
# Expected: 200 OK with staff list (no 401 Unauthorized)

GET /api/v1/public/staff/{id}/availability?date=2026-02-01
# Expected: 200 OK with availability (public data)

POST /api/v1/public/book
# Expected: 201 Created (client booking still works)
```

---

## Confidence Assessment

| Pitfall | Confidence | Source |
|---------|------------|--------|
| Dual authentication paths | HIGH | Multi-tenant SaaS security patterns, authentication regression findings from Microsoft 2026 patch issues |
| Multi-tenant isolation weakening | HIGH | Architectural analysis of Peacase codebase, multi-tenant security best practices (WorkOS, Permit.io) |
| Client PII exposure | HIGH | GDPR data minimization requirements, 2026 privacy compliance enforcement trends |
| Earnings race conditions | MEDIUM | Common patterns in time tracking systems, Peacase commission implementation analysis |
| Retroactive permission changes | HIGH | JWT stateless token limitations, session management best practices |
| Appointment status confusion | MEDIUM | Inferred from dual-portal access patterns, common in multi-actor systems |
| Time zone handling | MEDIUM | Multi-location architecture in Peacase, common timezone pitfall in scheduling systems |
| Commission rate retroactive | HIGH | Temporal data modeling patterns, payroll system best practices |
| Deleted client visibility | MEDIUM | Soft-delete pattern analysis, GDPR right-to-be-forgotten requirements |
| Concurrent time-off approval | MEDIUM | Workflow overlap pattern, inferred from Peacase time-off implementation |
| Staff notification spam | MEDIUM | Bulk operation patterns, common in notification systems |
| Breaking booking widget | HIGH | Critical integration point identified in Peacase architecture |
| Owner dashboard staff filter | MEDIUM | Migration complexity from authentication addition |
| Calendar name mismatch | LOW | Historical data consistency pattern, lower severity |
| Staff deletion breaking | HIGH | Foreign key constraint patterns, common in user deletion workflows |

---

## Sources

**Multi-Tenant Security & Authentication:**
- [The developer's guide to SaaS multi-tenant architecture — WorkOS](https://workos.com/blog/developers-guide-saas-multi-tenant-architecture)
- [SaaS Identity and Access Management Best Practices](https://www.loginradius.com/blog/engineering/saas-identity-access-management)
- [Architectural Considerations for Identity in a Multitenant Solution - Microsoft](https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/considerations/identity)
- [Best Practices for Multi-Tenant Authorization - Permit.io](https://www.permit.io/blog/best-practices-for-multi-tenant-authorization)
- [Tenant Infrastructure Risks in SaaS Platforms - FusionAuth](https://fusionauth.io/blog/multi-tenant-hijack-2)

**Role-Based Access Control (RBAC):**
- [6 Common Role Based Access Control (RBAC) Implementation Pitfalls](https://idenhaus.com/rbac-implementation-pitfalls/)
- [Role-Based Access Control Best Practices for 2026](https://www.techprescient.com/blogs/role-based-access-control-best-practices/)
- [10 RBAC Best Practices You Should Know in 2025](https://www.osohq.com/learn/rbac-best-practices)
- [The Challenges of Managing Permissions with RBAC - Crossid](https://www.crossid.io/academy/role-based-access-control-rbac-challenges)

**Salon Software Security:**
- [Tips To Remember Before Setting Salon Software Staff Access Levels - MioSalon](https://blog.miosalon.com/tips-to-remember-before-setting-salon-software-staff-access-levels/)
- [8 Salon Security Procedures To Avoid Information Breaches](https://salonbizsoftware.com/blog/salon-security-procedures/)
- [Salon and Spa Security Permissions and Access Software - Meevo](https://www.meevo.com/features/security)

**Data Isolation & Privacy:**
- [Tenant isolation in multi-tenant systems: What you need to know — WorkOS](https://workos.com/blog/tenant-isolation-in-multi-tenant-systems)
- [Architecting Secure Multi-Tenant Data Isolation | by Justin Hamade | Medium](https://medium.com/@justhamade/architecting-secure-multi-tenant-data-isolation-d8f36cb0d25e)
- [Tenant Data Isolation: Patterns and Anti-Patterns](https://propelius.ai/blogs/tenant-data-isolation-patterns-and-anti-patterns)
- [Data Privacy Day: Risks to Avoid in 2026](https://tenintel.com/data-privacy-day-risks-to-avoid-2026/)

**Time Tracking & Commission Calculation:**
- [Time Tracking for Payroll: Avoid Common Pitfalls and Errors](https://timeero.com/post/time-tracking-payroll)
- [Common Timesheet Errors and How to Avoid Them | QuickBooks](https://quickbooks.intuit.com/time-tracking/resources/avoiding-timesheet-errors/)
- [Commission Management for Salons and Spas - Yocale](https://www.yocale.com/blog/smarter-salon-payroll-transparent-commission-structures)
- [5 tips from our experts to solve commission calculation errors](https://commissionsblog.blitzrocks.com/tips-from-our-experts-to-solve-commission-calculation-errors)

**Data Migration & Retroactive Access:**
- [Data Migration Security Best Practices and Protocols](https://www.itconvergence.com/blog/security-protocols-in-database-migration/)
- [A Complete Data Migration Checklist For 2026 - Rivery](https://rivery.io/data-learning-center/complete-data-migration-checklist/)

**Concurrency & Race Conditions:**
- [Performance Regression in a React App: Investigation and Remediation](https://medium.com/hootsuite-engineering/performance-regression-in-a-react-app-investigation-and-remediation-strategies-24d9cbe6fdb3)
- Common patterns from Peacase codebase analysis
