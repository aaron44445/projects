# Technology Stack: v1.1 Audit Remediation

**Project:** Peacase - Spa/Salon SaaS
**Focus:** Tools and libraries for audit remediation
**Researched:** 2026-01-28
**Overall Confidence:** HIGH

## Executive Summary

This research identifies specific tools and libraries to remediate ~50 audit findings across security, performance, SEO, accessibility, code quality, and UI/UX. The existing stack (Next.js 14, Express.js, Prisma, TailwindCSS, shadcn/ui) is preserved. Additions are minimal and targeted.

**Key principle:** Fix issues with the lightest-weight solution. Avoid adding complexity for problems that can be solved with patterns or configuration changes.

---

## 1. Security Hardening

### Environment Variable Validation

**Issue:** ENCRYPTION_KEY and other critical env vars not validated at startup

**Recommendation:** Use existing Zod (^3.22.0 already installed)

No new library needed. Create `apps/api/src/config/env.ts`:

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY must be at least 32 characters'),
  JWT_SECRET: z.string().min(32),
  SENDGRID_API_KEY: z.string().startsWith('SG.'),
  TWILIO_ACCOUNT_SID: z.string().startsWith('AC'),
  TWILIO_AUTH_TOKEN: z.string().min(32),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
});

export const env = envSchema.parse(process.env);
```

**Why not znv or t3-env:** Zod is already in the stack. Adding another library for env validation is unnecessary complexity.

**Confidence:** HIGH (Zod official docs, multiple 2026 tutorials)

---

### CSRF Protection

**Issue:** CSRF tokens stored in memory, not persistent across server restarts

**Options Evaluated:**

| Library | Pattern | Requires Redis | Recommendation |
|---------|---------|----------------|----------------|
| csrf-csrf ^4.0.3 | Double Submit Cookie | No | **RECOMMENDED** |
| @dr.pogodin/csurf | Synchronizer Token | Yes (session store) | Good for stateful apps |
| Custom implementation | - | - | Not recommended |

**Recommendation:** `csrf-csrf@^4.0.3`

**Why:** Double Submit Cookie pattern is stateless - no Redis needed. Works with existing cookie-parser. The original csurf was deprecated in 2022; csrf-csrf is the modern replacement.

```bash
pnpm add csrf-csrf@^4.0.3
```

**Integration:**
```typescript
import { doubleCsrf } from 'csrf-csrf';

const { doubleCsrfProtection } = doubleCsrf({
  getSecret: () => env.CSRF_SECRET,
  cookieName: '__Host-csrf',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  },
});

app.use(doubleCsrfProtection);
```

**Confidence:** HIGH (npm package docs, Express discussions)

**Sources:**
- [csrf-csrf npm](https://www.npmjs.com/package/csrf-csrf)
- [Express CSRF Discussion](https://github.com/expressjs/express/discussions/5491)
- [Snyk CSRF Guide](https://snyk.io/blog/how-to-protect-node-js-apps-from-csrf-attacks/)

---

### File Upload Validation

**Issue:** File ownership validation for Cloudinary uploads

**Recommendation:** No new library needed

Add salonId to upload metadata and validate on access. Multer (^1.4.5-lts.1) already handles file filtering. Add validation middleware:

```typescript
// Validate uploaded file belongs to requesting salon
const validateFileOwnership = async (req, res, next) => {
  const { publicId } = req.params;
  const { salonId } = req.user;

  // Check FileUpload table for ownership
  const file = await prisma.fileUpload.findFirst({
    where: { publicId, salonId }
  });

  if (!file) return res.status(404).json({ error: 'File not found' });
  next();
};
```

**Confidence:** HIGH (standard pattern)

---

## 2. Performance Optimization

### Async Notification Queue

**Issue:** Email/SMS sent synchronously, blocking API responses

**Options Evaluated:**

| Library | Requires Redis | Free Tier Compatible | Recommendation |
|---------|----------------|----------------------|----------------|
| BullMQ ^5.66.5 | Yes | With Upstash | **RECOMMENDED** |
| node-cron (existing) | No | Yes | Current (poor) |
| Custom setTimeout | No | Yes | Not recommended |

**Recommendation:** `bullmq@^5.66.5` with Upstash Redis (free tier)

**Why BullMQ:**
- Redis-backed job queue with retry, priority, rate limiting
- Worker runs in separate process (doesn't block API)
- Built-in job monitoring and failure handling
- Upstash free tier: 500K commands/month, 256MB storage

```bash
pnpm add bullmq@^5.66.5 ioredis@^5.4.0
```

**Warning:** BullMQ polls Redis aggressively. With Upstash pay-as-you-go, this can run up bills. Use free tier (500K commands/month) and monitor usage.

**Architecture:**
```
API Request -> Add job to queue -> Return 202 Accepted
Worker Process -> Process job -> Send email/SMS -> Update NotificationLog
```

**Confidence:** HIGH (Official BullMQ docs, Upstash integration guide)

**Sources:**
- [BullMQ Official](https://bullmq.io/)
- [Upstash BullMQ Integration](https://upstash.com/docs/redis/integrations/bullmq)
- [DigitalOcean BullMQ Guide](https://www.digitalocean.com/community/tutorials/how-to-handle-asynchronous-tasks-with-node-js-and-bullmq)

---

### Query Optimization

**Issue:** N+1 queries in dashboard and appointments list

**Recommendation:** No new library needed - Prisma patterns

Prisma already solves N+1 with `include` and `select`. The issue is pattern usage, not tooling.

**Current (N+1):**
```typescript
const appointments = await prisma.appointment.findMany({ where: { salonId } });
// Then N queries for each appointment's client, service, staff
```

**Fixed:**
```typescript
const appointments = await prisma.appointment.findMany({
  where: { salonId },
  include: {
    client: { select: { id: true, firstName: true, lastName: true } },
    service: { select: { id: true, name: true, price: true } },
    staff: { select: { id: true, firstName: true, lastName: true } },
  },
  relationLoadStrategy: 'join', // Single query with JOINs
});
```

**Performance tip:** Use `relationLoadStrategy: 'join'` for PostgreSQL - uses LATERAL JOINs instead of multiple queries.

**Confidence:** HIGH (Prisma official documentation)

**Sources:**
- [Prisma Query Optimization](https://www.prisma.io/docs/orm/prisma-client/queries/query-optimization-performance)
- [Prisma Relation Queries](https://www.prisma.io/docs/orm/prisma-client/queries/relation-queries)

---

### Background Refetch Fix

**Issue:** TanStack Query background refetches causing UI flicker

**Recommendation:** No new library - configuration fix

```typescript
// Disable aggressive refetching for stable data
const { data } = useQuery({
  queryKey: ['services', salonId],
  queryFn: fetchServices,
  staleTime: 5 * 60 * 1000,      // 5 minutes
  gcTime: 30 * 60 * 1000,        // 30 minutes
  refetchOnWindowFocus: false,   // Don't refetch on tab focus
  refetchOnReconnect: false,     // Don't refetch on reconnect
});
```

**Confidence:** HIGH (TanStack Query docs)

---

## 3. SEO

### Sitemap Generation

**Issue:** Missing sitemap.xml and robots.txt

**Options Evaluated:**

| Approach | Library | Recommendation |
|----------|---------|----------------|
| Next.js built-in | None | **RECOMMENDED** |
| next-sitemap | next-sitemap@^4.2.3 | Alternative (older) |

**Recommendation:** Next.js built-in sitemap.ts

Next.js 14 has native sitemap support via `app/sitemap.ts`. No external library needed.

```typescript
// apps/web/src/app/sitemap.ts
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://peacase.com';

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'monthly', priority: 1 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/features`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  ];
}
```

```typescript
// apps/web/src/app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/dashboard/', '/api/'] },
    sitemap: 'https://peacase.com/sitemap.xml',
  };
}
```

**Why not next-sitemap:** Built-in solution is simpler, no external dependency, better maintained.

**Confidence:** HIGH (Next.js official docs)

**Sources:**
- [Next.js Sitemap Docs](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [Next.js generateSitemaps](https://nextjs.org/docs/app/api-reference/functions/generate-sitemaps)

---

### JSON-LD Structured Data

**Issue:** Missing structured data for rich search results

**Options Evaluated:**

| Approach | Library | Recommendation |
|----------|---------|----------------|
| Native JSON-LD | schema-dts (types only) | **RECOMMENDED** |
| next-seo | next-seo@^6.x | Alternative |

**Recommendation:** Native implementation with `schema-dts@^1.1.2` for TypeScript types

```bash
pnpm add -D schema-dts@^1.1.2
```

```typescript
// apps/web/src/components/JsonLd.tsx
import { LocalBusiness, WithContext } from 'schema-dts';

export function BusinessJsonLd({ salon }: { salon: SalonPublic }) {
  const jsonLd: WithContext<LocalBusiness> = {
    '@context': 'https://schema.org',
    '@type': 'BeautySalon',
    name: salon.name,
    address: { '@type': 'PostalAddress', ...salon.address },
    telephone: salon.phone,
    url: `https://peacase.com/book/${salon.slug}`,
  };

  // Render as script tag with type application/ld+json
  // Important: Sanitize user data to prevent XSS (replace < with unicode)
  const sanitizedJson = JSON.stringify(jsonLd).replace(/</g, '\\u003c');

  return (
    <script
      type="application/ld+json"
      // Content is pre-sanitized above
      // eslint-disable-next-line react/no-danger
      {...{ dangerouslySetInnerHTML: { __html: sanitizedJson } }}
    />
  );
}
```

**Security note:** Always sanitize user-provided data in JSON-LD to prevent XSS. Replace `<` with `\u003c`.

**Confidence:** HIGH (Next.js official guide)

**Sources:**
- [Next.js JSON-LD Guide](https://nextjs.org/docs/app/guides/json-ld)
- [schema-dts npm](https://www.npmjs.com/package/schema-dts)

---

### Canonical URLs

**Issue:** Missing canonical URLs causing duplicate content

**Recommendation:** No new library - Next.js metadata

```typescript
// In page.tsx
export const metadata: Metadata = {
  alternates: {
    canonical: 'https://peacase.com/pricing',
  },
};
```

**Confidence:** HIGH (Next.js docs)

---

## 4. Accessibility

### Modal Focus Trapping

**Issue:** Modal dialogs don't trap focus, keyboard users can tab outside

**Recommendation:** Already solved by existing stack

shadcn/ui Dialog uses `@radix-ui/react-dialog@^1.1.15` which includes:
- Automatic focus trapping
- Escape key to close
- `role="dialog"` and `aria-modal="true"`
- Focus return to trigger on close

**Action needed:** Audit existing modals to ensure they use shadcn/ui Dialog, not custom implementations.

If custom modals exist, use `@radix-ui/react-focus-scope@^1.1.8` (already a Radix dependency):

```typescript
import * as FocusScope from '@radix-ui/react-focus-scope';

function CustomModal({ children }) {
  return (
    <FocusScope.Root trapped={true} loop={true}>
      {children}
    </FocusScope.Root>
  );
}
```

**Confidence:** HIGH (Radix UI docs)

**Sources:**
- [Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)
- [shadcn/ui Dialog](https://ui.shadcn.com/docs/components/dialog)

---

### Accessibility Testing

**Issue:** No automated accessibility testing

**Recommendation:** `jest-axe@^10.0.0` + `eslint-plugin-jsx-a11y@^6.10.0`

```bash
# API package (for any server-rendered HTML)
pnpm add -D axe-core@^4.11.1

# Web package
pnpm add -D jest-axe@^10.0.0 @axe-core/cli@^4.11.0
pnpm add -D eslint-plugin-jsx-a11y@^6.10.0
```

**jest-axe integration:**
```typescript
import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';

expect.extend(toHaveNoViolations);

test('Button is accessible', async () => {
  const { container } = render(<Button>Click me</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

**ESLint integration:**
```json
{
  "extends": ["plugin:jsx-a11y/recommended"]
}
```

**Note:** Automated testing catches ~30-57% of accessibility issues. Manual testing with screen readers (NVDA, VoiceOver) is still required.

**Confidence:** HIGH (axe-core official, jest-axe docs)

**Sources:**
- [axe-core GitHub](https://github.com/dequelabs/axe-core)
- [jest-axe npm](https://www.npmjs.com/package/jest-axe)
- [eslint-plugin-jsx-a11y](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y)

---

### Skip Navigation

**Issue:** No skip link for keyboard users

**Recommendation:** No library needed - HTML pattern

```tsx
// apps/web/src/app/layout.tsx
<body>
  <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:p-4">
    Skip to main content
  </a>
  <Header />
  <main id="main-content" tabIndex={-1}>
    {children}
  </main>
</body>
```

**Confidence:** HIGH (WCAG standard pattern)

---

### ARIA Labels

**Issue:** Missing ARIA labels on interactive elements

**Recommendation:** Audit and fix - no library needed

Use eslint-plugin-jsx-a11y to catch violations at lint time:

```json
{
  "rules": {
    "jsx-a11y/aria-props": "error",
    "jsx-a11y/aria-proptypes": "error",
    "jsx-a11y/aria-unsupported-elements": "error",
    "jsx-a11y/role-has-required-aria-props": "error"
  }
}
```

**Confidence:** HIGH

---

## 5. Code Quality

### TypeScript Strictness

**Issue:** `noImplicitAny: false` in API, many `any` types throughout

**Recommendation:** Progressive strictness - no new libraries

**Phase 1: Enable in API tsconfig.json:**
```json
{
  "compilerOptions": {
    "noImplicitAny": true,
    "noUncheckedIndexedAccess": true,
    "strictNullChecks": true
  }
}
```

**Phase 2: Enable project-wide after fixing errors:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

**Why noUncheckedIndexedAccess:** Adds `undefined` to array/object index access, catching common null pointer errors. Not included in `strict` mode by default.

**Confidence:** HIGH (TypeScript official docs)

**Sources:**
- [TypeScript TSConfig Reference](https://www.typescriptlang.org/tsconfig/)
- [Strictest TypeScript Config](https://whatislove.dev/articles/the-strictest-typescript-config/)

---

### ESLint Strict Configuration

**Issue:** Inconsistent linting, missing TypeScript-specific rules

**Recommendation:** `typescript-eslint@^8.0.0` strict configuration

The project uses ESLint 8.56.0. Upgrade to typescript-eslint strict:

```bash
pnpm add -D @typescript-eslint/eslint-plugin@^8.0.0 @typescript-eslint/parser@^8.0.0
```

**Configuration:**
```javascript
// eslint.config.js (flat config)
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
);
```

**Note:** `strict` config is opinionated - review rules before enabling team-wide.

**Confidence:** HIGH (typescript-eslint official docs)

**Sources:**
- [typescript-eslint Getting Started](https://typescript-eslint.io/getting-started/)
- [typescript-eslint Shared Configs](https://typescript-eslint.io/users/configs/)

---

### DRY Violations / Filter Utilities

**Issue:** Repeated filter logic across routes

**Recommendation:** Extract to shared utilities - no library needed

```typescript
// packages/database/src/utils/filters.ts
export const tenantFilter = (salonId: string) => ({ salonId });

export const locationFilter = (salonId: string, locationId?: string) => ({
  salonId,
  ...(locationId && { locationId }),
});

export const dateRangeFilter = (start: Date, end: Date) => ({
  createdAt: { gte: start, lte: end },
});
```

**Confidence:** HIGH (standard pattern)

---

## 6. UI/UX Consistency

### Design Token Management

**Issue:** Inconsistent colors, spacing, component variants

**Recommendation:** TailwindCSS v4 @theme directive (when upgrading) or CSS variables now

**Current approach (TailwindCSS 3.4.1):**
```css
/* apps/web/src/app/globals.css */
:root {
  --color-primary: 222.2 47.4% 11.2%;
  --color-secondary: 210 40% 96%;
  --color-success: 142 76% 36%;
  --color-warning: 38 92% 50%;
  --color-error: 0 84% 60%;

  --spacing-page: 1.5rem;
  --spacing-section: 2rem;
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
}

.dark {
  --color-primary: 210 40% 98%;
  /* ... dark mode overrides */
}
```

**Why not upgrade to Tailwind v4 now:** v4 is new (released Dec 2025). Wait for ecosystem stability before migrating a production app. Current CSS variables approach works with v3 and is forward-compatible with v4's @theme directive.

**Confidence:** MEDIUM (v4 is new, approach is forward-compatible)

**Sources:**
- [Tailwind CSS v4.0](https://tailwindcss.com/blog/tailwindcss-v4)
- [Tailwind Theme Variables](https://tailwindcss.com/docs/theme)
- [Design Tokens Best Practices 2025-2026](https://www.frontendtools.tech/blog/tailwind-css-best-practices-design-system-patterns)

---

### Component Standardization

**Issue:** Multiple modal implementations, inconsistent button variants

**Recommendation:** Audit and consolidate to shadcn/ui - no new libraries

shadcn/ui components (already in stack) provide:
- Consistent variants (default, destructive, outline, secondary, ghost, link)
- Accessible by default (Radix primitives)
- Themeable via CSS variables

**Action:** Create `COMPONENT_STANDARDS.md` documenting:
- When to use Dialog vs AlertDialog vs Sheet
- Button variant usage guidelines
- Status color conventions (success, warning, error, info)
- Loading state patterns

**Confidence:** HIGH

---

### Status Color Consistency

**Issue:** Different colors for same status across pages

**Recommendation:** Define semantic color tokens

```css
:root {
  /* Status colors - use these, not raw colors */
  --status-success: var(--color-success);
  --status-warning: var(--color-warning);
  --status-error: var(--color-error);
  --status-info: var(--color-primary);

  /* Appointment status */
  --status-confirmed: var(--status-success);
  --status-pending: var(--status-warning);
  --status-cancelled: var(--status-error);
  --status-completed: var(--color-muted);
}
```

**Confidence:** HIGH (standard design system pattern)

---

## What NOT to Add

| Suggestion | Why Not |
|------------|---------|
| Redis for CSRF | Double Submit Cookie is stateless |
| next-sitemap | Next.js has built-in sitemap.ts |
| focus-trap-react | Radix already handles this |
| styled-components | Tailwind + shadcn/ui is the existing pattern |
| Winston/Pino logging | morgan + Sentry already in stack |
| Prisma Accelerate | Free tier has connection pooling via Supabase |
| Tailwind v4 upgrade | Too new for production migration |
| react-helmet | Next.js metadata API is superior |

---

## Installation Summary

### New Dependencies

```bash
# Security
pnpm add csrf-csrf@^4.0.3

# Performance (requires Upstash Redis setup)
pnpm add bullmq@^5.66.5 ioredis@^5.4.0

# SEO (types only)
pnpm add -D schema-dts@^1.1.2

# Accessibility
pnpm add -D jest-axe@^10.0.0 axe-core@^4.11.1 eslint-plugin-jsx-a11y@^6.10.0

# Code Quality
pnpm add -D @typescript-eslint/eslint-plugin@^8.0.0 @typescript-eslint/parser@^8.0.0
```

### Configuration Changes (No New Dependencies)

1. **Zod env validation** - Use existing Zod
2. **Prisma query optimization** - Use include with relationLoadStrategy
3. **TanStack Query settings** - Configure staleTime, disable aggressive refetch
4. **Next.js sitemap.ts** - Built-in
5. **Next.js robots.ts** - Built-in
6. **TypeScript strict** - tsconfig.json changes
7. **CSS design tokens** - globals.css variables
8. **Component audit** - Use existing shadcn/ui

---

## Confidence Assessment

| Area | Confidence | Source Quality |
|------|------------|----------------|
| Security (csrf-csrf) | HIGH | npm docs, Express discussions |
| Performance (BullMQ) | HIGH | Official docs, Upstash guide |
| SEO (sitemap, JSON-LD) | HIGH | Next.js official docs |
| Accessibility (axe, jsx-a11y) | HIGH | Deque official, npm |
| Code Quality (TypeScript) | HIGH | Official TypeScript docs |
| UI/UX (design tokens) | MEDIUM | Tailwind v4 is new |

---

## Sources

### Security
- [csrf-csrf npm](https://www.npmjs.com/package/csrf-csrf)
- [Express CSRF Discussion](https://github.com/expressjs/express/discussions/5491)
- [Snyk Node.js CSRF Guide](https://snyk.io/blog/how-to-protect-node-js-apps-from-csrf-attacks/)
- [Zod Env Validation](https://dev.to/roshan_ican/validating-environment-variables-in-nodejs-with-zod-2epn)

### Performance
- [BullMQ Official](https://bullmq.io/)
- [BullMQ Docs](https://docs.bullmq.io/)
- [Upstash BullMQ](https://upstash.com/docs/redis/integrations/bullmq)
- [Prisma Query Optimization](https://www.prisma.io/docs/orm/prisma-client/queries/query-optimization-performance)

### SEO
- [Next.js Sitemap](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [Next.js JSON-LD](https://nextjs.org/docs/app/guides/json-ld)
- [schema-dts](https://www.npmjs.com/package/schema-dts)

### Accessibility
- [axe-core GitHub](https://github.com/dequelabs/axe-core)
- [jest-axe npm](https://www.npmjs.com/package/jest-axe)
- [eslint-plugin-jsx-a11y](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y)
- [Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)
- [UXPin Focus Traps Guide](https://www.uxpin.com/studio/blog/how-to-build-accessible-modals-with-focus-traps/)

### Code Quality
- [TypeScript TSConfig](https://www.typescriptlang.org/tsconfig/)
- [typescript-eslint](https://typescript-eslint.io/)
- [Strictest TypeScript Config](https://whatislove.dev/articles/the-strictest-typescript-config/)

### UI/UX
- [Tailwind CSS v4.0](https://tailwindcss.com/blog/tailwindcss-v4)
- [Tailwind Best Practices 2025-2026](https://www.frontendtools.tech/blog/tailwind-css-best-practices-design-system-patterns)
- [shadcn/ui](https://ui.shadcn.com/)

---

*Research completed: 2026-01-28*
*Ready for roadmap: yes*
