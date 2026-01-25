# Roadmap: Peacase Stabilization

## Overview

This roadmap transforms Peacase from "feature-complete but unreliable" into production-ready SaaS software. We audit and fix all owner-facing workflows end-to-end, following data flows from authentication through booking, payments, and notifications. Each phase delivers verifiable reliability improvements that bring the platform closer to handling real spa/salon operations. The focus is systematic stabilization: test like a spa owner, fix what's broken, validate it stays fixed.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Authentication & Tenant Isolation** - Verify multi-tenant security foundation
- [ ] **Phase 2: Core Data Flows** - Stabilize staff and multi-location management
- [ ] **Phase 3: Online Booking Widget** - Make client booking reliable and conflict-free
- [ ] **Phase 4: Payment Processing** - Verify Stripe integration works every time
- [ ] **Phase 5: Notification System** - Fix SMS and connect email reminders
- [ ] **Phase 6: Settings Persistence** - Ensure configuration changes apply immediately
- [ ] **Phase 7: Dashboard & Validation** - Accurate stats and edge case handling

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
- [ ] 02-01-PLAN.md — Verify and fix staff CRUD operations end-to-end
- [ ] 02-02-PLAN.md — Verify and fix location switching and management
- [ ] 02-03-PLAN.md — Verify and fix staff-location assignment and filtering
- [ ] 02-04-PLAN.md — Verify and fix location-specific service settings
- [ ] 02-05-PLAN.md — Audit and fix API route permissions (RBAC Part 1)
- [ ] 02-06-PLAN.md — Audit and fix frontend permission gating (RBAC Part 2)

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

**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

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

**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

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

**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

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

**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

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

**Plans**: TBD

Plans:
- [ ] 07-01: TBD
- [ ] 07-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Authentication & Tenant Isolation | 0/0 | Not started | - |
| 2. Core Data Flows | 0/6 | Planned | - |
| 3. Online Booking Widget | 0/0 | Not started | - |
| 4. Payment Processing | 0/0 | Not started | - |
| 5. Notification System | 0/0 | Not started | - |
| 6. Settings Persistence | 0/0 | Not started | - |
| 7. Dashboard & Validation | 0/0 | Not started | - |

---
*Roadmap created: 2026-01-25*
*Last updated: 2026-01-25*
