# Feature Landscape: Spa/Salon SaaS

**Domain:** Multi-tenant spa/salon management software
**Researched:** 2026-01-25
**Confidence:** HIGH

## Executive Summary

Spa and salon owners need software that **just works** - reliability trumps features. This research identifies what owners actually need daily, what behaviors define "working" for each feature, and what breaks their trust in software.

**Key Finding:** The gap between having features and having working features is massive in this space. 78% of clients now prefer online booking, but software that fails randomly (double bookings, settings not saving, no-shows not prevented) causes owners to revert to pen and paper. Trust is lost instantly and rarely regained.

**Critical Insight for Peacase Stabilization:** Focus on the 5 critical daily workflows - everything else is secondary. If booking fails once, owners lose trust. If reminders don't send, clients don't show up and owners lose revenue. If staff schedules are wrong, the business can't operate.

---

## Daily Workflows: What Owners Do Every Day

### Morning Routine (First 30 Minutes)

Owners arrive **at least 1 hour before opening** to prepare. Software must support:

1. **Check today's schedule**
   - **Working looks like:** Calendar loads instantly, shows all appointments with client names, services, staff, times
   - **Broken looks like:** Slow load, missing appointments, wrong times, appointments shown on wrong staff
   - **Trust break:** If appointment doesn't appear but client shows up (or vice versa)

2. **Review new online bookings overnight**
   - **Working looks like:** Overnight bookings visible immediately, client details complete, staff assigned correctly
   - **Broken looks like:** Bookings missing, partial data, no staff assigned, double bookings
   - **Trust break:** Client books online but owner doesn't see it - client shows up and slot is taken

3. **Check staff availability/time-off**
   - **Working looks like:** Today's staffing clear at a glance, time-off requests flagged
   - **Broken looks like:** Staff marked available but requested day off, schedule doesn't reflect approved changes
   - **Trust break:** Owner schedules client with staff who called out sick

4. **Prepare spaces/equipment**
   - **Working looks like:** Know what services are booked, what equipment to prepare
   - **Broken looks like:** Service details missing or wrong
   - **Trust break:** Wrong equipment prepared, delays client experience

### During Operating Hours

5. **Accept walk-ins and phone bookings**
   - **Working looks like:** Calendar shows real-time availability, can book instantly, no conflicts
   - **Broken looks like:** Calendar out of sync, shows available slot that's already booked
   - **Trust break:** Book walk-in, then discover slot was taken online 5 minutes ago

6. **Handle client check-in**
   - **Working looks like:** Find client quickly, see appointment details, confirm service
   - **Broken looks like:** Client not found, appointment missing, wrong service listed
   - **Trust break:** Client says "I booked online" but nothing in system

7. **Process payments**
   - **Working looks like:** Charge processes instantly, receipt generated, payment recorded to appointment
   - **Broken looks like:** Payment fails mysteriously, duplicate charges, no receipt, payment not linked to appointment
   - **Trust break:** Client charged twice, or payment succeeds but shows unpaid in system

8. **Manage client rescheduling/cancellations**
   - **Working looks like:** Cancel/reschedule updates calendar immediately, client notified, slot opens for booking
   - **Broken looks like:** Change doesn't reflect in calendar, client not notified, slot remains blocked
   - **Trust break:** Cancel appointment but slot doesn't free up, lose rebooking opportunity

### End of Day

9. **Review day's revenue**
   - **Working looks like:** All payments accounted for, tips recorded, total matches reality
   - **Broken looks like:** Missing payments, wrong totals, tips not recorded
   - **Trust break:** Cash drawer doesn't match system totals

10. **Check tomorrow's schedule**
    - **Working looks like:** Tomorrow fully loaded, can see staffing needs, preparation requirements
    - **Broken looks like:** Schedule incomplete, missing appointments, wrong staff assignments
    - **Trust break:** Unprepared for tomorrow's services

### Weekly/Monthly (Recurring)

11. **Staff payroll/commissions**
    - **Working looks like:** Accurate service counts, correct commission calculations, tip totals right
    - **Broken looks like:** Missing services, wrong percentages, tips not included
    - **Trust break:** Staff disputes earnings because numbers are wrong

12. **Review no-show patterns**
    - **Working looks like:** See which clients no-showed, how many reminders sent
    - **Broken looks like:** No-show data missing, reminder logs don't exist
    - **Trust break:** Can't tell if no-show was client fault or reminder not sent

---

## Table Stakes Features

Features clients EXPECT. Missing these = product feels incomplete. Broken = owners leave.

| Feature | Why Expected | What "Working" Looks Like | What "Broken" Looks Like | Complexity |
|---------|--------------|---------------------------|-------------------------|------------|
| **Online Booking (24/7)** | 78% of clients prefer online, 30% book outside business hours | Client books at 11pm Sunday, appears in Monday morning schedule, correct staff/time/service, no double booking | Booking succeeds but doesn't show up, wrong staff assigned, double books slot, requires login | MEDIUM |
| **Automated Reminders** | Reduces no-shows by 70%, owners expect 98% delivery rate | Reminder sent 24h before automatically, SMS delivered, client confirms, log shows delivery | Reminder not sent, wrong time/date in message, fails silently without error log | MEDIUM |
| **Calendar/Scheduling** | Core of business operations, checked 50+ times/day | Real-time sync, drag-drop works, no double bookings, shows staff availability correctly | Slow to load, changes don't save, allows double bookings, doesn't prevent scheduling during time-off | HIGH |
| **Client Database/CRM** | Personalization critical (97% of clients expect it), track client history | Instant search, shows visit history, notes from previous visits, preferences saved | Client profiles incomplete, notes don't save, can't find clients quickly, duplicate profiles | LOW |
| **Payment Processing** | Must work every time, no exceptions | Card charges successfully, receipt generated instantly, payment linked to appointment automatically | Random failures, no error messages, duplicate charges, payments not recorded | HIGH |
| **Staff Management** | Multi-staff salons (90% of market) need staff assignment | Assign staff to services, set availability, track who did what | Staff can't be assigned, availability doesn't affect booking, can't tell who did service | MEDIUM |
| **Service Menu** | Define what's offered, pricing, duration | Services show in booking widget, prices accurate, durations block correct time | Services missing from widget, wrong prices shown, duration doesn't match booking time | LOW |
| **No-Show Prevention** | 5-15% no-show rate costs thousands/month | Require deposit for high-value services, waitlist auto-fills cancellations, reminders sent reliably | Deposits not enforced, cancellations don't free slots, no waitlist | MEDIUM |
| **Multi-Location Support** | Growing businesses add locations, must centralize | Client can book any location, services sync or customize per location, centralized reporting | Each location operates separately, can't see cross-location data, client must re-register per location | HIGH |
| **Business Hours Management** | Prevents booking outside operating hours | Set hours per location, online booking respects hours, shows "closed" correctly | Allows booking when closed, hours don't apply to widget, saves but doesn't enforce | LOW |

**MVP Priority (stabilization):**
1. Calendar/Scheduling - most critical, highest complexity, most trust-breaking if broken
2. Online Booking - revenue driver, high client expectation
3. Payment Processing - zero tolerance for errors
4. Automated Reminders - prevents no-shows (direct revenue impact)
5. Client Database - needed for personalization
6. Staff Management - multi-staff operations requirement
7. Service Menu - foundation for bookings
8. No-Show Prevention - protects revenue
9. Multi-Location - growing businesses need this
10. Business Hours - basic expectation

---

## Differentiators

Features that set product apart. Not expected, but highly valued when present.

| Feature | Value Proposition | What "Working" Looks Like | Complexity |
|---------|-------------------|---------------------------|------------|
| **Smart Waitlist Auto-Fill** | Scans calendar every 5 minutes, auto-texts waitlist clients when slot opens | Cancellation happens → waitlist client texted within 5 min → client confirms → slot filled | MEDIUM |
| **Pre-Booking at Checkout** | Clients who book next visit before leaving = 30-40% higher retention | Prompt to book next appointment during checkout, one-click scheduling | LOW |
| **Precision Scheduling** | Shows "best" time slots first based on staff availability, minimizes gaps | Client sees optimal times first, staff schedule stays compact, fewer gaps | MEDIUM |
| **Formula/Client Notes** | Track client formulas, preferences, allergies for personalization | Notes from last visit auto-show at check-in, searchable, staff can add quickly | LOW |
| **Automated Payroll** | Calculate commissions/tips automatically, save hours/month | End of pay period → system calculates all commissions → export to payroll | HIGH |
| **Real-time Inventory Tracking** | Know when products running low, never run out mid-service | Service uses product → inventory decrements → alert at reorder point | MEDIUM |
| **Client Self-Rescheduling** | Clients reschedule online without calling, saves front desk time | Client clicks reschedule link → chooses new time → calendar updates → both notified | MEDIUM |
| **Marketing Automation** | Re-engagement for clients who haven't booked in X days | Auto-email clients 60 days after last visit with booking link | MEDIUM |
| **Loyalty/Membership Programs** | Recurring revenue, increases retention 10-20% | Client buys package → services deduct automatically → auto-renew option | HIGH |
| **Review Management** | Collect reviews automatically post-appointment | Appointment completes → review request sent → responses tracked | LOW |

**Post-Stabilization Priorities:**
- Smart Waitlist (high value, medium complexity)
- Pre-Booking Prompt (retention driver, low complexity)
- Client Self-Rescheduling (reduces admin burden)
- Formula/Client Notes (already partially built)

---

## Anti-Features

Features to explicitly NOT build (or build differently). Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Complex Multi-Step Booking Flow** | 65% of Gen Z abandon if too complex, users expect 1-page booking | Single-page booking: service → staff → time → done. No login required. |
| **Forced User Registration for Booking** | Password-free booking is now standard, friction kills conversions | Allow guest booking with just name/phone/email. Account optional. |
| **Separate POS System** | Juggling systems = data silos, owners won't use multiple tools | Integrate payment into same system as booking/calendar. |
| **Overcomplicated Pricing Tiers** | Hidden fees for add-ons like SMS reminders breaks trust | Transparent pricing, core features included, clear upgrade path. |
| **Generic Marketing Templates** | Spa/salon clients expect personalized communication | Use client history to personalize (last service, preferred staff, etc.). |
| **Staff Portal as Afterthought** | Poor staff UX = they won't use it, revert to text messages | Mobile-first staff view, dead simple (clock in, view schedule, add notes). |
| **Too Many Customization Options** | "Jack of all trades, master of none" - complexity without usability | Opinionated defaults that work for 80% of salons, customize only what matters. |
| **Desktop-Only Design** | 30%+ of salon owners manage from phone, mobile is critical | Mobile-responsive everywhere, touch-friendly, fast on slow connections. |
| **Fake Scarcity ("only 2 slots left!")** | Users see through it, damages trust | Show real availability, let quality create urgency. |
| **Locking Data Behind Export Fees** | Owners need their data, charging for exports is hostile | Free CSV export anytime, encourage trust over lock-in. |

---

## Feature Dependencies

Understanding what must work before other features can function.

```
FOUNDATION LAYER (must work first):
├─ Authentication/Multi-tenancy → Everything depends on this
├─ Business/Location Setup → Required for scheduling
└─ Service Menu → Required for bookings

CORE OPERATIONS:
├─ Staff Management → Required for scheduling
├─ Client Database → Required for appointments
├─ Calendar/Scheduling → Core daily workflow
│   ├─ Requires: Services, Staff, Locations
│   └─ Enables: Online Booking, Reminders, Payments
│
├─ Online Booking Widget → Revenue driver
│   ├─ Requires: Calendar, Services, Staff Availability
│   └─ Enables: Client Self-Service, Reduced Admin
│
└─ Payment Processing → Revenue collection
    ├─ Requires: Appointments, Clients
    └─ Enables: Commission Calculation

OPERATIONAL EXCELLENCE:
├─ Automated Reminders → Reduces no-shows
│   ├─ Requires: Appointments, Client Contact Info, SMS/Email Integration
│   └─ Critical for: Revenue Protection
│
├─ No-Show Prevention (Deposits) → Revenue protection
│   ├─ Requires: Payment Processing, Online Booking
│   └─ Enables: Confident Scheduling
│
└─ Staff Scheduling/Availability → Prevents booking errors
    ├─ Requires: Staff Management, Locations
    └─ Enables: Accurate Online Booking

GROWTH FEATURES:
├─ Multi-Location → Scale operations
│   ├─ Requires: All core features working
│   └─ Enables: Enterprise growth
│
├─ Marketing/Loyalty → Retention
│   ├─ Requires: Client Database, Email/SMS
│   └─ Enables: Revenue growth
│
└─ Advanced Reporting → Business intelligence
    ├─ Requires: Appointments, Payments, Services
    └─ Enables: Data-driven decisions
```

---

## Critical Moments: What MUST Work or Owners Leave

### Moment 1: First Online Booking
**When:** Within 24 hours of setup
**What happens:** Owner sets up widget, client books online for first time
**If it works:** Owner gains confidence, tells other business owners, stays long-term
**If it breaks:** Owner assumes software is unreliable, reverts to phone bookings, cancels within trial period

**Working means:**
- Booking appears in calendar within 60 seconds
- All details correct (time, service, client info)
- Owner gets notification
- No double booking
- Client gets confirmation

### Moment 2: Busy Morning Rush
**When:** Saturday 9am, phones ringing, walk-ins arriving
**What happens:** Owner needs to book 3+ clients quickly while handling in-person traffic
**If it works:** Owner trusts system under pressure, keeps using it during chaos
**If it breaks:** Owner writes appointments on paper, never trusts system again for critical moments

**Working means:**
- Calendar loads in <2 seconds
- Can create appointment in <30 seconds
- No lag, no crashes
- Changes save immediately
- Can see availability at a glance

### Moment 3: Payment Processing
**When:** Client checking out after service
**What happens:** Owner charges card for service + tip
**If it works:** Seamless checkout, client happy, revenue captured
**If it breaks:** Embarrassment with client present, lost revenue, damaged client relationship

**Working means:**
- Card charges first try, every time
- Receipt prints/emails immediately
- Tip amount captured correctly
- Payment linked to appointment automatically
- No duplicate charges
- Clear error messages if card declined (not system error)

### Moment 4: No-Show Without Reminder
**When:** Client doesn't show up for appointment
**What happens:** Owner checks if reminder was sent
**If it works:** System shows reminder sent 24h before, owner can confidently charge no-show fee or note client unreliability
**If it breaks:** Owner doesn't know if it's system fault or client fault, can't charge fee, loses trust in reminders

**Working means:**
- Reminder definitely sent (logged with timestamp)
- Delivery confirmed (for SMS) or sent (for email)
- Client received correct info (date, time, location)
- Owner can see log showing reminder sent
- If reminder failed, owner was alerted

### Moment 5: Staff Payroll Dispute
**When:** End of pay period, staff questions commission amount
**What happens:** Owner needs to show which services were performed, at what commission rate
**If it works:** System shows accurate breakdown, staff trusts numbers, gets paid correctly
**If it breaks:** Staff doesn't trust software, owner must manually count, relationship strained

**Working means:**
- Every completed appointment recorded with staff assignment
- Commission rate captured at time of service
- Tips included correctly
- Can filter by staff, date range
- Numbers match manual count
- Can export for proof

---

## Pain Points with Existing Spa Software

Based on owner complaints and software reviews:

### Top 10 Trust-Breaking Issues

1. **System Downtime During Business Hours**
   - Problem: Software goes down during checkout or busy period
   - Impact: Can't operate business, client checkout delayed, revenue lost
   - Peacase prevention: Use reliable hosting (Vercel/Render), monitor uptime, graceful degradation

2. **Data Silos (Disconnected Systems)**
   - Problem: Booking system separate from POS, CRM separate from calendar
   - Impact: Duplicate data entry, sync issues, incomplete client view
   - Peacase prevention: All-in-one platform, single database

3. **Poor Customer Support When Systems Fail**
   - Problem: Software breaks, support ticket takes 2+ days, no phone number
   - Impact: Business can't operate, revenue lost, frustration
   - Peacase prevention: Clear error messages, self-service diagnostics, responsive support

4. **Hidden Costs and Pricing Complexity**
   - Problem: "Free" tier missing basics, charged per SMS, per location, per feature
   - Impact: Budget unpredictability, feels nickeled-and-dimed, trust broken
   - Peacase prevention: Transparent pricing, core features included, predictable costs

5. **Settings Don't Persist or Apply**
   - Problem: Change business hours, hours don't apply to booking widget
   - Impact: Clients book during closed hours, owner must manually cancel, looks unprofessional
   - Peacase prevention: Test that all settings actually apply, validate before save

6. **Double Bookings**
   - Problem: Online booking and manual booking create conflict for same slot
   - Impact: Overbooked, client turned away or delayed, reputation damage
   - Peacase prevention: Real-time calendar locking, conflict detection, atomic transactions

7. **Reminders Not Sent (Silent Failure)**
   - Problem: Reminder scheduled but never sent, no error alert
   - Impact: Client no-shows, revenue lost, owner blames client but it's system fault
   - Peacase prevention: Reminder queue monitoring, delivery confirmation, alert owner on failures

8. **Slow, Dated User Interface**
   - Problem: Menus nested 5 levels deep, looks like 2005 website, slow page loads
   - Impact: Owner frustrated, takes 3x longer to do tasks, abandons software
   - Peacase prevention: Modern UI, fast load times, intuitive navigation

9. **Lack of Customization (One-Size-Fits-None)**
   - Problem: Can't customize for unique business needs (different commission structures, special services)
   - Impact: Workarounds needed, software doesn't match workflow, manual tracking continues
   - Peacase prevention: Flexible service setup, customizable commission rates, location-specific settings

10. **Security and Compliance Concerns**
    - Problem: Client data not encrypted, no GDPR compliance, unclear data handling
    - Impact: Legal risk, client trust broken if breach occurs
    - Peacase prevention: Encryption, GDPR features built-in, clear data policies

---

## What "Working" Means for Each Core Feature

This section defines **acceptance criteria** for stabilization. Each feature must meet these standards before considered "working."

### Online Booking Widget

**Working:**
- [ ] Loads in <3 seconds on mobile 4G
- [ ] Shows only available time slots (respects business hours, staff availability, existing appointments)
- [ ] Creates appointment that appears in calendar within 60 seconds
- [ ] Sends confirmation email/SMS to client immediately
- [ ] Notifies owner of new booking
- [ ] Prevents double booking (even if two clients book simultaneously)
- [ ] Handles errors gracefully (shows useful message, doesn't just fail)
- [ ] Works without client login/account
- [ ] Captures all required info (name, phone/email, service, preferred staff if selected)
- [ ] Respects location-specific settings if multi-location
- [ ] Mobile-responsive, touch-friendly
- [ ] Matches salon branding (colors, fonts configured correctly)

**Broken indicators:**
- Bookings created but don't appear in calendar
- Double bookings occur
- Shows slots outside business hours
- Fails without error message
- Requires multiple page loads
- Confirmation not sent

### Calendar/Scheduling

**Working:**
- [ ] Loads current day view in <2 seconds
- [ ] Displays all appointments with correct: time, client, service, staff, duration
- [ ] Drag-and-drop reschedules appointment and saves change
- [ ] Creating appointment checks for conflicts before saving
- [ ] Shows staff availability visually (grayed out when unavailable)
- [ ] Updates in real-time when online booking creates appointment
- [ ] Week/month views available and accurate
- [ ] Can filter by staff, location, service
- [ ] Color-codes by service or status
- [ ] Mobile-responsive for on-the-go checks
- [ ] Handles time zones correctly if multi-location
- [ ] Shows gaps in schedule (opportunity for walk-ins)

**Broken indicators:**
- Slow to load (>5 seconds)
- Appointments missing or wrong times
- Allows double booking
- Changes don't save
- Doesn't reflect online bookings
- Staff unavailability not shown

### Automated Reminders

**Working:**
- [ ] Automatically sends reminder 24 hours before appointment (configurable timing)
- [ ] SMS delivered successfully (99%+ delivery rate for valid numbers)
- [ ] Email sent successfully (to inbox, not spam)
- [ ] Message contains correct: date, time, service, location, staff name
- [ ] Message includes confirmation/reschedule links
- [ ] Logs every reminder sent with timestamp and delivery status
- [ ] Alerts owner if reminder fails to send
- [ ] Respects client communication preferences (email vs SMS)
- [ ] Doesn't send to clients who opted out
- [ ] Handles time zones correctly
- [ ] Can manually trigger reminder if needed
- [ ] Shows reminder history per appointment

**Broken indicators:**
- Reminders not sent (silent failure)
- Wrong info in message
- Sent at wrong time
- Not logged
- Delivery failures not reported
- Duplicate reminders sent

### Payment Processing

**Working:**
- [ ] Charges card successfully on first attempt (for valid cards)
- [ ] Processes in <5 seconds
- [ ] Generates receipt immediately
- [ ] Links payment to appointment automatically
- [ ] Captures tips separately
- [ ] Shows clear error if card declined (with decline reason)
- [ ] Prevents duplicate charges
- [ ] Handles refunds correctly
- [ ] Updates appointment status to "paid"
- [ ] Records payment method
- [ ] Can process partial payments
- [ ] Works on mobile devices (tap to pay if supported)
- [ ] Complies with PCI security standards

**Broken indicators:**
- Random payment failures (valid cards declined)
- Duplicate charges
- Payments not linked to appointments
- No receipt generated
- Tips not captured
- Unclear error messages
- Slow processing (>10 seconds)

### Staff Management

**Working:**
- [ ] Can create staff profiles with: name, email, phone, role, commission rate, certifications
- [ ] Assign staff to locations
- [ ] Assign services to staff (what they can perform)
- [ ] Set weekly availability per staff (day/time ranges)
- [ ] Mark time-off that blocks calendar automatically
- [ ] Online booking only shows staff available at selected time
- [ ] Can set different commission rates per staff or service
- [ ] Staff portal login works (if implemented)
- [ ] Deactivate staff without deleting historical data
- [ ] Track which staff performed which service (for commissions)
- [ ] Filter calendar by staff
- [ ] Staff can't be double-booked

**Broken indicators:**
- Staff availability doesn't affect booking widget
- Time-off doesn't block calendar
- Can't assign services to specific staff
- Commission rates don't save
- Deleted staff breaks historical appointments

### Client Database

**Working:**
- [ ] Search finds clients instantly (<1 second)
- [ ] Shows visit history (all appointments, services, dates)
- [ ] Displays client notes from all staff
- [ ] Captures: name, phone, email, preferences, allergies, birthday
- [ ] Can add new client in <30 seconds
- [ ] Prevents duplicate client profiles (suggests matches)
- [ ] Shows loyalty points/packages if applicable
- [ ] Respects GDPR (data consent, export, deletion)
- [ ] Communication preferences saved (email vs SMS, marketing opt-in)
- [ ] Can tag/categorize clients
- [ ] Shows client value (total spend)
- [ ] Can merge duplicate profiles

**Broken indicators:**
- Search slow or incomplete
- Visit history missing appointments
- Notes don't save
- Duplicate profiles created easily
- Client data incomplete

### Multi-Location Support

**Working:**
- [ ] Can create multiple locations under one salon account
- [ ] Each location has independent: address, hours, phone
- [ ] Staff assigned to specific locations
- [ ] Services can be location-specific or shared
- [ ] Calendar filterable by location
- [ ] Online booking shows location selector
- [ ] Reporting available per-location or combined
- [ ] Clients can book any location (or be restricted)
- [ ] Settings can sync from flagship or be location-specific
- [ ] Primary location designated for defaults
- [ ] Can manage inventory per location (if using inventory)

**Broken indicators:**
- Locations operate as separate accounts
- Can't see cross-location data
- Client must re-register per location
- Settings changes don't apply correctly per location

---

## Testing Scenarios: How to Validate "Working"

To test from spa owner perspective (not developer perspective):

### Scenario 1: New Client Books Online at 11pm
1. Configure booking widget with services, staff, hours
2. Embed widget on test page
3. Book appointment at 11pm on Sunday for Monday 10am
4. Check Monday morning: Does appointment appear? Correct details? Staff assigned?
5. Check client received confirmation email/SMS
6. Check owner received new booking notification
7. Check calendar prevents double-booking that slot

**Pass criteria:** All 7 checks pass
**Fail indicators:** Any check fails

### Scenario 2: Morning Rush - Book 3 Walk-Ins in 5 Minutes
1. Simulate busy morning: existing appointments on calendar
2. Time how long to create 3 new appointments with different clients, services, staff
3. Check all 3 saved correctly
4. Check no conflicts created
5. Check calendar still responsive (not lagging)

**Pass criteria:** 3 appointments created in <5 minutes total, all accurate, no conflicts
**Fail indicators:** Slow performance, errors, conflicts

### Scenario 3: Client No-Shows, Check Reminder Sent
1. Create appointment for tomorrow
2. Wait for automated reminder to send (or manually trigger)
3. Check reminder log shows: sent timestamp, delivery status, message content
4. Verify message contains correct info
5. If reminder fails, check owner was alerted

**Pass criteria:** Reminder logged, correct info, owner can prove it was sent
**Fail indicators:** No log, wrong info, silent failure

### Scenario 4: Process Payment with Tip
1. Complete an appointment
2. Charge client $100 service + $20 tip
3. Check payment processes successfully
4. Check receipt shows both amounts
5. Check payment linked to appointment
6. Check appointment marked paid
7. Check tip recorded separately for staff commission

**Pass criteria:** All 7 checks pass, total correct
**Fail indicators:** Any amount wrong, not linked, tip missing

### Scenario 5: Multi-Location Calendar Management
1. Create 2 locations with different hours, staff
2. Create appointments at both locations
3. Filter calendar by location - see only that location's appointments
4. View combined - see both locations
5. Online booking at Location A doesn't show Location B staff
6. Change Location A hours, verify Location B unaffected

**Pass criteria:** Locations independent but manageable together
**Fail indicators:** Settings cross-contaminate, can't filter properly

---

## Sources

### Industry Research
- [9 Best Salon Software 2026: The Ultimate Guide](https://thesalonbusiness.com/best-salon-software/)
- [5 Best Spa Booking Software in 2026](https://connecteam.com/best-spa-booking-software/)
- [Best Spa and Salon Management Software for 2026](https://www.saasworthy.com/list/spa-and-salon-management-software)

### Pain Points and Trust Issues
- [The 4 Biggest Software Pains for Salon and Spa Staff](https://zenoti.com/blogs/the-4-biggest-software-pains-for-salon-and-spa-staff)
- [Stop the Chaos: Why SpaSphere Simplifies Spa Management](https://www.aestheticsunique.com/why-spa-owners-are-tired-of-juggling-systems-and-how-you-can-stop-the-chaos/)
- [Beware of Fake Salon and Spa Software Reviews](https://pairedplus.com/beware-of-fake-salon-and-spa-software-reviews-choose-trustworthy-family-owned-solutions-like-paired-plus-in-2025/)

### Daily Workflows
- [Morning Rituals of Successful Salon Owners](https://getvish.com/morning-rituals-of-salon-owners/)
- [20 Tasks For Your Salon Opening And Closing Checklist](https://salonbizsoftware.com/blog/salon-opening-and-closing-checklist/)
- [A Usual Day of a Salon or Spa Owner](https://www.emly.co/articles/a-day-in-the-life-of-a-salon-owner)

### Feature Requirements
- [10 Must-Have Salon Software Features for 2026](https://www.barbnow.com/blog/10-must-have-salon-software-features-for-2026)
- [7 Best Salon Booking Software Solutions For 2026](https://www.salonbookingsystem.com/salon-booking-system-blog/salon-booking-software/)
- [Features to Look For in Spa Booking Software](https://www.newspressnow.com/stacker-money/2026/01/23/features-to-look-for-in-spa-booking-software/)

### Client Retention and No-Shows
- [The #1 Way to Cut Salon No-Shows by Up to 70%](https://shortcutssoftware.com/the-1-way-to-cut-salon-no-shows-by-up-to-70/)
- [Reserve Appointment Guide: Your Essential 2026 Handbook](https://www.salonbookingsystem.com/salon-booking-system-blog/reserve-appointment/)
- [6 Effective Client Retention Strategies for Medical Spas in 2025](https://www.zenoti.com/thecheckin/client-retention-strategies-for-med-spa-owner)

### Payment and Deposits
- [How to Set Up Your Salon Deposit Policy](https://glossgenius.com/blog/salon-deposit-policy)
- [Complete Guide to Payment Methods in a Salon in 2025](https://zolmi.com/payment-methods-in-a-salon)

### Reminders and Communication
- [45 Free Appointment Reminder Text Templates to Reduce No-Shows](https://www.textmymainnumber.com/blog/45-free-appointment-reminder-text-message-templates-to-reduce-no-shows)
- [Best Practices for SMS Marketing in 2023](https://americanmedspa.org/blog/best-practices-for-sms-marketing-in-2023)
- [Top 10 Spa And Hair Appointment Reminder Templates](https://www.greminders.com/articles/top-10-spa-and-hair-appointment-reminder-templates-for-your-customers/)

### Multi-Location Management
- [Salon & Spa Multi-location Management](https://www.miosalon.com/features/manage-multi-location)
- [Multi-location | Mangomint Salon & Spa Software](https://www.mangomint.com/features/multi-location/)
- [Spa & Salon Multi-Center Management | Zenoti](https://www.zenoti.com/product/multi-center-management)

### Staff Scheduling
- [14 Best Salon Scheduling Apps in 2026](https://www.joinhomebase.com/blog/best-salon-scheduling-app)
- [Salon Staff Schedules That Work](https://sparkprosalon.com/salon-staff-schedules-that-work/)
- [15 Ways To Optimize Salon Scheduling](https://www.omysalon.com/blogs/post/15-ways-to-optimize-salon-scheduling-to-make-your-business-order)
