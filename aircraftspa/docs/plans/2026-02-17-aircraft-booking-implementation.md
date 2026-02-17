# Aircraft Booking Platform — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a multi-tenant SaaS booking platform for aircraft cleaning businesses, starting with AircraftSpa as the first customer.

**Architecture:** pnpm monorepo with Next.js 14 frontend, Express.js API, Prisma + PostgreSQL. Subdomain-based multi-tenancy with row-level isolation. Stripe Connect for payments. Better Auth for authentication.

**Tech Stack:** Next.js 14, React 18, TailwindCSS, shadcn/ui, Zustand, React Query, Express.js, Prisma 5, PostgreSQL, Better Auth, Stripe Connect, Sendr, Twilio, Cloudinary

**Design Doc:** `docs/plans/2026-02-17-aircraft-booking-platform-design.md`

---

## Phase 1: Project Foundation

### Task 1.1: Initialize Monorepo

**Files:**
- Create: `package.json` (root)
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.gitignore`
- Create: `.nvmrc`
- Create: `.env.example`

**Step 1: Initialize root package.json**

```json
{
  "name": "aircraftspa-platform",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "test": "turbo test",
    "db:push": "pnpm --filter database db:push",
    "db:seed": "pnpm --filter database db:seed",
    "db:studio": "pnpm --filter database db:studio"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  },
  "packageManager": "pnpm@9.0.0",
  "engines": {
    "node": ">=20.0.0"
  }
}
```

**Step 2: Create pnpm-workspace.yaml**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**Step 3: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {}
  }
}
```

**Step 4: Create .gitignore**

Standard Node/Next.js gitignore. Include: `node_modules/`, `.next/`, `dist/`, `.env`, `.env.local`, `.turbo/`, `*.tsbuildinfo`.

**Step 5: Create .nvmrc**

```
20
```

**Step 6: Create .env.example**

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/aircraftspa

# Auth
BETTER_AUTH_SECRET=your-secret-here
BETTER_AUTH_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PLATFORM_FEE_PERCENT=1

# Sendr
SENDR_API_KEY=your-key
SENDR_FROM_EMAIL=noreply@aircraftspa.com

# Twilio
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret

# App
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_DOMAIN=localhost:3000
```

**Step 7: Install root dependencies**

Run: `pnpm install`

**Step 8: Commit**

```bash
git add -A
git commit -m "chore: initialize monorepo with pnpm + turbo"
```

---

### Task 1.2: Create Database Package

**Files:**
- Create: `packages/database/package.json`
- Create: `packages/database/tsconfig.json`
- Create: `packages/database/prisma/schema.prisma` (minimal — just datasource + generator)
- Create: `packages/database/src/index.ts` (Prisma client export)

**Step 1: Create packages/database/package.json**

```json
{
  "name": "@aircraftspa/database",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "db:migrate": "prisma migrate dev"
  },
  "dependencies": {
    "@prisma/client": "^5.20.0"
  },
  "devDependencies": {
    "prisma": "^5.20.0",
    "tsx": "^4.7.0",
    "typescript": "^5.4.0"
  }
}
```

**Step 2: Create minimal Prisma schema**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Step 3: Create Prisma client export**

File: `packages/database/src/index.ts`

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export * from "@prisma/client";
```

**Step 4: Install and generate**

Run: `cd packages/database && pnpm install && pnpm db:generate`

**Step 5: Commit**

```bash
git add packages/database/
git commit -m "chore: add database package with Prisma"
```

---

### Task 1.3: Create Shared Types Package

**Files:**
- Create: `packages/types/package.json`
- Create: `packages/types/tsconfig.json`
- Create: `packages/types/src/index.ts`

**Step 1: Create packages/types/package.json**

```json
{
  "name": "@aircraftspa/types",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```

**Step 2: Create initial types file**

File: `packages/types/src/index.ts`

```typescript
// Enums
export const AIRCRAFT_CLASSES = [
  "single_engine",
  "twin_engine",
  "turboprop",
  "light_jet",
  "midsize_jet",
  "heavy_jet",
  "helicopter",
] as const;

export type AircraftClass = (typeof AIRCRAFT_CLASSES)[number];

export const SERVICE_TYPES = ["interior", "exterior", "full_detail"] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const USER_ROLES = ["owner", "admin", "manager", "technician"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const LOCATION_TYPES = ["hangar", "ramp"] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

**Step 3: Commit**

```bash
git add packages/types/
git commit -m "chore: add shared types package"
```

---

### Task 1.4: Scaffold Next.js Frontend

**Files:**
- Create: `apps/web/` (Next.js 14 app with App Router)

**Step 1: Create Next.js app**

Run: `cd apps && pnpm create next-app web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack`

**Step 2: Install frontend dependencies**

Run inside `apps/web`:
```bash
pnpm add @tanstack/react-query zustand @aircraftspa/types @aircraftspa/database
pnpm add -D @types/node
```

**Step 3: Install and configure shadcn/ui**

Run: `cd apps/web && npx shadcn@latest init`
Choose: New York style, Zinc base color, CSS variables.

**Step 4: Add commonly needed shadcn components**

Run: `npx shadcn@latest add button card input label select dialog sheet tabs badge separator toast calendar popover command`

**Step 5: Create route group directories**

```
apps/web/src/app/(booking)/     — public customer booking
apps/web/src/app/(dashboard)/   — admin dashboard (auth required)
apps/web/src/app/(tech)/        — technician mobile view (auth required)
```

Create a `layout.tsx` and placeholder `page.tsx` in each.

**Step 6: Commit**

```bash
git add apps/web/
git commit -m "chore: scaffold Next.js frontend with shadcn/ui"
```

---

### Task 1.5: Scaffold Express API

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/index.ts`
- Create: `apps/api/src/routes/health.ts`
- Create: `apps/api/src/middleware/errorHandler.ts`
- Create: `apps/api/src/middleware/cors.ts`

**Step 1: Create apps/api/package.json**

```json
{
  "name": "@aircraftspa/api",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest"
  },
  "dependencies": {
    "@aircraftspa/database": "workspace:*",
    "@aircraftspa/types": "workspace:*",
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "zod": "^3.23.0",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/cors": "^2.8.0",
    "tsx": "^4.7.0",
    "typescript": "^5.4.0",
    "vitest": "^1.6.0"
  }
}
```

**Step 2: Create Express server entry point**

File: `apps/api/src/index.ts`

```typescript
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { healthRouter } from "./routes/health";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000", credentials: true }));
app.use(express.json());

// Routes
app.use("/api/health", healthRouter);

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

export default app;
```

**Step 3: Create health route**

File: `apps/api/src/routes/health.ts`

```typescript
import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
```

**Step 4: Create error handler middleware**

File: `apps/api/src/middleware/errorHandler.ts`

```typescript
import { Request, Response, NextFunction } from "express";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error(err.stack);
  res.status(500).json({ success: false, error: "Internal server error" });
}
```

**Step 5: Install deps and verify it starts**

Run: `cd apps/api && pnpm install && pnpm dev`
Expected: "API server running on port 4000"
Verify: `curl http://localhost:4000/api/health` returns `{"status":"ok"}`

**Step 6: Commit**

```bash
git add apps/api/
git commit -m "chore: scaffold Express API server"
```

---

### Task 1.6: Create Shared UI Package

**Files:**
- Create: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/src/index.ts`

**Step 1: Create package.json**

Minimal shared UI component library. Components will be added as needed.

```json
{
  "name": "@aircraftspa/ui",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "typescript": "^5.4.0"
  }
}
```

**Step 2: Create index export**

File: `packages/ui/src/index.ts`
```typescript
// Shared UI components will be exported here
export {};
```

**Step 3: Commit**

```bash
git add packages/ui/
git commit -m "chore: add shared UI package"
```

---

## Phase 2: Database Schema

### Task 2.1: Define Core Prisma Schema — Tenant & Auth Models

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

**Step 1: Add Business, User, and Customer models**

```prisma
model Business {
  id          String   @id @default(cuid())
  name        String
  subdomain   String   @unique
  email       String
  phone       String?
  logo        String?
  timezone    String   @default("America/New_York")
  currency    String   @default("USD")

  // Stripe Connect
  stripeAccountId   String?
  stripeOnboarded   Boolean @default(false)
  platformFeePercent Float  @default(1.0)

  // Settings (JSON blob for flexible config)
  bookingSettings    Json?  // cancellation window, deposit %, operating hours
  notificationSettings Json? // templates, timing

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  users        User[]
  customers    Customer[]
  services     Service[]
  addOns       AddOn[]
  serviceAreas ServiceArea[]
  bookings     Booking[]
  pricingRules PricingRule[]
  crewSchedules CrewSchedule[]
  checklistTemplates ChecklistTemplate[]
  notificationLogs NotificationLog[]
}

model User {
  id         String   @id @default(cuid())
  businessId String
  email      String
  name       String
  phone      String?
  role       String   @default("technician") // owner, admin, manager, technician
  active     Boolean  @default(true)

  // Better Auth fields
  emailVerified Boolean @default(false)
  image         String?

  // Technician-specific
  homeBaseAirportId String?
  skills            String[] @default([])

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  business       Business @relation(fields: [businessId], references: [id])
  homeBaseAirport Airport? @relation(fields: [homeBaseAirportId], references: [id])
  crewSchedules  CrewSchedule[]
  assignedBookings Booking[] @relation("AssignedTechnician")
  sessions       Session[]
  accounts       Account[]

  @@unique([businessId, email])
  @@index([businessId])
}

model Customer {
  id         String   @id @default(cuid())
  businessId String
  email      String
  name       String
  phone      String?
  notes      String?
  tags       String[] @default([])

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  business Business  @relation(fields: [businessId], references: [id])
  bookings Booking[]

  @@unique([businessId, email])
  @@index([businessId])
}

// Better Auth session/account tables
model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  accountId         String
  providerId        String
  accessToken       String?
  refreshToken      String?
  accessTokenExpiresAt DateTime?
  refreshTokenExpiresAt DateTime?
  scope             String?
  idToken           String?
  password          String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Verification {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

**Step 2: Run prisma format to validate**

Run: `cd packages/database && npx prisma format`
Expected: No errors

**Step 3: Commit**

```bash
git add packages/database/prisma/schema.prisma
git commit -m "feat: add tenant, user, and customer models to schema"
```

---

### Task 2.2: Define Schema — Aircraft, Services, and Pricing Models

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

**Step 1: Add AircraftClass, Service, AddOn, and PricingRule models**

```prisma
model AircraftClass {
  id             String  @id @default(cuid())
  name           String  @unique // single_engine, twin_engine, etc.
  displayName    String  // "Single Engine", "Twin Engine", etc.
  sizeMultiplier Float   @default(1.0) // pricing multiplier
  sortOrder      Int     @default(0)
  icon           String? // icon identifier for UI

  pricingRules PricingRule[]
  bookings     Booking[]
}

model Service {
  id          String  @id @default(cuid())
  businessId  String
  name        String  // "Interior Clean", "Exterior Wash", "Full Detail"
  type        String  // interior, exterior, full_detail
  description String?
  baseDurationMinutes Int @default(120)
  active      Boolean @default(true)
  sortOrder   Int     @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  business     Business      @relation(fields: [businessId], references: [id])
  pricingRules PricingRule[]
  bookings     Booking[]
  checklistTemplates ChecklistTemplate[]

  @@index([businessId])
}

model AddOn {
  id          String  @id @default(cuid())
  businessId  String
  name        String  // "Carpet Shampoo", "Brightwork Polish", etc.
  description String?
  price       Float   // base price (may be multiplied by aircraft class)
  useAircraftMultiplier Boolean @default(false) // multiply price by aircraft sizeMultiplier?
  applicableTo String[] @default([]) // service types this applies to: ["interior", "full_detail"]
  durationMinutes Int @default(30)
  active      Boolean @default(true)
  sortOrder   Int     @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  business Business       @relation(fields: [businessId], references: [id])
  bookingAddOns BookingAddOn[]

  @@index([businessId])
}

model PricingRule {
  id              String @id @default(cuid())
  businessId      String
  aircraftClassId String
  serviceId       String
  basePrice       Float  // base price for this aircraft class + service combo

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  business      Business      @relation(fields: [businessId], references: [id])
  aircraftClass AircraftClass @relation(fields: [aircraftClassId], references: [id])
  service       Service       @relation(fields: [serviceId], references: [id])

  @@unique([businessId, aircraftClassId, serviceId])
  @@index([businessId])
}
```

**Step 2: Validate schema**

Run: `cd packages/database && npx prisma format`

**Step 3: Commit**

```bash
git add packages/database/prisma/schema.prisma
git commit -m "feat: add aircraft, service, and pricing models"
```

---

### Task 2.3: Define Schema — Airport and Location Models

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

**Step 1: Add Airport, ServiceArea models**

```prisma
model Airport {
  id        String  @id @default(cuid())
  icaoCode  String? @unique
  iataCode  String?
  name      String
  city      String?
  state     String?
  country   String
  latitude  Float
  longitude Float
  elevation Float?
  type      String? // large_airport, medium_airport, small_airport, heliport

  serviceAreas     ServiceArea[]
  bookingLocations BookingLocation[]
  users            User[] // technicians with this as home base

  @@index([iataCode])
  @@index([name])
  @@index([city, state])
}

model ServiceArea {
  id         String @id @default(cuid())
  businessId String
  airportId  String // home base airport
  radiusMiles Float @default(50)
  travelFeePerMile Float @default(2.0)
  minimumTravelFee Float @default(0)
  maximumTravelFee Float? // cap on travel fee

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  business Business @relation(fields: [businessId], references: [id])
  airport  Airport  @relation(fields: [airportId], references: [id])

  @@index([businessId])
}
```

**Step 2: Validate schema**

Run: `cd packages/database && npx prisma format`

**Step 3: Commit**

```bash
git add packages/database/prisma/schema.prisma
git commit -m "feat: add airport and service area models"
```

---

### Task 2.4: Define Schema — Booking, Scheduling, and Operations Models

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

**Step 1: Add Booking, BookingLocation, BookingAddOn, PricingBreakdown, CrewSchedule, TimeBlock models**

```prisma
model Booking {
  id         String @id @default(cuid())
  businessId String
  customerId String

  // Aircraft
  aircraftClassId String
  tailNumber      String?

  // Service
  serviceId String

  // Schedule
  scheduledAt    DateTime
  durationMinutes Int

  // Assignment
  technicianId String?

  // Status
  status     String @default("pending") // pending, confirmed, in_progress, completed, cancelled

  // Pricing (immutable snapshot)
  totalPrice    Float
  depositAmount Float
  depositPaid   Boolean @default(false)
  balancePaid   Boolean @default(false)
  rushSurcharge Float   @default(0)

  // Notes
  customerNotes String?
  techNotes     String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  completedAt DateTime?
  cancelledAt DateTime?

  business       Business       @relation(fields: [businessId], references: [id])
  customer       Customer       @relation(fields: [customerId], references: [id])
  aircraftClass  AircraftClass  @relation(fields: [aircraftClassId], references: [id])
  service        Service        @relation(fields: [serviceId], references: [id])
  technician     User?          @relation("AssignedTechnician", fields: [technicianId], references: [id])
  location       BookingLocation?
  addOns         BookingAddOn[]
  pricingBreakdown PricingBreakdown?
  payments       Payment[]
  photos         JobPhoto[]
  checklistItems BookingChecklistItem[]
  notificationLogs NotificationLog[]

  @@index([businessId])
  @@index([businessId, status])
  @@index([businessId, scheduledAt])
  @@index([technicianId, scheduledAt])
  @@index([customerId])
}

model BookingLocation {
  id         String @id @default(cuid())
  bookingId  String @unique
  airportId  String
  locationType String @default("hangar") // hangar, ramp
  locationNotes String?
  travelDistanceMiles Float?
  travelFee  Float  @default(0)

  booking Booking @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  airport Airport @relation(fields: [airportId], references: [id])
}

model BookingAddOn {
  id        String @id @default(cuid())
  bookingId String
  addOnId   String
  price     Float  // price at time of booking (immutable)

  booking Booking @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  addOn   AddOn   @relation(fields: [addOnId], references: [id])

  @@index([bookingId])
}

model PricingBreakdown {
  id           String @id @default(cuid())
  bookingId    String @unique
  basePrice    Float
  addOnsTotal  Float  @default(0)
  travelFee    Float  @default(0)
  rushSurcharge Float @default(0)
  subtotal     Float
  depositPercent Float @default(25)
  depositAmount Float
  totalPrice   Float

  // Store the full calculation details as JSON for transparency
  details Json? // { aircraftMultiplier, addOnItems: [{name, price}], etc. }

  booking Booking @relation(fields: [bookingId], references: [id], onDelete: Cascade)
}

model CrewSchedule {
  id         String @id @default(cuid())
  businessId String
  userId     String // the technician
  dayOfWeek  Int?   // 0-6 for recurring (null = specific date override)
  date       DateTime? // specific date override (null = recurring)
  startTime  String // "08:00" (HH:mm)
  endTime    String // "17:00" (HH:mm)
  available  Boolean @default(true) // false = time off

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  business Business @relation(fields: [businessId], references: [id])
  user     User     @relation(fields: [userId], references: [id])

  @@index([businessId, userId])
  @@index([userId, date])
}

model Payment {
  id         String @id @default(cuid())
  bookingId  String
  type       String // deposit, balance, refund
  amount     Float
  currency   String @default("usd")

  // Stripe
  stripePaymentIntentId String? @unique
  stripeChargeId        String?
  stripeRefundId        String?
  status     String @default("pending") // pending, succeeded, failed, refunded

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  booking Booking @relation(fields: [bookingId], references: [id])

  @@index([bookingId])
  @@index([stripePaymentIntentId])
}

model JobPhoto {
  id        String @id @default(cuid())
  bookingId String
  url       String
  publicId  String // Cloudinary public ID
  type      String // before, after
  caption   String?

  createdAt DateTime @default(now())

  booking Booking @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  @@index([bookingId])
}

model ChecklistTemplate {
  id         String @id @default(cuid())
  businessId String
  serviceId  String
  name       String
  items      Json   // [{ order: 1, text: "Vacuum seats", required: true }]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  business Business @relation(fields: [businessId], references: [id])
  service  Service  @relation(fields: [serviceId], references: [id])

  @@index([businessId, serviceId])
}

model BookingChecklistItem {
  id        String  @id @default(cuid())
  bookingId String
  text      String
  required  Boolean @default(true)
  completed Boolean @default(false)
  completedAt DateTime?
  sortOrder Int     @default(0)

  booking Booking @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  @@index([bookingId])
}

model NotificationLog {
  id         String @id @default(cuid())
  businessId String
  bookingId  String?
  channel    String // email, sms
  type       String // confirmation, reminder, status_update, etc.
  recipient  String // email address or phone number
  subject    String?
  body       String?
  status     String @default("pending") // pending, sent, delivered, failed
  externalId String? // SendGrid/Twilio message ID
  error      String?

  sentAt      DateTime?
  deliveredAt DateTime?
  createdAt   DateTime @default(now())

  business Business @relation(fields: [businessId], references: [id])
  booking  Booking? @relation(fields: [bookingId], references: [id])

  @@index([businessId])
  @@index([bookingId])
}
```

**Step 2: Validate full schema**

Run: `cd packages/database && npx prisma format`
Expected: No errors

**Step 3: Commit**

```bash
git add packages/database/prisma/schema.prisma
git commit -m "feat: add booking, scheduling, payment, and operations models"
```

---

### Task 2.5: Push Schema and Seed Airport Data

**Files:**
- Create: `packages/database/prisma/seed.ts`
- Create: `packages/database/prisma/data/aircraft-classes.ts`
- Create: `packages/database/prisma/data/seed-airports.ts`

**Step 1: Create aircraft class seed data**

File: `packages/database/prisma/data/aircraft-classes.ts`

```typescript
export const aircraftClasses = [
  { name: "single_engine", displayName: "Single Engine", sizeMultiplier: 1.0, sortOrder: 1, icon: "single-engine" },
  { name: "twin_engine", displayName: "Twin Engine", sizeMultiplier: 1.3, sortOrder: 2, icon: "twin-engine" },
  { name: "turboprop", displayName: "Turboprop", sizeMultiplier: 1.6, sortOrder: 3, icon: "turboprop" },
  { name: "light_jet", displayName: "Light Jet", sizeMultiplier: 2.0, sortOrder: 4, icon: "light-jet" },
  { name: "midsize_jet", displayName: "Midsize Jet", sizeMultiplier: 2.8, sortOrder: 5, icon: "midsize-jet" },
  { name: "heavy_jet", displayName: "Heavy Jet", sizeMultiplier: 4.0, sortOrder: 6, icon: "heavy-jet" },
  { name: "helicopter", displayName: "Helicopter", sizeMultiplier: 1.5, sortOrder: 7, icon: "helicopter" },
];
```

**Step 2: Create airport seed script**

File: `packages/database/prisma/data/seed-airports.ts`

Download the OurAirports CSV (https://ourairports.com/data/airports.csv) and parse it. Filter to medium/large airports + heliports in the US initially (can expand later). Upsert by ICAO code.

```typescript
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

export async function seedAirports(prisma: PrismaClient) {
  // Download airports.csv from OurAirports if not present
  const csvPath = path.join(__dirname, "airports.csv");

  if (!fs.existsSync(csvPath)) {
    console.log("Downloading airport data from OurAirports...");
    const response = await fetch("https://davidmegginson.github.io/ourairports-data/airports.csv");
    const text = await response.text();
    fs.writeFileSync(csvPath, text);
  }

  const csv = fs.readFileSync(csvPath, "utf-8");
  const lines = csv.split("\n").slice(1); // skip header

  const airports = lines
    .map((line) => {
      const cols = line.split(",").map((c) => c.replace(/"/g, "").trim());
      return {
        icaoCode: cols[1] || null,
        iataCode: cols[13] || null,
        name: cols[3],
        type: cols[2],
        latitude: parseFloat(cols[4]),
        longitude: parseFloat(cols[5]),
        elevation: cols[6] ? parseFloat(cols[6]) : null,
        country: cols[8],
        city: cols[10],
        state: cols[9],
      };
    })
    .filter((a) =>
      a.icaoCode &&
      a.name &&
      !isNaN(a.latitude) &&
      !isNaN(a.longitude) &&
      ["large_airport", "medium_airport", "small_airport", "heliport"].includes(a.type || "")
    );

  console.log(`Seeding ${airports.length} airports...`);

  // Batch upsert in chunks of 500
  const chunkSize = 500;
  for (let i = 0; i < airports.length; i += chunkSize) {
    const chunk = airports.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map((a) =>
        prisma.airport.upsert({
          where: { icaoCode: a.icaoCode! },
          update: {},
          create: {
            icaoCode: a.icaoCode,
            iataCode: a.iataCode || null,
            name: a.name,
            type: a.type,
            latitude: a.latitude,
            longitude: a.longitude,
            elevation: a.elevation,
            country: a.country,
            city: a.city || null,
            state: a.state || null,
          },
        })
      )
    );
    console.log(`  Seeded ${Math.min(i + chunkSize, airports.length)}/${airports.length}`);
  }
}
```

**Step 3: Create main seed file**

File: `packages/database/prisma/seed.ts`

```typescript
import { PrismaClient } from "@prisma/client";
import { aircraftClasses } from "./data/aircraft-classes";
import { seedAirports } from "./data/seed-airports";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding aircraft classes...");
  for (const ac of aircraftClasses) {
    await prisma.aircraftClass.upsert({
      where: { name: ac.name },
      update: { displayName: ac.displayName, sizeMultiplier: ac.sizeMultiplier, sortOrder: ac.sortOrder, icon: ac.icon },
      create: ac,
    });
  }
  console.log(`Seeded ${aircraftClasses.length} aircraft classes`);

  await seedAirports(prisma);

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Step 4: Add seed config to package.json**

Add to `packages/database/package.json`:
```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

**Step 5: Push schema to database**

Run: `cd packages/database && npx prisma db push`
Expected: Schema pushed successfully

**Step 6: Run seed**

Run: `cd packages/database && pnpm db:seed`
Expected: Aircraft classes and airports seeded

**Step 7: Commit**

```bash
git add packages/database/
git commit -m "feat: add seed data for aircraft classes and airports"
```

---

## Phase 3: Auth & Multi-Tenancy

### Task 3.1: Set Up Better Auth

**Files:**
- Create: `apps/api/src/lib/auth.ts`
- Modify: `apps/api/src/index.ts`
- Create: `apps/web/src/lib/auth-client.ts`

**Step 1: Install Better Auth**

Run in `apps/api`: `pnpm add better-auth`
Run in `apps/web`: `pnpm add @better-auth/react`

**Step 2: Configure Better Auth server**

File: `apps/api/src/lib/auth.ts`

```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@aircraftspa/database";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});
```

**Step 3: Mount auth handler in Express**

Add to `apps/api/src/index.ts`:
```typescript
import { auth } from "./lib/auth";
import { toNodeHandler } from "better-auth/node";

// Mount Better Auth BEFORE other routes
app.all("/api/auth/*", toNodeHandler(auth));
```

**Step 4: Create auth client for frontend**

File: `apps/web/src/lib/auth-client.ts`

```typescript
import { createAuthClient } from "@better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

**Step 5: Commit**

```bash
git add apps/api/src/lib/auth.ts apps/web/src/lib/auth-client.ts apps/api/src/index.ts
git commit -m "feat: configure Better Auth for staff authentication"
```

---

### Task 3.2: Add RBAC Middleware

**Files:**
- Create: `apps/api/src/middleware/auth.ts`
- Create: `apps/api/src/middleware/rbac.ts`
- Create: `apps/api/src/middleware/tenant.ts`
- Test: `apps/api/src/__tests__/middleware/rbac.test.ts`

**Step 1: Write failing test for RBAC**

File: `apps/api/src/__tests__/middleware/rbac.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { canAccess, ROLE_HIERARCHY } from "../../middleware/rbac";

describe("RBAC", () => {
  it("owner can access everything", () => {
    expect(canAccess("owner", "technician")).toBe(true);
    expect(canAccess("owner", "manager")).toBe(true);
    expect(canAccess("owner", "admin")).toBe(true);
    expect(canAccess("owner", "owner")).toBe(true);
  });

  it("technician can only access technician level", () => {
    expect(canAccess("technician", "technician")).toBe(true);
    expect(canAccess("technician", "manager")).toBe(false);
    expect(canAccess("technician", "admin")).toBe(false);
    expect(canAccess("technician", "owner")).toBe(false);
  });

  it("manager can access manager and below", () => {
    expect(canAccess("manager", "technician")).toBe(true);
    expect(canAccess("manager", "manager")).toBe(true);
    expect(canAccess("manager", "admin")).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && pnpm vitest run src/__tests__/middleware/rbac.test.ts`
Expected: FAIL — module not found

**Step 3: Implement RBAC**

File: `apps/api/src/middleware/rbac.ts`

```typescript
import { Request, Response, NextFunction } from "express";
import type { UserRole } from "@aircraftspa/types";

export const ROLE_HIERARCHY: Record<string, number> = {
  technician: 1,
  manager: 2,
  admin: 3,
  owner: 4,
};

export function canAccess(userRole: string, requiredRole: string): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 999);
}

export function requireRole(minimumRole: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }
    if (!canAccess(user.role, minimumRole)) {
      return res.status(403).json({ success: false, error: "Insufficient permissions" });
    }
    next();
  };
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/api && pnpm vitest run src/__tests__/middleware/rbac.test.ts`
Expected: PASS

**Step 5: Create tenant isolation middleware**

File: `apps/api/src/middleware/tenant.ts`

```typescript
import { Request, Response, NextFunction } from "express";
import { prisma } from "@aircraftspa/database";

export async function resolveTenant(req: Request, res: Response, next: NextFunction) {
  // Resolve business from subdomain header (set by frontend) or from authenticated user
  const subdomain = req.headers["x-business-subdomain"] as string;
  const user = (req as any).user;

  if (user?.businessId) {
    (req as any).businessId = user.businessId;
    return next();
  }

  if (subdomain) {
    const business = await prisma.business.findUnique({
      where: { subdomain },
      select: { id: true },
    });
    if (!business) {
      return res.status(404).json({ success: false, error: "Business not found" });
    }
    (req as any).businessId = business.id;
    return next();
  }

  return res.status(400).json({ success: false, error: "Business context required" });
}
```

**Step 6: Create auth middleware**

File: `apps/api/src/middleware/auth.ts`

```typescript
import { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth";
import { prisma } from "@aircraftspa/database";
import { fromNodeHeaders } from "better-auth/node";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    // Fetch full user with business context
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, businessId: true, role: true, name: true, email: true },
    });

    if (!user) {
      return res.status(401).json({ success: false, error: "User not found" });
    }

    (req as any).user = user;
    (req as any).businessId = user.businessId;
    next();
  } catch {
    return res.status(401).json({ success: false, error: "Invalid session" });
  }
}
```

**Step 7: Commit**

```bash
git add apps/api/src/middleware/ apps/api/src/__tests__/
git commit -m "feat: add RBAC, auth, and tenant isolation middleware"
```

---

## Phase 4: Core Business Logic

### Task 4.1: Pricing Engine

**Files:**
- Create: `apps/api/src/services/pricing.ts`
- Test: `apps/api/src/__tests__/services/pricing.test.ts`

**Step 1: Write failing tests for pricing engine**

File: `apps/api/src/__tests__/services/pricing.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { calculatePrice, type PricingInput } from "../../services/pricing";

describe("PricingEngine", () => {
  const baseInput: PricingInput = {
    basePrice: 200,
    aircraftSizeMultiplier: 1.0,
    addOns: [],
    travelDistanceMiles: 0,
    travelFeePerMile: 2.0,
    minimumTravelFee: 0,
    maximumTravelFee: null,
    isRushSameDay: false,
    isRushNextDay: false,
    rushSameDayMultiplier: 1.5,
    rushNextDayMultiplier: 1.25,
    depositPercent: 25,
  };

  it("calculates base price with aircraft multiplier", () => {
    const result = calculatePrice({ ...baseInput, aircraftSizeMultiplier: 2.0 });
    expect(result.basePrice).toBe(400); // 200 * 2.0
    expect(result.totalPrice).toBe(400);
  });

  it("adds add-on prices correctly", () => {
    const result = calculatePrice({
      ...baseInput,
      addOns: [
        { name: "Carpet Shampoo", price: 50, useAircraftMultiplier: false },
        { name: "Brightwork", price: 100, useAircraftMultiplier: true },
      ],
      aircraftSizeMultiplier: 2.0,
    });
    expect(result.addOnsTotal).toBe(250); // 50 + (100 * 2.0)
    expect(result.totalPrice).toBe(650); // 400 base + 250 addons
  });

  it("calculates travel fee", () => {
    const result = calculatePrice({
      ...baseInput,
      travelDistanceMiles: 30,
      minimumTravelFee: 25,
    });
    expect(result.travelFee).toBe(60); // 30 * 2.0
    expect(result.totalPrice).toBe(260); // 200 + 60
  });

  it("enforces minimum travel fee", () => {
    const result = calculatePrice({
      ...baseInput,
      travelDistanceMiles: 5,
      minimumTravelFee: 25,
    });
    expect(result.travelFee).toBe(25); // min is 25, calculated is 10
  });

  it("caps travel fee at maximum", () => {
    const result = calculatePrice({
      ...baseInput,
      travelDistanceMiles: 100,
      maximumTravelFee: 100,
    });
    expect(result.travelFee).toBe(100); // capped at max
  });

  it("applies same-day rush surcharge", () => {
    const result = calculatePrice({ ...baseInput, isRushSameDay: true });
    expect(result.rushSurcharge).toBe(100); // 200 * (1.5 - 1.0)
    expect(result.totalPrice).toBe(300);
  });

  it("applies next-day rush surcharge", () => {
    const result = calculatePrice({ ...baseInput, isRushNextDay: true });
    expect(result.rushSurcharge).toBe(50); // 200 * (1.25 - 1.0)
    expect(result.totalPrice).toBe(250);
  });

  it("calculates deposit amount", () => {
    const result = calculatePrice({ ...baseInput, depositPercent: 50 });
    expect(result.depositAmount).toBe(100); // 200 * 0.5
  });

  it("same-day takes priority over next-day", () => {
    const result = calculatePrice({ ...baseInput, isRushSameDay: true, isRushNextDay: true });
    expect(result.rushSurcharge).toBe(100); // uses same-day multiplier
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd apps/api && pnpm vitest run src/__tests__/services/pricing.test.ts`
Expected: FAIL

**Step 3: Implement pricing engine**

File: `apps/api/src/services/pricing.ts`

```typescript
export interface PricingInput {
  basePrice: number;
  aircraftSizeMultiplier: number;
  addOns: Array<{ name: string; price: number; useAircraftMultiplier: boolean }>;
  travelDistanceMiles: number;
  travelFeePerMile: number;
  minimumTravelFee: number;
  maximumTravelFee: number | null;
  isRushSameDay: boolean;
  isRushNextDay: boolean;
  rushSameDayMultiplier: number;
  rushNextDayMultiplier: number;
  depositPercent: number;
}

export interface PricingResult {
  basePrice: number;
  addOnsTotal: number;
  addOnItems: Array<{ name: string; price: number }>;
  travelFee: number;
  rushSurcharge: number;
  subtotal: number;
  totalPrice: number;
  depositPercent: number;
  depositAmount: number;
}

export function calculatePrice(input: PricingInput): PricingResult {
  // Base price = base * aircraft multiplier
  const basePrice = input.basePrice * input.aircraftSizeMultiplier;

  // Add-ons
  const addOnItems = input.addOns.map((addon) => ({
    name: addon.name,
    price: addon.useAircraftMultiplier
      ? addon.price * input.aircraftSizeMultiplier
      : addon.price,
  }));
  const addOnsTotal = addOnItems.reduce((sum, item) => sum + item.price, 0);

  // Travel fee
  let travelFee = 0;
  if (input.travelDistanceMiles > 0) {
    travelFee = input.travelDistanceMiles * input.travelFeePerMile;
    travelFee = Math.max(travelFee, input.minimumTravelFee);
    if (input.maximumTravelFee !== null) {
      travelFee = Math.min(travelFee, input.maximumTravelFee);
    }
  }

  // Rush surcharge (applied to base price only)
  let rushSurcharge = 0;
  if (input.isRushSameDay) {
    rushSurcharge = basePrice * (input.rushSameDayMultiplier - 1);
  } else if (input.isRushNextDay) {
    rushSurcharge = basePrice * (input.rushNextDayMultiplier - 1);
  }

  const subtotal = basePrice + addOnsTotal + travelFee;
  const totalPrice = subtotal + rushSurcharge;
  const depositAmount = totalPrice * (input.depositPercent / 100);

  return {
    basePrice,
    addOnsTotal,
    addOnItems,
    travelFee,
    rushSurcharge,
    subtotal,
    totalPrice,
    depositPercent: input.depositPercent,
    depositAmount,
  };
}
```

**Step 4: Run tests to verify they pass**

Run: `cd apps/api && pnpm vitest run src/__tests__/services/pricing.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add apps/api/src/services/pricing.ts apps/api/src/__tests__/services/pricing.test.ts
git commit -m "feat: implement pricing engine with full test coverage"
```

---

### Task 4.2: Availability/Scheduling Engine

**Files:**
- Create: `apps/api/src/services/scheduling.ts`
- Test: `apps/api/src/__tests__/services/scheduling.test.ts`

**Step 1: Write failing tests for availability calculation**

```typescript
import { describe, it, expect } from "vitest";
import {
  getAvailableSlots,
  isSlotAvailable,
  type ScheduleContext,
} from "../../services/scheduling";

describe("SchedulingEngine", () => {
  const baseContext: ScheduleContext = {
    date: new Date("2026-03-15"),
    durationMinutes: 120,
    travelBufferMinutes: 30,
    crewSchedules: [
      { userId: "tech1", startTime: "08:00", endTime: "17:00" },
    ],
    existingBookings: [],
  };

  it("returns available slots for an open day", () => {
    const slots = getAvailableSlots(baseContext);
    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0].startTime).toBe("08:00");
  });

  it("blocks slots that overlap existing bookings", () => {
    const ctx: ScheduleContext = {
      ...baseContext,
      existingBookings: [
        { technicianId: "tech1", startTime: "10:00", endTime: "12:00", bufferMinutes: 30 },
      ],
    };
    const slots = getAvailableSlots(ctx);
    // Should not include any slot that overlaps 09:30–12:30 (with buffers)
    const conflicting = slots.filter(
      (s) => s.startTime >= "09:30" && s.startTime < "12:30"
    );
    expect(conflicting.length).toBe(0);
  });

  it("returns empty if no crew available", () => {
    const ctx: ScheduleContext = { ...baseContext, crewSchedules: [] };
    const slots = getAvailableSlots(ctx);
    expect(slots.length).toBe(0);
  });

  it("respects crew schedule end time minus duration", () => {
    // Crew works 08:00-12:00, job is 120min → last slot is 10:00
    const ctx: ScheduleContext = {
      ...baseContext,
      crewSchedules: [{ userId: "tech1", startTime: "08:00", endTime: "12:00" }],
    };
    const slots = getAvailableSlots(ctx);
    const lastSlot = slots[slots.length - 1];
    expect(lastSlot.startTime).toBe("10:00");
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd apps/api && pnpm vitest run src/__tests__/services/scheduling.test.ts`
Expected: FAIL

**Step 3: Implement scheduling engine**

File: `apps/api/src/services/scheduling.ts`

```typescript
export interface CrewScheduleEntry {
  userId: string;
  startTime: string; // HH:mm
  endTime: string;
}

export interface ExistingBooking {
  technicianId: string;
  startTime: string; // HH:mm
  endTime: string;
  bufferMinutes: number;
}

export interface ScheduleContext {
  date: Date;
  durationMinutes: number;
  travelBufferMinutes: number;
  crewSchedules: CrewScheduleEntry[];
  existingBookings: ExistingBooking[];
}

export interface TimeSlot {
  startTime: string; // HH:mm
  endTime: string;
  availableTechnicians: string[];
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function isSlotAvailable(
  slotStart: number,
  slotEnd: number,
  techId: string,
  existingBookings: ExistingBooking[],
  buffer: number
): boolean {
  for (const booking of existingBookings) {
    if (booking.technicianId !== techId) continue;
    const bookingStart = timeToMinutes(booking.startTime) - buffer;
    const bookingEnd = timeToMinutes(booking.endTime) + booking.bufferMinutes;
    if (slotStart < bookingEnd && slotEnd > bookingStart) {
      return false;
    }
  }
  return true;
}

export function getAvailableSlots(ctx: ScheduleContext): TimeSlot[] {
  if (ctx.crewSchedules.length === 0) return [];

  const slotInterval = 30; // 30-minute intervals
  const slots: TimeSlot[] = [];

  // Find earliest start and latest end across all crew
  let earliestStart = Infinity;
  let latestEnd = 0;
  for (const cs of ctx.crewSchedules) {
    earliestStart = Math.min(earliestStart, timeToMinutes(cs.startTime));
    latestEnd = Math.max(latestEnd, timeToMinutes(cs.endTime));
  }

  for (let start = earliestStart; start + ctx.durationMinutes <= latestEnd; start += slotInterval) {
    const end = start + ctx.durationMinutes;
    const availableTechs: string[] = [];

    for (const cs of ctx.crewSchedules) {
      const crewStart = timeToMinutes(cs.startTime);
      const crewEnd = timeToMinutes(cs.endTime);

      // Slot must fit within crew schedule
      if (start < crewStart || end > crewEnd) continue;

      // Check no conflicts with existing bookings
      if (isSlotAvailable(start, end, cs.userId, ctx.existingBookings, ctx.travelBufferMinutes)) {
        availableTechs.push(cs.userId);
      }
    }

    if (availableTechs.length > 0) {
      slots.push({
        startTime: minutesToTime(start),
        endTime: minutesToTime(end),
        availableTechnicians: availableTechs,
      });
    }
  }

  return slots;
}
```

**Step 4: Run tests to verify they pass**

Run: `cd apps/api && pnpm vitest run src/__tests__/services/scheduling.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add apps/api/src/services/scheduling.ts apps/api/src/__tests__/services/scheduling.test.ts
git commit -m "feat: implement scheduling engine with availability calculation"
```

---

### Task 4.3: Distance Calculation Service

**Files:**
- Create: `apps/api/src/services/distance.ts`
- Test: `apps/api/src/__tests__/services/distance.test.ts`

**Step 1: Write failing test**

```typescript
import { describe, it, expect } from "vitest";
import { calculateDistanceMiles } from "../../services/distance";

describe("DistanceCalculation", () => {
  it("calculates distance between two known airports", () => {
    // JFK to LGA is roughly 11 miles
    const distance = calculateDistanceMiles(40.6413, -73.7781, 40.7769, -73.8740);
    expect(distance).toBeGreaterThan(8);
    expect(distance).toBeLessThan(15);
  });

  it("returns 0 for same location", () => {
    const distance = calculateDistanceMiles(40.6413, -73.7781, 40.6413, -73.7781);
    expect(distance).toBe(0);
  });
});
```

**Step 2: Implement Haversine distance calculation**

File: `apps/api/src/services/distance.ts`

```typescript
export function calculateDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
```

**Step 3: Run tests**

Run: `cd apps/api && pnpm vitest run src/__tests__/services/distance.test.ts`
Expected: PASS

**Step 4: Commit**

```bash
git add apps/api/src/services/distance.ts apps/api/src/__tests__/services/distance.test.ts
git commit -m "feat: add Haversine distance calculation service"
```

---

## Phase 5: Booking API

### Task 5.1: Airport Search Endpoint

**Files:**
- Create: `apps/api/src/routes/airports.ts`
- Modify: `apps/api/src/index.ts` (mount route)

**Step 1: Create airport search route**

File: `apps/api/src/routes/airports.ts`

```typescript
import { Router } from "express";
import { prisma } from "@aircraftspa/database";

export const airportRouter = Router();

// GET /api/airports/search?q=KTEB&limit=10
airportRouter.get("/search", async (req, res) => {
  const query = (req.query.q as string || "").trim();
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

  if (query.length < 2) {
    return res.json({ success: true, data: [] });
  }

  const airports = await prisma.airport.findMany({
    where: {
      OR: [
        { icaoCode: { startsWith: query.toUpperCase(), mode: "insensitive" } },
        { iataCode: { startsWith: query.toUpperCase(), mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
        { city: { contains: query, mode: "insensitive" } },
      ],
    },
    take: limit,
    orderBy: [
      { type: "asc" }, // large airports first
      { name: "asc" },
    ],
    select: {
      id: true,
      icaoCode: true,
      iataCode: true,
      name: true,
      city: true,
      state: true,
      country: true,
      latitude: true,
      longitude: true,
      type: true,
    },
  });

  res.json({ success: true, data: airports });
});
```

**Step 2: Mount in Express**

Add to `apps/api/src/index.ts`:
```typescript
import { airportRouter } from "./routes/airports";
app.use("/api/airports", airportRouter);
```

**Step 3: Commit**

```bash
git add apps/api/src/routes/airports.ts apps/api/src/index.ts
git commit -m "feat: add airport search API endpoint"
```

---

### Task 5.2: Services & Add-Ons Endpoints

**Files:**
- Create: `apps/api/src/routes/services.ts`

**Step 1: Create services route with CRUD**

```typescript
import { Router } from "express";
import { prisma } from "@aircraftspa/database";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

export const servicesRouter = Router();

// GET /api/services — list services for a business (public, uses tenant context)
servicesRouter.get("/", async (req, res) => {
  const businessId = (req as any).businessId;
  const services = await prisma.service.findMany({
    where: { businessId, active: true },
    orderBy: { sortOrder: "asc" },
  });
  res.json({ success: true, data: services });
});

// GET /api/services/:id/addons — list add-ons for a service type
servicesRouter.get("/:id/addons", async (req, res) => {
  const businessId = (req as any).businessId;
  const service = await prisma.service.findFirst({
    where: { id: req.params.id, businessId },
  });
  if (!service) return res.status(404).json({ success: false, error: "Service not found" });

  const addOns = await prisma.addOn.findMany({
    where: {
      businessId,
      active: true,
      applicableTo: { has: service.type },
    },
    orderBy: { sortOrder: "asc" },
  });
  res.json({ success: true, data: addOns });
});

// POST /api/services — create (admin+)
servicesRouter.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  const businessId = (req as any).businessId;
  const service = await prisma.service.create({
    data: { ...req.body, businessId },
  });
  res.status(201).json({ success: true, data: service });
});

// PUT /api/services/:id — update (admin+)
servicesRouter.put("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const businessId = (req as any).businessId;
  const service = await prisma.service.updateMany({
    where: { id: req.params.id, businessId },
    data: req.body,
  });
  res.json({ success: true, data: service });
});
```

**Step 2: Mount and commit**

```bash
git add apps/api/src/routes/services.ts apps/api/src/index.ts
git commit -m "feat: add services and add-ons API endpoints"
```

---

### Task 5.3: Pricing Endpoint

**Files:**
- Create: `apps/api/src/routes/pricing.ts`

**Step 1: Create pricing calculation endpoint**

```typescript
import { Router } from "express";
import { prisma } from "@aircraftspa/database";
import { calculatePrice } from "../services/pricing";
import { calculateDistanceMiles } from "../services/distance";
import { z } from "zod";

export const pricingRouter = Router();

const pricingRequestSchema = z.object({
  aircraftClassId: z.string(),
  serviceId: z.string(),
  addOnIds: z.array(z.string()).default([]),
  airportId: z.string(),
  scheduledDate: z.string().optional(), // ISO date for rush detection
});

// POST /api/pricing/calculate — calculate price for a booking configuration
pricingRouter.post("/calculate", async (req, res) => {
  const businessId = (req as any).businessId;
  const parsed = pricingRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.flatten() });
  }

  const { aircraftClassId, serviceId, addOnIds, airportId, scheduledDate } = parsed.data;

  // Fetch all needed data in parallel
  const [aircraftClass, pricingRule, addOns, airport, serviceArea] = await Promise.all([
    prisma.aircraftClass.findUnique({ where: { id: aircraftClassId } }),
    prisma.pricingRule.findFirst({ where: { businessId, aircraftClassId, serviceId } }),
    prisma.addOn.findMany({ where: { id: { in: addOnIds }, businessId } }),
    prisma.airport.findUnique({ where: { id: airportId } }),
    prisma.serviceArea.findFirst({ where: { businessId }, include: { airport: true } }),
  ]);

  if (!aircraftClass || !pricingRule || !airport) {
    return res.status(400).json({ success: false, error: "Invalid configuration" });
  }

  // Calculate travel distance
  let travelDistanceMiles = 0;
  if (serviceArea) {
    travelDistanceMiles = calculateDistanceMiles(
      serviceArea.airport.latitude, serviceArea.airport.longitude,
      airport.latitude, airport.longitude
    );
  }

  // Detect rush booking
  const now = new Date();
  const scheduledAt = scheduledDate ? new Date(scheduledDate) : null;
  const hoursUntil = scheduledAt ? (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60) : Infinity;
  const isRushSameDay = hoursUntil < 24;
  const isRushNextDay = !isRushSameDay && hoursUntil < 48;

  // Get business booking settings for multipliers
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { bookingSettings: true },
  });
  const settings = (business?.bookingSettings as any) || {};

  const result = calculatePrice({
    basePrice: pricingRule.basePrice,
    aircraftSizeMultiplier: aircraftClass.sizeMultiplier,
    addOns: addOns.map((a) => ({
      name: a.name,
      price: a.price,
      useAircraftMultiplier: a.useAircraftMultiplier,
    })),
    travelDistanceMiles,
    travelFeePerMile: serviceArea?.travelFeePerMile ?? 0,
    minimumTravelFee: serviceArea?.minimumTravelFee ?? 0,
    maximumTravelFee: serviceArea?.maximumTravelFee ?? null,
    isRushSameDay,
    isRushNextDay,
    rushSameDayMultiplier: settings.rushSameDayMultiplier ?? 1.5,
    rushNextDayMultiplier: settings.rushNextDayMultiplier ?? 1.25,
    depositPercent: settings.depositPercent ?? 25,
  });

  res.json({ success: true, data: result });
});
```

**Step 2: Mount and commit**

```bash
git add apps/api/src/routes/pricing.ts apps/api/src/index.ts
git commit -m "feat: add pricing calculation API endpoint"
```

---

### Task 5.4: Availability Endpoint

**Files:**
- Create: `apps/api/src/routes/availability.ts`

**Step 1: Create availability endpoint**

Fetches crew schedules and existing bookings for a date, runs them through the scheduling engine, returns available time slots.

```typescript
import { Router } from "express";
import { prisma } from "@aircraftspa/database";
import { getAvailableSlots } from "../services/scheduling";
import { z } from "zod";

export const availabilityRouter = Router();

const availabilitySchema = z.object({
  date: z.string(), // YYYY-MM-DD
  serviceId: z.string(),
  aircraftClassId: z.string(),
  addOnIds: z.array(z.string()).default([]),
});

// POST /api/availability — get available slots for a date
availabilityRouter.post("/", async (req, res) => {
  const businessId = (req as any).businessId;
  const parsed = availabilitySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.flatten() });
  }

  const { date, serviceId, aircraftClassId, addOnIds } = parsed.data;
  const targetDate = new Date(date);
  const dayOfWeek = targetDate.getDay();

  // Get service duration + add-on durations
  const [service, addOns] = await Promise.all([
    prisma.service.findFirst({ where: { id: serviceId, businessId } }),
    prisma.addOn.findMany({ where: { id: { in: addOnIds }, businessId } }),
  ]);

  if (!service) {
    return res.status(400).json({ success: false, error: "Service not found" });
  }

  const totalDuration = service.baseDurationMinutes + addOns.reduce((sum, a) => sum + a.durationMinutes, 0);

  // Get crew schedules (recurring for this day of week, or specific date overrides)
  const crewSchedules = await prisma.crewSchedule.findMany({
    where: {
      businessId,
      available: true,
      OR: [
        { dayOfWeek, date: null },
        { date: targetDate },
      ],
    },
  });

  // Get existing bookings for this date
  const startOfDay = new Date(date + "T00:00:00");
  const endOfDay = new Date(date + "T23:59:59");
  const existingBookings = await prisma.booking.findMany({
    where: {
      businessId,
      scheduledAt: { gte: startOfDay, lte: endOfDay },
      status: { in: ["pending", "confirmed", "in_progress"] },
    },
    select: {
      technicianId: true,
      scheduledAt: true,
      durationMinutes: true,
    },
  });

  const slots = getAvailableSlots({
    date: targetDate,
    durationMinutes: totalDuration,
    travelBufferMinutes: 30,
    crewSchedules: crewSchedules.map((cs) => ({
      userId: cs.userId,
      startTime: cs.startTime,
      endTime: cs.endTime,
    })),
    existingBookings: existingBookings.map((b) => {
      const start = b.scheduledAt;
      const startMinutes = start.getHours() * 60 + start.getMinutes();
      const endMinutes = startMinutes + b.durationMinutes;
      return {
        technicianId: b.technicianId || "",
        startTime: `${Math.floor(startMinutes / 60).toString().padStart(2, "0")}:${(startMinutes % 60).toString().padStart(2, "0")}`,
        endTime: `${Math.floor(endMinutes / 60).toString().padStart(2, "0")}:${(endMinutes % 60).toString().padStart(2, "0")}`,
        bufferMinutes: 30,
      };
    }),
  });

  res.json({ success: true, data: slots });
});
```

**Step 2: Mount and commit**

```bash
git add apps/api/src/routes/availability.ts apps/api/src/index.ts
git commit -m "feat: add availability slots API endpoint"
```

---

### Task 5.5: Booking CRUD Endpoints

**Files:**
- Create: `apps/api/src/routes/bookings.ts`

**Step 1: Create booking routes**

Full CRUD with validation, pricing snapshot creation, and status management.

Key endpoints:
- `POST /api/bookings` — Create booking (customer-facing, captures deposit)
- `GET /api/bookings` — List bookings (admin, filtered by status/date)
- `GET /api/bookings/:id` — Get booking detail
- `PATCH /api/bookings/:id/status` — Update status (tech: start/complete, admin: cancel/confirm)
- `PATCH /api/bookings/:id/assign` — Assign technician (admin)

The create endpoint:
1. Validates all IDs exist and belong to business
2. Calculates pricing and stores immutable snapshot
3. Creates Stripe PaymentIntent for deposit
4. Creates booking in pending status
5. Sends confirmation notification

**Step 2: Implement using zod validation**

Each endpoint uses zod schemas. Booking creation is transactional (Prisma `$transaction`).

**Step 3: Commit**

```bash
git add apps/api/src/routes/bookings.ts apps/api/src/index.ts
git commit -m "feat: add booking CRUD API endpoints"
```

---

### Task 5.6: Customer Endpoints

**Files:**
- Create: `apps/api/src/routes/customers.ts`

**Step 1: Create customer routes**

- `GET /api/customers` — List with search/filter (admin)
- `GET /api/customers/:id` — Detail with booking history, lifetime value
- `POST /api/customers` — Create/find-or-create during booking
- `PUT /api/customers/:id` — Update notes/tags (admin)

**Step 2: Mount and commit**

```bash
git add apps/api/src/routes/customers.ts apps/api/src/index.ts
git commit -m "feat: add customer CRM API endpoints"
```

---

## Phase 6: Payments (Stripe Connect)

### Task 6.1: Stripe Connect Setup

**Files:**
- Create: `apps/api/src/services/stripe.ts`
- Create: `apps/api/src/routes/stripe.ts`

**Step 1: Install Stripe**

Run: `cd apps/api && pnpm add stripe`

**Step 2: Create Stripe service**

File: `apps/api/src/services/stripe.ts`

```typescript
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

// Create connected account for a business
export async function createConnectedAccount(businessEmail: string, businessName: string) {
  return stripe.accounts.create({
    type: "express",
    email: businessEmail,
    business_profile: { name: businessName },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
}

// Create onboarding link for a connected account
export async function createAccountLink(accountId: string, returnUrl: string) {
  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${returnUrl}?refresh=true`,
    return_url: returnUrl,
    type: "account_onboarding",
  });
}

// Create PaymentIntent for deposit
export async function createDepositIntent(
  amount: number, // in cents
  currency: string,
  connectedAccountId: string,
  platformFeePercent: number,
  metadata: Record<string, string>
) {
  const platformFee = Math.round(amount * (platformFeePercent / 100));
  return stripe.paymentIntents.create({
    amount,
    currency,
    metadata,
    application_fee_amount: platformFee,
    transfer_data: {
      destination: connectedAccountId,
    },
  });
}

// Capture balance (separate charge on connected account)
export async function captureBalance(
  amount: number,
  currency: string,
  connectedAccountId: string,
  platformFeePercent: number,
  paymentMethodId: string,
  customerId: string,
  metadata: Record<string, string>
) {
  const platformFee = Math.round(amount * (platformFeePercent / 100));
  return stripe.paymentIntents.create({
    amount,
    currency,
    payment_method: paymentMethodId,
    customer: customerId,
    confirm: true,
    metadata,
    application_fee_amount: platformFee,
    transfer_data: {
      destination: connectedAccountId,
    },
  });
}
```

**Step 3: Create Stripe webhook route**

File: `apps/api/src/routes/stripe.ts`

Handle `payment_intent.succeeded`, `payment_intent.payment_failed`, `account.updated` events. Update Payment and Booking records accordingly.

**Step 4: Commit**

```bash
git add apps/api/src/services/stripe.ts apps/api/src/routes/stripe.ts
git commit -m "feat: add Stripe Connect payment service and webhooks"
```

---

## Phase 7: Customer Booking UI

### Task 7.1: Booking Store (Zustand)

**Files:**
- Create: `apps/web/src/stores/booking-store.ts`

**Step 1: Create booking wizard state**

```typescript
import { create } from "zustand";

interface BookingState {
  step: number;
  aircraftClassId: string | null;
  tailNumber: string;
  serviceId: string | null;
  addOnIds: string[];
  airportId: string | null;
  locationType: "hangar" | "ramp";
  locationNotes: string;
  selectedDate: Date | null;
  selectedTime: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pricing: PricingResult | null;

  // Actions
  setStep: (step: number) => void;
  setAircraftClass: (id: string) => void;
  setService: (id: string) => void;
  toggleAddOn: (id: string) => void;
  setAirport: (id: string) => void;
  setLocationType: (type: "hangar" | "ramp") => void;
  setDateTime: (date: Date, time: string) => void;
  setCustomerInfo: (name: string, email: string, phone: string) => void;
  setPricing: (pricing: PricingResult) => void;
  reset: () => void;
}
```

Implement all actions as simple setters. The store drives the multi-step wizard.

**Step 2: Commit**

```bash
git add apps/web/src/stores/booking-store.ts
git commit -m "feat: add booking wizard Zustand store"
```

---

### Task 7.2: Booking API Hooks (React Query)

**Files:**
- Create: `apps/web/src/hooks/use-airports.ts`
- Create: `apps/web/src/hooks/use-services.ts`
- Create: `apps/web/src/hooks/use-pricing.ts`
- Create: `apps/web/src/hooks/use-availability.ts`
- Create: `apps/web/src/hooks/use-booking.ts`

**Step 1: Create React Query hooks for each API**

Each hook wraps a fetch call to the Express API. Use `@tanstack/react-query` for caching and loading states.

Example for airport search:
```typescript
import { useQuery } from "@tanstack/react-query";

export function useAirportSearch(query: string) {
  return useQuery({
    queryKey: ["airports", query],
    queryFn: () => fetch(`${API_URL}/api/airports/search?q=${query}`).then(r => r.json()),
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000, // airports don't change
  });
}
```

**Step 2: Commit**

```bash
git add apps/web/src/hooks/
git commit -m "feat: add React Query hooks for booking APIs"
```

---

### Task 7.3: Step 1 — Aircraft Details Component

**Files:**
- Create: `apps/web/src/app/(booking)/book/page.tsx`
- Create: `apps/web/src/app/(booking)/book/steps/aircraft-details.tsx`

**Step 1: Build aircraft class selection**

Visual cards with icons for each aircraft class. Service type selector (interior/exterior/full). Add-on toggles filtered by service type. All connected to booking store.

**Step 2: Commit**

```bash
git add apps/web/src/app/\(booking\)/
git commit -m "feat: add booking step 1 - aircraft details"
```

---

### Task 7.4: Step 2 — Location Component

**Files:**
- Create: `apps/web/src/app/(booking)/book/steps/location.tsx`

**Step 1: Build airport search with autocomplete**

Uses shadcn Command/Combobox for typeahead search. Shows ICAO/IATA codes, name, city. Hangar vs ramp radio. Travel fee shown in real-time. Out-of-area fallback message.

**Step 2: Commit**

```bash
git add apps/web/src/app/\(booking\)/book/steps/location.tsx
git commit -m "feat: add booking step 2 - location selection"
```

---

### Task 7.5: Step 3 — Pricing Display

**Files:**
- Create: `apps/web/src/app/(booking)/book/steps/pricing.tsx`

**Step 1: Build live pricing breakdown**

Calls pricing API whenever aircraft/service/addons/location change. Displays itemized breakdown. Shows deposit amount. "How is this priced?" expandable section.

**Step 2: Commit**

```bash
git add apps/web/src/app/\(booking\)/book/steps/pricing.tsx
git commit -m "feat: add booking step 3 - instant pricing display"
```

---

### Task 7.6: Step 4 — Date & Time Selection

**Files:**
- Create: `apps/web/src/app/(booking)/book/steps/date-time.tsx`

**Step 1: Build calendar with available slots**

Uses shadcn Calendar for date picking. Fetches available slots for selected date. Slots shown as clickable time buttons. Rush indicator badge on same-day/next-day.

**Step 2: Commit**

```bash
git add apps/web/src/app/\(booking\)/book/steps/date-time.tsx
git commit -m "feat: add booking step 4 - date and time selection"
```

---

### Task 7.7: Step 5 — Customer Info & Payment

**Files:**
- Create: `apps/web/src/app/(booking)/book/steps/payment.tsx`

**Step 1: Build customer form with Stripe Elements**

Install: `pnpm add @stripe/react-stripe-js @stripe/stripe-js`

Name, email, phone fields. Stripe CardElement for payment. Deposit amount shown prominently. Submit creates booking via API.

**Step 2: Commit**

```bash
git add apps/web/src/app/\(booking\)/book/steps/payment.tsx
git commit -m "feat: add booking step 5 - customer info and payment"
```

---

### Task 7.8: Step 6 — Confirmation Page

**Files:**
- Create: `apps/web/src/app/(booking)/book/steps/confirmation.tsx`

**Step 1: Build confirmation summary**

Booking summary card. Calendar invite download (.ics). "Add to Calendar" button. Share/print options.

**Step 2: Commit**

```bash
git add apps/web/src/app/\(booking\)/book/steps/confirmation.tsx
git commit -m "feat: add booking step 6 - confirmation page"
```

---

### Task 7.9: Booking Wizard Shell

**Files:**
- Modify: `apps/web/src/app/(booking)/book/page.tsx`

**Step 1: Wire up multi-step wizard**

Step indicator/progress bar. Renders current step component based on booking store. Back/Next navigation. Mobile-responsive layout.

**Step 2: End-to-end test of full booking flow**

Manually test: select aircraft → location → see pricing → pick time → enter info → confirm.

**Step 3: Commit**

```bash
git add apps/web/src/app/\(booking\)/
git commit -m "feat: wire up complete booking wizard flow"
```

---

## Phase 8: Admin Dashboard

### Task 8.1: Dashboard Layout & Navigation

**Files:**
- Create: `apps/web/src/app/(dashboard)/layout.tsx`
- Create: `apps/web/src/app/(dashboard)/components/sidebar.tsx`
- Create: `apps/web/src/app/(dashboard)/components/header.tsx`

**Step 1: Build admin shell**

Sidebar with nav links: Dashboard, Calendar, Pricing, Customers, Crew, Payments, Settings. Responsive — collapses to mobile drawer. User avatar + business name in header.

**Step 2: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/
git commit -m "feat: add admin dashboard layout with navigation"
```

---

### Task 8.2: Dashboard Home Page

**Files:**
- Create: `apps/web/src/app/(dashboard)/page.tsx`
- Create: `apps/api/src/routes/dashboard.ts`

**Step 1: Build dashboard stats API**

`GET /api/dashboard/stats` — returns today's jobs count, this week's revenue, pending bookings, recent activity.

**Step 2: Build dashboard UI**

Stat cards (today's jobs, revenue, pending). Recent bookings table. Quick-action buttons.

**Step 3: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/page.tsx apps/api/src/routes/dashboard.ts
git commit -m "feat: add admin dashboard home with stats"
```

---

### Task 8.3: Scheduling Calendar

**Files:**
- Create: `apps/web/src/app/(dashboard)/calendar/page.tsx`

**Step 1: Install calendar library**

Run: `cd apps/web && pnpm add @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction`

**Step 2: Build scheduling calendar**

Day/week/month views. Events from bookings API. Color-coded by status. Click to view booking detail. Drag-and-drop for crew assignment (FullCalendar interaction plugin).

**Step 3: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/calendar/
git commit -m "feat: add scheduling calendar with drag-and-drop"
```

---

### Task 8.4: Pricing Rules Admin

**Files:**
- Create: `apps/web/src/app/(dashboard)/pricing/page.tsx`
- Create: `apps/api/src/routes/pricing-rules.ts`

**Step 1: Build pricing rules CRUD API**

`GET /api/pricing-rules` — returns full pricing matrix.
`PUT /api/pricing-rules` — bulk update pricing rules.
`GET /api/pricing-rules/preview` — preview calculation with test inputs.

**Step 2: Build pricing admin UI**

Editable grid: aircraft classes as rows, services as columns, base prices as cells. Add-on pricing table. Travel fee, rush multiplier, deposit % config. Real-time preview calculator.

**Step 3: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/pricing/ apps/api/src/routes/pricing-rules.ts
git commit -m "feat: add pricing rules admin with editable grid"
```

---

### Task 8.5: Customer CRM Page

**Files:**
- Create: `apps/web/src/app/(dashboard)/customers/page.tsx`
- Create: `apps/web/src/app/(dashboard)/customers/[id]/page.tsx`

**Step 1: Build customer list**

Searchable/filterable table. Columns: name, email, total bookings, lifetime value, last booking.

**Step 2: Build customer detail**

Contact info, aircraft list (tail numbers), booking history timeline, notes editor, tags.

**Step 3: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/customers/
git commit -m "feat: add customer CRM pages"
```

---

### Task 8.6: Crew Management Page

**Files:**
- Create: `apps/web/src/app/(dashboard)/crew/page.tsx`
- Create: `apps/api/src/routes/crew.ts`

**Step 1: Build crew management API**

- `GET /api/crew` — list crew members
- `POST /api/crew` — add crew member (creates User with technician role)
- `PUT /api/crew/:id` — update
- `GET /api/crew/:id/schedule` — get availability
- `PUT /api/crew/:id/schedule` — set weekly availability

**Step 2: Build crew management UI**

Crew member cards. Add/edit form (name, email, phone, skills, home base airport). Weekly availability grid (toggle time blocks). Performance stats.

**Step 3: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/crew/ apps/api/src/routes/crew.ts
git commit -m "feat: add crew management pages and API"
```

---

### Task 8.7: Payments Dashboard

**Files:**
- Create: `apps/web/src/app/(dashboard)/payments/page.tsx`
- Create: `apps/api/src/routes/payments.ts`

**Step 1: Build payments API**

- `GET /api/payments` — list payments (filterable by status, date range)
- `POST /api/payments/:id/capture` — capture balance payment
- `POST /api/payments/:id/refund` — process refund
- `GET /api/payments/stats` — revenue summary

**Step 2: Build payments UI**

Summary cards (pending deposits, to capture, completed, refunded). Payment list table with actions. Revenue chart (daily/weekly/monthly).

**Step 3: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/payments/ apps/api/src/routes/payments.ts
git commit -m "feat: add payments dashboard and API"
```

---

### Task 8.8: Settings Page

**Files:**
- Create: `apps/web/src/app/(dashboard)/settings/page.tsx`
- Create: `apps/api/src/routes/settings.ts`

**Step 1: Build settings API**

`GET /api/settings` — returns business settings.
`PUT /api/settings` — update settings.

Settings sections: business profile, service areas, booking policies, notification templates, operating hours.

**Step 2: Build settings UI**

Tabbed layout. Each section is a form. Service area map (show radius around home base). Notification template editor with variable tokens.

**Step 3: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/settings/ apps/api/src/routes/settings.ts
git commit -m "feat: add settings page and API"
```

---

## Phase 9: Technician Mobile View

### Task 9.1: Technician Layout & Job List

**Files:**
- Create: `apps/web/src/app/(tech)/layout.tsx`
- Create: `apps/web/src/app/(tech)/jobs/page.tsx`
- Create: `apps/api/src/routes/tech-jobs.ts`

**Step 1: Build tech-specific API**

`GET /api/tech/jobs/today` — returns today's assigned bookings for authenticated technician.
`GET /api/tech/jobs/:id` — full job detail with checklist and customer info.

**Step 2: Build mobile-first job list**

Cards showing: time, airport, aircraft type, service, customer name. Sorted by scheduled time. Tap to navigate to detail. Bottom navigation bar.

**Step 3: Commit**

```bash
git add apps/web/src/app/\(tech\)/ apps/api/src/routes/tech-jobs.ts
git commit -m "feat: add technician job list and API"
```

---

### Task 9.2: Job Detail & Checklist

**Files:**
- Create: `apps/web/src/app/(tech)/jobs/[id]/page.tsx`

**Step 1: Build job detail view**

Aircraft info card. Location with navigation link. Customer contact (tap to call/text). Checklist with checkboxes (API calls to toggle). Notes text area. Status action buttons (Start / Complete / Report Issue).

**Step 2: Commit**

```bash
git add apps/web/src/app/\(tech\)/jobs/
git commit -m "feat: add technician job detail with checklist"
```

---

### Task 9.3: Photo Upload

**Files:**
- Create: `apps/web/src/app/(tech)/jobs/[id]/photos.tsx`
- Create: `apps/api/src/routes/photos.ts`
- Create: `apps/api/src/services/cloudinary.ts`

**Step 1: Set up Cloudinary service**

Install: `cd apps/api && pnpm add cloudinary`

File: `apps/api/src/services/cloudinary.ts`
Upload function that returns URL and publicId.

**Step 2: Build photo upload API**

`POST /api/photos/upload` — multipart upload, stores to Cloudinary, creates JobPhoto record.
`GET /api/bookings/:id/photos` — list photos for a booking.

**Step 3: Build photo upload UI**

Camera button (uses device camera via `<input type="file" capture="environment">`). Before/after photo tabs. Grid preview of uploaded photos.

**Step 4: Commit**

```bash
git add apps/web/src/app/\(tech\)/jobs/ apps/api/src/routes/photos.ts apps/api/src/services/cloudinary.ts
git commit -m "feat: add photo upload for technician view"
```

---

### Task 9.4: Offline Support (Service Worker)

**Files:**
- Create: `apps/web/public/sw.js`
- Create: `apps/web/src/lib/offline-queue.ts`

**Step 1: Create service worker**

Cache tech job data for offline viewing. Queue status updates and photo uploads for when connectivity returns. Use Workbox for caching strategies.

Install: `cd apps/web && pnpm add workbox-precaching workbox-routing workbox-strategies`

**Step 2: Create offline queue**

IndexedDB-backed queue for pending actions. Sync when online. Conflict resolution (server wins for status, queue wins for photos).

**Step 3: Register service worker in tech layout**

**Step 4: Commit**

```bash
git add apps/web/public/sw.js apps/web/src/lib/offline-queue.ts apps/web/src/app/\(tech\)/layout.tsx
git commit -m "feat: add offline support for technician view"
```

---

## Phase 10: Notifications

### Task 10.1: Notification Service

**Files:**
- Create: `apps/api/src/services/notifications.ts`
- Create: `apps/api/src/services/sendr.ts`
- Create: `apps/api/src/services/twilio.ts`

**Step 1: Create Sendr email service**

Install: Sendr SDK (check their docs for package name).

Functions: `sendBookingConfirmation()`, `sendReminder()`, `sendJobComplete()`. Each takes booking data, renders template, sends via Sendr, logs to NotificationLog.

**Step 2: Create Twilio SMS service**

Install: `cd apps/api && pnpm add twilio`

Functions: `sendSMS()` wrapper. Short message templates for each event type.

**Step 3: Create unified notification service**

File: `apps/api/src/services/notifications.ts`

Orchestrates both channels. Takes a notification type + booking data, sends both email and SMS, logs both.

```typescript
export async function sendBookingNotification(type: NotificationType, booking: BookingWithDetails) {
  const results = await Promise.allSettled([
    sendEmail(type, booking),
    sendSMS(type, booking),
  ]);
  // Log results to NotificationLog
}
```

**Step 4: Commit**

```bash
git add apps/api/src/services/notifications.ts apps/api/src/services/sendr.ts apps/api/src/services/twilio.ts
git commit -m "feat: add notification service with email and SMS"
```

---

### Task 10.2: Calendar Invite (.ics) Generation

**Files:**
- Create: `apps/api/src/services/calendar.ts`

**Step 1: Install ical generator**

Run: `cd apps/api && pnpm add ical-generator`

**Step 2: Create .ics generation function**

Takes booking data, generates .ics file content. Attach to confirmation email. Also serve via GET endpoint for "Add to Calendar" button.

**Step 3: Commit**

```bash
git add apps/api/src/services/calendar.ts
git commit -m "feat: add calendar invite generation"
```

---

### Task 10.3: Reminder Cron Job

**Files:**
- Create: `apps/api/src/cron/reminders.ts`
- Modify: `apps/api/src/index.ts`

**Step 1: Install cron library**

Run: `cd apps/api && pnpm add node-cron`

**Step 2: Create reminder cron**

Runs every 15 minutes. Finds bookings scheduled within the configured reminder window that haven't been reminded yet. Sends reminder notification.

**Step 3: Commit**

```bash
git add apps/api/src/cron/reminders.ts apps/api/src/index.ts
git commit -m "feat: add reminder cron job"
```

---

## Phase 11: Multi-Tenancy & Onboarding

### Task 11.1: Subdomain Routing (Frontend)

**Files:**
- Create: `apps/web/src/middleware.ts` (Next.js middleware)
- Modify: `apps/web/next.config.js`

**Step 1: Create Next.js middleware for subdomain resolution**

```typescript
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const subdomain = host.split(".")[0];

  // Skip for localhost, www, or app subdomain
  if (["localhost", "www", "app", "localhost:3000"].includes(subdomain)) {
    return NextResponse.next();
  }

  // Set subdomain header for API calls
  const response = NextResponse.next();
  response.headers.set("x-business-subdomain", subdomain);
  return response;
}
```

**Step 2: Configure Next.js for wildcard subdomains**

**Step 3: Commit**

```bash
git add apps/web/src/middleware.ts apps/web/next.config.js
git commit -m "feat: add subdomain routing middleware"
```

---

### Task 11.2: Business Onboarding Flow

**Files:**
- Create: `apps/web/src/app/(dashboard)/onboarding/page.tsx`
- Create: `apps/api/src/routes/onboarding.ts`

**Step 1: Create onboarding API**

`POST /api/onboarding` — creates Business, Owner User, default Services, default PricingRules, Stripe Connect account.

Steps:
1. Business info (name, email, phone, subdomain)
2. Stripe Connect onboarding redirect
3. Configure services and pricing
4. Set service area (home base airport + radius)
5. Done — redirect to dashboard

**Step 2: Build onboarding wizard UI**

Multi-step form. Each step validates before proceeding. Stripe Connect redirect handled via popup/redirect.

**Step 3: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/onboarding/ apps/api/src/routes/onboarding.ts
git commit -m "feat: add business onboarding flow"
```

---

### Task 11.3: Default Seed Data for New Business

**Files:**
- Create: `apps/api/src/services/business-setup.ts`

**Step 1: Create business setup service**

When a new business is created:
1. Create 3 default services (Interior, Exterior, Full Detail)
2. Create default add-ons (carpet shampoo, brightwork, ceramic coating, etc.)
3. Create default pricing rules (sensible defaults for each aircraft class × service)
4. Create default checklist templates per service
5. Set default booking settings (25% deposit, 24hr cancellation, 24hr reminder)

This ensures every new business is immediately functional.

**Step 2: Commit**

```bash
git add apps/api/src/services/business-setup.ts
git commit -m "feat: add default business setup service"
```

---

## Execution Order & Dependencies

```
Phase 1 (Foundation) → can start immediately
Phase 2 (Schema) → depends on Phase 1
Phase 3 (Auth) → depends on Phase 2
Phase 4 (Business Logic) → depends on Phase 2 (uses Prisma types), can parallel with Phase 3
Phase 5 (Booking API) → depends on Phases 3 + 4
Phase 6 (Payments) → depends on Phase 5
Phase 7 (Booking UI) → depends on Phase 5
Phase 8 (Admin Dashboard) → depends on Phase 5, can parallel with Phase 7
Phase 9 (Tech View) → depends on Phase 5
Phase 10 (Notifications) → depends on Phase 5, can parallel with Phases 7-9
Phase 11 (Multi-tenancy) → depends on Phase 5, can parallel with Phases 7-10
```

**Critical Path:** 1 → 2 → 3+4 → 5 → 6+7+8+9+10+11

Phases 7-11 can largely be built in parallel once Phase 5 (Booking API) is complete.

---

## Testing Strategy

- **Unit tests** (Vitest): Pricing engine, scheduling engine, distance calculation, RBAC
- **API tests** (Vitest + supertest): Every endpoint gets basic happy-path and error-case tests
- **E2E tests** (Playwright): Full booking flow, admin pricing update → booking price change, technician job completion
- **Load test** (optional): Concurrent booking creation to verify no double-bookings

---

## Estimated Task Count

| Phase | Tasks | Est. Time |
|-------|-------|-----------|
| 1. Foundation | 6 | Scaffolding |
| 2. Schema | 5 | Schema + seed |
| 3. Auth | 2 | Auth + RBAC |
| 4. Business Logic | 3 | Pricing + scheduling + distance |
| 5. Booking API | 6 | All booking endpoints |
| 6. Payments | 1 | Stripe Connect |
| 7. Booking UI | 9 | 6-step wizard + store + hooks |
| 8. Admin Dashboard | 8 | All admin pages |
| 9. Tech View | 4 | Jobs + checklist + photos + offline |
| 10. Notifications | 3 | Email + SMS + cron |
| 11. Multi-tenancy | 3 | Routing + onboarding + defaults |
| **Total** | **50 tasks** | |
