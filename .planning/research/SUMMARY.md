# Project Research Summary

**Project:** Peacase v1.1 Audit Remediation
**Domain:** Remediation of ~50 audit findings on production SaaS
**Researched:** 2026-01-28
**Confidence:** HIGH

## Executive Summary

Peacase v1.1 is a remediation milestone focused on fixing ~50 audit issues across security, performance, SEO, accessibility, code quality, and UI/UX in an existing, shipped production system. The core challenge is NOT implementing fixes — it's doing so without introducing regressions that break features users depend on daily. Research shows that poorly executed remediation commonly causes 43% traffic loss (SEO), mass user logouts (security), and cascading failures (performance).

The recommended approach is surgical, additive changes with extensive testing at each step. The existing stack (Next.js 14, Express.js, Prisma, TailwindCSS, shadcn/ui) is preserved. New dependencies are minimal: `csrf-csrf` for CSRF protection, `bullmq` for async notifications, `schema-dts` for SEO types, and testing tools (`jest-axe`, `eslint-plugin-jsx-a11y`). Most fixes require configuration changes or pattern updates rather than new libraries.

Key risks center on breaking working functionality while fixing issues. Security fixes can invalidate user sessions if not migrated properly. Performance query optimizations can timeout on production data volumes. SEO changes can tank search traffic within weeks. Accessibility fixes with improper ARIA can make features worse, not better. Each category has specific testing protocols and rollback procedures documented to mitigate these risks.

## Key Findings

### Recommended Stack

The existing stack is preserved. Additions are minimal and targeted to specific audit findings.

**New Dependencies:**
- `csrf-csrf@^4.0.3`: Stateless CSRF protection using Double Submit Cookie pattern — no Redis required
- `bullmq@^5.66.5` + `ioredis@^5.4.0`: Async notification queue with Upstash Redis free tier — unblocks API responses
- `schema-dts@^1.1.2` (dev): TypeScript types for JSON-LD structured data — type-safe SEO
- `jest-axe@^10.0.0` + `eslint-plugin-jsx-a11y@^6.10.0` (dev): Automated accessibility testing — catches 30-57% of a11y issues

**Configuration-Only Fixes (no new dependencies):**
- Environment validation with existing Zod
- Prisma `include` with `relationLoadStrategy: 'join'` for N+1 queries
- TanStack Query `staleTime` configuration to prevent UI flicker
- Next.js built-in `sitemap.ts` and `robots.ts`
- TypeScript `strict: true` and `noUncheckedIndexedAccess`
- CSS design tokens for UI consistency

### Expected Features (Remediation Outcomes)

**Security Table Stakes:**
- Environment variables validated at startup (not just used)
- CSRF tokens persist across server restarts
- File uploads validate ownership before access
- Session cookies are HttpOnly, Secure, SameSite

**Performance Table Stakes:**
- Email/SMS notifications sent asynchronously (API responds < 200ms)
- No N+1 queries on list endpoints (single query with JOINs)
- Lighthouse Performance score >= 90 on mobile

**SEO Table Stakes:**
- Valid sitemap.xml and robots.txt
- JSON-LD structured data for LocalBusiness/BeautySalon
- Canonical URLs on all pages

**Accessibility Table Stakes (WCAG 2.1 AA):**
- Modal focus trapping with Escape key close
- Skip navigation link as first focusable element
- 4.5:1 contrast ratio for normal text
- All interactive elements keyboard accessible

**Code Quality Table Stakes:**
- TypeScript strict mode enabled
- Zero ESLint errors
- No DRY violations > 10 lines

**UI/UX Table Stakes:**
- Single modal component (shadcn/ui Dialog)
- Consistent status colors via design tokens
- Loading states for all async content

### Architecture Approach

Changes must be additive or surgical, never architectural. The existing infrastructure is leveraged extensively. Tenant isolation fixes are single-line WHERE clause additions. Webhook security adds validation layers without changing flow. Frontend auth consolidates to centralized config files before migrating individual contexts.

**Integration Points by Category:**
1. **Security:** Route handlers (`apps/api/src/routes/*.ts`) — WHERE clause additions
2. **Webhooks:** `webhooks.ts`, `subscriptions.ts` — signature validation layers
3. **Public endpoints:** `public.ts` — staffId/locationId validation before processing
4. **Frontend auth:** Auth contexts + new `config/api.ts` — centralize then migrate
5. **SEO/A11y:** Next.js pages and components — metadata exports, ARIA attributes
6. **UI:** Component files — standardize to shadcn/ui patterns

**Existing Test Infrastructure:**
- `tenant-isolation.test.ts` already exists for cross-tenant testing
- Test helpers: `createTestSalon()`, `generateTestTokens()`, `authenticatedRequest()`
- Auth middleware already extracts `salonId` on all authenticated routes

### Critical Pitfalls

1. **Security Fixes That Break User Sessions** — Implementing token rotation or session validation that invalidates all existing sessions causes mass logout. Prevention: Dual-token support during transition, accept both old and new formats.

2. **Database Query Changes That Cause Timeouts** — Adding `WHERE salonId = ?` on unindexed tables works in dev (100 rows) but times out in production (100,000 rows). Prevention: Add indexes BEFORE deploying query changes, test with production-scale data, EXPLAIN ANALYZE.

3. **SEO Fixes That Tank Search Traffic** — Wrong robots meta tags, missing redirects, or invalid structured data causes 40-60% traffic loss within weeks. Prevention: Never change URLs without 301 redirects, validate with Rich Results Test, monitor Search Console daily.

4. **Accessibility Fixes That Break Functionality** — Wrong ARIA attributes (e.g., `aria-hidden="true"` on interactive elements) makes features unusable for everyone. Prevention: Test with real assistive technology (VoiceOver, NVDA), not just automated tools which only catch 30% of issues.

5. **Multi-Tenant Security Fixes That Break Admin Features** — Blanket "all queries must filter by salonId" breaks legitimate admin access, webhooks, and background jobs. Prevention: Document cross-tenant patterns, separate admin vs tenant routes, service account pattern for background jobs.

## Implications for Roadmap

Based on research, the recommended phase structure addresses dependencies and risk levels:

### Phase 1: Security Foundation
**Rationale:** Security fixes are highest risk but have no dependencies. They're independent and can be tested in isolation. Must come first because they're the foundation for everything else.
**Delivers:** Tenant isolation, webhook security, public endpoint validation
**Addresses:** All security audit findings, OWASP compliance
**Avoids:** Pitfall #1 (session invalidation) via dual-token support; Pitfall #5 (breaking admin) via documented cross-tenant patterns
**Risk Level:** LOW per-file, each route is independent, < 5 min rollback

### Phase 2: Auth Consistency
**Rationale:** Builds on security foundation. Frontend token standardization depends on backend security being stable.
**Delivers:** Centralized API config, consistent token storage keys across auth contexts
**Uses:** Existing auth middleware, Zod for env validation
**Implements:** Centralize-then-migrate pattern for auth contexts
**Risk Level:** MEDIUM, affects all auth flows, ~15 min rollback

### Phase 3: Test Coverage Lock-in
**Rationale:** After security and auth fixes, lock in guarantees with comprehensive tests before moving to quality improvements.
**Delivers:** Extended tenant isolation tests, session persistence tests, webhook validation tests
**Addresses:** Regression prevention for Phases 1-2
**Risk Level:** NONE, purely additive

### Phase 4: Performance Optimization
**Rationale:** Independent of other phases, can run parallel with Phase 5-6. Requires careful testing with production-scale data.
**Delivers:** Async notification queue (BullMQ), N+1 query elimination, TanStack Query optimization
**Uses:** bullmq, ioredis, Prisma `include` patterns
**Avoids:** Pitfall #2 (query timeouts) via index-first deployment, production data testing
**Risk Level:** LOW-MEDIUM, monitor query latency

### Phase 5: SEO Implementation
**Rationale:** Additive improvements with low risk. No functional code changes required.
**Delivers:** sitemap.xml, robots.txt, JSON-LD structured data, canonical URLs
**Uses:** Next.js built-in sitemap.ts, schema-dts for types
**Avoids:** Pitfall #3 (traffic tank) via no URL changes, Rich Results validation
**Risk Level:** NONE for visual-only, validate with Search Console

### Phase 6: Accessibility Compliance
**Rationale:** Legal deadline (April 24, 2026 for WCAG 2.1 AA). Touches all components but changes are progressive enhancement.
**Delivers:** Modal focus traps, skip navigation, ARIA labels, keyboard navigation
**Uses:** Existing shadcn/ui Dialog (Radix focus management), jest-axe, eslint-plugin-jsx-a11y
**Avoids:** Pitfall #4 (breaking functionality) via mandatory screen reader testing
**Risk Level:** NONE for ARIA additions, test with VoiceOver/NVDA

### Phase 7: Code Quality
**Rationale:** Makes subsequent fixes safer. Best done after functional fixes to avoid cascading changes.
**Delivers:** TypeScript strict mode, ESLint strict config, DRY utility extraction
**Uses:** Existing TypeScript, eslint with typescript-eslint strict
**Avoids:** Pitfall #7 (behavior changes) via test coverage before refactoring, one fix per PR
**Risk Level:** LOW, existing tests catch behavior changes

### Phase 8: UI/UX Consistency
**Rationale:** Polish layer, best done last. Visual changes don't affect data flow.
**Delivers:** Design tokens, component standardization, status color system, loading/empty states
**Uses:** shadcn/ui components, CSS variables for tokens
**Avoids:** Pitfall #5 (visual regressions) via component-level scoped changes, visual regression testing
**Risk Level:** LOW, visual only, easily reversible

### Phase Ordering Rationale

- **Security first:** Foundation layer with highest business risk, independent of other changes
- **Auth second:** Builds on security, required for consistent testing of other phases
- **Tests third:** Lock in security guarantees before making more changes
- **Performance fourth:** Independent but needs careful production testing
- **SEO/A11y parallel:** Both additive, no code dependencies between them
- **Code quality seventh:** Makes UI work safer via types
- **UI last:** Polish layer with lowest risk, benefits from code quality improvements

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 4 (Performance):** Upstash Redis setup, BullMQ worker configuration, Prisma join strategies
- **Phase 6 (Accessibility):** WCAG 2.1 AA specific requirements, screen reader testing procedures

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Security):** Well-documented patterns, existing test infrastructure, straightforward WHERE clause additions
- **Phase 5 (SEO):** Next.js official documentation, standard patterns
- **Phase 8 (UI/UX):** shadcn/ui documentation, design token patterns well-established

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official docs for all recommendations (csrf-csrf, BullMQ, Next.js, Prisma) |
| Features | HIGH | Based on OWASP, WCAG, Google standards with specific thresholds |
| Architecture | HIGH | Based on direct codebase analysis, existing patterns, phase plans already created |
| Pitfalls | HIGH | Industry research with statistics, multiple corroborating sources |

**Overall confidence:** HIGH

### Gaps to Address

- **Upstash Redis free tier limits:** 500K commands/month — need to monitor BullMQ polling frequency
- **WCAG 2.2 vs 2.1:** Research focused on 2.1 AA (legal requirement), 2.2 could be future enhancement
- **Visual regression testing setup:** Not currently in codebase, recommended but may need tool selection
- **Tailwind v4 migration timing:** Deferred due to newness, revisit after ecosystem stabilizes

## Success Metrics

**Automated Verification:**
```bash
# Performance
npx lighthouse --preset=mobile --only-categories=performance,seo,accessibility [URL]
# Target: All scores >= 90

# Security
npm audit --audit-level=moderate  # Zero vulnerabilities
grep -r "ENCRYPTION_KEY\|API_KEY\|PASSWORD" --include="*.ts" src/  # Empty

# Code Quality
npm run typecheck  # Zero errors
npm run lint       # Zero errors
npm run test       # All pass

# Accessibility
npm run test:a11y  # axe-core passes
```

**Manual Verification:**
- Keyboard navigate booking flow start to finish
- Screen reader announces all form labels
- Google Search Console shows zero errors after sitemap submission
- Load test with 50 concurrent bookings without timeouts

## Sources

### Primary (HIGH confidence)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) — security requirements
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/) — accessibility standards
- [Next.js Documentation](https://nextjs.org/docs) — sitemap, robots, metadata
- [Prisma Query Optimization](https://www.prisma.io/docs/orm/prisma-client/queries/query-optimization-performance) — N+1 solutions
- [BullMQ Documentation](https://bullmq.io/) — async queue patterns
- [TypeScript TSConfig Reference](https://www.typescriptlang.org/tsconfig/) — strict mode settings

### Secondary (MEDIUM confidence)
- [Lighthouse Performance Scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring) — performance thresholds
- [csrf-csrf npm](https://www.npmjs.com/package/csrf-csrf) — Double Submit Cookie pattern
- [Upstash BullMQ Integration](https://upstash.com/docs/redis/integrations/bullmq) — Redis setup
- [typescript-eslint](https://typescript-eslint.io/) — ESLint strict configuration

### Tertiary (Referenced in Pitfalls)
- [WP Rocket SEO Mistakes](https://wp-rocket.me/blog/seo-mistakes/) — 43% traffic loss statistic
- [UsableNet ADA Compliance](https://blog.usablenet.com/common-ada-title-ii-compliance-mistakes) — automated tools catch 30% of issues
- [ActiveState Vulnerability Report](https://www.activestate.com/blog/the-state-of-vulnerability-management-remediation-report-2026/) — remediation risk data

---
*Research completed: 2026-01-28*
*Ready for roadmap: yes*
