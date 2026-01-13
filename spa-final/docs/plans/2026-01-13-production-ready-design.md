# Peacase Production-Ready Design

**Date:** 2026-01-13
**Status:** Approved

## Overview

This document captures the complete design for making Peacase production-ready, including frontend-backend integration, email marketing, embeddable widgets, help documentation, and deployment infrastructure.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  Vercel (Next.js 14)                                        │
│  ├── /app/* (Dashboard, Calendar, Clients, etc.)           │
│  ├── /embed/* (Public widgets for salon websites)          │
│  └── /help/* (Documentation & tutorials)                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         API                                  │
│  Railway (Express + Prisma)                                 │
│  ├── /api/v1/auth/* (JWT auth)                             │
│  ├── /api/v1/clients, services, appointments, etc.         │
│  ├── /api/v1/marketing/* (SendGrid integration)            │
│  └── /api/v1/public/* (Widget endpoints)                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       DATABASE                               │
│  Railway PostgreSQL                                         │
│  └── Prisma ORM with migrations                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
│  ├── SendGrid (Email marketing + transactional)            │
│  └── Stripe (Payments for subscriptions & gift cards)      │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend-Backend Integration

### API Client (`apps/web/src/lib/api.ts`)
- Axios-based client with base URL from environment
- Request interceptor adds JWT token from localStorage
- Response interceptor handles 401s with automatic token refresh
- Retry logic before forcing logout

### Auth Context (`apps/web/src/contexts/AuthContext.tsx`)
- Stores user, salon, and tokens in state
- Persists to localStorage for session recovery
- Provides login(), logout(), refreshToken() methods
- Wraps entire app via AuthProvider in layout

### Data Hooks
Each hook follows the same pattern:
- `useClients()` - fetch, create, update, delete clients
- `useServices()` - CRUD for services with categories
- `useAppointments()` - CRUD with calendar integration
- `useStaff()` - CRUD for staff members

All hooks use React Query for caching, background refresh, and optimistic updates.

---

## 3. Gift Card Customer Flow

### Purchase Flow
1. Customer visits salon's embedded gift card widget or public page
2. Selects gift card amount (preset or custom)
3. Enters recipient's email and optional message
4. Enters their own email (for receipt)
5. Completes payment via Stripe
6. System generates unique gift card code

### Email Delivery
- **To Recipient:** Beautiful HTML email with gift card code, amount, sender's message, and redemption instructions
- **To Purchaser:** Receipt confirmation with gift card details

### Redemption Flow
1. Recipient visits salon or books online
2. Enters gift card code at checkout
3. System validates code and available balance
4. Balance deducted, remaining balance shown if partial use

### Database Schema Additions
```prisma
model GiftCard {
  id            String   @id @default(cuid())
  salonId       String
  code          String   @unique
  amount        Decimal
  balance       Decimal
  purchaserEmail String
  recipientEmail String
  recipientName  String?
  message       String?
  purchasedAt   DateTime @default(now())
  expiresAt     DateTime?
  redeemedAt    DateTime?
  status        GiftCardStatus @default(ACTIVE)
}
```

---

## 4. Embeddable Widgets

### Widget Types

**1. Booking Widget**
- Full appointment booking flow
- Shows available services, staff, time slots
- Collects customer info and confirms booking

**2. Gift Card Widget**
- Purchase gift cards for others
- Custom amounts or presets
- Stripe checkout integration

**3. Reviews Widget**
- Display salon reviews
- Optional: Allow review submission

**4. Book Now Button**
- Simple CTA button
- Links to full booking page or opens modal

### Embed Code Format
Salon owners copy-paste this into their website:

```html
<!-- Peacase Booking Widget -->
<div id="peacase-booking" data-salon="salon-slug"></div>
<script src="https://peacase.com/embed.js"></script>
```

### Technical Implementation

**Public Routes (no auth required):**
- `GET /api/v1/public/:salonSlug/services` - Available services
- `GET /api/v1/public/:salonSlug/availability` - Open time slots
- `POST /api/v1/public/:salonSlug/book` - Create appointment
- `POST /api/v1/public/:salonSlug/gift-cards` - Purchase gift card

**Widget Pages:**
- `/embed/[salon]/book` - Booking iframe
- `/embed/[salon]/gift-cards` - Gift card purchase iframe
- `/embed/[salon]/reviews` - Reviews display iframe

**embed.js Script:**
- Detects widget containers by ID
- Creates iframes pointing to appropriate /embed pages
- Handles postMessage communication for height adjustment
- Provides callback hooks for booking completion

---

## 5. Email Marketing with SendGrid

### Integration Architecture
```
Marketing Page → API → SendGrid
     │
     ├── Campaign Management (CRUD)
     ├── Audience Segments (from clients)
     ├── Template Selection
     └── Send/Schedule
```

### Email Templates (10 Total)
1. **Welcome Email** - New client registration
2. **Appointment Confirmation** - Booking confirmed
3. **Appointment Reminder** - 24h before
4. **Gift Card Delivery** - To recipient
5. **Gift Card Receipt** - To purchaser
6. **Review Request** - Post-appointment
7. **Birthday Offer** - Client birthdays
8. **Re-engagement** - Inactive clients
9. **Promotional Campaign** - Custom marketing
10. **Password Reset** - Account recovery

### SendGrid Configuration
- Dynamic templates stored in SendGrid
- Template IDs stored in environment variables
- Personalization via Handlebars syntax
- Unsubscribe links in all marketing emails

### API Endpoints
- `POST /api/v1/marketing/campaigns` - Create campaign
- `GET /api/v1/marketing/campaigns` - List campaigns
- `POST /api/v1/marketing/campaigns/:id/send` - Send campaign
- `POST /api/v1/marketing/campaigns/:id/schedule` - Schedule send
- `GET /api/v1/marketing/analytics` - Open/click rates

---

## 6. Help Center & Documentation

### Structure
```
/help
├── /getting-started     - Initial setup guide
├── /calendar           - Appointment management
├── /clients            - Client management
├── /services           - Service configuration
├── /staff              - Team management
├── /marketing          - Email campaigns
├── /gift-cards         - Gift card system
├── /packages           - Package deals
├── /reviews            - Review management
├── /settings           - Account settings
├── /integrations       - Widget embed guides
└── /billing            - Subscription & payments
```

### Content Format
- Written documentation (Markdown rendered as pages)
- Step-by-step instructions with screenshots
- Contextual help icons linking to relevant docs
- Search functionality across all help content

### Implementation
- Static pages in `/app/help/[...slug]/page.tsx`
- MDX for rich content with components
- Table of contents auto-generated
- "Was this helpful?" feedback at bottom

---

## 7. Deployment & Production Readiness

### Infrastructure

**Vercel (Frontend)**
- Next.js 14 with App Router
- Environment variables for API URL
- Preview deployments for PRs
- Production domain: peacase.com

**Railway (Backend)**
- Express API server
- PostgreSQL database
- Auto-deploy from main branch
- Production domain: api.peacase.com

### Environment Variables

**Frontend (.env.production)**
```
NEXT_PUBLIC_API_URL=https://api.peacase.com
NEXT_PUBLIC_STRIPE_KEY=pk_live_xxx
```

**Backend (.env.production)**
```
DATABASE_URL=postgresql://...
JWT_SECRET=<secure-random>
JWT_REFRESH_SECRET=<secure-random>
SENDGRID_API_KEY=SG.xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### Database Migration
1. Export SQLite data
2. Transform to PostgreSQL format
3. Run Prisma migrations on Railway
4. Import transformed data
5. Verify data integrity

### Pre-Launch Checklist
- [ ] All pages connected to real API
- [ ] Authentication flow working
- [ ] Email sending verified
- [ ] Stripe webhooks configured
- [ ] SSL certificates active
- [ ] Error monitoring (Sentry) configured
- [ ] Database backups scheduled
- [ ] Rate limiting enabled
- [ ] CORS properly configured

---

## Implementation Priority

### Phase 1: Core Integration
1. Connect all existing pages to API
2. Implement loading states and error handling
3. Test authentication flow end-to-end

### Phase 2: Email & Widgets
4. SendGrid integration
5. Email templates
6. Public widget endpoints
7. Embeddable widget pages

### Phase 3: Documentation
8. Help center pages
9. Integration guides

### Phase 4: Deployment
10. Database migration to PostgreSQL
11. Vercel deployment
12. Railway deployment
13. Domain configuration
14. Final testing
