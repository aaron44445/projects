---
phase: 15-seo-fundamentals
plan: 01
subsystem: seo
tags: [nextjs, sitemap, robots-txt, metadata-route, seo]

# Dependency graph
requires:
  - phase: web-app-setup
    provides: Next.js app router structure
provides:
  - /sitemap.xml endpoint with 7 public pages
  - /robots.txt endpoint with crawl rules
  - MetadataRoute types for sitemap and robots
affects: [16-accessibility, future-marketing, public-pages]

# Tech tracking
tech-stack:
  added: []
  patterns: [Next.js MetadataRoute convention for SEO files]

key-files:
  created:
    - apps/web/src/app/sitemap.ts
    - apps/web/src/app/robots.ts
  modified: []

key-decisions:
  - "Use Next.js native MetadataRoute convention instead of static files"
  - "Block all authenticated routes from crawling via robots.txt"
  - "Set homepage priority to 1.0, signup/pricing to 0.8"

patterns-established:
  - "Use NEXT_PUBLIC_APP_URL env var with peacase.com fallback for base URLs"
  - "Reference /sitemap.xml from robots.txt sitemap property"

# Metrics
duration: 5min
completed: 2026-01-29
---

# Phase 15 Plan 01: Sitemap and Robots.txt Summary

**Dynamic sitemap.xml with 7 public pages and robots.txt blocking all authenticated routes using Next.js MetadataRoute convention**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-29T01:54:31Z
- **Completed:** 2026-01-29T01:59:59Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created /sitemap.xml serving 7 public pages with proper priorities and change frequencies
- Created /robots.txt allowing public pages and blocking 24 authenticated routes
- Both endpoints use Next.js native MetadataRoute types for type safety

## Task Commits

Each task was committed atomically:

1. **Task 1: Create sitemap.ts** - `d1be332` (feat)
2. **Task 2: Create robots.ts** - `d7b5080` (feat)

## Files Created/Modified
- `apps/web/src/app/sitemap.ts` - Generates /sitemap.xml with 7 public page URLs, priorities, and change frequencies
- `apps/web/src/app/robots.ts` - Generates /robots.txt with crawl rules and sitemap reference

## Decisions Made

**1. Use Next.js native MetadataRoute convention**
- Next.js provides built-in support for sitemap.ts and robots.ts files
- Automatic XML/TXT generation at build time
- Type-safe with MetadataRoute.Sitemap and MetadataRoute.Robots interfaces

**2. Comprehensive authenticated route blocking**
- Block 24 routes from crawling: dashboard, admin, api, settings, staff, calendar, clients, services, packages, gift-cards, marketing, reports, notifications, locations, onboarding, setup, portal, embed
- Prevents search engines from indexing private salon business data
- Protects against enumeration of authenticated functionality

**3. Priority and frequency optimization**
- Homepage: 1.0 priority, weekly (primary landing page)
- Signup/pricing: 0.8 priority, monthly (high-value conversion pages)
- Demo: 0.7 priority, monthly (trial conversion)
- Login: 0.5 priority, monthly (utility page)
- Privacy/terms: 0.3 priority, yearly (static legal pages)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - both files created successfully and endpoints working on first test.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

SEO fundamentals in place:
- Search engines can discover all public pages via /sitemap.xml
- Authenticated routes protected from crawling via /robots.txt
- Ready for meta tags and Open Graph implementation (15-02)
- Ready for structured data (15-03)

No blockers for next phase.

---
*Phase: 15-seo-fundamentals*
*Completed: 2026-01-29*
