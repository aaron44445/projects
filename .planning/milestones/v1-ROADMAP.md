# Milestone v1: Stabilization

**Status:** SHIPPED 2026-01-28
**Phases:** 2-12 (Phase 1 superseded by Phase 9)
**Total Plans:** 40

## Overview

Transformed Peacase from "feature-complete but unreliable" into production-ready SaaS software. Audited and fixed all owner-facing workflows end-to-end, following data flows from authentication through booking, payments, and notifications. Each phase delivered verifiable reliability improvements that brought the platform closer to handling real spa/salon operations.

## Phases

### Phase 2: Core Data Flows

**Goal**: Staff and multi-location management work reliably for daily operations

**Depends on**: Phase 1

**Requirements**: STAFF-01, STAFF-02, STAFF-03, LOC-01, LOC-02, LOC-03

**Plans**: 6 plans

- [x] 02-01: Verify and fix staff CRUD operations end-to-end
- [x] 02-02: Verify and fix location switching and management
- [x] 02-03: Verify and fix staff-location assignment and filtering
- [x] 02-04: Verify and fix location-specific service settings
- [x] 02-05: Audit and fix API route permissions (RBAC Part 1)
- [x] 02-06: Audit and fix frontend permission gating (RBAC Part 2)

**Completed:** 2026-01-25

### Phase 3: Online Booking Widget

**Goal**: Client-facing booking widget works reliably without double-bookings or failures

**Depends on**: Phase 2

**Requirements**: BOOK-01, BOOK-02, BOOK-03

**Plans**: 3 plans

- [x] 03-01: Implement transactional booking with pessimistic locking
- [x] 03-02: Audit availability calculation and add alternative slot suggestions
- [x] 03-03: Load testing and concurrent booking verification

**Completed:** 2026-01-25

### Phase 4: Payment Processing

**Goal**: Stripe payment integration works reliably with proper webhook handling

**Depends on**: Phase 3

**Requirements**: PAY-01, PAY-02, PAY-03

**Plans**: 5 plans

- [x] 04-01: Schema and idempotency infrastructure (WebhookEvent model, deposit fields)
- [x] 04-02: Backend payment endpoints (deposit Payment Intent, webhook handlers)
- [x] 04-03: Frontend payment components (Payment Element, decline handling)
- [x] 04-04: Refund flow (time-based policy, cancel/refund integration)
- [x] 04-05: End-to-end integration (public API, booking widget with payment)

**Completed:** 2026-01-25

### Phase 5: Notification System

**Goal**: SMS and email reminders send reliably with delivery confirmation

**Depends on**: Phase 4

**Requirements**: NOTF-01, NOTF-02, NOTF-03

**Plans**: 7 plans

- [x] 05-01: NotificationLog schema and unified notification service
- [x] 05-02: Twilio SMS status webhook for delivery tracking
- [x] 05-03: Calendar integration for booking confirmations (ICS/links)
- [x] 05-04: Configurable reminder timing per salon
- [x] 05-05: Notification history API and frontend page
- [x] 05-06: [GAP CLOSURE] Pass calendar fields to all email call sites
- [x] 05-07: [GAP CLOSURE] Wire notification settings UI to API

**Completed:** 2026-01-26

### Phase 6: Settings Persistence

**Goal**: All configuration changes apply immediately and persist correctly

**Depends on**: Phase 5

**Requirements**: SET-01, SET-02, SET-03

**Plans**: 4 plans

- [x] 06-01: Wire business hours settings UI to locations hours API
- [x] 06-02: Verify settings persistence end-to-end (checkpoint)
- [x] 06-03: [GAP CLOSURE] Fix location context initialization race condition
- [x] 06-04: [GAP CLOSURE] Fix booking widget to pass locationId to availability API

**Completed:** 2026-01-27

### Phase 7: Dashboard & Validation

**Goal**: Dashboard displays accurate data and edge cases handled gracefully

**Depends on**: Phase 6

**Requirements**: DASH-01, DASH-02, DASH-03

**Plans**: 5 plans

- [x] 07-01: Fix dashboard API: timezone-aware today calculations and refund-adjusted revenue
- [x] 07-02: Add auto-refresh with TanStack Query (60-second interval)
- [x] 07-03: Implement graceful degradation with partial error states
- [x] 07-04: Display times in salon timezone on frontend
- [x] 07-05: End-to-end verification checkpoint (with gap closure)

**Completed:** 2026-01-27

### Phase 8: Register Missing Production Routers

**Goal**: Fix API route registration so all features work in production

**Depends on**: Phase 7

**Requirements**: NOTF-03 (partial)

**Gap Closure**: Closes gaps from v1-MILESTONE-AUDIT.md

**Plans**: 1 plan

- [x] 08-01: Add missing router imports and registrations to index.ts

**Completed:** 2026-01-28

### Phase 9: Authentication & Tenant Isolation Execution

**Goal**: Execute Phase 1 requirements - verified multi-tenant security foundation

**Depends on**: Phase 8

**Requirements**: AUTH-01, AUTH-02, AUTH-03

**Gap Closure**: Closes gaps from v1-MILESTONE-AUDIT.md (Phase 1 not executed)

**Plans**: 5 plans

- [x] 09-01: Prisma query safety: add salonId to all update/delete operations
- [x] 09-02: Webhook security: Twilio signature validation & tenant verification
- [x] 09-03: Public endpoint validation: staffId & locationId verification
- [x] 09-04: Frontend consistency: token keys & API client usage
- [x] 09-05: Test suite: session persistence & tenant isolation tests

**Completed:** 2026-01-28

### Phase 10: Dark Mode for Public Pages

**Goal**: Add full dark mode support to all public-facing pages with a theme toggle

**Depends on**: Phase 9

**Requirements**: UX enhancement for public pages

**Plans**: 1 plan

- [x] 10-01: Implement dark mode for all public pages with theme toggle

**Completed:** 2026-01-28

### Phase 11: Settings Audit

**Goal**: Audit all settings functionality to identify what works and what doesn't

**Depends on**: Phase 10

**Requirements**: Quality assurance for settings section

**Plans**: 1 plan

- [x] 11-01: Comprehensive settings functionality audit

**Completed:** 2026-01-28

### Phase 12: Security Hardening

**Goal**: Complete AUTH-01 requirement by fixing all documented security gaps

**Depends on**: Phase 11

**Requirements**: AUTH-01 (gap closure)

**Gap Closure**: Closes tech debt from v1-MILESTONE-AUDIT-2.md

**Plans**: 2 plans

- [x] 12-01: Add salonId to remaining Prisma queries (clientPortal + ownerNotifications)
- [x] 12-02: Update audit documentation to reflect fixed status

**Completed:** 2026-01-28

---

## Milestone Summary

**Key Decisions:**

- Soft delete pattern for staff (isActive: false + email anonymization)
- RepeatableRead isolation with advisory locks for booking transactions
- Insert-or-conflict idempotency pattern for Stripe webhooks
- Defense-in-depth: All queries include salonId even when unique constraints exist
- SMS-to-email fallback for higher notification delivery rates
- Lazy state initialization for LocationContext to prevent race conditions

**Issues Resolved:**

- Double-booking race conditions (advisory locks)
- Random booking failures (transactional guarantees)
- Location context race condition (lazy init)
- Missing router registrations in production (index.ts parity)
- Incomplete tenant isolation (salonId in all queries)

**Issues Deferred:**

- Booking widget input styling (white text on white background)
- Cron reminders bypass NotificationLog
- Subscription add-on persistence (no API)
- Stripe Connect integration (placeholder)
- Multi-location CRUD UI (incomplete)

**Technical Debt Incurred:**

- H5: Direct fetch calls instead of api client (code consistency)
- H6: Different token key names per context (intentional)

---

_For current project status, see .planning/ROADMAP.md (created for next milestone)_
