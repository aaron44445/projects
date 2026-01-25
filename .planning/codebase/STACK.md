# Technology Stack

**Analysis Date:** 2026-01-25

## Languages

**Primary:**
- TypeScript 5.3.0 - Full codebase (API, web, packages)
- JavaScript (ES2020+) - Build output and scripts

**Secondary:**
- CSS (TailwindCSS) - Web app styling
- SQL (PostgreSQL via Prisma ORM) - Database queries

## Runtime

**Environment:**
- Node.js 18.0.0+ (specified in `package.json` engines)

**Package Manager:**
- pnpm 8.15.0 (monorepo package manager in `package.json`)
- Lockfile: `pnpm-lock.yaml` (present in repo)

## Frameworks

**Core:**
- Express.js 4.18.0 - Backend API server (`apps/api/package.json`)
- Next.js 14.1.0 - Frontend application (`apps/web/package.json`)
- React 18.2.0 - UI framework

**Build/Dev Tools:**
- Turbo 2.0.0 - Monorepo task orchestration (root `package.json`)
- TypeScript 5.3.0 - Type checking and compilation
- tsx 4.7.0 - TypeScript execution for Node scripts

**Database:**
- Prisma 5.8.0 - ORM and schema management (`packages/database/package.json`)
- PostgreSQL - Production database (Supabase pooled connection)

**Testing:**
- Vitest 1.2.0 - API unit tests (`apps/api/package.json`)
- Jest 29.7.0 - Web app tests (`apps/web/package.json`)
- Supertest 6.3.4 - API endpoint testing (`apps/api/package.json`)
- @testing-library/react 14.1.2 - React component testing

**Code Quality:**
- ESLint 8.56.0 - Linting (all packages)
- Prettier 3.2.0 - Code formatting (root `package.json`)
- Next.js ESLint config - Next.js specific rules

**Frontend State & Data:**
- Zustand 4.4.0 - Global state management (`apps/web/package.json`)
- @tanstack/react-query 5.17.0 - Server state/data fetching (`apps/web/package.json`)
- React Hook Form 7.49.0 - Form state management (`apps/web/package.json`)

**UI & Styling:**
- TailwindCSS 3.4.1 - Utility-first CSS framework (`apps/web/package.json`)
- shadcn/ui - Headless component library (imported via `@peacase/ui`)
- Lucide React 0.309.0 - SVG icon library (`apps/web/package.json`)
- class-variance-authority 0.7.0 - Component variant utility (`apps/web/package.json`)
- clsx 2.1.0 - Class name utility (`apps/web/package.json`)
- tailwind-merge 2.2.0 - TailwindCSS class merging (`apps/web/package.json`)

**Data Visualization:**
- Recharts 2.10.0 - React charting library (`apps/web/package.json`)

**Date/Time:**
- date-fns 3.2.0 - Date utility library (`apps/web/package.json`)

## Key Dependencies

**Critical:**
- `@prisma/client` 5.8.0 - Database client (generated from schema)
- `express` 4.18.0 - HTTP server framework
- `next` 14.1.0 - React meta-framework with SSR/SSG

**Security & Authentication:**
- `jsonwebtoken` 9.0.0 - JWT token generation and verification
- `bcryptjs` 2.4.3 - Password hashing (in API and database packages)
- `cookie-parser` 1.4.7 - HTTP cookie parsing
- `helmet` 7.1.0 - Security headers middleware
- `cors` 2.8.5 - CORS middleware

**API & HTTP:**
- `axios` 1.6.0 - HTTP client (web app)
- `@sendgrid/mail` 8.1.6 - SendGrid email SDK
- `@sendgrid/client` 8.1.6 - SendGrid client SDK
- `twilio` 5.11.2 - Twilio SMS SDK
- `stripe` 20.1.2 - Stripe payment SDK
- `cloudinary` 2.5.1 - Image upload and transformation

**File Handling:**
- `multer` 1.4.5-lts.1 - File upload middleware

**Logging & Monitoring:**
- `morgan` 1.10.0 - HTTP request logger
- `@sentry/node` 10.33.0 - Error tracking (backend)
- `@sentry/nextjs` 10.33.0 - Error tracking (frontend)

**Scheduling:**
- `node-cron` 4.2.1 - Background job scheduling (appointment reminders, GDPR deletion)

**Validation:**
- `zod` 3.22.0 - TypeScript-first schema validation (API and web)

**Environment:**
- `dotenv` 16.3.0 - Environment variable loading
- `@types/node` 20.10.0 - Node.js type definitions

## Configuration

**Environment:**
- Development: `.env.local` (git-ignored, used locally)
- Production: `.env.production` (committed to repo with secrets)
- Example: `.env.example` (template with variable names)
- TypeScript config: `tsconfig.json` (ES2020 target, strict mode)

**Build Configuration:**
- API: Uses TypeScript compiler (`tsc`) to generate `dist/` directory
- Web: Uses Next.js `next build` to generate optimized build
- Database: Prisma generates client from `schema.prisma`

**Monorepo Configuration:**
- `pnpm-workspace.yaml` - Defines workspaces: `apps/*` and `packages/*`
- `turbo.json` - Task definitions and caching
- Shared configuration imported via workspace: `@peacase/database`, `@peacase/types`, `@peacase/ui`

## Platform Requirements

**Development:**
- Node.js >= 18.0.0
- pnpm >= 8.15.0
- TypeScript knowledge (strict mode enabled)
- PostgreSQL database connection (local or remote)

**Production:**
- **API Hosting:** Render.com (Node.js web service)
  - Root directory: `spa-final/` (referenced in render.yaml at repo root)
  - Build command: `npm install -g pnpm && NODE_ENV=development pnpm install && pnpm --filter @peacase/database exec prisma generate && pnpm --filter @peacase/database build && pnpm --filter @peacase/api build`
  - Start command: `node apps/api/dist/index.js`
  - Health check: `/health` endpoint
  - Free tier allocation

- **Web Hosting:** Vercel (Next.js platform)
  - Auto-deploys on push to main branch
  - Optimized for Next.js 14

- **Database:** Supabase PostgreSQL
  - Pooled connection: `DATABASE_URL` (pgbouncer)
  - Direct connection: `DIRECT_URL` (for migrations)
  - Password special characters must be URL-encoded

**Key URLs:**
- Production API: `https://api.peacase.com` (Render)
- Production Web: `https://peacase.com` (Vercel)
- API Development: `http://localhost:3001`
- Web Development: `http://localhost:4000` (see web `package.json` dev script)

---

*Stack analysis: 2026-01-25*
