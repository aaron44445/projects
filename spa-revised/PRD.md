# Pecase - Product Requirements Document

## 1. PRODUCT OVERVIEW

**Product Name:** Pecase

**Tagline:** "Professional salon and spa management. Everything you need. Nothing you don't."

**Domain:** pecase.org

**Vision:** Build the most transparent, modular salon management platform. Salons pay one fair base price for essentials, then add only the features they need. No hidden fees. No forced bundles.

**Target Market:** Solo practitioners and small-to-medium salons (1-30+ staff) in personal care industries: hair, nails, massage, esthetics, waxing, barbering, wellness.

**Core Competitive Advantage:**
- **Modular pricing:** Base $50/month covers essentials. Add features at $25/month each. Pay only for what you use.
- **Better value than competitors** (Fresha, Mangomint, GlossGenius)
- Modern, minimal UI built for staff working long shifts without fatigue
- Scales from solo practitioner to multi-location enterprise

**Success Criteria:**
- Onboarding a new salon takes <30 minutes
- Staff prefer using Pecase over competitors
- 95%+ uptime guarantee
- <2 second load times for critical flows (booking, calendar, dashboard)

---

## 2. PRICING MODEL

### Base Plan: $50/month
Includes:
1. **Calendar & Scheduling** - Appointment management, drag-and-drop scheduling, staff availability tracking
2. **Client Management** - Client profiles, service history, contact information, preferences
3. **Staff Management** - Team member management, availability, scheduling

### Add-on Features: $25/month each
- **Online Booking** - Customer-facing booking widget, embeddable booking page, real-time availability
- **Payment Processing** - Stripe integration, invoicing, tip handling, receipt generation
- **SMS/Email Reminders** - Automated appointment reminders, reduce no-shows
- **Marketing Automation** - Email campaigns, SMS marketing, customer segmentation
- **Reporting & Analytics** - Revenue dashboards, performance metrics, client insights, staff performance
- **Consultation Forms** - Customizable intake forms, pre-appointment questionnaires, medical history
- **Membership & Packages** - Service packages, loyalty programs, recurring bookings
- **Gift Cards** - Digital gift card sales and management, redemption tracking
- **Multi-location Support** - Manage multiple locations from one dashboard, centralized reporting
- **Reviews & Ratings** - Client feedback system, review management, reputation tracking

### Pricing Examples
- **Solo practitioner** (base + online booking): $75/month
- **Small salon** (base + booking + payments + reminders): $125/month
- **Medium salon** (base + all features): $300/month

**Billing:** Monthly recurring, cancel anytime. No contracts. No setup fees.

---

## 3. CORE FEATURES

### 3.1 BASE FEATURES (Included in $50/month)

#### Calendar & Scheduling
- **Drag-and-drop calendar** with multiple view options (day, week, month)
- **Staff availability management** - Define working hours, time off, lunch breaks
- **Appointment creation** - Create appointments, assign to staff, set duration and price
- **Buffer time** - Set prep time between appointments
- **Color coding** - Visual distinction by service type or staff member
- **Booking status** - Confirmed, pending, completed, no-show, cancelled

#### Client Management
- **Client database** - Store all client information
- **Service history** - Track all past appointments, services, prices
- **Contact information** - Phone, email, address, preferences
- **Notes & preferences** - Staff notes, service preferences, allergies, communication preferences
- **Client communication** - Quick message panel for internal notes and client history

#### Staff Management
- **Team member profiles** - Name, role, certifications, availability
- **Role-based access** - Receptionist, service provider, manager, admin roles
- **Schedule management** - Assign staff to appointments, track availability
- **Time tracking** - Clock in/out, hours worked (basic)

### 3.2 ADD-ON FEATURES ($25/month each)

#### Online Booking
- **Public booking page** - Customers see availability in real-time
- **Service selection** - Browse services and staff
- **Self-service booking** - Schedule appointments 24/7
- **Embeddable widget** - Embed booking on salon website
- **Booking confirmation** - Automated confirmation emails/texts
- **Calendar sync** - Integrate with Google Calendar, Outlook

#### Payment Processing
- **Stripe integration** - Secure payment processing
- **Payment methods** - Credit cards, digital wallets
- **Invoicing** - Automated invoices sent to clients
- **Tipping** - Allow tips at checkout
- **Refunds & adjustments** - Process refunds, adjust prices
- **Payment history** - Track all transactions

#### SMS/Email Reminders
- **Automated reminders** - Send appointment reminders 24hrs and 2hrs before
- **SMS & Email** - Customers choose their preference
- **Customizable messages** - Brand reminders with salon name and contact info
- **Opt-in management** - Respect customer communication preferences
- **Reduce no-shows** - Automated reminders decrease cancellations by ~20-30%

#### Marketing Automation
- **Email campaigns** - Create and send promotional campaigns
- **Segmentation** - Target customers by service type, visit frequency, last visit date
- **SMS campaigns** - Send bulk SMS to customer lists
- **Templates** - Pre-built campaign templates
- **Analytics** - Track open rates, click rates, conversion
- **Birthdays & anniversaries** - Auto-send special offers

#### Reporting & Analytics
- **Revenue dashboard** - Total revenue, revenue by service, revenue by staff
- **Performance metrics** - Busiest times, peak days, average appointment value
- **Client analytics** - Client acquisition, retention, lifetime value, repeat rate
- **Staff performance** - Revenue per staff member, appointment count, ratings
- **Occupancy** - Calendar fill rate, peak hours, slow periods
- **Export reports** - Download data as PDF or CSV

#### Consultation Forms
- **Form builder** - Create custom intake forms without coding
- **Medical history** - Capture allergies, medications, skin conditions
- **Preferences** - Service preferences, pricing info, package selection
- **Digital signatures** - Liability waivers, consent forms
- **Pre-appointment** - Forms sent to clients before first appointment
- **Form responses** - Store and display responses for staff reference

#### Membership & Packages
- **Service packages** - Bundle multiple services at discounted price
- **Recurring packages** - Monthly memberships, subscription services
- **Package tracking** - Track usage, remaining services
- **Auto-renewal** - Recurring monthly charges
- **Member pricing** - Special pricing for members vs. walk-ins
- **Package gifting** - Gift packages to others

#### Gift Cards
- **Digital gift cards** - Create and sell online
- **Physical gift cards** - Print gift card codes
- **Customization** - Set denomination, expiration, custom messages
- **Sales tracking** - Track gift card sales and redemptions
- **Redemption** - Apply gift card balance at checkout
- **Analytics** - Report on gift card revenue and redemption rates

#### Multi-location Support
- **Manage multiple locations** - One dashboard for all locations
- **Location-specific settings** - Different staff, hours, services per location
- **Centralized reporting** - See revenue across all locations
- **Staff assignment** - Assign staff to specific locations
- **Customer choice** - Customers select location when booking
- **Consolidated payments** - One payment account for all locations

#### Reviews & Ratings
- **Review requests** - Automatically request reviews after appointments
- **Star ratings** - 5-star rating system
- **Written reviews** - Customers write feedback
- **Public display** - Display reviews on public booking page (future phase)
- **Review responses** - Business responds to reviews
- **Review analytics** - Track average rating, review trends

---

## 4. USER ROLES & PERMISSIONS

### Admin
- Full system access
- Billing and subscription management
- Add/remove staff and locations
- System settings and configuration
- Reports and analytics
- User management

### Manager
- View and manage all staff schedules
- Client management
- Payments and invoicing
- Marketing campaigns
- Reports and analytics
- Cannot modify billing or permissions

### Staff/Service Provider
- View own schedule
- Manage own appointments
- View client information
- Update client notes
- Clock in/out
- Cannot access reporting, billing, or other staff schedules

### Receptionist
- Schedule appointments
- Client management
- View calendars
- Check availability
- Cannot view payments, access reports, or manage staff

---

## 5. TECHNICAL ARCHITECTURE

### Tech Stack
- **Frontend:** Next.js 14+, React, TypeScript, Tailwind CSS, Modern Minimal Design System
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Cache:** Redis
- **Payments:** Stripe API
- **SMS:** Twilio
- **Email:** SendGrid or Mailgun
- **File Storage:** AWS S3 or similar
- **Hosting:** Vercel (frontend), Render/Railway (backend)
- **Monorepo:** Turborepo + pnpm

### Architecture Principles
- **Modular design** - Features can be toggled on/off based on subscription
- **Real-time updates** - WebSockets for live calendar updates
- **Mobile-responsive** - Full mobile support for staff and customer-facing features
- **Secure** - OAuth2, JWT, encryption at rest and in transit
- **Scalable** - Designed to handle growth from solo practitioners to enterprises

---

## 6. DESIGN SYSTEM & UI PRINCIPLES

### Design Aesthetic
**Modern Minimal** - Calm, professional interface designed for long work sessions.

### Key Principles
- **Clarity** - Information hierarchy is obvious, no confusion
- **Efficiency** - Common tasks completed in 2-3 clicks
- **Calm** - Soft colors, plenty of white space, minimal visual noise
- **Accessibility** - WCAG AA compliance, keyboard navigation
- **Consistency** - Unified component library across all apps

### Color Palette
- **Primary:** Soft sage green or muted blue (calming, professional)
- **Neutral:** Off-whites, light grays for backgrounds
- **Accent:** Warm taupe or rose for CTAs
- **Status colors:** Green (confirmed), yellow (pending), red (cancelled)

### Typography
- **Headers:** Clean sans-serif (Inter, Outfit)
- **Body:** Readable sans-serif with good line height
- **Sizing:** Generous spacing, readable on small screens

---

## 7. KEY USER WORKFLOWS

### Workflow 1: Salon Owner - Initial Setup
1. Sign up at pecase.org
2. Create salon profile (name, location, services, hours)
3. Add staff members
4. Define services and pricing
5. Enable features based on needs
6. Connect Stripe account
7. Invite staff to calendar

**Target time: <30 minutes**

### Workflow 2: Receptionist - Schedule Appointment
1. Open calendar
2. Click open time slot
3. Select client (existing or new)
4. Select service and staff
5. Set price (optional override)
6. Mark as confirmed or pending
7. System sends confirmation if enabled

**Target time: <2 minutes**

### Workflow 3: Customer - Book Appointment (Online)
1. Visit pecase.org/[salonname]/booking
2. Select service
3. View available times (filtered by staff if needed)
4. Select preferred time
5. Enter contact info
6. Add to calendar
7. Receive confirmation email/SMS

**Target time: <3 minutes**

### Workflow 4: Manager - View Performance
1. Log in to dashboard
2. Navigate to Reports
3. Select date range and metrics
4. View revenue, appointment count, busiest times
5. Drill down by staff or service
6. Export report as PDF/CSV

**Target time: <5 minutes**

---

## 8. MVP VS. FUTURE PHASES

### MVP (Phase 1 - Core Features)
- Base plan: Calendar, Client Management, Staff Management
- Online Booking add-on
- Payment Processing (Stripe)
- Modern minimal UI
- Mobile responsive
- Basic authentication
- Email reminders (basic automation)

**Launch target:** Q2 2026

### Phase 2 (Q3 2026)
- SMS reminders (Twilio)
- Marketing Automation
- Consultation Forms
- Reporting & Analytics (basic dashboards)
- Staff commissions/payroll tracking

### Phase 3 (Q4 2026)
- Membership & Packages
- Gift Cards
- Advanced Reporting
- Multi-location Support
- Review & Ratings system

### Phase 4 (2027+)
- Mobile apps (iOS/Android)
- Advanced CRM features
- Inventory management
- Point of sale (POS) integration
- API for third-party integrations

---

## 9. SUCCESS METRICS

### User Acquisition
- Target: 100 salons signed up by end of Year 1
- CAC (Customer Acquisition Cost) target: <$50

### Retention
- Monthly churn: <5%
- Annual retention: >85%

### Engagement
- Daily active staff members using calendar
- Average session duration
- Features enabled per subscription

### Revenue
- $50k MRR by end of Year 1
- $200k MRR by end of Year 2

### Product Quality
- Uptime: 99.5%+
- Page load time: <2 seconds for critical flows
- Support response time: <24 hours

### User Satisfaction
- NPS: >50
- Feature adoption rate: >70% per paying customer
- Staff prefer Pecase over competitors (survey)

---

## 10. COMPETITIVE LANDSCAPE

### vs. Fresha
- **Fresha advantage:** Larger brand, more integrations
- **Pecase advantage:** Better pricing transparency, no hidden add-ons, modular features, modern UI

### vs. Mangomint
- **Mangomint advantage:** Established, good reviews
- **Pecase advantage:** Simpler pricing, better value, modern design

### vs. GlossGenius
- **GlossGenius advantage:** Strong in hair salons, good customization
- **Pecase advantage:** Undercut on price, transparency, scales better for small practitioners

**Pecase's positioning:** "Professional salon software. No surprises. Fair pricing. Simple to use."

---

## 11. MONETIZATION

### Revenue Model
- Monthly recurring subscription (SaaS)
- Base plan: $50/month per salon
- Add-on features: $25/month each
- Payment processing fees: 2.9% + $0.30 per transaction (Stripe pass-through)

### Customer Segments
- **Tier 1 (Solopreneurs):** $75-100/month average (base + 1-2 features)
- **Tier 2 (Small salons 2-10 staff):** $125-150/month (base + 3-4 features)
- **Tier 3 (Medium salons 10-30 staff):** $250-300/month (base + most features)

### Expansion Strategy
- Volume discounts for 10+ locations
- Agency partner program (multi-salon management)
- White-label licensing (future phase)

---

## 12. IMPLEMENTATION ROADMAP

### Months 1-2: Foundation
- Design system and component library
- Authentication and user management
- Database schema for core features
- API endpoints for calendar, clients, staff

### Months 2-3: MVP Features
- Calendar UI and drag-and-drop
- Client management interface
- Staff management
- Stripe integration
- Basic email reminders

### Month 4: Online Booking
- Public booking page
- Embeddable widget
- Real-time availability
- Booking confirmation emails

### Month 5: Polish & Testing
- Performance optimization
- Security audit
- Usability testing with real salons
- Mobile responsiveness fixes

### Month 6: Launch
- Public launch at pecase.org
- Marketing campaign
- Early customer onboarding
- Support infrastructure

---

## 13. RISKS & MITIGATION

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Customers overwhelmed by feature choices | Medium | Medium | Clear recommendations during setup, progressive disclosure |
| Fresha/competitors lower prices | High | High | Lock-in through loyalty, superior UX, feature differentiation |
| Payment processing integration issues | Low | High | Thorough testing, fallback payment method, fast support |
| Customer churn due to poor UX | Medium | High | Extensive UX testing pre-launch, easy onboarding |
| Server downtime | Low | Critical | 99.5% uptime SLA, monitoring, auto-scaling, backups |

---

## 14. SUCCESS DEFINITION (Year 1)

- 100+ paying salons
- $50k MRR
- <5% monthly churn
- 95%+ uptime
- NPS score >50
- Average customer expanding from 2 to 4 add-on features
