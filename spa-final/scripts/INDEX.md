# Scripts Directory Index

Quick reference guide to all available scripts and documentation.

## Available Scripts

### Production Scripts

| Script | Description | Command |
|--------|-------------|---------|
| `verify-env.ts` | Verify environment configuration and external service connections | `pnpm verify-env` |
| `generate-jwt-secrets.ts` | Generate cryptographically secure JWT secrets | `pnpm generate-secrets` |

## Documentation Files

### Getting Started

- **[QUICKSTART.md](./QUICKSTART.md)** - 5-minute setup guide to get your environment configured
  - Perfect for first-time setup
  - Step-by-step instructions
  - Common troubleshooting

### Comprehensive Reference

- **[README.md](./README.md)** - Complete documentation for all scripts
  - Detailed feature descriptions
  - All command-line options
  - Security best practices
  - Integration examples

### CI/CD Integration

- **[github-actions-example.yml](./github-actions-example.yml)** - GitHub Actions workflow template
  - Environment verification in CI/CD
  - Production readiness checks
  - Secret management examples

## Quick Commands

### First Time Setup

```bash
# 1. Generate JWT secrets
pnpm generate-secrets

# 2. Configure .env file (copy secrets from step 1)
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your values

# 3. Verify configuration
pnpm verify-env
```

### Daily Development

```bash
# Verify environment before starting
pnpm verify-env --skip-optional

# Generate new secrets when needed
pnpm generate-secrets --env
```

### Pre-Deployment

```bash
# Full verification including optional services
pnpm verify-env

# Generate production secrets (different from dev!)
pnpm generate-secrets --length 128
```

## Common Use Cases

### "I'm setting up the project for the first time"
👉 Start with [QUICKSTART.md](./QUICKSTART.md)

### "I need to understand all available options"
👉 Read the full [README.md](./README.md)

### "I'm deploying to production"
👉 See [README.md - Production Deployment Checklist](./README.md#production-deployment-checklist)

### "I want to add this to CI/CD"
👉 Use [github-actions-example.yml](./github-actions-example.yml)

### "Something isn't working"
👉 Check [QUICKSTART.md - Troubleshooting](./QUICKSTART.md#troubleshooting)

## Files Reference

```
scripts/
├── INDEX.md                      # This file - quick reference guide
├── README.md                     # Complete documentation
├── QUICKSTART.md                 # 5-minute setup guide
├── github-actions-example.yml    # CI/CD workflow template
├── verify-env.ts                 # Environment verification script
├── generate-jwt-secrets.ts       # JWT secret generator
└── .env.test                     # Test environment file
```

## Script Details

### verify-env.ts

**Purpose**: Validates your environment configuration and tests connections

**What it checks**:
- ✅ Required environment variables
- ✅ Database connection (PostgreSQL/Supabase)
- ✅ JWT secret strength
- ✅ Stripe API (optional)
- ✅ SendGrid email (optional)
- ✅ Twilio SMS (optional)
- ✅ Sentry error tracking (optional)
- ✅ CORS configuration

**Exit codes**:
- `0` = All required checks passed
- `1` = One or more required checks failed

**Common options**:
```bash
--skip-optional          # Skip all optional services
--skip-stripe           # Skip Stripe check
--env-file <path>       # Use custom env file
```

### generate-jwt-secrets.ts

**Purpose**: Generates cryptographically secure secrets for JWT authentication

**Features**:
- 🔐 Crypto-grade randomness (Node.js crypto.randomBytes)
- 📏 Configurable length (32+ bytes)
- 🎯 Multiple output formats (hex, base64, base64url)
- 📋 Easy clipboard copying
- ⚡ Entropy calculation

**Common options**:
```bash
--env                   # Output in .env format
--length <bytes>        # Secret length (default: 64)
--count <number>        # Number of secrets (default: 2)
--format <type>         # hex, base64, or base64url
```

## Integration with Project Scripts

These scripts integrate with your main package.json:

```json
{
  "scripts": {
    "verify-env": "tsx scripts/verify-env.ts",
    "generate-secrets": "tsx scripts/generate-jwt-secrets.ts",
    "prestart": "pnpm verify-env --skip-optional",
    "prebuild": "pnpm verify-env"
  }
}
```

You can add them as pre-hooks to ensure environment is always valid before critical operations.

## Security Reminders

🔴 **NEVER** commit `.env` files to version control

🟡 **ALWAYS** use different secrets for different environments

🟢 **ROTATE** secrets every 90 days

🔵 **VERIFY** production config before deployment

## Support & Troubleshooting

1. **First**: Check [QUICKSTART.md - Troubleshooting](./QUICKSTART.md#troubleshooting)
2. **Then**: Review [README.md - Common Workflows](./README.md#common-workflows)
3. **Finally**: Run verification with full output:
   ```bash
   pnpm verify-env 2>&1 | tee verification.log
   ```

## Contributing

When adding new scripts to this directory:

1. Add entry to this INDEX.md
2. Document in README.md
3. Add to package.json scripts if needed
4. Update QUICKSTART.md if it affects setup
5. Consider CI/CD integration examples

## Version Information

These scripts are compatible with:
- Node.js 18+
- TypeScript 5.x
- pnpm 8.x
- Prisma 5.x

---

**Last Updated**: 2026-01-14

**Quick Links**:
- [Quick Start Guide](./QUICKSTART.md)
- [Full Documentation](./README.md)
- [CI/CD Example](./github-actions-example.yml)
