# Pecase Database Package

This is the database package for the Pecase salon management system. It contains the complete Prisma schema with all 20+ tables and database utilities.

## Overview

The database package provides:
- Complete Prisma ORM schema for PostgreSQL
- Singleton PrismaClient instance
- Development utilities and scripts
- Type-safe database access

## Schema Summary

### Core Entities (9 tables)
- **Salons**: Root entity representing salon businesses
- **Users**: Staff members with roles (admin, manager, staff, receptionist)
- **Clients**: Customer database with preferences and history
- **Services**: Service offerings with pricing and duration
- **Appointments**: Core scheduling table
- **Payments**: Financial transactions and payment tracking
- **Locations**: Multi-location support
- **ClientNotes**: Internal staff notes about clients
- **StaffLocations**: Junction table for staff-to-location assignments

### Feature Tables (12+ tables)
- **StaffAvailability**: Weekly availability schedule per staff member
- **TimeOff**: Vacation, sick leave, and time off periods
- **ServiceStaff**: Junction table for service-to-staff relationships
- **Packages**: Service bundles and memberships
- **PackageServices**: Junction table for package-to-service relationships
- **ClientPackages**: Client package purchases and renewals
- **GiftCards**: Digital gift card management
- **Reviews**: Client reviews and ratings
- **ReviewResponses**: Business responses to reviews
- **MarketingCampaigns**: Email and SMS marketing campaigns
- **ConsultationForms**: Customizable intake forms
- **FormResponses**: Client responses to consultation forms

## Key Features

### Data Integrity
- **UUID Primary Keys**: All tables use UUID for distributed system compatibility
- **Foreign Keys**: Proper relationships with cascading deletes where appropriate
- **Indexes**: Strategic indexes on foreign keys and frequently queried fields
- **Soft Deletes**: `isActive` boolean flags prevent hard deletes

### Timestamps
- **createdAt**: Automatic timestamp on record creation
- **updatedAt**: Automatic timestamp on record updates
- **Other timestamps**: Specific timestamps for relevant events (cancelledAt, submittedAt, etc.)

### Relationships
- **One-to-Many**: Salons → Users, Clients, Services, Appointments, etc.
- **Many-to-Many**: ServiceStaff, StaffLocations, PackageServices (with junction tables)
- **Optional Relations**: Using `?` for nullable relationships (e.g., preferredStaffId, locationId)

### Role-Based Access
The User model includes role field with values:
- **admin**: Full system access
- **manager**: Operational management
- **staff**: Service provider with limited access
- **receptionist**: Scheduling and client management

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
# or
pnpm install
```

### 2. Configure Database Connection
Update `.env` with your PostgreSQL connection string:
```
DATABASE_URL="postgresql://username:password@localhost:5432/pecase_dev"
```

### 3. Create Database Migrations
```bash
npm run db:migrate
# This will create the initial schema in your PostgreSQL database
```

### 4. Generate Prisma Client
```bash
npm run db:generate
```

### 5. Validate Schema
```bash
npm run db:validate
```

## Usage

### Import and Use PrismaClient
```typescript
import { prisma } from "@pecase/database";

// Query examples
const salons = await prisma.salon.findMany();
const appointments = await prisma.appointment.findUnique({
  where: { id: "uuid-here" },
  include: { client: true, staff: true, service: true }
});

// Create records
const newClient = await prisma.client.create({
  data: {
    salonId: "salon-uuid",
    firstName: "John",
    lastName: "Doe",
    phone: "555-0123",
    email: "john@example.com"
  }
});
```

### Type Safety
All database operations are fully typed with TypeScript:
```typescript
import { Prisma } from "@pecase/database";

// Types are automatically generated from schema
type Salon = Prisma.SalonGetPayload<{}>;
type UserWithRelations = Prisma.UserGetPayload<{ include: { salon: true } }>;
```

## Scripts

### Available Commands
```bash
# Database operations
npm run db:push          # Push schema changes to database
npm run db:migrate       # Create new migration and apply
npm run db:generate      # Generate Prisma Client
npm run db:reset         # Reset database (development only)
npm run db:validate      # Validate schema syntax

# Seeding (future)
npm run db:seed          # Seed database with initial data
```

## Schema Details

### Salons Table
Root entity containing salon information and subscription details.

**Key Fields:**
- `subscriptionPlan`: "base", "pro", "enterprise"
- `featuresEnabled`: JSON array of enabled feature flags
- `timezone`: IANA timezone string (default: America/Chicago)

### Users Table
Staff members with role-based access control.

**Key Fields:**
- `role`: "admin", "manager", "staff", "receptionist"
- `salonId`: Reference to parent salon (unique per email)

### Appointments Table
Core scheduling table with flexible pricing.

**Key Fields:**
- `status`: "confirmed", "pending", "completed", "no_show", "cancelled"
- `priceOverride`: Optional price adjustment
- `locationId`: Optional for multi-location support

### Payments Table
Flexible payment tracking supporting multiple methods.

**Key Fields:**
- `method`: "cash", "card", "online", "check", "other"
- `status`: "pending", "completed", "failed", "refunded"
- `stripeChargeId`: Integration with Stripe

### Packages Table
Service bundles and memberships.

**Key Fields:**
- `type`: "one_time", "recurring"
- `durationDays`: Expiration period for packages

## Indexes

Strategic indexes are defined for:
- Foreign key relationships (automatic)
- Frequently queried fields: `isActive`, `status`, `email`
- Date ranges: `startTime`, `endTime`, `purchaseDate`
- Unique constraints: `salonId`+`email`, `code`, `phone`

## Relationships Overview

```
Salon (1) ──→ (Many) Users
         ├──→ (Many) Clients
         ├──→ (Many) Services
         ├──→ (Many) Appointments
         ├──→ (Many) Payments
         ├──→ (Many) Locations
         ├──→ (Many) Packages
         └──→ (Many) Reviews

User (Staff) ──→ (1) Salon
            ├──→ (Many) Appointments
            ├──→ (Many) StaffLocations
            ├──→ (Many) StaffAvailability
            ├──→ (Many) TimeOff
            └──→ (Many) ClientNotes

Client ──→ (1) Salon
       ├──→ (Many) Appointments
       ├──→ (Many) ClientNotes
       ├──→ (Many) ClientPackages
       └──→ (Many) Reviews

Service ──→ (1) Salon
        ├──→ (Many) Appointments
        ├──→ (Many) ServiceStaff
        └──→ (Many) PackageServices

Appointment ──→ (1) Salon
            ├──→ (1) Client
            ├──→ (1) Staff
            ├──→ (1) Service
            ├──→ (Many) Payments
            └──→ (Many) Reviews

Package ──→ (1) Salon
        ├──→ (Many) PackageServices
        └──→ (Many) ClientPackages
```

## Environment Variables

### Required
- `DATABASE_URL`: PostgreSQL connection string

### Optional
- `NODE_ENV`: "development" or "production" (default: "development")

## Validation & Testing

### Schema Validation
```bash
npm run db:validate
```

This command validates:
- Schema syntax correctness
- Relationship integrity
- Constraint definitions

### Database Testing
Before pushing to production, test:
1. Connection string accessibility
2. Database permissions (create tables, indexes)
3. Migration consistency
4. Client generation

## Development Guidelines

### Adding New Tables
1. Add model to `prisma/schema.prisma`
2. Add relationships and indexes
3. Run `npm run db:migrate` with a descriptive name
4. Commit migration files

### Modifying Existing Tables
1. Update model definition
2. Run `npm run db:migrate -- --name <description>`
3. Review generated migration
4. Test with existing data

### Best Practices
- Always include timestamps (`createdAt`, `updatedAt`)
- Use UUID for all primary keys
- Add `isActive` boolean for soft deletes where appropriate
- Define relationships on both sides when possible
- Use descriptive field names (snake_case in schema = camelCase in TypeScript)
- Add indexes on foreign keys and frequently queried fields

## Troubleshooting

### Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database exists
- Verify user permissions

### Migration Issues
- Check for schema conflicts
- Review migration file for errors
- Roll back with `npm run db:reset` (development only)

### Type Generation Issues
- Run `npm run db:generate` explicitly
- Clear `node_modules/.prisma` cache
- Rebuild project

## Future Enhancements

- [ ] Database seeding scripts
- [ ] Data validation middleware
- [ ] Audit logging
- [ ] Soft delete helpers
- [ ] Query optimization tips
- [ ] Integration tests

## Support

For schema questions or issues, refer to:
- [Prisma Documentation](https://www.prisma.io/docs/)
- PRD Section 4: Data Model & Database Schema
- Team documentation on database conventions

## License

MIT
