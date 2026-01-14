import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../lib/env.js';

// ============================================
// CSRF TOKEN CONFIGURATION
// ============================================

const CSRF_TOKEN_HEADER = 'x-csrf-token';
const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// In-memory token store with expiry (use Redis in production for multi-server)
const tokenStore = new Map<string, { token: string; expiresAt: number }>();

// State-changing HTTP methods that require CSRF protection
const PROTECTED_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

// Paths to skip CSRF validation
const SKIP_PATHS = [
  '/api/v1/webhooks',      // Webhooks have their own signature verification
  '/api/v1/auth/login',    // Login doesn't have CSRF token yet
  '/api/v1/auth/register', // Register doesn't have CSRF token yet
  '/api/v1/auth/refresh',  // Token refresh uses JWT verification
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a token hash for storage (double-submit pattern)
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Store token for validation
 */
function storeToken(sessionId: string, token: string): void {
  // Clean up expired tokens periodically
  if (tokenStore.size > 10000) {
    const now = Date.now();
    for (const [key, value] of tokenStore.entries()) {
      if (value.expiresAt < now) {
        tokenStore.delete(key);
      }
    }
  }

  tokenStore.set(sessionId, {
    token: hashToken(token),
    expiresAt: Date.now() + CSRF_TOKEN_EXPIRY,
  });
}

/**
 * Validate token against stored value
 */
function validateToken(sessionId: string, token: string): boolean {
  const stored = tokenStore.get(sessionId);

  if (!stored) {
    return false;
  }

  if (stored.expiresAt < Date.now()) {
    tokenStore.delete(sessionId);
    return false;
  }

  return stored.token === hashToken(token);
}

/**
 * Get session identifier from request (use user ID from JWT or fallback to IP)
 */
function getSessionId(req: Request): string {
  // If user is authenticated, use their user ID
  if (req.user?.userId) {
    return `user:${req.user.userId}`;
  }

  // Fallback to IP-based session for unauthenticated requests
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  return `ip:${ip}`;
}

/**
 * Check if path should skip CSRF validation
 */
function shouldSkip(path: string): boolean {
  return SKIP_PATHS.some((skipPath) => path.startsWith(skipPath));
}

// ============================================
// MIDDLEWARE
// ============================================

/**
 * CSRF protection middleware using double-submit cookie pattern
 *
 * For SPAs with JWT auth:
 * 1. Client fetches CSRF token from /api/v1/auth/csrf-token
 * 2. Token is returned in response and set as httpOnly=false cookie
 * 3. Client includes token in X-CSRF-Token header on state-changing requests
 * 4. Server validates header token matches cookie token
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Skip for non-protected methods (GET, HEAD, OPTIONS)
  if (!PROTECTED_METHODS.includes(req.method)) {
    return next();
  }

  // Skip for specific paths (webhooks, initial auth)
  if (shouldSkip(req.path)) {
    return next();
  }

  // Get tokens from header and cookie
  const headerToken = req.headers[CSRF_TOKEN_HEADER] as string | undefined;
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];

  // Both tokens must be present
  if (!headerToken || !cookieToken) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'CSRF_TOKEN_MISSING',
        message: 'CSRF token is required for this request',
      },
    });
  }

  // Tokens must match (double-submit validation)
  if (headerToken !== cookieToken) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'CSRF_TOKEN_INVALID',
        message: 'Invalid CSRF token',
      },
    });
  }

  // Optional: Additional server-side validation
  const sessionId = getSessionId(req);
  if (!validateToken(sessionId, headerToken)) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'CSRF_TOKEN_EXPIRED',
        message: 'CSRF token has expired. Please refresh and try again.',
      },
    });
  }

  next();
}

/**
 * Generate and send CSRF token endpoint handler
 */
export function csrfTokenHandler(req: Request, res: Response) {
  const token = generateCsrfToken();
  const sessionId = getSessionId(req);

  // Store token for server-side validation
  storeToken(sessionId, token);

  // Set cookie (httpOnly=false so JS can read it for double-submit)
  const isProduction = env.NODE_ENV === 'production';

  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // JS needs to read this for double-submit
    secure: isProduction,
    sameSite: 'strict',
    maxAge: CSRF_TOKEN_EXPIRY,
    path: '/',
  });

  res.json({
    success: true,
    data: {
      token,
      expiresIn: CSRF_TOKEN_EXPIRY,
    },
  });
}

/**
 * Clear CSRF token (call on logout)
 */
export function clearCsrfToken(req: Request, res: Response) {
  const sessionId = getSessionId(req);
  tokenStore.delete(sessionId);

  res.clearCookie(CSRF_COOKIE_NAME, {
    httpOnly: false,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
}
