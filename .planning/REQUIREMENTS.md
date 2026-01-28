# Requirements: Peacase v1.1 Audit Remediation

**Defined:** 2026-01-28
**Core Value:** Every workflow a spa owner needs must work reliably, end-to-end, every time.

## v1.1 Requirements

Requirements for audit remediation. Each maps to roadmap phases.

### Security

- [ ] **SEC-01**: Application enforces ENCRYPTION_KEY in production (fails startup if missing)
- [ ] **SEC-02**: Application enforces JWT_SECRET in production (fails startup if missing)
- [ ] **SEC-03**: File DELETE endpoint validates ownership via database lookup, not path
- [ ] **SEC-04**: Password validation requires uppercase, lowercase, number, and special character

### Performance

- [ ] **PERF-01**: Email/SMS notifications are queued asynchronously (don't block API responses)
- [ ] **PERF-02**: Dashboard stats endpoint uses 2-3 consolidated queries instead of 8
- [ ] **PERF-03**: VIP client count uses database COUNT, not client-side filtering
- [ ] **PERF-04**: Dashboard hook has refetchIntervalInBackground: false

### SEO

- [ ] **SEO-01**: sitemap.ts generates dynamic sitemap at /sitemap.xml
- [ ] **SEO-02**: robots.txt allows public pages, blocks /dashboard and /admin
- [ ] **SEO-03**: All public pages have canonical URLs in metadata
- [ ] **SEO-04**: Landing page has Organization and SoftwareApplication JSON-LD schemas

### Accessibility

- [ ] **A11Y-01**: All modals have role="dialog", aria-modal="true", and focus trap
- [ ] **A11Y-02**: Time slot buttons in booking widget have aria-label attributes
- [ ] **A11Y-03**: Root layout has "Skip to main content" link for keyboard users
- [ ] **A11Y-04**: Text using charcoal/70 opacity increased to charcoal/80 for contrast

### Code Quality

- [ ] **CODE-01**: All filter objects in routes use explicit Prisma types (no `any`)
- [ ] **CODE-02**: API tsconfig.json has noImplicitAny: true
- [ ] **CODE-03**: Common salonId filter patterns extracted to shared utility
- [ ] **CODE-04**: Console.log/warn/error replaced with structured logger

### UI/UX

- [ ] **UI-01**: All modal dialogs use packages/ui Modal component (not custom implementations)
- [ ] **UI-02**: Status/tag colors defined in single shared constants file
- [ ] **UI-03**: Error states use design tokens (error/10, error/20) not hardcoded colors
- [ ] **UI-04**: Empty states use reusable EmptyState component

## Future Requirements

Deferred to v1.2:

### Staff Portal
- **PORTAL-01**: Staff can log in with separate auth flow
- **PORTAL-02**: Staff can clock in/out
- **PORTAL-03**: Staff can view earnings

### Settings Polish
- **SET-01**: Subscription add-on persistence
- **SET-02**: Multi-location CRUD UI completion

## Out of Scope

| Feature | Reason |
|---------|--------|
| Redis for CSRF tokens | In-memory acceptable for single instance |
| Virus scanning on uploads | Cloudinary provides protection |
| Access token lifetime reduction | Would require significant testing |
| Compression middleware | Vercel/Render handle this |
| Full WCAG 2.2 compliance | 2.1 AA is the legal requirement |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | Phase 13 | Pending |
| SEC-02 | Phase 13 | Pending |
| SEC-03 | Phase 13 | Pending |
| SEC-04 | Phase 13 | Pending |
| PERF-01 | Phase 14 | Pending |
| PERF-02 | Phase 14 | Pending |
| PERF-03 | Phase 14 | Pending |
| PERF-04 | Phase 14 | Pending |
| SEO-01 | Phase 15 | Pending |
| SEO-02 | Phase 15 | Pending |
| SEO-03 | Phase 15 | Pending |
| SEO-04 | Phase 15 | Pending |
| A11Y-01 | Phase 16 | Pending |
| A11Y-02 | Phase 16 | Pending |
| A11Y-03 | Phase 16 | Pending |
| A11Y-04 | Phase 16 | Pending |
| CODE-01 | Phase 17 | Pending |
| CODE-02 | Phase 17 | Pending |
| CODE-03 | Phase 17 | Pending |
| CODE-04 | Phase 17 | Pending |
| UI-01 | Phase 18 | Pending |
| UI-02 | Phase 18 | Pending |
| UI-03 | Phase 18 | Pending |
| UI-04 | Phase 18 | Pending |

**Coverage:**
- v1.1 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-28*
*Last updated: 2026-01-28 after initial definition*
