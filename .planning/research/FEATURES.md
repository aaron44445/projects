# Features Research: Staff Portal

**Domain:** Spa/Salon SaaS - Staff Portal Module
**Researched:** 2026-01-29
**Overall Confidence:** MEDIUM-HIGH

## Executive Summary

Staff portals in spa/salon software serve as self-service hubs for employees, enabling schedule viewing, earnings tracking, time-off management, and profile updates without requiring owner intervention. Industry research shows a clear divide between **table stakes features** (schedule viewing, basic authentication) and **differentiators** (real-time earnings transparency, self-service availability management). The Peacase codebase already has substantial infrastructure built (staff authentication, time-off requests, earnings tracking via CommissionRecord), positioning this milestone for rapid completion.

Key finding: The most valued staff portal features prioritize **mobile accessibility** and **transparency** over administrative control. Staff expect to manage their own schedules and view real-time earnings without manager approval workflows (though approval can be optional).

## Table Stakes (Must Have)

Features every staff portal needs. Missing these makes the portal feel incomplete.

| Feature | Why Expected | Complexity | Existing Support | Notes |
|---------|--------------|------------|------------------|-------|
| **Staff Login/Auth** | Separate from owner login; dedicated portal entry | Low | ✅ Complete | `/auth/login`, `/auth/refresh`, JWT tokens with refresh |
| **Schedule Viewing** | Staff need to see their appointments for the week/month | Low | ✅ Complete | `/schedule` endpoint with date range filtering |
| **Today's Appointments** | Staff need a dashboard showing today's schedule | Low | ✅ Complete | `/dashboard` returns today + upcoming appointments |
| **Client Contact Info** | View client name/phone for appointments | Low | ✅ Complete | Controlled by `staffCanViewClientContact` setting |
| **Earnings/Commission View** | Staff expect to see what they've earned | Medium | ✅ Complete | `/earnings` endpoint with CommissionRecord aggregation |
| **Profile Management** | Update name, phone, avatar, certifications | Low | ✅ Complete | `/profile` PATCH endpoint |
| **View Assigned Services** | See which services they're qualified to perform | Low | ✅ Complete | `/services` endpoint via StaffService junction |
| **Time-Off Requests** | Request vacation/sick days with approval workflow | Medium | ✅ Complete | POST `/time-off`, GET `/time-off`, DELETE `/time-off/:id` |
| **Time-Off Status Tracking** | See if requests are pending/approved/rejected | Low | ✅ Complete | TimeOff.status field with reviewer tracking |
| **Multi-Location Support** | Staff assigned to multiple locations see location-specific schedules | Medium | ✅ Complete | StaffLocation model with isPrimary flag |

**Dependency Analysis:**
- All table stakes features depend on existing User model with role-based access
- Schedule features depend on Appointment model (already exists)
- Earnings depend on CommissionRecord model (already exists)
- Time-off depends on TimeOff model with approval workflow (already exists)

**MVP Recommendation:** All table stakes features are already built. Focus on frontend implementation.

## Differentiators (Nice to Have)

Features that set products apart from basic staff portals. Not expected, but highly valued.

| Feature | Value Proposition | Complexity | Existing Support | Notes |
|---------|-------------------|------------|------------------|-------|
| **Self-Service Availability Editing** | Staff can update their working hours without manager intervention | Medium | ⚠️ Partial | PUT `/my-schedule` exists, but frontend needs approval workflow UI |
| **Schedule Change Approval Workflow** | When enabled, staff changes require manager approval before taking effect | High | ✅ Complete | ScheduleChangeRequest model with pending/approved/rejected status |
| **Real-Time Earnings Breakdown** | Show commission, tips, and total earnings with service-level detail | Medium | ✅ Complete | `/earnings` includes appointment-level breakdown with service names |
| **Appointment Completion from Portal** | Staff can mark appointments as "completed" from their view | Low | ✅ Complete | PATCH `/appointments/:id/complete` |
| **Client History View** | See past appointments with clients they've served | Low | ✅ Complete | `/clients` endpoint returns clients with appointment history |
| **Location Assignment View** | Clear indication of which locations staff work at | Low | ✅ Complete | `/my-assignments` returns locations + services with isPrimary flag |
| **Tips Tracking** | Separate display of tips vs commission | Medium | ✅ Complete | CommissionRecord.tipAmount tracked separately |
| **Mobile-First Interface** | Optimized for staff accessing on phones between appointments | High | ❌ Not Built | Requires responsive frontend design |
| **Weekly Hours Summary** | Show total hours scheduled per week | Low | ✅ Complete | `/my-schedule` calculates totalHoursPerWeek |
| **Push Notifications** | Real-time alerts for schedule changes, approvals, new appointments | High | ❌ Not Built | Would require Firebase/OneSignal integration |

**Competitive Advantage Features (Based on Research):**

1. **Transparent Earnings with Service Breakdown** - GlossGenius, BarbNow, and Homebase all emphasize this. Peacase already has it via `/earnings` endpoint with appointment-level detail including service names and client names.

2. **Flexible Self-Service with Optional Approval** - Most platforms force one approach (always approval OR always direct). Peacase supports both via `staffCanEditSchedule` and `staffScheduleNeedsApproval` salon settings, giving owners control.

3. **Multi-Location Schedule Management** - Many competitors treat locations as separate entities. Peacase's StaffLocation model with isPrimary flag and location-specific availability is more sophisticated.

## Anti-Features (Do NOT Build)

Common requests that should be rejected with reasons.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Clock In/Out Time Tracking** | High complexity (GPS verification, photo capture, fraud prevention), not core to spa/salon booking workflow, requires always-on mobile app | Use scheduled appointment times as proxy for hours worked. If owner needs time tracking, recommend third-party integration (e.g., Homebase, Connecteam) |
| **Shift Swapping Between Staff** | Complex approval logic (who approves? what if no one accepts?), requires notification system, creates scheduling conflicts | Staff request time off → owner reassigns appointments manually. Keeps owner in control. |
| **Staff-to-Staff Messaging** | Becomes support burden (harassment, inappropriate content), requires moderation, not core value | Staff use external tools (WhatsApp, Slack). Focus on owner-staff communication if needed. |
| **Performance Analytics for Staff** | Can create unhealthy competition, requires sophisticated metrics (repeat client rate, satisfaction scores), owner may not want staff seeing comparative data | Earnings view shows individual performance. Owner dashboard handles cross-staff analytics. |
| **Direct Appointment Booking by Staff** | Bypasses owner's booking rules, complicates double-booking prevention, creates accountability issues | Staff can complete existing appointments but not create new ones. Owner retains booking control. |
| **Payroll Integration** | Highly regulated, requires tax handling, liability issues, outside core competency | Export earnings data to CSV. Owner uses dedicated payroll software (Gusto, QuickBooks). |
| **Staff Can Cancel Client Appointments** | Risk of abuse, creates client service issues, owner needs final say | Staff can request time off which blocks their schedule. Owner handles appointment cancellations. |
| **In-App Training/Certification Tracking** | Content management burden, legal implications for certifications, not booking-related | `certifications` text field for staff to list their credentials. Links to external platforms if needed. |

**Rationale:** Anti-features share common themes:
1. **High operational overhead** with low booking-related value
2. **Shift accountability from owner to platform** (legal/HR risks)
3. **Require always-on mobile app infrastructure** (not web-first approach)
4. **Create moderation burden** (staff-to-staff interactions)

## Feature Dependencies

### Existing Features (v1.0 - v1.1) That Staff Portal Depends On:

```
Staff Portal
├── Authentication
│   ├── JWT_SECRET (v1.1 - env validation)
│   ├── JWT_REFRESH_SECRET (new for staff portal)
│   ├── RefreshToken model (exists)
│   └── Password complexity enforcement (v1.1)
│
├── Appointment System
│   ├── Appointment model (v1.0)
│   ├── Service model (v1.0)
│   ├── Client model (v1.0)
│   └── Multi-tenant isolation via salonId (v1.0)
│
├── Earnings Tracking
│   ├── CommissionRecord model (v1.0)
│   ├── Payment model with Stripe integration (v1.0)
│   └── Commission calculation logic (v1.0)
│
├── Staff Management
│   ├── User model with role field (v1.0)
│   ├── StaffService junction (v1.0)
│   ├── StaffAvailability model (v1.0)
│   └── TimeOff model with approval workflow (v1.0)
│
├── Multi-Location Support
│   ├── Location model (v1.0)
│   ├── StaffLocation junction with isPrimary (v1.0)
│   └── Location-specific business hours (v1.0)
│
└── Settings Infrastructure
    ├── Salon.staffCanEditSchedule (exists)
    ├── Salon.staffCanRequestTimeOff (exists)
    ├── Salon.staffCanViewClientContact (exists)
    ├── Salon.staffCanCompleteAppointments (exists)
    └── Salon.staffScheduleNeedsApproval (exists)
```

### Features Requiring Existing Infrastructure (All Present):

| Staff Portal Feature | Depends On | Status |
|---------------------|------------|--------|
| Staff login | JWT auth, User.role field, passwordHash | ✅ Ready |
| Schedule viewing | Appointment model, salonId isolation | ✅ Ready |
| Earnings display | CommissionRecord, Payment, Stripe integration | ✅ Ready |
| Time-off requests | TimeOff model, approval workflow, reviewer tracking | ✅ Ready |
| Self-service availability | StaffAvailability model, location support | ✅ Ready |
| Profile management | User model with avatarUrl, certifications | ✅ Ready |
| Service assignments | StaffService junction model | ✅ Ready |

### New Features Requiring Additional Infrastructure:

| Feature | Requires | Estimated Effort |
|---------|----------|-----------------|
| Mobile-optimized UI | Responsive Next.js pages, PWA configuration | High (2-3 days) |
| Push notifications | Firebase Cloud Messaging OR OneSignal | High (3-5 days) |
| Photo upload for avatar | Cloudinary integration (already exists for logo) | Low (4 hours) |
| CSV earnings export | Backend CSV generation route | Low (2 hours) |

## Feature Prioritization for v1.2

Based on what's already built vs what requires new work:

### Phase 1: Frontend for Existing Backend (v1.2 Core)
- [ ] Staff login page (`/staff/login`)
- [ ] Staff dashboard (today's appointments, earnings summary)
- [ ] Schedule view (calendar/list view)
- [ ] Profile management page
- [ ] Time-off request form
- [ ] Time-off status tracking page
- [ ] Earnings detail view

**Effort:** 3-5 days (all backend already exists)

### Phase 2: Self-Service Features (v1.2 Extended)
- [ ] Availability editing interface
- [ ] Schedule change approval workflow UI (for owners)
- [ ] Location switching (for multi-location staff)
- [ ] Service assignments view

**Effort:** 2-3 days

### Phase 3: Polish (v1.2 or v1.3)
- [ ] Mobile-responsive optimization
- [ ] CSV earnings export button
- [ ] Avatar photo upload
- [ ] Empty states for new staff

**Effort:** 2-3 days

### Out of Scope for v1.2
- ❌ Clock in/out time tracking
- ❌ Push notifications
- ❌ Staff-to-staff messaging
- ❌ Shift swapping
- ❌ Mobile app (PWA sufficient)

## Research Quality Notes

**HIGH Confidence Areas:**
- Table stakes features (verified across GlossGenius, MioSalon, BarbNow, Meevo, Salonkee)
- Existing Peacase backend capabilities (verified via codebase inspection)
- Feature dependencies (mapped to schema.prisma and staffPortal.ts routes)

**MEDIUM Confidence Areas:**
- Differentiator value ranking (based on WebSearch of platform marketing, not user interviews)
- Anti-feature categorization (based on industry trends, not Peacase owner feedback)
- Mobile-first UX requirements (general best practices, not salon-specific user testing)

**LOW Confidence Areas:**
- Clock in/out necessity (conflicting data: some platforms emphasize it, others omit)
- Push notification value (mentioned in research but adoption rates unclear)
- Staff portal usage patterns (no data on how often staff actually use these features)

**Validation Needed:**
- Do Peacase owners want staff to self-manage schedules or prefer owner control?
- Is earnings transparency expected or optional per salon culture?
- Mobile usage percentage (staff accessing from phones vs desktop)

## Sources

**Salon Software Features:**
- [GlossGenius Staff Management](https://glossgenius.com/salon-management-software-for-teams)
- [Meevo Employee Management](https://www.meevo.com/features/managing-employees)
- [BarbNow Must-Have Features 2026](https://www.barbnow.com/blog/10-must-have-salon-software-features-for-2026)
- [MioSalon Staff Management](https://www.miosalon.com/features/staff-management)
- [Salonkee Employee Management](https://salonkee.com/pro/en/employee-management/)

**Time Tracking & Scheduling:**
- [Salon Payroll Guide (Homebase)](https://www.joinhomebase.com/blog/salon-software-with-payroll)
- [Best Salon Scheduling Apps 2026](https://www.joinhomebase.com/blog/best-salon-scheduling-app)
- [Spa Employee Management Software (Everhour)](https://everhour.com/blog/spa-employee-management-software/)

**Permissions & Security:**
- [Meevo Security Permissions](https://www.meevo.com/features/security)
- [Role-Based Access Control Guide (Zluri)](https://www.zluri.com/blog/role-based-access-control)
- [GlossGenius Multi-User Software](https://glossgenius.com/blog/multi-user-salon-booking-software-your-team-will-love)

**UX Best Practices:**
- [Best Salon Software Comparison (Fresha)](https://www.fresha.com/for-business/salon/best-salon-software)
- [UI/UX Best Practices 2026](https://uidesignz.com/blogs/ui-ux-design-best-practices)
- [Salon App Development Guide](https://emizentech.com/blog/salon-app-development.html)

**Industry Trends:**
- [Salon Industry Predictions 2026 (SalonScale)](https://www.salonscale.com/post/salon-industry-predictions-for-2026-whats-changing-whats-working-and-what-to-do-next)
- [Salon Automation Trends 2026 (BarbNow)](https://www.barbnow.com/blog/why-2026-will-be-the-breakthrough-year-for-salon-automation)
- [9 Best Salon Software 2026](https://thesalonbusiness.com/best-salon-software/)
