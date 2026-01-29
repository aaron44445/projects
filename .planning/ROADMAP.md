# Roadmap: Peacase v1.1 Audit Remediation

## Milestones

- [x] **v1.0 Stabilization** - Phases 2-12 (shipped 2026-01-28)
- [ ] **v1.1 Audit Remediation** - Phases 13-18 (in progress)

## Overview

This roadmap addresses ~50 audit findings across security, performance, SEO, accessibility, code quality, and UI/UX. The approach is surgical and additive — fixing issues without introducing regressions to the production system that users depend on daily. Phase ordering follows risk and dependency analysis: security foundation first, then performance, SEO, accessibility, code quality, and finally UI polish.

## Phases

<details>
<summary>v1.0 Stabilization (Phases 2-12) - SHIPPED 2026-01-28</summary>

See MILESTONES.md for v1.0 details.

- 40 plans executed
- 130 commits
- 24/24 requirements satisfied

</details>

### v1.1 Audit Remediation (In Progress)

**Milestone Goal:** Fix all audit findings to production standards across security, performance, SEO, accessibility, code quality, and UI/UX.

- [x] **Phase 13: Security Hardening** - Environment validation, file ownership, password policy
- [x] **Phase 14: Performance Optimization** - Async notifications, query consolidation, background refetch
- [x] **Phase 15: SEO Fundamentals** - Sitemap, robots.txt, canonical URLs, structured data
- [x] **Phase 16: Accessibility Compliance** - Focus traps, ARIA labels, skip navigation, contrast
- [x] **Phase 17: Code Quality** - TypeScript strictness, structured logging, DRY utilities
- [ ] **Phase 18: UI/UX Consistency** - Modal standardization, design tokens, component reuse

## Phase Details

### Phase 13: Security Hardening
**Goal**: Application validates critical environment variables at startup and enforces secure file access patterns
**Depends on**: Phase 12 (v1.0 complete)
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04
**Success Criteria** (what must be TRUE):
  1. Application fails to start in production if ENCRYPTION_KEY is missing or empty
  2. Application fails to start in production if JWT_SECRET is missing or empty
  3. File DELETE requests verify ownership via database lookup before deletion
  4. New user passwords require uppercase, lowercase, number, and special character
**Plans**: 3 plans

Plans:
- [x] 13-01-PLAN.md - Environment validation hardening (SEC-01, SEC-02)
- [x] 13-02-PLAN.md - Password complexity enforcement (SEC-04)
- [x] 13-03-PLAN.md - File ownership verification (SEC-03)

### Phase 14: Performance Optimization
**Goal**: API responses are fast (<200ms) and dashboard queries are efficient (no N+1)
**Depends on**: Phase 13
**Requirements**: PERF-01, PERF-02, PERF-03, PERF-04
**Success Criteria** (what must be TRUE):
  1. Booking confirmation API returns before email/SMS is sent (async queue)
  2. Dashboard stats endpoint makes 2-3 database queries, not 8
  3. VIP client count comes from database COUNT query, not client-side filter
  4. Dashboard does not refetch when browser tab is in background
**Plans**: 4 plans

Plans:
- [x] 14-01-PLAN.md - Async notification queue with database job table (PERF-01)
- [x] 14-02-PLAN.md - Dashboard query consolidation (PERF-02)
- [x] 14-03-PLAN.md - Background refetch control (PERF-04)
- [x] 14-04-PLAN.md - VIP client database COUNT (PERF-03 gap closure)

### Phase 15: SEO Fundamentals
**Goal**: Public pages are discoverable and provide rich search results
**Depends on**: Phase 13 (security must be stable first)
**Requirements**: SEO-01, SEO-02, SEO-03, SEO-04
**Success Criteria** (what must be TRUE):
  1. /sitemap.xml returns valid XML with all public page URLs
  2. /robots.txt allows crawling of public pages and blocks /dashboard, /admin
  3. All public pages have canonical URLs in HTML head
  4. Landing page passes Google Rich Results Test for Organization schema
**Plans**: 2 plans

Plans:
- [x] 15-01-PLAN.md - Sitemap and robots.txt (SEO-01, SEO-02)
- [x] 15-02-PLAN.md - Canonical URLs and Organization schema (SEO-03, SEO-04)

### Phase 16: Accessibility Compliance
**Goal**: Application meets WCAG 2.1 AA standards for keyboard and screen reader users
**Depends on**: Phase 15
**Requirements**: A11Y-01, A11Y-02, A11Y-03, A11Y-04
**Success Criteria** (what must be TRUE):
  1. Opening a modal traps focus; pressing Escape closes it and returns focus
  2. Screen reader announces time slot information when navigating booking widget
  3. Pressing Tab as first action on any page focuses "Skip to main content" link
  4. All body text has minimum 4.5:1 contrast ratio (charcoal/80 or darker)
**Plans**: 10 plans (6 original + 4 gap closure)

Plans:
- [x] 16-01-PLAN.md - Modal focus trap and ARIA compliance (A11Y-01)
- [x] 16-02-PLAN.md - Booking widget live regions and time slot labels (A11Y-02)
- [x] 16-03-PLAN.md - Booking widget date labels and sr-only class (A11Y-02)
- [x] 16-04-PLAN.md - Skip to main content navigation (A11Y-03)
- [x] 16-05-PLAN.md - Text contrast core components (A11Y-04)
- [x] 16-06-PLAN.md - Text contrast batch component updates (A11Y-04)
- [x] 16-07-PLAN.md - Gap closure: Modal focus restoration fix (A11Y-01)
- [x] 16-08-PLAN.md - Gap closure: Add Staff modal ARIA fix (A11Y-01)
- [x] 16-09-PLAN.md - Gap closure: Booking widget radiogroup semantics (A11Y-02)
- [x] 16-10-PLAN.md - Gap closure: Skip link CSS fix (A11Y-03)

### Phase 17: Code Quality
**Goal**: Codebase is strictly typed with no implicit any and uses structured logging
**Depends on**: Phase 14 (performance changes may affect types)
**Requirements**: CODE-01, CODE-02, CODE-03, CODE-04
**Success Criteria** (what must be TRUE):
  1. All Prisma filter objects have explicit types (grep finds no `any` in route filters)
  2. API builds successfully with noImplicitAny: true in tsconfig.json
  3. Shared salonId filter utility is used in all routes (no inline where patterns)
  4. All API console.log/warn/error calls replaced with structured logger
**Plans**: 14 plans (9 original + 5 gap closure)

Plans:
- [x] 17-01-PLAN.md - Logger and prismaUtils foundation (CODE-03, CODE-04 foundation)
- [x] 17-02-PLAN.md - High-traffic routes migration (CODE-01)
- [x] 17-03-PLAN.md - Business routes migration (CODE-01)
- [x] 17-04-PLAN.md - Portal routes migration (CODE-01)
- [x] 17-05-PLAN.md - System routes migration (CODE-01)
- [x] 17-06-PLAN.md - Remaining routes migration (CODE-01)
- [x] 17-07-PLAN.md - Services and middleware logging (CODE-04)
- [x] 17-08-PLAN.md - Lib, cron, and worker logging (CODE-04)
- [x] 17-09-PLAN.md - Enable noImplicitAny and verify (CODE-02)
- [ ] 17-10-PLAN.md - Gap closure: withSalonId in appointments.ts (CODE-03)
- [ ] 17-11-PLAN.md - Gap closure: withSalonId in services.ts and staff.ts (CODE-03)
- [ ] 17-12-PLAN.md - Gap closure: withSalonId in users.ts (CODE-03)
- [ ] 17-13-PLAN.md - Gap closure: withSalonId in clients, notifications, packages (CODE-03)
- [ ] 17-14-PLAN.md - Gap closure: withSalonId in onboarding, marketing, gift-cards (CODE-03)

### Phase 18: UI/UX Consistency
**Goal**: UI components follow consistent patterns with shared design tokens
**Depends on**: Phase 16 (accessibility fixes inform component patterns)
**Requirements**: UI-01, UI-02, UI-03, UI-04
**Success Criteria** (what must be TRUE):
  1. All modal dialogs use packages/ui Modal component (no custom implementations)
  2. Status colors (pending, confirmed, cancelled, etc.) come from single constants file
  3. Error highlighting uses design tokens (error/10, error/20) not hex colors
  4. Empty states across the app use shared EmptyState component
**Plans**: TBD

Plans:
- [ ] 18-01: TBD

## Progress

**Execution Order:** Phases execute in numeric order: 13 -> 14 -> 15 -> 16 -> 17 -> 18

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 13. Security Hardening | v1.1 | 3/3 | Complete | 2026-01-28 |
| 14. Performance Optimization | v1.1 | 4/4 | Complete | 2026-01-28 |
| 15. SEO Fundamentals | v1.1 | 2/2 | Complete | 2026-01-28 |
| 16. Accessibility Compliance | v1.1 | 10/10 | Complete | 2026-01-29 |
| 17. Code Quality | v1.1 | 14/14 | Complete | 2026-01-29 |
| 18. UI/UX Consistency | v1.1 | 0/TBD | Not started | - |

---
*Roadmap created: 2026-01-28*
*Last updated: 2026-01-29 (Phase 17 complete - 14 plans, all CODE requirements met)*
