// MUST be first import to load environment variables before anything else
import './loadEnv.js';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

// Initialize Sentry as early as possible (before other imports)
import { initSentry, Sentry } from './lib/sentry.js';
initSentry();

// Import and validate environment (will exit if invalid)
import { env } from './lib/env.js';

import { authRouter } from './routes/auth.js';
import { salonRouter } from './routes/salon.js';
import { locationsRouter } from './routes/locations.js';
import { clientsRouter } from './routes/clients.js';
import { servicesRouter } from './routes/services.js';
import { appointmentsRouter } from './routes/appointments.js';
import { usersRouter } from './routes/users.js';
import { staffRouter } from './routes/staff.js';
import { publicRouter } from './routes/public.js';
import { reviewsRouter } from './routes/reviews.js';
import { giftCardsRouter } from './routes/gift-cards.js';
import { packagesRouter } from './routes/packages.js';
import { dashboardRouter } from './routes/dashboard.js';
import { reportsRouter } from './routes/reports.js';
import { webhooksRouter } from './routes/webhooks.js';
import { uploadsRouter } from './routes/uploads.js';
import { onboardingRouter } from './routes/onboarding.js';
import { demoRouter } from './routes/demo.js';
import { staffPortalRouter } from './routes/staffPortal.js';
import { clientAuthRouter } from './routes/clientAuth.js';
import { clientPortalRouter } from './routes/clientPortal.js';
import { gdprRouter } from './routes/gdpr.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { generalRateLimit } from './middleware/rateLimit.js';
import { startCronJobs } from './cron/index.js';
import { prisma } from '@peacase/database';

const app = express();
const PORT = env.PORT;

// ============================================
// SENTRY REQUEST HANDLER (must be first)
// ============================================
Sentry.setupExpressErrorHandler(app);

// ============================================
// MIDDLEWARE
// ============================================

// Security
app.use(helmet());

// CORS
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

// Raw body parser for Stripe webhooks (must be before json parser)
app.use('/api/v1/webhooks/stripe', express.raw({ type: 'application/json' }));

// Cookie parsing (for refresh tokens)
app.use(cookieParser());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate limiting (apply to all API routes)
app.use('/api', generalRateLimit);

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Version check - UPDATE THIS ON EACH DEPLOY TO VERIFY
const BUILD_VERSION = '2026-01-26-v5-direct-email';
app.get('/api/v1/version', (req, res) => {
  res.json({
    version: BUILD_VERSION,
    deployedAt: new Date().toISOString(),
    emailConfig: {
      hasSMTP_PASS: !!env.SMTP_PASS,
      hasSMTP_FROM_EMAIL: !!env.SMTP_FROM_EMAIL,
      hasSENDGRID_API_KEY: !!env.SENDGRID_API_KEY,
      hasSENDGRID_FROM_EMAIL: !!env.SENDGRID_FROM_EMAIL,
    }
  });
});

// Debug endpoint - test if /api routes work without database
app.get('/api/v1/debug', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API routes are working',
    env: {
      nodeEnv: env.NODE_ENV,
      corsOrigin: env.CORS_ORIGIN,
      hasDbUrl: !!env.DATABASE_URL && !env.DATABASE_URL.includes('localhost'),
    }
  });
});

// Database test endpoint
app.get('/api/v1/debug/db', async (req, res) => {
  try {
    const { prisma } = await import('@peacase/database');
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', message: 'Database connected' });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
});

// Auth test endpoint - uses static import like real routes
app.post('/api/v1/debug/auth', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findFirst({
      where: { email: email || 'test@test.com' },
      include: { salon: true }
    });
    res.json({
      status: 'ok',
      userFound: !!user,
      message: user ? 'User found' : 'User not found (this is OK for testing)'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
});

// API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/salon', salonRouter);
app.use('/api/v1/locations', locationsRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/staff', staffRouter);
app.use('/api/v1/clients', clientsRouter);
app.use('/api/v1/services', servicesRouter);
app.use('/api/v1/appointments', appointmentsRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/gift-cards', giftCardsRouter);
app.use('/api/v1/packages', packagesRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/reports', reportsRouter);
app.use('/api/v1/webhooks', webhooksRouter);
app.use('/api/v1/uploads', uploadsRouter);
app.use('/api/v1/onboarding', onboardingRouter);
app.use('/api/v1/demo', demoRouter);
app.use('/api/v1/public', publicRouter);

// Staff Portal Routes
app.use('/api/v1/staff-portal', staffPortalRouter);

// Client Portal Routes
app.use('/api/v1/client-auth', clientAuthRouter);
app.use('/api/v1/client-portal', clientPortalRouter);

// GDPR Routes (client data export, deletion requests)
app.use('/api/v1/gdpr', gdprRouter);

// ============================================
// ERROR HANDLING
// ============================================

app.use(notFoundHandler);
app.use(errorHandler);

// ============================================
// START SERVER
// ============================================

// Only start server if not running in Vercel serverless
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`
  ============================================
  Peacase API Server
  ============================================
  Status: Running
  Port: ${PORT}
  Environment: ${env.NODE_ENV}
  ============================================
  `);

    // Start cron jobs after server is running
    startCronJobs();
  });
}

// Export for Vercel serverless
export default app;
