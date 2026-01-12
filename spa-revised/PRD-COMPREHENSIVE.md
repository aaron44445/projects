# PECASE - Comprehensive Product Requirements Document
**Version:** 1.0
**Last Updated:** January 10, 2026
**Status:** Ready for Implementation

---

## SECTION 1: PRODUCT OVERVIEW & VISION

### Product Identity
- **Name:** Pecase
- **Tagline:** "Professional salon and spa management. Everything you need. Nothing you don't."
- **Domain:** pecase.org
- **Target Users:** Solo practitioners and small-to-medium salons (1-30+ staff)
- **Industries:** Hair, nails, massage, esthetics, waxing, barbering, wellness

### Core Value Proposition
Pecase is a modular SaaS platform that eliminates forced bundles and hidden fees. Salons pay $50/month for essentials, then add only the features they need at $25/month each. This transparency and flexibility is the primary competitive advantage.

### Success Criteria (Year 1)
1. **Onboarding:** New salons fully set up in <30 minutes
2. **Performance:** <2 second load times for critical paths (calendar, booking, dashboard)
3. **Reliability:** 99.5%+ uptime guarantee
4. **Retention:** <5% monthly churn
5. **NPS:** >50 (staff prefer Pecase over competitors)
6. **Revenue:** $50k MRR, 100+ paying salons

---

## SECTION 2: COMPLETE DESIGN SYSTEM

### 2.1 Color Palette

**Primary Colors (Soft, Calming):**
- **Sage Green:** #C7DCC8 (primary action, accents)
- **Cream/Off-White:** #FAF8F3 (main background)
- **Charcoal:** #2C2C2C (dark sidebar, text)
- **Warm Taupe:** #D4B5A0 (secondary actions, hover states)

**Soft Accent Palette (for stat cards & decorative elements):**
- **Soft Peach:** #F4D9C8
- **Soft Lavender:** #E8DDF0
- **Soft Mint:** #D9E8DC
- **Soft Rose:** #F0D9E8
- **Soft Gray:** #E5E5E5

**Status Colors:**
- **Success/Confirmed:** #8FA98C (soft green)
- **Pending:** #D4A574 (soft gold)
- **Cancelled:** #C97C7C (soft red)
- **No-show:** #999999 (soft gray)

**Pecase Brand Pea Motif:**
- Use 2-3 small pea pod illustrations throughout UI
- Placement: Dashboard stat cards (decorative), appointments with themes, brand corners
- Style: Minimal line art, soft green (#C7DCC8), 20-40px size
- Examples: Pea pod in corner of "Total Clients" card, single peas as bullet points

### 2.2 Typography

**Font Family:** Inter, Outfit (fallback: system sans-serif)

**Type Scale:**
- **Display/Page Title:** 32px, 600 weight, color: Charcoal
- **Section Headers:** 24px, 600 weight, color: Charcoal
- **Subsection Headers:** 18px, 600 weight, color: Charcoal
- **Body Text:** 14px, 400 weight, color: Charcoal
- **Body Text Small:** 12px, 400 weight, color: #666666
- **Buttons:** 14px, 500 weight, color: White on Sage Green
- **Input Labels:** 12px, 500 weight, color: #666666
- **Input Placeholder:** 14px, 400 weight, color: #CCCCCC

### 2.3 Spacing & Layout

**Base Unit:** 8px (all spacing in multiples of 8)

**Key Spacing:**
- **Container padding:** 24px (sides), 32px (top/bottom)
- **Card padding:** 20px
- **Button height:** 44px
- **Input height:** 40px
- **Gap between cards:** 16px
- **Sidebar width:** 240px
- **Main content max-width:** 1400px

**Responsive Breakpoints:**
- **Mobile:** <480px (single column, full-width cards)
- **Tablet:** 480px-1024px (2 columns, adjusted padding)
- **Desktop:** >1024px (3+ columns, full layout)

### 2.4 Component Specifications

#### Buttons
- **Primary:** Sage Green background, white text, 44px height, 12px padding horizontal
- **Secondary:** Cream background with Sage Green border (2px), dark text
- **Danger:** Soft Red background, white text
- **Ghost:** No background, text only, text-color: Sage Green
- **Hover State:** Darken by 15%, add subtle shadow
- **Disabled State:** 50% opacity, cursor: not-allowed

#### Cards
- **Background:** White (#FFFFFF)
- **Border:** 1px solid #F0F0F0
- **Border Radius:** 12px
- **Shadow:** 0px 2px 8px rgba(0,0,0,0.08)
- **Padding:** 20px
- **Decorative Elements:** Optional small icon/illustration in corner (pea motifs, status icons)

#### Inputs
- **Background:** White
- **Border:** 1px solid #E0E0E0
- **Border Radius:** 8px
- **Height:** 40px
- **Padding:** 0px 12px
- **Focus State:** Border color: Sage Green, box-shadow: 0 0 0 3px rgba(199, 220, 200, 0.1)
- **Error State:** Border color: Soft Red, error message below in Soft Red

#### Tables
- **Header Background:** Cream (#FAF8F3)
- **Header Text:** Charcoal, 12px, 600 weight
- **Row Height:** 48px
- **Border:** 1px solid #F0F0F0 (between rows)
- **Striped Rows:** Alternate with #FAFAFA
- **Hover Row:** Background #F5F5F5

#### Sidebar Navigation
- **Background:** Charcoal (#2C2C2C)
- **Text:** White (#FFFFFF)
- **Active Item:** Sage Green background, rounded 8px
- **Icon Size:** 20px
- **Item Height:** 44px
- **Divider:** 1px solid rgba(255,255,255,0.1)

#### Stat Cards (Dashboard)
- **Size:** 200px × 140px (can be 2 cards wide on mobile)
- **Background:** Soft color (Peach, Lavender, Mint, Rose - rotate)
- **Number:** 32px, 600 weight, Charcoal
- **Label:** 12px, 500 weight, #666666
- **Decorative Icon:** 40px pea motif or geometric shape in corner (10% opacity lighter)

#### Modal/Overlay
- **Background:** Semi-transparent (rgba(0,0,0,0.5))
- **Modal Background:** White
- **Border Radius:** 12px
- **Min Width:** 400px (mobile: 90vw)
- **Padding:** 32px
- **Shadow:** 0px 20px 60px rgba(0,0,0,0.15)

### 2.5 Animation & Interaction

**Duration:**
- **Quick interactions:** 150ms (hover, focus)
- **Transitions:** 300ms (open/close modals, drawer)
- **Animations:** 400ms (page transitions, loading states)

**Easing:** cubic-bezier(0.4, 0, 0.2, 1) (material design standard)

**Hover Effects:**
- Buttons: Darken + 2px down shadow
- Cards: Lift with 8px shadow increase
- Links: Color change + underline

**Loading State:**
- Skeleton loaders for data placeholders (soft gray animated pulse)
- Spinning loader icon (Sage Green) for processing

### 2.6 Dark Mode (Future Phase)
- Invert color palette logic while maintaining contrast ratios
- Primary backgrounds: #1A1A1A, text: #FFFFFF
- Cards: #2C2C2C with #333333 borders
- Soft colors become darker, more saturated versions
- Reserve for Phase 3 implementation

---

## SECTION 3: FEATURE SPECIFICATIONS & BEHAVIORS

### 3.1 BASE PLAN FEATURES ($50/month)

#### Feature: Calendar & Scheduling

**Core Functionality:**
- **Multi-view calendar:** Day, Week, Month views
- **Drag-and-drop:** Move appointments to different time slots or staff
- **Create appointment:** Click empty slot → modal opens with form
- **Edit appointment:** Click existing appointment → inline edit or modal
- **Delete appointment:** Confirm before deleting
- **Color coding:** By service type (configurable by admin) or staff member

**Detailed Behaviors:**

1. **Appointment Creation:**
   - User clicks on time slot (empty)
   - Modal opens with form: Client name (searchable dropdown or new client), Service, Staff member, Duration, Price override (optional), Notes, Status (Confirmed/Pending)
   - Duration: Auto-fills based on service, but editable
   - Validation: Cannot schedule outside staff working hours or client availability
   - On save: Appointment added to calendar, confirmation sent if enabled, calendar updates in real-time
   - Error: "Cannot schedule - staff unavailable during this time" or "Client already has overlapping appointment"

2. **Buffer Time (Prep Time):**
   - Admin can set buffer time per service (e.g., 15 min after haircut for cleanup)
   - Buffer time shows as unavailable on calendar (lighter color, no-click zone)
   - Staff can override buffer time if needed (with warning)
   - System validates: next appointment doesn't start during buffer

3. **Staff Availability:**
   - Each staff member has working hours defined (e.g., 9am-5pm Tue-Sat)
   - Staff can mark "time off" or "lunch break" (shows as blocked on calendar)
   - Availability syncs across calendar for all staff
   - When creating appointment: Only show available staff members
   - Display availability status next to staff name on calendar (available/busy/offline)

4. **Appointment Status Workflow:**
   - **Confirmed:** Appointment is locked in, client notified
   - **Pending:** Waiting for client confirmation (if using online booking)
   - **Completed:** Marked after appointment finishes
   - **No-show:** Client didn't arrive (staff marks manually)
   - **Cancelled:** Cancellation reason optional, refund handling (if payment enabled)
   - Status change: Can be edited on calendar, triggers notifications to client/staff

5. **Calendar Views:**
   - **Day View:** 24-hour timeline, 30-min slots, appointments as blocks, staff columns if multiple
   - **Week View:** 7-day layout, time slots, drag-drop enabled, color-coded by service
   - **Month View:** Calendar grid, appointments shown as colored dots/bars, click to expand
   - **Sidebar:** Upcoming appointments list (next 7 days), filterable by staff/service

6. **Real-time Updates:**
   - When staff member creates/edits appointment, all other logged-in users see update within 2 seconds
   - Uses WebSocket connection or polling (if WebSocket unavailable)
   - Toast notification on calendar when appointment changes

**Data Validation Rules:**
- Cannot create appointment before "today" (no backdating)
- Cannot create overlapping appointments for same client/staff
- Duration must be >= 15 minutes
- Price must be >= 0
- Start time must align with salon opening hours
- Buffer time must not conflict with existing appointments

**Edge Cases:**
- What if staff member is deleted? → Existing appointments reassigned to unassigned or marked "Staff unavailable"
- What if service is deleted? → Appointments keep service history, but cannot create new with that service
- What if client is deleted? → Appointments are archived (kept for history)
- What if appointment is edited to past time? → Show warning, allow or prevent based on admin setting
- What if two staff try to book same slot simultaneously? → Last writer wins, other gets conflict error

---

#### Feature: Client Management

**Core Functionality:**
- **Client database:** Store all client information with searchable interface
- **Client profiles:** Name, phone, email, address, preferences, notes, service history
- **Service history:** All past appointments with dates, services, staff, prices, notes
- **Client communication:** Internal notes visible to staff, client preferences tracked

**Detailed Behaviors:**

1. **Client Database:**
   - Table view: Name, Phone, Email, Last Visit, Total Visits, Actions (edit/view)
   - Search bar: Real-time search by name, phone, or email
   - Filter: By last visit date, total visits, service preferences
   - Pagination: 25 clients per page, load more or page navigation
   - Add new client: Inline form in table or modal
   - Export: Download client list as CSV

2. **Client Profile:**
   - Header: Client name, avatar/initials, contact info
   - Section 1: Contact Information
     - Phone (primary + secondary)
     - Email (primary + secondary)
     - Address (street, city, state, zip)
     - Birthday (optional, for marketing)
   - Section 2: Service Preferences
     - Preferred staff member (can be empty)
     - Preferred service type
     - Any allergies or medical notes
     - Communication preferences (SMS, Email, Phone call)
   - Section 3: Service History
     - Chronological table: Date, Service, Staff, Price, Notes
     - Link to original appointment (if still in calendar)
   - Section 4: Internal Notes
     - Free-form text area, staff can add notes after each appointment
     - Notes are private (not visible to client)
   - Edit: All fields editable, save changes, confirmation

3. **Adding Client Notes:**
   - Staff clicks "Add Note" button on client profile
   - Modal opens with text area
   - Auto-fills timestamp and staff member name
   - Notes appear in chronological order on profile
   - Example: "Prefers blonde highlights only", "Allergic to latex gloves", "Always late 10-15 min"

4. **Service History:**
   - Shows all completed appointments
   - Click appointment → opens modal with full details (service, staff, price, duration, client notes)
   - If payment enabled: Shows payment method, amount paid, tip (if any)
   - Can add notes retroactively to past appointment
   - Use for pattern analysis: "This client books every 4 weeks", "Prefers X service"

5. **Client Communication Preferences:**
   - Checkboxes for: SMS, Email, Phone
   - Settings stored in profile
   - Respected when sending reminders or marketing
   - Default: Email checked

6. **Duplicate Client Prevention:**
   - Search suggests existing clients when creating new appointment
   - If adding new client during appointment creation, warning if similar name exists
   - Merge function (future phase): Combine duplicate client records

**Data Validation:**
- Phone: Valid format or warning
- Email: Valid format, required
- Name: Required, min 2 characters
- Address: Optional but if provided, must include city/zip
- Birthday: Must be valid date, cannot be in future

**Edge Cases:**
- Client with no appointments: Still searchable and viewable
- Deleted client: Archive instead of hard delete, keep history
- Client books under multiple names: Staff can note in preferences
- Inactive client (no bookings in 6 months): No special handling, but could flag in future

---

#### Feature: Staff Management

**Core Functionality:**
- **Staff profiles:** Name, role, certifications, availability schedule
- **Role-based access:** Admin, Manager, Staff/Service Provider, Receptionist
- **Schedule management:** Define working hours, assign to appointments, track availability
- **Time tracking:** Basic clock in/out (future: detailed payroll)

**Detailed Behaviors:**

1. **Staff Profile:**
   - Section 1: Basic Info
     - Name, Email, Phone, Avatar
     - Role: Admin / Manager / Staff / Receptionist (dropdown)
     - Certifications (text, e.g., "Master Hair Colorist", "Licensed Esthetician")
     - Commission rate (if using, future feature): % or fixed $ per appointment
   - Section 2: Availability Schedule
     - Week view: Check boxes for days/hours worked
     - Example: Mon-Fri 9am-5pm, Sat 10am-3pm (fill form)
     - Lunch break: Automatically block 12-1pm or custom time
     - Time off: Add date ranges (vacation, sick, etc.)
   - Section 3: Services
     - Checkboxes for services this staff can provide
     - Used for filtering in online booking & calendar
   - Edit: All fields editable

2. **Adding/Removing Staff:**
   - Admin clicks "Add Staff Member"
   - Modal with: Name, Email, Phone, Role, Services, Working Hours
   - Validation: Email must be unique
   - On save: Invite email sent to staff with login link
   - Staff can accept/decline invite
   - If staff declines, remain in "pending" state until accepted
   - Remove staff: Soft delete (archive), reassign appointments or mark as "Staff unavailable"

3. **Role-Based Access Control (detailed in Section 4):**
   - Permissions enforced on both frontend and backend
   - Role selected during staff creation, changeable by Admin
   - Example: "Staff/Service Provider" cannot view payments, reports, or other staff schedules

4. **Schedule Management:**
   - Admin/Manager can view all staff schedules in Week or Month view
   - Color-coded by staff member
   - Click schedule cell to edit working hours
   - Staff can mark themselves "unavailable" for breaks/meetings (show as blocked)
   - Time off request workflow (future phase)

5. **Time Tracking (MVP):**
   - "Clock in/out" button on staff dashboard
   - Records login/logout time
   - Total hours worked per day/week displayed
   - No enforcement of punch clock (staff can manually override, future: geolocation verification)
   - Used for reporting (staff hours vs. revenue, future feature)

6. **Staff Communication:**
   - Admin can send message to individual staff or broadcast to all (future: in-app notifications)
   - Shift changes: Notify staff if schedule changes

**Data Validation:**
- Email: Unique per salon, valid format
- Name: Required, min 2 characters
- Role: Required, must be valid role
- Working hours: At least one day per week

**Edge Cases:**
- Staff member quits: Archive, existing appointments show "Staff unavailable"
- Staff role changes: Permissions update immediately on next login
- Staff creates appointment then is marked unavailable: Appointment remains, but staff shows unavailable for that slot
- Multiple staff with same name: System allows, but UI shows initials or avatar to differentiate

---

### 3.2 ADD-ON FEATURES ($25/month each)

#### Add-on: Online Booking

**Core Functionality:**
- **Public booking page:** Customer-facing interface at pecase.org/[salonname]/booking
- **Real-time availability:** Shows only open slots
- **Service selection:** Browse services, staff, pricing
- **Booking confirmation:** Automated email/SMS

**URL Structure & Pages:**

1. **Public Booking Landing:**
   - URL: `pecase.org/{salonslug}/booking`
   - Page shows: Salon name, logo (if available), hours, phone, address
   - Call-to-action: "Book an Appointment" button
   - If salon has multiple locations (with multi-location add-on): Location selector dropdown
   - Hero image: Can upload custom image or use default (future: templates)

2. **Service Selection:**
   - URL: `pecase.org/{salonslug}/booking/services`
   - Show all available services as cards
   - Per card: Service name, description, duration, price, available staff
   - Filter: By category (haircuts, color, massage, etc.)
   - Search: Find services by name
   - Select service: Show next step (staff selection)

3. **Staff Selection (Optional):**
   - If service can be done by multiple staff: Show staff member cards with photos/names
   - Rating (if reviews enabled): Show star rating
   - Availability: Show "Available today", "Next available: Tue 2pm"
   - If client has preferred staff (stored in profile): Highlight
   - Client can choose "Next available" (system picks first open slot)

4. **Date/Time Selection:**
   - Calendar showing next 30 days
   - Only show available dates/times (grayed out if fully booked)
   - Click date → show available time slots for that day
   - Selected staff/service shows duration (e.g., "60 min")
   - Display in client's timezone (detect from browser, allow override)
   - Past times (already passed today) shown as unavailable

5. **Client Information:**
   - If client is logged in (for existing clients): Auto-fill name, phone, email
   - If new client: Form with:
     - First & Last Name (required)
     - Phone (required, for SMS reminders)
     - Email (required, for confirmations)
     - Preferences (optional text area for notes, allergies, preferences)
     - Communication preference: Email, SMS, Both
   - Checkboxes: "I agree to terms" (optional terms link)

6. **Review & Confirm:**
   - Summary: Service, Staff, Date/Time, Duration, Price
   - Client info: Name, Phone, Email
   - Button: "Confirm Booking"
   - Link: "Edit appointment details"
   - If payment enabled: Show price + payment info, "Pay now" option

7. **Confirmation:**
   - After booking: Thank you page with:
     - Appointment details (service, staff, date/time)
     - Confirmation number
     - Option to add to calendar (ical download)
     - Link to cancel appointment
     - "Call us at [phone]" if client has questions
   - Email confirmation sent automatically with:
     - Appointment details
     - Directions/address
     - Cancellation link
     - Business hours/contact

**Detailed Behaviors:**

1. **Real-time Availability:**
   - Availability recalculates as staff add appointments (live updates every 30 seconds or WebSocket)
   - If two customers try to book same slot simultaneously: Last one gets conflict error with retry
   - Consider buffer time: Slot shown unavailable if buffer time conflicts
   - Consider staff availability: Only show slots when staff is available (not lunch, not time off)

2. **Embeddable Widget:**
   - Salon can embed booking widget on their website
   - Widget code provided in settings: `<script src="pecase.org/embed.js?salon=..."></script>`
   - Widget appears as modal/popup on click, or inline iframe
   - Widget is responsive (mobile-friendly)
   - Uses same styling as public page (respects salon branding if enabled)

3. **Calendar Sync (Future Phase):**
   - Option to sync with Google Calendar, Outlook
   - Outbound: Every appointment added to selected calendar
   - Inbound: Blocked time from personal calendar prevents booking (e.g., staff vacation)

4. **Booking Notifications:**
   - SMS: "Hi [Name]! Your appointment is confirmed: [Service] on [Date] at [Time] with [Staff]. Call [Phone] to reschedule."
   - Email: HTML-formatted with salon logo, full details, cancellation link
   - Timing: Sent immediately on booking confirmation

5. **Guest vs. Registered Booking:**
   - Guest booking: No account required, temporary link emailed for future edits
   - Registered client: Login before booking, see booking history, manage recurring
   - System: Check if phone/email matches existing client, offer "Found existing profile" option

**Data Validation:**
- Service must be enabled in add-on subscription
- Client phone: Valid format, required for SMS reminders
- Email: Valid format, required
- Date: Cannot be in past, cannot be after 90 days (configurable)
- Time: Must be within salon hours and staff availability
- Duration: Matches service configuration

**Edge Cases:**
- What if staff member cancels during booking process? → Show "Staff unavailable, pick another" or offer next available
- What if service is deleted while customer booking? → Show error "Service no longer available"
- What if customer books, then refreshes page? → Show "Booking already confirmed, no duplicate"
- What if customer has accessibility needs? → Ensure WCAG AA compliance (keyboard navigation, screen reader)
- What if salon is closed on that day? → Do not show in date picker
- What if it's 11:59pm and customer tries to book "tomorrow" service? → Allow, but recalculate date boundary

---

#### Add-on: Payment Processing

**Core Functionality:**
- **Stripe integration:** Secure payment processing
- **Multiple payment methods:** Credit card, Apple Pay, Google Pay
- **Invoicing:** Automated invoices sent to client
- **Tipping:** Allow tips at checkout
- **Refunds & adjustments:** Process refunds, adjust prices

**Detailed Behaviors:**

1. **Payment Flow:**
   - At end of appointment: Staff or receptionist opens "Complete Appointment" form
   - If using online booking: Payment already collected, skip to receipt
   - If in-person: Show total amount due (service price + tax if applicable)
   - Options: "Pay in cash" (no processing), "Pay by card", "Process payment"
   - If card: Show Stripe payment element (card field or payment icons)
   - Validation: Card data validated in real-time, encrypted before sending to server
   - On success: Receipt generated, printed/emailed option
   - On failure: Show error message (card declined, expired, etc.), retry option

2. **Tipping:**
   - After payment: "Add tip?" prompt
   - Options: 15%, 18%, 20%, Custom amount, No tip
   - Tip is added to total before payment processing
   - Tip is optional (can skip with "No tip" button)
   - Tip amount recorded separately in reporting

3. **Invoicing:**
   - Auto-generated for each paid appointment
   - Contains: Invoice number, date, service details, price, client info, payment method
   - Can be emailed to client automatically (toggle in settings)
   - PDF available for download or print
   - Email subject: "[Salon Name] Invoice #[Number]"

4. **Refunds & Adjustments:**
   - Manager can process refund from payment history
   - Click appointment → "Refund" button
   - Select: Full refund or custom amount
   - Optional reason dropdown: "Customer request", "No-show credit", "Discount"
   - Confirmation prompt: "Refund $50.00? This cannot be undone."
   - Refund processed to original payment method within 2-5 business days
   - Email sent to client: "Refund processed: $50.00 will appear in [1-5 business days]"

5. **Price Overrides:**
   - When creating/editing appointment: Admin can override default service price
   - Example: Discount code applied, custom pricing, package usage
   - Field: "Price" (shows default, can edit)
   - Warning: "Overriding default price ($50.00 → $40.00)"
   - Recorded in appointment for reporting

6. **Payment History:**
   - Dashboard widget: "Recent Transactions" (last 5 payments)
   - Page: "Payments" with table
     - Columns: Date, Client, Service, Amount, Staff, Method, Status, Actions
     - Status: Completed, Pending, Failed, Refunded
     - Filter by date range, client, status, staff
     - Export as CSV/PDF

7. **Stripe Account Linking:**
   - During onboarding: Admin connects Stripe account (OAuth flow)
   - After connection: Payment processing live
   - Disconnection: Turns off payment processing immediately
   - Webhook for failed payments: Alert admin, mark transaction as failed

**Data Validation:**
- Amount must be > 0
- Payment method must be valid
- Client must have email for receipt
- Refund amount cannot exceed original payment
- Tip must be >= 0

**Error Handling:**
- "Card declined: Contact your card issuer" → Show on UI, do not retry automatically
- "Network error: Payment not processed. Try again?" → Allow retry
- "Stripe connection failed" → Show warning in settings, disable payments
- "Duplicate payment detected" → Do not process, show "This appointment already paid"

**Edge Cases:**
- What if staff cancels appointment after payment? → Allow refund, track in cancellation reason
- What if customer pays twice? → Manual reconciliation, refund second payment
- What if Stripe is down? → Gracefully degrade to "Pay in cash" with warning
- What if refund window closes (30+ days)? → Manual refund through Stripe dashboard, note in system

---

#### Add-on: SMS/Email Reminders

**Core Functionality:**
- **Automated reminders:** 24 hours and 2 hours before appointment
- **SMS & Email:** Customers choose preference
- **Customizable messages:** Brand with salon name, contact info
- **Opt-in management:** Respect customer communication preferences

**Detailed Behaviors:**

1. **Reminder Configuration:**
   - Admin settings page: "Reminders"
   - Toggles: Enable/disable email reminders, SMS reminders
   - Timing: Configurable hours before (default 24h and 2h)
   - Custom message template: Text area for email/SMS template
   - Template variables: {ClientName}, {ServiceName}, {StaffName}, {AppointmentTime}, {SalonPhone}, {CancellationLink}
   - Example SMS: "Hi {ClientName}! Reminder: Your {ServiceName} appointment is on {AppointmentTime} with {Staff} at {SalonName}. Reply to confirm or call {Phone}"
   - Example Email: HTML template with salon branding

2. **Sending Reminders:**
   - Background job runs every hour: Check appointments in next 24h and 2h windows
   - For each appointment:
     - Check client communication preference (email/SMS/both)
     - Check if client opted in to reminders
     - Check if reminder already sent (no duplicates)
     - Send via Twilio (SMS) or SendGrid (Email)
     - Log delivery status (sent, failed, bounced)
   - If SMS fails (invalid number): Log error, try email as fallback
   - If email fails: Retry up to 3 times with exponential backoff

3. **Reminder Confirmation:**
   - SMS reminder includes: Reply "C" to confirm, "R" to reschedule (future phase)
   - Email reminder includes: "Confirm" button (links to confirmation form)
   - System tracks confirmations (optional, for future: no-show prediction)

4. **Opt-in Management:**
   - During client creation: Checkbox "Opt-in to reminders"
   - Client profile: "Communication preferences" section
     - Checkboxes: SMS, Email, Phone call
     - "Opt out of all reminders" checkbox
   - In booking confirmation email: Unsubscribe link
   - Client can manage preferences via account (if logged in)

5. **No-show Reduction:**
   - Reminders reduce no-shows by ~20-30% (documented in feature)
   - Track no-show rate before/after enabling reminders (future: analytics)

**Data Validation:**
- Phone number: Valid format (E.164: +1234567890)
- Email: Valid format
- Hours before: 1-72 hours (reasonable range)
- Message templates: Max 160 chars for SMS, 5000 for email

**Error Handling:**
- "SMS failed: Invalid phone number" → Log, do not retry
- "Email failed: Address bounced" → Mark as failed, admin notified
- "Twilio/SendGrid down" → Retry every 5 minutes for 1 hour
- "Customer unsubscribed" → Do not send future reminders, log in system

**Edge Cases:**
- What if customer cancels appointment? → Do not send reminder for cancelled appointment
- What if customer has no phone number? → Send email only (if opted in)
- What if customer has no email? → Send SMS only
- What if reminder is due but appointment is in 1.5 hours (after 2h reminder)? → Send anyway
- What if appointment is rescheduled? → Cancel original reminder, reschedule for new time

---

#### Add-on: Marketing Automation

**Core Functionality:**
- **Email campaigns:** Create and send promotional campaigns
- **SMS campaigns:** Send bulk SMS to customer lists
- **Segmentation:** Target customers by service type, visit frequency, last visit date
- **Templates:** Pre-built campaign templates
- **Analytics:** Track open rates, click rates, conversion

**Detailed Behaviors:**

1. **Campaign Creation:**
   - Dashboard: "Marketing" → "New Campaign"
   - Step 1: Campaign details
     - Name (e.g., "Summer Special - 20% Off Highlights")
     - Campaign type: Email or SMS
     - Subject line (email) or Message (SMS)
   - Step 2: Choose audience
     - All customers
     - Segment: By service type, last visit date range, visit frequency, price spent
     - Example: "Customers who visited for hair services in last 3 months"
   - Step 3: Template selection
     - Pre-built templates: Promotional, Birthday offer, Seasonal, General
     - Custom template: Editor with {Variables}
     - Preview: See how template renders
   - Step 4: Schedule
     - Send now
     - Schedule for specific date/time
     - Recurring: Weekly, monthly (future phase)
   - Step 5: Review & Send
     - Show: Number of recipients, content preview, estimated cost
     - Confirmation: "Send to 342 customers?"

2. **Segmentation Examples:**
   - "Customers who booked massage service": Filter by service_type = "Massage"
   - "Visited in last 30 days": Filter by last_appointment_date >= (today - 30 days)
   - "High-value customers": Filter by lifetime_value > $500
   - "At-risk churn": Filter by last_appointment_date >= (today - 60 days) AND last_appointment_date < (today - 90 days)
   - Multiple filters can be combined with AND logic

3. **Email Templates:**
   - HTML-based templates with drag-and-drop editor (future phase)
   - Basic: Text + image support
   - Variables: {FirstName}, {SalonName}, {OfferCode}, {ExpiryDate}, {UnsubscribeLink}
   - Mobile-responsive by default
   - Example: "Hi {FirstName}, Get 20% off your next massage! Use code RELAX20 at checkout. Expires {ExpiryDate}."

4. **SMS Templates:**
   - Simpler than email (160-character limit)
   - Example: "Hi {FirstName}! Get 20% off your next appointment at {SalonName}. Code: RELAX20. Expires {ExpiryDate}. Reply STOP to opt out."
   - Character counter in editor

5. **Birthday & Anniversary Campaigns:**
   - Auto-campaign: Send special offer on customer birthday
   - Settings: Enable/disable, days before birthday to send, custom message
   - Example: "Happy Birthday, {FirstName}! Enjoy 15% off any service this month!"
   - Requires customer birthday in profile

6. **Campaign Analytics:**
   - Dashboard: "Campaign Performance"
   - Metrics:
     - Sent: Number of messages sent
     - Delivered: Number successfully delivered
     - Opened (email): % of emails opened
     - Clicked: % of links clicked
     - Unsubscribed: # of unsubscribes from this campaign
     - Conversions: # of appointments booked within 7 days of campaign (if trackable)
   - Chart: Open rate, click rate over time
   - Export: Download campaign results as CSV

7. **Unsubscribe Management:**
   - Every marketing email/SMS includes unsubscribe link
   - Clicking unsubscribe: Removes customer from future campaigns
   - Customer can manage preferences in account (if logged in)
   - Admin can manually unsubscribe customer

**Data Validation:**
- Audience size must be > 0
- Subject line: Required for email
- Message: Required, max 160 chars for SMS
- Send time: Cannot be in past
- Template variables must be valid

**Error Handling:**
- "No customers match this segment" → Show warning, allow to proceed or revise
- "Twilio/SendGrid down" → Show error, do not send, option to retry
- "Some emails bounced" → Log bounced addresses, show report

**Edge Cases:**
- What if customer unsubscribes during campaign send? → Stop sending to that customer
- What if customer has no email? → Skip email campaigns, show count
- What if campaign bounces on SMS carrier? → Log error, do not retry automatically
- What if customer books appointment after campaign? → Track in future phase for ROI

---

#### Add-on: Reporting & Analytics

**Core Functionality:**
- **Revenue dashboard:** Total revenue, revenue by service, revenue by staff
- **Performance metrics:** Busiest times, peak days, average appointment value
- **Client analytics:** Acquisition, retention, lifetime value, repeat rate
- **Staff performance:** Revenue per staff member, appointment count, ratings
- **Export reports:** Download data as PDF or CSV

**Detailed Behaviors:**

1. **Dashboard - Overview:**
   - Header stat cards:
     - Total Revenue (this month vs. last month % change)
     - Total Appointments (this month)
     - Average Appointment Value
     - No-show Rate (%)
   - Charts:
     - Revenue by day (line chart, last 30 days)
     - Revenue by service (bar chart)
     - Revenue by staff (bar chart)
   - Date range filter: Last 7 days, Last 30 days, Last 90 days, Custom range
   - Drill-down: Click chart bar to see details

2. **Revenue Metrics:**
   - Total revenue: Sum of all payments received
   - Revenue by service: Breakdown of revenue for each service type
   - Revenue by staff: How much revenue each staff member generated
   - Revenue by hour/day of week: When does business peak?
   - Average ticket: Total revenue / total appointments
   - Trends: YoY comparison (last year vs. this year for same period)

3. **Appointment Metrics:**
   - Total appointments: Count of completed appointments
   - Appointments by service: Breakdown by service type
   - Appointments by staff: How many appointments each staff completed
   - No-show rate: # of no-shows / total appointments %
   - Cancellation rate: # of cancellations / total appointments %
   - Average duration: Avg time per appointment
   - Peak hours: Which hours are busiest (e.g., 11am, 2pm, 4pm)

4. **Client Metrics:**
   - Total clients: Count of unique clients with appointments in period
   - New clients: # of first-time clients
   - Client acquisition cost (CAC): Total marketing spend / new clients (if tracked)
   - Repeat rate: % of clients who booked multiple times
   - Client lifetime value: Total revenue from a client over all time
   - Churn rate: % of clients inactive for 90+ days who were active in previous period
   - Retention rate: % of active clients in period who book in next period

5. **Staff Performance:**
   - Revenue per staff: Total revenue generated by each staff member
   - Appointment count: # of appointments per staff
   - Average appointment value per staff: Does staff upsell more?
   - Client feedback rating (if reviews enabled): Average rating
   - Hours worked vs. revenue: Productivity metric (if time tracking enabled)
   - Staff utilization: % of working hours booked vs. available

6. **Comparison & Filters:**
   - Date range: Picker for start/end dates
   - Service filter: Show metrics for specific services only
   - Staff filter: Show metrics for specific staff members only
   - Location filter: If multi-location (future feature)
   - Client segment filter: Filter to specific customer groups

7. **Export Functionality:**
   - Button: "Export as PDF" or "Export as CSV"
   - PDF: Formatted report with header (salon name, date range), tables, charts
   - CSV: Raw data for import to Excel/Google Sheets
   - Email option: Send report to admin/manager email

8. **Scheduled Reports:**
   - Admin can set up recurring reports (future phase)
   - Example: "Email me weekly revenue summary every Monday morning"
   - Frequency: Daily, Weekly, Monthly
   - Recipient: Multiple emails possible

**Data Validation:**
- Date range: Start must be before end
- Filters: Must be valid staff/service IDs
- Export format: PDF or CSV only

**Edge Cases:**
- What if no data in date range? → Show "No data available", allow to expand range
- What if staff member deleted? → Include in historical reports with note "Former staff"
- What if service deleted? → Include in historical reports with note "Archived service"
- What if zero revenue? → Show 0, not error

---

#### Add-on: Consultation Forms

**Core Functionality:**
- **Form builder:** Create custom intake forms without coding
- **Medical history:** Capture allergies, medications, skin conditions
- **Preferences:** Service preferences, pricing info, package selection
- **Digital signatures:** Liability waivers, consent forms
- **Pre-appointment:** Forms sent to clients before first appointment

**Detailed Behaviors:**

1. **Form Builder:**
   - Admin: "Marketing" → "Forms" → "New Form"
   - Drag-and-drop form builder (or simple interface)
   - Field types:
     - Text input (short text)
     - Long text (multi-line)
     - Dropdown (single select)
     - Checkboxes (multi-select)
     - Radio buttons (single select)
     - Date picker
     - File upload
     - Signature field
   - Per field: Label, placeholder text, required toggle, description
   - Form logic (future): Show field if condition met
   - Preview: See form as client sees it

2. **Pre-built Templates:**
   - "Hair Salon Intake": Q's about hair type, color history, allergies
   - "Massage Intake": Q's about pain areas, medical history, pressure preference
   - "Esthetics Intake": Q's about skin type, allergies, previous treatments
   - "Waxing Intake": Q's about skin sensitivity, medications
   - Customizable: Edit template before saving

3. **Form Distribution:**
   - Option 1: Email link (send via campaign)
   - Option 2: Embed on website (like booking widget)
   - Option 3: Link in online booking confirmation
   - Option 4: Manual: Receptionist gives tablet/print form
   - Tracking: Admin can see who filled it out, timestamp

4. **Medical History Capture:**
   - Fields: Allergies (free text or checkboxes), Medications (free text), Previous treatments, Medical conditions
   - Example form questions:
     - "Do you have any known allergies? If yes, please list:"
     - "Are you currently taking any medications? If yes, list them:"
     - "Have you had a wax/massage/coloring before? When?"
     - "Do you have any skin conditions or sensitivities?"
   - Validation: Open text fields, optional required toggle per field

5. **Preference Capture:**
   - Service preferences: Checkboxes for preferred service type
   - Pricing: "Preferred price range" slider or text
   - Package selection: Radio buttons for package options (if using packages feature)
   - Communication: "Preferred way to contact" (phone, email, SMS)
   - Staff preference: "Any preferred staff member?"

6. **Digital Signatures:**
   - Signature field type in form builder
   - Client draws signature on desktop (mouse) or mobile (touch)
   - Clear & redraw option
   - Signature stored as image, link to form response
   - Common use: Liability waivers, consent forms
   - Example: "I agree to the cancellation policy" with signature field

7. **Form Responses:**
   - Admin: "Forms" → Select form → "Responses"
   - Table view: Timestamp, Client, Completion status (completed/partial)
   - Click response: See full form data, download as PDF
   - Link to client profile: "View client"
   - Export all responses: CSV with headers

8. **Pre-Appointment Workflow:**
   - When receptionist books first-time client appointment:
     - Option to "Send intake form"
     - Select form, confirm send
     - Client receives email with link, deadline to complete (e.g., 24 hours before)
     - Staff sees in calendar: "Form pending" badge
     - If form not filled by appointment time, staff can still proceed (reminder prompt)
   - Staff can view form on tablet/phone before appointment

**Data Validation:**
- Form name: Required
- At least one field required
- Field labels: Required
- Signature captures: Must be non-empty to submit

**Error Handling:**
- "No form responses yet" → Show blank state with instructions
- "Client failed to complete form" → Allow staff to proceed, show warning

**Edge Cases:**
- What if client fills form multiple times? → Keep all responses, flag latest as current
- What if client abandons form? → Keep partial response, show "Incomplete" status
- What if form is deleted? → Archive form, keep responses for historical access
- What if medical info contradicts later appointment? → Flag in staff notes for review

---

#### Add-on: Membership & Packages

**Core Functionality:**
- **Service packages:** Bundle multiple services at discounted price
- **Recurring packages:** Monthly memberships, subscription services
- **Package tracking:** Track usage, remaining services
- **Auto-renewal:** Recurring monthly charges
- **Member pricing:** Special pricing for members vs. walk-ins
- **Package gifting:** Gift packages to others

**Detailed Behaviors:**

1. **Package Creation:**
   - Admin: "Services" → "Packages" → "New Package"
   - Package details:
     - Name (e.g., "Monthly Hair Care Plan")
     - Description
     - Type: One-time or Recurring (monthly)
     - Price
     - Duration: How long until expires (e.g., 30 days, 90 days)
   - Services included: Multi-select list of services
     - Per service: Quantity (e.g., 4 haircuts, 2 color treatments)
     - Per service: Valid for staff (all staff or specific staff)
   - Restrictions:
     - Expiration date (e.g., "Expires 90 days after purchase")
     - Blackout dates (e.g., "Cannot use during holidays")
   - Member-only pricing (future): Toggle to make members-only

2. **Package Types:**
   - **One-time package:** "Bridal Party Bundle" - 3 services at discounted price, expires 30 days
   - **Recurring membership:** "Monthly Beauty Plan" - $99/month, includes 4 services, auto-renews
   - **Credits package:** "100 service credits" - $500, use for any service, no expiration

3. **Package Purchase:**
   - Client sees packages in booking flow (if enabled)
   - During appointment: Staff can sell package (point of sale or checkout)
   - Online booking: Option to add package at checkout (if enabled)
   - After purchase:
     - Invoice generated
     - Confirmation email sent
     - Package added to client profile with usage tracker
     - If recurring: Next billing date displayed

4. **Package Usage & Tracking:**
   - Client profile: "Active Packages" section
     - Package name, remaining services, expiration date
     - Visual progress bar: 2 of 4 services used
   - When booking appointment:
     - If client has active package: Show "Use [Package] credits?" option
     - Auto-apply if only one package available (with confirmation)
     - If multiple packages: Client selects which to use
   - After appointment: Service deducted from package
   - Notification: Email when package nearly expired (10 days left) or usage >80%

5. **Member Pricing:**
   - Services can have member vs. non-member pricing
   - Example: "Haircut" = $50 regular, $40 for members
   - When booking: If client has active membership, show member price
   - Staff sees pricing in calendar/appointment view

6. **Auto-Renewal:**
   - Recurring packages auto-renew on expiration date
   - Payment processed using stored payment method (Stripe)
   - Confirmation email: "Your [Package] has been renewed for $99"
   - Renewal receipt generated and sent
   - Client can cancel renewal anytime in their account
   - Admin can manually pause/cancel renewal

7. **Gifting:**
   - Client can purchase package as gift for friend
   - During purchase: "Is this a gift?" toggle
   - If yes: Enter recipient's name, email
   - Recipient receives gift email with:
     - Gift message from purchaser
     - Package details
     - Redemption link/code
     - Instructions to claim
   - Recipient claims gift: Creates account if needed, package added to profile

8. **Package Reporting:**
   - Admin: "Reports" → "Packages"
   - Metrics:
     - Packages sold (count, revenue)
     - Package revenue by type (one-time vs. recurring)
     - Usage rate: Avg % of services used before expiration
     - Active memberships: Count of recurring, MRR (monthly recurring revenue)
     - Churn: % of memberships that don't renew
   - Table: Client, package, purchase date, expiration, usage, status

**Data Validation:**
- Package name: Required
- Price: > 0
- Services included: At least 1
- Duration: Valid, min 1 day
- Recurring price: > 0

**Error Handling:**
- "Client package expired" → Show "Package expired" when trying to use, offer to purchase new
- "Insufficient balance" → If credits-based, show "Only 1 credit remaining"
- "Recurring renewal failed" → Retry 3 times, notify client + admin if failed
- "Conflicting package rules" → Error during package creation if logic doesn't work

**Edge Cases:**
- What if client buys recurring package, then cancels subscription? → Keep active packages, process final renewal, disable auto-renewal
- What if package expiration date is reached? → Archive package, keep record, cannot use
- What if staff uses full package but client has overlapping schedules? → Allow, deduct from package, update balance
- What if package is deleted? → Archive, keep existing purchases active
- What if client has partial package usage? → On expiration, keep record for refund purposes (if applicable)

---

#### Add-on: Gift Cards

**Core Functionality:**
- **Digital gift cards:** Create and sell online
- **Physical gift cards:** Print gift card codes
- **Customization:** Set denomination, expiration, custom messages
- **Sales tracking:** Track gift card sales and redemptions
- **Redemption:** Apply gift card balance at checkout

**Detailed Behaviors:**

1. **Gift Card Creation:**
   - Admin: "Products" → "Gift Cards" → "New Gift Card"
   - Denominations: Create preset amounts ($25, $50, $100) or custom
   - Settings:
     - Expiration date (optional, e.g., 1 year from purchase)
     - Can be used for: All services, specific services, packages only
     - Message template: "You have been gifted a [Amount] gift card!"
   - Design: Can upload custom image or use default template

2. **Digital Gift Cards:**
   - Client purchases from website (pecase.org/giftcards)
   - Payment via Stripe
   - Recipient gets email with:
     - Gift card code (e.g., GC-12345678)
     - Balance ($50)
     - Customizable message from purchaser
     - Link to booking page with code auto-filled
     - Expiration date (if applicable)
   - Code is unique and tied to amount (not reusable)

3. **Physical Gift Cards:**
   - Admin prints gift card template from dashboard
   - Template shows: Salon name, denomination, code, expiration
   - Printed in-salon, sold at register
   - Same code as digital, but physical presentation
   - Sold by staff during appointment

4. **Gift Card Sales:**
   - Widget on salon website (or standalone page)
   - Options: Choose amount ($25, $50, $100, custom)
   - Add personal message (optional, 200 char limit)
   - Specify recipient email
   - Checkout: Pay via Stripe
   - Confirmation: "Gift card sent to [email]" with receipt

5. **Gift Card Redemption:**
   - Client enters code at checkout (online booking or in-salon)
   - System validates code:
     - Code exists
     - Balance > 0
     - Not expired
   - Balance applied to total
   - Example: Service $50 + Tip $10 = $60, Gift card covers $50, client pays $10
   - Balance updated: $60 - $50 = $10 remaining
   - Remaining balance: Can be used again or transferred (future)

6. **In-Salon Redemption:**
   - Staff enters gift card code in POS / checkout system
   - Remaining balance shown
   - Applied to appointment total
   - On complete: Balance updated

7. **Gift Card Management:**
   - Admin dashboard: "Gift Cards" → "Active"
     - Table: Code, Amount, Balance, Recipient, Expiration, Redeemed date
     - Filter: By date purchased, recipient, status (active/redeemed/expired)
   - "Expired" tab: Archived expired gift cards (30 days past expiration)
   - Generate report: Gift card revenue, redemption rate

8. **Gift Card Analytics:**
   - Metrics:
     - Total gift card revenue (all sales)
     - Gift cards sold (count)
     - Average gift card value
     - Redemption rate: # redeemed / # sold %
     - Time to redemption: Avg days from purchase to use
     - Outstanding balance: Total remaining balance
   - Chart: Sales by month, redemption timeline

9. **Lost/Stolen Gift Cards:**
   - Admin can cancel gift card code (if customer reports loss)
   - Issue replacement code
   - Mark original as "cancelled"
   - No refund, just reissue

**Data Validation:**
- Amount: > 0
- Expiration date: Can be in future (optional)
- Code: Auto-generated, unique
- Recipient email: Valid format (for digital)

**Error Handling:**
- "Code not found" → Show error, suggest contacting salon
- "Code already redeemed" → Show "This code has already been used"
- "Code expired" → Show "Gift card expired on [date]"
- "Code balance is zero" → Show "Gift card is fully redeemed"

**Edge Cases:**
- What if customer loses gift card code? → Admin can look up by email (if digital), reissue
- What if gift card expires mid-transaction? → Allow redemption if purchased before expiration, even if expired now (configurable)
- What if customer tries to use same code twice? → Reject second use, show "Already redeemed"
- What if gift card purchased but never used? → Remind customer via email at 30 days before expiration
- What if customer asks for refund on gift card? → Configurable policy, admin can issue refund or new code

---

#### Add-on: Multi-location Support

**Core Functionality:**
- **Manage multiple locations:** One dashboard for all locations
- **Location-specific settings:** Different staff, hours, services per location
- **Centralized reporting:** See revenue across all locations
- **Staff assignment:** Assign staff to specific locations
- **Customer choice:** Customers select location when booking
- **Consolidated payments:** One payment account for all locations

**Detailed Behaviors:**

1. **Location Creation:**
   - Admin: "Settings" → "Locations" → "Add Location"
   - Per location:
     - Location name (e.g., "Downtown", "Westside")
     - Address, phone, hours
     - Staff members (multi-select, assign existing staff or create new)
     - Services offered (multi-select, same or different from other locations)
     - Time zone (if different from HQ)
   - Primary location: Marked as default
   - Can have up to [N] locations (configurable per plan)

2. **Location-Specific Staff:**
   - Staff can be assigned to one location or multiple
   - When creating appointment: Staff filtered by selected location
   - Staff profile shows "Assigned locations"
   - When staff logs in: Can switch between locations (if assigned to multiple)
   - Calendar view: Can view all staff at location or specific staff

3. **Location-Specific Services:**
   - Each location can offer same or different services
   - Example: Downtown has "Balayage", Westside has "Box Braids"
   - During online booking: Client selects location first, then sees available services
   - Staff: Can be trained for specific services at specific locations

4. **Location-Specific Hours:**
   - Each location has own hours
   - Example: Downtown 9am-7pm, Westside 10am-5pm
   - Online booking: Respects location hours
   - Calendar: Shows location hours, blocks time outside hours

5. **Centralized Dashboard:**
   - Admin can view all locations at once:
     - Total revenue across locations
     - Appointments across locations
     - Staff across locations
   - Filter: View specific location only
   - Comparison: Compare performance across locations

6. **Centralized Reporting:**
   - Reports can show:
     - All locations combined
     - Individual location breakdown
     - Location comparison (which is performing best?)
   - Metrics per location: Revenue, appointments, client acquisition, churn

7. **Customer Location Selection (Online Booking):**
   - Booking page: "Select location"
   - Map or list view of locations
   - Click location → Shows available services and times at that location
   - If no location selected: System defaults to primary or shows all locations

8. **Consolidated Payments:**
   - One Stripe account for all locations
   - Payments from all locations go to same account
   - Reports show location breakdown
   - Payouts: Can split by location or consolidated

9. **Staff Scheduling Across Locations:**
   - Staff working at multiple locations:
     - Admin can view schedule across both locations
     - Prevent double-booking (staff cannot have same appointment time at 2 locations)
   - Example: Mon morning at Downtown, Mon afternoon at Westside

10. **Inventory (Future):**
    - Each location can have own inventory levels
    - Track product stock by location
    - Reorder alerts per location

**Data Validation:**
- Location name: Required, unique per salon
- Address: Required
- Phone: Valid format
- Staff: At least 1 staff per location

**Error Handling:**
- "Cannot delete location with active appointments" → Archive instead or reassign appointments
- "No services assigned to location" → Warning during setup
- "Staff double-booking across locations" → Prevent if same time slot

**Edge Cases:**
- What if staff member is deleted? → Remove from all location assignments
- What if service is deleted? → Remove from all location offering lists
- What if primary location is deleted? → Reassign primary to another location
- What if location is closed? → Archive, keep historical data, do not allow new bookings
- What if customer books then wants different location? → Allow reschedule to different location

---

#### Add-on: Reviews & Ratings

**Core Functionality:**
- **Review requests:** Automatically request reviews after appointments
- **Star ratings:** 5-star rating system
- **Written reviews:** Customers write feedback
- **Public display:** Display reviews on public booking page
- **Review responses:** Business responds to reviews
- **Review analytics:** Track average rating, review trends

**Detailed Behaviors:**

1. **Review Request Workflow:**
   - After appointment is marked completed:
     - Option 1: Automatic SMS/email sent to client (24 hours after)
     - Option 2: Manual request: Receptionist hands tablet, asks for quick feedback
   - Review link/QR code: Unique per appointment, one-time use
   - Feedback form:
     - "How would you rate your experience? 1-5 stars"
     - "Would you like to leave a comment?"
     - Optional: Staff member name/rating
     - Optional: Specific service rating

2. **Review Submission:**
   - Client clicks link or scans QR code
   - Page shows: Service, date, staff member
   - Star rating: Click to select 1-5 stars (visual feedback)
   - Optional review text: 500 char limit, free form
   - Example: "Amazing service! Jane is the best. Will definitely come back!"
   - Submit button: Confirmation "Thank you for your feedback!"

3. **Review Approval (Moderation):**
   - Admin: "Reviews" → "Pending Moderation"
   - Option 1: Auto-publish (trust customers, review all later)
   - Option 2: Require approval (moderate first, then publish)
   - Per review: Approve, decline, or edit
   - Decline reason: Spam, inappropriate, etc.
   - Publish review: Goes live on public page

4. **Staff Ratings:**
   - Reviews can include specific staff member rating
   - If service with multiple staff options, client rates individual staff
   - Staff dashboard: See own ratings/reviews
   - Affects staff performance metrics

5. **Public Display (Phase 2):**
   - Reviews show on public booking page (pecase.org/[salonname]/booking)
   - Display format:
     - Star rating (1-5)
     - Client name (or "Anonymous")
     - Review text
     - Date posted
     - Service/staff name (if applicable)
   - Only approved reviews shown
   - Sort: Newest first, highest rated first

6. **Review Responses:**
   - Business can respond to reviews (public comments)
   - Admin clicks "Respond" on review
   - Text area: Max 1000 chars
   - Response posted publicly below review
   - Example: "Thank you for the feedback! We'd love to see you again!"
   - Edit/delete response: Admin can manage

7. **Review Analytics:**
   - Dashboard: "Reviews"
   - Metrics:
     - Average rating (e.g., 4.8 out of 5)
     - Total reviews
     - Rating distribution (chart: # of 5-star, 4-star, etc.)
     - Reviews per staff member
     - Trend: Average rating over time
   - Sentiment analysis (future): Flag negative reviews

8. **Negative Review Handling:**
   - Alert admin if review < 3 stars
   - Suggest response template for negative reviews
   - Track reasons for low ratings to improve

9. **Review Invitation:**
   - Manual send: Admin can send review request to specific client
   - Bulk send: Send review request to all clients from past month
   - Timing: Configurable (24h after appointment by default)

10. **Incentivize Reviews (Optional):**
    - Can offer small discount/reward for leaving review (configurable)
    - Example: "Leave a review, get 10% off your next appointment"
    - Requires manager approval before offering

**Data Validation:**
- Star rating: 1-5 only
- Review text: Max 500 chars
- Response text: Max 1000 chars

**Error Handling:**
- "Review link expired" → Show "This review link has expired. Please request a new one."
- "Duplicate review prevented" → If client tries to submit 2 reviews for same appointment, reject 2nd
- "Review not found" → If admin tries to view deleted review

**Edge Cases:**
- What if staff member leaves and review has their name? → Keep historical review, mark staff as "former staff"
- What if review is inappropriate? → Decline/delete, no public display
- What if customer reviews but appointment cancelled? → Still accept review, flag as "cancelled appointment"
- What if business wants to hide all negative reviews? → Only show moderation options, transparency still required
- What if customer gives 1-star but no written review? → Accept, use for analytics

---

## SECTION 4: DATA MODEL & DATABASE SCHEMA

### 4.1 Core Tables

```
TABLE: Salons
  - id (UUID)
  - name (String)
  - email (String, unique)
  - phone (String)
  - address (String)
  - city (String)
  - state (String)
  - zip (String)
  - timezone (String, default "America/Chicago")
  - logo_url (String, nullable)
  - website (String, nullable)
  - created_at (Timestamp)
  - updated_at (Timestamp)
  - is_active (Boolean, default true)
  - subscription_plan (String, enum: "base", "pro", "enterprise")
  - features_enabled (JSON array, e.g., ["online_booking", "payments"])

TABLE: Users (Staff)
  - id (UUID)
  - salon_id (FK to Salons)
  - email (String)
  - password_hash (String)
  - first_name (String)
  - last_name (String)
  - phone (String, nullable)
  - role (String, enum: "admin", "manager", "staff", "receptionist")
  - avatar_url (String, nullable)
  - certifications (String, nullable)
  - is_active (Boolean, default true)
  - last_login (Timestamp, nullable)
  - created_at (Timestamp)
  - updated_at (Timestamp)

TABLE: StaffLocations (Many-to-many: Staff to Locations)
  - id (UUID)
  - staff_id (FK to Users)
  - location_id (FK to Locations)
  - assigned_at (Timestamp)

TABLE: StaffAvailability
  - id (UUID)
  - staff_id (FK to Users)
  - day_of_week (Int, 0-6: Sun-Sat)
  - start_time (Time, e.g., "09:00")
  - end_time (Time, e.g., "17:00")
  - is_available (Boolean, default true)
  - lunch_start (Time, nullable)
  - lunch_end (Time, nullable)
  - created_at (Timestamp)

TABLE: TimeOff
  - id (UUID)
  - staff_id (FK to Users)
  - start_date (Date)
  - end_date (Date)
  - reason (String, enum: "vacation", "sick", "meeting", "other")
  - created_at (Timestamp)

TABLE: Clients
  - id (UUID)
  - salon_id (FK to Salons)
  - first_name (String)
  - last_name (String)
  - phone (String, unique per salon)
  - email (String, nullable)
  - address (String, nullable)
  - birthday (Date, nullable)
  - notes (String, nullable)
  - preferred_staff_id (FK to Users, nullable)
  - preferred_service_id (FK to Services, nullable)
  - communication_preference (String, enum: "email", "sms", "both", "none")
  - opted_in_reminders (Boolean, default true)
  - is_active (Boolean, default true)
  - created_at (Timestamp)
  - updated_at (Timestamp)

TABLE: ClientNotes
  - id (UUID)
  - client_id (FK to Clients)
  - staff_id (FK to Users)
  - content (String)
  - created_at (Timestamp)

TABLE: Services
  - id (UUID)
  - salon_id (FK to Salons)
  - name (String)
  - description (String, nullable)
  - duration_minutes (Int, default 30)
  - price (Decimal)
  - color (String, default "#C7DCC8" - sage green)
  - category (String, nullable, e.g., "haircut", "color", "massage")
  - is_active (Boolean, default true)
  - created_at (Timestamp)
  - updated_at (Timestamp)

TABLE: ServiceStaff (Many-to-many: Service to Staff)
  - id (UUID)
  - service_id (FK to Services)
  - staff_id (FK to Users)
  - is_available (Boolean, default true)

TABLE: Appointments
  - id (UUID)
  - salon_id (FK to Salons)
  - location_id (FK to Locations, nullable)
  - client_id (FK to Clients)
  - staff_id (FK to Users)
  - service_id (FK to Services)
  - start_time (Timestamp)
  - end_time (Timestamp)
  - duration_minutes (Int)
  - price (Decimal)
  - price_override (Decimal, nullable)
  - actual_price (Decimal, calculated: price_override OR price)
  - status (String, enum: "confirmed", "pending", "completed", "no_show", "cancelled")
  - cancellation_reason (String, nullable)
  - notes (String, nullable)
  - created_at (Timestamp)
  - updated_at (Timestamp)
  - cancelled_at (Timestamp, nullable)

TABLE: Payments
  - id (UUID)
  - salon_id (FK to Salons)
  - appointment_id (FK to Appointments, nullable)
  - client_id (FK to Clients)
  - amount (Decimal)
  - amount_paid (Decimal)
  - tip_amount (Decimal, default 0)
  - total_amount (Calculated: amount + tip_amount)
  - method (String, enum: "cash", "card", "online", "check", "other")
  - status (String, enum: "pending", "completed", "failed", "refunded")
  - stripe_charge_id (String, nullable)
  - created_at (Timestamp)
  - refunded_at (Timestamp, nullable)
  - refund_reason (String, nullable)

TABLE: Locations
  - id (UUID)
  - salon_id (FK to Salons)
  - name (String)
  - address (String)
  - phone (String)
  - timezone (String)
  - hours (JSON, e.g., {"mon": "9:00-17:00"})
  - is_active (Boolean, default true)
  - is_primary (Boolean, default false)
  - created_at (Timestamp)

TABLE: Packages
  - id (UUID)
  - salon_id (FK to Salons)
  - name (String)
  - description (String, nullable)
  - price (Decimal)
  - type (String, enum: "one_time", "recurring")
  - duration_days (Int)
  - renewal_price (Decimal, nullable, for recurring)
  - is_active (Boolean, default true)
  - created_at (Timestamp)

TABLE: PackageServices (Many-to-many: Package to Service)
  - id (UUID)
  - package_id (FK to Packages)
  - service_id (FK to Services)
  - quantity (Int, e.g., 4 for "4 haircuts")

TABLE: ClientPackages
  - id (UUID)
  - client_id (FK to Clients)
  - package_id (FK to Packages)
  - purchase_date (Date)
  - expiration_date (Date)
  - services_remaining (Int)
  - total_services (Int)
  - auto_renew (Boolean, default false)
  - is_active (Boolean, default true)
  - created_at (Timestamp)

TABLE: GiftCards
  - id (UUID)
  - salon_id (FK to Salons)
  - code (String, unique)
  - initial_amount (Decimal)
  - balance (Decimal)
  - status (String, enum: "active", "redeemed", "expired", "cancelled")
  - expires_at (Timestamp, nullable)
  - purchased_at (Timestamp)
  - redeemed_at (Timestamp, nullable)
  - recipient_email (String, nullable)
  - recipient_name (String, nullable)

TABLE: Reviews
  - id (UUID)
  - salon_id (FK to Salons)
  - appointment_id (FK to Appointments)
  - client_id (FK to Clients)
  - staff_id (FK to Users, nullable)
  - rating (Int, 1-5)
  - comment (String, nullable)
  - is_approved (Boolean, default false)
  - submitted_at (Timestamp)
  - approved_at (Timestamp, nullable)

TABLE: ReviewResponses
  - id (UUID)
  - review_id (FK to Reviews)
  - response_text (String)
  - responded_by_id (FK to Users)
  - responded_at (Timestamp)

TABLE: MarketingCampaigns
  - id (UUID)
  - salon_id (FK to Salons)
  - name (String)
  - type (String, enum: "email", "sms")
  - subject_line (String, nullable)
  - message (String)
  - audience_filter (JSON, e.g., {"service_type": "massage", "last_visit_days_ago": {"min": 30, "max": 90}})
  - sent_at (Timestamp, nullable)
  - created_at (Timestamp)

TABLE: ConsultationForms
  - id (UUID)
  - salon_id (FK to Salons)
  - name (String)
  - fields (JSON array of field objects)
  - is_active (Boolean, default true)
  - created_at (Timestamp)

TABLE: FormResponses
  - id (UUID)
  - form_id (FK to ConsultationForms)
  - client_id (FK to Clients)
  - appointment_id (FK to Appointments, nullable)
  - response_data (JSON)
  - submitted_at (Timestamp)
```

### 4.2 Relationships Summary

- Salons: 1 → Many Users, Clients, Services, Appointments, Locations
- Users: 1 → Many Appointments (as staff), ClientNotes, StaffLocations
- Clients: 1 → Many Appointments, ClientNotes, ClientPackages, Reviews
- Services: 1 → Many Appointments, ServiceStaff, PackageServices
- Locations: 1 → Many Appointments, StaffLocations
- Packages: 1 → Many PackageServices, ClientPackages
- GiftCards: Many → Many Appointments (redeemed on payment)
- Reviews: 1 → 1 ReviewResponse

---

## SECTION 5: API SPECIFICATIONS

### 5.1 Authentication

```
POST /api/v1/auth/register
{
  "email": "owner@salon.com",
  "password": "securepass123",
  "salon_name": "The Barber Shop",
  "phone": "555-0123"
}
Response: { "id": "user-123", "salon_id": "salon-123", "token": "jwt-token" }

POST /api/v1/auth/login
{
  "email": "owner@salon.com",
  "password": "securepass123"
}
Response: { "user": {...}, "salon": {...}, "token": "jwt-token" }

POST /api/v1/auth/logout
Response: { "success": true }

POST /api/v1/auth/refresh
Response: { "token": "new-jwt-token" }

GET /api/v1/auth/me
Response: { "user": {...}, "salon": {...} }
```

### 5.2 Appointments

```
GET /api/v1/appointments?salon_id=...&date_from=...&date_to=...
Response: [{ "id": "apt-123", "client": {...}, "staff": {...}, "service": {...}, ... }]

POST /api/v1/appointments
{
  "salon_id": "salon-123",
  "client_id": "client-456",
  "staff_id": "user-789",
  "service_id": "service-101",
  "start_time": "2026-02-15T14:00:00Z",
  "duration_minutes": 60,
  "price": 75.00,
  "status": "confirmed"
}
Response: { "id": "apt-123", "status": "confirmed", ... }

PATCH /api/v1/appointments/{id}
{
  "status": "completed",
  "notes": "Client very satisfied"
}
Response: { "id": "apt-123", "status": "completed", ... }

DELETE /api/v1/appointments/{id}
Response: { "success": true }
```

### 5.3 Clients

```
GET /api/v1/clients?salon_id=...&search=...
Response: [{ "id": "client-123", "name": "John Doe", ... }]

POST /api/v1/clients
{
  "salon_id": "salon-123",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "555-0123",
  "email": "john@example.com"
}
Response: { "id": "client-123", ... }

GET /api/v1/clients/{id}
Response: { "id": "client-123", "first_name": "John", "service_history": [...], ... }

PATCH /api/v1/clients/{id}
{
  "phone": "555-0999",
  "preferred_staff_id": "user-789"
}
Response: { "id": "client-123", ... }

POST /api/v1/clients/{id}/notes
{
  "content": "Prefers balayage over full color"
}
Response: { "id": "note-123", "client_id": "client-123", ... }
```

### 5.4 Services

```
GET /api/v1/services?salon_id=...
Response: [{ "id": "service-123", "name": "Haircut", "price": 50, ... }]

POST /api/v1/services
{
  "salon_id": "salon-123",
  "name": "Haircut",
  "duration_minutes": 30,
  "price": 50.00,
  "category": "haircut"
}
Response: { "id": "service-123", ... }

PATCH /api/v1/services/{id}
{
  "price": 55.00
}
Response: { "id": "service-123", "price": 55.00, ... }
```

### 5.5 Payments

```
POST /api/v1/payments
{
  "salon_id": "salon-123",
  "appointment_id": "apt-123",
  "amount": 75.00,
  "tip_amount": 15.00,
  "method": "card"
}
Response: { "id": "payment-123", "stripe_charge_id": "ch_...", "status": "completed" }

POST /api/v1/payments/{id}/refund
{
  "amount": 75.00,
  "reason": "Customer request"
}
Response: { "id": "payment-123", "status": "refunded", ... }

GET /api/v1/payments?salon_id=...&date_from=...
Response: [{ "id": "payment-123", ... }]
```

### 5.6 Online Booking

```
GET /api/v1/booking/{salon_slug}/services
Response: [{ "id": "service-123", "name": "Haircut", "price": 50, "staff": [...] }]

GET /api/v1/booking/{salon_slug}/availability?service_id=...&date=...
Response: { "available_slots": ["09:00", "09:30", "10:00", ...] }

POST /api/v1/booking/{salon_slug}/book
{
  "client_name": "Jane Doe",
  "client_email": "jane@example.com",
  "client_phone": "555-1234",
  "service_id": "service-123",
  "staff_id": "user-789",
  "start_time": "2026-02-15T14:00:00Z"
}
Response: { "appointment_id": "apt-123", "confirmation_number": "CONF-12345" }
```

### 5.7 Reports & Analytics

```
GET /api/v1/reports/dashboard?salon_id=...&date_from=...&date_to=...
Response: {
  "total_revenue": 5000,
  "total_appointments": 45,
  "average_ticket": 111.11,
  "no_show_rate": 0.05,
  "revenue_by_service": {...},
  "revenue_by_staff": {...}
}

GET /api/v1/reports/clients?salon_id=...
Response: {
  "total_clients": 150,
  "new_clients": 12,
  "repeat_rate": 0.72,
  "churn_rate": 0.03,
  "lifetime_value_avg": 500
}
```

All endpoints require:
- `Authorization: Bearer {jwt-token}` header
- Salons can only access their own data
- Role-based access control enforced on backend

---

## SECTION 6: SCREEN LAYOUTS & COMPONENTS

### 6.1 Key Screens (Based on Dribbble Reference)

**Dashboard (Admin/Manager)**
- Header: Search bar, notifications, profile menu
- Left sidebar: Navigation (Dashboard, Calendar, Clients, Services, Payments, Reports, Settings)
- Main content area:
  - Stat cards (4 cards): Total Revenue, Total Appointments, Total Clients, No-show Rate
  - Decorative pea motif in top-right of 1-2 cards
  - Charts: Revenue by day (line), Revenue by service (bar), Revenue by staff (bar)
  - Below: "Upcoming Appointments" table with scroll

**Calendar View**
- Left sidebar: Staff list (checkboxes to toggle visibility)
- Main content: Week view calendar
  - Time slots on left (9am-5pm in 30-min increments)
  - Staff columns across top (Mon-Fri)
  - Appointments as colored blocks (by service type)
  - Drag-and-drop enabled
  - Click empty slot: Open "New Appointment" modal
  - Click appointment: Show quick details, options to edit/delete

**Clients View**
- Header: "Clients" title, "Add Client" button, search bar
- Table: Client name, phone, email, last visit, total visits, actions
- Click client: Open profile panel on right side with:
  - Contact info (editable)
  - Service history
  - Internal notes
  - Service preferences

**Reports View**
- Header: "Reports", date range picker
- Tabs: Overview, Revenue, Appointments, Clients, Staff, Packages
- Per tab: Relevant metrics and charts
- Export button: PDF/CSV

**Settings View**
- Tabs: General, Staff, Services, Locations, Features, Billing, Integrations
- Per tab: Relevant configurations

### 6.2 Component Library

- Buttons: Primary (Sage Green), Secondary, Danger, Ghost
- Cards: White background, 12px radius, soft shadow, padding 20px
- Inputs: 40px height, Sage Green focus state, validation
- Tables: Header row with background, striped rows, hover effects
- Modals: Centered, 400px+ width, semi-transparent overlay
- Sidebar: Charcoal background, white text, active state highlight
- Stat cards: 200×140px, soft colored background, number + label + optional icon
- Badges: Status indicators (Confirmed-green, Pending-yellow, Cancelled-red)

---

## SECTION 7: USER ROLES & PERMISSION MATRIX

### 7.1 Permission Matrix

| Feature | Admin | Manager | Staff | Receptionist |
|---------|-------|---------|-------|--------------|
| View dashboard | ✓ | ✓ | ✗ | ✗ |
| View all calendars | ✓ | ✓ | ✗ | ✓ |
| View own calendar | ✓ | ✓ | ✓ | ✓ |
| Create appointment | ✓ | ✓ | ✓ | ✓ |
| Edit appointment | ✓ | ✓ | Own only | ✓ |
| Delete appointment | ✓ | ✓ | Own only | ✓ |
| View all clients | ✓ | ✓ | ✓ | ✓ |
| Create client | ✓ | ✓ | ✓ | ✓ |
| Edit client | ✓ | ✓ | ✓ | ✓ |
| View payments | ✓ | ✓ | ✗ | ✗ |
| Process payment | ✓ | ✓ | ✗ | ✗ |
| Refund payment | ✓ | ✓ | ✗ | ✗ |
| View reports | ✓ | ✓ | ✗ | ✗ |
| Add/remove staff | ✓ | ✗ | ✗ | ✗ |
| Manage settings | ✓ | ✗ | ✗ | ✗ |
| Manage billing | ✓ | ✗ | ✗ | ✗ |
| Clock in/out | ✓ | ✓ | ✓ | ✓ |
| View own hours | ✓ | ✓ | ✓ | ✓ |
| Send marketing campaigns | ✓ | ✓ | ✗ | ✗ |
| Create forms | ✓ | ✓ | ✗ | ✗ |

### 7.2 Role Descriptions

**Admin:** Full system access, billing, user management, system settings
**Manager:** Operational management, schedule, clients, payments, marketing, no user/billing changes
**Staff/Service Provider:** Own schedule, own appointments, client information, cannot access payments/reports/other staff
**Receptionist:** Schedule management, client management, calendar view, cannot access payments/reports

---

## SECTION 8: ERROR HANDLING & EDGE CASES

### 8.1 Common Error Responses

```
// Validation error
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "email": "Invalid email format"
  }
}

// Authorization error
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED",
  "message": "You do not have permission to access this resource"
}

// Not found
{
  "error": "Not found",
  "code": "NOT_FOUND",
  "message": "Appointment not found"
}

// Server error
{
  "error": "Internal server error",
  "code": "SERVER_ERROR",
  "message": "An unexpected error occurred. Please try again."
}
```

### 8.2 Specific Error Scenarios

**Appointment Scheduling:**
- Staff unavailable: "Staff is not available during this time"
- Client conflict: "This client already has an appointment at this time"
- Outside hours: "This time slot is outside salon hours"
- In past: "Cannot create appointment in the past"
- Duration conflict: "Appointment duration extends beyond staff availability"

**Payments:**
- Card declined: "Card was declined. Please check card details or use another card."
- Network error: "Payment processing temporarily unavailable. Try again?"
- Stripe down: "Payment system is down. Please try again later or pay in cash."
- Double charge: "This appointment has already been paid for."

**User Management:**
- Email exists: "Email is already in use by another staff member"
- Invalid role: "Invalid user role selected"
- Cannot delete: "Cannot delete the last admin user"
- Password weak: "Password must be at least 8 characters with uppercase, lowercase, and numbers"

**Reminders & Campaigns:**
- Invalid phone: "Phone number is in invalid format"
- Bounced email: "Email address bounced. Update client email."
- No recipients: "No clients match the selected audience"
- Send failed: "Campaign failed to send. Please retry."

---

## SECTION 9: IMPLEMENTATION CHECKLIST FOR CLAUDE

### Phase 1: Foundation (Weeks 1-2)

- [ ] Set up project structure (monorepo with Turborepo)
- [ ] Configure database schema (PostgreSQL with Prisma ORM)
- [ ] Set up authentication (JWT, OAuth2 for Stripe/Google)
- [ ] Build API scaffolding (Express, TypeScript)
- [ ] Set up frontend project (Next.js 14, React, TypeScript, Tailwind)
- [ ] Create design system tokens (colors, typography, spacing)
- [ ] Build core component library (buttons, cards, inputs, modals)
- [ ] Set up environment variables and secrets management

### Phase 2: Core Features (Weeks 2-4)

- [ ] Implement user registration/login system
- [ ] Build staff management (add/remove staff, roles)
- [ ] Implement client database (CRUD operations)
- [ ] Build calendar UI (day/week/month views)
- [ ] Implement drag-and-drop scheduling
- [ ] Build appointment creation/editing forms
- [ ] Set up real-time updates (WebSocket or polling)
- [ ] Implement service management

### Phase 3: Add-on Features - Phase 1 (Weeks 4-5)

- [ ] Online booking: Public booking page
- [ ] Online booking: Service/staff/time selection
- [ ] Online booking: Payment at checkout (Stripe integration)
- [ ] Stripe setup and payment processing
- [ ] Email reminders (SendGrid integration)
- [ ] SMS reminders (Twilio integration)

### Phase 4: Admin & Reports (Week 6)

- [ ] Build dashboard with stats and charts
- [ ] Implement reporting & analytics
- [ ] Build settings pages (general, staff, services, billing)
- [ ] Set up role-based access control on frontend & backend

### Phase 5: Polish & Testing (Week 6-7)

- [ ] Mobile responsiveness testing
- [ ] Performance optimization
- [ ] Security audit (OWASP, SQL injection, XSS, CSRF)
- [ ] User acceptance testing
- [ ] Bug fixes and refinements

### Phase 6: Launch (Week 8)

- [ ] Production deployment
- [ ] Monitoring setup (Sentry, uptime monitoring)
- [ ] Support infrastructure
- [ ] Marketing/early customer onboarding

### Future Phases (After MVP)

- [ ] Additional add-ons (Marketing Automation, Forms, Packages, Gift Cards)
- [ ] Multi-location support
- [ ] Reviews & ratings
- [ ] Mobile apps (iOS/Android)
- [ ] Advanced integrations (Zapier, webhooks)

---

## SECTION 10: QUALITY ASSURANCE CRITERIA

### Performance Targets

- **Page load time:** <2 seconds for critical flows (calendar, booking, dashboard)
- **API response time:** <500ms for 95th percentile
- **Uptime:** 99.5%+
- **Mobile rendering:** Full responsive support (mobile, tablet, desktop)

### Security Targets

- OWASP Top 10 compliance
- Data encrypted in transit (HTTPS) and at rest (where applicable)
- JWT tokens with 1-hour expiration
- Rate limiting on APIs (prevent brute force)
- Input validation on all endpoints
- CSRF protection on forms

### Accessibility Targets

- WCAG AA compliance
- Keyboard navigation throughout app
- Screen reader support
- Color contrast ratios >= 4.5:1

---

## SECTION 11: SUCCESS DEFINITION (MVP)

At launch, Pecase will be considered successful if:

1. **Product Quality:**
   - <2 second load times on critical paths
   - 99.5%+ uptime
   - <0.1% unhandled error rate

2. **User Experience:**
   - Onboarding < 30 minutes
   - Zero critical bugs reported in first month
   - Mobile-responsive on all screen sizes

3. **User Adoption:**
   - 10+ beta salons using platform
   - <5% critical support issues per salon
   - Staff prefer Pecase over competitors (internal survey)

4. **Business Metrics:**
   - All core features (calendar, clients, staff, online booking) working reliably
   - Payment processing 100% success rate
   - Email/SMS reminders delivering 99%+ rate

---

## APPENDIX: REFERENCE DESIGN

**Design Reference:** Dribbble - Barber and Beauty Salon Booking Dashboard
**URL:** https://dribbble.com/shots/26339164-Barber-and-Beauty-Salon-Booking-Dashboard

**Key Visual Attributes to Match:**
- Soft pastel color palette (peach, lavender, mint, rose)
- Clean, minimal interface with generous whitespace
- Charcoal dark sidebar navigation
- Cream/off-white main background
- Soft shadows and subtle interactions
- Professional yet approachable aesthetic
- Decorative geometric shapes and illustrations (adapt as pea motifs)

---

**END OF COMPREHENSIVE PRD**

This document should provide Claude with all necessary context and specifications to implement Pecase correctly.
