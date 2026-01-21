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

// Skip rate limiting in test environment or development
const isTestEnvironment = process.env.NODE_ENV === 'test';
const isDevelopment = process.env.NODE_ENV === 'development';

// Middleware that skips rate limiting in test mode
const skipInTest = (rateLimiter: ReturnType<typeof rateLimit>) => {
  if (isTestEnvironment) {
    return (req: Request, res: Response, next: NextFunction) => next();
  }
  return rateLimiter;
};

// ============================================
// GENERAL API RATE LIMIT
// 2000 requests per 15 minutes per IP
// Very permissive - normal users won't hit this
// ============================================
export const generalRateLimit = skipInTest(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 10000 : 2000, // Higher in dev, 2000 in prod (~133 req/min)
  standardHeaders: true,
  legacyHeaders: true,
  message: createRateLimitResponse('Too many requests, please try again later'),
  handler: (req: Request, res: Response) => {
    res.status(429).json(createRateLimitResponse('Too many requests, please try again later'));
  },
}));

// ============================================
// AUTH RATE LIMIT
// 60 requests per minute per IP
// Generous limit for auth - allows rapid testing/retries
// while still providing brute force protection
// ============================================
export const authRateLimit = skipInTest(rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isDevelopment ? 1000 : 60, // Higher in dev, 60 in prod (60 req/min)
  standardHeaders: true,
  legacyHeaders: true,
  message: createRateLimitResponse('Too many authentication attempts, please try again in a minute'),
  handler: (req: Request, res: Response) => {
    res.status(429).json(
      createRateLimitResponse('Too many authentication attempts, please try again in a minute')
    );
  },
  skipSuccessfulRequests: true, // Only count failed requests
}));

// ============================================
// STRICT RATE LIMIT
// 20 requests per 5 minutes per IP
// For: password reset, email verification resend
// Still protective but allows testing/retries
// ============================================
export const strictRateLimit = skipInTest(rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: isDevelopment ? 100 : 20, // Higher in dev, 20 in prod (4 req/min)
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
  skipSuccessfulRequests: true, // Only count failed requests
}));
