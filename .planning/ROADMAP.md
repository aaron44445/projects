# Roadmap: Peacase v1.2 Staff Portal

## Overview

The Staff Portal extends Peacase's multi-tenant booking platform to enable staff self-service. Starting from Phase 19 (continuing from v1.1), this milestone prioritizes security-first authentication with portal-specific JWT tokens, establishes data visibility boundaries to protect client PII, then rolls out schedule viewing, availability management, time tracking, and earnings transparency. The existing infrastructure (JWT auth, CommissionRecord tracking, appointment management) handles 95% of requirements—the work is safe integration into production, not greenfield development. This roadmap delivers 26 requirements across 6 phases, enabling staff independence while maintaining multi-tenant isolation and owner control.

## Milestones

- ✅ **v1.0 Stabilization** - Phases 1-12 (shipped 2026-01-28)
- ✅ **v1.1 Audit Remediation** - Phases 13-18 (shipped 2026-01-29)
- 🚧 **v1.2 Staff Portal** - Phases 19-24 (in progress)

## Phases

<details>
<summary>✅ v1.0 Stabilization (Phases 1-12) - SHIPPED 2026-01-28</summary>

Core platform with booking, payments, notifications, and multi-tenant security. 40 plans executed across 12 phases.

</details>

<details>
<summary>✅ v1.1 Audit Remediation (Phases 13-18) - SHIPPED 2026-01-29</summary>

Production hardening across security, performance, SEO, accessibility, code quality, and UI/UX. 46 plans executed across 6 phases.

</details>

### 🚧 v1.2 Staff Portal (In Progress)

**Milestone Goal:** Enable staff self-service with authentication, schedule viewing, time tracking, earnings visibility, and availability management.

- [ ] **Phase 19: Staff Authentication Foundation** - Secure staff login with portal-specific tokens
- [ ] **Phase 20: Staff Portal Core** - Schedule viewing and profile management
- [ ] **Phase 21: Availability & Time Off** - Self-service availability and time-off requests
- [ ] **Phase 22: Time Tracking** - Clock in/out with history
- [ ] **Phase 23: Earnings & Permissions** - Earnings visibility and client info controls
- [ ] **Phase 24: Technical Debt** - Cleanup deferred issues

## Phase Details

### Phase 19: Staff Authentication Foundation

**Goal**: Staff can securely log in to dedicated portal using magic link invites and credentials that cannot access owner routes.

**Depends on**: Nothing (first phase of v1.2)

**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05

**Success Criteria** (what must be TRUE):
  1. Owner can send email invite to staff with working magic link
  2. Staff can set password via magic link and log in at /staff/login
  3. Staff session uses portal-specific JWT tokens that return 401 on owner routes
  4. Staff can opt to stay logged in across browser sessions
  5. Staff can log out from any page in portal

**Plans**: 5 plans

Plans:
- [ ] 19-01-PLAN.md — Portal-specific JWT tokens with 15-min access, rememberMe support
- [ ] 19-02-PLAN.md — Remember me checkbox on staff login page
- [ ] 19-03-PLAN.md — Resend invite endpoint and invite status tracking
- [ ] 19-04-PLAN.md — Apply ownerPortalOnly middleware to owner routes
- [ ] 19-05-PLAN.md — Staff portal logout from header

### Phase 20: Staff Portal Core

**Goal**: Staff can view their schedule, appointment details, and manage their profile with location-aware filtering.

**Depends on**: Phase 19 (requires authentication)

**Requirements**: SCHED-01, SCHED-02, SCHED-03, SCHED-04, PROF-01, PROF-02

**Success Criteria** (what must be TRUE):
  1. Staff can view today's appointments on portal dashboard
  2. Staff can view upcoming schedule with week view
  3. Appointments automatically filter by staff's assigned locations
  4. Staff can see appointment details including client name, service, time, and notes
  5. Staff can view their profile info and assigned services/locations
  6. Staff can edit their phone number and avatar

**Plans**: TBD

Plans:
- [ ] 20-01: TBD during phase planning
- [ ] 20-02: TBD during phase planning

### Phase 21: Availability & Time Off

**Goal**: Staff can self-manage recurring availability and submit time-off requests with approval tracking.

**Depends on**: Phase 20 (needs schedule views established)

**Requirements**: AVAIL-01, AVAIL-02, AVAIL-03

**Success Criteria** (what must be TRUE):
  1. Staff can set recurring weekly availability (e.g., Mon-Fri 9am-5pm)
  2. Staff can submit time-off requests with date range and reason
  3. Staff can view all time-off requests with status (pending/approved/rejected)
  4. Changes to availability respect salon's approval workflow settings

**Plans**: TBD

Plans:
- [ ] 21-01: TBD during phase planning
- [ ] 21-02: TBD during phase planning

### Phase 22: Time Tracking

**Goal**: Staff can clock in/out for shifts and view their complete clock history with timezone-aware accuracy.

**Depends on**: Phase 20 (needs portal infrastructure)

**Requirements**: TIME-01, TIME-02, TIME-03

**Success Criteria** (what must be TRUE):
  1. Staff can clock in when starting their shift
  2. Staff can clock out when ending their shift
  3. Staff can view their complete clock in/out history with dates and durations
  4. Time entries display in staff's correct timezone for multi-location salons

**Plans**: TBD

Plans:
- [ ] 22-01: TBD during phase planning

### Phase 23: Earnings & Permissions

**Goal**: Staff can view transparent earnings breakdown with tips and commissions while owner controls client information visibility.

**Depends on**: Phase 20 (needs appointment completion events to trigger commissions)

**Requirements**: EARN-01, EARN-02, EARN-03, EARN-04, PERM-01

**Success Criteria** (what must be TRUE):
  1. Staff can view earnings summary for current period (tips + commissions)
  2. Staff can see service-level earnings breakdown
  3. Staff can view pay period history for all past periods
  4. Staff can export earnings to CSV for personal records
  5. Owner can configure what client info staff can see (full/limited/none)
  6. Staff portal respects client visibility settings on all pages

**Plans**: TBD

Plans:
- [ ] 23-01: TBD during phase planning
- [ ] 23-02: TBD during phase planning

### Phase 24: Technical Debt

**Goal**: Resolve deferred UI/UX issues, logging gaps, and API inconsistencies to maintain code quality.

**Depends on**: Phase 23 (cleanup after features complete)

**Requirements**: DEBT-01, DEBT-02, DEBT-03, DEBT-04

**Success Criteria** (what must be TRUE):
  1. Booking widget inputs have readable text (no white on white)
  2. All low-contrast text patterns (charcoal/50, /60, /70) meet WCAG 2.1 AA
  3. Cron reminder notifications route through NotificationLog for delivery tracking
  4. All API calls use centralized api client (no direct fetch)

**Plans**: TBD

Plans:
- [ ] 24-01: TBD during phase planning

## Progress

**Execution Order:**
Phases execute in numeric order: 19 → 20 → 21 → 22 → 23 → 24

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 19. Staff Authentication Foundation | 0/5 | Ready | - |
| 20. Staff Portal Core | 0/TBD | Not started | - |
| 21. Availability & Time Off | 0/TBD | Not started | - |
| 22. Time Tracking | 0/TBD | Not started | - |
| 23. Earnings & Permissions | 0/TBD | Not started | - |
| 24. Technical Debt | 0/TBD | Not started | - |

---
*Created: 2026-01-29*
*v1.2 milestone: 26 requirements mapped across 6 phases*
