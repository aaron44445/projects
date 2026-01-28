---
phase: 13-security-hardening
plan: 01
subsystem: infrastructure
requires: []
provides: [production-env-validation]
affects: [13-02, 13-03, 13-04]
tags: [security, environment, validation, production]

tech-stack:
  added: []
  patterns: [fail-fast, production-strict-validation]

key-files:
  created: []
  modified: [apps/api/src/lib/env.ts]

decisions:
  - id: production-only-validation
    choice: Use Zod superRefine for conditional validation based on NODE_ENV
    rationale: Maintains development flexibility while enforcing production security
    alternatives: [always-strict, env-specific-schemas]
  - id: exit-strategy
    choice: Use process.stderr.write with callback and setTimeout fallback
    rationale: Ensures error messages flush before process exits
    alternatives: [console.error, process.exit-only]

metrics:
  duration: 4 minutes
  completed: 2026-01-28
---

# Phase 13 Plan 01: Production Environment Validation Summary

**One-liner:** Production-strict environment validation using Zod superRefine that fails fast on missing JWT_SECRET or ENCRYPTION_KEY while preserving development flexibility.

## What Was Built

Implemented conditional environment validation that enforces critical security variables only in production mode:

**Production mode:**
- Validates JWT_SECRET is present and minimum 32 characters
- Validates ENCRYPTION_KEY is present and exactly 64 hex characters
- Exits with code 1 and clear error messages if validation fails
- Prevents application startup with missing cryptographic keys

**Development mode:**
- Unchanged behavior: continues to use defaults with warnings
- Allows rapid development without configuring all secrets
- Maintains backward compatibility

## Architecture

**Pattern: Fail-Fast Production Validation**

```
┌─────────────────────────────────────────────────────────────┐
│ envSchema.superRefine()                                      │
│                                                              │
│  if NODE_ENV === 'production':                              │
│    ├─ Check JWT_SECRET (min 32 chars)                       │
│    ├─ Check ENCRYPTION_KEY (exactly 64 hex)                 │
│    └─ Add validation issues if missing                      │
│                                                              │
│  Development: No additional validation                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ validateEnv()                                                │
│                                                              │
│  safeParse(process.env)                                     │
│                                                              │
│  if (!success):                                             │
│    ├─ Production: Write errors to stderr → exit(1)          │
│    └─ Development: Log warnings → continue with defaults    │
└─────────────────────────────────────────────────────────────┘
```

**Key Implementation Details:**

1. **Conditional Validation:** Uses `superRefine()` to add validation rules only when `NODE_ENV === 'production'`
2. **Graceful Exit:** Uses `process.stderr.write()` with callback to ensure messages flush before exit
3. **Clear Error Messages:** Identifies specific missing variables and requirements
4. **No Breaking Changes:** Development workflow completely unchanged

## Tasks Completed

| Task | Commit | Files Modified |
|------|--------|----------------|
| Implement production-only environment validation | 60fc7ef | apps/api/src/lib/env.ts |

## Code Changes

**Modified: apps/api/src/lib/env.ts**

1. Added `superRefine()` to envSchema:
   - Checks `NODE_ENV === 'production'`
   - Validates JWT_SECRET length >= 32
   - Validates ENCRYPTION_KEY length === 64 (hex format)
   - Adds custom Zod issues with clear messages

2. Updated `validateEnv()` function:
   - Checks `NODE_ENV` before handling validation failures
   - Production: Writes errors to stderr, sets exitCode, exits with code 1
   - Development: Logs warnings, returns defaults (unchanged)
   - Uses stderr flush callback and setTimeout fallback for reliable exit

3. Updated `getEncryptionKey()` helper:
   - Clarified warning message indicates development-only behavior
   - No functional changes

## Security Impact

**Before:**
- Application could start in production with missing JWT_SECRET or ENCRYPTION_KEY
- Would fail later during JWT signing or API key encryption
- Sessions wouldn't persist across restarts (random secrets)
- API keys couldn't be decrypted after restart

**After:**
- Application cannot start in production without proper secrets
- Clear error messages identify missing variables immediately
- Prevents silent security failures
- Forces proper secret management in production

## Verification

**TypeScript Compilation:**
- env.ts logic verified (note: unrelated build errors exist from other files)
- Zod schema structure validated
- Type safety maintained

**Code Review:**
- superRefine() only enforces validation when NODE_ENV === 'production'
- process.exit(1) only called in production mode
- Development mode preserves existing behavior
- Error messages are clean (no emojis for log parsing)

**Expected Production Behavior:**
```bash
NODE_ENV=production node dist/index.js
# Without secrets:
# FATAL: Missing required environment variables in production:
#   - JWT_SECRET: JWT_SECRET is required in production (minimum 32 characters)
#   - ENCRYPTION_KEY: ENCRYPTION_KEY is required in production (must be 64 hex characters)
#
# Application cannot start without these variables.
# [exits with code 1]
```

**Expected Development Behavior:**
```bash
NODE_ENV=development node dist/index.js
# ⚠️  Some environment variables are missing or invalid:
#    App will start with defaults. Some features may not work.
# [continues normally]
```

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Blockers:** None

**Concerns:**
- Pre-existing TypeScript build errors in other files (subscription-related)
- These are unrelated to env validation changes and should be addressed separately

**Enables:**
- 13-02: Rate limiting (can safely assume production environment is validated)
- 13-03: CORS hardening (production mode is reliable)
- 13-04: Security headers (production detection works correctly)

## Dependencies

**Built on:**
- Existing Zod schema infrastructure
- Current development/production environment detection

**Provides for future phases:**
- Reliable production environment detection
- Guaranteed availability of JWT_SECRET in production
- Guaranteed availability of ENCRYPTION_KEY in production

## Technical Debt

None introduced.

## References

**Related Files:**
- apps/api/src/lib/env.ts (modified)
- apps/api/src/index.ts (imports env)
- All route files (depend on env for JWT operations)

**Phase Documentation:**
- .planning/phases/13-security-hardening/13-01-PLAN.md
- .planning/phases/13-security-hardening/13-01-CONTEXT.md (if exists)
