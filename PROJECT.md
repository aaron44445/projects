# PROJECT: Multi-Tenant SaaS Spa Management App

> Master tracker for the spa management SaaS application.

---

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | React + TypeScript | Vite, Tailwind CSS |
| Backend | Node.js | Express or Fastify (TBD) |
| Database | PostgreSQL | Prisma ORM |
| Authentication | JWT | Custom implementation |
| Hosting | TBD | |
| File Storage | TBD | |
| Payments | Stripe | For subscriptions & transactions |

---

## Current Phase

**Phase 5 of 10**

| Phase | Name | Status |
|-------|------|--------|
| 1 | Project Setup & Architecture | ✅ Complete |
| 2 | Database Schema & Models | ✅ Complete |
| 3 | Authentication & Multi-tenancy | ✅ Complete |
| 4 | Core API Routes | ✅ Complete |
| 5 | Client Management | 🔄 In Progress |
| 6 | Appointment Booking | ⏳ Pending |
| 7 | Services & Staff | ⏳ Pending |
| 8 | Products & Inventory | ⏳ Pending |
| 9 | Reports & Analytics | ⏳ Pending |
| 10 | Deployment & Launch | ⏳ Pending |

---

## Completed

### Phase 1: Project Setup & Architecture
- [x] Multi-tenant architecture designed
- [x] Organization-based data isolation strategy
- [x] Database schema planned with `organization_id` on all tables
- [x] Dashboard UI preview created (`spa-dashboard/`)
- [x] Design system documented

### Phase 2: Database Schema & Models
- [x] Created `spa-api/` Express + TypeScript project
- [x] Full Prisma schema with 14 models
- [x] Multi-tenant tables with `organization_id` foreign keys
- [x] Proper indexes for performance
- [x] Enums for roles, statuses, payment methods
- [x] Configured TypeScript, ESLint, environment variables

### Phase 3: Authentication & Multi-tenancy
- [x] JWT authentication (access + refresh tokens)
- [x] User registration with organization creation
- [x] Login/logout with refresh token rotation
- [x] Email verification flow (stub emails for dev)
- [x] Password reset flow
- [x] Team invitations (create, accept, delete, list)
- [x] Role-based middleware (OWNER, MANAGER, STAFF)
- [x] Auth middleware extracts user from JWT
- [x] Global error handler with typed errors
- [x] Zod validation schemas

### Phase 4: Core API Routes
- [x] Clients CRUD (list, get, create, update, delete)
- [x] Services CRUD with role-based permissions
- [x] Staff CRUD with service linking
- [x] Appointments CRUD with overlap detection
- [x] Products CRUD with quantity adjustment
- [x] Transactions with daily summary
- [x] Pagination on all list endpoints
- [x] Query filters (date range, status, etc.)

---

## Database Schema

> **Location**: `spa-api/prisma/schema.prisma`

### Core Tables

```
organizations
├── id                  CUID PRIMARY KEY
├── name                VARCHAR NOT NULL
├── slug                VARCHAR UNIQUE
├── owner_id            CUID → users.id
├── plan                ENUM(FREE, STARTER, PRO, ENTERPRISE)
├── stripe_customer_id  VARCHAR
├── settings            JSON
├── created_at          TIMESTAMP
├── updated_at          TIMESTAMP

users
├── id                  CUID PRIMARY KEY
├── organization_id     CUID → organizations.id [REQUIRED]
├── email               VARCHAR UNIQUE
├── password_hash       VARCHAR
├── name                VARCHAR
├── role                ENUM(OWNER, MANAGER, STAFF)
├── email_verified_at   TIMESTAMP
├── is_active           BOOLEAN
├── created_at          TIMESTAMP
├── updated_at          TIMESTAMP
@@index([organization_id])
@@index([email])

clients
├── id                  UUID PRIMARY KEY
├── organization_id     UUID → organizations.id [REQUIRED]
├── name                VARCHAR(255)
├── email               VARCHAR(255)
├── phone               VARCHAR(50)
├── notes               TEXT
├── created_at          TIMESTAMP
├── updated_at          TIMESTAMP
@@index([organization_id])

services
├── id                  UUID PRIMARY KEY
├── organization_id     UUID → organizations.id [REQUIRED]
├── name                VARCHAR(255)
├── description         TEXT
├── duration_minutes    INT
├── price               DECIMAL(10,2)
├── is_active           BOOLEAN DEFAULT true
├── created_at          TIMESTAMP
├── updated_at          TIMESTAMP
@@index([organization_id])

staff
├── id                  UUID PRIMARY KEY
├── organization_id     UUID → organizations.id [REQUIRED]
├── user_id             UUID → users.id
├── name                VARCHAR(255)
├── role                VARCHAR(100)
├── services            UUID[] (services they can perform)
├── is_active           BOOLEAN DEFAULT true
├── created_at          TIMESTAMP
├── updated_at          TIMESTAMP
@@index([organization_id])

appointments
├── id                  UUID PRIMARY KEY
├── organization_id     UUID → organizations.id [REQUIRED]
├── client_id           UUID → clients.id
├── staff_id            UUID → staff.id
├── service_id          UUID → services.id
├── start_time          TIMESTAMP
├── end_time            TIMESTAMP
├── status              ENUM(pending, confirmed, completed, cancelled, no_show)
├── notes               TEXT
├── created_at          TIMESTAMP
├── updated_at          TIMESTAMP
@@index([organization_id])
@@index([organization_id, start_time])

products
├── id                  UUID PRIMARY KEY
├── organization_id     UUID → organizations.id [REQUIRED]
├── name                VARCHAR(255)
├── description         TEXT
├── sku                 VARCHAR(100)
├── price               DECIMAL(10,2)
├── cost                DECIMAL(10,2)
├── quantity            INT DEFAULT 0
├── reorder_level       INT DEFAULT 10
├── is_active           BOOLEAN DEFAULT true
├── created_at          TIMESTAMP
├── updated_at          TIMESTAMP
@@index([organization_id])

transactions
├── id                  UUID PRIMARY KEY
├── organization_id     UUID → organizations.id [REQUIRED]
├── client_id           UUID → clients.id
├── appointment_id      UUID → appointments.id (nullable)
├── type                ENUM(service, product, refund)
├── items               JSONB
├── subtotal            DECIMAL(10,2)
├── tax                 DECIMAL(10,2)
├── total               DECIMAL(10,2)
├── payment_method      ENUM(cash, card, other)
├── status              ENUM(pending, completed, refunded)
├── created_at          TIMESTAMP
@@index([organization_id])
@@index([organization_id, created_at])
```

### Auth Tables

```
email_verifications
├── id                  CUID PRIMARY KEY
├── token               VARCHAR UNIQUE
├── user_id             CUID
├── organization_id     CUID → organizations.id
├── expires_at          TIMESTAMP
├── created_at          TIMESTAMP
@@index([token])

password_resets
├── id                  CUID PRIMARY KEY
├── token               VARCHAR UNIQUE
├── user_id             CUID
├── organization_id     CUID → organizations.id
├── expires_at          TIMESTAMP
├── used_at             TIMESTAMP
├── created_at          TIMESTAMP
@@index([token])

invitations
├── id                  CUID PRIMARY KEY
├── email               VARCHAR
├── role                ENUM(OWNER, MANAGER, STAFF)
├── token               VARCHAR UNIQUE
├── organization_id     CUID → organizations.id
├── invited_by_id       CUID → users.id
├── expires_at          TIMESTAMP
├── accepted_at         TIMESTAMP
├── created_at          TIMESTAMP
@@index([token])
@@index([organization_id])

refresh_tokens
├── id                  CUID PRIMARY KEY
├── token               VARCHAR UNIQUE
├── user_id             CUID → users.id
├── expires_at          TIMESTAMP
├── created_at          TIMESTAMP
@@index([token])
@@index([user_id])

staff_services (join table)
├── id                  CUID PRIMARY KEY
├── staff_id            CUID → staff.id
├── service_id          CUID → services.id
├── created_at          TIMESTAMP
@@unique([staff_id, service_id])
```

### Multi-Tenancy Rules

1. **Every table** (except `organizations`) has `organization_id`
2. **Every query** must filter by `organization_id`
3. **Middleware** extracts `org_id` from JWT and attaches to request
4. **Row-Level Security**: Salon A can NEVER see Salon B's data

---

## API Routes

> **Location**: `spa-api/src/routes/`

### Implemented Routes

```
GET  /api/health                    Health check

# Authentication (public)
POST /api/auth/register             Create account + organization
POST /api/auth/login                Login, get tokens
POST /api/auth/refresh              Refresh access token
POST /api/auth/logout               Revoke refresh token
POST /api/auth/verify-email         Verify email with token
POST /api/auth/forgot-password      Request password reset
POST /api/auth/reset-password       Reset password with token
GET  /api/auth/me                   Get current user (protected)

# Invitations
POST   /api/invitations             Create invitation (OWNER, MANAGER)
GET    /api/invitations             List org invitations (OWNER, MANAGER)
DELETE /api/invitations/:id         Cancel invitation (OWNER, MANAGER)
GET    /api/invitations/:token      Get invitation details (public)
POST   /api/invitations/accept      Accept invitation (public)

# Clients (all authenticated)
GET    /api/clients                 List with pagination
POST   /api/clients                 Create client
GET    /api/clients/:id             Get with appointments/transactions
PUT    /api/clients/:id             Update client
DELETE /api/clients/:id             Delete client

# Services (write: MANAGER+)
GET    /api/services                List with pagination, ?active=true
POST   /api/services                Create service
GET    /api/services/:id            Get with staff
PUT    /api/services/:id            Update service
DELETE /api/services/:id            Delete service

# Staff (write: MANAGER+)
GET    /api/staff                   List with pagination, ?active=true
POST   /api/staff                   Create with serviceIds
GET    /api/staff/:id               Get with services, appointments
PUT    /api/staff/:id               Update with serviceIds
DELETE /api/staff/:id               Delete staff

# Appointments (all authenticated)
GET    /api/appointments            List with filters (staffId, clientId, status, dates)
POST   /api/appointments            Create with overlap detection
GET    /api/appointments/:id        Get with relations
PUT    /api/appointments/:id        Update, recalculates endTime
PATCH  /api/appointments/:id/status Update status only
DELETE /api/appointments/:id        Delete appointment

# Products (write: MANAGER+)
GET    /api/products                List, ?active=true, ?lowStock=true
POST   /api/products                Create product
GET    /api/products/:id            Get product
PUT    /api/products/:id            Update product
DELETE /api/products/:id            Delete product
PATCH  /api/products/:id/quantity   Adjust inventory

# Transactions (all authenticated)
GET    /api/transactions            List with filters (clientId, type, status, dates)
POST   /api/transactions            Create, auto-adjust inventory
GET    /api/transactions/:id        Get with relations
GET    /api/transactions/summary    Daily summary by type/payment method
```

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/spa_saas

# Authentication
JWT_ACCESS_SECRET=your-access-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NODE_ENV=development
PORT=3001
```

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-08 | PostgreSQL + Prisma | Relational data, strong typing, easy migrations |
| 2026-01-08 | organization_id on all tables | Simple multi-tenancy, easy to query, performant |
| 2026-01-08 | JWT for auth | Stateless, works well with multi-tenant |
| 2026-01-08 | Stripe for payments | Industry standard, handles subscriptions + POS |

---

## Quick Links

- **API Server**: `spa-api/` (run with `npm run dev`)
- **Dashboard Preview**: `spa-dashboard/` (run with `npm run dev`)
- **Design System**: `spa-software/docs/DESIGN_SYSTEM.md`
- **Web Dev Team**: `web-dev-team/README.md`

---

## Project Structure

```
projects/
├── spa-api/                    # Backend API (Express + Prisma)
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   ├── src/
│   │   ├── config/             # Environment config
│   │   ├── controllers/        # Route handlers
│   │   ├── lib/                # Core utilities (jwt, password, email)
│   │   ├── middleware/         # Auth, roles, error handling
│   │   ├── routes/             # API route definitions
│   │   ├── schemas/            # Zod validation
│   │   ├── types/              # TypeScript types
│   │   ├── utils/              # Helper functions
│   │   └── index.ts            # App entry point
│   └── package.json
├── spa-dashboard/              # Frontend (React + Vite)
├── spa-software/               # Design assets
└── PROJECT.md                  # This file
```
