# Coding Conventions

**Analysis Date:** 2026-01-25

## Naming Patterns

**Files:**
- Backend route handlers: kebab-case (e.g., `auth.ts`, `client-portal.ts`, `staff-portal.ts`)
- Backend service files: camelCase (e.g., `email.ts`, `sms.ts`, `payments.ts`)
- Frontend components: PascalCase (e.g., `AuthGuard.tsx`, `ThemeToggle.tsx`, `AppSidebar.tsx`)
- Frontend pages: camelCase with directory structure (e.g., `page.tsx` in `app/login/`, `app/dashboard/`)
- Test files: `*.test.ts` or `*.test.tsx` in `__tests__` directories
- Context/Provider: PascalCase (e.g., `AuthContext.tsx`)

**Functions:**
- Async handlers in routes: camelCase verb-based (e.g., `createAndSendVerificationEmail`, `normalizeAuthInput`, `generateVerificationToken`)
- Middleware functions: camelCase with context (e.g., `authenticate`, `errorHandler`, `asyncHandler`, `withDatabaseRetry`)
- React hooks: camelCase with `use` prefix (e.g., `useAuth`, `useAppointments`, `useAccount`)
- Helper/utility functions: camelCase verb-based (e.g., `handleDatabaseError`, `isTransientError`, `sleep`)

**Variables:**
- Constants: UPPER_SNAKE_CASE (e.g., `JWT_SECRET`, `CORS_ORIGIN`)
- Regular variables: camelCase (e.g., `userId`, `salonId`, `refreshToken`)
- Database model instances: camelCase (e.g., `mockUser`, `mockSalon`, `mockToken`)
- TypeScript interfaces: PascalCase (e.g., `JWTPayload`, `AuthGuardProps`, `AppError`)
- Union type aliases: camelCase with pipe (e.g., `AppointmentStatus = 'confirmed' | 'pending' | 'cancelled'`)

**Types:**
- Request/Response types: inherit from Express (e.g., `Request`, `Response`, `NextFunction`)
- Prisma models: PascalCase (e.g., `User`, `Salon`, `Appointment`)
- Interface naming: PascalCase with descriptive suffix (e.g., `JWTPayload`, `AuthGuardProps`, `CreateAppointmentInput`)
- Enum-like types: PascalCase with union literals

## Code Style

**Formatting:**
- Prettier with specific config:
  - `semi: true` - require semicolons
  - `singleQuote: true` - use single quotes for strings
  - `tabWidth: 2` - 2-space indentation
  - `trailingComma: "es5"` - trailing commas in ES5-compatible objects/arrays
  - `printWidth: 100` - line length limit
  - `plugins: ["prettier-plugin-tailwindcss"]` - auto-organize Tailwind classes

**Linting:**
- ESLint configured via `apps/api/.eslintrc.json` (appears to be missing but referenced in git status)
- TypeScript strict mode enabled globally in `tsconfig.json`:
  - `strict: true` - all strict type checking
  - `noUnusedLocals: true` - error on unused variables
  - `noUnusedParameters: true` - error on unused parameters
  - `noFallthroughCasesInSwitch: true` - require explicit case handling

## Import Organization

**Order:**
1. External packages (e.g., `express`, `bcryptjs`, `jsonwebtoken`, `zod`)
2. Project packages (e.g., `@peacase/database`, `@peacase/ui`)
3. Local modules (relative imports from `../lib`, `../middleware`, `../services`)
4. Type imports (e.g., `import type { Metadata } from 'next'`)

**Path Aliases:**
- Backend: `@` resolves to `src/` in `vitest.config.ts`
- Frontend: `@/` resolves to `src/` in module mapping (e.g., `@/components`, `@/hooks`, `@/contexts`)
- Both defined in `tsconfig.json` via module name mapper

**Import Extensions:**
- Backend: `.js` extensions used explicitly in ESM imports (e.g., `from '../routes/auth.js'`)
- Frontend: `.tsx`/`.ts` extensions omitted in import paths (Next.js convention)

## Error Handling

**Patterns:**
- Custom `AppError` class in `src/lib/errorUtils.ts`:
  - Constructor: `AppError(message, statusCode, code, details?)`
  - Used for all API errors with appropriate HTTP status codes
  - Includes optional `details` object for field-specific validation errors

- `asyncHandler` wrapper function for Express route handlers:
  - Wraps async route handlers to catch Promise rejections
  - Automatically passes errors to central error handler middleware
  - Usage: `router.post('/route', asyncHandler(async (req, res) => { ... }))`

- `handleDatabaseError` function:
  - Converts Prisma errors to AppError instances
  - Maps Prisma error codes (P2002, P2003, P2025, etc.) to meaningful HTTP status codes
  - Returns 409 for duplicate entries (P2002)
  - Returns 404 for not found (P2025)
  - Returns 503 for connection issues
  - Logs original error for debugging

- Error middleware in `src/middleware/errorHandler.ts`:
  - Single error handler receives all errors
  - Returns JSON response: `{ success: false, error: { code, message, details } }`
  - Only reports 5xx errors to Sentry (not user-facing validation errors)
  - Uses `IGNORED_ERROR_CODES` set to exclude expected errors from monitoring

**API Response Format:**
```typescript
// Success
{ success: true, data?: any }

// Error
{ success: false, error: { code: string, message: string, details?: Record<string, string> } }
```

## Logging

**Framework:** Native `console` (no dedicated logger library)

**Patterns:**
- Use `console.error()` for errors with context prefix: `console.error('[Database Error]', error)`
- Use `console.log()` for informational messages: `console.log('[Database] Retry attempt 1/3 after 100ms')`
- Use `console.warn()` for warnings: `console.warn('Database-dependent tests will be skipped')`
- Prefix logs with context in brackets: `[Database Error]`, `[Critical]`, `[Api]`
- Skip logging entirely in test mode (`NODE_ENV === 'test'`): `if (!isTest) { app.use(morgan('dev')); }`

**Sentry Integration:**
- Error reporting via `setSentryUser()` in auth middleware
- Only 5xx errors with unexpected error codes are reported
- User context includes: `id`, `salonId`, `role`

## Comments

**When to Comment:**
- Complex business logic that isn't obvious (e.g., "24 hours from now", multi-step operations)
- Gotchas or edge cases (e.g., "Delete any existing verification tokens for this user")
- Large comment blocks explaining an entire function's purpose
- Section separators for middleware/routes grouping (e.g., `// ============================================`)

**JSDoc/TSDoc:**
- Used for documented functions and error classes
- Format: `/** ... */` with single-line or multi-line descriptions
- Examples from `errorUtils.ts`:
  ```typescript
  /**
   * Custom error class for API errors with status codes
   */
  export class AppError extends Error { ... }

  /**
   * Async handler wrapper for Express route handlers
   * Catches async errors and passes them to the error handler
   */
  export function asyncHandler(...) { ... }
  ```

## Function Design

**Size:**
- Helper functions in routes typically 10-30 lines (e.g., `generateVerificationToken`, `normalizeAuthInput`)
- Service functions 20-80 lines (e.g., `createAndSendVerificationEmail`)
- Route handlers wrapped with `asyncHandler` for reusability

**Parameters:**
- Express route handlers: `(req: Request, res: Response) => Promise<void>`
- Helper functions: explicit typed parameters (e.g., `userId: string, email: string, salonName: string`)
- Async utilities: single operation function + options object pattern:
  ```typescript
  export async function withDatabaseRetry<T>(
    operation: () => Promise<T>,
    options?: { maxRetries?: number; initialDelay?: number; ... }
  )
  ```

**Return Values:**
- Route handlers: void (response sent via `res`)
- Helper functions: return typed values or `Promise<T>`
- Boolean returns for operation success (e.g., `sendEmail()` returns `Promise<boolean>`)
- Middleware: void with `next()` call or error response

## Module Design

**Exports:**
- Named exports preferred (e.g., `export function authenticate(...) { }`)
- Single export per file (e.g., one Router per route file)
- Barrel exports in index files (e.g., `apps/web/src/hooks/index.ts` exports all hooks)

**Barrel Files:**
- `src/hooks/index.ts` re-exports all custom hooks from module
- Allows cleaner imports: `import { useAuth, useAppointments } from '@/hooks'`
- Used for grouping related exports

**Router Pattern:**
- Each route file creates a Router instance: `const router = Router()`
- Defines all route handlers within the file
- Exports as named export: `export { router as authRouter }`
- Imported and registered in `src/app.ts`: `app.use('/api/v1/auth', authRouter)`

## Validation

**Framework:** Zod for schema validation

**Patterns:**
- Define schemas at module level:
  ```typescript
  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  });
  ```
- Use in route handlers:
  ```typescript
  const data = loginSchema.parse(normalizedInput);
  ```
- Input normalization before validation (e.g., trim and lowercase email)
- Field-level error details passed to AppError for client response

## Database Queries

**Patterns:**
- Always include `where: { salonId: req.user!.salonId }` for multi-tenant isolation
- Use Prisma client from `@peacase/database` package
- Wrap critical operations with `withDatabaseRetry()` for transient failure handling
- Use `withTimeout()` for operations that might hang (default 30s)
- Handle specific Prisma error codes in `handleDatabaseError()`

**Connection:**
- Connection pooling via Supabase (production)
- Prisma handles connection lifecycle
- Test database uses separate `DATABASE_URL` from `.env.test`

---

*Convention analysis: 2026-01-25*
