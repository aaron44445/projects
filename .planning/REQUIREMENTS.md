# Requirements: Peacase v1.2 Staff Portal

**Defined:** 2026-01-29
**Core Value:** Every workflow a spa owner needs must work reliably, end-to-end, every time.

## v1.2 Requirements

Requirements for Staff Portal milestone. Each maps to roadmap phases.

### Staff Authentication

- [x] **AUTH-01**: Owner can send email invite to staff with magic link
- [x] **AUTH-02**: Staff can set password via magic link
- [x] **AUTH-03**: Staff can log in at /staff/login with email/password
- [x] **AUTH-04**: Staff session uses portal-specific JWT tokens (separate from owner tokens)
- [x] **AUTH-05**: Staff can opt to stay logged in (remember device)

### Schedule & Appointments

- [x] **SCHED-01**: Staff can view today's appointments on portal dashboard
- [x] **SCHED-02**: Staff can view upcoming schedule (week view)
- [x] **SCHED-03**: Appointments automatically filtered by staff's assigned locations
- [x] **SCHED-04**: Staff can see appointment details (time, service, client name, notes)

### Availability Management

- [x] **AVAIL-01**: Staff can set recurring weekly availability
- [x] **AVAIL-02**: Staff can submit time-off requests with date range and reason
- [x] **AVAIL-03**: Staff can view time-off request status (pending/approved/rejected)

### Time Tracking

- [ ] **TIME-01**: Staff can clock in when starting shift
- [ ] **TIME-02**: Staff can clock out when ending shift
- [ ] **TIME-03**: Staff can view their clock in/out history

### Earnings

- [ ] **EARN-01**: Staff can view earnings summary (tips, commissions) for current period
- [ ] **EARN-02**: Staff can see service-level earnings breakdown
- [ ] **EARN-03**: Staff can view pay period history
- [ ] **EARN-04**: Staff can export earnings to CSV

### Profile

- [x] **PROF-01**: Staff can view their profile info and assigned services/locations
- [x] **PROF-02**: Staff can edit phone number and avatar (owner controls name/services)

### Permissions & Settings

- [ ] **PERM-01**: Owner can configure what client info staff can see (full/limited/none)

### Technical Debt

- [ ] **DEBT-01**: Fix booking widget input styling (white on white text)
- [ ] **DEBT-02**: Fix remaining low-contrast text patterns (charcoal/50, /60, /70)
- [ ] **DEBT-03**: Update cron reminders to route through NotificationLog
- [ ] **DEBT-04**: Replace direct fetch calls with centralized api client

## Future Requirements

Deferred beyond v1.2:

### Multi-Location Enhancements
- **LOC-01**: Staff location switching UI (if working multiple locations same day)
- **LOC-02**: Location-specific time tracking

### Advanced Staff Features
- **ADV-01**: Shift swapping between staff
- **ADV-02**: Staff-to-staff messaging
- **ADV-03**: Push notifications for schedule changes

## Out of Scope

| Feature | Reason |
|---------|--------|
| Payroll integration | Complex, salons use dedicated payroll software (Gusto, ADP) |
| Staff messaging/chat | High complexity, use existing tools (Slack, text) |
| Shift swapping | Complex coordination, defer to v1.3+ |
| Mobile app | Web-first, responsive design sufficient for v1.2 |
| Offline mode | Staff portal requires real-time data accuracy |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 19 | Complete |
| AUTH-02 | Phase 19 | Complete |
| AUTH-03 | Phase 19 | Complete |
| AUTH-04 | Phase 19 | Complete |
| AUTH-05 | Phase 19 | Complete |
| SCHED-01 | Phase 20 | Complete |
| SCHED-02 | Phase 20 | Complete |
| SCHED-03 | Phase 20 | Complete |
| SCHED-04 | Phase 20 | Complete |
| AVAIL-01 | Phase 21 | Complete |
| AVAIL-02 | Phase 21 | Complete |
| AVAIL-03 | Phase 21 | Complete |
| TIME-01 | Phase 22 | Pending |
| TIME-02 | Phase 22 | Pending |
| TIME-03 | Phase 22 | Pending |
| EARN-01 | Phase 23 | Pending |
| EARN-02 | Phase 23 | Pending |
| EARN-03 | Phase 23 | Pending |
| EARN-04 | Phase 23 | Pending |
| PROF-01 | Phase 20 | Complete |
| PROF-02 | Phase 20 | Complete |
| PERM-01 | Phase 23 | Pending |
| DEBT-01 | Phase 24 | Pending |
| DEBT-02 | Phase 24 | Pending |
| DEBT-03 | Phase 24 | Pending |
| DEBT-04 | Phase 24 | Pending |

**Coverage:**
- v1.2 requirements: 26 total
- Mapped to phases: 26 (100% coverage)
- Unmapped: 0

---
*Requirements defined: 2026-01-29*
*Last updated: 2026-01-29 after Phase 21 completion*
