# Requirements Archive: v1 Stabilization

**Archived:** 2026-01-28
**Status:** SHIPPED

This is the archived requirements specification for v1.
For current requirements, see `.planning/REQUIREMENTS.md` (created for next milestone).

---

# Requirements: Peacase Stabilization

**Defined:** 2026-01-25
**Core Value:** Every workflow a spa owner needs must work reliably, end-to-end, every time.

## v1 Requirements

Requirements for stabilization milestone. Each maps to roadmap phases.

### Authentication & Security

- [x] **AUTH-01**: Multi-tenant isolation verified (Salon A cannot access Salon B data) - *Phases 9, 12*
- [x] **AUTH-02**: Session persistence works (users stay logged in across refreshes) - *Phase 9*
- [x] **AUTH-03**: Token refresh reliable (no random logouts during use) - *Phase 9*

### Online Booking

- [x] **BOOK-01**: Booking flow succeeds every time (no random failures) - *Phase 3*
- [x] **BOOK-02**: Double-booking prevention (same slot cannot be booked twice) - *Phase 3*
- [x] **BOOK-03**: Availability calculation correct (shows accurate available times) - *Phase 3*

### Notifications

- [x] **NOTF-01**: SMS notifications working (Twilio integration fixed) - *Phase 5*
- [x] **NOTF-02**: Email appointment reminders connected and sending - *Phase 5*
- [x] **NOTF-03**: Booking confirmation emails sent to clients - *Phases 5, 8*

### Payments

- [x] **PAY-01**: Payment processing verified (Stripe charges work) - *Phase 4*
- [x] **PAY-02**: Webhook handling reliable (payment status updates correctly) - *Phase 4*
- [x] **PAY-03**: Refund flow works (cancellations can be refunded) - *Phase 4*

### Settings

- [x] **SET-01**: Settings changes apply immediately - *Phase 6*
- [x] **SET-02**: Business hours affect booking availability - *Phase 6*
- [x] **SET-03**: Service pricing updates reflect in bookings - *Phase 6*

### Multi-Location

- [x] **LOC-01**: Location switching works for owners - *Phase 2*
- [x] **LOC-02**: Location-specific data correct (appointments/staff per location) - *Phase 2*
- [x] **LOC-03**: Location-specific settings work (hours/services per location) - *Phase 2*

### Staff Management

- [x] **STAFF-01**: Add/edit staff works correctly - *Phase 2*
- [x] **STAFF-02**: Staff scheduling works (assign to appointments/shifts) - *Phase 2*
- [x] **STAFF-03**: Staff permissions work correctly (role-based access) - *Phase 2*

### Dashboard

- [x] **DASH-01**: Dashboard shows accurate statistics - *Phase 7*
- [x] **DASH-02**: Today's appointments display correctly - *Phase 7*
- [x] **DASH-03**: Revenue tracking accurate - *Phase 7*

## v2 Requirements (Deferred)

Tracked but not in this milestone.

### Staff Portal

- **PORTAL-01**: Staff can log in to their own portal
- **PORTAL-02**: Staff can clock in/out
- **PORTAL-03**: Staff can view their earnings
- **PORTAL-04**: Staff can view their schedule
- **PORTAL-05**: Staff can view their performance stats

### Advanced Features

- **ADV-01**: Marketing email campaigns
- **ADV-02**: Gift card management
- **ADV-03**: Loyalty program
- **ADV-04**: Inventory tracking

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Staff Portal | Separate milestone - focus on owner experience first |
| New features | Stabilization only - no new functionality |
| Mobile app | Web-first approach |
| Additional payment providers | Stripe sufficient for v1 |
| Real-time chat | High complexity, not core value |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 9, 12 | Complete |
| AUTH-02 | Phase 9 | Complete |
| AUTH-03 | Phase 9 | Complete |
| BOOK-01 | Phase 3 | Complete |
| BOOK-02 | Phase 3 | Complete |
| BOOK-03 | Phase 3 | Complete |
| NOTF-01 | Phase 5 | Complete |
| NOTF-02 | Phase 5 | Complete |
| NOTF-03 | Phase 5, 8 | Complete |
| PAY-01 | Phase 4 | Complete |
| PAY-02 | Phase 4 | Complete |
| PAY-03 | Phase 4 | Complete |
| SET-01 | Phase 6 | Complete |
| SET-02 | Phase 6 | Complete |
| SET-03 | Phase 6 | Complete |
| LOC-01 | Phase 2 | Complete |
| LOC-02 | Phase 2 | Complete |
| LOC-03 | Phase 2 | Complete |
| STAFF-01 | Phase 2 | Complete |
| STAFF-02 | Phase 2 | Complete |
| STAFF-03 | Phase 2 | Complete |
| DASH-01 | Phase 7 | Complete |
| DASH-02 | Phase 7 | Complete |
| DASH-03 | Phase 7 | Complete |

**Coverage:**
- v1 requirements: 24 total
- Satisfied: 24/24 (100%)

---

## Milestone Summary

**Shipped:** 24 of 24 v1 requirements (100%)

**Adjusted:**
- AUTH-01: Originally Phase 1, executed in Phases 9 and 12 for more thorough implementation
- NOTF-03: Added Phase 8 gap closure for router registration

**Dropped:** None

---
*Archived: 2026-01-28 as part of v1 milestone completion*
