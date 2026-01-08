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

**Phase 2 of 10**

| Phase | Name | Status |
|-------|------|--------|
| 1 | Project Setup & Architecture | ✅ Complete |
| 2 | Database Schema & Models | 🔄 In Progress |
| 3 | Authentication & Multi-tenancy | ⏳ Pending |
| 4 | Core API Routes | ⏳ Pending |
| 5 | Client Management | ⏳ Pending |
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

---

## Database Schema

### Core Tables

```
organizations
├── id                  UUID PRIMARY KEY
├── name                VARCHAR(255) NOT NULL
├── slug                VARCHAR(100) UNIQUE
├── owner_id            UUID → users.id
├── plan                ENUM(free, starter, pro, enterprise)
├── stripe_customer_id  VARCHAR(255)
├── settings            JSONB
├── created_at          TIMESTAMP
├── updated_at          TIMESTAMP

users
├── id                  UUID PRIMARY KEY
├── organization_id     UUID → organizations.id [REQUIRED]
├── email               VARCHAR(255) UNIQUE
├── password_hash       VARCHAR(255)
├── name                VARCHAR(255)
├── role                ENUM(owner, admin, staff)
├── created_at          TIMESTAMP
├── updated_at          TIMESTAMP
@@index([organization_id])

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

### Multi-Tenancy Rules

1. **Every table** (except `organizations`) has `organization_id`
2. **Every query** must filter by `organization_id`
3. **Middleware** extracts `org_id` from JWT and attaches to request
4. **Row-Level Security**: Salon A can NEVER see Salon B's data

---

## API Routes

```
To be documented as we build.

Planned route groups:
- /api/auth/*
- /api/organizations/*
- /api/clients/*
- /api/appointments/*
- /api/services/*
- /api/staff/*
- /api/products/*
- /api/transactions/*
- /api/reports/*
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

- Dashboard Preview: `spa-dashboard/` (run with `npm run dev`)
- Design System: `spa-software/docs/DESIGN_SYSTEM.md`
- Web Dev Team: `web-dev-team/README.md`
