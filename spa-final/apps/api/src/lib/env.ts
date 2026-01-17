import { z } from 'zod';

// ============================================
// ENVIRONMENT VARIABLE SCHEMA
// ============================================
// Required variables will throw on startup if missing
// Optional variables have sensible defaults for development

const envSchema = z.object({
  // Database (required)
  DATABASE_URL: z.string({
    required_error: 'DATABASE_URL is required',
  }),

  // JWT Authentication (required, min 32 chars for security)
  JWT_SECRET: z.string({
    required_error: 'JWT_SECRET is required',
  }).min(32, 'JWT_SECRET must be at least 32 characters for security'),

  JWT_REFRESH_SECRET: z.string({
    required_error: 'JWT_REFRESH_SECRET is required',
  }).min(32, 'JWT_REFRESH_SECRET must be at least 32 characters for security'),

  // Server (optional with defaults)
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // Stripe (required in production)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PROFESSIONAL_PRICE_ID: z.string().optional(),
  STRIPE_ENTERPRISE_PRICE_ID: z.string().optional(),

  // SendGrid (optional - email features will be disabled if not set)
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().email().optional().default('noreply@peacase.com'),

  // Twilio (optional - SMS features will be disabled if not set)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  // Sentry (optional - error tracking disabled if not set)
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_RELEASE: z.string().optional(),
  SENTRY_ENABLE_DEV: z.string().optional(),

  // Cloudinary (optional - image upload disabled if not set)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Encryption key for API keys (required - 32 bytes hex encoded = 64 chars)
  ENCRYPTION_KEY: z.string().length(64, 'ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)').optional(),
}).superRefine((data, ctx) => {
  // Stripe is required in production (except webhook secret which can be added later)
  if (data.NODE_ENV === 'production' && !process.env.VERCEL) {
    if (!data.STRIPE_SECRET_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'STRIPE_SECRET_KEY is required in production',
        path: ['STRIPE_SECRET_KEY'],
      });
    }
  }
});

export type Env = z.infer<typeof envSchema>;

// ============================================
// TEST ENVIRONMENT DEFAULTS
// ============================================
const testDefaults = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://localhost:5432/peacase_test',
  JWT_SECRET: 'test-jwt-secret-key-for-testing-1234567890',
  JWT_REFRESH_SECRET: 'test-jwt-refresh-secret-for-testing-1234567890',
  CORS_ORIGIN: 'http://localhost:3000',
  FRONTEND_URL: 'http://localhost:3000',
  PORT: '3002',
};

// ============================================
// VALIDATE ENVIRONMENT
// ============================================

function validateEnv(): Env {
  // In test mode, provide defaults for required variables
  const isTest = process.env.NODE_ENV === 'test';
  const envWithTestDefaults = isTest
    ? { ...testDefaults, ...process.env }
    : process.env;

  const result = envSchema.safeParse(envWithTestDefaults);

  if (!result.success) {
    console.error('\n============================================');
    console.error('ENVIRONMENT VALIDATION FAILED');
    console.error('============================================');
    console.error('\nThe following environment variables are missing or invalid:\n');

    for (const issue of result.error.issues) {
      const path = issue.path.join('.');
      console.error(`  - ${path}: ${issue.message}`);
    }

    console.error('\n============================================');
    console.error('Required environment variables:');
    console.error('  - DATABASE_URL: PostgreSQL connection string');
    console.error('  - JWT_SECRET: Secret for signing JWT tokens (min 32 chars)');
    console.error('  - JWT_REFRESH_SECRET: Secret for refresh tokens (min 32 chars)');
    console.error('');
    console.error('Required in production:');
    console.error('  - STRIPE_SECRET_KEY: Stripe secret API key');
    console.error('  - STRIPE_WEBHOOK_SECRET: Stripe webhook signing secret');
    console.error('');
    console.error('Optional (with defaults):');
    console.error('  - PORT: Server port (default: 3001)');
    console.error('  - NODE_ENV: Environment mode (default: development)');
    console.error('  - CORS_ORIGIN: Allowed CORS origin (default: http://localhost:3000)');
    console.error('  - FRONTEND_URL: Frontend URL for links (default: http://localhost:3000)');
    console.error('  - SENDGRID_API_KEY: For email functionality');
    console.error('  - SENDGRID_FROM_EMAIL: Sender email address');
    console.error('  - TWILIO_ACCOUNT_SID: For SMS functionality');
    console.error('  - TWILIO_AUTH_TOKEN: Twilio auth token');
    console.error('  - TWILIO_PHONE_NUMBER: Twilio phone number');
    console.error('============================================\n');

    process.exit(1);
  }

  return result.data;
}

// Export validated environment
export const env = validateEnv();
