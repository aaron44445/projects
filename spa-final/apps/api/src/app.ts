import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './lib/env.js';

// Import routes
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
import { integrationsRouter } from './routes/integrations.js';
import { staffRouter } from './routes/staff.js';
import { publicRouter } from './routes/public.js';
import { staffPortalRouter } from './routes/staffPortal.js';
import { clientAuthRouter } from './routes/clientAuth.js';
import { clientPortalRouter } from './routes/clientPortal.js';
import { demoRouter } from './routes/demo.js';
import { uploadsRouter } from './routes/uploads.js';
import { locationsRouter } from './routes/locations.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';

/**
 * Create Express application
 * This factory function allows creating the app without starting the server,
 * which is useful for testing.
 */
export function createApp() {
  const app = express();
  const isTest = env.NODE_ENV === 'test';

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

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Logging (skip in test mode)
  if (!isTest) {
    app.use(morgan('dev'));
  }

  // ============================================
  // ROUTES
  // ============================================

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/salon', salonRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/staff', staffRouter);
  app.use('/api/v1/public', publicRouter);
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
  app.use('/api/v1/integrations', integrationsRouter);
  app.use('/api/v1/staff-portal', staffPortalRouter);
  app.use('/api/v1/client-auth', clientAuthRouter);
  app.use('/api/v1/client-portal', clientPortalRouter);
  app.use('/api/v1/demo', demoRouter);
  app.use('/api/v1/uploads', uploadsRouter);
  app.use('/api/v1/locations', locationsRouter);

  // ============================================
  // ERROR HANDLING
  // ============================================

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

// Create and export a default app instance for testing
const app = createApp();
export default app;
