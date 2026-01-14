import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Standard error response format
const createRateLimitResponse = (message: string) => ({
  success: false,
  error: {
    code: 'RATE_LIMIT_EXCEEDED',
    message,
  },
});

// ============================================
// GENERAL API RATE LIMIT
// 100 requests per 15 minutes per IP
// ============================================
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: true, // Return `X-RateLimit-*` headers
  message: createRateLimitResponse('Too many requests, please try again later'),
  handler: (req: Request, res: Response) => {
    res.status(429).json(createRateLimitResponse('Too many requests, please try again later'));
  },
});

// ============================================
// AUTH RATE LIMIT
// 5 requests per 15 minutes per IP
// For: login, register, forgot-password
// ============================================
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: true,
  message: createRateLimitResponse('Too many authentication attempts, please try again later'),
  handler: (req: Request, res: Response) => {
    res.status(429).json(
      createRateLimitResponse('Too many authentication attempts, please try again later')
    );
  },
  skipSuccessfulRequests: false,
});

// ============================================
// STRICT RATE LIMIT
// 3 requests per hour per IP
// For: password reset, email verification
// ============================================
export const strictRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: true,
  message: createRateLimitResponse(
    'Too many sensitive operation attempts, please try again in an hour'
  ),
  handler: (req: Request, res: Response) => {
    res.status(429).json(
      createRateLimitResponse('Too many sensitive operation attempts, please try again in an hour')
    );
  },
  skipSuccessfulRequests: false,
});
