# Environment Secrets Documentation

This document describes all the secrets and environment variables required for the Peacase CI/CD pipeline.

## Required Secrets

Configure these in your GitHub repository settings under **Settings > Secrets and variables > Actions**.

### Database

| Secret | Description | Example |
|--------|-------------|---------|
| `DATABASE_URL` | Production PostgreSQL connection string | `postgresql://user:pass@host:5432/peacase` |
| `STAGING_DATABASE_URL` | Staging PostgreSQL connection string | `postgresql://user:pass@host:5432/peacase_staging` |
| `DATABASE_URL_TEST` | Test database connection string | `postgresql://user:pass@host:5432/peacase_test` |

### Authentication

| Secret | Description | Example |
|--------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT token signing (min 32 chars) | `your-super-secret-jwt-key-min-32-chars` |
| `JWT_REFRESH_SECRET` | Secret key for refresh token signing | `your-refresh-token-secret-key` |

### Stripe (Payments)

| Secret | Description | How to Get |
|--------|-------------|------------|
| `STRIPE_SECRET_KEY` | Stripe secret API key | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | [Stripe Webhooks](https://dashboard.stripe.com/webhooks) |

### Email (SendGrid)

| Secret | Description | How to Get |
|--------|-------------|------------|
| `SENDGRID_API_KEY` | SendGrid API key | [SendGrid Settings](https://app.sendgrid.com/settings/api_keys) |

### SMS (Twilio)

| Secret | Description | How to Get |
|--------|-------------|------------|
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | [Twilio Console](https://console.twilio.com) |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | [Twilio Console](https://console.twilio.com) |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | [Twilio Phone Numbers](https://console.twilio.com/us1/develop/phone-numbers/manage/incoming) |

### Deployment - Vercel

| Secret | Description | How to Get |
|--------|-------------|------------|
| `VERCEL_TOKEN` | Vercel API token | [Vercel Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Vercel organization ID | Run `vercel whoami` in project |

### Deployment - Docker Registry (Optional)

| Secret | Description | Example |
|--------|-------------|---------|
| `DOCKER_USERNAME` | Docker registry username | `your-username` |
| `DOCKER_PASSWORD` | Docker registry password/token | `dckr_pat_xxxxx` |

### Turborepo Remote Cache (Optional)

| Secret | Description | How to Get |
|--------|-------------|------------|
| `TURBO_TOKEN` | Vercel Remote Cache token | [Vercel Dashboard](https://vercel.com/account/tokens) |

---

## Repository Variables

Configure these in **Settings > Secrets and variables > Actions > Variables**.

### General

| Variable | Description | Example |
|----------|-------------|---------|
| `TURBO_TEAM` | Vercel team name for remote cache | `peacase-team` |

### Staging Environment

| Variable | Description | Example |
|----------|-------------|---------|
| `STAGING_URL` | Staging frontend URL | `https://staging.peacase.com` |
| `STAGING_API_URL` | Staging API URL | `https://api-staging.peacase.com` |
| `NEXT_PUBLIC_API_URL` | Public API URL for Next.js | `https://api-staging.peacase.com` |

### Production Environment

| Variable | Description | Example |
|----------|-------------|---------|
| `PRODUCTION_URL` | Production frontend URL | `https://peacase.com` |
| `PRODUCTION_API_URL` | Production API URL | `https://api.peacase.com` |

### Deployment

| Variable | Description | Example |
|----------|-------------|---------|
| `VERCEL_PROJECT_ID` | Vercel project ID | `prj_xxxxxxxxxxxxx` |
| `DOCKER_REGISTRY` | Docker registry URL (if using Docker) | `ghcr.io/your-org` |

---

## Environment-Specific Secrets

### Setting up GitHub Environments

1. Go to **Settings > Environments**
2. Create two environments: `staging` and `production`
3. Add environment-specific secrets:

#### Staging Environment Secrets
- `DATABASE_URL` (staging database)
- `STRIPE_SECRET_KEY` (test mode key)
- `STRIPE_WEBHOOK_SECRET` (test mode webhook)

#### Production Environment Secrets
- `DATABASE_URL` (production database)
- `STRIPE_SECRET_KEY` (live mode key)
- `STRIPE_WEBHOOK_SECRET` (live mode webhook)

### Production Protection Rules

For the `production` environment, configure:
- **Required reviewers**: Add team members who must approve production deployments
- **Wait timer**: Optional delay before deployment (e.g., 15 minutes)
- **Deployment branches**: Restrict to `main` branch only

---

## Local Development

For local development, create a `.env.local` file (not committed to git):

```env
# Database
DATABASE_URL="postgresql://localhost:5432/peacase_dev"

# Auth
JWT_SECRET="local-dev-jwt-secret-min-32-characters"
JWT_REFRESH_SECRET="local-dev-refresh-secret"

# Stripe (Test Mode)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# SendGrid
SENDGRID_API_KEY="SG...."

# Twilio (Test credentials)
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="+1..."

# API URL
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

---

## Security Best Practices

1. **Never commit secrets** - Use `.gitignore` to exclude `.env*` files
2. **Rotate secrets regularly** - Especially after team member departures
3. **Use test/sandbox credentials** for staging environments
4. **Limit secret access** - Only give access to those who need it
5. **Monitor for leaks** - Enable GitHub secret scanning
6. **Use environment protection rules** for production

---

## Quick Setup Checklist

- [ ] Create `staging` and `production` environments in GitHub
- [ ] Add all required secrets to repository
- [ ] Add environment-specific secrets to each environment
- [ ] Configure production protection rules
- [ ] Set up repository variables
- [ ] Verify Vercel/deployment provider connection
- [ ] Test CI pipeline with a PR
- [ ] Test staging deployment with push to main
- [ ] Test production deployment with a release tag
