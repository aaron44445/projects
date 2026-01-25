# Requirements: Peacase Stabilization

**Defined:** 2026-01-25
**Core Value:** Every workflow a spa owner needs must work reliably, end-to-end, every time.

## v1 Requirements

Requirements for stabilization milestone. Each maps to roadmap phases.

### Authentication & Security

- [ ] **AUTH-01**: Multi-tenant isolation verified (Salon A cannot access Salon B data)
- [ ] **AUTH-02**: Session persistence works (users stay logged in across refreshes)
- [ ] **AUTH-03**: Token refresh reliable (no random logouts during use)

### Online Booking

- [x] **BOOK-01**: Booking flow succeeds every time (no random failures)
- [x] **BOOK-02**: Double-booking prevention (same slot cannot be booked twice)
- [x] **BOOK-03**: Availability calculation correct (shows accurate available times)

### Notifications

- [ ] **NOTF-01**: SMS notifications working (Twilio integration fixed)
- [ ] **NOTF-02**: Email appointment reminders connected and sending
- [ ] **NOTF-03**: Booking confirmation emails sent to clients

### Payments

- [ ] **PAY-01**: Payment processing verified (Stripe charges work)
- [ ] **PAY-02**: Webhook handling reliable (payment status updates correctly)
- [ ] **PAY-03**: Refund flow works (cancellations can be refunded)

### Settings

- [ ] **SET-01**: Settings changes apply immediately
- [ ] **SET-02**: Business hours affect booking availability
- [ ] **SET-03**: Service pricing updates reflect in bookings

### Multi-Location

- [x] **LOC-01**: Location switching works for owners
- [x] **LOC-02**: Location-specific data correct (appointments/staff per location)
- [x] **LOC-03**: Location-specific settings work (hours/services per location)

### Staff Management

- [x] **STAFF-01**: Add/edit staff works correctly
- [x] **STAFF-02**: Staff scheduling works (assign to appointments/shifts)
- [x] **STAFF-03**: Staff permissions work correctly (role-based access)

### Dashboard

- [ ] **DASH-01**: Dashboard shows accurate statistics
- [ ] **DASH-02**: Today's appointments display correctly
- [ ] **DASH-03**: Revenue tracking accurate

## v2 Requirements

Deferred to future milestone. Tracked but not in current roadmap.

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
| Staff Portal | Separate milestone — focus on owner experience first |
| New features | Stabilization only — no new functionality |
| Mobile app | Web-first approach |
| Additional payment providers | Stripe sufficient for v1 |
| Real-time chat | High complexity, not core value |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| BOOK-01 | Phase 3 | Complete |
| BOOK-02 | Phase 3 | Complete |
| BOOK-03 | Phase 3 | Complete |
| NOTF-01 | Phase 5 | Pending |
| NOTF-02 | Phase 5 | Pending |
| NOTF-03 | Phase 5 | Pending |
| PAY-01 | Phase 4 | Pending |
| PAY-02 | Phase 4 | Pending |
| PAY-03 | Phase 4 | Pending |
| SET-01 | Phase 6 | Pending |
| SET-02 | Phase 6 | Pending |
| SET-03 | Phase 6 | Pending |
| LOC-01 | Phase 2 | Complete |
| LOC-02 | Phase 2 | Complete |
| LOC-03 | Phase 2 | Complete |
| STAFF-01 | Phase 2 | Complete |
| STAFF-02 | Phase 2 | Complete |
| STAFF-03 | Phase 2 | Complete |
| DASH-01 | Phase 7 | Pending |
| DASH-02 | Phase 7 | Pending |
| DASH-03 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-25*
*Last updated: 2026-01-25 after Phase 3 completion*
