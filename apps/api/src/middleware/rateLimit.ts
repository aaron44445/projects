import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// ============================================
// CONFIGURATION
// ============================================
const isTestEnvironment = process.env.NODE_ENV === 'test';
const isDevelopment = process.env.NODE_ENV === 'development';

// In development/test, use very high limits
const DEV_MULTIPLIER = isDevelopment ? 100 : 1;

// ============================================
// HELPER: Generate key from IP + email
// ============================================
function getKeyFromIpAndEmail(req: Request): string {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  // Try to get email from body (login/signup/reset requests)
  const email = req.body?.email?.toLowerCase?.() || '';

  if (email) {
    return `${ip}:${email}`;
  }
  return ip;
}

// ============================================
// HELPER: Create error response with time remaining
// ============================================
function createRateLimitHandler(baseMessage: string) {
  return (req: Request, res: Response, next: NextFunction, options: any) => {
    const retryAfterHeader = res.getHeader('Retry-After');
    let seconds: number = 60; // Default to 60 seconds

    if (typeof retryAfterHeader === 'string') {
      seconds = parseInt(retryAfterHeader, 10) || 60;
    } else if (typeof retryAfterHeader === 'number') {
      seconds = retryAfterHeader;
    }

    let message = baseMessage;
    if (seconds > 0) {
      if (seconds < 60) {
        message = `${baseMessage}. Try again in ${seconds} seconds.`;
      } else {
        const minutes = Math.ceil(seconds / 60);
        message = `${baseMessage}. Try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`;
      }
    }

    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message,
        retryAfterSeconds: seconds,
      },
    });
  };
}

// ============================================
// HELPER: Skip rate limiting in test environment
// ============================================
function skipInTest(rateLimiter: RateLimitRequestHandler) {
  if (isTestEnvironment) {
    return (req: Request, res: Response, next: NextFunction) => next();
  }
  return rateLimiter;
}

// ============================================
// GENERAL API RATE LIMIT
// 2000 requests per 15 minutes per IP
// Very permissive - normal users won't hit this
// ============================================
export const generalRateLimit = skipInTest(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000 * DEV_MULTIPLIER,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || 'unknown',
  handler: createRateLimitHandler('Too many requests'),
}));

// ============================================
// LOGIN RATE LIMIT
// 30 failed attempts per minute per IP+email
// Only counts FAILED requests
// ============================================
export const loginRateLimit = skipInTest(rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30 * DEV_MULTIPLIER,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getKeyFromIpAndEmail,
  skipSuccessfulRequests: true, // Only count failed attempts
  handler: createRateLimitHandler('Too many login attempts'),
}));

// ============================================
// SIGNUP RATE LIMIT
// 20 attempts per minute per IP
// Prevents mass account creation
// ============================================
export const signupRateLimit = skipInTest(rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20 * DEV_MULTIPLIER,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || 'unknown',
  skipSuccessfulRequests: true,
  handler: createRateLimitHandler('Too many signup attempts'),
}));

// ============================================
// PASSWORD RESET RATE LIMIT
// 10 attempts per minute per IP+email
// Prevents abuse of password reset emails
// ============================================
export const passwordResetRateLimit = skipInTest(rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10 * DEV_MULTIPLIER,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getKeyFromIpAndEmail,
  skipSuccessfulRequests: true,
  handler: createRateLimitHandler('Too many password reset attempts'),
}));

// ============================================
// TOKEN REFRESH RATE LIMIT
// 100 per minute - essentially unlimited for normal use
// Just prevents extreme abuse
// ============================================
export const tokenRefreshRateLimit = skipInTest(rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100 * DEV_MULTIPLIER,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || 'unknown',
  handler: createRateLimitHandler('Too many token refresh requests'),
}));

// ============================================
// EMAIL VERIFICATION RATE LIMIT
// 5 resends per minute per IP+email
// Prevents email bombing
// ============================================
export const emailVerificationRateLimit = skipInTest(rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5 * DEV_MULTIPLIER,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getKeyFromIpAndEmail,
  skipSuccessfulRequests: true,
  handler: createRateLimitHandler('Too many verification email requests'),
}));

// ============================================
// LEGACY EXPORTS (for backward compatibility)
// These map to the new specific limiters
// ============================================
export const authRateLimit = loginRateLimit;
export const strictRateLimit = passwordResetRateLimit;
