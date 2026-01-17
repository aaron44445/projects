# Environment Setup & Verification Guide

This project includes comprehensive environment verification scripts to ensure your configuration is correct before deployment.

## 🚀 Quick Start (5 Minutes)

### Step 1: Generate Secure JWT Secrets

```bash
pnpm generate-secrets
```

This will output two cryptographically secure secrets. Copy them for the next step.

### Step 2: Configure Environment Variables

```bash
# Copy the example file
cp apps/api/.env.example apps/api/.env

# Edit apps/api/.env and paste your secrets
# Also update DATABASE_URL, API_BASE_URL, and CORS_ORIGIN
```

### Step 3: Verify Your Configuration

```bash
pnpm verify-env
```

You should see all green checkmarks ✓ indicating your environment is properly configured.

## 📋 What's Included

### Scripts

1. **`verify-env.ts`** - Comprehensive environment verification
   - Checks all required environment variables
   - Tests database connection (PostgreSQL/Supabase)
   - Validates JWT secret strength
   - Tests optional services (Stripe, SendGrid, Twilio, Sentry)
   - Verifies CORS configuration

2. **`generate-jwt-secrets.ts`** - Secure secret generation
   - Generates cryptographically strong secrets
   - Configurable length and format
   - Multiple output options

### Documentation

- **[scripts/QUICKSTART.md](./scripts/QUICKSTART.md)** - Start here for first-time setup
- **[scripts/README.md](./scripts/README.md)** - Complete reference documentation
- **[scripts/INDEX.md](./scripts/INDEX.md)** - Quick reference guide
- **[scripts/INTEGRATION.md](./scripts/INTEGRATION.md)** - CI/CD and workflow integration
- **[scripts/github-actions-example.yml](./scripts/github-actions-example.yml)** - GitHub Actions template

## 🔧 Available Commands

```bash
# Generate JWT secrets
pnpm generate-secrets
pnpm generate-secrets -- --env          # Output in .env format
pnpm generate-secrets -- --length 128   # Generate longer secrets

# Verify environment
pnpm verify-env                          # Full verification
pnpm verify-env -- --skip-optional       # Skip optional services
pnpm verify-env -- --skip-stripe         # Skip specific service
```

## ✅ Verification Checklist

The verification script checks:

### Required (Must Pass)
- [x] DATABASE_URL is set and valid
- [x] Database connection works
- [x] NODE_ENV is set
- [x] API_PORT is set
- [x] API_BASE_URL is set
- [x] JWT_SECRET is set and strong (32+ characters)
- [x] JWT_REFRESH_SECRET is set and strong (32+ characters)
- [x] JWT secrets are different
- [x] CORS_ORIGIN is set and valid

### Optional (Can Skip)
- [ ] Stripe API key is valid and working
- [ ] SendGrid API key is valid
- [ ] Twilio credentials are valid
- [ ] Sentry DSN is valid

## 🔒 Security Features

### JWT Secret Validation
- Minimum 32 bytes (256 bits)
- Recommended 64 bytes (512 bits)
- Checks for placeholder values
- Ensures secrets are different
- Validates strength

### Database Connection
- Tests PostgreSQL connection
- Validates URL format
- Checks SSL mode for production

### API Key Validation
- Stripe: Validates format, checks test vs live keys
- SendGrid: Validates format (must start with SG.)
- Twilio: Validates Account SID format (must start with AC)
- Sentry: Validates DSN URL format

### CORS Security
- Warns about wildcard (*) in production
- Validates URL formats
- Checks consistency with web URLs

## 📊 Example Output

### Successful Verification

```
╔════════════════════════════════════════════════════════╗
║       Environment Configuration Verification          ║
╚════════════════════════════════════════════════════════╝

━━━ Required Environment Variables ━━━
✓ DATABASE_URL: Set
✓ NODE_ENV: Set
✓ JWT_SECRET: Set
✓ JWT_REFRESH_SECRET: Set

━━━ Database Connection (PostgreSQL) ━━━
✓ Database URL Format: Valid PostgreSQL URL
✓ Database Connection Test: Successfully connected

━━━ JWT Configuration ━━━
✓ JWT_SECRET Strength: Strong (128 chars)
✓ JWT_REFRESH_SECRET Strength: Strong (128 chars)

━━━ Summary ━━━
✓ ALL REQUIRED CHECKS PASSED
```

### Failed Verification

```
━━━ JWT Configuration ━━━
✗ JWT_SECRET Strength: Too short (16 chars, minimum 32)

Action required:
1. Run: pnpm generate-secrets
2. Update your .env file with the new secrets
3. Run this script again to verify
```

## 🏗️ Integration Examples

### Pre-commit Hook (Husky)

```bash
# .husky/pre-commit
pnpm verify-env --skip-optional
```

### CI/CD Pipeline

```yaml
# .github/workflows/verify.yml
- name: Verify Environment
  run: pnpm verify-env --skip-optional
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    JWT_SECRET: ${{ secrets.JWT_SECRET }}
```

### Package.json Pre-hooks

```json
{
  "scripts": {
    "predev": "pnpm verify-env --skip-optional",
    "prebuild": "pnpm verify-env"
  }
}
```

## 🔄 Development Workflow

### First Time Setup
1. Clone repository
2. Run `pnpm install`
3. Run `pnpm generate-secrets`
4. Copy secrets to `.env` file
5. Update other required variables
6. Run `pnpm verify-env`
7. Start development: `pnpm dev`

### Daily Development
1. Pull latest changes
2. Run `pnpm verify-env --skip-optional`
3. Start coding

### Before Deployment
1. Generate production secrets: `pnpm generate-secrets --length 128`
2. Update production environment variables
3. Run full verification: `pnpm verify-env`
4. Deploy with confidence

## 🛠️ Troubleshooting

### Database Connection Failed

**Problem**: Can't connect to database

**Solutions**:
1. Check DATABASE_URL format: `postgresql://user:password@host:port/database`
2. Verify database is running and accessible
3. Check firewall/IP whitelist settings
4. For Supabase: Get connection string from Project Settings → Database

### JWT Secret Too Short

**Problem**: JWT_SECRET is too short

**Solution**:
```bash
pnpm generate-secrets
# Copy the output to your .env file
```

### Prisma Client Not Generated

**Problem**: Database connection test skipped

**Solution**:
```bash
pnpm db:generate
pnpm verify-env
```

### CORS Wildcard in Production

**Problem**: Security warning about CORS

**Solution**:
```bash
# In .env.production
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

## 📚 Documentation Reference

| Document | Purpose | When to Use |
|----------|---------|-------------|
| [QUICKSTART.md](./scripts/QUICKSTART.md) | 5-minute setup guide | First time setup |
| [README.md](./scripts/README.md) | Complete documentation | Full reference |
| [INDEX.md](./scripts/INDEX.md) | Quick reference | Finding specific info |
| [INTEGRATION.md](./scripts/INTEGRATION.md) | CI/CD integration | Setting up automation |

## 🎯 Production Deployment Checklist

Before deploying to production:

- [ ] Generate new production secrets (different from dev!)
- [ ] Set all required environment variables in hosting platform
- [ ] Run `pnpm verify-env` with production config
- [ ] Ensure all required checks pass
- [ ] Verify Stripe uses live key (sk_live_*)
- [ ] Verify CORS is not wildcard (*)
- [ ] Test database connection
- [ ] Configure Sentry for error tracking
- [ ] Set up SendGrid for emails
- [ ] Set up Twilio for SMS
- [ ] Document all environment variables
- [ ] Store secrets securely

## 🔐 Environment Variables Reference

### Required

```bash
DATABASE_URL=postgresql://user:password@host:5432/database
NODE_ENV=production
API_PORT=3001
API_BASE_URL=https://api.yourapp.com
JWT_SECRET=<64-byte-hex-string>
JWT_REFRESH_SECRET=<64-byte-hex-string>
CORS_ORIGIN=https://yourapp.com
```

### Optional

```bash
STRIPE_SECRET_KEY=sk_live_xxxxx
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@yourapp.com
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_FROM_NUMBER=+1234567890
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

## 💡 Tips & Best Practices

1. **Different Secrets Per Environment**: Never reuse secrets across dev, staging, and production
2. **Secret Rotation**: Rotate JWT secrets every 90 days
3. **Version Control**: Never commit .env files to git
4. **Secret Management**: Use your hosting platform's secret management (Vercel, Railway, etc.)
5. **Verification Before Deploy**: Always run verification before deploying
6. **Test in Staging**: Test configuration in staging before production
7. **Monitor After Deploy**: Watch for authentication errors after secret rotation

## 🆘 Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review the [QUICKSTART.md](./scripts/QUICKSTART.md) guide
3. Read the full [README.md](./scripts/README.md) documentation
4. Run verification and save output: `pnpm verify-env 2>&1 | tee verify.log`

## 📝 Next Steps

After setting up your environment:

1. ✅ Environment verified
2. Run database migrations: `pnpm db:migrate`
3. Seed the database: `pnpm --filter @peacase/database db:seed`
4. Start development: `pnpm dev`
5. Build for production: `pnpm build`

---

**Created**: 2026-01-14
**Location**: `C:\projects\spa-final\scripts\`
**Maintained by**: Peacase Development Team
