import { Request, Response, NextFunction, RequestHandler } from 'express';
import { Prisma } from '@peacase/database';

/**
 * Custom error class for API errors with status codes
 */
export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: Record<string, string>;

  constructor(message: string, statusCode: number = 500, code: string = 'SERVER_ERROR', details?: Record<string, string>) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async handler wrapper for Express route handlers
 * Catches async errors and passes them to the error handler
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error: unknown) => {
      // Handle Prisma-specific errors
      const appError = handleDatabaseError(error);
      next(appError);
    });
  };
}

/**
 * Converts database errors to AppError with appropriate status codes
 */
export function handleDatabaseError(error: unknown): AppError {
  // Log the original error for debugging
  console.error('[Database Error]', error);

  // Handle Prisma-specific errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        const target = (error.meta?.target as string[])?.join(', ') || 'field';
        return new AppError(
          `A record with this ${target} already exists`,
          409,
          'DUPLICATE_ENTRY',
          { field: target }
        );
      case 'P2003': // Foreign key constraint violation
        return new AppError(
          'Referenced record does not exist',
          400,
          'FOREIGN_KEY_ERROR'
        );
      case 'P2025': // Record not found
        return new AppError(
          'Record not found',
          404,
          'NOT_FOUND'
        );
      case 'P2014': // Required relation violation
        return new AppError(
          'Cannot delete record with existing dependencies',
          400,
          'CONSTRAINT_VIOLATION'
        );
      default:
        return new AppError(
          'Database operation failed',
          500,
          'DATABASE_ERROR'
        );
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new AppError(
      'Invalid data provided',
      400,
      'VALIDATION_ERROR'
    );
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error('[Critical] Database connection failed:', error.message);
    return new AppError(
      'Service temporarily unavailable',
      503,
      'DATABASE_UNAVAILABLE'
    );
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    console.error('[Critical] Prisma client panic:', error.message);
    return new AppError(
      'Internal server error',
      500,
      'SERVER_ERROR'
    );
  }

  // Handle connection timeouts
  if (error instanceof Error && error.message.includes('timeout')) {
    return new AppError(
      'Request timed out, please try again',
      504,
      'TIMEOUT'
    );
  }

  // Handle connection errors
  if (error instanceof Error && (
    error.message.includes('ECONNREFUSED') ||
    error.message.includes('ENOTFOUND') ||
    error.message.includes('connection')
  )) {
    return new AppError(
      'Service temporarily unavailable',
      503,
      'CONNECTION_ERROR'
    );
  }

  // If it's already an AppError, return as-is
  if (error instanceof AppError) {
    return error;
  }

  // Default error handling
  if (error instanceof Error) {
    return new AppError(
      error.message || 'An unexpected error occurred',
      500,
      'SERVER_ERROR'
    );
  }

  return new AppError(
    'An unexpected error occurred',
    500,
    'SERVER_ERROR'
  );
}

/**
 * Retry wrapper for database operations with exponential backoff
 * Use for critical operations that might fail due to transient issues
 */
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 100,
    maxDelay = 2000,
    onRetry,
  } = options;

  let lastError: Error | undefined;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Only retry on transient errors
      if (!isTransientError(error)) {
        throw error;
      }

      if (attempt < maxRetries) {
        if (onRetry) {
          onRetry(attempt, lastError);
        }
        console.log(`[Database] Retry attempt ${attempt}/${maxRetries} after ${delay}ms`);
        await sleep(delay);
        delay = Math.min(delay * 2, maxDelay);
      }
    }
  }

  throw lastError;
}

/**
 * Check if an error is transient and should be retried
 */
function isTransientError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('econnreset') ||
      message.includes('econnrefused') ||
      message.includes('connection') ||
      message.includes('too many clients')
    );
  }

  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Database operation with timeout
 */
export async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number = 30000,
  operationName: string = 'Database operation'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new AppError(`${operationName} timed out after ${timeoutMs}ms`, 504, 'TIMEOUT'));
    }, timeoutMs);
  });

  return Promise.race([operation, timeoutPromise]);
}
