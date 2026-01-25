# Codebase Structure

**Analysis Date:** 2026-01-25

## Directory Layout

```
spa-final/
├── apps/
│   ├── api/                    # Express.js REST API backend (Render)
│   │   ├── src/
│   │   │   ├── index.ts        # Server entry point (loads env, starts server)
│   │   │   ├── app.ts          # Express app factory (createApp)
│   │   │   ├── loadEnv.js      # ESM dotenv loader (must be first import)
│   │   │   ├── routes/         # REST endpoint handlers
│   │   │   ├── services/       # Business logic (email, SMS, payments)
│   │   │   ├── middleware/     # Auth, validation, error handling
│   │   │   ├── lib/            # Utilities (env config, error utils, encryption)
│   │   │   ├── cron/           # Scheduled jobs (reminders, cleanup)
│   │   │   └── __tests__/      # Jest test files
│   │   ├── dist/               # Compiled JavaScript (generated)
│   │   └── package.json        # API dependencies
│   │
│   └── web/                    # Next.js 14 frontend (Vercel)
│       ├── src/
│       │   ├── app/            # Next.js App Router pages (route.ts, page.tsx)
│       │   ├── components/     # Reusable React components
│       │   ├── contexts/       # React Context providers (Auth, Subscription, etc.)
│       │   ├── hooks/          # Custom React hooks (data fetching)
│       │   ├── lib/            # Utilities (API client, i18n, helpers)
│       │   └── __tests__/      # Vitest test files
│       ├── public/             # Static assets
│       └── package.json        # Web dependencies
│
├── packages/
│   ├── database/               # Prisma ORM + database client
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Data model definitions
│   │   │   └── migrations/     # SQL migration files
│   │   ├── src/
│   │   │   └── index.ts        # Prisma client initialization
│   │   └── package.json        # Database dependencies
│   │
│   ├── types/                  # Shared TypeScript types
│   │   └── src/                # Type definitions used by API and web
│   │
│   └── ui/                     # shadcn/ui component library
│       ├── src/
│       │   ├── components/     # Reusable UI components (Button, Card, etc.)
│       │   └── lib/            # TailwindCSS utilities
│       └── package.json        # UI dependencies
│
├── .planning/
│   └── codebase/               # GSD codebase documentation
│
├── scripts/                    # Utility scripts (env verification, secret generation)
├── docs/                       # Product documentation, plans
├── package.json                # Root workspace configuration
├── pnpm-workspace.yaml         # pnpm monorepo settings
├── turbo.json                  # Turborepo build orchestration
├── tsconfig.json               # Root TypeScript config
├── .prettierrc                 # Code formatting rules
└── render.yaml                 # Render deployment config (in repo root)
```

## Directory Purposes

**`apps/api/src/routes/`:**
- Purpose: REST endpoint definitions, one file per resource
- Contains: Router definitions with GET/POST/PUT/DELETE handlers
- Pattern: Each file exports `export const resourceRouter = Router()`
- Files:
  - `auth.ts` - Login, signup, password reset, token refresh
  - `appointments.ts` - Appointment CRUD, filtering, status updates
  - `clients.ts` - Client management, history
  - `services.ts` - Service offerings, categories, pricing
  - `staff.ts` - Staff management, scheduling, commissions
  - `dashboard.ts` - Stats, metrics, revenue
  - `public.ts` - Public endpoints (no auth required)
  - `onboarding.ts` - Setup flow endpoints
  - `webhooks.ts` - Third-party integrations (Stripe, etc.)
  - `staffPortal.ts` - Staff self-service endpoints
  - `clientPortal.ts` - Client portal endpoints
  - `gdpr.ts` - Data export/deletion requests
  - Plus: billing, reports, reviews, gift-cards, packages, locations, etc.

**`apps/api/src/services/`:**
- Purpose: Business logic separated from route handlers
- Contains: Email templating, SMS sending, payment processing, subscriptions
- Files:
  - `email.ts` - SendGrid integration, email templates (HTML), rate limiting
  - `sms.ts` - Twilio integration, SMS message templates
  - `payments.ts` - Stripe payment creation and error handling
  - `subscriptions.ts` - Subscription management, plan logic, billing
  - `upload.ts` - File upload to Cloudinary, validation

**`apps/api/src/middleware/`:**
- Purpose: Request/response processing, auth, validation
- Pattern: Each middleware is a function or factory function
- Files:
  - `auth.ts` - JWT validation, role extraction, Sentry user context
  - `permissions.ts` - RBAC checks, location-based filtering for managers
  - `errorHandler.ts` - Centralized error formatting, Sentry reporting
  - `rateLimit.ts` - Per-endpoint rate limiting (login, signup, general API)
  - `csrf.ts` - CSRF token generation/validation (experimental)
  - `clientAuth.ts` - Public client authentication (no JWT)
  - `staffAuth.ts` - Staff portal authentication

**`apps/api/src/lib/`:**
- Purpose: Shared utilities and configuration
- Files:
  - `env.ts` - Environment variable schema (Zod), default values
  - `errorUtils.ts` - `asyncHandler` wrapper, error creation helpers
  - `encryption.ts` - AES encryption/decryption for stored credentials
  - `sentry.ts` - Sentry initialization, error capture

**`apps/api/src/cron/`:**
- Purpose: Scheduled background jobs
- Files: Appointment reminders, marketing emails, subscription renewal checks
- Runs: After server starts, non-distributed

**`apps/web/src/app/`:**
- Purpose: Next.js App Router pages (file-based routing)
- Structure: `[route]/page.tsx` files become routes
- Examples:
  - `page.tsx` - Landing page
  - `login/page.tsx` - Login form
  - `dashboard/page.tsx` - Owner dashboard
  - `calendar/page.tsx` - Appointment calendar
  - `staff/setup/page.tsx` - Staff onboarding
  - `embed/[slug]/page.tsx` - Dynamic public booking page
  - `portal/page.tsx` - Client portal
  - `staff/dashboard/page.tsx` - Staff dashboard
- Pattern: Each page is a Server or Client component; state management via Context + hooks

**`apps/web/src/components/`:**
- Purpose: Reusable React components
- Files:
  - `AppSidebar.tsx` - Main navigation sidebar
  - `AuthGuard.tsx` - Redirect unauthenticated users to /login
  - `OnboardingGuard.tsx` - Redirect incomplete onboarding to setup
  - `FeatureGate.tsx` - Conditionally render based on subscription
  - `NotificationDropdown.tsx` - User notifications
  - `LocationSwitcher.tsx` - Multi-location selection UI
  - `ThemeToggle.tsx` - Dark/light mode button
  - `BookingModal.tsx` - Booking form overlay
  - `HelpBot.tsx` - Customer support chatbot
  - `StaffPortalSidebar.tsx` - Staff navigation
  - `LoadingSkeleton.tsx` - Placeholder during data fetch
  - `ErrorBoundary.tsx` - React error catching
- Pattern: All marked with `'use client'` (client components), use hooks for state

**`apps/web/src/hooks/`:**
- Purpose: Custom React hooks for data fetching and state management
- Files:
  - `useAppointments.ts` - Fetch/create/update appointments
  - `useClients.ts` - Fetch/search clients
  - `useStaff.ts` - Fetch staff members
  - `useServices.ts` - Fetch services and categories
  - `useDashboard.ts` - Fetch dashboard stats
  - `useReports.ts` - Fetch reports and analytics
  - `useGiftCards.ts` - Fetch gift card data
  - `useMarketing.ts` - Fetch marketing campaigns
  - `useLocations.tsx` - Fetch locations, location context
  - `usePermissions.ts` - Check current user permissions
  - `useSalon.ts` - Fetch salon info
  - `useUpload.ts` - File upload to Cloudinary
  - `useAccount.ts` - Account settings
  - `useTeam.ts` - Team/staff management
  - `useOwnerNotifications.ts` - Fetch owner notifications
- Pattern: Fetch from `api.request()`, handle errors, return `{ data, loading, error }`

**`apps/web/src/contexts/`:**
- Purpose: React Context providers for global state
- Files:
  - `AuthContext.tsx` - User, tokens, login/logout, token refresh
  - `SubscriptionContext.tsx` - Enabled add-ons, plan tier, feature checking
  - `SalonSettingsContext.tsx` - Timezone, currency, locale from API
  - `ClientAuthContext.tsx` - Public booking client authentication
  - `StaffAuthContext.tsx` - Staff portal authentication
  - `ThemeContext.tsx` - Light/dark mode
- Pattern: Provider wraps app, `useContext(XyzContext)` to access state

**`apps/web/src/lib/`:**
- Purpose: Utilities and client-side helpers
- Files:
  - `api.ts` - ApiClient class, request/response handling, token refresh
  - `i18n.ts` - Internationalization helpers

**`packages/database/prisma/`:**
- Purpose: Data model and migrations
- Schema path: `schema.prisma`
- Models: Salon, User, Appointment, Client, Service, Staff, Location, Payment, Subscription, Review, GiftCard, Package, MarketingCampaign, ConsultationForm, CommissionRecord, etc.
- Migrations: SQL files from `prisma migrate` commands, numbered by timestamp

**`packages/database/src/`:**
- Purpose: Prisma client initialization with logging and error handling
- File: `index.ts` exports singleton `prisma` client, configures logging/slow query detection

**`packages/types/src/`:**
- Purpose: Shared TypeScript types (used by API and web)
- Contents: User roles, appointment statuses, service types, response types

**`packages/ui/src/components/`:**
- Purpose: shadcn/ui component library (Button, Card, Dialog, Input, etc.)
- Styling: TailwindCSS classes

## Key File Locations

**Entry Points:**
- `apps/api/src/index.ts`: API server startup (environment, Sentry, routes, cron)
- `apps/web/src/app/layout.tsx`: Web root layout (providers, global styles)
- `apps/web/src/app/page.tsx`: Landing page

**Configuration:**
- `apps/api/src/lib/env.ts`: API environment schema
- `packages/database/prisma/schema.prisma`: Data model
- `turbo.json`: Build task definitions
- `tsconfig.json`: TypeScript compiler options
- `.prettierrc`: Code formatting
- `render.yaml`: Render deployment (in repo root!)

**Core Logic:**
- `apps/api/src/routes/`: All endpoint logic
- `apps/api/src/services/email.ts`: Email templates and SendGrid integration
- `apps/api/src/middleware/auth.ts`: JWT validation
- `apps/api/src/middleware/permissions.ts`: RBAC and location filtering
- `apps/web/src/contexts/AuthContext.tsx`: Authentication state
- `apps/web/src/contexts/SubscriptionContext.tsx`: Feature gating

**Testing:**
- `apps/api/src/__tests__/`: API tests (Jest)
- `apps/web/src/__tests__/`: Web tests (Vitest)

## Naming Conventions

**Files:**
- Routes: `lowercase.ts` (e.g., `auth.ts`, `appointments.ts`)
- Components: `PascalCase.tsx` (e.g., `AuthGuard.tsx`, `BookingModal.tsx`)
- Hooks: `usePascalCase.ts` (e.g., `useAppointments.ts`, `useServices.ts`)
- Types: `lowercase.ts` or inline in `types/src/` (e.g., `types.ts`)
- Utilities: `lowercase.ts` (e.g., `api.ts`, `errorUtils.ts`)
- Models: `PascalCase` in schema (e.g., `Salon`, `Appointment`, `User`)

**Variables:**
- camelCase for functions, variables, properties
- UPPERCASE for constants (e.g., `PERMISSIONS`, `IGNORED_ERROR_CODES`, `API_BASE`)
- PascalCase for classes and types (e.g., `ApiClient`, `AppError`, `JWTPayload`)

**Directories:**
- lowercase (e.g., `routes/`, `services/`, `middleware/`, `lib/`, `components/`, `hooks/`, `contexts/`)
- Plural when grouping similar files (e.g., `routes/`, `services/`, `migrations/`)

## Where to Add New Code

**New Feature (Backend):**
1. Create/update Prisma schema in `packages/database/prisma/schema.prisma`
2. Run `pnpm --filter @peacase/database db:migrate` to generate migration
3. Add route handler in `apps/api/src/routes/[resource].ts` or new file
4. Add service functions in `apps/api/src/services/` if complex logic
5. Add middleware checks in `apps/api/src/middleware/permissions.ts` if permission-based
6. Add tests in `apps/api/src/__tests__/`
7. Update types in `packages/types/src/` if new shared types needed

**New Frontend Page:**
1. Create directory `apps/web/src/app/[route]/`
2. Add `page.tsx` (e.g., `apps/web/src/app/inventory/page.tsx`)
3. Wrap with `AuthGuard` and/or `OnboardingGuard` if protected
4. Create hooks in `apps/web/src/hooks/use[Feature].ts` for data fetching
5. Create components in `apps/web/src/components/` as needed
6. Add tests in `apps/web/src/__tests__/`

**New Reusable Component:**
1. Add to `apps/web/src/components/[ComponentName].tsx`
2. Mark with `'use client'` if using hooks/state
3. Export from component file
4. Use in pages via import

**New Hook:**
1. Add to `apps/web/src/hooks/use[HookName].ts`
2. Follow pattern: fetch from API, manage loading/error/data state
3. Export hook function
4. Use in components via `const { data, loading, error } = useHook()`

**New Utility:**
- Shared: `packages/database/src/` or `packages/types/src/`
- API-only: `apps/api/src/lib/`
- Web-only: `apps/web/src/lib/`
- Component helpers: `apps/web/src/lib/`

**New Integration:**
1. Add service file in `apps/api/src/services/[integration].ts`
2. Create wrapper functions for initialization and main operations
3. Handle errors gracefully (wrap in try/catch, don't fail request)
4. Add environment variables to `apps/api/src/lib/env.ts`
5. Encrypt sensitive credentials using `apps/api/src/lib/encryption.ts`

## Special Directories

**`apps/api/dist/`:**
- Purpose: Compiled JavaScript output from TypeScript
- Generated: Yes (via `pnpm build`)
- Committed: No (in .gitignore)
- Note: Render deploys from this directory; must run `pnpm build` before pushing

**`apps/web/.next/`:**
- Purpose: Next.js compiled output and build cache
- Generated: Yes (via `pnpm build` or `next build`)
- Committed: No (in .gitignore)
- Note: Vercel regenerates on deploy; local .next can be deleted safely

**`.planning/codebase/`:**
- Purpose: GSD (Guided System Design) documentation
- Documents: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, STACK.md, INTEGRATIONS.md, CONCERNS.md
- Generated: No (manually maintained)
- Committed: Yes (version control)

**`packages/database/migrations/`:**
- Purpose: Prisma migration SQL files
- Generated: Yes (via `prisma migrate dev` or `prisma migrate create`)
- Committed: Yes (essential for database schema version control)
- Pattern: Numbered by timestamp (e.g., `20260115001315_add_marketing_addon_fields/`)

**`docs/plans/`:**
- Purpose: Planning documents for features and improvements
- Generated: Yes (created by GSD planning tool)
- Committed: Yes
- Note: References codebase structure and conventions

---

*Structure analysis: 2026-01-25*
