import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// Standard error response format
const createRateLimitResponse = (message: string) => ({
  success: false,
  error: {
    code: 'RATE_LIMIT_EXCEEDED',
    message,
  },
});

// Skip rate limiting in test environment
const isTestEnvironment = process.env.NODE_ENV === 'test';

// Middleware that skips rate limiting in test mode
const skipInTest = (rateLimiter: ReturnType<typeof rateLimit>) => {
  if (isTestEnvironment) {
    return (req: Request, res: Response, next: NextFunction) => next();
  }
  return rateLimiter;
};

// ============================================
// GENERAL API RATE LIMIT
// 1000 requests per 15 minutes per IP
// Very permissive - normal users won't hit this
// ============================================
export const generalRateLimit = skipInTest(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 minutes (was 100)
  standardHeaders: true,
  legacyHeaders: true,
  message: createRateLimitResponse('Too many requests, please try again later'),
  handler: (req: Request, res: Response) => {
    res.status(429).json(createRateLimitResponse('Too many requests, please try again later'));
  },
}));

// ============================================
// AUTH RATE LIMIT
// 30 requests per 15 minutes per IP
// Allows multiple signup/login attempts while
// still protecting against brute force attacks
// ============================================
export const authRateLimit = skipInTest(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 attempts per 15 minutes (was 10)
  standardHeaders: true,
  legacyHeaders: true,
  message: createRateLimitResponse('Too many authentication attempts, please try again later'),
  handler: (req: Request, res: Response) => {
    res.status(429).json(
      createRateLimitResponse('Too many authentication attempts, please try again later')
    );
  },
  skipSuccessfulRequests: true, // Only count failed requests (was false)
}));

// ============================================
// STRICT RATE LIMIT
// 10 requests per 15 minutes per IP
// For: password reset, email verification resend
// Still protective but allows testing/retries
// ============================================
export const strictRateLimit = skipInTest(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes (was 1 hour)
  max: 10, // 10 attempts per 15 minutes (was 3 per hour)
  standardHeaders: true,
  legacyHeaders: true,
  message: createRateLimitResponse(
    'Too many attempts, please try again in a few minutes'
  ),
  handler: (req: Request, res: Response) => {
    res.status(429).json(
      createRateLimitResponse('Too many attempts, please try again in a few minutes')
    );
  },
  skipSuccessfulRequests: true, // Only count failed requests (was false)
}));
