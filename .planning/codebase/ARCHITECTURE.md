# Architecture

**Analysis Date:** 2026-01-25

## Pattern Overview

**Overall:** Multi-tenant monorepo with three-tier architecture (frontend/API/database) deployed across separate platforms.

**Key Characteristics:**
- Monorepo structure (pnpm workspaces) with shared packages for types, database, and UI
- Clear separation between web frontend (Next.js on Vercel) and API backend (Express on Render)
- Multi-tenant SaaS with tenant isolation via `salonId` on all queries
- Feature-gated architecture with modular add-ons controlled via `Salon.featuresEnabled`
- Portal-based multi-role access (owner/manager/staff/client)
- ESM modules with TypeScript strict mode throughout

## Layers

**Presentation Layer (Frontend):**
- Purpose: Client-facing UI for salon owners, staff, and booking clients
- Location: `apps/web/src/`
- Contains: React components, Next.js pages, hooks, context providers
- Depends on: API layer, shared types, UI components
- Used by: Browser clients (salon staff, owners, booking customers)
- Key files: `apps/web/src/app/` (pages), `apps/web/src/components/` (reusable UI), `apps/web/src/hooks/` (data fetching)

**API Layer (Backend):**
- Purpose: REST API handling business logic, authentication, integrations, and data operations
- Location: `apps/api/src/`
- Contains: Express routes, middleware, services, cron jobs
- Depends on: Database layer, external services (Stripe, SendGrid, Twilio, Sentry)
- Used by: Frontend, webhooks, staff portal, client portal
- Key files: `apps/api/src/routes/` (endpoints), `apps/api/src/services/` (business logic), `apps/api/src/middleware/` (auth/validation)

**Database Layer:**
- Purpose: Data persistence, ORM client, schema definitions
- Location: `packages/database/`
- Contains: Prisma schema, migrations, client initialization
- Depends on: PostgreSQL (Supabase)
- Used by: API layer exclusively
- Schema: `packages/database/prisma/schema.prisma` (Salon, User, Appointment, Service, Client, etc.)

**Shared Packages:**
- Purpose: Reusable code across web and API
- Location: `packages/`
- Contains:
  - `types/`: Shared TypeScript interfaces and enums
  - `ui/`: shadcn/ui component library with TailwindCSS
  - `database/`: Prisma client and types

## Data Flow

**Authentication & Authorization:**

1. User submits login credentials (`/login`)
2. API validates email/password, verifies salon ownership/staff status
3. API issues JWT (access + refresh tokens) with `userId`, `salonId`, `role` claims
4. Frontend stores tokens in localStorage and sets Authorization header
5. All subsequent requests include Bearer token
6. `authenticate` middleware validates JWT signature and expiry
7. `authorize` middleware checks role-based permissions

**Appointment Booking Flow (Owner Portal):**

1. Owner creates appointment via UI (`/app/calendar` → POST `/api/v1/appointments`)
2. API validates: auth, client exists, staff available, salon booking enabled
3. Prisma creates Appointment record with multi-location support
4. Event triggers email/SMS services if enabled
5. Calendar UI polls `/api/v1/appointments` with date filters
6. Real-time updates via conditional fetching (not WebSockets)

**Public Booking Flow (Client Portal):**

1. Client visits public booking page (`/embed/[slug]` or salon's widget)
2. Frontend fetches availability from public API without auth
3. Client selects time/service/staff
4. POST `/api/v1/client-auth/book` creates appointment + client record
5. Confirmation email sent via SendGrid
6. SMS reminder queued (if Twilio configured)

**Subscription & Billing:**

1. Salon subscribes during onboarding
2. Stripe customer created, subscription stored in DB
3. Webhook handler (`/api/v1/webhooks/stripe`) updates Salon record
4. Frontend checks `Salon.featuresEnabled` array to conditionally render features
5. Add-on purchases append feature to array
6. Cron job checks for expired/failed payments

**Email & SMS Integration:**

1. Events trigger email/SMS (appointment confirmations, reminders, marketing)
2. Services layer (`email.ts`, `sms.ts`) check if integrations enabled
3. Salon can provide custom SendGrid API key (encrypted in `Salon.sendgridApiKeyEncrypted`)
4. Fallback to platform SendGrid if no custom key
5. SMS via Twilio (custom creds also supported)
6. Failed sends logged but don't block request (wrapped in try/catch)

**State Management:**

- **Authentication**: React Context (`AuthContext.tsx`) persists user/tokens
- **Salon Settings**: `SalonSettingsContext` holds timezone, currency, locale
- **Subscription**: `SubscriptionContext` tracks enabled add-ons
- **Data Fetching**: Custom hooks (`useAppointments`, `useClients`, etc.) with fetch + useState
- **No Redux/Zustand**: Simpler contexts sufficient for current complexity
- **Theme**: `ThemeContext` manages light/dark mode

## Key Abstractions

**Multi-Tenant Isolation:**
- Purpose: Ensure data isolation between salons
- Pattern: Every table has `salonId` foreign key, all queries filtered by `req.user.salonId`
- Examples: `appointments.router.get()` filters by salon, `services.router` checks salonId ownership
- Impact: Failed to filter = data leak; must audit all endpoints for `where: { salonId }`

**Feature Gating:**
- Purpose: Control which features are enabled per salon tier
- Pattern: `Salon.featuresEnabled` is JSON array of feature flags (e.g., `["online-booking", "gift-cards"]`)
- Example: `useSubscription()` hook checks ADD_ON_DETAILS to render conditionally
- Files: `apps/web/src/components/FeatureGate.tsx`, `apps/web/src/contexts/SubscriptionContext.tsx`

**Permission System:**
- Purpose: Role-based access control (RBAC) with location-based restrictions
- Pattern: `PERMISSIONS` enum, `hasPermission(role, permission)`, `requirePermission` middleware
- Roles: `owner`, `manager`, `staff`, `client`
- Example: Manager can only view appointments at assigned locations via `getUserLocationIds()`
- Files: `apps/api/src/middleware/permissions.ts`, `apps/api/src/middleware/auth.ts`

**Error Handling Abstraction:**
- Purpose: Consistent error responses and Sentry reporting
- Pattern: `AppError` with statusCode/code/details, `errorHandler` catches and formats
- Expected errors (auth failures, validation) NOT reported to Sentry
- Unexpected 5xx errors reported with context (path, method, userAgent)
- Files: `apps/api/src/middleware/errorHandler.ts`, `apps/api/src/lib/errorUtils.ts`

**Rate Limiting:**
- Purpose: Prevent abuse, protect auth endpoints
- Pattern: In-memory store (`node-rate-limiter-flexible`), resets on deploy
- Different limits per endpoint: login (5/15min), signup (3/15min), general API (100/1min)
- Files: `apps/api/src/middleware/rateLimit.ts`

**Async Route Handlers:**
- Purpose: Centralized error catching for Express routes
- Pattern: `asyncHandler` wraps route handlers, catches errors and passes to middleware
- Ensures all rejections properly formatted as JSON responses
- Files: `apps/api/src/lib/errorUtils.ts`

## Entry Points

**API Server:**
- Location: `apps/api/src/index.ts`
- Triggers: `pnpm dev` or node process on Render
- Responsibilities: Load environment, initialize Sentry, create Express app, register middleware/routes, start server on port 3001
- Special: Environment must load first (via `loadEnv.js`), Sentry initialized before other imports

**Web Frontend:**
- Location: `apps/web/src/app/page.tsx` (landing), `apps/web/src/app/login/page.tsx` (auth)
- Triggers: Browser navigation, Vercel deployment
- Responsibilities: Render layout, protect routes with AuthGuard, fetch initial auth state from localStorage
- Special: Uses Next.js App Router (pages in `app/` directory), client components marked with `'use client'`

**Cron Jobs:**
- Location: `apps/api/src/cron/index.ts`
- Triggers: Started after server initialization (`startCronJobs()` called in index.ts)
- Responsibilities: Appointment reminders, marketing emails, subscription renewal checks
- Note: Runs on single instance; no distributed locking

## Error Handling

**Strategy:** Explicit error handling with type-safe responses and selective Sentry reporting.

**Patterns:**

- **API Responses:** Consistent shape `{ success: boolean, data?: T, error?: { code: string, message: string, details?: {...} } }`
- **HTTP Status Codes:** 401 (auth), 403 (permission), 400 (validation), 404 (not found), 500 (server error)
- **Error Codes:** Machine-readable codes (UNAUTHORIZED, TOKEN_EXPIRED, VALIDATION_ERROR) for frontend routing
- **Validation:** Zod schemas on route handlers validate input shape and types
- **Async Handling:** `asyncHandler` catches promise rejections and passes to error middleware
- **Sentry Filtering:** Expected errors not reported (rate limits, auth failures); unexpected 5xx errors sent with context
- **Email/SMS Failures:** Wrapped in try/catch, logged to console but don't fail requests (async non-blocking)

## Cross-Cutting Concerns

**Logging:**
- Morgan middleware logs HTTP requests in dev (skipped in test mode)
- Console.error in error handler for exceptions
- Sentry captures severity levels and full stack traces
- No structured logging (JSON logs); file: `apps/api/src/middleware/errorHandler.ts`

**Validation:**
- Zod schemas validate request body/params on every route
- Custom validators for complex fields (email format, date ranges, role values)
- Error details returned with specific field messages for frontend display
- File: `apps/api/src/routes/*.ts` (inline schemas at route start)

**Authentication:**
- JWT with HS256 signature, 24-hour expiry for access tokens
- Refresh tokens stored in httpOnly cookies (for future enhancement)
- `authenticate` middleware on all protected routes
- No session storage; stateless architecture
- File: `apps/api/src/middleware/auth.ts`

**Authorization:**
- Role-based (RBAC) and location-based restrictions
- `authorize(...roles)` middleware checks role membership
- Salon owner = full access; manager = location-specific; staff = self-only
- Additional permission checks inside routes for fine-grained control
- File: `apps/api/src/middleware/permissions.ts`

**Security:**
- Helmet.js sets security headers (CSP, X-Frame-Options, etc.)
- CORS restricted to frontend origin (configurable via env)
- Stripe webhooks use raw body parser (before JSON parser) for signature verification
- Password hashing via bcryptjs (10 salt rounds)
- API keys encrypted at rest in database (`sendgridApiKeyEncrypted`, `twilioAuthTokenEncrypted`)
- CSRF tokens for state-changing operations (experimental)
- No sensitive data logged (tokens, passwords, PII)

**Performance:**
- Prisma query logging in dev for N+1 detection (logs queries > 200ms)
- Lazy imports for heavy dependencies (e.g., Sentry)
- In-memory rate limiting (no Redis)
- Database connection pooling via Supabase PgBouncer
- No query caching; rely on database query efficiency and client-side caching

---

*Architecture analysis: 2026-01-25*
