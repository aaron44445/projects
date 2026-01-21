# Auth System Diagnostic Report

**Generated:** 2026-01-21
**Status:** DIAGNOSTIC ONLY - No fixes applied

---

## 1. WHAT AUTH SYSTEM(S) ARE INSTALLED?

### Answer: **Custom JWT Authentication (3 separate systems)**

| Auth Provider | Installed? | Evidence |
|--------------|-----------|----------|
| **NextAuth** | NO | No `next-auth` in package.json, no `[...nextauth]` route files |
| **Supabase Auth** | NO | No `@supabase/auth-helpers` imports, no `supabase.auth` calls |
| **Custom JWT** | YES | `jsonwebtoken` package, `jwt.sign`/`jwt.verify` calls in 15 files |

### Three Separate Auth Systems Exist:

1. **Owner/Admin/Staff Auth** (`/api/v1/auth/*`)
   - For salon owners, admins, managers, receptionists, staff
   - Uses `User` database table
   - localStorage keys: `peacase_access_token`, `peacase_refresh_token`

2. **Client Portal Auth** (`/api/v1/client-auth/*`)
   - For salon customers/clients who book appointments
   - Uses `Client` database table
   - localStorage keys: `client_access_token`, `client_refresh_token`

3. **Staff Portal Auth** (`/api/v1/staff-portal/auth/*`)
   - Separate login for staff-only dashboard
   - Uses `User` database table (same as #1)
   - localStorage keys: `peacase_staff_access_token`, `peacase_staff_refresh_token`

---

## 2. EVERY FILE THAT HANDLES AUTH

### Backend (API) Files:

| File | Purpose |
|------|---------|
| `apps/api/src/routes/auth.ts` | Owner/admin login, register, logout, refresh, password reset, email verification |
| `apps/api/src/routes/clientAuth.ts` | Client login, register, logout, refresh, password reset |
| `apps/api/src/routes/staffPortal.ts` | Staff login (/auth/login, /login), logout, refresh, /me endpoint |
| `apps/api/src/middleware/auth.ts` | JWT verification for User tokens |
| `apps/api/src/middleware/clientAuth.ts` | JWT verification for Client tokens |
| `apps/api/src/middleware/staffAuth.ts` | Authorization helpers (staffOnly, ownDataOnly) |
| `apps/api/src/middleware/rateLimit.ts` | Rate limiting configuration |
| `apps/api/src/lib/env.ts` | Environment variable loading (JWT_SECRET, etc.) |

### Frontend (Web) Files:

| File | Purpose |
|------|---------|
| `apps/web/src/contexts/AuthContext.tsx` | Owner/admin auth state, token refresh |
| `apps/web/src/contexts/ClientAuthContext.tsx` | Client auth state, token refresh |
| `apps/web/src/contexts/StaffAuthContext.tsx` | Staff auth state, token refresh |
| `apps/web/src/components/AuthGuard.tsx` | Route protection for owner/admin |
| `apps/web/src/components/StaffAuthGuard.tsx` | Route protection for staff portal |
| `apps/web/src/lib/api.ts` | API client with token handling |
| `apps/web/src/app/login/page.tsx` | Owner login page |
| `apps/web/src/app/signup/page.tsx` | Owner registration page |
| `apps/web/src/app/forgot-password/page.tsx` | Password reset request |
| `apps/web/src/app/reset-password/page.tsx` | Password reset completion |
| `apps/web/src/app/verify-email/page.tsx` | Email verification |
| `apps/web/src/app/staff/login/page.tsx` | Staff login page |
| `apps/web/src/hooks/useStaffAuth.ts` | Staff auth hook |

---

## 3. CURRENT TOKEN/SESSION SETTINGS

### Token Expiration Configuration:

| Token Type | Duration | Location |
|------------|----------|----------|
| **Access Token** | 7 days | `apps/api/src/routes/auth.ts:118` |
| **Refresh Token** | 30 days | `apps/api/src/routes/auth.ts:119` |
| **Email Verification** | 24 hours | `apps/api/src/routes/auth.ts:29` |
| **Password Reset** | 1 hour | `apps/api/src/routes/auth.ts:669` |
| **Staff Invite** | 7 days | `apps/api/src/routes/staffPortal.ts:100` |

### Frontend Token Refresh Settings:

| Setting | Value | Files |
|---------|-------|-------|
| Check Interval | 30 seconds | All 3 auth contexts |
| Refresh Threshold | 30 minutes before expiry | All 3 auth contexts |
| Visibility Change Handler | Yes | All 3 auth contexts |
| Multi-tab Sync | Yes (via storage events) | AuthContext only |

---

## 4. RATE LIMITING ON AUTH ROUTES

### Rate Limit Configuration (`apps/api/src/middleware/rateLimit.ts`):

| Limit Type | Window | Max Requests | Used On |
|------------|--------|--------------|---------|
| `authRateLimit` | 1 minute | 60 (prod), 1000 (dev) | Login, register, verify-email |
| `strictRateLimit` | 5 minutes | 20 (prod), 100 (dev) | Password reset, resend verification |
| `generalRateLimit` | 15 minutes | 2000 (prod), 10000 (dev) | All other routes |

### Special Behaviors:
- `skipSuccessfulRequests: true` - Only counts failed requests
- Test environment (`NODE_ENV=test`) - Rate limiting disabled
- Development environment - Higher limits

### Routes with Rate Limiting:

| Route | Rate Limiter |
|-------|--------------|
| `POST /api/v1/auth/register` | authRateLimit |
| `POST /api/v1/auth/login` | authRateLimit |
| `POST /api/v1/auth/verify-email` | authRateLimit |
| `POST /api/v1/auth/resend-verification` | strictRateLimit |
| `POST /api/v1/auth/forgot-password` | strictRateLimit |
| `POST /api/v1/auth/reset-password` | strictRateLimit |
| `POST /api/v1/client-auth/register` | authRateLimit |
| `POST /api/v1/client-auth/login` | authRateLimit |
| `POST /api/v1/client-auth/forgot-password` | authRateLimit |
| `POST /api/v1/client-auth/reset-password` | authRateLimit |
| `POST /api/v1/staff-portal/auth/login` | authRateLimit |
| `POST /api/v1/staff-portal/login` | authRateLimit |

---

## 5. ENVIRONMENT VARIABLES FOR AUTH

### Required Variables (`apps/api/src/lib/env.ts`):

| Variable | Required? | Default | Purpose |
|----------|-----------|---------|---------|
| `JWT_SECRET` | Yes (has fallback) | Random 32 bytes | Signs access tokens |
| `JWT_REFRESH_SECRET` | Yes (has fallback) | Random 32 bytes | Signs refresh tokens |
| `FRONTEND_URL` | Yes (has fallback) | `http://localhost:3000` | Email verification links |
| `CORS_ORIGIN` | Yes (has fallback) | `*` | CORS configuration |

### Current Values in `.env`:

```
JWT_SECRET=2a409182e99fc4b72ee7c8400d61a3c176e09b3c72ddad55cfe9292031eb4284
JWT_REFRESH_SECRET=f56756542957de79d4fc12941f1a26065ec6af986f95d210f2f51b3cf8b060d4
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

### POTENTIAL ISSUE: JWT Secret Fallback

**WARNING:** If `JWT_SECRET` is not set, the app generates a random secret on startup:
```typescript
JWT_SECRET: z.string().default(() => crypto.randomBytes(32).toString('hex'))
```

This means:
- If no JWT_SECRET is configured on production server, a random one is generated
- Tokens signed with one secret won't validate after server restart
- This could cause "Invalid token" errors after deployments

---

## 6. POTENTIAL AUTH CONFLICTS

### Conflicts Found: **NONE**

The three auth systems are cleanly isolated:

| Aspect | Owner/Admin | Client Portal | Staff Portal |
|--------|-------------|---------------|--------------|
| localStorage Keys | `peacase_*` | `client_*` | `peacase_staff_*` |
| Database Table | User | Client | User |
| Token Type Field | none | `type: 'client'` | none |
| Middleware | `authenticate` | `authenticateClient` | `authenticate` + `staffOnly` |
| API Path | `/api/v1/auth/*` | `/api/v1/client-auth/*` | `/api/v1/staff-portal/*` |

### Shared Resources (Not Conflicts):
- Same `JWT_SECRET` - OK because tokens have different payloads/types
- Same database connection - Expected
- Same `RefreshToken` table for User and Staff tokens - OK, both are User accounts

---

## 7. POTENTIAL ISSUES IDENTIFIED

### Issue 1: JWT Secret Auto-Generation
- **Severity:** HIGH (if on production)
- **Location:** `apps/api/src/lib/env.ts:16-17`
- **Problem:** Missing JWT_SECRET generates random key, causing token invalidation on restart
- **Impact:** Users see "Invalid token" after server restart

### Issue 2: Client Auth Uses Direct Fetch
- **Severity:** LOW
- **Location:** `apps/web/src/contexts/ClientAuthContext.tsx`
- **Problem:** Uses raw `fetch()` instead of the shared `api` client
- **Impact:** Inconsistent error handling, no automatic retry on 429

### Issue 3: Owner/Staff Tokens Share Same Structure
- **Severity:** LOW
- **Location:** Both use `{ userId, salonId, role }` payload
- **Problem:** A token from `/auth/login` could theoretically work on `/staff-portal/*`
- **Impact:** Minor - same user would have same permissions anyway

### Issue 4: No Token Cleanup Job
- **Severity:** LOW
- **Location:** RefreshToken table
- **Problem:** Expired tokens accumulate in database
- **Impact:** Database bloat over time

---

## 8. SUMMARY

### Auth System Status: FUNCTIONAL

**What Works:**
- JWT-based authentication with access + refresh tokens
- Token refresh (30 seconds check interval, 30 minute threshold)
- Rate limiting on auth endpoints (60 req/min)
- Multi-tab sync (logout propagates to other tabs)
- Visibility change refresh (token checked when returning to tab)
- Separate auth systems for owner/client/staff with no conflicts

**What Could Cause "Invalid or expired token" Errors:**
1. JWT_SECRET not set on production (generates random on restart)
2. Server restart invalidates all tokens if using generated secret
3. Token actually expired (unlikely with 7-day access tokens)

**What Could Cause "Too many requests" Errors:**
1. More than 60 failed login attempts in 1 minute (per IP)
2. More than 20 password reset attempts in 5 minutes (per IP)
3. In development: limits are much higher (1000 req/min)

**What Could Cause "Session expired" Errors:**
1. Refresh token expired (after 30 days)
2. Refresh token deleted from database (user logged out elsewhere)
3. Network error during token refresh

---

## RECOMMENDATION

Before attempting any fixes, verify on production:
1. Is `JWT_SECRET` explicitly set in production environment?
2. Is `JWT_REFRESH_SECRET` explicitly set in production environment?
3. Check server logs for token validation errors
4. Check if errors correlate with deployments/restarts
