# Peacase - Spa & Salon SaaS Platform

## What This Is

Peacase is a multi-tenant SaaS platform for spas and salons. Business owners use it to manage appointments, clients, staff, services, and payments. Clients can book online through an embeddable widget. The platform supports multiple locations per business.

This milestone focuses on **stabilization** — auditing and fixing all owner-facing features so the software is reliable enough for real businesses to use.

## Core Value

**Every workflow a spa owner needs must work reliably, end-to-end, every time.** If booking fails randomly or settings don't save, the software is unusable regardless of what features exist.

## Requirements

### Validated

Features that exist in the codebase (built, may have bugs):

- ✓ User signup and authentication — existing
- ✓ Business onboarding flow — existing
- ✓ Client management (add, view, edit clients) — existing
- ✓ Service management (create services, set pricing) — existing
- ✓ Appointment scheduling (calendar UI, create/edit appointments) — existing
- ✓ Online booking widget (embeddable public booking) — existing
- ✓ Staff management (add staff, assign to locations) — existing
- ✓ Multi-location support (multiple business locations) — existing
- ✓ Stripe payment integration — existing
- ✓ Dashboard with business stats — existing
- ✓ Settings management (business hours, preferences) — existing
- ✓ Email integration (SendGrid) — existing
- ✓ SMS integration (Twilio) — existing

### Active

Stabilization work for this milestone:

- [ ] Audit and fix signup → onboarding → first booking flow
- [ ] Make online booking reliable (currently inconsistent)
- [ ] Verify staff management works for owners
- [ ] Test and fix multi-location management
- [ ] Verify payment processing works end-to-end
- [ ] Connect and test appointment reminder emails
- [ ] Fix SMS notifications (currently broken)
- [ ] Ensure all settings actually apply changes
- [ ] Verify dashboard displays accurate data
- [ ] End-to-end test all owner workflows

### Out of Scope

- Staff Portal (staff login, clock in/out, earnings view) — separate milestone
- New features — this milestone is stabilization only
- Mobile app — web-first
- Additional payment providers — Stripe sufficient for v1

## Context

**Current State:**
- Monorepo: Next.js 14 frontend (Vercel) + Express.js API (Render) + PostgreSQL (Supabase)
- Core features built but untested from real business perspective
- Developer doesn't own a spa — can't QA like a real user would
- Bugs surface randomly during use; no systematic testing done
- Claude Code sometimes marks features "done" without full verification

**Known Issues:**
- Online booking unreliable (works sometimes, fails sometimes)
- SMS notifications not working
- Email reminders may not be connected
- Settings changes may not persist or apply
- Staff portal untested (deferred to next milestone)
- Multi-location support untested

**Tech Stack:**
- Frontend: Next.js 14, React 18, TailwindCSS, shadcn/ui, Zustand
- Backend: Express.js, Prisma 5.8, PostgreSQL
- Integrations: Stripe, SendGrid, Twilio, Cloudinary
- Hosting: Vercel (web), Render (API), Supabase (database)

## Constraints

- **Testing approach**: Must test from spa owner perspective, not developer perspective
- **No breaking changes**: Existing data and users must continue working
- **Multi-tenant safety**: All queries must filter by salonId
- **Budget**: Using existing infrastructure (Vercel free, Render free, Supabase free tier)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Defer Staff Portal | Focus on owner experience first; staff features add complexity | — Pending |
| Stabilize before adding features | Unreliable software is unusable regardless of feature count | — Pending |
| Test as real spa owner | Developer lacks domain knowledge; must simulate real workflows | — Pending |

---
*Last updated: 2026-01-25 after initialization*
