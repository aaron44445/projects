# Phase 17: Code Quality - Research

**Researched:** 2026-01-29
**Domain:** TypeScript type safety, Prisma filter typing, structured logging
**Confidence:** HIGH

## Summary

Phase 17 improves internal code quality by enabling strict TypeScript compilation (noImplicitAny: true), explicitly typing Prisma filter objects, extracting common salonId filtering to a shared utility, and replacing console.log statements with structured JSON logging. This phase affects **28 route files** and approximately **165 console.log/warn/error calls** across **37 files** in the API codebase.

The standard approach for this type of migration is incremental: fix types and replace logging statements file-by-file, ensuring the build passes after each change. For Prisma filters, TypeScript's `satisfies` operator (available since TypeScript 4.9) provides type safety without the overhead of the deprecated `Prisma.validator` API. For structured logging, **Pino** is the industry standard for high-performance Node.js applications in 2026, offering 5-10x better throughput than Winston while providing production-ready JSON logging with minimal configuration.

**Primary recommendation:** Use Pino for structured logging, TypeScript `satisfies` operator for type-safe Prisma filters, and migrate incrementally (one route file at a time) to avoid overwhelming type errors.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pino | ^9.x | Structured JSON logging | 5-10x faster than Winston, ~50k logs/sec throughput, JSON-first design for log aggregators |
| pino-http | ^10.x | Express middleware integration | Official Pino middleware for per-request child loggers with automatic requestId |
| pino-pretty | ^12.x | Development pretty-printing | Human-readable console output for local dev (dev dependency only) |
| TypeScript 5.3+ | 5.3.0 (current) | Type safety with satisfies operator | Native `satisfies` operator replaces deprecated Prisma.validator |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/node | ^20.10.0 (current) | Node.js type definitions | Required for process.env typing |
| AsyncLocalStorage | Built-in (Node 16+) | Request context propagation | Advanced: per-request logging context without passing logger everywhere |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pino | Winston | Winston offers more flexible transports and richer formatting, but 5-10x slower. Choose if you need complex multi-destination routing over raw performance. |
| Pino | Morgan | Morgan is HTTP-only logging. Pino is full application logging with HTTP support. Not comparable. |
| satisfies | Prisma.validator | Prisma.validator is deprecated and only works with legacy generator. Use satisfies. |
| Child loggers | Manual context fields | Manually passing `{ salonId, userId }` to every log call. Error-prone and verbose. |

**Installation:**
```bash
npm install pino pino-http
npm install --save-dev pino-pretty
```

## Architecture Patterns

### Recommended Project Structure
```
apps/api/src/
├── lib/
│   ├── logger.ts            # Pino logger configuration
│   ├── prismaUtils.ts       # withSalonId() filter utility
│   └── errorUtils.ts        # Existing - update to use logger
├── middleware/
│   └── requestLogger.ts     # pino-http middleware (optional)
└── routes/
    └── *.ts                 # Update: use logger, typed filters
```

### Pattern 1: Structured Logger Setup
**What:** Single logger instance configured at startup, imported throughout app
**When to use:** All logging in the application
**Example:**
```typescript
// src/lib/logger.ts
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  // Pretty print only in development
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname',
    }
  } : undefined,
});

export default logger;
```

**Usage in route files:**
```typescript
import logger from '../lib/logger.js';

// Basic logging
logger.info('Appointment created');
logger.warn({ salonId, userId }, 'User approaching subscription limit');

// Error logging with stack trace
try {
  // ...
} catch (err) {
  logger.error(err, 'Failed to process appointment');
  throw err;
}
```

### Pattern 2: Child Logger with Request Context
**What:** Create per-request child logger that automatically includes salonId, userId, requestId
**When to use:** Express middleware for per-request logging
**Example:**
```typescript
// In middleware or route handler
router.use(authenticate, (req, res, next) => {
  // Create child logger with request context
  req.log = logger.child({
    salonId: req.user!.salonId,
    userId: req.user!.userId,
    requestId: req.id, // If using express-request-id
  });
  next();
});

// Later in route handler
req.log.info('Processing appointment list request');
// Output includes salonId, userId, requestId automatically
```

### Pattern 3: Type-Safe Prisma Filters with satisfies
**What:** Use TypeScript `satisfies` operator to create type-safe, reusable filter objects
**When to use:** When building Prisma where clauses from dynamic inputs
**Example:**
```typescript
// Source: https://www.prisma.io/blog/satisfies-operator-ur8ys8ccq7zb
import { Prisma } from '@prisma/client';

// Reusable filter collection
const appointmentFilters = {
  active: { status: 'confirmed' },
  upcoming: { startTime: { gte: new Date() } },
  forSalon: (salonId: string) => ({ salonId }),
} satisfies Record<string, Prisma.AppointmentWhereInput | ((id: string) => Prisma.AppointmentWhereInput)>;

// Usage
const where = {
  ...appointmentFilters.forSalon(req.user!.salonId),
  ...appointmentFilters.upcoming,
} satisfies Prisma.AppointmentWhereInput;

const appointments = await prisma.appointment.findMany({ where });
```

### Pattern 4: salonId Filter Utility
**What:** Simple utility function that returns typed Prisma filter object
**When to use:** Every route query to enforce tenant isolation
**Example:**
```typescript
// src/lib/prismaUtils.ts
import { Prisma } from '@prisma/client';

/**
 * Creates a Prisma where clause that filters by salonId.
 * Use this in all multi-tenant queries to ensure tenant isolation.
 *
 * @param salonId - The salon ID to filter by
 * @returns Prisma where clause object
 */
export function withSalonId<T extends { salonId: string }>(
  salonId: string
): Pick<T, 'salonId'> {
  return { salonId } as Pick<T, 'salonId'>;
}

// Usage in routes
import { withSalonId } from '../lib/prismaUtils.js';

const where = {
  ...withSalonId(req.user!.salonId),
  status: 'confirmed',
} satisfies Prisma.AppointmentWhereInput;
```

### Pattern 5: Explicit Filter Types (Replacing any)
**What:** Declare filter variables with explicit Prisma types instead of `any`
**When to use:** All route handlers building dynamic filters
**Example:**
```typescript
// BEFORE (implicit any)
const where: any = {
  salonId: req.user!.salonId,
};
if (status) {
  where.status = status;
}

// AFTER (explicit type)
const where: Prisma.AppointmentWhereInput = {
  salonId: req.user!.salonId,
  ...(status && { status: status as string }),
};

// OR with satisfies (preferred)
const where = {
  salonId: req.user!.salonId,
  ...(status && { status: status as string }),
} satisfies Prisma.AppointmentWhereInput;
```

### Anti-Patterns to Avoid
- **Using `Prisma.validator`:** Deprecated API, only works with legacy generator. Use `satisfies` instead.
- **Global logger mutation:** Don't modify logger instance globally. Use child loggers for context.
- **Logging before error handling:** Log errors after they're caught/handled, not during propagation.
- **String concatenation in log messages:** Use structured fields instead: `logger.info({ appointmentId }, 'Created')` not `logger.info('Created appointment ' + appointmentId)`

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Automatic tenant filtering | Custom Prisma middleware that intercepts all queries | Simple `withSalonId()` utility function | Prisma middleware is complex, hard to debug, and adds overhead. Explicit filtering is clearer and easier to verify. |
| Request-scoped context | Global variables or manual parameter passing | Child loggers | Child loggers are lightweight (designed for high-frequency creation) and automatically propagate context. |
| Log rotation | Custom file writing and rotation logic | System-level logrotate or pino transports | Pino delegates rotation to OS-level tools. Custom rotation adds complexity and failure points. |
| Pretty log formatting | Custom console.log formatters | pino-pretty in development only | pino-pretty is optimized and maintained. Keep JSON in production for log aggregators. |
| Error serialization | Custom error formatting | Pino's built-in error serializer | Pino automatically extracts error.message, error.stack, error.code. Pass error object as first arg. |

**Key insight:** Pino's philosophy is "do one thing well" - fast JSON logging. Delegate routing, rotation, and aggregation to external tools. Don't try to build these features into the logger.

## Common Pitfalls

### Pitfall 1: Type Widening with Dynamic Filters
**What goes wrong:** When building filter objects dynamically, TypeScript widens the type to `any` and loses Prisma type information.
**Why it happens:** TypeScript infers the widest possible type when you build objects incrementally.
**How to avoid:** Use `satisfies` operator or declare explicit type upfront.
**Warning signs:**
- `const where = {}; where.salonId = ...` triggers implicit any errors
- IDE autocomplete stops working for Prisma filters
- No compile errors for typos in filter field names

```typescript
// BAD: Type widening
const where = {};
where.salonId = req.user!.salonId; // Error: implicit any

// GOOD: satisfies operator
const where = {
  salonId: req.user!.salonId,
} satisfies Prisma.AppointmentWhereInput;

// GOOD: Explicit type
const where: Prisma.AppointmentWhereInput = {
  salonId: req.user!.salonId,
};
```

### Pitfall 2: Logging Synchronously in High-Traffic Routes
**What goes wrong:** Using synchronous transports or pino-pretty in production causes request blocking.
**Why it happens:** pino-pretty and some transports process logs synchronously, blocking the event loop.
**How to avoid:** Only use pino-pretty in development. In production, log to stdout (JSON) and let infrastructure handle routing.
**Warning signs:**
- Increased response times under load
- Event loop lag warnings
- CPU spikes during high traffic

```typescript
// BAD: pino-pretty in production
const logger = pino({
  transport: { target: 'pino-pretty' } // BLOCKS event loop
});

// GOOD: Conditional pretty printing
const logger = pino({
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty'
  } : undefined // Production: JSON to stdout
});
```

### Pitfall 3: Not Passing Error Object as First Argument
**What goes wrong:** Stack traces don't appear in logs, making debugging impossible.
**Why it happens:** Pino's error serializer only activates when error is first argument.
**How to avoid:** Always pass error object as first arg: `logger.error(err, 'message')`
**Warning signs:**
- Logs show error message but no stack trace
- Can't determine where errors originated
- Error properties missing from log output

```typescript
// BAD: Error in message field
logger.error('Error occurred: ' + err.message); // No stack trace

// BAD: Error as context field
logger.error({ error: err }, 'Error occurred'); // No stack serialization

// GOOD: Error as first argument
logger.error(err, 'Failed to create appointment'); // Full stack trace
```

### Pitfall 4: Enabling noImplicitAny Before Fixing Types
**What goes wrong:** Hundreds of type errors appear, making it impossible to identify real issues.
**Why it happens:** Existing code has many implicit `any` types that are only revealed when flag is enabled.
**How to avoid:** Fix types incrementally first, then enable flag when errors are manageable (<10).
**Warning signs:**
- Build fails with 100+ type errors
- Unable to determine which errors are critical
- Team paralyzed by error volume

```bash
# BAD: Enable noImplicitAny immediately
# tsconfig.json: "noImplicitAny": true
# Result: 150 type errors, build fails

# GOOD: Incremental approach
1. Leave noImplicitAny: false
2. Fix types in one route file at a time
3. Verify build passes after each file
4. When <10 errors remain, enable noImplicitAny: true
```

### Pitfall 5: Forgetting to Use Child Loggers for Context
**What goes wrong:** Logs lack context (salonId, userId), making debugging multi-tenant issues impossible.
**Why it happens:** Developers forget to pass context to every log call.
**How to avoid:** Create child logger early in request lifecycle, attach to req.log.
**Warning signs:**
- Can't determine which salon's data caused error
- Can't trace requests across log entries
- Searching logs requires manual correlation

```typescript
// BAD: Manual context on every call (verbose, error-prone)
logger.info({ salonId: req.user!.salonId, userId: req.user!.userId }, 'Action 1');
logger.info({ salonId: req.user!.salonId, userId: req.user!.userId }, 'Action 2');

// GOOD: Child logger with inherited context
const log = logger.child({ salonId: req.user!.salonId, userId: req.user!.userId });
log.info('Action 1'); // Context included automatically
log.info('Action 2'); // Context included automatically
```

### Pitfall 6: Using Prisma.validator with New Generator
**What goes wrong:** Type errors or runtime failures because Prisma.validator is deprecated.
**Why it happens:** Official docs still reference Prisma.validator in older examples.
**How to avoid:** Use TypeScript's native `satisfies` operator instead.
**Warning signs:**
- Prisma.validator undefined or type errors
- Documentation references don't match behavior
- Migration guides suggest updating

```typescript
// BAD: Prisma.validator (deprecated)
const filter = Prisma.validator<Prisma.UserWhereInput>()({
  email: 'test@example.com'
});

// GOOD: satisfies operator
const filter = {
  email: 'test@example.com'
} satisfies Prisma.UserWhereInput;
```

## Code Examples

Verified patterns from official sources:

### Complete Logger Setup
```typescript
// src/lib/logger.ts
// Source: https://betterstack.com/community/guides/logging/how-to-install-setup-and-use-pino-to-log-node-js-applications/
import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
  transport: isDevelopment ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss.l',
      ignore: 'pid,hostname',
    }
  } : undefined,
});

export default logger;
```

### Express Integration with Child Loggers
```typescript
// Source: https://signoz.io/guides/pino-logger/
import express from 'express';
import logger from './lib/logger.js';

const app = express();

// Option 1: Manual child logger in middleware
app.use((req, res, next) => {
  req.log = logger.child({
    requestId: req.headers['x-request-id'] || crypto.randomUUID(),
  });
  next();
});

// Option 2: Use pino-http (includes automatic request logging)
import pinoHttp from 'pino-http';
app.use(pinoHttp({ logger }));

// In route handlers
app.get('/appointments', authenticate, async (req, res) => {
  const log = req.log.child({
    salonId: req.user!.salonId,
    userId: req.user!.userId,
  });

  log.info('Fetching appointments');
  // ... query logic
  log.info({ count: appointments.length }, 'Appointments retrieved');
});
```

### Error Logging with Stack Traces
```typescript
// Source: https://betterstack.com/community/guides/logging/how-to-install-setup-and-use-pino-to-log-node-js-applications/
try {
  const appointment = await prisma.appointment.create({ data });
  logger.info({ appointmentId: appointment.id }, 'Appointment created');
} catch (err) {
  // Pass error as first argument for automatic serialization
  logger.error(err, 'Failed to create appointment');
  throw err;
}
```

### Type-Safe Prisma Filters with satisfies
```typescript
// Source: https://www.prisma.io/blog/satisfies-operator-ur8ys8ccq7zb
import { Prisma } from '@prisma/client';

// Define reusable filters with satisfies
const appointmentFilters = {
  upcoming: { startTime: { gte: new Date() } },
  confirmed: { status: 'confirmed' },
  forSalon: (salonId: string) => ({ salonId }),
} satisfies Record<string, Prisma.AppointmentWhereInput | ((id: string) => Prisma.AppointmentWhereInput)>;

// Build dynamic filter
const where = {
  ...(typeof appointmentFilters.forSalon === 'function'
    ? appointmentFilters.forSalon(req.user!.salonId)
    : appointmentFilters.forSalon),
  ...appointmentFilters.upcoming,
  ...(status && { status: status as string }),
} satisfies Prisma.AppointmentWhereInput;

const appointments = await prisma.appointment.findMany({ where });
```

### withSalonId Utility Function
```typescript
// src/lib/prismaUtils.ts
import { Prisma } from '@prisma/client';

/**
 * Creates a Prisma where clause that filters by salonId.
 * Provides type-safe tenant isolation for all queries.
 *
 * @example
 * const where = { ...withSalonId(salonId), status: 'active' };
 */
export function withSalonId(salonId: string): { salonId: string } {
  return { salonId };
}

// Alternative: Generic version with better type inference
export function createSalonFilter<T extends Prisma.ModelName>(
  model: T,
  salonId: string
): { salonId: string } {
  return { salonId };
}

// Usage in route
import { withSalonId } from '../lib/prismaUtils.js';

const where = {
  ...withSalonId(req.user!.salonId),
  status: 'confirmed',
  startTime: { gte: new Date() },
} satisfies Prisma.AppointmentWhereInput;
```

### Express Error Handler with Logger
```typescript
// src/middleware/errorHandler.ts
// Source: https://github.com/pinojs/pino/issues/673
import { Request, Response, NextFunction } from 'express';
import logger from '../lib/logger.js';
import { AppError } from '../lib/errorUtils.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Attach error to response for pino-http to log
  res.err = err;

  // Log error with context
  const log = req.log || logger;
  log.error(err, 'Request error');

  // Send error response
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // Unknown errors
  res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Prisma.validator for type-safe filters | TypeScript `satisfies` operator | TypeScript 4.9 (2022) | No runtime overhead, cleaner syntax, works with all generators |
| Winston for structured logging | Pino for high-performance logging | Ongoing (2020-2026) | 5-10x performance improvement, better for microservices |
| Manual tenant filtering | Explicit utility functions | Best practice 2024+ | Clearer than Prisma middleware, easier to audit for security |
| console.log debugging | Structured JSON logging | Production standard 2020+ | Machine-parseable, integrates with log aggregators (Datadog, Splunk, etc.) |
| noImplicitAny: false | noImplicitAny: true | TypeScript best practice since 3.0+ | Catch type errors at compile time instead of runtime |

**Deprecated/outdated:**
- **Prisma.validator:** Only works with legacy `prisma-client-js` generator. Removed in Prisma 5+. Use `satisfies` instead.
- **express-pino-logger:** Deprecated in favor of `pino-http` (same maintainers, better API)
- **Morgan for application logging:** Morgan is HTTP-only. Use Pino for full application logging with HTTP support via pino-http.

## Open Questions

Things that couldn't be fully resolved:

1. **AsyncLocalStorage for automatic context propagation**
   - What we know: Node.js 16+ supports AsyncLocalStorage for request-scoped context without manual passing
   - What's unclear: Whether the additional complexity is worth it for this phase vs. simple child loggers
   - Recommendation: Start with child loggers (simpler). Evaluate AsyncLocalStorage in future performance phase if context passing becomes problematic.

2. **Log aggregation destination**
   - What we know: Pino outputs JSON to stdout, designed for log forwarders (Fluentbit, Vector, etc.)
   - What's unclear: What log aggregation service (if any) is planned for production
   - Recommendation: JSON to stdout works with all aggregators. Defer aggregator selection to deployment phase.

3. **Request ID generation strategy**
   - What we know: pino-http can auto-generate requestId, or extract from headers
   - What's unclear: Whether frontend/load balancer sends X-Request-ID header
   - Recommendation: Use auto-generation for now: `genReqId: () => crypto.randomUUID()`. Can switch to header extraction if needed.

## Sources

### Primary (HIGH confidence)
- [Prisma satisfies operator blog](https://www.prisma.io/blog/satisfies-operator-ur8ys8ccq7zb) - TypeScript 4.9 satisfies usage with Prisma
- [Prisma type safety docs](https://www.prisma.io/docs/orm/prisma-client/type-safety) - Official Prisma type safety patterns
- [Pino logger complete guide (Better Stack)](https://betterstack.com/community/guides/logging/how-to-install-setup-and-use-pino-to-log-node-js-applications/) - Setup, child loggers, error handling
- [Pino vs Winston comparison (Better Stack)](https://betterstack.com/community/comparisons/pino-vs-winston/) - Performance benchmarks, production recommendations
- [Pino logger guide (SigNoz)](https://signoz.io/guides/pino-logger/) - Express integration, child logger patterns

### Secondary (MEDIUM confidence)
- [TypeScript incremental migration guide](https://kevinwil.de/incremental-migration/) - Verified patterns for noImplicitAny migration
- [Structured logging best practices (SigNoz)](https://signoz.io/blog/structured-logs/) - Migration patterns from console.log
- [Multi-tenant Prisma patterns (DEV)](https://dev.to/murilogervasio/how-to-make-multi-tenant-applications-with-nestjs-and-a-prisma-proxy-to-automatically-filter-tenant-queries--4kl2) - Tenant filter utility patterns
- [TypeScript noImplicitAny migration (Code Pruner)](https://codepruner.com/how-to-handle-notimplictany-during-migration-from-js-to-ts/) - Common pitfalls and solutions

### Tertiary (LOW confidence)
- WebSearch: "pino logger configuration Express middleware child logger requestId 2026" - Multiple sources agree on pino-http as standard approach
- WebSearch: "console.log replacement structured logging migration patterns 2026" - JSON format consensus across sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Pino is documented standard for Node.js performance logging, satisfies operator is official TypeScript feature
- Architecture: HIGH - Patterns verified from official Prisma and Pino documentation
- Pitfalls: MEDIUM - Based on common GitHub issues and migration guides, some from community experience

**Research date:** 2026-01-29
**Valid until:** 2026-04-29 (90 days - stable ecosystem, TypeScript and Prisma are mature)

**Codebase-specific findings:**
- 28 route files requiring type updates
- 165 console.log/warn/error calls across 37 files
- Existing `lib/errorUtils.ts` has 4 console.* calls that need updating
- Current tsconfig.json has `noImplicitAny: false` (line 12)
- Pre-existing subscription-related type errors (mentioned in STATE.md) may be revealed when enabling noImplicitAny
