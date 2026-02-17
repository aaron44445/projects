# Aircraft Cleaning & Detailing Booking Platform — Design Document

**Date:** 2026-02-17
**Status:** Approved
**Initial Customer:** AircraftSpa (aircraftspa.com)
**Long-term Goal:** SaaS platform for all aircraft cleaning/detailing businesses

---

## 1. Overview

An industry-specific booking and operations platform for aircraft cleaning companies. Covers the full workflow: Booking → Pricing → Dispatch → Job Execution → Payment → Retention.

Built as a multi-tenant SaaS from day one. AircraftSpa is the first customer; the architecture supports onboarding additional businesses through subdomain-based tenancy.

---

## 2. Architecture

**Pattern:** pnpm monorepo (Next.js + Express + Prisma)

```
aircraftspa/
├── apps/
│   ├── web/              Next.js 14 (App Router, TailwindCSS, shadcn/ui)
│   │   ├── src/app/
│   │   │   ├── (booking)/    Customer booking flow (public)
│   │   │   ├── (dashboard)/  Admin dashboard (auth required)
│   │   │   ├── (tech)/       Technician mobile view (auth required)
│   │   │   └── api/          Webhook receivers (Stripe, Twilio)
│   └── api/              Express.js API server
│       └── src/
│           ├── routes/       RESTful endpoints
│           ├── services/     Business logic (pricing, scheduling, notifications)
│           ├── middleware/   Auth, RBAC, multi-tenant isolation
│           └── cron/        Reminder notifications, stale booking cleanup
├── packages/
│   ├── database/         Prisma schema + migrations
│   ├── types/            Shared TypeScript types
│   └── ui/               Shared UI components
├── turbo.json
└── pnpm-workspace.yaml
```

**Deployment:**
- Frontend: Vercel (wildcard subdomain)
- API: Render
- Database: Supabase (PostgreSQL)
- File storage: Cloudinary

**Multi-Tenancy:**
- Subdomain routing: `{business}.aircraftspa.com`
- All queries scoped by `businessId` via Prisma middleware
- Row-level tenant isolation on every table

---

## 3. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TailwindCSS, shadcn/ui, Zustand, React Query |
| Backend | Express.js, Node.js |
| Database | PostgreSQL (Supabase), Prisma 5 |
| Auth | Better Auth (TypeScript-native, session-based, RBAC) |
| Payments | Stripe Connect (platform model) |
| Email | Sendr (transactional email) |
| SMS | Twilio |
| Photos | Cloudinary |
| Airport Data | OurAirports dataset (seeded, 55,000+ airports) |

---

## 4. Data Model

### Tenant & Auth
- **Business** — SaaS tenant. Subdomain, branding, Stripe Connect account, settings.
- **User** — Business staff. Roles: owner, admin, manager, technician. Email/password auth.
- **Customer** — Aircraft owners/pilots. Email magic link auth. Scoped per business.

### Aircraft & Services
- **AircraftClass** — Seeded: single engine, twin, turboprop, light jet, midsize jet, heavy jet, helicopter. Size multiplier for pricing.
- **Service** — Business-configurable. Base price, duration estimate. (Interior, Exterior, Full Detail)
- **AddOn** — Per-business. Price, optional aircraft-class multiplier. (Carpet shampoo, brightwork polish, ceramic coating, etc.)

### Location
- **Airport** — Seeded from OurAirports: ICAO, IATA, name, lat/lng, city, state, country.
- **ServiceArea** — Business-defined radius from home base. Travel fee: per-mile rate, minimum, max radius.
- **BookingLocation** — Per-booking: airport reference, hangar/ramp, location notes.

### Booking & Scheduling
- **Booking** — Core entity. Customer, aircraft details, services, add-ons, location, time, crew, status (pending → confirmed → in_progress → completed → cancelled).
- **PricingBreakdown** — Immutable snapshot: base + add-ons + travel + rush = total. Never recalculated.
- **CrewSchedule** — Available time blocks per crew member per day.
- **TimeBlock** — Booked slots with travel/cleanup buffers.

### Payments
- **Payment** — Stripe payment intents. Deposit at booking, balance at completion.
- **Invoice** — Phase 2 (FBO/charter accounts, net-30).

### Operations
- **JobChecklist** — Business-configurable checklist templates per service.
- **JobPhoto** — Before/after photos. Cloudinary storage, linked to booking.
- **NotificationLog** — Email/SMS delivery tracking.

### Pricing Rules
- **PricingRule** — Per-business config: base price matrix (aircraft class × service), add-on prices, travel fee rate, rush multipliers, minimum booking amount.

---

## 5. Customer Booking Flow

Target: under 60 seconds for returning customers, under 2 minutes first-time.

### Step 1 — Aircraft Details
- Select aircraft class (visual cards with icons)
- Optional tail number (text input; API lookup Phase 2)
- Service type: Interior / Exterior / Full Detail
- Add-ons as toggles (filtered by service type)

### Step 2 — Location
- Airport autocomplete (searches ICAO, IATA, name, city)
- Hangar vs ramp selection
- Out-of-service-area handling (quote request fallback)
- Travel fee calculated and shown in real-time
- Optional location notes

### Step 3 — Instant Pricing
- Live price calculation as selections change
- Clear breakdown: base + add-ons + travel + rush = total
- Deposit amount shown (configurable %)
- "How is this priced?" expandable explainer

### Step 4 — Date & Time
- Calendar with available slots (crew-capacity-aware)
- Blocked: existing bookings, travel buffers, crew unavailability
- Rush surcharge indicator on same-day/next-day slots
- Auto-calculated duration

### Step 5 — Customer Info & Payment
- Name, email, phone
- Stripe Elements card input
- Deposit charged via Payment Intent
- Balance captured on job completion

### Step 6 — Confirmation
- Booking summary page
- Email with calendar invite (.ics)
- SMS confirmation
- "Add to Calendar" button

---

## 6. Admin Dashboard

### Dashboard Home
- Today's jobs, weekly pipeline, recent bookings, revenue snapshot

### Scheduling
- Drag-and-drop calendar (day/week/month)
- Color-coded by status
- Crew assignment via drag
- Conflict detection with visual warnings
- Travel time shown as buffer blocks

### Pricing Rules Engine
- Base price matrix: aircraft class × service (editable grid)
- Add-on pricing table
- Travel fee config (per-mile, minimum, max radius)
- Rush multiplier settings
- Minimum booking amount
- Real-time preview calculator

### Customer CRM
- Search/filter customer list
- Profile: contact, aircraft, history, lifetime value
- Tail number registry across bookings
- Notes, tags, service history with photos

### Crew Management
- Add/edit/deactivate crew members
- Recurring weekly availability + overrides
- Home base airport assignment
- Skills/certifications tracking
- Performance metrics

### Payments Dashboard
- Pending deposits, balances to capture, completed payments
- Refund management
- Revenue reports (by service, aircraft class, time period)
- Stripe Connect integration

### Settings
- Business profile (name, logo, contact)
- Service area configuration
- Notification templates
- Booking policies (cancellation window, deposit %)
- Operating hours

---

## 7. Technician Mobile View

Mobile-first, designed for hangar environments.

### Today's Jobs
- Sorted job list with time, airport, aircraft, service, customer
- Tap to expand, navigation link to airport

### Job Detail
- Aircraft info, location, customer contact (tap to call/text)
- Business-configured checklist (tap to check off)
- Notes field

### Photo Upload
- Required before/after photos
- Camera integration (device camera)
- Cloudinary storage

### Status Controls
- Start Job → in_progress
- Complete Job → triggers balance capture
- Report Issue → flags for admin

### Offline Support
- Jobs list cached for offline viewing
- Photos queued for upload on reconnect
- Status updates queued and synced

---

## 8. Notifications

### Customer Notifications
| Event | Channel | Content |
|-------|---------|---------|
| Booking confirmed | Email + SMS | Summary, calendar invite, cancellation link |
| Reminder | Email + SMS | Configurable timing (default 24h), job details |
| Tech en route | SMS | Real-time status |
| Job started | SMS | Status update |
| Job completed | Email + SMS | Completion + payment receipt |

### Admin Notifications
- New booking (email + in-app)
- Payment received
- Cancellation request
- Technician issue report

### Templates
- All templates business-configurable in Settings
- Default templates out of the box
- Variable substitution: customer name, aircraft, service, date, time, location, price

---

## 9. Auth & RBAC

**Staff Auth:** Better Auth with email/password, session-based.

**Customer Auth:** Email magic link (minimal friction).

**Role Hierarchy:**
| Role | Permissions |
|------|------------|
| Owner | Everything + billing + business settings |
| Admin | Everything except billing/ownership |
| Manager | Scheduling, CRM, crew management, view payments |
| Technician | Own jobs, checklist, photos, status updates |

---

## 10. MVP Scope

### In Scope
- Full 6-step customer booking flow
- Instant pricing engine (admin-configurable rules)
- Airport database with autocomplete + travel fee calculation
- Real-time availability (crew-capacity-aware)
- Stripe Connect payments (deposit + balance)
- Admin dashboard (scheduling, pricing, CRM, payments, crew, settings)
- Technician mobile view (jobs, checklist, photos, status, offline)
- Subdomain-based multi-tenancy
- Email (Sendr) + SMS (Twilio) notifications
- Role-based access control (4 tiers)

### Out of Scope (Phase 2+)
- Fleet/charter operator portals
- AI tail number lookup
- Route optimization for mobile crews
- Membership/maintenance plans
- Custom domain support
- Invoice/net-30 billing for FBOs
- Advanced analytics/reporting
- Customer reviews/ratings

---

## 11. Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture | Monorepo (Next.js + Express) | Proven pattern, clean separation, independent scaling |
| Multi-tenancy | Subdomain-based, row-level isolation | Simple, works at scale, no custom DNS complexity |
| Pricing | Admin-configured rules engine | No code changes needed to onboard new businesses |
| Payments | Deposit + balance via Stripe Connect | Industry standard, platform fee model for SaaS revenue |
| Airport data | Seeded from OurAirports | Free, comprehensive (55K+ airports), lat/lng for distance calc |
| Auth | Better Auth (TypeScript-native) | Type-safe, built for multi-tenant, role-based |
| Email | Sendr | Customer preference |
| Customer auth | Magic link | Minimum friction for booking conversion |
| Offline | Service worker + queue | Hangars have poor connectivity; crew needs reliability |
