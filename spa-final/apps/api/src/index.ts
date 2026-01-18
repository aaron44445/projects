import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Load environment variables BEFORE validation
dotenv.config();

// Initialize Sentry as early as possible (before other imports)
import { initSentry, Sentry } from './lib/sentry.js';
initSentry();

// Import and validate environment (will exit if invalid)
import { env } from './lib/env.js';

import { authRouter } from './routes/auth.js';
import { salonRouter } from './routes/salon.js';
import { clientsRouter } from './routes/clients.js';
import { servicesRouter } from './routes/services.js';
import { appointmentsRouter } from './routes/appointments.js';
import { usersRouter } from './routes/users.js';
import { reviewsRouter } from './routes/reviews.js';
import { giftCardsRouter } from './routes/gift-cards.js';
import { packagesRouter } from './routes/packages.js';
import { marketingRouter } from './routes/marketing.js';
import { dashboardRouter } from './routes/dashboard.js';
import { reportsRouter } from './routes/reports.js';
import { webhooksRouter } from './routes/webhooks.js';
import { uploadsRouter } from './routes/uploads.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { generalRateLimit } from './middleware/rateLimit.js';
import { startCronJobs } from './cron/index.js';

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

// Auth test endpoint - simulates what login does
app.post('/api/v1/debug/auth', async (req, res) => {
  try {
    const { prisma } = await import('@peacase/database');
    const { email } = req.body;
    const user = await prisma.user.findUnique({
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
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/clients', clientsRouter);
app.use('/api/v1/services', servicesRouter);
app.use('/api/v1/appointments', appointmentsRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/gift-cards', giftCardsRouter);
app.use('/api/v1/packages', packagesRouter);
app.use('/api/v1/marketing', marketingRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/reports', reportsRouter);
app.use('/api/v1/webhooks', webhooksRouter);
app.use('/api/v1/uploads', uploadsRouter);

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
module.exports = app;
