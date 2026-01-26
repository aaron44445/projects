import { z } from 'zod';
import crypto from 'crypto';

// ============================================
// ENVIRONMENT VARIABLE SCHEMA
// ============================================
// All variables are optional with sensible defaults
// The app will start even with missing env vars
// Features will be disabled gracefully if their config is missing

const envSchema = z.object({
  // Database - use a placeholder if not set (will fail on DB operations, not startup)
  DATABASE_URL: z.string().default('postgresql://localhost:5432/peacase'),

  // JWT Authentication - generate random secrets if not provided
  JWT_SECRET: z.string().default(() => crypto.randomBytes(32).toString('hex')),
  JWT_REFRESH_SECRET: z.string().default(() => crypto.randomBytes(32).toString('hex')),

  // Server (optional with defaults)
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('*'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  API_URL: z.string().optional(), // For webhook callbacks (e.g., Twilio status)

  // Stripe (optional)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PROFESSIONAL_PRICE_ID: z.string().optional(),
  STRIPE_ENTERPRISE_PRICE_ID: z.string().optional(),

  // SendGrid (optional - email features will be disabled if not set)
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().default('noreply@peacase.com'),

  // SMTP2GO (optional - alternative email provider)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM_EMAIL: z.string().optional(),
  SMTP_FROM_NAME: z.string().optional(),

  // Twilio (optional - SMS features will be disabled if not set)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  // Sentry (optional - error tracking disabled if not set)
  SENTRY_DSN: z.string().optional(),
  SENTRY_RELEASE: z.string().optional(),
  SENTRY_ENABLE_DEV: z.string().optional(),

  // Cloudinary (optional - image upload disabled if not set)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Encryption key for API keys - generate if not provided
  ENCRYPTION_KEY: z.string().optional(),

  // GDPR API key for executing deletion requests via cron job
  GDPR_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

// ============================================
// VALIDATE ENVIRONMENT (lenient - never exits)
// ============================================

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    // Log warnings but don't exit - let the app start
    console.warn('\n⚠️  Some environment variables are missing or invalid:');
    for (const issue of result.error.issues) {
      console.warn(`   - ${issue.path.join('.')}: ${issue.message}`);
    }
    console.warn('   App will start with defaults. Some features may not work.\n');

    // Return defaults anyway
    return envSchema.parse({});
  }

  // Log what's configured
  const configured: string[] = [];
  const missing: string[] = [];

  if (result.data.DATABASE_URL && !result.data.DATABASE_URL.includes('localhost')) configured.push('Database');
  else missing.push('Database');

  if (result.data.STRIPE_SECRET_KEY) configured.push('Stripe');
  else missing.push('Stripe');

  if (result.data.SENDGRID_API_KEY) configured.push('SendGrid');
  else missing.push('SendGrid');

  if (result.data.TWILIO_ACCOUNT_SID) configured.push('Twilio');
  else missing.push('Twilio');

  if (result.data.ENCRYPTION_KEY) configured.push('Encryption');
  else missing.push('Encryption');

  console.log(`\n✅ Configured: ${configured.join(', ') || 'None'}`);
  if (missing.length > 0) {
    console.log(`⚠️  Not configured (features disabled): ${missing.join(', ')}\n`);
  }

  return result.data;
}

// Export validated environment
export const env = validateEnv();

// Helper to get encryption key (generates one if not set)
let _encryptionKey: Buffer | null = null;
export function getEncryptionKey(): Buffer {
  if (_encryptionKey) return _encryptionKey;

  if (env.ENCRYPTION_KEY && env.ENCRYPTION_KEY.length === 64) {
    _encryptionKey = Buffer.from(env.ENCRYPTION_KEY, 'hex');
  } else {
    // Generate a random key for this session (won't persist across restarts)
    console.warn('⚠️  No ENCRYPTION_KEY set - using temporary key. Encrypted data will not persist across restarts.');
    _encryptionKey = crypto.randomBytes(32);
  }

  return _encryptionKey;
}
