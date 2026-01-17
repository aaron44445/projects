# Environment Verification Scripts

This directory contains utility scripts for managing and verifying your environment configuration.

## Scripts

### 1. `verify-env.ts`

Comprehensive environment variable verification script that validates all required configuration and tests connections to external services.

#### Features

- **Required Environment Variables**: Validates all necessary environment variables are set
- **Database Connection**: Tests PostgreSQL/Supabase connection using Prisma
- **JWT Secret Strength**: Verifies JWT secrets meet minimum security requirements (32+ characters)
- **Stripe Integration**: Validates API key format and tests connection (optional)
- **SendGrid Email**: Validates API key and email configuration (optional)
- **Twilio SMS**: Validates credentials and phone number format (optional)
- **Sentry Error Tracking**: Validates DSN and initialization (optional)
- **CORS Configuration**: Validates CORS settings and checks for security issues

#### Usage

```bash
# Basic verification
pnpm tsx scripts/verify-env.ts

# Use custom env file
pnpm tsx scripts/verify-env.ts --env-file /path/to/.env

# Skip all optional services
pnpm tsx scripts/verify-env.ts --skip-optional

# Skip specific services
pnpm tsx scripts/verify-env.ts --skip-stripe --skip-sendgrid

# Using npm script
pnpm verify-env
```

#### Options

- `--env-file <path>` - Use custom env file path (default: `apps/api/.env`)
- `--skip-optional` - Skip all optional service checks
- `--skip-stripe` - Skip Stripe validation
- `--skip-sendgrid` - Skip SendGrid validation
- `--skip-twilio` - Skip Twilio validation
- `--skip-sentry` - Skip Sentry validation

#### Exit Codes

- `0` - All required checks passed
- `1` - One or more required checks failed

#### Output

The script provides color-coded output:
- 🟢 **Green** - Check passed
- 🔴 **Red** - Check failed (critical for required checks)
- 🟡 **Yellow** - Warning or acceptable with caveats
- 🔵 **Blue** - Optional/informational

### 2. `generate-jwt-secrets.ts`

Generates cryptographically secure JWT secrets for use in environment variables.

#### Features

- **Secure Generation**: Uses Node.js crypto.randomBytes for cryptographic randomness
- **Configurable Length**: Generate secrets from 32 to unlimited bytes
- **Multiple Formats**: Support for hex, base64, and base64url encoding
- **Entropy Calculation**: Shows security strength of generated secrets
- **Environment File Format**: Can output directly in `.env` format

#### Usage

```bash
# Generate default secrets (2 secrets, 64 bytes each, hex format)
pnpm tsx scripts/generate-jwt-secrets.ts

# Generate in .env format for easy copying
pnpm tsx scripts/generate-jwt-secrets.ts --env

# Generate with custom length
pnpm tsx scripts/generate-jwt-secrets.ts --length 128

# Generate multiple secrets
pnpm tsx scripts/generate-jwt-secrets.ts --count 4

# Generate in base64 format
pnpm tsx scripts/generate-jwt-secrets.ts --format base64

# Copy to clipboard (Windows)
pnpm tsx scripts/generate-jwt-secrets.ts --env | clip

# Copy to clipboard (macOS)
pnpm tsx scripts/generate-jwt-secrets.ts --env | pbcopy

# Copy to clipboard (Linux)
pnpm tsx scripts/generate-jwt-secrets.ts --env | xclip -selection clipboard

# Using npm script
pnpm generate-secrets
```

#### Options

- `--length <number>` - Length in bytes (default: 64, minimum: 32)
- `--count <number>` - Number of secrets to generate (default: 2)
- `--format <type>` - Output format: `hex` (default), `base64`, or `base64url`
- `--env` - Output in .env format
- `--help`, `-h` - Show help message

#### Security Levels

The script indicates security level based on entropy:

- **WEAK** (< 256 bits): Increase length immediately
- **ACCEPTABLE** (256-511 bits): Minimum recommended
- **STRONG** (512+ bits): Excellent security

## Common Workflows

### Initial Setup

1. Generate JWT secrets:
   ```bash
   pnpm tsx scripts/generate-jwt-secrets.ts --env
   ```

2. Copy the secrets to your `apps/api/.env` file

3. Verify your environment:
   ```bash
   pnpm tsx scripts/verify-env.ts
   ```

### Production Deployment Checklist

1. Generate new production secrets:
   ```bash
   pnpm tsx scripts/generate-jwt-secrets.ts --length 128 --env
   ```

2. Set all required environment variables in your hosting platform

3. Verify production environment (locally with production .env):
   ```bash
   pnpm tsx scripts/verify-env.ts --env-file .env.production
   ```

4. Ensure all required checks pass before deploying

### CI/CD Integration

Add to your CI/CD pipeline:

```yaml
- name: Verify Environment
  run: pnpm tsx scripts/verify-env.ts --skip-optional
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    JWT_SECRET: ${{ secrets.JWT_SECRET }}
    JWT_REFRESH_SECRET: ${{ secrets.JWT_REFRESH_SECRET }}
    # ... other environment variables
```

### Troubleshooting

#### Database Connection Failed

```bash
# Check DATABASE_URL format
echo $DATABASE_URL

# Test connection with Prisma
pnpm --filter @peacase/database db:push

# Verify SSL mode for Supabase
# URL should include ?sslmode=require or similar
```

#### JWT Secret Too Short

```bash
# Generate new strong secrets
pnpm tsx scripts/generate-jwt-secrets.ts --length 64

# Update .env file with new secrets
# Re-run verification
pnpm tsx scripts/verify-env.ts
```

#### CORS Wildcard in Production

```bash
# Set specific origins in .env
CORS_ORIGIN=https://yourapp.com,https://www.yourapp.com

# Verify
pnpm tsx scripts/verify-env.ts
```

#### Stripe Test Key in Production

```bash
# Update to live key
STRIPE_SECRET_KEY=sk_live_...

# Verify
pnpm tsx scripts/verify-env.ts
```

## Security Best Practices

### Environment Variables

1. **Never commit** `.env` files to version control
2. **Use different secrets** for each environment (dev, staging, production)
3. **Rotate secrets** periodically (every 90 days recommended)
4. **Use strong secrets** (minimum 32 bytes, 64+ recommended)
5. **Store securely** using your hosting platform's secret management

### JWT Secrets

1. **JWT_SECRET and JWT_REFRESH_SECRET must be different**
2. **Minimum length**: 32 bytes (256 bits)
3. **Recommended length**: 64 bytes (512 bits) or more
4. **Never reuse** secrets across environments
5. **Rotate regularly** and implement grace periods for token validation

### API Keys

1. **Stripe**: Use test keys in development, live keys only in production
2. **SendGrid**: Use separate API keys per environment
3. **Twilio**: Use test credentials in development
4. **Sentry**: Use separate projects/DSNs per environment

### CORS Configuration

1. **Never use wildcard** (`*`) in production
2. **Specify exact origins** including protocol and port
3. **Review regularly** as your app grows
4. **Test thoroughly** after changes

## Integration with Existing Scripts

These scripts integrate with your existing npm scripts:

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

## Environment File Structure

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Environment
NODE_ENV=production

# API
API_PORT=3001
API_HOST=0.0.0.0
API_BASE_URL=https://api.yourapp.com

# JWT (use generate-jwt-secrets.ts)
JWT_SECRET=<64-byte-hex-string>
JWT_REFRESH_SECRET=<64-byte-hex-string>
JWT_EXPIRY=7d
JWT_REFRESH_EXPIRY=30d

# CORS
CORS_ORIGIN=https://yourapp.com
```

### Optional Variables

```bash
# Email (SendGrid)
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@yourapp.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_FROM_NUMBER=+1234567890

# Payments (Stripe)
STRIPE_SECRET_KEY=sk_test_xxxxx  # or sk_live_xxxxx for production

# Error Tracking (Sentry)
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the `.env.example` files
3. Run verification script with detailed output
4. Check application logs for specific error messages
