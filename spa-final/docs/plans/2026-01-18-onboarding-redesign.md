# Peacase Onboarding Redesign

**Date:** 2026-01-18
**Status:** Approved

---

## Overview

Complete redesign of the onboarding flow for Peacase, a multi-tenant SaaS platform for spas, salons, and personal care businesses. The goal is minimal essential onboarding followed by contextual just-in-time setup.

### Design Principles

- **Minimal friction to payment** - Only collect what's essential to start
- **Contextual setup** - Guide users through features when they need them
- **No dead ends** - Empty states always show next action
- **Progressive disclosure** - Advanced features revealed as needed

---

## Business Types Supported

Expanded Wellness category:
- Hair Salons
- Nail Salons
- Day Spas
- Barbershops
- Beauty Studios
- Massage Therapy
- Med Spas
- Wellness Centers
- Tattoo Studios
- Tanning Salons

---

## Feature Scope

### Pricing Model
Full Dynamic Pricing:
- Service variants (e.g., Short/Medium/Long hair)
- Staff-level pricing (senior vs junior rates)
- Time-based pricing (peak hours, weekends)
- Member/loyalty rates

### Compensation System
Full Suite:
- Hourly wages
- Salary
- Commission percentages
- Hybrid models
- Booth rental
- Tiered commission
- Product sales commission
- Tip handling/pooling

### Booking System
Advanced Booking:
- Multi-service appointments
- Service add-ons
- Recurring appointments
- Waitlist management
- Resource booking (rooms, equipment)
- Group bookings
- Classes/workshops
- Deposit requirements

### Intake Forms
Configurable:
- Custom questions per service
- Required vs optional fields
- Digital signatures
- Pre-appointment delivery

### Subscription Model
Current model retained:
- $50/month base
- $25/month per add-on
- Add-ons: Multi-location, Advanced Reporting, Marketing Suite, etc.

---

## 4-Step Onboarding Flow

### Step 1: Business Basics
Collected information:
- Business name
- Business type (dropdown from supported types)
- Timezone
- Primary contact email
- Basic business hours (can refine later)

**UI:** Clean form, auto-save progress, ~2 minutes to complete

### Step 2: Choose Add-ons
Display:
- Base plan features ($50/month)
- Available add-ons with descriptions ($25/month each)
- Running total
- "You can change this anytime" reassurance

**UI:** Card-based selection, toggle on/off, clear pricing

### Step 3: Payment
Integration:
- Stripe Checkout
- Credit card + additional methods
- Show selected plan summary
- Apply any promo codes

**UI:** Embedded Stripe Elements, secure badge, money-back guarantee

### Step 4: Success
Actions:
- Celebration moment (confetti, checkmark)
- "Your account is ready!"
- Primary CTA: "Go to Dashboard"
- Brief mention: "We'll guide you through setup"

---

## Contextual Setup Flows

Instead of forcing configuration during onboarding, users configure features when they first try to use them.

### Trigger Points

| User Action | Setup Flow Triggered |
|-------------|---------------------|
| Click "Calendar" with no hours set | Business Hours Setup |
| Click "Add Appointment" with no services | Service Creation Wizard |
| Click "Staff" with no team members | Staff Addition Flow |
| Click "Online Booking" unconfigured | Booking Page Setup |
| Click "Clients" empty | Client Import Option |

### Setup Flow Behavior

- **Presentation:** Modal or slide-over panel (not full page)
- **Structure:** Step-by-step, focused on one thing
- **Escape:** "Skip for now" always available
- **Completion:** Celebration + contextual next suggestion
- **Memory:** Tracks what's been set up, doesn't re-prompt

### Key Setup Wizards

#### Service Creation Wizard
1. Service name and category
2. Duration and base price
3. (Optional) Add variants
4. (Optional) Staff-specific pricing
5. Assign to staff members

#### Staff Addition Flow
1. Name and contact info
2. Role selection
3. Services they perform
4. (Optional) Compensation structure
5. Schedule/availability

#### Booking Page Setup
1. Choose URL slug
2. Select services to show online
3. Set booking policies (how far ahead, cancellation)
4. (Optional) Deposit requirements
5. Preview and publish

#### Intake Form Builder
1. Choose template or start blank
2. Add/edit questions
3. Set required vs optional
4. Attach to services
5. Enable signature if needed

---

## Database Schema Updates

### New Models Required

```prisma
// Full Dynamic Pricing
model ServiceVariant {
  id          String   @id @default(cuid())
  serviceId   String
  service     Service  @relation(fields: [serviceId], references: [id])
  name        String   // "Short Hair", "Long Hair"
  duration    Int      // minutes
  price       Decimal
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model StaffServicePricing {
  id          String   @id @default(cuid())
  staffId     String
  staff       Staff    @relation(fields: [staffId], references: [id])
  serviceId   String
  service     Service  @relation(fields: [serviceId], references: [id])
  variantId   String?
  variant     ServiceVariant? @relation(fields: [variantId], references: [id])
  price       Decimal  // Override price for this staff member
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([staffId, serviceId, variantId])
}

model TimePricing {
  id          String   @id @default(cuid())
  salonId     String
  salon       Salon    @relation(fields: [salonId], references: [id])
  name        String   // "Peak Hours", "Weekend Rate"
  multiplier  Decimal  // 1.2 = 20% more
  dayOfWeek   Int[]    // 0-6, Sunday = 0
  startTime   String   // "17:00"
  endTime     String   // "20:00"
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Full Compensation Suite
model StaffCompensation {
  id              String   @id @default(cuid())
  staffId         String
  staff           Staff    @relation(fields: [staffId], references: [id])
  type            String   // "hourly", "salary", "commission", "booth_rental", "hybrid"
  hourlyRate      Decimal?
  salaryAmount    Decimal?
  salaryPeriod    String?  // "weekly", "biweekly", "monthly"
  commissionRate  Decimal? // Base commission percentage
  boothRent       Decimal?
  boothRentPeriod String?  // "weekly", "monthly"
  tipHandling     String   // "keep_all", "pool", "percentage"
  tipPoolPercent  Decimal?
  effectiveDate   DateTime @default(now())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model CommissionTier {
  id                  String   @id @default(cuid())
  staffCompensationId String
  staffCompensation   StaffCompensation @relation(fields: [staffCompensationId], references: [id])
  minRevenue          Decimal  // Monthly revenue threshold
  commissionRate      Decimal  // Rate when threshold met
  createdAt           DateTime @default(now())
}

// Advanced Booking
model AppointmentService {
  id            String   @id @default(cuid())
  appointmentId String
  appointment   Appointment @relation(fields: [appointmentId], references: [id])
  serviceId     String
  service       Service  @relation(fields: [serviceId], references: [id])
  variantId     String?
  variant       ServiceVariant? @relation(fields: [variantId], references: [id])
  staffId       String
  staff         Staff    @relation(fields: [staffId], references: [id])
  price         Decimal
  duration      Int
  sortOrder     Int      @default(0)
  isAddOn       Boolean  @default(false)
  createdAt     DateTime @default(now())
}

model Resource {
  id          String   @id @default(cuid())
  salonId     String
  salon       Salon    @relation(fields: [salonId], references: [id])
  name        String   // "Room 1", "Massage Table A"
  type        String   // "room", "equipment"
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model AppointmentResource {
  id            String   @id @default(cuid())
  appointmentId String
  appointment   Appointment @relation(fields: [appointmentId], references: [id])
  resourceId    String
  resource      Resource @relation(fields: [resourceId], references: [id])
  createdAt     DateTime @default(now())

  @@unique([appointmentId, resourceId])
}

model RecurringAppointment {
  id            String   @id @default(cuid())
  salonId       String
  salon         Salon    @relation(fields: [salonId], references: [id])
  clientId      String
  client        Client   @relation(fields: [clientId], references: [id])
  frequency     String   // "weekly", "biweekly", "monthly"
  dayOfWeek     Int
  time          String
  serviceIds    String[] // Services in recurring booking
  staffId       String
  staff         Staff    @relation(fields: [staffId], references: [id])
  startDate     DateTime
  endDate       DateTime?
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

// Configurable Intake Forms
model IntakeForm {
  id          String   @id @default(cuid())
  salonId     String
  salon       Salon    @relation(fields: [salonId], references: [id])
  name        String
  description String?
  isActive    Boolean  @default(true)
  requiresSignature Boolean @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  fields      IntakeFormField[]
  responses   IntakeFormResponse[]
  services    Service[] // Many-to-many via implicit table
}

model IntakeFormField {
  id          String   @id @default(cuid())
  formId      String
  form        IntakeForm @relation(fields: [formId], references: [id])
  label       String
  type        String   // "text", "textarea", "select", "checkbox", "date", "signature"
  options     String[] // For select/checkbox types
  isRequired  Boolean  @default(false)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
}

model IntakeFormResponse {
  id            String   @id @default(cuid())
  formId        String
  form          IntakeForm @relation(fields: [formId], references: [id])
  clientId      String
  client        Client   @relation(fields: [clientId], references: [id])
  appointmentId String?
  appointment   Appointment? @relation(fields: [appointmentId], references: [id])
  responses     Json     // { fieldId: value }
  signatureUrl  String?
  submittedAt   DateTime @default(now())
}

// Setup Progress Tracking
model SetupProgress {
  id              String   @id @default(cuid())
  salonId         String   @unique
  salon           Salon    @relation(fields: [salonId], references: [id])
  businessHours   Boolean  @default(false)
  firstService    Boolean  @default(false)
  firstStaff      Boolean  @default(false)
  bookingPage     Boolean  @default(false)
  paymentMethod   Boolean  @default(false)
  completedAt     DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

---

## Dashboard Design

### Post-Payment Experience

Users land on dashboard with:
- Welcome banner: "Welcome to Peacase! Complete your setup to start accepting bookings."
- Progress indicator showing setup completion
- Quick action cards ordered by priority

### Empty State Strategy

| Feature | Empty State Message | Action Button |
|---------|---------------------|---------------|
| Services | "Add your first service to start accepting bookings" | "Add Service" |
| Staff | "Add team members to assign appointments" | "Add Staff Member" |
| Clients | "Your client list will appear here after first booking" | "Add Client" |
| Calendar | "Set your business hours to enable scheduling" | "Set Hours" |
| Online Booking | "Configure your booking page for clients" | "Set Up Booking" |

### Priority Order

Dashboard cards ordered by setup importance:
1. Business Hours (blocks everything)
2. Services (needed for bookings)
3. Staff (if they have employees)
4. Online Booking (revenue enabler)
5. Client Import (optional convenience)

---

## Settings Structure

```
Settings
├── Business Profile
│   ├── Name, logo, description
│   ├── Contact info
│   ├── Business type
│   └── Locations (if multi-location add-on)
│
├── Hours & Availability
│   ├── Regular business hours
│   ├── Staff schedules
│   ├── Holidays & closures
│   └── Buffer times between appointments
│
├── Services & Pricing
│   ├── Service categories
│   ├── Service list with variants
│   ├── Staff-specific pricing
│   └── Time-based pricing rules
│
├── Team
│   ├── Staff members
│   ├── Roles & permissions
│   ├── Compensation rules
│   └── Commission tiers
│
├── Online Booking
│   ├── Booking page URL & branding
│   ├── Booking policies (cancellation, deposits)
│   ├── Intake forms
│   └── Confirmation messages
│
├── Notifications
│   ├── Email templates
│   ├── SMS settings
│   └── Reminder timing
│
└── Billing
    ├── Current plan & add-ons
    ├── Payment method
    └── Invoices
```

---

## Implementation Phases

### Phase 1: Database & Schema
- Add new models to Prisma schema
- Create and run migrations
- Update Prisma client
- Verify existing data compatibility

### Phase 2: New Onboarding Flow
- Build 4-step wizard component
- Step 1: Business Basics
- Step 2: Choose Add-ons
- Step 3: Payment (Stripe integration)
- Step 4: Success → Dashboard redirect

### Phase 3: Dashboard Redesign
- Empty state components
- Setup progress tracking
- Welcome banner
- Quick action cards

### Phase 4: Contextual Setup Flows
- Service creation wizard
- Staff creation wizard
- Booking page setup wizard
- Intake form builder
- Modal/slide-over presentation

### Phase 5: Settings Restructure
- New settings navigation
- Migrate existing settings
- Add new settings pages
- Connect contextual entry points

### Testing Strategy
- Each phase tested independently
- New user flow tested end-to-end after Phase 2
- Existing user migration verified

---

## Success Metrics

- **Onboarding completion rate** - Target: >90%
- **Time to first booking** - Target: <24 hours
- **Setup completion rate** - Target: >70% complete all setup within 7 days
- **Support tickets during onboarding** - Target: <5% of new users
