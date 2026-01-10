# Pecase Database - Quick Start Guide

Get the Pecase database up and running in 5 minutes.

## Prerequisites

- Node.js 18+ and npm/pnpm
- PostgreSQL 12+ installed and running locally
- Basic terminal familiarity

## Step 1: Install Dependencies

```bash
npm install
# or
pnpm install
```

## Step 2: Configure Database Connection

1. Create local PostgreSQL database:
```bash
createdb pecase_dev
```

2. Update `.env` file:
```
DATABASE_URL="postgresql://your_username:your_password@localhost:5432/pecase_dev"
```

3. Test the connection:
```bash
npm run db:validate
```

## Step 3: Create Database Schema

```bash
npm run db:migrate -- --name initial_schema
```

This creates all 21 tables in your PostgreSQL database.

## Step 4: Generate Prisma Client

```bash
npm run db:generate
```

This generates TypeScript types based on your schema.

## Step 5: Verify Installation

```bash
npm run db:validate
```

Expected output: ✓ Schema validation succeeded

## Basic Usage

### Import PrismaClient

```typescript
import { prisma } from "@pecase/database";
```

### Create Records

```typescript
// Create a salon
const salon = await prisma.salon.create({
  data: {
    name: "Beautiful Salon",
    email: "owner@salon.com",
    phone: "555-0123",
    address: "123 Main St",
    city: "Chicago",
    state: "IL",
    zip: "60601",
    timezone: "America/Chicago"
  }
});

// Create a staff member
const user = await prisma.user.create({
  data: {
    salonId: salon.id,
    email: "stylist@salon.com",
    passwordHash: "hashed_password_here",
    firstName: "Jane",
    lastName: "Doe",
    role: "staff"
  }
});

// Create a client
const client = await prisma.client.create({
  data: {
    salonId: salon.id,
    firstName: "John",
    lastName: "Client",
    phone: "555-1234",
    email: "john@example.com",
    communicationPreference: "email"
  }
});
```

### Query Records

```typescript
// Get all appointments for today
const appointments = await prisma.appointment.findMany({
  where: {
    startTime: {
      gte: new Date(new Date().setHours(0, 0, 0, 0)),
      lt: new Date(new Date().setHours(24, 0, 0, 0))
    }
  },
  include: {
    client: true,
    staff: true,
    service: true
  }
});

// Get client with full history
const client = await prisma.client.findUnique({
  where: { id: "client-uuid" },
  include: {
    appointments: true,
    clientNotes: true,
    reviews: true,
    payments: true
  }
});
```

### Update Records

```typescript
// Update client preferences
const updated = await prisma.client.update({
  where: { id: "client-uuid" },
  data: {
    preferredStaffId: "staff-uuid",
    communicationPreference: "sms"
  }
});
```

### Delete Records

```typescript
// Soft delete (recommended)
const deleted = await prisma.client.update({
  where: { id: "client-uuid" },
  data: { isActive: false }
});

// Hard delete (use with caution)
const hardDeleted = await prisma.client.delete({
  where: { id: "client-uuid" }
});
```

## Available Scripts

```bash
# Validate schema syntax
npm run db:validate

# Create new migration after schema changes
npm run db:migrate

# Push schema directly to database (dev only)
npm run db:push

# Generate Prisma Client types
npm run db:generate

# Reset database (WARNING: deletes all data)
npm run db:reset

# Seed database with initial data (future)
npm run db:seed
```

## Common Tasks

### Add a New Table

1. Add model to `prisma/schema.prisma`
2. Run migration:
   ```bash
   npm run db:migrate -- --name describe_change
   ```
3. Generate client:
   ```bash
   npm run db:generate
   ```

### Modify Existing Table

1. Update model in `prisma/schema.prisma`
2. Run migration:
   ```bash
   npm run db:migrate -- --name describe_change
   ```
3. Generate client:
   ```bash
   npm run db:generate
   ```

### View Database

Use PostgreSQL client:
```bash
psql pecase_dev

# List all tables
\dt

# View specific table
\d appointments

# Run queries
SELECT * FROM salons;
```

## Troubleshooting

### Connection Error
**Problem**: `Can't reach database server`
- Verify PostgreSQL is running: `psql postgres`
- Check DATABASE_URL in .env
- Verify username/password
- Create database if missing: `createdb pecase_dev`

### Migration Failed
**Problem**: `Migration failed`
- Check error message in terminal
- Verify schema syntax: `npm run db:validate`
- Review Prisma docs: https://pris.ly/d/prisma-migrate

### Type Generation Failed
**Problem**: `Prisma Client generation failed`
- Clear cache: `rm -rf node_modules/.prisma`
- Reinstall: `npm install`
- Generate: `npm run db:generate`

### Port Already in Use
**Problem**: `Port 5432 already in use`
- Kill existing PostgreSQL process
- Or use different port in DATABASE_URL

## Testing the Schema

Create a test file `test-db.ts`:

```typescript
import { prisma } from "@pecase/database";

async function main() {
  // Test connection
  const salons = await prisma.salon.findMany();
  console.log("Salons:", salons.length);

  // Test create
  const salon = await prisma.salon.create({
    data: {
      name: "Test Salon",
      email: "test@example.com",
      phone: "555-0000",
      address: "123 Test St",
      city: "TestCity",
      state: "TS",
      zip: "12345"
    }
  });
  console.log("Created salon:", salon.id);

  // Cleanup
  await prisma.salon.delete({ where: { id: salon.id } });
  console.log("Deleted test salon");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
```

Run with:
```bash
npx tsx test-db.ts
```

## Environment Variables

### Required
- `DATABASE_URL`: PostgreSQL connection string

### Optional
- `NODE_ENV`: Set to "development" or "production"
- `DEBUG`: Set to "prisma:query" for SQL logging

## Schema Overview

**21 Tables Across 4 Categories:**

### Core (9 tables)
Salons, Users, Clients, Services, Appointments, Payments, Locations, ClientNotes, GiftCards

### Scheduling (4 tables)
StaffAvailability, TimeOff, ServiceStaff, StaffLocation

### Packages (3 tables)
Packages, PackageServices, ClientPackages

### Features (5 tables)
Reviews, ReviewResponses, MarketingCampaigns, ConsultationForms, FormResponses

## Documentation

- **README.md** - Full setup and usage guide
- **SCHEMA.md** - Complete schema reference (27KB)
- **IMPLEMENTATION.md** - Implementation details

## Next Steps

1. Install dependencies
2. Configure database connection
3. Run migrations
4. Import PrismaClient in your API
5. Start building features!

## Support

- Prisma Docs: https://www.prisma.io/docs/
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Schema Reference: See SCHEMA.md in this directory

---

**Ready to build!** 🚀
