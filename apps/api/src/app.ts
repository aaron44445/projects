import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './lib/env.js';

// Import routes - locations, onboarding added 2026-01-22
import { authRouter } from './routes/auth.js';
import { salonRouter } from './routes/salon.js';
import { clientsRouter } from './routes/clients.js';
import { servicesRouter } from './routes/services.js';
import { appointmentsRouter } from './routes/appointments.js';
import { usersRouter } from './routes/users.js';
import { giftCardsRouter } from './routes/gift-cards.js';
import { packagesRouter } from './routes/packages.js';
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
import { onboardingRouter } from './routes/onboarding.js';
import { gdprRouter } from './routes/gdpr.js';
import { accountRouter } from './routes/account.js';
import { teamRouter } from './routes/team.js';
import { ownerNotificationsRouter } from './routes/ownerNotifications.js';
import { notificationsRouter } from './routes/notifications.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { authenticate } from './middleware/auth.js';
import { ownerPortalOnly } from './middleware/staffAuth.js';

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

  // ============================================
  // OWNER PORTAL ROUTES
  // Protected by ownerPortalOnly - staff tokens rejected
  // ============================================
  // Note: Many routers have internal authenticate middleware, but ownerPortalOnly
  // must run AFTER authentication. Adding authenticate here ensures req.user is
  // set before ownerPortalOnly checks portalType. Routers with internal auth
  // will see req.user already set (authenticate is idempotent in effect).
  app.use('/api/v1/auth', authRouter);  // Owner auth - no ownerPortalOnly needed (creates tokens)
  app.use('/api/v1/salon', authenticate, ownerPortalOnly, salonRouter);
  app.use('/api/v1/users', authenticate, ownerPortalOnly, usersRouter);
  app.use('/api/v1/staff', authenticate, ownerPortalOnly, staffRouter);
  app.use('/api/v1/clients', authenticate, ownerPortalOnly, clientsRouter);
  app.use('/api/v1/services', authenticate, ownerPortalOnly, servicesRouter);
  app.use('/api/v1/appointments', authenticate, ownerPortalOnly, appointmentsRouter);
  app.use('/api/v1/gift-cards', authenticate, ownerPortalOnly, giftCardsRouter);
  app.use('/api/v1/packages', authenticate, ownerPortalOnly, packagesRouter);
  app.use('/api/v1/dashboard', authenticate, ownerPortalOnly, dashboardRouter);
  app.use('/api/v1/reports', authenticate, ownerPortalOnly, reportsRouter);
  app.use('/api/v1/integrations', authenticate, ownerPortalOnly, integrationsRouter);
  app.use('/api/v1/uploads', authenticate, ownerPortalOnly, uploadsRouter);
  app.use('/api/v1/locations', authenticate, ownerPortalOnly, locationsRouter);
  app.use('/api/v1/onboarding', authenticate, ownerPortalOnly, onboardingRouter);
  app.use('/api/v1/gdpr', authenticate, ownerPortalOnly, gdprRouter);
  app.use('/api/v1/account', authenticate, ownerPortalOnly, accountRouter);
  app.use('/api/v1/team', authenticate, ownerPortalOnly, teamRouter);
  app.use('/api/v1/owner-notifications', authenticate, ownerPortalOnly, ownerNotificationsRouter);
  app.use('/api/v1/notifications', authenticate, ownerPortalOnly, notificationsRouter);

  // ============================================
  // PUBLIC & PORTAL ROUTES
  // No ownerPortalOnly - these routes serve different portals/purposes
  // ============================================
  app.use('/api/v1/public', publicRouter);  // Public booking widget
  app.use('/api/v1/webhooks', webhooksRouter);  // Stripe webhooks (no auth)
  app.use('/api/v1/staff-portal', staffPortalRouter);  // Staff portal (uses staffPortalOnly internally)
  app.use('/api/v1/client-auth', clientAuthRouter);  // Client authentication
  app.use('/api/v1/client-portal', clientPortalRouter);  // Client portal
  app.use('/api/v1/demo', demoRouter);  // Demo endpoints

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
