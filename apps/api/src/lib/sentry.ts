import * as Sentry from '@sentry/node';
import { env } from './env.js';
import logger from './logger.js';

// ============================================
// SENTRY CONFIGURATION
// ============================================
// Initialize Sentry for error tracking and performance monitoring

const SENTRY_DSN = env.SENTRY_DSN;
const ENVIRONMENT = env.NODE_ENV;
const RELEASE = env.SENTRY_RELEASE || 'peacase-api@1.0.0';

// Performance sampling rates by environment
const TRACES_SAMPLE_RATE: Record<string, number> = {
  development: 1.0,  // 100% in development for debugging
  staging: 0.5,      // 50% in staging
  production: 0.2,   // 20% in production to reduce overhead
};

// Profiles sampling rates (subset of traces)
const PROFILES_SAMPLE_RATE: Record<string, number> = {
  development: 1.0,
  staging: 0.5,
  production: 0.1,
};

/**
 * Initialize Sentry SDK
 * Should be called at the very start of the application
 */
export function initSentry(): void {
  if (!SENTRY_DSN) {
    logger.warn('No Sentry DSN configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    release: RELEASE,

    // Performance Monitoring
    tracesSampleRate: TRACES_SAMPLE_RATE[ENVIRONMENT] ?? 0.1,
    profilesSampleRate: PROFILES_SAMPLE_RATE[ENVIRONMENT] ?? 0.1,

    // Integrations
    integrations: [
      // HTTP integration for tracing requests
      Sentry.httpIntegration(),
      // Express integration for route tracing
      Sentry.expressIntegration(),
    ],

    // Only send errors in non-development or when explicitly enabled
    enabled: ENVIRONMENT !== 'development' || env.SENTRY_ENABLE_DEV === 'true',

    // Filter out common noise
    ignoreErrors: [
      // Ignore client-side errors that bubble up
      'ECONNRESET',
      'ETIMEDOUT',
      // Ignore authentication errors (expected behavior)
      'TOKEN_EXPIRED',
      'INVALID_TOKEN',
      'UNAUTHORIZED',
    ],

    // Before sending, filter sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }

      // Remove sensitive body data
      if (event.request?.data) {
        const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'refreshToken'];
        try {
          const data = typeof event.request.data === 'string'
            ? JSON.parse(event.request.data)
            : event.request.data;

          for (const field of sensitiveFields) {
            if (field in data) {
              data[field] = '[FILTERED]';
            }
          }
          event.request.data = JSON.stringify(data);
        } catch {
          // If parsing fails, leave data as-is
        }
      }

      return event;
    },
  });

  logger.info({ environment: ENVIRONMENT }, 'Sentry initialized');
}

/**
 * Set user context for error tracking
 * Call this after successful authentication
 */
export function setSentryUser(user: {
  id: string;
  email?: string;
  salonId?: string;
  role?: string;
}): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    // Custom context
    salonId: user.salonId,
    role: user.role,
  } as Sentry.User & { salonId?: string; role?: string });
}

/**
 * Clear user context (call on logout)
 */
export function clearSentryUser(): void {
  Sentry.setUser(null);
}

/**
 * Add additional context to errors
 */
export function setSentryContext(name: string, context: Record<string, unknown>): void {
  Sentry.setContext(name, context);
}

/**
 * Add a breadcrumb for debugging
 */
export function addSentryBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
  Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Capture an exception manually
 */
export function captureException(error: unknown, context?: Record<string, unknown>): string {
  if (context) {
    Sentry.setContext('additional', context);
  }
  return Sentry.captureException(error);
}

/**
 * Capture a message manually
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info'
): string {
  return Sentry.captureMessage(message, level);
}

// Re-export Sentry for direct usage
export { Sentry };
