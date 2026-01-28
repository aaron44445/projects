# Phase 8: Register Missing Production Routers - Research

**Researched:** 2026-01-27
**Domain:** Express.js Router Registration and Multi-Entry Point Architecture
**Confidence:** HIGH

## Summary

This phase addresses a critical integration gap where routers implemented and working in the development entry point (app.ts) are missing from the production entry point (index.ts), causing 404 errors in deployed environments. The codebase has diverged between two Express app initialization patterns: app.ts creates an Express app with all routers for testing/development, while index.ts serves as the Vercel serverless production entry point.

The issue is straightforward: five routers (notificationsRouter, accountRouter, teamRouter, ownerNotificationsRouter, integrationsRouter) are imported and registered in app.ts but completely missing from index.ts. This causes the notification history page and other features to return 404 in production while working locally.

This is a textbook example of the "dev/prod parity" pitfall in serverless deployments where local development uses one entry point and production uses another. The fix is mechanical: copy import statements and app.use() registrations from app.ts to index.ts in the correct order.

**Primary recommendation:** Add missing router imports and registrations to index.ts, matching the exact pattern used in app.ts. Verify by comparing both files line-by-line for router registration parity.

## Standard Stack

This is purely an Express.js routing architecture issue - no external libraries needed beyond what's already installed.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Express.js | Current (in package.json) | Web framework with router system | Industry standard for Node.js HTTP servers |
| express.Router | Built-in | Modular route handler instances | Official Express pattern for route organization |

### Supporting
N/A - This phase only involves registering existing routers, no new dependencies.

### Alternatives Considered
N/A - The routers already exist and work in app.ts. No architectural alternatives are being evaluated.

**Installation:**
No new packages required. All routers are already implemented.

## Architecture Patterns

### Current Project Structure
```
apps/api/src/
├── routes/
│   ├── notifications.ts        # Exists, exported as notificationsRouter
│   ├── account.ts              # Exists, exported as accountRouter
│   ├── team.ts                 # Exists, exported as teamRouter
│   ├── ownerNotifications.ts   # Exists, exported as ownerNotificationsRouter
│   ├── integrations.ts         # Exists, exported as integrationsRouter
│   └── [22 other routers]
├── app.ts                      # Development/test entry - HAS all routers
└── index.ts                    # Production/Vercel entry - MISSING 5 routers
```

### Pattern 1: Router Import and Registration (Standard Express)
**What:** Import router instance, register with app.use() at specific path
**When to use:** Always - this is the standard Express router pattern
**Example:**
```typescript
// Source: Codebase observation (app.ts lines 31-110)
// Import the router
import { notificationsRouter } from './routes/notifications.js';

// Register at API path (after middleware setup, before error handlers)
app.use('/api/v1/notifications', notificationsRouter);
```

### Pattern 2: Registration Order (Critical for Express)
**What:** Routers must be registered after middleware but before error handlers
**When to use:** Always in Express apps
**Example:**
```typescript
// Source: Express.js official docs + codebase pattern
// 1. Middleware (helmet, cors, body parsers, rate limiting)
app.use(helmet());
app.use(cors({ ... }));
app.use(express.json());

// 2. Health/debug routes (no auth)
app.get('/health', ...);

// 3. API routers
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/notifications', notificationsRouter);
// ... all other routers

// 4. Error handlers (must be LAST)
app.use(notFoundHandler);
app.use(errorHandler);
```

### Pattern 3: Vercel Serverless Export
**What:** Export Express app as default for Vercel serverless function
**When to use:** When deploying to Vercel
**Example:**
```typescript
// Source: Codebase observation (index.ts line 220)
// Only start server if not in Vercel environment
if (!process.env.VERCEL) {
  app.listen(PORT, () => { ... });
}

// Export for Vercel serverless
export default app;
```

### Anti-Patterns to Avoid
- **Registering routers in different order between entry points:** Creates inconsistent route matching behavior
- **Missing imports without realizing it:** No compile error, just runtime 404s
- **Skipping routers in production:** Breaks features that work in development
- **Registering routers after error handlers:** Express matches first-come-first-serve; error handlers will catch everything

## Don't Hand-Roll

This is not a "don't hand-roll" scenario - the routers already exist and are correct. This is purely a registration issue.

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Router parity validation | Custom diff script | Manual line-by-line comparison | Simple one-time fix, not worth automation |
| Route testing | Custom HTTP client | supertest library (already available) | Industry standard for Express route testing |

**Key insight:** While automated tools exist for testing router registration, this is a one-time mechanical fix. The real solution is organizational discipline to keep app.ts and index.ts in sync.

## Common Pitfalls

### Pitfall 1: Dev/Prod Entry Point Divergence
**What goes wrong:** Features work locally but 404 in production because routers are only registered in development entry point
**Why it happens:** Multiple entry points (app.ts for testing, index.ts for serverless) maintained separately without parity checks
**How to avoid:** When adding a new router, add it to BOTH app.ts and index.ts immediately
**Warning signs:**
- Routes work with `npm run dev` but fail after deployment
- 404 errors only in production, never locally
- Router exists and is imported but app.use() is missing

### Pitfall 2: Missing Import Statement
**What goes wrong:** Copy app.use() line but forget the import at top of file - TypeScript error at build time, but might be missed
**Why it happens:** Import and registration are separated by 50+ lines
**How to avoid:** Add import and registration together in same commit
**Warning signs:**
- TypeScript error: "Cannot find name 'notificationsRouter'"
- Build fails but only when trying to deploy

### Pitfall 3: Wrong Registration Order
**What goes wrong:** Router registered after error handlers never gets called
**Why it happens:** Adding new router at bottom of file instead of in router section
**How to avoid:** Keep all app.use() router registrations grouped together, before error handlers
**Warning signs:**
- Router imported correctly but still returns 404
- Error handler logs show "Not found" for valid routes

### Pitfall 4: Different Path Between Entry Points
**What goes wrong:** Router registered at /api/v1/notifications in app.ts but /api/v1/notification (singular) in index.ts
**Why it happens:** Typo or copy-paste error
**How to avoid:** Copy exact path string from app.ts to index.ts
**Warning signs:**
- Route works locally but different path required in production

## Code Examples

Verified patterns from the existing codebase:

### Adding Missing Router to index.ts
```typescript
// Source: Comparison of app.ts (working) vs index.ts (missing)

// 1. Add import at top with other route imports (line ~30)
import { notificationsRouter } from './routes/notifications.js';
import { accountRouter } from './routes/account.js';
import { teamRouter } from './routes/team.js';
import { ownerNotificationsRouter } from './routes/ownerNotifications.js';
import { integrationsRouter } from './routes/integrations.js';

// 2. Register after existing routers, before error handlers (line ~175-180)
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/account', accountRouter);
app.use('/api/v1/team', teamRouter);
app.use('/api/v1/owner-notifications', ownerNotificationsRouter);
app.use('/api/v1/integrations', integrationsRouter);
```

### Router Export Pattern (Already Correct)
```typescript
// Source: apps/api/src/routes/notifications.ts line 241
// All routers use this pattern - export named const
const router = Router();

// ... route definitions

export { router as notificationsRouter };
```

### Verifying Registration Worked
```typescript
// Source: Recommended verification approach
// After deployment, test endpoints:
// GET /api/v1/notifications (should return notification list, not 404)
// GET /api/v1/account/profile (should return profile, not 404)
// GET /api/v1/team (should return team list, not 404)
// GET /api/v1/owner-notifications (should return preferences, not 404)
// GET /api/v1/integrations/status (should return status, not 404)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single entry point for dev and prod | Separate entry points (app.ts for dev/test, index.ts for serverless) | Common in serverless architectures | Requires manual parity maintenance |
| Manual route registration | Routers already using express.Router() pattern | Express v4+ (standard for years) | Modular, testable routes |
| No route testing | supertest available (though not used for router parity) | Available in current stack | Could verify all routes respond |

**Deprecated/outdated:**
- N/A - This is standard Express routing, no deprecated patterns involved

## Open Questions

1. **Should we consolidate entry points?**
   - What we know: app.ts and index.ts duplicate 95% of setup code
   - What's unclear: Could we extract app initialization to a factory function both import?
   - Recommendation: Not in this phase - this is a quick gap fix. Consider refactoring in future phase if more divergence occurs.

2. **Should we add automated parity checks?**
   - What we know: This issue was found through manual audit, not automated checks
   - What's unclear: Value of automated test vs. discipline in future router additions
   - Recommendation: Not needed immediately. If it happens again, add a simple test that compares router registration between entry points.

3. **Why wasn't this caught earlier?**
   - What we know: Development uses app.ts, production uses index.ts, so local testing never hit this
   - What's unclear: Testing process before production deployment
   - Recommendation: After fixing, document that new routers must be added to BOTH files

## Sources

### Primary (HIGH confidence)
- Codebase files: apps/api/src/app.ts and apps/api/src/index.ts (direct observation)
- Codebase files: apps/api/src/routes/*.ts (router implementations verified)
- [Express.js Official Routing Documentation](https://expressjs.com/en/guide/routing.html)
- [Express.js FAQ](https://expressjs.com/en/starter/faq.html)

### Secondary (MEDIUM confidence)
- [Better Route Registration with Express.js - Medium](https://medium.com/@pierrephilip/better-route-registration-with-express-js-740c0f342c10)
- [Top Express.js Mistakes and How to Fix Them - DEV Community](https://dev.to/rigalpatel001/top-expressjs-mistakes-and-how-to-fix-them-1p8l)
- [Deploy Express Project with Multiple Routes to Vercel as Multiple Serverless Functions - Medium](https://medium.com/geekculture/deploy-express-project-with-multiple-routes-to-vercel-as-multiple-serverless-functions-567c6ea9eb36)
- [404 on the other routes I created in my Node.js express app - Vercel Community](https://community.vercel.com/t/404-on-the-other-routes-i-created-in-my-node-js-express-app/6874)

### Tertiary (LOW confidence)
- WebSearch results about Express router registration best practices (general guidance, not specific to this issue)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing Express.js, no new libraries
- Architecture: HIGH - Direct observation of codebase, clear pattern match
- Pitfalls: HIGH - Well-documented Express routing pitfalls, verified in codebase

**Research date:** 2026-01-27
**Valid until:** Indefinite - This is stable Express.js routing, not a fast-moving domain
