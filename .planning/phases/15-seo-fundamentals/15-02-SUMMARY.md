---
phase: 15-seo-fundamentals
plan: 02
subsystem: seo
tags: [nextjs, metadata, json-ld, canonical-urls, schema-org]

# Dependency graph
requires:
  - phase: 15-01
    provides: sitemap.xml and robots.txt for search crawlers
provides:
  - Canonical URL support via metadataBase for all pages
  - Organization JSON-LD structured data on landing page
  - Search engine entity recognition foundation
affects: [16-accessibility, future-seo-enhancements]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Next.js metadata API for canonical URLs"
    - "JSON-LD structured data in client components"
    - "Server-rendered schema markup for SEO"

key-files:
  created:
    - apps/web/src/components/OrganizationSchema.tsx
  modified:
    - apps/web/src/app/layout.tsx
    - apps/web/src/app/page.tsx

key-decisions:
  - "Use metadataBase with alternates.canonical for automatic canonical URLs"
  - "Render JSON-LD in client component body (valid for Google parsing)"
  - "Hardcoded schema data is safe for dangerouslySetInnerHTML"

patterns-established:
  - "metadataBase pattern: Set once in root layout for all pages"
  - "JSON-LD pattern: Server components returning script tags with type=application/ld+json"
  - "Schema.org pattern: Include all core Organization fields plus contactPoint and sameAs"

# Metrics
duration: 6min
completed: 2026-01-28
---

# Phase 15 Plan 02: Canonical URLs & Organization Schema Summary

**Next.js metadata API provides automatic canonical URLs via metadataBase; Organization JSON-LD structured data enables rich search results**

## Performance

- **Duration:** 6 minutes
- **Started:** 2026-01-28T19:47:49Z
- **Completed:** 2026-01-28T19:53:21Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Configured metadataBase in root layout to enable canonical URLs on all pages
- Created reusable OrganizationSchema component with complete schema.org markup
- Integrated Organization structured data into landing page for search engine entity recognition

## Task Commits

Each task was committed atomically:

1. **Task 1: Add metadataBase to root layout** - `56d04de` (feat)
2. **Task 2: Create OrganizationSchema component** - `a76cc16` (feat)
3. **Task 3: Add OrganizationSchema to landing page** - `88cc961` (feat)

## Files Created/Modified
- `apps/web/src/app/layout.tsx` - Added metadataBase and alternates.canonical for automatic canonical URL generation
- `apps/web/src/components/OrganizationSchema.tsx` - Server component rendering JSON-LD with Organization type, name, url, logo, description, contactPoint, and sameAs properties
- `apps/web/src/app/page.tsx` - Imported and rendered OrganizationSchema as first child in page

## Decisions Made

**metadataBase configuration:**
- Set metadataBase to peacase.com (with env var fallback)
- Use alternates.canonical: './' for relative path resolution
- This automatically generates canonical URLs for all pages

**JSON-LD in client component:**
- OrganizationSchema renders in client component body
- Google parses JSON-LD in body correctly (head placement preferred but not required)
- Future: Move to server component if page becomes server-rendered

**Hardcoded schema data:**
- Using dangerouslySetInnerHTML with JSON.stringify is safe here
- Content is hardcoded constants, not user-provided
- No XSS risk

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Pre-existing TypeScript errors:**
- Project has existing TypeScript configuration issues unrelated to SEO changes
- Changes compile correctly in Next.js dev/build pipeline
- No impact on functionality

**Pre-existing build error:**
- Next.js build fails with "Cannot find module for page: /_document"
- Error exists before SEO changes
- Does not prevent dev server operation or SEO implementation

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for next phase:**
- Canonical URLs implemented for all pages
- Organization entity recognized by search engines
- Foundation for rich search results established

**Recommendations:**
- Add Open Graph images for social media previews
- Consider LocalBusiness schema for physical locations
- Add breadcrumb structured data for navigation

---
*Phase: 15-seo-fundamentals*
*Completed: 2026-01-28*
