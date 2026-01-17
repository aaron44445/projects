# Quick Start Guide

Get your environment configured and verified in minutes.

## Prerequisites

- Node.js 18+ installed
- pnpm package manager
- Access to your PostgreSQL/Supabase database

## Step 1: Install Dependencies

```bash
# From the root directory
pnpm install
```

## Step 2: Generate JWT Secrets

```bash
# Generate two secure secrets (JWT_SECRET and JWT_REFRESH_SECRET)
pnpm generate-secrets
```

You'll see output like this:

```
╔════════════════════════════════════════════════════════╗
║                                                        ║
║            JWT Secret Generator                        ║
║                                                        ║
╚════════════════════════════════════════════════════════╝

Configuration:
  Length: 64 bytes
  Format: hex
  Count:  2
  Entropy: 512 bits
  Security: STRONG

Generated Secrets:

Secret 1:
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2...

Secret 2:
z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4z3y2x1w0v9u8...
```

**Copy these secrets** - you'll need them in the next step!

### Alternative: Generate in .env Format

```bash
# Output directly in .env format for easy copying
pnpm generate-secrets -- --env

# Copy to clipboard (Windows)
pnpm generate-secrets -- --env | clip

# Copy to clipboard (macOS)
pnpm generate-secrets -- --env | pbcopy
```

## Step 3: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```

2. Edit `apps/api/.env` and update the following **required** variables:

   ```bash
   # Database - Get from your Supabase project settings
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[HOST]:5432/postgres

   # JWT Secrets - Paste from Step 2
   JWT_SECRET=<paste-secret-1-here>
   JWT_REFRESH_SECRET=<paste-secret-2-here>

   # API URLs
   API_BASE_URL=https://api.yourapp.com  # Your production API URL

   # CORS - Your frontend URL
   CORS_ORIGIN=https://yourapp.com
   ```

3. (Optional) Configure optional services:

   ```bash
   # Stripe - For payments
   STRIPE_SECRET_KEY=sk_test_xxxxx

   # SendGrid - For email
   SENDGRID_API_KEY=SG.xxxxx
   SENDGRID_FROM_EMAIL=noreply@yourapp.com

   # Twilio - For SMS
   TWILIO_ACCOUNT_SID=ACxxxxx
   TWILIO_AUTH_TOKEN=xxxxx
   TWILIO_FROM_NUMBER=+1234567890

   # Sentry - For error tracking
   SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
   ```

## Step 4: Verify Configuration

```bash
# Verify all required configuration
pnpm verify-env

# Skip optional services if not configured
pnpm verify-env -- --skip-optional
```

You should see output like this:

```
╔════════════════════════════════════════════════════════╗
║                                                        ║
║       Environment Configuration Verification          ║
║                                                        ║
╚════════════════════════════════════════════════════════╝

━━━ Required Environment Variables ━━━

✓ DATABASE_URL: Set
✓ NODE_ENV: Set
✓ API_PORT: Set
✓ API_BASE_URL: Set
✓ JWT_SECRET: Set
✓ JWT_REFRESH_SECRET: Set
✓ CORS_ORIGIN: Set

━━━ Database Connection (PostgreSQL) ━━━

✓ Database URL Format: Valid PostgreSQL URL
✓ Database Connection Test: Successfully connected to database

━━━ JWT Configuration ━━━

✓ JWT_SECRET Strength: Strong (128 chars)
✓ JWT_REFRESH_SECRET Strength: Strong (128 chars)

━━━ CORS Configuration ━━━

✓ CORS_ORIGIN Configuration: Valid origin(s): 1 configured

━━━ Summary ━━━

Total checks: 12
Passed: 12
Failed: 0

Required checks: 12
Required passed: 12
Required failed: 0

✓ ALL REQUIRED CHECKS PASSED
```

## Step 5: Start Development

```bash
# Start the development server
pnpm dev
```

## Troubleshooting

### Database Connection Failed

**Problem**: `Database Connection Test: Connection failed`

**Solutions**:
1. Verify your `DATABASE_URL` is correct
2. Check if your database is accessible (firewall, IP whitelist)
3. Ensure you're using the correct connection string format:
   ```
   postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
   ```
4. For Supabase, get the connection string from:
   - Project Settings → Database → Connection String → URI

### JWT Secret Too Short

**Problem**: `JWT_SECRET Strength: Too short`

**Solution**:
1. Run: `pnpm generate-secrets`
2. Copy the new secrets to your `.env` file
3. Secrets must be at least 32 bytes (64 hex characters)

### CORS Wildcard Warning

**Problem**: `Security risk: Wildcard (*) CORS in production`

**Solution**:
1. Set specific origins in production:
   ```bash
   CORS_ORIGIN=https://yourapp.com,https://www.yourapp.com
   ```
2. Wildcard `*` is OK for local development only

### Module Not Found

**Problem**: Cannot find module '@prisma/client'

**Solution**:
```bash
# Generate Prisma client
pnpm db:generate

# Then verify again
pnpm verify-env
```

## Environment-Specific Configuration

### Development

```bash
NODE_ENV=development
API_BASE_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_xxxxx  # Use test keys
```

### Staging

```bash
NODE_ENV=staging
API_BASE_URL=https://api-staging.yourapp.com
CORS_ORIGIN=https://staging.yourapp.com
STRIPE_SECRET_KEY=sk_test_xxxxx  # Still test keys
```

### Production

```bash
NODE_ENV=production
API_BASE_URL=https://api.yourapp.com
CORS_ORIGIN=https://yourapp.com,https://www.yourapp.com
STRIPE_SECRET_KEY=sk_live_xxxxx  # Live keys only in production
```

**Important**:
- Use **different JWT secrets** for each environment
- Never use the same secrets across environments
- Rotate secrets regularly (every 90 days)

## Next Steps

1. ✅ Environment configured and verified
2. ✅ Database connected
3. ✅ JWT secrets set

Now you can:
- Run database migrations: `pnpm db:migrate`
- Seed the database: `pnpm --filter @peacase/database db:seed`
- Start building your application
- Deploy to production with confidence

## Additional Resources

- [Full Documentation](./README.md)
- [Environment Variables Reference](./.env.example)
- [Security Best Practices](./README.md#security-best-practices)

## Support

If you encounter issues:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review the full [README.md](./README.md)
3. Ensure all dependencies are installed: `pnpm install`
4. Check your Node.js version: `node --version` (must be 18+)
