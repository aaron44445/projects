# Phase 19: Staff Authentication Foundation - Research

**Researched:** 2026-01-29
**Domain:** Multi-portal JWT authentication with magic link invites, role-based access control
**Confidence:** HIGH

## Summary

Staff authentication requires portal-specific JWT tokens with role claims, magic link email invites with short expiration windows, and defense-in-depth route protection. The existing codebase already implements owner authentication with bcryptjs (cost 12), JWT tokens (7-day access, 30-day refresh), and magic link flows for clients. Staff authentication follows identical patterns but adds portal type discrimination (`portalType: "staff"`) to prevent cross-portal access.

Key architectural decisions: (1) HttpOnly cookies for refresh tokens, in-memory for access tokens to prevent XSS; (2) Token rotation on every refresh to detect theft; (3) Middleware-first route protection with Data Access Layer verification; (4) Short-lived magic links (72 hours per requirements) with single-use invalidation; (5) Rate limiting at 5 attempts per 15 minutes for login endpoints.

**Primary recommendation:** Mirror existing owner auth patterns (`apps/api/src/routes/auth.ts`) with portal-specific claims and middleware rejection rules. All infrastructure exists—bcryptjs, JWT secrets, email service, rate limiting, withSalonId utility for tenant isolation.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| bcryptjs | 2.4.3 | Password hashing | Industry standard, auto-salting, adaptive cost factor (already in use) |
| jsonwebtoken | 9.0.3 | JWT generation/verification | De-facto Node.js JWT library, supports HS256 signing (already in use) |
| crypto (Node.js) | built-in | Token generation | Cryptographically secure random bytes for magic link tokens (already in use) |
| express-rate-limit | * | Request throttling | Prevents brute force attacks on login endpoints (already in use) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | 3.25.76 | Input validation | All request body validation - type-safe schemas (already in use) |
| zxcvbn | latest | Password strength | Optional - real-time strength meter on /staff/setup page (deferred to Claude's discretion) |
| @sendgrid/mail | * | Email delivery | Magic link invites - already configured via SMTP2GO fallback (already in use) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| bcryptjs | argon2 | Argon2 is newer/more secure but requires native binaries - bcryptjs is pure JS, easier deployment |
| HttpOnly cookies | LocalStorage | LocalStorage vulnerable to XSS attacks - cookies with HttpOnly flag are industry standard for 2026 |
| JWT rotation | Single refresh token | Non-rotating tokens create golden key problem if stolen - rotation enables reuse detection |

**Installation:**
```bash
# All libraries already installed - no new dependencies needed
npm install  # Verify existing packages
```

## Architecture Patterns

### Recommended Project Structure
```
apps/api/src/
├── routes/
│   ├── auth.ts                    # Owner authentication (existing pattern to mirror)
│   ├── staffAuth.ts               # NEW: Staff authentication endpoints
│   └── staffPortal.ts             # Staff portal routes (existing, needs auth)
├── middleware/
│   ├── auth.ts                    # JWT verification (existing)
│   ├── staffAuth.ts               # NEW: Staff portal middleware
│   └── rateLimit.ts               # Rate limiting configs (existing)
└── services/
    └── email.ts                   # Email templates (existing)

apps/web/src/app/
├── staff/
│   ├── login/page.tsx             # NEW: Staff login page
│   ├── setup/page.tsx             # NEW: Password setup via magic link
│   └── portal/                    # Protected staff portal routes
└── middleware.ts                  # Route protection (needs staff portal rules)
```

### Pattern 1: Portal-Specific JWT Claims

**What:** Add `portalType` and `role` claims to distinguish staff tokens from owner tokens

**When to use:** All staff authentication flows - login, token refresh, session verification

**Example:**
```typescript
// Source: Existing auth.ts pattern + RBAC research (https://www.permit.io/blog/how-to-use-jwts-for-authorization-best-practices-and-common-mistakes)
function generateStaffTokens(userId: string, salonId: string, role: string) {
  const accessToken = jwt.sign(
    {
      userId,
      salonId,
      role,                        // "staff" role
      portalType: "staff"          // Portal discrimination claim
    },
    env.JWT_SECRET,
    { expiresIn: '15m' }           // Short-lived access token
  );

  const refreshToken = jwt.sign(
    {
      userId,
      salonId,
      role,
      portalType: "staff",
      type: 'refresh'
    },
    env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' }           // Long-lived refresh (if remembered)
  );

  return { accessToken, refreshToken };
}
```

### Pattern 2: Magic Link Token Generation

**What:** Cryptographically secure single-use tokens with expiration

**When to use:** Staff invite flow, password reset flow

**Example:**
```typescript
// Source: Existing auth.ts pattern + Magic link security research (https://supertokens.com/blog/magiclinks)
async function createMagicLinkToken(userId: string, expiryHours: number) {
  // Generate 256-bit token (statistically impossible to brute force)
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

  // Hash token before storage (defense-in-depth - even if DB compromised, tokens are hashed)
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // Store hashed token with single-use flag
  await prisma.emailVerificationToken.create({
    data: {
      userId,
      token: tokenHash,  // Store hash, not plaintext
      expiresAt,
    },
  });

  return token;  // Return plaintext for email URL
}
```

### Pattern 3: Middleware Route Protection

**What:** Multi-layer authentication - middleware + route handler + data access layer

**When to use:** All staff portal routes

**Example:**
```typescript
// Source: Next.js App Router auth research (https://clerk.com/articles/complete-authentication-guide-for-nextjs-app-router)
// middleware.ts
export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Staff portal routes require staff token
  if (path.startsWith('/staff/portal')) {
    const token = req.cookies.get('staff_access_token');

    if (!token) {
      return NextResponse.redirect(new URL('/staff/login', req.url));
    }

    const decoded = jwt.verify(token.value, env.JWT_SECRET);

    // Portal type verification
    if (decoded.portalType !== 'staff') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  return NextResponse.next();
}

// API route handler (defense-in-depth)
router.get('/staff/appointments', authenticate, staffOnly, async (req, res) => {
  // authenticate: verifies JWT signature
  // staffOnly: verifies portalType === 'staff'
  // withSalonId: tenant isolation at data layer
  const appointments = await prisma.appointment.findMany(
    withSalonId(req.user.salonId, { where: { staffId: req.user.userId } })
  );
  res.json(appointments);
});
```

### Pattern 4: Refresh Token Rotation

**What:** Issue new refresh token on every refresh, invalidate old one

**When to use:** Token refresh endpoint

**Example:**
```typescript
// Source: Refresh token rotation research (https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation)
router.post('/staff/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  // Verify and lookup stored token
  const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  const storedToken = await prisma.refreshToken.findFirst({
    where: { token: refreshToken, userId: decoded.userId }
  });

  if (!storedToken) {
    // Token reuse detected - invalidate entire token family
    await prisma.refreshToken.deleteMany({
      where: { userId: decoded.userId }
    });
    return res.status(401).json({ error: 'Token reuse detected' });
  }

  // Generate new token pair
  const tokens = generateStaffTokens(decoded.userId, decoded.salonId, decoded.role);

  // Rotate: delete old, store new
  await prisma.refreshToken.delete({ where: { id: storedToken.id } });
  await prisma.refreshToken.create({
    data: {
      userId: decoded.userId,
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  res.json(tokens);
});
```

### Pattern 5: Rate Limiting Configuration

**What:** Endpoint-specific rate limits for authentication routes

**When to use:** All auth endpoints - stricter limits for login/password operations

**Example:**
```typescript
// Source: Express rate limiting research (https://betterstack.com/community/guides/scaling-nodejs/rate-limiting-express/)
import rateLimit from 'express-rate-limit';

// Strict limiter for login attempts
const staffLoginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 attempts per window
  message: 'Too many login attempts. Please try again in 15 minutes.',
  standardHeaders: true,      // Return rate limit info in headers
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
});

// Moderate limiter for magic link requests
const magicLinkRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 3,                     // 3 emails per hour
  message: 'Too many invite emails requested. Please try again later.',
});

// Apply to routes
router.post('/staff/login', staffLoginRateLimit, loginHandler);
router.post('/staff/request-invite', magicLinkRateLimit, inviteHandler);
```

### Anti-Patterns to Avoid

- **Storing JWT in localStorage:** Vulnerable to XSS attacks. Use HttpOnly cookies for refresh tokens, in-memory storage for access tokens. [Source](https://www.cyberchief.ai/2023/05/secure-jwt-token-storage.html)
- **Non-rotating refresh tokens:** Creates "golden key" problem if stolen. Always rotate on refresh to enable reuse detection. [Source](https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation)
- **Middleware-only protection:** Middleware can be bypassed via direct API calls. Implement defense-in-depth with route handler checks + Data Access Layer verification. [Source](https://clerk.com/articles/complete-authentication-guide-for-nextjs-app-router)
- **Embedding permissions in JWT:** Roles are OK (admin/staff), but specific permissions change frequently and create stale token problems. Pull permissions from database on each request. [Source](https://www.permit.io/blog/how-to-use-jwts-for-authorization-best-practices-and-common-mistakes)
- **Same tokens for different portals:** Owner and staff need separate tokens with `portalType` claim to prevent privilege escalation. [Source](https://medium.com/@QuantumCoder99/practical-guide-to-oauth2-jwt-authentication-and-role-based-access-control-security-best-93ba38cd4bf1)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password hashing | Custom hash function | bcryptjs with cost 12 | Auto-salting, adaptive cost factor, proven security - already in codebase |
| JWT signing | Custom token format | jsonwebtoken library | Industry standard, handles expiration/verification, well-tested - already in use |
| Random token generation | Math.random() | crypto.randomBytes(32) | Cryptographically secure randomness, 256-bit entropy - Math.random() is NOT cryptographically secure |
| Token storage | Session cookies | HttpOnly cookies + in-memory | Prevents XSS (HttpOnly flag) and provides refresh rotation support |
| Rate limiting | Manual tracking | express-rate-limit | Memory-efficient, supports distributed systems with Redis, handles edge cases - already configured |
| Password validation | Regex rules | Existing passwordSchema (Zod) | Already enforces 8 chars + letter + number, consistent with owner auth |
| Email delivery | Direct SMTP | sendEmail() service | Already handles SMTP2GO + SendGrid fallback, error logging, retries |
| Tenant isolation | Manual WHERE clauses | withSalonId() utility | Defense-in-depth pattern, type-safe, consistent across codebase |

**Key insight:** The existing codebase already solves 90% of authentication challenges. The primary implementation work is duplicating owner auth patterns with portal-specific claims and middleware rules. Do not reinvent password hashing, JWT generation, email delivery, or tenant isolation - reuse proven patterns.

## Common Pitfalls

### Pitfall 1: Cross-Portal Token Reuse

**What goes wrong:** Staff uses owner token to access owner routes, or vice versa

**Why it happens:** Middleware only checks role, not portalType claim

**How to avoid:**
```typescript
// Bad - only checks role
if (decoded.role !== 'staff') return 403;

// Good - checks both role AND portal type
if (decoded.role !== 'staff' || decoded.portalType !== 'staff') return 403;

// Even better - explicit portal verification middleware
export const staffPortalOnly = (req, res, next) => {
  if (req.user?.portalType !== 'staff') {
    return res.status(403).json({ error: 'Staff portal access required' });
  }
  next();
};
```

**Warning signs:** Staff can see owner dashboard, owner can access staff portal, 403 errors on legitimate access

### Pitfall 2: Magic Link Token Not Single-Use

**What goes wrong:** Magic link can be clicked multiple times or used after password set

**Why it happens:** Token not invalidated after first use

**How to avoid:**
```typescript
// Verify token and mark as used in single transaction
await prisma.$transaction(async (tx) => {
  const token = await tx.emailVerificationToken.findFirst({
    where: { tokenHash, expiresAt: { gt: new Date() }, used: false }
  });

  if (!token) throw new Error('Invalid or expired token');

  // Mark as used immediately
  await tx.emailVerificationToken.update({
    where: { id: token.id },
    data: { used: true }
  });

  // Set password
  await tx.user.update({
    where: { id: token.userId },
    data: { passwordHash: await bcrypt.hash(password, 12) }
  });
});
```

**Warning signs:** Same magic link works multiple times, security audit flags reusable tokens

### Pitfall 3: Bcrypt Cost Too Low

**What goes wrong:** Passwords crackable with modern GPU hardware

**Why it happens:** Default bcrypt cost (10) is too low for 2026 security standards

**How to avoid:**
- Use cost factor 12 (already implemented in owner auth)
- Takes ~300ms per hash - acceptable for auth operations
- OWASP 2026 recommendation: 10-14 depending on hardware [Source](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

```typescript
// Already correct in codebase
const passwordHash = await bcrypt.hash(password, 12);
```

**Warning signs:** Hash computation takes < 100ms, security audit flags weak cost factor

### Pitfall 4: Token Expiry Too Long

**What goes wrong:** Stolen access token usable for extended period

**Why it happens:** Convenience prioritized over security (7-day access tokens)

**How to avoid:**
- Access tokens: 15 minutes (requirement per CONTEXT.md)
- Refresh tokens: 30 days (when "remember me" checked)
- Session tokens (no remember): 24 hours

```typescript
// Current owner pattern - 7 days (too long for staff)
const ACCESS_TOKEN_EXPIRY = '7d';

// Staff pattern - 15 minutes (per requirements)
const STAFF_ACCESS_TOKEN_EXPIRY = '15m';
const STAFF_REFRESH_TOKEN_EXPIRY = '30d';  // When remembered
const STAFF_SESSION_TOKEN_EXPIRY = '24h';  // Default (browser close)
```

**Warning signs:** Stolen token usable for days after theft, compliance audit flags long-lived tokens

### Pitfall 5: Rate Limiting Not IP-Based

**What goes wrong:** Attacker rotates accounts/emails to bypass rate limits

**Why it happens:** Rate limiting by user email, not IP address

**How to avoid:**
```typescript
// express-rate-limit defaults to IP-based (correct)
const staffLoginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  // keyGenerator defaults to req.ip - DO NOT override to req.body.email
});

// For distributed systems (multiple API instances)
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redisClient = new Redis(process.env.REDIS_URL);

const distributedRateLimit = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:staff-login:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 5,
});
```

**Warning signs:** Brute force attacks bypass limits by using different emails, rate limit ineffective

## Code Examples

Verified patterns from official sources:

### Staff Login Flow (Complete)

```typescript
// Source: Adapted from existing apps/api/src/routes/auth.ts
router.post('/staff/login', staffLoginRateLimit, asyncHandler(async (req, res) => {
  const { email, password, rememberMe } = loginSchema.parse(req.body);

  // Find staff user
  const user = await prisma.user.findFirst({
    where: {
      email: email.toLowerCase().trim(),
      isActive: true,
      role: 'staff'  // Only staff role allowed
    },
    include: { salon: true },
  });

  if (!user || !user.passwordHash) {
    // Track failed attempt
    if (user) {
      await prisma.loginHistory.create({
        data: { userId: user.id, success: false, failReason: 'Invalid password' }
      });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    await prisma.loginHistory.create({
      data: { userId: user.id, success: false, failReason: 'Invalid password' }
    });
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate portal-specific tokens
  const tokens = generateStaffTokens(user.id, user.salonId, user.role);

  // Store refresh token (30 days if remembered, 24h otherwise)
  const refreshExpiry = rememberMe
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    : new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: refreshExpiry,
    },
  });

  // Track successful login
  await prisma.loginHistory.create({
    data: { userId: user.id, success: true }
  });

  // Set HttpOnly cookie for refresh token
  res.cookie('staff_refresh_token', tokens.refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: refreshExpiry.getTime() - Date.now(),
  });

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      salon: {
        id: user.salon.id,
        name: user.salon.name,
      },
      accessToken: tokens.accessToken,
    },
  });
}));
```

### Magic Link Invite Email

```typescript
// Source: Adapted from existing email.ts patterns
export function staffInviteEmail(data: {
  staffName: string;
  salonName: string;
  magicLinkUrl: string;
  expiresInHours: number;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Welcome to ${data.salonName} Staff Portal</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 520px; margin: 40px auto; background: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #5A8A5B 0%, #7BA37C 100%); padding: 36px 40px; text-align: center;">
          <h1 style="margin: 0; font-size: 26px; color: #FFFFFF;">Welcome to the Team!</h1>
          <p style="margin: 8px 0 0 0; font-size: 13px; color: rgba(255, 255, 255, 0.85);">${data.salonName}</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px;">
          <p style="margin: 0 0 24px 0; font-size: 15px; color: #666666;">Hi ${data.staffName},</p>
          <p style="margin: 0 0 28px 0; font-size: 15px; line-height: 1.6; color: #666666;">
            You've been invited to join the ${data.salonName} staff portal. Click the button below to set your password and access your account.
          </p>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${data.magicLinkUrl}" style="display: inline-block; padding: 16px 40px; font-size: 15px; font-weight: 600; color: #FFFFFF; background: linear-gradient(135deg, #5A8A5B 0%, #7BA37C 100%); text-decoration: none; border-radius: 10px; box-shadow: 0 4px 14px rgba(90, 138, 91, 0.35);">
              Set Up Your Account &rarr;
            </a>
          </div>

          <!-- Expiry Warning -->
          <div style="background: #FEF8F3; border-radius: 10px; padding: 18px 20px; border-left: 4px solid #E8A87C; margin-top: 32px;">
            <p style="margin: 0; font-size: 14px; font-weight: 600; color: #2C2C2C;">
              &#9200; This link expires in ${data.expiresInHours} hours
            </p>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #888888;">
              If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>

          <!-- Fallback Link -->
          <p style="margin: 28px 0 0 0; font-size: 13px; color: #999999;">
            If the button doesn't work, copy and paste this link:
          </p>
          <p style="margin: 8px 0 0 0; padding: 12px 14px; background: #F8F7F5; border-radius: 8px; font-size: 12px; color: #7BA37C; word-break: break-all; font-family: monospace;">
            ${data.magicLinkUrl}
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #FAFAF8; padding: 24px 40px; border-top: 1px solid #EEEEE9; text-align: center;">
          <p style="margin: 0; font-size: 13px; color: #999999;">
            Sent by <strong style="color: #7BA37C;">Peacase</strong>
          </p>
          <p style="margin: 8px 0 0 0; font-size: 11px; color: #BBBBBB;">
            This is an automated message. Please do not reply.
          </p>
        </div>

      </div>
    </body>
    </html>
  `;
}
```

### Staff Portal Middleware (Next.js)

```typescript
// Source: Next.js App Router auth patterns (https://nextjs.org/docs/app/guides/authentication)
// apps/web/src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Staff portal protection
  if (path.startsWith('/staff/portal')) {
    const accessToken = request.cookies.get('staff_access_token')?.value;

    if (!accessToken) {
      return NextResponse.redirect(new URL('/staff/login', request.url));
    }

    try {
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET!) as {
        userId: string;
        salonId: string;
        role: string;
        portalType: string;
      };

      // Verify portal type AND role
      if (decoded.portalType !== 'staff' || decoded.role !== 'staff') {
        return NextResponse.json(
          { error: 'Forbidden - Staff access required' },
          { status: 403 }
        );
      }

      // Add user context to headers for server components
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', decoded.userId);
      requestHeaders.set('x-salon-id', decoded.salonId);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      // Token expired or invalid
      return NextResponse.redirect(new URL('/staff/login', request.url));
    }
  }

  // Owner portal protection - reject staff tokens
  if (path.startsWith('/dashboard')) {
    const accessToken = request.cookies.get('access_token')?.value;

    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET!) as any;

        // Reject staff tokens on owner routes
        if (decoded.portalType === 'staff') {
          return NextResponse.json(
            { error: 'Forbidden - Owner access required' },
            { status: 403 }
          );
        }
      } catch {
        // Let authenticate middleware handle invalid tokens
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/staff/portal/:path*', '/dashboard/:path*'],
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| LocalStorage for JWTs | HttpOnly cookies for refresh, in-memory for access | 2024-2025 | Prevents XSS token theft - industry consensus [Source](https://www.cyberchief.ai/2023/05/secure-jwt-token-storage.html) |
| Single refresh token | Token rotation on every refresh | 2023-2024 | Enables theft detection via reuse tracking [Source](https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation) |
| Middleware-only auth | Defense-in-depth (middleware + route + data layer) | 2025 | Critical: Next.js vulnerability CVE-2025 required multi-layer approach [Source](https://clerk.com/articles/complete-authentication-guide-for-nextjs-app-router) |
| Bcrypt cost 10 | Cost 12-14 | 2025-2026 | OWASP recommendation - hardware advances require higher cost [Source](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) |
| Generic JWT claims | Portal-specific claims (portalType) | Emerging 2026 | Prevents cross-portal token reuse in multi-tenant SaaS [Source](https://medium.com/@QuantumCoder99/practical-guide-to-oauth2-jwt-authentication-and-role-based-access-control-security-best-93ba38cd4bf1) |

**Deprecated/outdated:**
- **LocalStorage for tokens:** Vulnerable to XSS - use HttpOnly cookies (OWASP 2026 guidance)
- **Non-rotating refresh tokens:** Creates "golden key" problem - always rotate [Source](https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation)
- **Same tokens for multiple portals:** Security risk - use portal-specific claims
- **Long-lived access tokens (7+ days):** Excessive exposure window - use short-lived (15m) with refresh rotation

## Open Questions

Things that couldn't be fully resolved:

1. **Password strength meter implementation**
   - What we know: zxcvbn provides realistic strength estimation, already used by Dropbox/1Password [Source](https://dropbox.tech/security/zxcvbn-realistic-password-strength-estimation)
   - What's unclear: Whether to implement real-time client-side meter or server-side validation only
   - Recommendation: Start with server-side validation (existing passwordSchema), add client-side zxcvbn meter if users struggle with password requirements (Claude's discretion per CONTEXT.md)

2. **Token storage in Next.js client components**
   - What we know: HttpOnly cookies prevent XSS, but client components need access token for API calls
   - What's unclear: Store access token in React Context/Zustand or retrieve from API on every request
   - Recommendation: Store access token in Zustand (in-memory), refresh token in HttpOnly cookie - standard pattern for Next.js App Router [Source](https://clerk.com/articles/complete-authentication-guide-for-nextjs-app-router)

3. **Redis for distributed rate limiting**
   - What we know: Single API instance can use in-memory rate limiting (express-rate-limit default)
   - What's unclear: Whether Render deployment uses multiple instances
   - Recommendation: Start with in-memory (already working), migrate to Redis if distributed system needed (Render scaling tier determines this)

## Sources

### Primary (HIGH confidence)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) - Password hashing, bcrypt cost factors
- [Auth0 Refresh Token Rotation](https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation) - Token rotation security patterns
- [Next.js Authentication Guide](https://nextjs.org/docs/app/guides/authentication) - App Router auth patterns
- [Clerk Complete Authentication Guide for Next.js App Router](https://clerk.com/articles/complete-authentication-guide-for-nextjs-app-router) - Defense-in-depth strategies, 2025 best practices
- [SuperTokens Magic Links Guide](https://supertokens.com/blog/magiclinks) - Magic link security, token generation
- [Permit.io JWT Authorization Best Practices](https://www.permit.io/blog/how-to-use-jwts-for-authorization-best-practices-and-common-mistakes) - JWT claims, RBAC patterns
- [Cyber Chief JWT Token Storage](https://www.cyberchief.ai/2023/05/secure-jwt-token-storage.html) - LocalStorage vs HttpOnly cookies
- [Better Stack Express Rate Limiting](https://betterstack.com/community/guides/scaling-nodejs/rate-limiting-express/) - Authentication endpoint rate limiting
- [Dropbox zxcvbn](https://dropbox.tech/security/zxcvbn-realistic-password-strength-estimation) - Password strength estimation

### Secondary (MEDIUM confidence)
- [Medium: Practical Guide to OAuth2, JWT Authentication, RBAC](https://medium.com/@QuantumCoder99/practical-guide-to-oauth2-jwt-authentication-and-role-based-access-control-security-best-93ba38cd4bf1) - Portal-specific token patterns
- [Clerk Magic Links](https://clerk.com/blog/magic-links) - Magic link authentication flows
- [LogRocket bcrypt Guide](https://blog.logrocket.com/password-hashing-node-js-bcrypt/) - bcryptjs implementation patterns
- Existing codebase patterns (apps/api/src/routes/auth.ts, middleware/auth.ts, services/email.ts) - Proven implementation in production

### Tertiary (LOW confidence)
- None - all findings verified with official documentation or proven codebase patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use, proven in production
- Architecture: HIGH - Patterns directly mirror existing owner auth, verified with official Next.js docs
- Pitfalls: HIGH - Documented in OWASP, Auth0, and Next.js security advisories

**Research date:** 2026-01-29
**Valid until:** 90 days (stable auth patterns - bcrypt, JWT, HTTP standards don't change frequently)

---

**Next step:** Planner consumes this research to create PLAN.md with concrete implementation tasks mirroring existing auth patterns with portal-specific modifications.
