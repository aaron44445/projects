# Phase 15: SEO Fundamentals - Research

**Researched:** 2026-01-28
**Domain:** Next.js App Router SEO
**Confidence:** HIGH

## Summary

Next.js 16 provides native SEO features: sitemap.ts, robots.ts, and Metadata API for canonical URLs. JSON-LD structured data via script tags. No external packages needed.

Current project lacks all SEO fundamentals. Must implement native Next.js conventions.

**Primary recommendation:** Use native Next.js file conventions (sitemap.ts, robots.ts) and Metadata API (alternates.canonical) with JSON-LD for Organization schema.

## Standard Stack

### Core
- Next.js 16.1.3+ - Built-in SEO conventions
- MetadataRoute - TypeScript types
- Metadata API - Canonical URLs  
- JSON-LD - Structured data (Google preferred)

### Tools
- Schema.org Validator - Validate syntax
- Google Rich Results Test - Verify parsing

No packages to install - all native Next.js features.

## Architecture Patterns

### Pattern 1: Sitemap Generation
Create apps/web/src/app/sitemap.ts returning MetadataRoute.Sitemap array.

### Pattern 2: Robots.txt  
Create apps/web/src/app/robots.ts with rules array and sitemap reference.

### Pattern 3: Canonical URLs
Use alternates.canonical in metadata with metadataBase in root layout.

### Pattern 4: JSON-LD Schema
Script tag with type="application/ld+json" in landing page.

### Anti-Patterns
- Mixing noindex with canonical
- Canonical chains
- Non-canonical URLs in sitemap
- Blocking sitemap in robots.txt
- Using robots.txt for canonicalization

## Don't Hand-Roll

- Sitemap XML - Use Next.js sitemap.ts
- Robots.txt - Use Next.js robots.ts  
- Canonical URLs - Use Metadata API
- JSON-LD validation - Use Schema.org types
- Large sitemap splitting - Use generateSitemaps()

## Common Pitfalls

### Pitfall 1: Private Routes in Sitemap
Explicitly list public pages only.

### Pitfall 2: Incorrect Canonical Format  
Set metadataBase once, use relative paths.

### Pitfall 3: Missing Schema Properties
Include: context, type, name, url, logo, description.

### Pitfall 4: Blocking /_next/static
Only block application routes, not Next.js internals.

### Pitfall 5: Stale Dates
Use new Date() for dynamic content.

### Pitfall 6: Missing Sitemap in robots.txt
Always reference sitemap URL.

### Pitfall 7: TypeScript any
Import proper types.

## Code Examples

See official Next.js docs for full examples:
- sitemap.ts returns MetadataRoute.Sitemap array
- robots.ts returns MetadataRoute.Robots with rules
- layout.tsx sets metadataBase and alternates.canonical
- page.tsx includes JSON-LD script tag

## State of the Art

- next-sitemap → Native sitemap.ts (Next.js 13.3+)
- Head component → Metadata API (Next.js 13+)
- Manual robots → robots.ts (Next.js 13.3+)
- Microdata → JSON-LD (Google ~2019)

## Open Questions

1. Production URL - Assume peacase.com, use env var
2. Logo location - Use /logo.png placeholder
3. Public pages - Include only confirmed pages
4. Contact email - Assume support@peacase.com

## Sources

### Primary (HIGH)
- Next.js sitemap.ts API docs
- Next.js robots.ts API docs  
- Next.js generateMetadata docs
- Google Organization Schema docs
- Google Structured Data Guidelines
- Google Canonical URL docs

### Secondary (MEDIUM)
- Next.js SEO guides 2026
- Native vs next-sitemap comparisons
- JSON-LD tutorials
- Rich Results Test guides
- Canonical issues documentation
- SEO common errors guides

## Metadata

**Confidence:** HIGH - All from official docs
**Research date:** 2026-01-28
**Valid until:** 2026-04-28 (90 days)
**Next.js version:** 16.1.3
**Framework stability:** HIGH
