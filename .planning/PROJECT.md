# Peacase - Spa & Salon SaaS Platform

## What This Is

Peacase is a multi-tenant SaaS platform for spas and salons. Business owners use it to manage appointments, clients, staff, services, and payments. Clients can book online through an embeddable widget. The platform supports multiple locations per business.

**v1 shipped:** The platform is now production-ready with verified reliability for all owner-facing workflows.

## Core Value

**Every workflow a spa owner needs must work reliably, end-to-end, every time.** If booking fails randomly or settings don't save, the software is unusable regardless of what features exist.

## Current State

**v1 Stabilization shipped:** 2026-01-28

The platform has been audited and stabilized:
- Multi-tenant isolation verified (defense-in-depth salonId filtering)
- Online booking reliable with transactional guarantees (no double-bookings)
- Payment processing working end-to-end with Stripe
- Notification system with delivery tracking and configurable reminders
- Dashboard with accurate timezone-aware metrics
- Settings persistence verified across all configuration types

**Tech Stack:**
- Frontend: Next.js 14, React 18, TailwindCSS, shadcn/ui, Zustand, TanStack Query
- Backend: Express.js, Prisma 5.8, PostgreSQL
- Integrations: Stripe, SendGrid, Twilio, Cloudinary
- Hosting: Vercel (web), Render (API), Supabase (database)

## Requirements

### Validated

Features shipped in v1:

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

### Active

For next milestone (v1.1):

- [ ] Staff Portal (login, clock in/out, earnings view)
- [ ] Subscription add-on persistence (API integration)
- [ ] Stripe Connect integration (completed)
- [ ] Multi-location CRUD UI completion
- [ ] Booking widget input styling fixes

### Out of Scope

- Mobile app — web-first approach, PWA works well
- Real-time chat — high complexity, not core value
- Additional payment providers — Stripe sufficient
- Offline mode — real-time booking is core value

## Context

**Shipped v1.0:**
- 40 plans executed across 12 phases
- 130 commits in 4 days
- 24/24 requirements satisfied
- All 7 CRITICAL security findings resolved
- 5/5 E2E flows verified

**Known Technical Debt (v1.1 backlog):**
- Booking widget input fields styling (white on white)
- Cron reminders bypass NotificationLog
- Some direct fetch calls instead of api client
- Different token key names per context

## Constraints

- **Multi-tenant safety**: All queries must filter by salonId (verified in v1)
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
| Lazy state initialization | Eliminates LocationContext race condition | Good |

---
*Last updated: 2026-01-28 after v1.0 milestone*
