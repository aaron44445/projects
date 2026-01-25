# External Integrations

**Analysis Date:** 2026-01-25

## APIs & External Services

**Payments:**
- Stripe - Payment processing and subscription management
  - SDK/Client: `stripe` v20.1.2
  - Environment vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PROFESSIONAL_PRICE_ID`, `STRIPE_ENTERPRISE_PRICE_ID`
  - Location: `apps/api/src/services/payments.ts`
  - Features: Payment intents, refunds, customer management, checkout sessions, subscriptions
  - Production: Uses Stripe API v2025-12-15.clover

**Email:**
- Primary: SMTP2GO (REST API)
  - Environment vars: `SMTP_PASS` (API key), `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME`
  - Location: `apps/api/src/services/email.ts` (lines 21-65)
  - Endpoint: `https://api.smtp2go.com/v3/email/send`
  - Usage: Appointment reminders, registration confirmations, marketing campaigns

- Fallback: SendGrid
  - SDK/Client: `@sendgrid/mail` v8.1.6, `@sendgrid/client` v8.1.6
  - Environment vars: `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`
  - Location: `apps/api/src/services/email.ts` (lines 68-92)
  - Usage: Email sending (fallback if SMTP2GO fails)

**SMS:**
- Twilio
  - SDK/Client: `twilio` v5.11.2
  - Environment vars: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
  - Location: `apps/api/src/services/sms.ts`
  - Features: SMS reminders, appointment confirmations
  - Phone formatting: Converts input to E.164 format (+1 for US/Canada, +44 for UK, handles international)
  - Graceful degradation: Logs warning if not configured

**Image Storage & Processing:**
- Cloudinary
  - SDK/Client: `cloudinary` v2.5.1
  - Environment vars: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
  - Location: `apps/api/src/services/upload.ts`
  - Features: Logo uploads, form signature storage, image transformation
  - File upload: Multer middleware (`multer` v1.4.5) handles file parsing before Cloudinary upload

## Data Storage

**Databases:**
- PostgreSQL (Primary)
  - Provider: Supabase (managed PostgreSQL)
  - Connection types:
    - Pooled (pgbouncer): `DATABASE_URL` - Used by application
    - Direct: `DIRECT_URL` - Used for migrations (Prisma)
  - Client: Prisma `@prisma/client` v5.8.0
  - Features: Multi-tenant (salon_id filtering on all queries), GDPR support, appointment management

**File Storage:**
- Cloudinary API - External cloud storage for images
- Local filesystem - Not used in production

**Caching:**
- None configured - Redis not integrated
- Application state: In-memory (Zustand on frontend)
- API responses: Axios caching (frontend, configured per request)
- Server state: TanStack React Query (frontend)

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based authentication
  - Implementation: `apps/api/src/routes/auth.ts`, `apps/api/src/middleware/auth.ts`
  - Token types: Access token (JWT), Refresh token (stored in DB and HTTP-only cookies)
  - Environment vars: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRY`, `JWT_REFRESH_EXPIRY`
  - Password hashing: bcryptjs v2.4.3
  - Session tracking: UserSession model (with revocation support)

**Social Auth Options (Stored in User model):**
- Google OAuth (field: `googleId`)
- Apple Sign-In (field: `appleId`)
- Magic Link Auth (field: `magicLinkToken`, `magicLinkExpires`)

**Two-Factor Authentication:**
- Model: TwoFactorAuth (optional per user)
- Status: Schema supports but implementation not fully documented

**Email Verification:**
- EmailVerificationToken model - time-limited tokens for email confirmation
- ClientEmailVerificationToken - for client portal email verification

## Monitoring & Observability

**Error Tracking:**
- Sentry
  - SDK: `@sentry/node` v10.33.0 (backend), `@sentry/nextjs` v10.33.0 (frontend)
  - Environment vars: `SENTRY_DSN`, `SENTRY_RELEASE`, `SENTRY_ENABLE_DEV`
  - Location: `apps/api/src/lib/sentry.ts`
  - Status: Optional - features disabled if DSN not configured
  - Integration: Sentry error handler setup in Express app (line 51 in index.ts)

**Logs:**
- Morgan HTTP request logger - `morgan` v1.10.0
  - Format: 'dev' in development, suppressed in test mode
  - Location: `apps/api/src/index.ts` (lines 78-80)
- Console logging - Custom console.log statements throughout services
- No external log aggregation configured

**Application Monitoring:**
- Health check endpoint: `/health` (Render uses for instance health)
- Performance metrics: None tracked
- Uptime monitoring: Via Render health checks

## CI/CD & Deployment

**Hosting:**
- **API:** Render.com (Node.js web service)
  - Service ID: `srv-d5ooe2lactks738u6bo0`
  - Plan: Free tier
  - Region: Oregon
  - Auto-redeploy: On push to main branch
  - Health check: `/health` endpoint

- **Web:** Vercel (Next.js platform)
  - Auto-deploy: On push to main branch
  - Environment: Production edge functions

- **Database:** Supabase PostgreSQL
  - Cloud provider: AWS (us-east-1)
  - Backup: Automatic (Supabase managed)

**CI Pipeline:**
- GitHub Actions - Not explicitly configured in this codebase
- Manual pushes trigger Render and Vercel auto-deployments

**Deployment Strategy:**
- No staging environment configured
- Main branch → Production (direct)
- Database migrations: Manual via Prisma CLI or through build process

## Environment Configuration

**Required Environment Variables (Production):**

Database:
- `DATABASE_URL` - PostgreSQL pooled connection string (Supabase)
- `DIRECT_URL` - PostgreSQL direct connection (Supabase, for migrations)

Authentication:
- `JWT_SECRET` - 256-bit hex string for access token signing
- `JWT_REFRESH_SECRET` - 256-bit hex string for refresh token signing
- `ENCRYPTION_KEY` - 256-bit hex string for encrypting API keys at rest

Server:
- `NODE_ENV` - production/development/test
- `PORT` - 3001 (API), 3000 (Web)
- `CORS_ORIGIN` - https://peacase.com (production)
- `FRONTEND_URL` - Frontend URL for auth redirects

**Optional Service Variables:**

Stripe:
- `STRIPE_SECRET_KEY` - Stripe API key
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret
- `STRIPE_PROFESSIONAL_PRICE_ID` - Price ID for professional tier
- `STRIPE_ENTERPRISE_PRICE_ID` - Price ID for enterprise tier

Email:
- `SENDGRID_API_KEY` - SendGrid API key
- `SENDGRID_FROM_EMAIL` - Sender email address
- `SMTP_PASS` - SMTP2GO API key
- `SMTP_FROM_EMAIL` - Sender email for SMTP2GO
- `SMTP_FROM_NAME` - Sender name for SMTP2GO

SMS:
- `TWILIO_ACCOUNT_SID` - Twilio account identifier
- `TWILIO_AUTH_TOKEN` - Twilio authentication token
- `TWILIO_PHONE_NUMBER` - Twilio phone number for sending SMS

Images:
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud identifier
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

Monitoring:
- `SENTRY_DSN` - Sentry error tracking URL
- `SENTRY_RELEASE` - Release version for Sentry
- `SENTRY_ENABLE_DEV` - Enable Sentry in development

**Secrets Location:**
- Render environment variables: Stored in Render dashboard (sync: false prevents override)
- Vercel environment variables: Stored in Vercel project settings
- Local development: `.env.local` (git-ignored)
- Repository: `.env.production` committed with test/demo values (NOT production secrets)

**Note on Special Characters:**
- Database password with @ symbol must be URL-encoded as %40
- Example: `password@123` → `password%40123` in connection string

## Webhooks & Callbacks

**Incoming (Webhooks Received):**
- Stripe webhooks
  - Endpoint: `POST /api/v1/webhooks/stripe`
  - Events: Payment intent events, subscription events
  - Location: `apps/api/src/routes/webhooks.ts`
  - Raw body parser: Required for signature verification (express.raw middleware)
  - Secret: `STRIPE_WEBHOOK_SECRET` environment variable

**Outgoing (Callbacks Sent):**
- Email notifications - Sent via SendGrid/SMTP2GO
- SMS notifications - Sent via Twilio
- No webhooks to external services configured

## Integration Service Locations

**Email:** `apps/api/src/services/email.ts`
- `sendEmail()` - Single email
- `sendBulkEmail()` - Batch emails
- Used by: Auth, appointments, marketing, password reset

**SMS:** `apps/api/src/services/sms.ts`
- `sendSms()` - Single SMS
- `sendBulkSms()` - Batch SMS
- Template functions: appointmentConfirmationSms, appointmentReminderSms, etc.
- Used by: Appointment reminders (24h, 2h)

**Payments:** `apps/api/src/services/payments.ts`
- Stripe customer management
- Payment intent creation/confirmation
- Refund processing
- Checkout session creation for gift cards
- Subscription management
- Used by: Billing routes, payment processing, gift card purchases

**Image Upload:** `apps/api/src/services/upload.ts`
- Cloudinary upload
- Image transformation
- Signature URL generation
- Used by: Logo uploads, form responses (signatures)

---

*Integration audit: 2026-01-25*
