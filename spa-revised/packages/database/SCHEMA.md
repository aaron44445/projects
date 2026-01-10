# Pecase Database Schema Documentation

Complete reference for all tables, fields, relationships, and validation rules in the Pecase database.

## Table of Contents
1. [Core Tables](#core-tables)
2. [Scheduling Tables](#scheduling-tables)
3. [Relationships](#relationships)
4. [Indexes](#indexes)
5. [Enums](#enums)
6. [Validation Rules](#validation-rules)

---

## Core Tables

### Salons
Root entity representing salon businesses.

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| id | UUID | ✓ | ✓ | Primary key |
| name | String | ✓ | | Salon name |
| email | String | ✓ | ✓ | Contact email |
| phone | String | ✓ | | Phone number |
| address | String | ✓ | | Street address |
| city | String | ✓ | | City |
| state | String | ✓ | | State/province |
| zip | String | ✓ | | ZIP/postal code |
| timezone | String | | | IANA timezone (default: America/Chicago) |
| logoUrl | String | | | URL to salon logo |
| website | String | | | Salon website URL |
| subscriptionPlan | String | | | "base" \| "pro" \| "enterprise" |
| featuresEnabled | JSON | | | Array of enabled feature flags |
| createdAt | DateTime | ✓ | | Auto-set on creation |
| updatedAt | DateTime | ✓ | | Auto-updated on changes |
| isActive | Boolean | ✓ | | Soft delete flag (default: true) |

**Indexes:**
- `email` (unique)
- `isActive`

---

### Users (Staff)
Staff members with role-based access control.

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| id | UUID | ✓ | ✓ | Primary key |
| salonId | UUID | ✓ | | Foreign key to Salon |
| email | String | ✓ | | Email address |
| passwordHash | String | ✓ | | Hashed password |
| firstName | String | ✓ | | First name |
| lastName | String | ✓ | | Last name |
| phone | String | | | Phone number |
| role | String | ✓ | | "admin" \| "manager" \| "staff" \| "receptionist" |
| avatarUrl | String | | | Profile picture URL |
| certifications | String | | | Free-form certification text |
| lastLogin | DateTime | | | Last login timestamp |
| createdAt | DateTime | ✓ | | Auto-set on creation |
| updatedAt | DateTime | ✓ | | Auto-updated on changes |
| isActive | Boolean | ✓ | | Soft delete flag (default: true) |

**Indexes:**
- `(salonId, email)` (unique)
- `salonId`
- `email`
- `role`
- `isActive`

**Constraints:**
- Unique combination of `salonId` and `email` (cannot have duplicate emails within a salon)

---

### Clients
Customer database with preferences and history.

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| id | UUID | ✓ | ✓ | Primary key |
| salonId | UUID | ✓ | | Foreign key to Salon |
| firstName | String | ✓ | | First name |
| lastName | String | ✓ | | Last name |
| phone | String | ✓ | | Phone number |
| email | String | | | Email address |
| address | String | | | Mailing address |
| birthday | DateTime | | | Client's birthday |
| notes | String | | | Free-form notes |
| preferredStaffId | UUID | | | Foreign key to User (optional) |
| preferredServiceId | UUID | | | Foreign key to Service (optional) |
| communicationPreference | String | | | "email" \| "sms" \| "both" \| "none" |
| optedInReminders | Boolean | ✓ | | Reminder opt-in (default: true) |
| createdAt | DateTime | ✓ | | Auto-set on creation |
| updatedAt | DateTime | ✓ | | Auto-updated on changes |
| isActive | Boolean | ✓ | | Soft delete flag (default: true) |

**Indexes:**
- `(salonId, phone)` (unique)
- `salonId`
- `isActive`
- `phone`

**Constraints:**
- Unique phone number per salon
- preferredStaffId must be a user in the same salon
- preferredServiceId must be a service in the same salon

---

### Services
Service offerings with pricing and duration.

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| id | UUID | ✓ | ✓ | Primary key |
| salonId | UUID | ✓ | | Foreign key to Salon |
| name | String | ✓ | | Service name |
| description | String | | | Service description |
| durationMinutes | Int | ✓ | | Duration in minutes (default: 30) |
| price | Decimal | ✓ | | Price in dollars |
| color | String | ✓ | | Hex color code (default: #C7DCC8 - sage green) |
| category | String | | | Service category (e.g., "haircut", "color") |
| createdAt | DateTime | ✓ | | Auto-set on creation |
| updatedAt | DateTime | ✓ | | Auto-updated on changes |
| isActive | Boolean | ✓ | | Soft delete flag (default: true) |

**Indexes:**
- `salonId`
- `isActive`
- `category`

---

### Appointments
Core scheduling table with flexible pricing.

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| id | UUID | ✓ | ✓ | Primary key |
| salonId | UUID | ✓ | | Foreign key to Salon |
| locationId | UUID | | | Foreign key to Location (optional) |
| clientId | UUID | ✓ | | Foreign key to Client |
| staffId | UUID | ✓ | | Foreign key to User (staff) |
| serviceId | UUID | ✓ | | Foreign key to Service |
| startTime | DateTime | ✓ | | Appointment start time |
| endTime | DateTime | ✓ | | Appointment end time |
| durationMinutes | Int | ✓ | | Duration in minutes |
| price | Decimal | ✓ | | Base service price |
| priceOverride | Decimal | | | Override price (if different from service price) |
| status | String | ✓ | | "confirmed" \| "pending" \| "completed" \| "no_show" \| "cancelled" |
| cancellationReason | String | | | Reason for cancellation |
| notes | String | | | Internal appointment notes |
| createdAt | DateTime | ✓ | | Auto-set on creation |
| updatedAt | DateTime | ✓ | | Auto-updated on changes |
| cancelledAt | DateTime | | | Timestamp of cancellation |

**Indexes:**
- `salonId`
- `locationId`
- `clientId`
- `staffId`
- `serviceId`
- `(startTime, endTime)` (range queries)
- `status`

**Constraints:**
- startTime must be before endTime
- Cannot create appointments in the past
- Staff member must be available at that time
- Client cannot have overlapping appointments
- Appointment duration must match service duration or override

---

### Payments
Financial transactions and payment tracking.

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| id | UUID | ✓ | ✓ | Primary key |
| salonId | UUID | ✓ | | Foreign key to Salon |
| appointmentId | UUID | | | Foreign key to Appointment (optional) |
| clientId | UUID | ✓ | | Foreign key to Client |
| amount | Decimal | ✓ | | Base amount (service price) |
| amountPaid | Decimal | ✓ | | Amount actually paid |
| tipAmount | Decimal | ✓ | | Tip amount (default: 0) |
| method | String | ✓ | | "cash" \| "card" \| "online" \| "check" \| "other" |
| status | String | ✓ | | "pending" \| "completed" \| "failed" \| "refunded" |
| stripeChargeId | String | | | Stripe charge ID for card payments |
| refundedAt | DateTime | | | Timestamp of refund |
| refundReason | String | | | Reason for refund |
| createdAt | DateTime | ✓ | | Auto-set on creation |

**Indexes:**
- `salonId`
- `appointmentId`
- `clientId`
- `status`
- `stripeChargeId`

**Constraints:**
- amountPaid >= 0
- tipAmount >= 0
- stripeChargeId required if method is "card" or "online"

---

### Locations
Multi-location support for salon chains.

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| id | UUID | ✓ | ✓ | Primary key |
| salonId | UUID | ✓ | | Foreign key to Salon |
| name | String | ✓ | | Location name |
| address | String | ✓ | | Street address |
| phone | String | ✓ | | Phone number |
| timezone | String | ✓ | | IANA timezone |
| hours | JSON | ✓ | | Business hours (e.g., {"mon": "9:00-17:00"}) |
| isPrimary | Boolean | ✓ | | Primary location flag (default: false) |
| isActive | Boolean | ✓ | | Soft delete flag (default: true) |
| createdAt | DateTime | ✓ | | Auto-set on creation |

**Indexes:**
- `salonId`
- `isActive`

**Constraints:**
- Only one location per salon can have isPrimary = true
- At least one location must be active

---

### ClientNotes
Internal staff notes about clients.

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| id | UUID | ✓ | ✓ | Primary key |
| clientId | UUID | ✓ | | Foreign key to Client |
| staffId | UUID | ✓ | | Foreign key to User (staff) |
| content | String | ✓ | | Note content |
| createdAt | DateTime | ✓ | | Auto-set on creation |

**Indexes:**
- `clientId`
- `staffId`

---

## Scheduling Tables

### StaffAvailability
Weekly availability schedule per staff member.

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| id | UUID | ✓ | ✓ | Primary key |
| staffId | UUID | ✓ | | Foreign key to User |
| dayOfWeek | Int | ✓ | | 0-6 (Sunday-Saturday) |
| startTime | String | ✓ | | Time in HH:MM format (e.g., "09:00") |
| endTime | String | ✓ | | Time in HH:MM format (e.g., "17:00") |
| lunchStart | String | | | Lunch start time in HH:MM format |
| lunchEnd | String | | | Lunch end time in HH:MM format |
| isAvailable | Boolean | ✓ | | Availability flag (default: true) |
| createdAt | DateTime | ✓ | | Auto-set on creation |

**Indexes:**
- `(staffId, dayOfWeek)` (unique)
- `staffId`

**Constraints:**
- startTime must be before endTime
- If lunchStart/lunchEnd provided, must be between startTime and endTime
- One entry per staff member per day of week

---

### TimeOff
Vacation, sick leave, and time off periods.

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| id | UUID | ✓ | ✓ | Primary key |
| staffId | UUID | ✓ | | Foreign key to User |
| startDate | DateTime | ✓ | | Start date of time off |
| endDate | DateTime | ✓ | | End date of time off |
| reason | String | ✓ | | "vacation" \| "sick" \| "meeting" \| "other" |
| createdAt | DateTime | ✓ | | Auto-set on creation |

**Indexes:**
- `staffId`
- `(startDate, endDate)` (range queries)

**Constraints:**
- startDate must be before or equal to endDate
- Time off periods should not overlap for the same staff member

---

### ServiceStaff
Junction table linking services to staff that can perform them.

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| id | UUID | ✓ | ✓ | Primary key |
| serviceId | UUID | ✓ | | Foreign key to Service |
| staffId | UUID | ✓ | | Foreign key to User |
| isAvailable | Boolean | ✓ | | Availability flag (default: true) |

**Indexes:**
- `(serviceId, staffId)` (unique)
- `serviceId`
- `staffId`

**Constraints:**
- One entry per service-staff combination
- Staff must belong to same salon as service

---

### StaffLocation
Junction table linking staff to locations.

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| id | UUID | ✓ | ✓ | Primary key |
| staffId | UUID | ✓ | | Foreign key to User |
| locationId | UUID | ✓ | | Foreign key to Location |
| assignedAt | DateTime | ✓ | | Assignment timestamp (default: now) |

**Indexes:**
- `(staffId, locationId)` (unique)
- `staffId`
- `locationId`

**Constraints:**
- One entry per staff-location combination
- Staff and location must belong to same salon

---

## Package & Membership Tables

### Packages
Service bundles and membership packages.

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| id | UUID | ✓ | ✓ | Primary key |
| salonId | UUID | ✓ | | Foreign key to Salon |
| name | String | ✓ | | Package name |
| description | String | | | Package description |
| price | Decimal | ✓ | | Package price |
| type | String | ✓ | | "one_time" \| "recurring" |
| durationDays | Int | | | Days until expiration |
| renewalPrice | Decimal | | | Renewal price for recurring packages |
| isActive | Boolean | ✓ | | Soft delete flag (default: true) |
| createdAt | DateTime | ✓ | | Auto-set on creation |

**Indexes:**
- `salonId`
- `isActive`

---

### PackageServices
Junction table linking packages to services.

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| id | UUID | ✓ | ✓ | Primary key |
| packageId | UUID | ✓ | | Foreign key to Package |
| serviceId | UUID | ✓ | | Foreign key to Service |
| quantity | Int | ✓ | | Number of services included (default: 1) |

**Indexes:**
- `(packageId, serviceId)` (unique)
- `packageId`
- `serviceId`

---

### ClientPackages
Client package purchases and renewals.

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| id | UUID | ✓ | ✓ | Primary key |
| clientId | UUID | ✓ | | Foreign key to Client |
| packageId | UUID | ✓ | | Foreign key to Package |
| purchaseDate | DateTime | ✓ | | Date of purchase |
| expirationDate | DateTime | | | Expiration date |
| servicesRemaining | Int | ✓ | | Services left to use |
| totalServices | Int | ✓ | | Total services in package |
| autoRenew | Boolean | ✓ | | Auto-renewal flag (default: false) |
| isActive | Boolean | ✓ | | Soft delete flag (default: true) |
| createdAt | DateTime | ✓ | | Auto-set on creation |

**Indexes:**
- `clientId`
- `packageId`
- `isActive`

---

## Feature Tables

### GiftCards
Digital gift card management.

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| id | UUID | ✓ | ✓ | Primary key |
| salonId | UUID | ✓ | | Foreign key to Salon |
| code | String | ✓ | ✓ | Unique gift card code |
| initialAmount | Decimal | ✓ | | Initial balance |
| balance | Decimal | ✓ | | Current balance |
| status | String | ✓ | | "active" \| "redeemed" \| "expired" \| "cancelled" |
| expiresAt | DateTime | | | Expiration date |
| purchasedAt | DateTime | ✓ | | Purchase timestamp |
| redeemedAt | DateTime | | | Redemption timestamp |
| recipientEmail | String | | | Email of gift card recipient |
| recipientName | String | | | Name of gift card recipient |

**Indexes:**
- `salonId`
- `code` (unique)
- `status`

---

### Reviews
Client reviews and ratings.

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| id | UUID | ✓ | ✓ | Primary key |
| salonId | UUID | ✓ | | Foreign key to Salon |
| appointmentId | UUID | | | Foreign key to Appointment (optional) |
| clientId | UUID | ✓ | | Foreign key to Client |
| staffId | UUID | | | Foreign key to User (optional, staff reviewed) |
| rating | Int | ✓ | | 1-5 star rating |
| comment | String | | | Written review |
| isApproved | Boolean | ✓ | | Moderation flag (default: false) |
| submittedAt | DateTime | ✓ | | Submission timestamp |
| approvedAt | DateTime | | | Approval timestamp |

**Indexes:**
- `salonId`
- `appointmentId`
- `clientId`
- `staffId`
- `isApproved`

**Constraints:**
- rating must be 1-5

---

### ReviewResponses
Business responses to client reviews.

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| id | UUID | ✓ | ✓ | Primary key |
| reviewId | UUID | ✓ | | Foreign key to Review |
| responseText | String | ✓ | | Response text |
| respondedById | UUID | ✓ | | Foreign key to User (staff responding) |
| respondedAt | DateTime | ✓ | | Response timestamp |

**Indexes:**
- `reviewId`
- `respondedById`

**Constraints:**
- One response per review (enforced at application level)

---

### MarketingCampaigns
Email and SMS marketing campaigns.

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| id | UUID | ✓ | ✓ | Primary key |
| salonId | UUID | ✓ | | Foreign key to Salon |
| name | String | ✓ | | Campaign name |
| type | String | ✓ | | "email" \| "sms" |
| subjectLine | String | | | Email subject line |
| message | String | ✓ | | Campaign message |
| audienceFilter | JSON | ✓ | | Audience filtering criteria |
| sentAt | DateTime | | | Send timestamp |
| createdAt | DateTime | ✓ | | Auto-set on creation |

**Indexes:**
- `salonId`
- `sentAt`

---

### ConsultationForms
Customizable intake forms.

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| id | UUID | ✓ | ✓ | Primary key |
| salonId | UUID | ✓ | | Foreign key to Salon |
| name | String | ✓ | | Form name |
| fields | JSON | ✓ | | Array of form field definitions |
| isActive | Boolean | ✓ | | Soft delete flag (default: true) |
| createdAt | DateTime | ✓ | | Auto-set on creation |

**Indexes:**
- `salonId`
- `isActive`

---

### FormResponses
Client responses to consultation forms.

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| id | UUID | ✓ | ✓ | Primary key |
| formId | UUID | ✓ | | Foreign key to ConsultationForm |
| clientId | UUID | ✓ | | Foreign key to Client |
| appointmentId | UUID | | | Foreign key to Appointment (optional) |
| responseData | JSON | ✓ | | Form response data |
| submittedAt | DateTime | ✓ | | Submission timestamp |

**Indexes:**
- `formId`
- `clientId`
- `appointmentId`

---

## Relationships

### One-to-Many Relationships

```
Salon (1) → (Many) Users
Salon (1) → (Many) Clients
Salon (1) → (Many) Services
Salon (1) → (Many) Appointments
Salon (1) → (Many) Payments
Salon (1) → (Many) Locations
Salon (1) → (Many) Packages
Salon (1) → (Many) GiftCards
Salon (1) → (Many) Reviews
Salon (1) → (Many) MarketingCampaigns
Salon (1) → (Many) ConsultationForms

User (1) → (Many) Appointments (as staff)
User (1) → (Many) ClientNotes
User (1) → (Many) StaffLocations
User (1) → (Many) StaffAvailability
User (1) → (Many) TimeOff
User (1) → (Many) ReviewResponses

Client (1) → (Many) Appointments
Client (1) → (Many) ClientNotes
Client (1) → (Many) ClientPackages
Client (1) → (Many) Reviews
Client (1) → (Many) Payments
Client (1) → (Many) FormResponses

Service (1) → (Many) Appointments
Service (1) → (Many) ServiceStaff
Service (1) → (Many) PackageServices

Location (1) → (Many) Appointments
Location (1) → (Many) StaffLocations

Package (1) → (Many) PackageServices
Package (1) → (Many) ClientPackages

ConsultationForm (1) → (Many) FormResponses

Review (1) → (Many) ReviewResponses
```

### Many-to-Many Relationships (via junction tables)

```
User ↔ Location (via StaffLocation)
User ↔ Service (via ServiceStaff)
Package ↔ Service (via PackageService)
```

### Optional Relationships

```
Client.preferredStaffId → User? (nullable)
Client.preferredServiceId → Service? (nullable)
Appointment.locationId → Location? (nullable)
Payment.appointmentId → Appointment? (nullable)
Review.appointmentId → Appointment? (nullable)
Review.staffId → User? (nullable)
FormResponse.appointmentId → Appointment? (nullable)
ConsultationForm.fields → JSON (dynamic)
Package.renewalPrice → Decimal? (nullable)
Location.logoUrl → String? (nullable)
User.avatarUrl → String? (nullable)
User.phone → String? (nullable)
Client.email → String? (nullable)
Service.description → String? (nullable)
Appointment.cancellationReason → String? (nullable)
```

---

## Indexes

### Unique Indexes
- Salons: `email`
- Users: `(salonId, email)`
- Clients: `(salonId, phone)`
- StaffAvailability: `(staffId, dayOfWeek)`
- ServiceStaff: `(serviceId, staffId)`
- StaffLocation: `(staffId, locationId)`
- PackageServices: `(packageId, serviceId)`
- GiftCards: `code`

### Regular Indexes (for query performance)
- Salons: `isActive`
- Users: `salonId`, `email`, `role`, `isActive`
- Clients: `salonId`, `isActive`, `phone`
- Services: `salonId`, `isActive`, `category`
- Appointments: `salonId`, `locationId`, `clientId`, `staffId`, `serviceId`, `(startTime, endTime)`, `status`
- Payments: `salonId`, `appointmentId`, `clientId`, `status`, `stripeChargeId`
- Locations: `salonId`, `isActive`
- TimeOff: `staffId`, `(startDate, endDate)`
- Packages: `salonId`, `isActive`
- ClientPackages: `clientId`, `packageId`, `isActive`
- GiftCards: `salonId`, `status`
- Reviews: `salonId`, `appointmentId`, `clientId`, `staffId`, `isApproved`
- ReviewResponses: `reviewId`, `respondedById`
- MarketingCampaigns: `salonId`, `sentAt`
- ConsultationForms: `salonId`, `isActive`
- FormResponses: `formId`, `clientId`, `appointmentId`

---

## Enums

### Subscription Plans
- `base`: Base $50/month plan
- `pro`: Professional $100/month plan (future)
- `enterprise`: Enterprise plan (future)

### User Roles
- `admin`: Full system access
- `manager`: Operational management
- `staff`: Service provider with limited access
- `receptionist`: Scheduling and client management

### Appointment Status
- `confirmed`: Appointment confirmed
- `pending`: Awaiting confirmation
- `completed`: Service completed
- `no_show`: Client did not show up
- `cancelled`: Appointment cancelled

### Payment Methods
- `cash`: Cash payment
- `card`: Credit/debit card
- `online`: Online payment (Stripe)
- `check`: Check payment
- `other`: Other payment method

### Payment Status
- `pending`: Payment pending
- `completed`: Payment completed
- `failed`: Payment failed
- `refunded`: Payment refunded

### Communication Preference
- `email`: Email only
- `sms`: SMS only
- `both`: Email and SMS
- `none`: No communications

### Time Off Reason
- `vacation`: Vacation/PTO
- `sick`: Sick leave
- `meeting`: Work meeting
- `other`: Other reason

### Gift Card Status
- `active`: Active and available for use
- `redeemed`: Fully redeemed
- `expired`: Expired
- `cancelled`: Cancelled

### Marketing Campaign Type
- `email`: Email campaign
- `sms`: SMS campaign

### Package Type
- `one_time`: One-time purchase
- `recurring`: Recurring subscription

---

## Validation Rules

### General
- All UUID fields must be valid UUIDs
- All DateTime fields must be valid ISO 8601 timestamps
- All email fields must be valid email addresses
- All phone fields should follow E.164 format or similar standards

### Salons
- name: 1-255 characters
- email: valid email, unique globally
- phone: valid phone number
- zip: 1-10 characters
- timezone: valid IANA timezone string
- subscriptionPlan: one of enum values

### Users
- email: valid email, unique per salon
- passwordHash: minimum 60 characters (bcrypt format)
- firstName: 1-100 characters
- lastName: 1-100 characters
- phone: valid phone number (optional)
- role: one of enum values

### Clients
- firstName: 1-100 characters
- lastName: 1-100 characters
- phone: valid phone number, unique per salon
- email: valid email (optional)
- birthday: must be reasonable date (not future)
- communicationPreference: one of enum values

### Services
- name: 1-255 characters
- durationMinutes: 1-1440 (1 minute to 24 hours)
- price: 0.00-99999.99
- color: valid hex color code

### Appointments
- durationMinutes: > 0
- price: >= 0
- startTime: must be before endTime
- startTime: cannot be in the past
- status: one of enum values

### Payments
- amount: >= 0
- amountPaid: >= 0
- tipAmount: >= 0
- method: one of enum values
- status: one of enum values
- If method is "card" or "online", stripeChargeId must be present

### Packages
- price: > 0
- durationDays: > 0 (if recurring)
- renewalPrice: > 0 (if recurring)

### Reviews
- rating: 1-5 (inclusive)

### Time Off
- startDate: must be before or equal to endDate
- reason: one of enum values

---

## Data Type Mapping

### UUID
All primary keys and most foreign keys use UUID (Universally Unique Identifier).
- Format: `f47ac10b-58cc-4372-a567-0e02b2c3d479`
- Implementation: PostgreSQL native UUID type

### DateTime
All timestamp fields use DateTime (ISO 8601).
- Format: `2024-01-15T14:30:00.000Z`
- Stored as: PostgreSQL TIMESTAMP WITH TIME ZONE
- Auto-managed: `createdAt` (default: now()), `updatedAt` (auto-update)

### Decimal
Financial fields use Decimal for precision.
- Fields: `price`, `amount`, `tipAmount`, etc.
- Precision: 10 digits total, 2 decimal places (0-99999.99)

### JSON
Complex data stored as JSON objects/arrays.
- Fields: `featuresEnabled`, `hours`, `audienceFilter`, `fields`, `responseData`
- Validated at application level

### String
Text fields with varying lengths.
- Most are TEXT type (unlimited in PostgreSQL)
- Some have implied max lengths in comments

### Boolean
Binary flags.
- Soft delete flags: `isActive` (default: true)
- Feature flags: various (default: false)

### Int
Integer fields for counts and enumerations.
- Day of week: 0-6
- Quantity: >= 0
- Ratings: 1-5
- Minutes: > 0

---

## Cascading Deletes

Cascading deletes are configured for the following relationships:

```
Salon → Users (delete users when salon deleted)
Salon → Clients (delete clients when salon deleted)
Salon → Services (delete services when salon deleted)
Salon → Appointments (delete appointments when salon deleted)
Salon → Payments (delete payments when salon deleted)
Salon → Locations (delete locations when salon deleted)
Salon → Packages (delete packages when salon deleted)
Salon → GiftCards (delete gift cards when salon deleted)
Salon → Reviews (delete reviews when salon deleted)
Salon → MarketingCampaigns (delete campaigns when salon deleted)
Salon → ConsultationForms (delete forms when salon deleted)

User → Appointments (delete appointments when staff deleted)
User → ClientNotes (cascade)
User → StaffLocations (cascade)
User → StaffAvailability (cascade)
User → TimeOff (cascade)
User → ReviewResponses (cascade)

Client → Appointments (cascade)
Client → ClientNotes (cascade)
Client → ClientPackages (cascade)
Client → Reviews (cascade)
Client → Payments (cascade)
Client → FormResponses (cascade)

Service → Appointments (cascade)
Service → ServiceStaff (cascade)
Service → PackageServices (cascade)

Location → Appointments (cascade)
Location → StaffLocations (cascade)

Package → PackageServices (cascade)
Package → ClientPackages (cascade)

ConsultationForm → FormResponses (cascade)

Review → ReviewResponses (cascade)
```

---

## Notes

- All timestamps are stored in UTC and returned in ISO 8601 format
- Soft deletes use `isActive` boolean flag rather than hard deletes for audit trail
- Foreign key constraints ensure referential integrity
- Indexes are optimized for typical query patterns (filtering, sorting, joining)
- JSON fields are flexible for evolving data needs (features, form fields, etc.)
- All user passwords are hashed with bcrypt before storage
- Stripe integration uses `stripeChargeId` for idempotency and reconciliation

---

End of Schema Documentation
