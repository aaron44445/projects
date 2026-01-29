import { Request, Response, NextFunction } from 'express';
import { captureException } from '../lib/sentry.js';
import logger from '../lib/logger.js';

interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: Record<string, string>;
}

// Error codes that should NOT be reported to Sentry (expected behavior)
const IGNORED_ERROR_CODES = new Set([
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_ERROR',
  'TOKEN_EXPIRED',
  'INVALID_TOKEN',
  'INVALID_CREDENTIALS',
  'EMAIL_EXISTS',
  'RATE_LIMIT_EXCEEDED',
]);

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  logger.error({ err, path: req.path, method: req.method }, 'Unhandled request error');

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const errorCode = err.code || 'SERVER_ERROR';

  // Report unexpected errors to Sentry (5xx errors and unknown errors)
  if (statusCode >= 500 && !IGNORED_ERROR_CODES.has(errorCode)) {
    captureException(err, {
      path: req.path,
      method: req.method,
      statusCode,
      errorCode,
      userAgent: req.headers['user-agent'],
    });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      details: err.details,
    },
  });
}
