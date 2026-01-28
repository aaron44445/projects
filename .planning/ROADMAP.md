# Roadmap: Peacase Stabilization

## Overview

This roadmap transforms Peacase from "feature-complete but unreliable" into production-ready SaaS software. We audit and fix all owner-facing workflows end-to-end, following data flows from authentication through booking, payments, and notifications. Each phase delivers verifiable reliability improvements that bring the platform closer to handling real spa/salon operations. The focus is systematic stabilization: test like a spa owner, fix what's broken, validate it stays fixed.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Authentication & Tenant Isolation** - Verify multi-tenant security foundation
- [x] **Phase 2: Core Data Flows** - Stabilize staff and multi-location management
- [x] **Phase 3: Online Booking Widget** - Make client booking reliable and conflict-free
- [x] **Phase 4: Payment Processing** - Verify Stripe integration works every time
- [ ] **Phase 5: Notification System** - Fix SMS and connect email reminders
- [x] **Phase 6: Settings Persistence** - Ensure configuration changes apply immediately
- [x] **Phase 7: Dashboard & Validation** - Accurate stats and edge case handling
- [x] **Phase 8: Register Missing Production Routers** - [GAP CLOSURE] Fix API route registration
- [x] **Phase 9: Authentication & Tenant Isolation Execution** - [GAP CLOSURE] Execute Phase 1 requirements
- [x] **Phase 10: Dark Mode for Public Pages** - Add dark mode support to all public-facing pages
- [x] **Phase 11: Settings Audit** - Audit all settings functionality to identify working/broken controls
- [x] **Phase 12: Security Hardening** - [GAP CLOSURE] Complete AUTH-01 with Prisma query and webhook fixes

## Phase Details

### Phase 1: Authentication & Tenant Isolation

**Goal**: Verified multi-tenant security foundation where each salon's data is completely isolated

**Depends on**: Nothing (first phase)

**Requirements**: AUTH-01, AUTH-02, AUTH-03

**Success Criteria** (what must be TRUE):
  1. User stays logged in across page refreshes without losing session
  2. User tokens refresh automatically without random logouts during use
  3. Salon A cannot access Salon B's data through any API endpoint or UI interaction
  4. All database queries verified to include salonId filter (multi-tenant audit complete)
  5. Two-salon test suite passes with 100% isolation (create data for both, verify zero cross-access)

**Plans**: TBD

Plans:
- [ ] 01-01: TBD
- [ ] 01-02: TBD

### Phase 2: Core Data Flows

**Goal**: Staff and multi-location management work reliably for daily operations

**Depends on**: Phase 1

**Requirements**: STAFF-01, STAFF-02, STAFF-03, LOC-01, LOC-02, LOC-03

**Success Criteria** (what must be TRUE):
  1. Owner can add, edit, and remove staff members without errors
  2. Staff assignments to locations persist and display correctly in scheduling
  3. Staff permissions apply correctly based on role (staff vs manager vs owner)
  4. Owner can switch between locations and see correct location-specific data
  5. Appointments, staff, and services filtered correctly by selected location
  6. Location-specific settings (hours, services) apply only to that location

**Plans**: 6 plans

Plans:
- [x] 02-01-PLAN.md — Verify and fix staff CRUD operations end-to-end
- [x] 02-02-PLAN.md — Verify and fix location switching and management
- [x] 02-03-PLAN.md — Verify and fix staff-location assignment and filtering
- [x] 02-04-PLAN.md — Verify and fix location-specific service settings
- [x] 02-05-PLAN.md — Audit and fix API route permissions (RBAC Part 1)
- [x] 02-06-PLAN.md — Audit and fix frontend permission gating (RBAC Part 2)

### Phase 3: Online Booking Widget

**Goal**: Client-facing booking widget works reliably without double-bookings or failures

**Depends on**: Phase 2

**Requirements**: BOOK-01, BOOK-02, BOOK-03

**Success Criteria** (what must be TRUE):
  1. Booking flow succeeds every time without random failures or timeout errors
  2. Widget shows only genuinely available time slots (respects business hours, staff availability, existing appointments)
  3. Concurrent booking attempts for same slot handled correctly (only one succeeds, others see conflict)
  4. Double-booking prevention verified under load (100 concurrent requests, 0% double-books)
  5. Booking confirmation appears immediately in owner's calendar after client books

**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md — Implement transactional booking with pessimistic locking
- [x] 03-02-PLAN.md — Audit availability calculation and add alternative slot suggestions
- [x] 03-03-PLAN.md — Load testing and concurrent booking verification

### Phase 4: Payment Processing

**Goal**: Stripe payment integration works reliably with proper webhook handling

**Depends on**: Phase 3

**Requirements**: PAY-01, PAY-02, PAY-03

**Success Criteria** (what must be TRUE):
  1. Card charges process successfully on first attempt for valid cards
  2. Payment webhooks process idempotently (duplicate events don't cause double-charges)
  3. Payment status updates appear correctly on appointments within 60 seconds
  4. Refund flow completes successfully for canceled appointments
  5. Clear error messages display when cards are declined (no generic failures)

**Plans**: 5 plans

Plans:
- [x] 04-01-PLAN.md — Schema and idempotency infrastructure (WebhookEvent model, deposit fields)
- [x] 04-02-PLAN.md — Backend payment endpoints (deposit Payment Intent, webhook handlers)
- [x] 04-03-PLAN.md — Frontend payment components (Payment Element, decline handling)
- [x] 04-04-PLAN.md — Refund flow (time-based policy, cancel/refund integration)
- [x] 04-05-PLAN.md — End-to-end integration (public API, booking widget with payment)

### Phase 5: Notification System

**Goal**: SMS and email reminders send reliably with delivery confirmation

**Depends on**: Phase 4

**Requirements**: NOTF-01, NOTF-02, NOTF-03

**Success Criteria** (what must be TRUE):
  1. SMS notifications send successfully to valid phone numbers (Twilio integration fixed)
  2. Appointment reminder emails send 24 hours before appointment automatically
  3. Booking confirmation emails send immediately after client books online
  4. Delivery status logged for every notification (sent/failed/bounced)
  5. Owner can view notification history to verify reminders were sent

**Plans**: 7 plans

Plans:
- [x] 05-01-PLAN.md — NotificationLog schema and unified notification service
- [x] 05-02-PLAN.md — Twilio SMS status webhook for delivery tracking
- [x] 05-03-PLAN.md — Calendar integration for booking confirmations (ICS/links)
- [x] 05-04-PLAN.md — Configurable reminder timing per salon
- [x] 05-05-PLAN.md — Notification history API and frontend page
- [x] 05-06-PLAN.md — [GAP CLOSURE] Pass calendar fields to all email call sites
- [x] 05-07-PLAN.md — [GAP CLOSURE] Wire notification settings UI to API

### Phase 6: Settings Persistence

**Goal**: All configuration changes apply immediately and persist correctly

**Depends on**: Phase 5

**Requirements**: SET-01, SET-02, SET-03

**Success Criteria** (what must be TRUE):
  1. Settings changes save successfully and persist across page refreshes
  2. Business hours changes apply immediately to booking widget availability
  3. Service pricing updates reflect correctly in new bookings and appointments
  4. Cache invalidates properly so changes appear without manual refresh
  5. Multi-instance deployments sync settings changes across all instances

**Plans**: 4 plans

Plans:
- [x] 06-01-PLAN.md — Wire business hours settings UI to locations hours API
- [x] 06-02-PLAN.md — Verify settings persistence end-to-end (checkpoint) - GAPS FOUND
- [x] 06-03-PLAN.md — [GAP CLOSURE] Fix location context initialization race condition
- [x] 06-04-PLAN.md — [GAP CLOSURE] Fix booking widget to pass locationId to availability API

### Phase 7: Dashboard & Validation

**Goal**: Dashboard displays accurate data and edge cases handled gracefully

**Depends on**: Phase 6

**Requirements**: DASH-01, DASH-02, DASH-03

**Success Criteria** (what must be TRUE):
  1. Dashboard statistics match actual database counts (appointments, revenue, clients)
  2. Today's appointments display correctly in owner's timezone
  3. Revenue tracking shows accurate totals including refunds and adjustments
  4. Timezone edge cases handled correctly (DST transitions, multi-timezone locations)
  5. Error states display user-friendly messages (network failures, invalid states)

**Plans**: 5 plans

Plans:
- [x] 07-01-PLAN.md — Fix dashboard API: timezone-aware today calculations and refund-adjusted revenue
- [x] 07-02-PLAN.md — Add auto-refresh with TanStack Query (60-second interval)
- [x] 07-03-PLAN.md — Implement graceful degradation with partial error states
- [x] 07-04-PLAN.md — Display times in salon timezone on frontend
- [x] 07-05-PLAN.md — End-to-end verification checkpoint (with gap closure)

### Phase 8: Register Missing Production Routers

**Goal**: Fix API route registration so all features work in production

**Depends on**: Phase 7

**Requirements**: NOTF-03 (partial)

**Gap Closure**: Closes gaps from v1-MILESTONE-AUDIT.md
- notificationsRouter not registered in production index.ts
- accountRouter missing from production index.ts
- teamRouter missing from production index.ts
- Flow: "Owner Daily Operations" notification history 404

**Success Criteria** (what must be TRUE):
  1. notificationsRouter registered in index.ts and responds to /api/v1/notifications
  2. accountRouter registered in index.ts and responds to /api/v1/account
  3. teamRouter registered in index.ts and responds to /api/v1/team
  4. Notification history page loads without 404 errors
  5. All routers from app.ts are present in index.ts (parity verified)

**Plans**: 1 plan

Plans:
- [x] 08-01-PLAN.md — Add missing router imports and registrations to index.ts

### Phase 9: Authentication & Tenant Isolation Execution

**Goal**: Execute Phase 1 requirements - verified multi-tenant security foundation

**Depends on**: Phase 8

**Requirements**: AUTH-01, AUTH-02, AUTH-03

**Gap Closure**: Closes gaps from v1-MILESTONE-AUDIT.md
- AUTH-01: Multi-tenant isolation (Phase 1 not executed)
- AUTH-02: Session persistence (Phase 1 not executed)
- AUTH-03: Token refresh (Phase 1 not executed)

**Success Criteria** (what must be TRUE):
  1. User stays logged in across page refreshes without losing session
  2. User tokens refresh automatically without random logouts during use
  3. Salon A cannot access Salon B's data through any API endpoint or UI interaction
  4. All database queries verified to include salonId filter (multi-tenant audit complete)
  5. Two-salon test suite passes with 100% isolation (create data for both, verify zero cross-access)

**Plans**: 5 plans

Plans:
- [x] 09-01-PLAN.md — Prisma query safety: add salonId to all update/delete operations
- [x] 09-02-PLAN.md — Webhook security: Twilio signature validation & tenant verification
- [x] 09-03-PLAN.md — Public endpoint validation: staffId & locationId verification
- [x] 09-04-PLAN.md — Frontend consistency: token keys & API client usage
- [x] 09-05-PLAN.md — Test suite: session persistence & tenant isolation tests

### Phase 10: Dark Mode for Public Pages

**Goal**: Add full dark mode support to all public-facing pages with a theme toggle

**Depends on**: Phase 9

**Requirements**: UX enhancement for public pages

**Success Criteria** (what must be TRUE):
  1. All public pages support dark mode (landing, pricing, features, about, contact, login, signup)
  2. Theme toggle with sun/moon icons in top right header
  3. No unstyled/white sections visible in dark mode
  4. Theme preference persists in localStorage
  5. Color scheme matches existing dashboard dark mode

**Plans**: 1 plan

Plans:
- [x] 10-01-PLAN.md — Implement dark mode for all public pages with theme toggle

### Phase 11: Settings Audit

**Goal**: Audit all settings functionality to identify what works and what doesn't

**Depends on**: Phase 10

**Requirements**: Quality assurance for settings section

**Success Criteria** (what must be TRUE):
  1. SETTINGS-AUDIT.md documents every button/toggle/input in settings
  2. Each control categorized as WORKING, NOT WORKING, or PARTIALLY WORKING
  3. All settings pages covered: Account, Business, Staff, Notifications, Billing, etc.
  4. Clear documentation of what each control should do vs what it actually does

**Plans**: 1 plan

Plans:
- [x] 11-01-PLAN.md — Comprehensive settings functionality audit

### Phase 12: Security Hardening

**Goal**: Complete AUTH-01 requirement by fixing all documented security gaps from Phase 9 findings

**Depends on**: Phase 11

**Requirements**: AUTH-01 (gap closure)

**Gap Closure**: Closes tech debt from v1-MILESTONE-AUDIT-2.md

**Already Fixed (verified by code inspection):**
- C1: 14 Prisma update/delete queries - FIXED (all include salonId)
- C2: Twilio SMS webhook signature - FIXED (webhooks.ts lines 29-56)
- C3: Subscription webhook validation - FIXED (subscriptions.ts lines 294-311)
- C4: Invoice webhook verification - FIXED (subscriptions.ts lines 394-400)
- C5: Gift card webhook validation - FIXED (webhooks.ts lines 177-185)
- H4: Client portal dashboard salonId - FIXED (clientPortal.ts line 21)

**Remaining (addressed in this phase):**
- C7: ownerNotifications routes filter by userId only (defense-in-depth)
- 2 minor clientPortal queries (booking, reviews)

**Success Criteria** (what must be TRUE):
  1. All Prisma update/delete queries include salonId in WHERE clause
  2. ownerNotifications routes include salonId verification
  3. clientPortal remaining queries include salonId
  4. AUTH-01 requirement fully SATISFIED (100% multi-tenant isolation)

**Plans**: 2 plans

Plans:
- [x] 12-01-PLAN.md — Add salonId to remaining Prisma queries (clientPortal + ownerNotifications)
- [x] 12-02-PLAN.md — Update audit documentation to reflect fixed status

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10 -> 11 -> 12

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Authentication & Tenant Isolation | 0/0 | Superseded by Phase 9 | - |
| 2. Core Data Flows | 6/6 | Complete | 2026-01-25 |
| 3. Online Booking Widget | 3/3 | Complete | 2026-01-25 |
| 4. Payment Processing | 5/5 | Complete | 2026-01-25 |
| 5. Notification System | 7/7 | Human Verification | - |
| 6. Settings Persistence | 4/4 | Complete | 2026-01-27 |
| 7. Dashboard & Validation | 5/5 | Complete | 2026-01-27 |
| 8. Register Missing Production Routers | 1/1 | Complete | 2026-01-28 |
| 9. Authentication & Tenant Isolation Execution | 5/5 | Complete | 2026-01-28 |
| 10. Dark Mode for Public Pages | 1/1 | Complete | 2026-01-28 |
| 11. Settings Audit | 1/1 | Complete | 2026-01-28 |
| 12. Security Hardening | 2/2 | Complete | 2026-01-28 |

---
*Roadmap created: 2026-01-25*
*Last updated: 2026-01-28 (Phase 12 complete - v1 milestone finished)*
