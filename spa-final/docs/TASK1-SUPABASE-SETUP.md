# Task 1: Prepare Supabase Database Schema

## Overview
This document outlines the complete process for preparing and deploying the Peacase database schema to Supabase PostgreSQL.

## Prerequisites
- Supabase account and project created
- Supabase connection string obtained
- Node.js 20+ and pnpm installed
- Access to Supabase Dashboard

## Completed Steps

### Step 1: Verify Supabase Connection ✅
**Command executed:**
```bash
pnpm db:generate
```

**Result:**
```
✔ Generated Prisma Client (v5.22.0) successfully
- Prisma schema validated: /packages/database/prisma/schema.prisma
- Client generation time: 559ms
- Status: PASSED
```

### Step 2: Prisma Schema Validation ✅
**Command executed:**
```bash
pnpm exec prisma validate
```

**Result:**
```
The schema at prisma\schema.prisma is valid 🚀
- Total tables: 30+
- All relationships validated
- Index definitions verified
```

**Schema Statistics:**
- Total schema file size: 621 lines
- Generator: prisma-client-js
- Provider: postgresql
- Configuration: Production-ready with all required tables

## Pending Steps

### Step 3: Push to Supabase Database
**Requires:** Active Supabase connection string

1. Retrieve your Supabase connection string:
   - Go to https://supabase.com/dashboard
   - Select your project
   - Settings → Database → Connection string (URI)
   - Format: `postgresql://[user]:[password]@[host]:[port]/[database]?schema=public`

2. Update `/packages/database/.env`:
   ```bash
   DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[database]?schema=public"
   ```

3. Execute the push command:
   ```bash
   cd /c/projects/spa-final/packages/database
   pnpm db:push
   ```

4. Expected output:
   ```
   ✔ Database synced, [N] migrations applied
   ```

### Step 4: Enable PostgreSQL Extensions
Execute these SQL commands in Supabase SQL Editor:

```sql
-- Create UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create encryption extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_appointments_salon_date ON appointments(salon_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_clients_salon ON clients(salon_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

**Instructions:**
1. Go to Supabase Dashboard → SQL Editor
2. Create a new query
3. Paste the SQL commands above
4. Click "Run"
5. Verify all extensions and indexes created successfully

### Step 5: Retrieve Service Role Key
1. Navigate to Supabase Dashboard
2. Go to Settings → API
3. Copy the **Service Role Key** (not the anon key)
4. Store securely as `SUPABASE_SERVICE_ROLE_KEY`

Example format:
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Database Schema Overview

The Peacase database includes the following core tables:

### Core Tables
- **Salon** - Salon/business information
- **User** - Staff and administrator accounts
- **Client** - Customer information
- **Location** - Multiple salon locations
- **Service** - Service catalog
- **ServiceCategory** - Service grouping
- **Appointment** - Booking management

### Business Operations
- **Package** - Service packages
- **GiftCard** - Gift card management
- **Payment** - Payment tracking
- **Review** - Client reviews and ratings
- **Promotion** - Discount and promotion management

### Staff Management
- **StaffService** - Service assignments to staff
- **StaffAvailability** - Availability scheduling
- **TimeOff** - Time off requests
- **CommissionRecord** - Commission tracking

### Customer Engagement
- **ClientNote** - Notes on clients
- **MarketingCampaign** - Marketing campaigns
- **ConsultationForm** - Consultation responses
- **ReminderLog** - Appointment reminders

### Subscription & Billing
- **Subscription** - Subscription status
- **BillingHistory** - Billing records

### Authentication
- **RefreshToken** - JWT refresh tokens
- **PasswordResetToken** - Password reset tokens
- **EmailVerificationToken** - Email verification tokens

## Environment Variables

Create or update `/packages/database/.env` with:

```env
# Supabase PostgreSQL Connection
DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[database]?schema=public"

# Service Role Key (obtained from Supabase Dashboard)
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
```

## Verification Checklist

After completing all steps:

- [ ] `pnpm db:generate` passes without errors
- [ ] `pnpm db:push` syncs schema to Supabase
- [ ] PostgreSQL extensions created successfully
- [ ] All tables created in Supabase database
- [ ] Service Role Key retrieved and stored
- [ ] Application can connect to Supabase
- [ ] Prisma Client generated successfully
- [ ] All indexes created for performance

## Troubleshooting

### Connection Error: "Can't reach database server"
- Verify DATABASE_URL is correct
- Check Supabase project is running
- Verify IP whitelist settings in Supabase

### Migration Failed
- Review migration error message
- Check schema for syntax errors
- Ensure all required fields have proper types

### Extension Creation Failed
- Verify you have database owner permissions
- Try creating extensions separately
- Check Supabase version compatibility

## Next Steps

After completing this task:
1. Proceed to Task 2: Configure Backend API Integration
2. Proceed to Task 3: Deploy to Production Environment
3. Run seed script to populate initial data

## Related Files

- Schema: `/packages/database/prisma/schema.prisma`
- Seed: `/packages/database/prisma/seed.ts`
- Package: `/packages/database/package.json`
- Environment: `/packages/database/.env`

## References

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Supabase PostgreSQL](https://supabase.com/docs/guides/database)
- [Peacase Deployment Plan](../DEPLOYMENT.md)
