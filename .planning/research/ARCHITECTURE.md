# Architecture Patterns: Audit Remediation Integration

**Project:** Peacase v2 Audit Remediation
**Researched:** 2026-01-28
**Confidence:** HIGH (based on existing codebase analysis)

## Executive Summary

This document defines HOW to safely integrate audit fixes into the existing Peacase v1 architecture without introducing regressions. The existing system is a shipped, working product with:

- Monorepo: `apps/api` (Express), `apps/web` (Next.js), `packages/*` (shared)
- Multi-tenant: All queries filter by `salonId`
- Auth: JWT with access/refresh tokens
- State: React Query (server), Zustand (client)
- Payments: Stripe webhooks

The key constraint: **Changes must be additive or surgical, never architectural.**

---

## Integration Points by Fix Category

### 1. Security Fixes (Tenant Isolation)

**Where Changes Go:**
- Route files: `apps/api/src/routes/*.ts`
- No middleware changes needed
- No schema changes needed

**Integration Pattern: Surgical WHERE Clause Updates**

```
BEFORE (vulnerable):
  prisma.appointment.update({
    where: { id: req.params.id }
  })

AFTER (isolated):
  prisma.appointment.update({
    where: { id: req.params.id, salonId: req.user.salonId }
  })
```

**Why This Is Safe:**
- Single-line change per operation
- No API contract change (same request/response)
- Fails closed: if salonId doesn't match, Prisma throws RecordNotFound
- Existing tests continue to pass (they use valid salonIds)

**Rollback Strategy:**
- Revert individual file via git
- Each route file is independent
- No database migration to reverse

**Testing Approach:**
- Run existing `tenant-isolation.test.ts` after each file change
- Add negative test cases for cross-tenant attempts
- Use `pnpm test:isolation` for targeted testing

---

### 2. Webhook Security Fixes

**Where Changes Go:**
- `apps/api/src/routes/webhooks.ts` (signature validation)
- `apps/api/src/services/subscriptions.ts` (metadata verification)
- `apps/api/src/routes/public.ts` (checkout session creation)

**Integration Pattern: Defense-in-Depth Layers**

```typescript
// Layer 1: Signature Validation (entry point)
const isValid = twilio.validateRequest(authToken, signature, url, body);
if (!isValid) return res.status(403).json({ error: 'Invalid signature' });

// Layer 2: Database Verification (before processing)
const existing = await prisma.subscription.findUnique({ where: { stripeSubscriptionId } });
if (metadataSalonId !== existing.salonId) {
  console.error('Metadata mismatch');
  return;
}

// Layer 3: Audit Logging (during processing)
console.log(`[Webhook] Processing ${event} for salon ${salonId}`);
```

**Why This Is Safe:**
- Additive checks don't break existing flow
- Invalid webhooks rejected early (no partial processing)
- Logging captures attack attempts for forensics

**Rollback Strategy:**
- Comment out validation checks (not recommended, but fast)
- Revert entire file to previous commit
- Stripe/Twilio continue sending webhooks regardless

**Testing Approach:**
- Mock webhook payloads with invalid signatures
- Mock payloads with mismatched metadata
- Verify existing valid webhooks still process

---

### 3. Public Endpoint Validation (staffId/locationId)

**Where Changes Go:**
- `apps/api/src/routes/public.ts` (booking, availability, payment intent)
- New helper: `apps/api/src/utils/validation.ts`

**Integration Pattern: Validation Before Processing**

```typescript
// Add validation AFTER salon lookup, BEFORE business logic
const salon = await prisma.salon.findUnique({ where: { slug } });

// NEW: Validate staffId belongs to salon
if (staffId) {
  const staff = await prisma.user.findFirst({
    where: { id: staffId, salonId: salon.id, isActive: true }
  });
  if (!staff) {
    return res.status(400).json({ error: 'INVALID_STAFF' });
  }
}

// Existing business logic continues unchanged
```

**Why This Is Safe:**
- Validation happens before any data modification
- 400 errors for invalid input (expected HTTP semantics)
- Legitimate booking widget always sends valid IDs
- No change to successful path behavior

**Rollback Strategy:**
- Remove validation blocks
- Revert to trusting widget-provided IDs (risky but fast)

**Testing Approach:**
- Test with staffId from wrong salon (expect 400)
- Test with valid staffId (expect 200)
- Load test to ensure no performance regression

---

### 4. Frontend Auth Consistency

**Where Changes Go:**
- `apps/web/src/contexts/*.tsx` (auth contexts)
- `apps/web/src/lib/api.ts` (API client)
- `apps/web/src/config/api.ts` (new centralized config)

**Integration Pattern: Centralize Then Migrate**

```
Step 1: Create centralized config (additive)
  apps/web/src/config/api.ts
  apps/web/src/types/auth.ts

Step 2: Update auth contexts to use config (one at a time)
  - AuthContext.tsx (owner)
  - ClientAuthContext.tsx
  - StaffAuthContext.tsx

Step 3: Migrate direct fetch calls to api client
  - Settings page
  - Portal pages
  - Staff profile
```

**Why This Is Safe:**
- Step 1 is purely additive (no existing code changes)
- Each context migration is independent
- Can test each auth flow after each migration
- localStorage keys change is atomic per context

**Rollback Strategy:**
- Keep old key fallback during migration:
  ```typescript
  const token = localStorage.getItem(NEW_KEY) || localStorage.getItem(OLD_KEY);
  ```
- Revert individual context files

**Testing Approach:**
- Manual login/logout test for each auth type
- Verify token persistence across refresh
- Check no regressions in booking widget

---

### 5. Performance Fixes (if any)

**Where Changes Go:**
- Query optimization in route handlers
- Index additions in Prisma schema

**Integration Pattern: Non-Breaking Optimization**

```
Database indexes:
  @@index([salonId, createdAt])  // Additive, no schema migration needed

Query optimization:
  - Add select() to reduce data transfer
  - Add pagination defaults
  - Add caching headers
```

**Why This Is Safe:**
- Indexes are always additive
- select() reduces response size but same shape
- Pagination with defaults maintains backward compatibility

**Rollback Strategy:**
- Remove index (Prisma handles gracefully)
- Revert query changes
- Remove caching headers

**Testing Approach:**
- Performance regression test (measure before/after)
- Verify response shape unchanged
- Test pagination edge cases

---

### 6. SEO & Accessibility Fixes

**Where Changes Go:**
- `apps/web/src/app/**/page.tsx` (metadata, semantic HTML)
- `apps/web/src/components/**` (ARIA attributes)

**Integration Pattern: Progressive Enhancement**

```typescript
// SEO: Add metadata export (Next.js App Router pattern)
export const metadata = {
  title: 'Page Title | Peacase',
  description: 'Page description',
};

// Accessibility: Add ARIA attributes
<button aria-label="Close dialog" aria-pressed={isOpen}>
```

**Why This Is Safe:**
- Metadata exports don't affect rendering
- ARIA attributes don't affect functionality
- Semantic HTML changes are visual only
- All changes are client-side, no API impact

**Rollback Strategy:**
- Revert individual component files
- Remove metadata exports

**Testing Approach:**
- Lighthouse accessibility audit
- Screen reader testing (VoiceOver/NVDA)
- SEO crawler validation

---

### 7. UI Standardization

**Where Changes Go:**
- `packages/ui/src/components/*` (shared components)
- `apps/web/src/components/*` (app-specific)

**Integration Pattern: Component-by-Component**

```
Priority Order:
1. Fix critical visibility issues (booking widget text)
2. Standardize spacing/colors (visual consistency)
3. Add missing states (loading, error, empty)
```

**Why This Is Safe:**
- UI changes don't affect data flow
- Each component is isolated
- Can A/B test if needed
- User flows unchanged

**Rollback Strategy:**
- Revert individual component files
- CSS changes are easily reversible

**Testing Approach:**
- Visual regression testing (if available)
- Manual cross-browser check
- Mobile responsiveness verification

---

## Dependency Order (What Must Be Fixed First)

```
Phase 1: Security Foundation (no dependencies)
  |-- 09-01: Prisma query safety (salonId on updates/deletes)
  |-- 09-02: Webhook security (signature validation)
  +-- 09-03: Public endpoint validation (staffId/locationId)

Phase 2: Auth Consistency (depends on Phase 1 testing infrastructure)
  +-- 09-04: Frontend token keys & API client

Phase 3: Test Coverage (depends on Phases 1-2)
  +-- 09-05: Tenant isolation & session persistence tests

Phase 4: Quality & Polish (independent, can run parallel)
  |-- Performance optimizations
  |-- SEO improvements
  |-- Accessibility fixes
  +-- UI standardization
```

**Rationale:**
1. Security fixes first because they're highest risk and independent
2. Auth consistency second because it builds on security
3. Tests third to lock in security guarantees
4. Quality fixes last because they're lower risk and independent

---

## Risk Assessment by Fix Category

| Category | Risk Level | Blast Radius | Rollback Time |
|----------|------------|--------------|---------------|
| Tenant isolation (09-01) | LOW | Single endpoint | < 5 min |
| Webhook security (09-02) | MEDIUM | All webhooks | < 5 min |
| Public validation (09-03) | LOW | Booking flow | < 5 min |
| Frontend auth (09-04) | MEDIUM | All auth flows | < 15 min |
| Test suite (09-05) | NONE | None (additive) | N/A |
| Performance | LOW | Affected queries | < 5 min |
| SEO/A11y | NONE | Visual only | < 5 min |
| UI fixes | LOW | Visual only | < 5 min |

---

## Testing Strategy by Category

### Unit Tests (Existing Infrastructure)

```bash
# Run after each security fix
pnpm --filter @peacase/api test

# Run tenant isolation tests specifically
pnpm --filter @peacase/api test:isolation

# Run after frontend changes
pnpm --filter @peacase/web test
```

### Integration Tests

The existing `tenant-isolation.test.ts` provides the template:

1. Create two salons (A and B)
2. Create resources for each
3. Attempt cross-tenant access with A's token to B's resources
4. Verify all attempts fail with 404

**New tests needed:**
- Webhook signature validation tests
- Token refresh flow tests
- Session persistence tests

### Manual Smoke Tests

After each phase deployment:

| Flow | What to Test |
|------|--------------|
| Owner login | Login, refresh page, still logged in |
| Client booking | Complete booking with payment |
| Staff portal | Login, view schedule, update profile |
| Webhook processing | Make real Stripe payment, verify data |

---

## File Change Patterns

### Safe Changes (Low Risk)

```
Adding to WHERE clause:
  where: { id } -> where: { id, salonId }

Adding validation block:
  if (condition) return res.status(400).json({...});

Adding middleware layer:
  router.use('/path', newMiddleware, existingHandler);

Adding new file:
  apps/api/src/utils/validation.ts
```

### Risky Changes (Require Extra Testing)

```
Changing middleware order:
  Must verify all protected routes still protected

Changing token storage keys:
  Must handle migration of existing sessions

Changing API response shape:
  Must verify frontend handles new shape
```

### Avoid These Changes

```
Changing database schema (unless absolutely necessary)
Changing API endpoint paths
Changing authentication flow fundamentals
Modifying Prisma client initialization
```

---

## Component Boundaries

| Component | Responsibility | Safe to Modify |
|-----------|---------------|----------------|
| Route handlers | Request/response + validation | YES |
| Middleware | Auth, rate limit, error handling | CAREFUL |
| Services | Business logic | CAREFUL |
| Prisma client | Database operations | NO |
| Auth contexts | Token management | CAREFUL |
| API client | HTTP requests | YES |
| UI components | Rendering | YES |

---

## Rollback Procedures

### Per-File Rollback (Most Common)

```bash
# Identify the commit before the change
git log --oneline apps/api/src/routes/appointments.ts

# Revert specific file
git checkout <commit>^ -- apps/api/src/routes/appointments.ts
git commit -m "Rollback appointments.ts to pre-fix state"
git push
```

### Per-Phase Rollback

```bash
# If entire phase needs rollback, revert all commits in phase
git revert --no-commit <commit1> <commit2> <commit3>
git commit -m "Rollback Phase 09-01: Prisma query safety"
git push
```

### Emergency Rollback (Full Revert)

```bash
# Revert to last known good state
git revert HEAD~n..HEAD --no-commit
git commit -m "Emergency rollback to pre-audit-fix state"
git push

# Trigger redeployment
```

---

## Monitoring During Rollout

### What to Watch

| Metric | Alert Threshold | Action |
|--------|-----------------|--------|
| 5xx error rate | > 1% | Pause rollout |
| 401 error spike | > 10% increase | Check auth changes |
| Booking success rate | < 95% | Check public endpoints |
| Webhook failure rate | > 5% | Check signature validation |

### Logging to Enable

```typescript
// Add to webhook handlers
console.log(`[Webhook] Event: ${event.type}, Salon: ${salonId}, Status: ${status}`);

// Add to security rejections
console.warn(`[Security] Tenant isolation blocked: ${attemptedSalonId} tried to access ${actualSalonId}`);
```

---

## Existing Infrastructure to Leverage

### Existing Test Suite

The codebase already has comprehensive testing infrastructure:

| Test Type | Location | Purpose |
|-----------|----------|---------|
| `tenant-isolation.test.ts` | `apps/api/src/__tests__/` | Two-salon cross-tenant access tests |
| `auth.test.ts` | `apps/api/src/__tests__/` | Authentication flow tests |
| `appointments.test.ts` | `apps/api/src/__tests__/` | Appointment CRUD with mocks |
| `booking-concurrency.test.ts` | `apps/api/src/__tests__/` | Race condition handling |
| `middleware.test.ts` | `apps/api/src/__tests__/` | Auth middleware behavior |

**Key insight:** The `tenant-isolation.test.ts` already exists and can be extended rather than built from scratch. Use `pnpm --filter @peacase/api test:isolation` to run these tests.

### Existing Test Helpers

From `apps/api/src/__tests__/helpers.ts`:

```typescript
// Already available:
createTestSalon(options)
createTestUser(salonId, options)
createTestClient(salonId)
createTestService(salonId)
createTestAppointment(salonId, clientId, staffId, serviceId)
generateTestTokens(userId, salonId, role)
authenticatedRequest(token)
```

These helpers enable rapid test creation for new security scenarios.

### Existing Auth Middleware

From `apps/api/src/middleware/auth.ts`:

```typescript
// Already extracts and validates:
req.user = {
  userId: string;
  salonId: string;
  role: string;
}
```

The `salonId` is always available on authenticated routes - just needs to be used in WHERE clauses.

### Existing Permissions System

From `apps/api/src/middleware/permissions.ts`:

```typescript
// Already available:
hasPermission(role, permission)
requirePermission(...permissions)
getUserLocationIds(userId, salonId, role)
hasLocationAccess(userId, salonId, role, locationId)
```

Location-based filtering infrastructure already exists - can be extended for staffId/locationId validation.

---

## Integration Checklist

For each fix plan execution, verify:

- [ ] Change is within safe patterns (see File Change Patterns above)
- [ ] Tests pass before and after change
- [ ] API contracts unchanged (same request/response shape)
- [ ] Error handling maintains existing patterns
- [ ] Logging added for security-relevant changes
- [ ] Rollback procedure documented and tested
- [ ] Manual smoke test completed

---

## Sources

- Existing codebase: `C:\projects\spa-final`
- Phase 9 plans: `.planning/phases/09-authentication-tenant-isolation/`
- Existing tests: `apps/api/src/__tests__/tenant-isolation.test.ts`
- Architecture docs: `.planning/codebase/ARCHITECTURE.md`
- Testing patterns: `.planning/codebase/TESTING.md`

**Confidence:** HIGH - Based on direct codebase analysis, existing patterns, and phase plans already created.

---

*Research completed: 2026-01-28*
