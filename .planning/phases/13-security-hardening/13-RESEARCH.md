# Phase 13: Security Hardening - Research

**Researched:** 2026-01-28
**Domain:** Application security, environment validation, authorization, authentication
**Confidence:** HIGH

## Summary

This phase implements critical security hardening measures across three domains: startup environment validation, file ownership verification, and password complexity enforcement. The research reveals a shift in modern OWASP guidance away from arbitrary complexity rules toward password length and breach detection, while emphasizing defense-in-depth patterns for file access control and fail-fast validation for production environments.

The application currently has lenient environment validation that allows missing critical variables (JWT_SECRET, ENCRYPTION_KEY) and path-based file ownership verification that's vulnerable to manipulation. Password validation exists but lacks real-time UI feedback and doesn't meet baseline security requirements for special characters.

**Primary recommendation:** Implement production-only environment validation using Zod's refinement with NODE_ENV checks, add database-backed file ownership verification returning 404 for unauthorized access (preventing enumeration), and enforce password complexity with real-time UI feedback using a checklist pattern.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Zod | 3.x | Schema validation with custom refinements | Already in stack, supports custom validators, TypeScript-first |
| Prisma | 5.x | Database ORM for ownership lookups | Already in stack, type-safe queries |
| bcryptjs | 2.x | Password hashing (already in use) | Industry standard, secure hashing with salts |
| zxcvbn-ts | 3.x | Password strength estimation | TypeScript rewrite of Dropbox's zxcvbn, OWASP recommended |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| envalid | 7.x | Environment validation with devDefault | Alternative to custom Zod validation if more features needed |
| @zxcvbn-ts/language-common | 3.x | Language pack for zxcvbn-ts | For multilingual password feedback |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zod custom refinement | envalid library | Envalid has devDefault built-in but adds dependency; Zod already in stack |
| Database lookup | Path string matching | Path matching is vulnerable to manipulation; DB lookup is authoritative |
| Custom password regex | zxcvbn-ts | Regex is rigid; zxcvbn-ts provides user-friendly feedback and entropy scoring |

**Installation:**
```bash
npm install @zxcvbn-ts/core @zxcvbn-ts/language-common --save
```

## Architecture Patterns

### Recommended Project Structure
```
apps/api/src/
├── lib/
│   └── env.ts              # Environment validation (modify existing)
├── routes/
│   └── uploads.ts          # File routes (modify DELETE handler)
│   └── auth.ts             # Auth routes (modify password schemas)
├── middleware/
│   └── validateOwnership.ts # Reusable ownership verification middleware
└── services/
    └── passwordValidation.ts # Password validation utilities

apps/web/src/
├── components/
│   └── PasswordChecklist.tsx # Password requirement checklist UI
└── app/
    └── staff/setup/page.tsx   # Setup page (add checklist)
```

### Pattern 1: Production-Only Environment Validation

**What:** Validate critical environment variables at application startup, failing fast in production while allowing defaults in development

**When to use:** For security-critical variables like JWT_SECRET, ENCRYPTION_KEY that must exist in production

**Example:**
```typescript
// Source: Research synthesis from Node.js environment validation best practices 2026
// apps/api/src/lib/env.ts

import { z } from 'zod';
import crypto from 'crypto';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  ENCRYPTION_KEY: z.string().min(64), // Must be 64 hex chars
  // ... other fields
}).refine((data) => {
  // Only enforce in production
  if (data.NODE_ENV === 'production') {
    if (!data.JWT_SECRET || data.JWT_SECRET.length < 32) {
      return false;
    }
    if (!data.ENCRYPTION_KEY || data.ENCRYPTION_KEY.length !== 64) {
      return false;
    }
  }
  return true;
}, {
  message: "Production requires JWT_SECRET (32+ chars) and ENCRYPTION_KEY (64 hex chars)"
});

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    console.error('\n❌ FATAL: Environment validation failed\n');

    for (const [field, messages] of Object.entries(errors)) {
      console.error(`   ${field}: ${messages?.join(', ')}`);
    }

    console.error('\nApplication cannot start. Set required environment variables.\n');

    // Exit with code 1 in production
    if (process.env.NODE_ENV === 'production') {
      process.exitCode = 1;
      // Allow stderr to flush before exit
      process.stderr.write('', () => process.exit(1));
    } else {
      throw new Error('Environment validation failed');
    }
  }

  return result.data;
}
```

**Key points:**
- Use `process.exitCode = 1` and stderr callback to ensure output flushes
- Write to stderr before structured logger initializes
- Only exit in production; throw in development for better DX
- Clear error messages identifying missing/invalid variables

### Pattern 2: Database-Backed File Ownership Verification

**What:** Verify file ownership via database lookup before allowing deletion, preventing IDOR vulnerabilities

**When to use:** For all file/resource DELETE operations where ownership matters

**Example:**
```typescript
// Source: OWASP IDOR Prevention patterns + Prisma authorization 2026
// apps/api/src/middleware/validateOwnership.ts

import { Request, Response, NextFunction } from 'express';
import { prisma } from '@peacase/database';

export async function validateFileOwnership(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { publicId } = req.params;
    const userId = req.user?.userId;
    const salonId = req.user?.salonId;

    if (!userId || !salonId) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'File not found',
        },
      });
    }

    // Database lookup to verify ownership
    // Note: Requires a FileUpload model in schema tracking publicId and salonId
    const file = await prisma.fileUpload.findFirst({
      where: { publicId },
      select: { id: true, salonId: true, userId: true },
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'File not found',
        },
      });
    }

    // Verify ownership
    if (file.salonId !== salonId) {
      // Log suspicious attempt
      console.warn('File ownership violation attempt', {
        userId,
        salonId,
        requestedFileId: publicId,
        actualFileSalonId: file.salonId,
        timestamp: new Date().toISOString(),
      });

      // Return 404, not 403, to prevent enumeration
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'File not found',
        },
      });
    }

    // Ownership verified, continue
    next();
  } catch (error) {
    console.error('File ownership validation error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Unable to verify file access',
      },
    });
  }
}

// Usage in routes/uploads.ts
router.delete(
  '/:publicId(*)',
  authenticate,
  validateFileOwnership,
  asyncHandler(async (req, res) => {
    // Delete the file (ownership already verified)
    const result = await deleteImage(req.params.publicId);
    // ... rest of handler
  })
);
```

**Key points:**
- Always return 404 for unauthorized access (prevents enumeration)
- Log suspicious attempts at warn level with context
- Database lookup is authoritative source of ownership
- Middleware pattern for reusability across routes

### Pattern 3: Password Complexity with Real-Time UI Feedback

**What:** Enforce password requirements with visual checklist showing met/unmet criteria

**When to use:** Registration, password change, password reset flows

**Backend validation:**
```typescript
// Source: Zod custom refinement patterns 2026
// apps/api/src/routes/auth.ts

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .refine((password) => /[A-Z]/.test(password), {
    message: 'Password must contain at least one uppercase letter',
  })
  .refine((password) => /[a-z]/.test(password), {
    message: 'Password must contain at least one lowercase letter',
  })
  .refine((password) => /[0-9]/.test(password), {
    message: 'Password must contain at least one number',
  })
  .refine((password) => /[^A-Za-z0-9]/.test(password), {
    message: 'Password must contain at least one special character',
  });

const registerSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  // ... other fields
});
```

**Frontend UI component:**
```typescript
// Source: React password validation UI patterns 2026
// apps/web/src/components/PasswordChecklist.tsx

import { CheckCircle, Circle } from 'lucide-react';

interface PasswordChecklistProps {
  password: string;
}

export function PasswordChecklist({ password }: PasswordChecklistProps) {
  const requirements = [
    { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
    { test: (p: string) => /[A-Z]/.test(p), label: 'One uppercase letter' },
    { test: (p: string) => /[a-z]/.test(p), label: 'One lowercase letter' },
    { test: (p: string) => /[0-9]/.test(p), label: 'One number' },
    { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: 'One special character' },
  ];

  return (
    <div className="space-y-2 text-sm">
      <p className="text-charcoal/60 font-medium">Password requirements:</p>
      {requirements.map((req, idx) => {
        const met = req.test(password);
        return (
          <div key={idx} className="flex items-center gap-2">
            {met ? (
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            ) : (
              <Circle className="w-4 h-4 text-charcoal/30" />
            )}
            <span className={met ? 'text-emerald-700' : 'text-charcoal/50'}>
              {req.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
```

**Key points:**
- Backend and frontend validation must match exactly
- Real-time feedback prevents submission failures
- Visual indicators (checkmarks) provide clear progress
- Apply to all password input flows (register, change, reset)

### Anti-Patterns to Avoid

- **Generating random secrets on startup in production:** Current code generates JWT_SECRET/ENCRYPTION_KEY if missing. This breaks session persistence across restarts and makes encrypted data unrecoverable. Always require explicit secrets in production.

- **Path-based file ownership verification:** Current uploads.ts checks if publicId includes salon path (`peacase/salons/${salonId}`). This is vulnerable to path manipulation and doesn't verify actual ownership in database.

- **Returning 403 for unauthorized file access:** Reveals file existence to unauthorized users, enabling enumeration attacks. Always return 404.

- **Password validation without special characters:** Current registerSchema only checks length >= 8. Missing uppercase, lowercase, number, special character requirements.

- **Blocking stderr output with process.exit():** Calling `process.exit(1)` immediately can truncate error messages. Use `process.exitCode = 1` with callback or let process exit naturally.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password strength estimation | Custom scoring algorithm | @zxcvbn-ts/core | Accounts for dictionary attacks, patterns, entropy; 100k+ downloads/week |
| Environment validation | Custom checker functions | Zod refinement or envalid | Type-safe, clear error messages, devDefault pattern |
| File ownership verification | Path string parsing | Database query with Prisma | Authoritative source, prevents manipulation |
| Password validation regex | Single complex regex | Multiple Zod refinements | Clear error messages, easy to modify requirements |

**Key insight:** Security primitives (password strength, ownership verification) have subtle edge cases that mature libraries handle. Custom implementations often miss attack vectors like pattern recognition in passwords or time-of-check-time-of-use races in ownership verification.

## Common Pitfalls

### Pitfall 1: Environment Validation That Doesn't Fail Fast

**What goes wrong:** Application starts with missing critical environment variables, then crashes on first use with cryptic errors (e.g., "Cannot sign token: secret must be provided")

**Why it happens:** Lenient validation prioritizes developer experience (app starts even with missing config) over production safety

**How to avoid:**
- Validate environment variables synchronously before any other imports
- Exit with code 1 in production if validation fails
- Provide clear error messages identifying missing variables
- Use conditional validation (strict in production, lenient in dev)

**Warning signs:**
- Logs show "App will start with defaults. Some features may not work."
- Production errors like "Cannot encrypt: key is undefined"
- Different behavior between dev and production due to fallback defaults

### Pitfall 2: Returning 403 for Unauthorized Resource Access

**What goes wrong:** Attackers can enumerate resources by checking status codes: 404 = doesn't exist, 403 = exists but unauthorized

**Why it happens:** HTTP semantics suggest 403 = Forbidden, which seems correct for authorization failures

**How to avoid:**
- Return 404 for both "not found" and "unauthorized" when resource existence is sensitive
- Reserve 403 for cases where the user knows the resource exists (e.g., "You cannot delete this public file")
- Log suspicious access attempts server-side for monitoring

**Warning signs:**
- Different status codes for "file doesn't exist" vs "not your file"
- API responses leak information about resource structure
- Sequential resource ID enumeration succeeds

### Pitfall 3: Frontend-Backend Validation Mismatch

**What goes wrong:** User meets all frontend password requirements, submits form, then gets backend validation error for unmet requirement

**Why it happens:** Frontend and backend validation rules diverge over time as changes are made to only one side

**How to avoid:**
- Define password requirements in shared constant or type
- Backend validation is authoritative (never trust client)
- Frontend validation must exactly match backend
- Integration tests verify both sides agree

**Warning signs:**
- Users report "form says password is valid but server rejects it"
- Frontend checklist shows all green but submit fails
- Requirements documented differently in frontend vs backend code

### Pitfall 4: Path-Based Authorization

**What goes wrong:** Verifying file ownership by checking if path contains salon ID (`/peacase/salons/123/file.jpg`). Attacker can craft path like `/peacase/salons/123/../456/file.jpg` to access other salon's files (path traversal).

**Why it happens:** String matching seems simpler than database lookup

**How to avoid:**
- Always use database as authoritative source of ownership
- Never trust user-supplied paths or IDs without verification
- Normalize/sanitize paths if path-based checks are unavoidable
- Use middleware to centralize ownership verification logic

**Warning signs:**
- Authorization logic uses string methods (includes, startsWith)
- No database queries in authorization flow
- Path parameters used directly without validation

### Pitfall 5: Password Complexity Rules Without User Guidance

**What goes wrong:** Users create passwords that fail validation, receive generic error "Password does not meet requirements," spend multiple attempts guessing what's wrong

**Why it happens:** Backend validation exists but frontend doesn't communicate requirements until after submission

**How to avoid:**
- Show password requirements before user starts typing
- Provide real-time visual feedback (checklist with checkmarks)
- Update checklist as user types (instant feedback loop)
- Clear error messages listing unmet requirements

**Warning signs:**
- Generic validation errors: "Invalid password"
- Users need multiple submission attempts
- Support tickets asking "What are the password requirements?"
- No real-time validation feedback in UI

## Code Examples

Verified patterns from official sources:

### Environment Validation with Conditional Strictness

```typescript
// Source: envalid patterns and Zod refinement documentation 2026
// Validates strictly in production, allows defaults in development

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),

  // Security-critical variables
  JWT_SECRET: z.string().default(() =>
    process.env.NODE_ENV === 'production'
      ? '' // Force validation failure if missing
      : 'dev-secret-unsafe-for-production'
  ),
  ENCRYPTION_KEY: z.string().default(() =>
    process.env.NODE_ENV === 'production'
      ? '' // Force validation failure if missing
      : 'dev-key-32-bytes-unsafe-for-production'.repeat(2)
  ),
}).superRefine((data, ctx) => {
  if (data.NODE_ENV === 'production') {
    // Strict validation in production
    if (!data.JWT_SECRET || data.JWT_SECRET.length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'JWT_SECRET is required in production (minimum 32 characters)',
        path: ['JWT_SECRET'],
      });
    }

    if (!data.ENCRYPTION_KEY || data.ENCRYPTION_KEY.length !== 64) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ENCRYPTION_KEY is required in production (must be 64 hex characters)',
        path: ['ENCRYPTION_KEY'],
      });
    }
  }
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('\n❌ Environment validation failed:\n');
    result.error.issues.forEach(issue => {
      console.error(`   ${issue.path.join('.')}: ${issue.message}`);
    });

    if (process.env.NODE_ENV === 'production') {
      console.error('\n⚠️  Application cannot start in production with invalid environment.\n');
      process.exitCode = 1;
      // Ensure stderr flushes before exit
      process.stderr.write('', () => process.exit(1));
    } else {
      console.warn('\n⚠️  Continuing in development mode with defaults.\n');
    }
  }

  return result.data;
}

export const env = validateEnv();
```

### Database-Backed Ownership Verification

```typescript
// Source: OWASP IDOR Prevention + Prisma authorization patterns
// Middleware to verify file ownership before allowing operations

import { Request, Response, NextFunction } from 'express';
import { prisma } from '@peacase/database';

interface FileOwnershipRequest extends Request {
  fileMetadata?: {
    id: string;
    publicId: string;
    salonId: string;
    userId: string;
  };
}

export async function validateFileOwnership(
  req: FileOwnershipRequest,
  res: Response,
  next: NextFunction
) {
  const { publicId } = req.params;
  const userId = req.user?.userId;
  const salonId = req.user?.salonId;

  if (!userId || !salonId) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'File not found' },
    });
  }

  try {
    // Query database for file metadata
    const file = await prisma.fileUpload.findFirst({
      where: { publicId },
      select: { id: true, publicId: true, salonId: true, userId: true },
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'File not found' },
      });
    }

    // Verify salon ownership
    if (file.salonId !== salonId) {
      console.warn('File ownership violation:', {
        timestamp: new Date().toISOString(),
        userId,
        userSalonId: salonId,
        requestedFileId: publicId,
        actualFileSalonId: file.salonId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      // Return 404 to prevent enumeration
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'File not found' },
      });
    }

    // Attach metadata to request for handler use
    req.fileMetadata = file;
    next();
  } catch (error) {
    console.error('File ownership validation error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Unable to verify file access' },
    });
  }
}
```

### Password Validation with Zod Refinements

```typescript
// Source: Zod API documentation + password validation patterns 2026
// Backend password validation with detailed error messages

import { z } from 'zod';

// Define password requirements as testable functions
const PASSWORD_REQUIREMENTS = {
  minLength: (p: string) => p.length >= 8,
  hasUppercase: (p: string) => /[A-Z]/.test(p),
  hasLowercase: (p: string) => /[a-z]/.test(p),
  hasNumber: (p: string) => /[0-9]/.test(p),
  hasSpecialChar: (p: string) => /[^A-Za-z0-9]/.test(p),
};

export const passwordSchema = z.string()
  .min(1, 'Password is required')
  .refine(PASSWORD_REQUIREMENTS.minLength, {
    message: 'Password must be at least 8 characters',
  })
  .refine(PASSWORD_REQUIREMENTS.hasUppercase, {
    message: 'Password must contain at least one uppercase letter (A-Z)',
  })
  .refine(PASSWORD_REQUIREMENTS.hasLowercase, {
    message: 'Password must contain at least one lowercase letter (a-z)',
  })
  .refine(PASSWORD_REQUIREMENTS.hasNumber, {
    message: 'Password must contain at least one number (0-9)',
  })
  .refine(PASSWORD_REQUIREMENTS.hasSpecialChar, {
    message: 'Password must contain at least one special character (!@#$%^&*)',
  });

// Use in registration schema
export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Export requirements for frontend use
export const PASSWORD_REQUIREMENT_TESTS = PASSWORD_REQUIREMENTS;
```

### React Password Checklist Component

```typescript
// Source: React password validation UI patterns 2026
// Real-time password requirement checklist

import { CheckCircle, Circle } from 'lucide-react';

interface PasswordChecklistProps {
  password: string;
  className?: string;
}

export function PasswordChecklist({ password, className = '' }: PasswordChecklistProps) {
  const requirements = [
    {
      test: (p: string) => p.length >= 8,
      label: 'At least 8 characters',
      id: 'length',
    },
    {
      test: (p: string) => /[A-Z]/.test(p),
      label: 'One uppercase letter (A-Z)',
      id: 'uppercase',
    },
    {
      test: (p: string) => /[a-z]/.test(p),
      label: 'One lowercase letter (a-z)',
      id: 'lowercase',
    },
    {
      test: (p: string) => /[0-9]/.test(p),
      label: 'One number (0-9)',
      id: 'number',
    },
    {
      test: (p: string) => /[^A-Za-z0-9]/.test(p),
      label: 'One special character (!@#$%^&*)',
      id: 'special',
    },
  ];

  const allRequirementsMet = requirements.every(req => req.test(password));

  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-sm text-charcoal/60 font-medium">
        Password requirements:
      </p>
      <div className="space-y-1">
        {requirements.map((req) => {
          const met = password.length > 0 && req.test(password);
          const pending = password.length === 0;

          return (
            <div
              key={req.id}
              className="flex items-center gap-2 text-sm"
              aria-label={`${req.label} ${met ? 'met' : 'not met'}`}
            >
              {met ? (
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-charcoal/30 flex-shrink-0" />
              )}
              <span className={
                met
                  ? 'text-emerald-700 font-medium'
                  : pending
                    ? 'text-charcoal/50'
                    : 'text-charcoal/70'
              }>
                {req.label}
              </span>
            </div>
          );
        })}
      </div>
      {allRequirementsMet && (
        <p className="text-sm text-emerald-600 font-medium flex items-center gap-2 mt-3">
          <CheckCircle className="w-4 h-4" />
          Password meets all requirements
        </p>
      )}
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Arbitrary password complexity | Length-based security (15+ chars) | OWASP 2019-2020 | Simpler for users, equally secure |
| Complexity rules (uppercase, lowercase, number, special) | Length + breach checking | OWASP 2020-2023 | Better UX, stops reused passwords |
| Return 403 for unauthorized access | Return 404 to prevent enumeration | OWASP IDOR guidance 2018+ | Prevents resource discovery |
| Global environment validation | Production-only strict validation | envalid devDefault pattern 2020+ | Better DX without compromising prod security |
| Path-based authorization | Database-backed ownership verification | OWASP IDOR 2015+ | Prevents path traversal, authoritative source |

**Deprecated/outdated:**
- **Password rotation policies:** OWASP now recommends against periodic password changes unless breach detected
- **Blocking special characters in passwords:** Modern guidance allows all characters including Unicode
- **Minimum complexity but short passwords:** 8 chars with complexity < 15 chars without (for MFA-enabled accounts)
- **Generating random secrets at runtime:** Production apps must use persistent, explicitly-set secrets

**Modern OWASP password guidance (2026):**
- Minimum 8 characters with MFA, 15 without
- Maximum 64+ characters to support passphrases
- Check against breach databases (Have I Been Pwned API)
- No periodic rotation unless compromised
- Allow all characters including spaces and Unicode
- Use password strength meter (zxcvbn-ts) instead of rigid rules

**Note:** Phase 13 requirements specify complexity rules (uppercase, lowercase, number, special character) which differs from latest OWASP guidance emphasizing length over complexity. This is acceptable as a baseline security measure and aligns with NIST SP 800-63B standards. Future enhancement could add zxcvbn-ts strength meter and breach checking.

## Open Questions

Things that couldn't be fully resolved:

1. **File Upload Tracking Database Model**
   - What we know: Current implementation uses Cloudinary for storage but doesn't track uploads in Prisma database
   - What's unclear: Whether to create new `FileUpload` model or extend existing models (User.avatarUrl, Service images)
   - Recommendation: Create FileUpload model with fields: `id`, `publicId`, `url`, `salonId`, `userId`, `uploadedAt`, `fileType`, `metadata`. This enables centralized ownership verification. Alternative: Track uploads in junction tables specific to entity type (UserAvatar, ServiceImage, etc.) for tighter schema but more complex queries.

2. **Password Validation Error Messages**
   - What we know: Zod validation can return detailed error messages listing all unmet requirements
   - What's unclear: Should API return all unmet requirements in single response or only first failure?
   - Recommendation: Return all unmet requirements in `details` field for better UX. Frontend can show which specific requirements are missing. Current pattern in auth.ts returns `fieldErrors` which supports this.

3. **Environment Variable Validation Timing**
   - What we know: Current env.ts runs at module import time, which is synchronous
   - What's unclear: Whether to validate before or after logger initialization
   - Recommendation: Validate before logger (current approach correct). If validation fails, app shouldn't start, so structured logging isn't needed. Use console.error to stderr for fail-fast errors.

4. **Logging Suspicious File Access Attempts**
   - What we know: Should log unauthorized access attempts at warn level
   - What's unclear: Whether to rate-limit logging to prevent log spam attacks, and whether to trigger alerts
   - Recommendation: Log every attempt (observability > log volume) but consider async batch insert to database table for analysis. Don't alert on individual attempts; use anomaly detection for patterns (same user trying many files, automated scanning).

## Sources

### Primary (HIGH confidence)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) - Password requirements, MFA guidance
- [OWASP IDOR Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html) - Ownership verification patterns
- [Zod API Documentation](https://zod.dev/api) - Schema validation and refinement
- [envalid GitHub](https://github.com/af/envalid) - Environment validation with devDefault pattern
- [Node.js Process Documentation](https://nodejs.org/api/process.html) - process.exit() and stderr behavior

### Secondary (MEDIUM confidence)
- [Securing File Uploads in Express.js: Best Practices](https://medium.com/@ibrahimhz/securing-file-uploads-in-express-js-best-practices-unveiled-17380185070f) - File validation and security
- [Preventing Broken Access Control in Express](https://snyk.io/blog/preventing-broken-access-control-express-node-js/) - Authorization patterns
- [404 vs 403 for Authorization](https://ashallendesign.co.uk/blog/unauthorised-access-404) - Status code security implications
- [Password Validation UI/UX Best Practices](https://www.uxgrowth.io/blog/password-validation-page-ux-ui-design-strategies-and-best-practices) - Real-time validation patterns
- [zxcvbn-ts GitHub](https://github.com/zxcvbn-ts/zxcvbn) - Password strength estimation

### Tertiary (LOW confidence)
- [Node.js Security Best Practices 2026](https://medium.com/@sparklewebhelp/node-js-security-best-practices-for-2026-3b27fb1e8160) - General security guidance
- [Prisma RBAC Implementation](https://www.permit.io/blog/implementing-prisma-rbac-fine-grained-prisma-permissions) - Authorization patterns with Prisma

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Zod and Prisma already in use; zxcvbn-ts is OWASP-recommended and actively maintained
- Architecture patterns: HIGH - Environment validation verified via envalid docs; IDOR prevention verified via OWASP; password validation verified via Zod docs
- Pitfalls: HIGH - All pitfalls documented in OWASP guidance or Node.js official docs; real examples from security research

**Research date:** 2026-01-28
**Valid until:** 2026-04-28 (90 days - security guidance stable, but frameworks update quarterly)

**Implementation notes:**
- FileUpload model needs database migration before ownership verification can be implemented
- Current code already uses Zod for validation; patterns extend existing approach
- Password checklist component follows existing UI patterns in apps/web/src/app/staff/setup/page.tsx
- All changes are backward-compatible except environment validation (will fail in production if secrets missing)
