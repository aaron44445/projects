# Authentication Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix login/signup errors by adding missing `/users/me` endpoint and ensuring frontend/backend data alignment.

**Architecture:** Add a new authenticated endpoint `GET /users/me` that returns the current user from the JWT token. Verify Zod schemas match frontend form data.

**Tech Stack:** Express.js, Prisma, Zod, React Context

---

## Root Cause Summary

| Error | Cause | Fix |
|-------|-------|-----|
| "Cannot read properties of undefined (reading 'user')" | Frontend calls `GET /users/me` which doesn't exist | Add `/users/me` endpoint to users.ts |
| "Invalid input data" | Zod validation mismatch between frontend form and API schema | Verify field alignment |

---

### Task 1: Add GET /users/me Endpoint

**Files:**
- Modify: `apps/api/src/routes/users.ts` (add before line 11)

**Step 1: Add the /me endpoint before the /:id route**

The endpoint must be placed BEFORE `/:id` to avoid route conflicts (Express matches routes in order).

```typescript
// ============================================
// GET /api/v1/users/me
// Get current authenticated user
// ============================================
router.get('/me', authenticate, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      avatarUrl: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'User not found',
      },
    });
  }

  res.json({
    success: true,
    data: user,
  });
});
```

**Step 2: Verify the endpoint works**

Run: `curl -X GET http://localhost:3001/api/v1/users/me -H "Authorization: Bearer <token>"`

Expected: Returns user data or 401 if no token

**Step 3: Commit**

```bash
git add apps/api/src/routes/users.ts
git commit -m "feat(api): add GET /users/me endpoint for current user"
```

---

### Task 2: Verify Frontend AuthContext Field Mapping

**Files:**
- Read: `apps/web/src/contexts/AuthContext.tsx`

**Step 1: Check User interface matches API response**

Frontend User interface (AuthContext.tsx lines 7-17):
```typescript
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'owner' | 'admin' | 'staff';
  avatar?: string;        // ← API returns 'avatarUrl', not 'avatar'
  phone?: string;
  emailVerified?: boolean;
  createdAt: string;
}
```

**Step 2: Fix avatar field name mismatch**

The API returns `avatarUrl` but frontend expects `avatar`. Update the interface:

Modify: `apps/web/src/contexts/AuthContext.tsx` line 13

```typescript
  avatarUrl?: string;  // Changed from 'avatar' to match API
```

**Step 3: Commit**

```bash
git add apps/web/src/contexts/AuthContext.tsx
git commit -m "fix(web): align User.avatarUrl field with API response"
```

---

### Task 3: Verify Login/Register Form Data Alignment

**Files:**
- Read: `apps/api/src/routes/auth.ts` (lines 61-72)
- Read: `apps/web/src/app/signup/page.tsx`
- Read: `apps/web/src/app/login/page.tsx`

**Step 1: Compare signup form fields with registerSchema**

API registerSchema:
```typescript
const registerSchema = z.object({
  salonName: z.string().min(2),   // Required
  email: z.string().email(),       // Required
  password: z.string().min(8),     // Required
  phone: z.string().optional(),    // Optional
  timezone: z.string().optional(), // Optional
});
```

Verify frontend sends exactly these field names.

**Step 2: Compare login form fields with loginSchema**

API loginSchema:
```typescript
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
```

Verify frontend sends exactly these field names.

**Step 3: Check for empty string vs undefined**

Common issue: frontend sends `""` for optional fields instead of omitting them. Zod may reject empty strings.

If found, update frontend to omit empty optional fields or update Zod schema to transform empty strings.

---

### Task 4: Test Complete Auth Flow

**Step 1: Start the API server**

Run: `pnpm --filter @peacase/api dev`

**Step 2: Start the web server**

Run: `pnpm --filter @peacase/web dev`

**Step 3: Test signup flow**

1. Navigate to http://localhost:3000/signup
2. Fill in: Salon Name, Email, Phone, Password, Confirm Password
3. Submit form
4. Verify: No "Invalid input data" error
5. Verify: Redirects to dashboard or verification page

**Step 4: Test login flow**

1. Navigate to http://localhost:3000/login
2. Fill in: Email, Password
3. Submit form
4. Verify: No "Cannot read properties of undefined (reading 'user')" error
5. Verify: Redirects to dashboard

**Step 5: Commit if any fixes made**

```bash
git add -A
git commit -m "fix(auth): complete auth flow fixes"
```

---

## Verification Checklist

- [ ] `GET /users/me` endpoint exists and returns authenticated user
- [ ] User interface `avatarUrl` field matches API
- [ ] Signup form sends correct field names matching registerSchema
- [ ] Login form sends correct field names matching loginSchema
- [ ] No "Invalid input data" errors on signup
- [ ] No "Cannot read properties of undefined (reading 'user')" errors on login
- [ ] Full auth flow works: signup → verify email (if required) → login → dashboard
