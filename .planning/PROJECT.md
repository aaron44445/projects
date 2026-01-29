# Peacase - Spa & Salon SaaS Platform

## What This Is

Peacase is a multi-tenant SaaS platform for spas and salons. Business owners use it to manage appointments, clients, staff, services, and payments. Clients can book online through an embeddable widget. The platform supports multiple locations per business.

**v1.1 shipped:** Production-hardened with security, performance, SEO, accessibility, code quality, and UI/UX improvements.

## Core Value

**Every workflow a spa owner needs must work reliably, end-to-end, every time.** If booking fails randomly or settings don't save, the software is unusable regardless of what features exist.

## Current State

**v1.1 Audit Remediation shipped:** 2026-01-29

The platform has been hardened across all dimensions:
- **Security:** Environment validation, file ownership verification, password complexity
- **Performance:** Async notification queue, consolidated dashboard queries
- **SEO:** Sitemap, robots.txt, canonical URLs, Organization JSON-LD
- **Accessibility:** WCAG 2.1 AA - focus traps, ARIA, skip nav, contrast
- **Code Quality:** noImplicitAny, structured logging, withSalonId utility
- **UI/UX:** Unified Modal, EmptyState, STATUS_COLORS, design tokens

**Tech Stack:**
- Frontend: Next.js 14, React 18, TailwindCSS, shadcn/ui, Zustand, TanStack Query
- Backend: Express.js, Prisma 5.8, PostgreSQL
- Integrations: Stripe, SendGrid, Twilio, Cloudinary
- Hosting: Vercel (web), Render (API), Supabase (database)

## Current Milestone: v1.2 Staff Portal

**Goal:** Enable staff self-service with authentication, schedule viewing, time tracking, earnings visibility, and availability management.

**Target features:**
- Staff authentication (separate login, magic link invites, portal-specific tokens)
- Schedule & appointments (today's view, week view, location-filtered)
- Time tracking (clock in/out, history)
- Earnings (summary, breakdown, history, CSV export)
- Availability management (weekly availability, time-off requests)
- Profile management (view/edit basics)
- Owner controls (configure staff's client info visibility)
- Technical debt cleanup (booking widget, contrast, cron logging, api client)

## Requirements

### Validated

Features shipped across v1.0 and v1.1:

**v1.0 - Core Platform:**
- Multi-tenant security with complete isolation — v1.0
- Transactional booking with pessimistic locking — v1.0
- Double-booking prevention under concurrent load — v1.0
- Stripe payment integration with deposits — v1.0
- Idempotent webhook handling — v1.0
- Time-based refund policies — v1.0
- Multi-channel notifications (email + SMS) — v1.0
- Delivery tracking with NotificationLog — v1.0
- Configurable reminder timing — v1.0
- Settings persistence across all types — v1.0
- Timezone-aware dashboard metrics — v1.0
- Location-specific business hours — v1.0
- Staff RBAC (role-based access control) — v1.0
- Dark mode for public pages — v1.0

**v1.1 - Audit Remediation:**
- Environment variable enforcement (ENCRYPTION_KEY, JWT_SECRET) — v1.1
- File ownership validation via database lookup — v1.1
- Password complexity requirements — v1.1
- Async notification queue — v1.1
- Dashboard query consolidation — v1.1
- VIP client database COUNT — v1.1
- Background refetch disabled — v1.1
- Sitemap and robots.txt — v1.1
- Canonical URLs and JSON-LD — v1.1
- Modal focus traps and ARIA — v1.1
- Skip navigation and contrast — v1.1
- TypeScript noImplicitAny — v1.1
- Structured logging (pino) — v1.1
- withSalonId utility — v1.1
- Unified Modal component — v1.1
- STATUS_COLORS constants — v1.1
- Error design tokens (rose-*) — v1.1
- EmptyState component — v1.1

### Active

For v1.2 Staff Portal:

- [ ] Staff authentication (invite, login, portal-specific tokens)
- [ ] Schedule viewing (today's appointments, week view, location-filtered)
- [ ] Time tracking (clock in/out, history)
- [ ] Earnings visibility (summary, breakdown, history, CSV export)
- [ ] Availability management (weekly availability, time-off requests)
- [ ] Profile management (view info, edit basics)
- [ ] Client info visibility settings (owner configures per-salon)
- [ ] Technical debt cleanup (booking widget, contrast, cron, api client)

### Out of Scope

- Mobile app — web-first approach, PWA works well
- Real-time chat — high complexity, not core value
- Additional payment providers — Stripe sufficient
- Offline mode — real-time booking is core value
- Redis for CSRF tokens — in-memory acceptable for single instance
- Full WCAG 2.2 compliance — 2.1 AA is the legal requirement

## Context

**Shipped v1.0:** 2026-01-28
- 40 plans executed across 12 phases
- 130 commits in 4 days

**Shipped v1.1:** 2026-01-29
- 46 plans executed across 6 phases
- 198 commits in 2 days
- 24/24 audit requirements satisfied

**Known Technical Debt:**
- 327 low-contrast text patterns in secondary UI elements
- Booking widget input fields styling (white on white)
- Cron reminders bypass NotificationLog
- Some direct fetch calls instead of api client

## Constraints

- **Multi-tenant safety**: All queries must filter by salonId (verified via withSalonId utility)
- **Budget**: Using existing infrastructure (Vercel, Render, Supabase free tiers)
- **No breaking changes**: Existing data and users must continue working

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Defer Staff Portal | Focus on owner experience first; staff features add complexity | Good |
| Stabilize before adding features | Unreliable software is unusable regardless of feature count | Good |
| Advisory locks for booking | Prevents double-booking with retry logic | Good |
| Insert-or-conflict idempotency | Race-safe webhook deduplication | Good |
| Defense-in-depth salonId | All queries include salonId even when unique constraints exist | Good |
| SMS-to-email fallback | Higher notification delivery rates | Good |
| Database-backed notification queue | Simpler than external message broker, fits scale | Good |
| focus-trap-react for modals | Proven library, better than custom focus management | Good |
| withSalonId utility | DRY pattern, type-safe, consistent tenant isolation | Good |
| rose-* design tokens | Consistent error states, better than hardcoded colors | Good |
| pino structured logging | JSON in production, pretty in dev, LOG_LEVEL configurable | Good |

---
*Last updated: 2026-01-29 after v1.2 milestone initialization*
