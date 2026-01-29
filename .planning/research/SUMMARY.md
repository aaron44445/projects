# Project Research Summary

**Project:** Peacase Staff Portal v1.2
**Domain:** Staff self-service portal for spa/salon SaaS
**Researched:** 2026-01-29
**Confidence:** HIGH

## Executive Summary

The Peacase Staff Portal is an extension to an existing multi-tenant spa/salon booking system that enables staff to authenticate, view their schedules, track earnings, manage availability, and request time off. Research shows that 95% of required infrastructure already exists—JWT authentication with role-based access, commission tracking, appointment management, and time-off workflows are production-ready. The primary challenge is not building new features but safely integrating staff access into a production system serving paying customers without compromising tenant isolation or breaking existing booking workflows.

The recommended approach prioritizes authentication security first (establishing separate staff token paths with portal verification), then data visibility rules (ensuring staff can only access their own salon's data with appropriate field-level filtering), followed by feature rollout (schedule, earnings, availability). The only new technology required is Luxon 3.7.2 for robust timezone-aware time tracking in multi-location salons—everything else leverages the existing Next.js 14, Express, Prisma 5.22, PostgreSQL stack.

Critical risks center on authentication path confusion (dual login systems sharing JWT infrastructure without proper portal claims), multi-tenant isolation weakening (staff queries missing salonId filters), and earnings calculation race conditions (concurrent appointment completion). These are preventable through disciplined security patterns: portal claims in JWTs, mandatory dual-filtering (staffId + salonId), and database transactions for financial operations. Research confidence is high because the codebase already implements sophisticated multi-tenant patterns—the task is extending them correctly, not inventing new approaches.

## Key Findings

### Recommended Stack

**No major stack changes required.** The existing technology foundation (Next.js 14, Express 4.18, Prisma 5.22, PostgreSQL, JWT auth with refresh tokens) handles all Staff Portal requirements. Only one strategic addition: **Luxon 3.7.2** for timezone-aware datetime operations.

**Core technologies:**
- **Luxon 3.7.2**: Timezone-aware time tracking — Required for multi-location salons spanning timezones. Built on native Intl API (no bundle bloat), immutable API, superior to date-fns-tz for this use case.
- **Existing JWT middleware**: Extend with portal claims and role verification — Already supports refresh tokens, multi-tenant isolation, and role-based access.
- **Prisma ORM**: Schema extensions only — TimeEntry model for clock in/out (if needed), but core staff functionality requires zero schema changes (all tables exist).
- **Express routing**: Add `/api/v1/staff-portal/*` routes — Follows existing patterns, reuses authentication middleware with staff-specific permission checks.

**Critical constraint:** jsonwebtoken patch to 9.0.3 for security fixes (currently 9.0.0).

### Expected Features

Research shows clear division between table stakes (already built) and differentiators (prioritize for v1.2).

**Must have (table stakes — ALL EXIST):**
- Staff authentication with magic link onboarding — JWT tokens, RefreshToken model, password setup flow
- Schedule viewing (appointments with date range filtering) — `/schedule` endpoint with staffId filtering
- Earnings/commission display — CommissionRecord aggregation with service-level breakdown
- Profile management — Name, phone, avatar updates via `/profile` endpoint
- Time-off requests with approval workflow — TimeOff model with status tracking
- Multi-location support — StaffLocation model with isPrimary flag

**Should have (competitive advantages):**
- Self-service availability editing with optional approval workflow — Existing ScheduleChangeRequest model handles this
- Real-time earnings transparency with tips breakdown — CommissionRecord tracks tips separately
- Mobile-first responsive interface — Requires frontend design work, not backend changes
- Appointment completion from portal — `PATCH /appointments/:id/complete` with staff permission

**Defer (v2+):**
- Clock in/out time tracking — HIGH complexity (GPS verification, fraud prevention), not core to booking workflow. Use appointment times as proxy.
- Push notifications — Requires Firebase/OneSignal integration, high operational overhead
- Staff-to-staff messaging — Moderation burden, liability issues
- Shift swapping — Complex approval logic, recommend owner-managed reassignment instead

**Anti-features (never build):**
- Payroll integration (regulatory complexity)
- Staff can cancel client appointments (bypasses owner control)
- Performance analytics visible to staff (creates unhealthy competition)

### Architecture Approach

**Integration strategy:** Extend existing multi-tenant architecture with shared authentication infrastructure and role-based routing, not separate systems. The existing JWT middleware, permission system (`PERMISSIONS` object in middleware), and tenant isolation utilities (`withSalonId()`) are production-proven—add staff-specific permissions and route prefixes.

**Major components:**

1. **Authentication Extension** — Add `/staff-portal/auth/login` and `/staff-portal/auth/setup` routes that generate JWTs with `portal: 'staff'` claim. Frontend uses separate token storage keys (`peacase_staff_access_token`) to prevent owner/staff session collision. StaffAuthContext already scaffolded.

2. **Staff Portal API Routes** — New `/api/v1/staff-portal/*` namespace for staff-facing endpoints (profile, schedule, appointments, earnings, time-off). Each route uses existing `authenticate` middleware plus staff-specific role checks. All queries MUST filter by both `staffId` AND `salonId` for tenant isolation.

3. **Frontend Staff Portal** — `/staff/*` routes with dedicated layout and StaffAuthProvider. Reuses existing design system (TailwindCSS, shadcn/ui), API client patterns (TanStack Query), and form handling (react-hook-form + zod). No new libraries.

4. **Permission System Extension** — Add staff-specific permissions to existing `PERMISSIONS` object: `VIEW_OWN_SCHEDULE`, `EDIT_OWN_SCHEDULE`, `VIEW_OWN_APPOINTMENTS`, `COMPLETE_OWN_APPOINTMENTS`, `VIEW_OWN_EARNINGS`, `REQUEST_TIME_OFF`. Reuse `hasPermission()` and `requirePermission()` middleware.

5. **Data Visibility Rules** — Staff endpoints return filtered client data based on salon settings (`staffCanViewClientContact`). Use explicit Prisma `select` to whitelist allowed fields, never full includes. Separate DTOs: `ClientSummaryForStaff` vs full `Client`.

**Critical integration points:**
- Public booking widget must remain unauthenticated after adding staff auth
- Owner dashboard staff queries must distinguish authenticated staff from legacy profiles
- Commission calculations must handle concurrent owner/staff appointment completion

### Critical Pitfalls

Top 5 pitfalls from research, prioritized by impact:

1. **Dual Authentication Path Confusion** — Two login endpoints (`/staff-portal/auth/login`, `/auth/login`) issue identical JWTs without portal differentiation, allowing staff tokens to authenticate against owner routes and vice versa. **Prevention:** Add `portal: 'staff' | 'owner'` claim to JWT payload, create `authenticateStaff` and `authenticateOwner` middleware that verify portal claim matches route context.

2. **Multi-Tenant Isolation Weakening** — Staff queries filter by `staffId` but forget `salonId`, allowing cross-tenant data access if staff guesses another salon's resource IDs. **Prevention:** Mandatory dual-filter rule (ALL staff queries MUST include BOTH `staffId` AND `salonId`), integration tests with multi-tenant fixtures verifying Staff A cannot access Salon B data.

3. **Client PII Exposure Through Overly Permissive Access** — Staff endpoints return full client records (email, phone, payment methods, medical notes) when staff only need name and appointment details, violating GDPR data minimization. **Prevention:** Explicit Prisma `select` whitelisting fields, separate `ClientSummaryForStaff` DTO, sanitize notes before returning to staff.

4. **Earnings Calculation Race Conditions** — Owner and staff both mark appointment complete simultaneously, concurrent commission calculations read-modify-write without locking, final save overwrites previous, losing commission data. **Prevention:** Wrap all commission operations in `prisma.$transaction`, use `upsert` with unique constraint on `appointmentId`, disable completion button after first click.

5. **Retroactive Permission Changes Don't Take Effect** — Owner disables schedule editing but staff's 7-day access token remains valid, allowing forbidden actions until expiry. **Prevention:** Shorten access token to 1 hour, check salon permission settings on every request (not just at login), implement session revocation table for immediate permission changes.

**Additional high-impact pitfalls:**
- Breaking booking widget flow (public endpoints require auth after staff portal added)
- Appointment status confusion (owner + staff both update status without conflict resolution)
- Commission rate changes applied retroactively (historical earnings corrupted)
- Staff deletion cascades and removes appointment history

## Implications for Roadmap

Based on research findings, recommended 6-phase structure prioritizing security, then data access, then features:

### Phase 1: Authentication Foundation
**Rationale:** Nothing works without secure auth. Must establish portal separation before building features that consume authentication.

**Delivers:** Staff can log in via magic link, authenticate against staff routes, logout. Owner portal unaffected.

**Critical elements:**
- `/staff-portal/auth/login`, `/staff-portal/auth/setup`, `/staff-portal/auth/refresh` endpoints
- `portal: 'staff'` claim in JWT payload
- `authenticateStaff` middleware that verifies portal claim
- Frontend `/staff/login` and `/staff/setup` pages with StaffAuthContext
- Token expiry shortened to 1 hour (refresh token flow for persistence)
- Integration test: Staff token should 401 on owner routes

**Addresses:** Pitfall #1 (dual auth confusion), Pitfall #5 (permission lag)

**Stack:** Existing JWT infrastructure (jsonwebtoken 9.0.3), bcryptjs for password hashing

**Estimated effort:** 1 week

### Phase 2: Data Visibility & Security Rules
**Rationale:** Security foundation before feature rollout. Establish which data staff can access and ensure tenant isolation.

**Delivers:** Security boundaries for staff data access, field-level permissions, multi-tenant isolation verified.

**Critical elements:**
- Dual-filter query helper: `staffQuery({ staffId, salonId })`
- `ClientSummaryForStaff` DTO with limited fields
- Multi-tenant integration tests (Staff A attempts Salon B access)
- Audit all Prisma queries in staff routes for missing `salonId`
- Document field-level access control (which roles see which client fields)

**Addresses:** Pitfall #2 (tenant isolation), Pitfall #3 (PII exposure), Pitfall #9 (deleted client visibility)

**Estimated effort:** 3-5 days

### Phase 3: Profile & Appointments (Core Features)
**Rationale:** Basic read-only functionality staff needs immediately. No financial calculations yet (defer risk).

**Delivers:** Staff dashboard showing today's appointments, profile management, appointment details.

**Features:**
- `GET /staff-portal/me` (profile)
- `PATCH /staff-portal/profile` (update name, phone, avatar)
- `GET /staff-portal/appointments` (list with date range)
- `GET /staff-portal/appointments/:id` (detail view)
- `PATCH /staff-portal/appointments/:id/complete` (mark complete)
- Frontend: `/staff/dashboard`, `/staff/appointments`, `/staff/profile` pages

**Addresses:** Table stakes features (schedule viewing, profile management)

**Stack:** Existing Appointment, User models. No new libraries.

**Estimated effort:** 1 week

### Phase 4: Schedule & Availability Management
**Rationale:** Self-service scheduling after read-only features proven secure. Optional approval workflow based on salon settings.

**Delivers:** Staff can view/edit availability, request time off with approval tracking.

**Features:**
- `GET /staff-portal/schedule` (view availability)
- `PUT /staff-portal/schedule` (update with optional approval workflow)
- `GET /staff-portal/time-off` (list requests)
- `POST /staff-portal/time-off` (create request)
- `DELETE /staff-portal/time-off/:id` (cancel pending request)
- Frontend: `/staff/schedule`, `/staff/time-off` pages with calendar UI

**Addresses:** Differentiator (self-service availability), table stakes (time-off requests), Pitfall #10 (concurrent double-booking)

**Stack:** Existing StaffAvailability, TimeOff, ScheduleChangeRequest models. Consider Luxon for timezone display if multi-location.

**Estimated effort:** 1 week

### Phase 5: Earnings & Commission Display
**Rationale:** Financial features last—highest risk, requires transaction safety. Staff can view but not modify.

**Delivers:** Transparent earnings display with service-level breakdown, tips tracking.

**Features:**
- `GET /staff-portal/earnings` (commission records with aggregation)
- Group by pay period, show total/paid/unpaid
- Frontend: `/staff/earnings` page with chart visualization

**Addresses:** Table stakes (earnings view), Pitfall #4 (race conditions), Pitfall #8 (retroactive rate changes)

**Critical implementation:**
- Wrap commission calculations in `prisma.$transaction`
- Snapshot `commissionRate` on CommissionRecord at creation (no retroactive changes)
- Unique constraint on `appointmentId` prevents duplicate records
- Read-only for staff (display only, no modifications)

**Stack:** Existing CommissionRecord model, Recharts for visualization (already in stack)

**Estimated effort:** 5-7 days

### Phase 6: Multi-Location & Polish
**Rationale:** Optional enhancement for salons with multiple locations. Can be deferred if single-location.

**Delivers:** Location-aware filtering, timezone-correct display, mobile responsiveness, empty states.

**Features:**
- Location selector in staff nav (filter by assigned locations)
- Timezone-aware schedule display using Luxon
- Mobile-responsive UI optimization
- Empty states for new staff
- Permission UI refinements

**Addresses:** Multi-location support (table stakes for multi-location salons), Pitfall #7 (timezone handling)

**Stack:** Luxon 3.7.2 for timezone operations, existing StaffLocation model

**Estimated effort:** 3-5 days

### Phase Ordering Rationale

**Why authentication first:** Foundation for all other phases. Security vulnerabilities in auth affect every feature.

**Why data visibility second:** Prevents building features that leak data. Establishes security boundaries before feature complexity.

**Why appointments before earnings:** Read-only features validate integration before introducing financial calculations with transaction requirements.

**Why earnings before multi-location:** Single-location salons (majority) get core value faster. Multi-location is enhancement, not blocker.

**Dependency chain:**
- Phase 3 depends on Phase 1 (auth) and Phase 2 (data rules)
- Phase 4 depends on Phase 3 (staff dashboard patterns established)
- Phase 5 depends on Phase 4 (appointment completion triggers commission calculation)
- Phase 6 depends on Phase 5 (location filtering needs data to filter)

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 5 (Earnings):** Complex commission calculation logic. Needs research into transaction isolation levels, optimistic locking patterns, and Prisma best practices for financial operations.
- **Phase 6 (Multi-Location):** If salon has `multiLocationEnabled`, research timezone conversion edge cases (DST transitions, cross-timezone scheduling conflicts).

**Phases with standard patterns (skip `/gsd:research-phase`):**
- **Phase 1 (Authentication):** Well-documented JWT + refresh token pattern. Follow existing Peacase auth implementation.
- **Phase 2 (Data Visibility):** Standard multi-tenant filtering patterns. Existing codebase demonstrates approach.
- **Phase 3 (Appointments):** CRUD operations on existing models. Straightforward implementation.
- **Phase 4 (Schedule):** Existing StaffAvailability model and approval workflow (ScheduleChangeRequest). Proven patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | 95% of stack already exists. Luxon verified via official docs + npm registry. Only one new library. |
| Features | MEDIUM-HIGH | Table stakes features verified across 5+ competitor platforms. All backend models exist. Confidence docked for anti-features categorization (based on industry trends, not Peacase-specific data). |
| Architecture | HIGH | Existing multi-tenant architecture is production-proven. Integration points clearly identified in codebase. StaffAuthContext already scaffolded. |
| Pitfalls | HIGH | Critical pitfalls verified through multi-tenant security best practices (WorkOS, Permit.io), authentication regression patterns, and Peacase codebase analysis. Phase-specific warnings mapped to likely development stages. |

**Overall confidence:** HIGH

Research is comprehensive and actionable. The primary finding—that existing infrastructure handles 95% of requirements—was verified through codebase inspection (schema.prisma, auth.ts, staffPortal.ts routes). Security pitfalls are drawn from established multi-tenant SaaS patterns and authentication best practices, not speculation.

### Gaps to Address

**During implementation:**
- **Clock in/out necessity:** Research shows conflicting data—some platforms emphasize it, others omit entirely. Categorized as anti-feature due to complexity, but if Peacase owners demand it, would require significant research into GPS verification, fraud prevention, and always-on mobile app infrastructure.
- **Mobile usage patterns:** No data on how often staff access portal from phones vs desktop. Phase 6 assumes mobile-first optimization needed, but could be deprioritized if analytics show primarily desktop usage.
- **Notification preferences:** Research didn't uncover best practices for staff notification settings (frequency, channels, batching). Pitfall #11 identifies spam risk, but detailed notification strategy needs definition during Phase 7 planning.

**Validation needed during Phase 1:**
- Confirm whether Peacase owners expect staff to self-manage schedules or prefer owner-controlled assignment
- Verify earnings transparency is desired (some salon cultures may prefer owner-only visibility)
- Test token expiry UX (1-hour access token with refresh vs 7-day long-lived token)

**Open architectural decisions:**
- Session revocation mechanism (table vs Redis vs JWT blacklist)
- Permission enforcement approach (DB query every request vs short-lived tokens with embedded claims)
- Calendar UI library (custom TailwindCSS build vs lightweight scheduler component)

These gaps are not blockers—they're refinement points during implementation.

## Sources

### Stack Research (HIGH confidence)
- Luxon 3.7.2 official documentation and npm registry
- npm trends comparison: date-fns vs dayjs vs luxon vs moment
- Timezone handling comparison (Phrase blog, CodeSandbox demos)
- Peacase codebase analysis (package.json, existing date-fns usage patterns)

### Features Research (MEDIUM-HIGH confidence)
- GlossGenius Staff Management features
- Meevo Employee Management documentation
- BarbNow Must-Have Features 2026 (industry trends)
- MioSalon Staff Management capabilities
- Salonkee Employee Management features
- Homebase Salon Payroll Guide (time tracking patterns)
- Peacase codebase analysis (schema.prisma models, staffPortal.ts routes)

### Architecture Research (HIGH confidence)
- Multi-tenant SaaS architecture (WorkOS, Microsoft Azure, Permit.io best practices)
- Next.js authentication patterns (official docs, Clerk RBAC guide)
- Express.js API design (Treblle best practices, Toptal secure REST API)
- Peacase codebase analysis (auth.ts, middleware/permissions.ts, StaffAuthContext.tsx)

### Pitfalls Research (HIGH confidence)
- Multi-tenant security patterns (WorkOS tenant isolation, Aserto RBAC)
- RBAC implementation pitfalls (idenhaus, TechPrescient, Oso best practices)
- Salon software security (MioSalon staff access levels, Meevo security permissions)
- Data isolation patterns (Propelius anti-patterns, Justin Hamade medium article)
- Commission calculation errors (Blitz commission blog, Yocale salon payroll)
- Time tracking pitfalls (Timeero common errors, QuickBooks timesheet best practices)

---

*Research completed: 2026-01-29*
*Ready for roadmap: Yes*
*Confidence: HIGH — Existing infrastructure handles 95% of requirements*
