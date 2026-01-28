# Phase 15: SEO Fundamentals - Context

**Gathered:** 2026-01-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Public pages are discoverable and provide rich search results. This includes sitemap.xml, robots.txt, canonical URLs, and structured data. Does not include meta descriptions, Open Graph tags, or page-specific keyword optimization (those would be separate phases).

</domain>

<decisions>
## Implementation Decisions

### Sitemap Structure
- Dynamic generation at build time (Next.js sitemap.ts)
- Include all public marketing pages: /, /pricing, /features, /about, /contact, /blog/*
- Include public booking widget URLs if they have stable paths
- Set changefreq hints: weekly for landing page, monthly for static pages
- Priority: 1.0 for homepage, 0.8 for main marketing pages, 0.5 for blog posts

### Robots.txt Rules
- Allow: / (default crawling enabled)
- Disallow: /dashboard, /dashboard/*, /admin, /admin/*, /api/*
- Disallow: /settings, /settings/*
- Disallow: /_next/static/* (Next.js internals - handled by default but explicit is clearer)
- No crawl-delay (let search engines decide their own pace)
- Reference sitemap location in robots.txt

### Canonical URL Format
- Non-www preferred (matches current deployment)
- No trailing slashes (Next.js default)
- Strip query parameters for canonical URLs (canonical should be clean base URL)
- Use absolute URLs with https:// protocol
- Implement via Next.js metadata API in layout.tsx

### Structured Data
- Organization schema on landing page (required by success criteria)
- Include: name, url, logo, description, contactPoint
- Use JSON-LD format in script tag (Google-preferred method)
- LocalBusiness schema deferred (requires address/hours which may not be relevant for a SaaS)

### Claude's Discretion
- Exact sitemap generation implementation details
- Whether to use next-sitemap package or native Next.js
- Logo image dimensions for structured data
- Error handling for sitemap generation

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User deferred all decisions to Claude's judgment.

</specifics>

<deferred>
## Deferred Ideas

- Meta descriptions and Open Graph tags — separate SEO phase
- LocalBusiness schema with physical location data — needs business info gathering
- Blog post structured data (Article schema) — if blog becomes more prominent
- Dynamic sitemap for user-generated public pages — depends on product evolution

</deferred>

---

*Phase: 15-seo-fundamentals*
*Context gathered: 2026-01-28*
