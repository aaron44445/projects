# Requirements: Peacase v1.2 Staff Portal

**Defined:** 2026-01-29
**Core Value:** Every workflow a spa owner needs must work reliably, end-to-end, every time.

## v1.2 Requirements

Requirements for Staff Portal milestone. Each maps to roadmap phases.

### Staff Authentication

- [ ] **AUTH-01**: Owner can send email invite to staff with magic link
- [ ] **AUTH-02**: Staff can set password via magic link
- [ ] **AUTH-03**: Staff can log in at /staff/login with email/password
- [ ] **AUTH-04**: Staff session uses portal-specific JWT tokens (separate from owner tokens)
- [ ] **AUTH-05**: Staff can opt to stay logged in (remember device)

### Schedule & Appointments

- [ ] **SCHED-01**: Staff can view today's appointments on portal dashboard
- [ ] **SCHED-02**: Staff can view upcoming schedule (week view)
- [ ] **SCHED-03**: Appointments automatically filtered by staff's assigned locations
- [ ] **SCHED-04**: Staff can see appointment details (time, service, client name, notes)

### Availability Management

- [ ] **AVAIL-01**: Staff can set recurring weekly availability
- [ ] **AVAIL-02**: Staff can submit time-off requests with date range and reason
- [ ] **AVAIL-03**: Staff can view time-off request status (pending/approved/rejected)

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

- [ ] **PROF-01**: Staff can view their profile info and assigned services/locations
- [ ] **PROF-02**: Staff can edit phone number and avatar (owner controls name/services)

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
| AUTH-01 | TBD | Pending |
| AUTH-02 | TBD | Pending |
| AUTH-03 | TBD | Pending |
| AUTH-04 | TBD | Pending |
| AUTH-05 | TBD | Pending |
| SCHED-01 | TBD | Pending |
| SCHED-02 | TBD | Pending |
| SCHED-03 | TBD | Pending |
| SCHED-04 | TBD | Pending |
| AVAIL-01 | TBD | Pending |
| AVAIL-02 | TBD | Pending |
| AVAIL-03 | TBD | Pending |
| TIME-01 | TBD | Pending |
| TIME-02 | TBD | Pending |
| TIME-03 | TBD | Pending |
| EARN-01 | TBD | Pending |
| EARN-02 | TBD | Pending |
| EARN-03 | TBD | Pending |
| EARN-04 | TBD | Pending |
| PROF-01 | TBD | Pending |
| PROF-02 | TBD | Pending |
| PERM-01 | TBD | Pending |
| DEBT-01 | TBD | Pending |
| DEBT-02 | TBD | Pending |
| DEBT-03 | TBD | Pending |
| DEBT-04 | TBD | Pending |

**Coverage:**
- v1.2 requirements: 26 total
- Mapped to phases: 0 (pending roadmap creation)
- Unmapped: 26

---
*Requirements defined: 2026-01-29*
*Last updated: 2026-01-29 after initial definition*
