/**
 * Comprehensive Unit Tests for API Middleware
 *
 * This test suite covers all middleware components with comprehensive edge cases:
 * - auth.ts: authenticate and authorize middleware
 * - errorHandler.ts: error handling and Sentry integration
 * - notFoundHandler.ts: 404 route handler
 * - rateLimit.ts: rate limiting exports validation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// ============================================
// MOCK SETUP
// ============================================

// Mock the env module with getters for dynamic values
vi.mock('../lib/env.js', () => ({
  env: {
    JWT_SECRET: 'test-secret-key-for-middleware-testing-12345',
    JWT_REFRESH_SECRET: 'test-refresh-secret-key',
    get NODE_ENV() {
      return process.env.NODE_ENV || 'test';
    },
  },
}));

// Mock the sentry module
vi.mock('../lib/sentry.js', () => ({
  setSentryUser: vi.fn(),
  captureException: vi.fn().mockReturnValue('sentry-event-id'),
  clearSentryUser: vi.fn(),
}));

// Import after mocks are set up
import { authenticate, authorize } from '../middleware/auth.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { notFoundHandler } from '../middleware/notFoundHandler.js';
import { setSentryUser, captureException } from '../lib/sentry.js';

// Get the mocked functions for assertions
const mockSetSentryUser = vi.mocked(setSentryUser);
const mockCaptureException = vi.mocked(captureException);

// ============================================
// TEST HELPERS
// ============================================

/**
 * Create a mock Express Request object
 */
function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    path: '/test',
    method: 'GET',
    socket: {
      remoteAddress: '127.0.0.1',
    },
    ip: '127.0.0.1',
    cookies: {},
    ...overrides,
  } as Request;
}

/**
 * Create a mock Express Response object
 */
function createMockResponse(): Response {
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
    clearCookie: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    statusCode: 200,
    locals: {},
  };
  return res as Response;
}

/**
 * Create a mock NextFunction
 */
function createMockNext(): NextFunction {
  return vi.fn() as NextFunction;
}

/**
 * Create a valid JWT token for testing
 */
function createValidToken(payload = { userId: 'user-123', salonId: 'salon-123', role: 'admin' }): string {
  return jwt.sign(payload, 'test-secret-key-for-middleware-testing-12345', { expiresIn: '1h' });
}

/**
 * Create an expired JWT token for testing
 */
function createExpiredToken(): string {
  return jwt.sign(
    { userId: 'user-123', salonId: 'salon-123', role: 'admin' },
    'test-secret-key-for-middleware-testing-12345',
    { expiresIn: '-1h' } // Already expired
  );
}

// ============================================
// AUTHENTICATION MIDDLEWARE TESTS
// ============================================

describe('authenticate middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call next() with valid Bearer token', () => {
    const token = createValidToken();
    const req = createMockRequest({
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toBeDefined();
    expect(req.user?.userId).toBe('user-123');
    expect(req.user?.salonId).toBe('salon-123');
    expect(req.user?.role).toBe('admin');
  });

  it('should set Sentry user context on successful authentication', () => {
    const token = createValidToken({ userId: 'user-456', salonId: 'salon-789', role: 'staff' });
    const req = createMockRequest({
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    authenticate(req, res, next);

    expect(mockSetSentryUser).toHaveBeenCalledTimes(1);
    expect(mockSetSentryUser).toHaveBeenCalledWith({
      id: 'user-456',
      salonId: 'salon-789',
      role: 'staff',
    });
  });

  it('should return 401 when no authorization header is present', () => {
    const req = createMockRequest({
      headers: {},
    });
    const res = createMockResponse();
    const next = createMockNext();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'No token provided',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when authorization header does not start with Bearer', () => {
    const req = createMockRequest({
      headers: {
        authorization: 'Basic some-token',
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'No token provided',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when authorization header is just "Bearer" with no token', () => {
    const req = createMockRequest({
      headers: {
        authorization: 'Bearer ',
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when token is malformed', () => {
    const req = createMockRequest({
      headers: {
        authorization: 'Bearer invalid-token-format',
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when token is signed with wrong secret', () => {
    const token = jwt.sign(
      { userId: 'user-123', salonId: 'salon-123', role: 'admin' },
      'wrong-secret-key',
      { expiresIn: '1h' }
    );
    const req = createMockRequest({
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when token is expired', () => {
    const expiredToken = createExpiredToken();
    const req = createMockRequest({
      headers: {
        authorization: `Bearer ${expiredToken}`,
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should not set Sentry user on authentication failure', () => {
    const req = createMockRequest({
      headers: {
        authorization: 'Bearer invalid-token',
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    authenticate(req, res, next);

    expect(mockSetSentryUser).not.toHaveBeenCalled();
  });

  it('should handle tokens with extra whitespace correctly', () => {
    const token = createValidToken();
    const req = createMockRequest({
      headers: {
        authorization: `Bearer  ${token}  `,
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    authenticate(req, res, next);

    // Should fail because split(' ')[1] will include the extra spaces
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

// ============================================
// AUTHORIZATION MIDDLEWARE TESTS
// ============================================

describe('authorize middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call next() when user has the required role', () => {
    const req = createMockRequest();
    req.user = { userId: 'user-123', salonId: 'salon-123', role: 'admin' };
    const res = createMockResponse();
    const next = createMockNext();

    const middleware = authorize('admin');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('should call next() when user has one of multiple allowed roles', () => {
    const req = createMockRequest();
    req.user = { userId: 'user-123', salonId: 'salon-123', role: 'staff' };
    const res = createMockResponse();
    const next = createMockNext();

    const middleware = authorize('admin', 'staff', 'manager');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('should return 401 when no user is attached to request', () => {
    const req = createMockRequest();
    // req.user is undefined
    const res = createMockResponse();
    const next = createMockNext();

    const middleware = authorize('admin');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 when user does not have required role', () => {
    const req = createMockRequest();
    req.user = { userId: 'user-123', salonId: 'salon-123', role: 'staff' };
    const res = createMockResponse();
    const next = createMockNext();

    const middleware = authorize('admin');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this resource',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 when user role is not in any of the allowed roles', () => {
    const req = createMockRequest();
    req.user = { userId: 'user-123', salonId: 'salon-123', role: 'client' };
    const res = createMockResponse();
    const next = createMockNext();

    const middleware = authorize('admin', 'staff', 'manager');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this resource',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle empty roles array (no access)', () => {
    const req = createMockRequest();
    req.user = { userId: 'user-123', salonId: 'salon-123', role: 'admin' };
    const res = createMockResponse();
    const next = createMockNext();

    const middleware = authorize();
    middleware(req, res, next);

    // With empty roles array, no role matches
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should be case-sensitive for role matching', () => {
    const req = createMockRequest();
    req.user = { userId: 'user-123', salonId: 'salon-123', role: 'Admin' };
    const res = createMockResponse();
    const next = createMockNext();

    const middleware = authorize('admin');
    middleware(req, res, next);

    // Should fail because 'Admin' !== 'admin'
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should work with single role authorization', () => {
    const req = createMockRequest();
    req.user = { userId: 'user-123', salonId: 'salon-123', role: 'manager' };
    const res = createMockResponse();
    const next = createMockNext();

    const middleware = authorize('manager');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});

// ============================================
// ERROR HANDLER MIDDLEWARE TESTS
// ============================================

describe('errorHandler middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Spy on console.error to prevent noise in test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 500 for errors without statusCode', () => {
    const error = new Error('Something went wrong') as any;
    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Something went wrong',
        details: undefined,
      },
    });
  });

  it('should return custom statusCode when provided', () => {
    const error = new Error('Not found') as any;
    error.statusCode = 404;
    error.code = 'NOT_FOUND';

    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Not found',
        details: undefined,
      },
    });
  });

  it('should include error details when provided', () => {
    const error = new Error('Validation failed') as any;
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    error.details = { field: 'email', issue: 'invalid format' };

    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();

    errorHandler(error, req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: { field: 'email', issue: 'invalid format' },
      },
    });
  });

  it('should use SERVER_ERROR code when no code is provided', () => {
    const error = new Error('Unknown error') as any;
    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();

    errorHandler(error, req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Unknown error',
        details: undefined,
      },
    });
  });

  it('should use "Internal server error" message when no message is provided', () => {
    const error = new Error() as any;
    error.message = '';
    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();

    errorHandler(error, req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Internal server error',
        details: undefined,
      },
    });
  });

  it('should report 5xx errors to Sentry', () => {
    const error = new Error('Database connection failed') as any;
    error.statusCode = 503;
    error.code = 'DB_CONNECTION_ERROR';

    const req = createMockRequest({
      path: '/api/v1/users',
      method: 'POST',
      headers: {
        'user-agent': 'test-agent/1.0',
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    errorHandler(error, req, res, next);

    expect(mockCaptureException).toHaveBeenCalledTimes(1);
    expect(mockCaptureException).toHaveBeenCalledWith(error, {
      path: '/api/v1/users',
      method: 'POST',
      statusCode: 503,
      errorCode: 'DB_CONNECTION_ERROR',
      userAgent: 'test-agent/1.0',
    });
  });

  it('should NOT report ignored error codes to Sentry even with 5xx status', () => {
    const ignoredCodes = [
      'UNAUTHORIZED',
      'FORBIDDEN',
      'NOT_FOUND',
      'VALIDATION_ERROR',
      'TOKEN_EXPIRED',
      'INVALID_TOKEN',
      'INVALID_CREDENTIALS',
      'EMAIL_EXISTS',
      'RATE_LIMIT_EXCEEDED',
    ];

    ignoredCodes.forEach((code) => {
      vi.clearAllMocks();

      const error = new Error('Test error') as any;
      error.statusCode = 500; // Even with 5xx status
      error.code = code;

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      errorHandler(error, req, res, next);

      expect(mockCaptureException).not.toHaveBeenCalled();
    });
  });

  it('should NOT report 4xx errors to Sentry', () => {
    const error = new Error('Bad request') as any;
    error.statusCode = 400;
    error.code = 'BAD_REQUEST';

    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();

    errorHandler(error, req, res, next);

    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  it('should report 500 errors with non-ignored codes to Sentry', () => {
    const error = new Error('Unexpected error') as any;
    error.statusCode = 500;
    error.code = 'UNEXPECTED_ERROR';

    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();

    errorHandler(error, req, res, next);

    expect(mockCaptureException).toHaveBeenCalledTimes(1);
  });

  it('should report errors without status code (default 500) to Sentry', () => {
    const error = new Error('Unhandled error') as any;
    // No statusCode set, defaults to 500

    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();

    errorHandler(error, req, res, next);

    expect(mockCaptureException).toHaveBeenCalledTimes(1);
    expect(mockCaptureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        statusCode: 500,
      })
    );
  });

  it('should log error to console', () => {
    const error = new Error('Test error');
    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();

    errorHandler(error as any, req, res, next);

    expect(console.error).toHaveBeenCalledWith('Error:', error);
  });

  it('should include request context in Sentry report', () => {
    const error = new Error('Server error') as any;
    error.statusCode = 500;

    const req = createMockRequest({
      path: '/api/v1/appointments/123',
      method: 'DELETE',
      headers: {
        'user-agent': 'Mozilla/5.0',
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    errorHandler(error, req, res, next);

    expect(mockCaptureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        path: '/api/v1/appointments/123',
        method: 'DELETE',
        userAgent: 'Mozilla/5.0',
      })
    );
  });
});

// ============================================
// NOT FOUND HANDLER MIDDLEWARE TESTS
// ============================================

describe('notFoundHandler middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 404 with correct error format', () => {
    const req = createMockRequest({
      method: 'GET',
      path: '/api/v1/nonexistent',
    });
    const res = createMockResponse();

    notFoundHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Route GET /api/v1/nonexistent not found',
      },
    });
  });

  it('should include method and path in error message', () => {
    const req = createMockRequest({
      method: 'POST',
      path: '/api/v1/unknown/endpoint',
    });
    const res = createMockResponse();

    notFoundHandler(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Route POST /api/v1/unknown/endpoint not found',
      },
    });
  });

  it('should handle DELETE method', () => {
    const req = createMockRequest({
      method: 'DELETE',
      path: '/missing',
    });
    const res = createMockResponse();

    notFoundHandler(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Route DELETE /missing not found',
      },
    });
  });

  it('should handle PATCH method', () => {
    const req = createMockRequest({
      method: 'PATCH',
      path: '/api/update',
    });
    const res = createMockResponse();

    notFoundHandler(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Route PATCH /api/update not found',
      },
    });
  });

  it('should handle PUT method', () => {
    const req = createMockRequest({
      method: 'PUT',
      path: '/api/replace',
    });
    const res = createMockResponse();

    notFoundHandler(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Route PUT /api/replace not found',
      },
    });
  });

  it('should handle root path', () => {
    const req = createMockRequest({
      method: 'GET',
      path: '/',
    });
    const res = createMockResponse();

    notFoundHandler(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Route GET / not found',
      },
    });
  });
});

// ============================================
// RATE LIMIT MIDDLEWARE TESTS
// ============================================

describe('rateLimit middleware exports', () => {
  it('should export generalRateLimit', async () => {
    const { generalRateLimit } = await import('../middleware/rateLimit.js');
    expect(generalRateLimit).toBeDefined();
    expect(typeof generalRateLimit).toBe('function');
  });

  it('should export authRateLimit', async () => {
    const { authRateLimit } = await import('../middleware/rateLimit.js');
    expect(authRateLimit).toBeDefined();
    expect(typeof authRateLimit).toBe('function');
  });

  it('should export strictRateLimit', async () => {
    const { strictRateLimit } = await import('../middleware/rateLimit.js');
    expect(strictRateLimit).toBeDefined();
    expect(typeof strictRateLimit).toBe('function');
  });
});

// ============================================
// CSRF MIDDLEWARE TESTS
// ============================================

describe('CSRF Protection Middleware', () => {
  let mockGenerateCsrfToken: any;
  let mockCsrfProtection: any;
  let mockCsrfTokenHandler: any;
  let mockClearCsrfToken: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const csrfModule = await import('../middleware/csrf.js');
    mockGenerateCsrfToken = csrfModule.generateCsrfToken;
    mockCsrfProtection = csrfModule.csrfProtection;
    mockCsrfTokenHandler = csrfModule.csrfTokenHandler;
    mockClearCsrfToken = csrfModule.clearCsrfToken;
  });

  describe('generateCsrfToken', () => {
    it('should generate a 64-character hex token', () => {
      const token = mockGenerateCsrfToken();
      expect(token).toBeTruthy();
      expect(token.length).toBe(64); // 32 bytes as hex = 64 characters
      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should generate unique tokens', () => {
      const token1 = mockGenerateCsrfToken();
      const token2 = mockGenerateCsrfToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('csrfProtection middleware', () => {
    it('should allow GET requests without CSRF token', () => {
      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();
      const next = createMockNext();

      mockCsrfProtection(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow HEAD requests without CSRF token', () => {
      const req = createMockRequest({ method: 'HEAD' });
      const res = createMockResponse();
      const next = createMockNext();

      mockCsrfProtection(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow OPTIONS requests without CSRF token', () => {
      const req = createMockRequest({ method: 'OPTIONS' });
      const res = createMockResponse();
      const next = createMockNext();

      mockCsrfProtection(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should skip CSRF for webhook paths', () => {
      const req = createMockRequest({
        method: 'POST',
        path: '/api/v1/webhooks/stripe',
      });
      const res = createMockResponse();
      const next = createMockNext();

      mockCsrfProtection(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should skip CSRF for login endpoint', () => {
      const req = createMockRequest({
        method: 'POST',
        path: '/api/v1/auth/login',
      });
      const res = createMockResponse();
      const next = createMockNext();

      mockCsrfProtection(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should skip CSRF for register endpoint', () => {
      const req = createMockRequest({
        method: 'POST',
        path: '/api/v1/auth/register',
      });
      const res = createMockResponse();
      const next = createMockNext();

      mockCsrfProtection(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should skip CSRF for refresh token endpoint', () => {
      const req = createMockRequest({
        method: 'POST',
        path: '/api/v1/auth/refresh',
      });
      const res = createMockResponse();
      const next = createMockNext();

      mockCsrfProtection(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject POST without CSRF token', () => {
      const req = createMockRequest({
        method: 'POST',
        path: '/api/v1/users',
        headers: {},
        cookies: {},
      });
      const res = createMockResponse();
      const next = createMockNext();

      mockCsrfProtection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'CSRF_TOKEN_MISSING',
          message: 'CSRF token is required for this request',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject PUT without CSRF token', () => {
      const req = createMockRequest({
        method: 'PUT',
        path: '/api/v1/users/123',
        headers: {},
        cookies: {},
      });
      const res = createMockResponse();
      const next = createMockNext();

      mockCsrfProtection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject DELETE without CSRF token', () => {
      const req = createMockRequest({
        method: 'DELETE',
        path: '/api/v1/users/123',
        headers: {},
        cookies: {},
      });
      const res = createMockResponse();
      const next = createMockNext();

      mockCsrfProtection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject PATCH without CSRF token', () => {
      const req = createMockRequest({
        method: 'PATCH',
        path: '/api/v1/users/123',
        headers: {},
        cookies: {},
      });
      const res = createMockResponse();
      const next = createMockNext();

      mockCsrfProtection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject when header token is missing', () => {
      const req = createMockRequest({
        method: 'POST',
        path: '/api/v1/users',
        headers: {},
        cookies: { csrf_token: 'test-token' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      mockCsrfProtection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'CSRF_TOKEN_MISSING',
          }),
        })
      );
    });

    it('should reject when cookie token is missing', () => {
      const req = createMockRequest({
        method: 'POST',
        path: '/api/v1/users',
        headers: { 'x-csrf-token': 'test-token' },
        cookies: {},
      });
      const res = createMockResponse();
      const next = createMockNext();

      mockCsrfProtection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'CSRF_TOKEN_MISSING',
          }),
        })
      );
    });

    it('should reject when tokens do not match', () => {
      const req = createMockRequest({
        method: 'POST',
        path: '/api/v1/users',
        headers: { 'x-csrf-token': 'token1' },
        cookies: { csrf_token: 'token2' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      mockCsrfProtection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'CSRF_TOKEN_INVALID',
          message: 'Invalid CSRF token',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('csrfTokenHandler', () => {
    it('should generate and return CSRF token', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      res.cookie = vi.fn();

      mockCsrfTokenHandler(req, res);

      expect(res.cookie).toHaveBeenCalledWith(
        'csrf_token',
        expect.any(String),
        expect.objectContaining({
          httpOnly: false,
          sameSite: 'strict',
        })
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          token: expect.any(String),
          expiresIn: 24 * 60 * 60 * 1000,
        },
      });
    });

    it('should set secure cookie in production', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      res.cookie = vi.fn();

      // Mock production environment
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      mockCsrfTokenHandler(req, res);

      const cookieCall = (res.cookie as any).mock.calls[0];
      expect(cookieCall[2].secure).toBe(true);

      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should not set secure cookie in development', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      res.cookie = vi.fn();

      // Mock development environment
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      mockCsrfTokenHandler(req, res);

      const cookieCall = (res.cookie as any).mock.calls[0];
      expect(cookieCall[2].secure).toBe(false);

      process.env.NODE_ENV = originalNodeEnv;
    });
  });

  describe('clearCsrfToken', () => {
    it('should clear CSRF cookie', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      res.clearCookie = vi.fn();

      mockClearCsrfToken(req, res);

      expect(res.clearCookie).toHaveBeenCalledWith(
        'csrf_token',
        expect.objectContaining({
          httpOnly: false,
          sameSite: 'strict',
        })
      );
    });
  });
});

// ============================================
// INTEGRATION TESTS
// ============================================

describe('middleware integration scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should authenticate then authorize successfully', () => {
    const token = createValidToken({ userId: 'user-123', salonId: 'salon-123', role: 'admin' });
    const req = createMockRequest({
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    const res = createMockResponse();
    const authNext = createMockNext();
    const authorizeNext = createMockNext();

    // Step 1: Authenticate
    authenticate(req, res, authNext);
    expect(authNext).toHaveBeenCalled();
    expect(req.user).toBeDefined();

    // Step 2: Authorize
    const authorizeMiddleware = authorize('admin');
    authorizeMiddleware(req, res, authorizeNext);
    expect(authorizeNext).toHaveBeenCalled();
  });

  it('should fail authorization if authentication did not set user', () => {
    const req = createMockRequest();
    // No authentication step, so req.user is undefined
    const res = createMockResponse();
    const next = createMockNext();

    const authorizeMiddleware = authorize('admin');
    authorizeMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle error from failed authentication in error handler', () => {
    // This simulates an authentication error being passed to error handler
    const error = new Error('Invalid token') as any;
    error.statusCode = 401;
    error.code = 'INVALID_TOKEN';

    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockCaptureException).not.toHaveBeenCalled(); // Ignored error code
  });
});

// ============================================
// CLIENT AUTH MIDDLEWARE TESTS
// ============================================

// Mock prisma for client auth tests
vi.mock('@peacase/database', () => ({
  prisma: {
    client: {
      findUnique: vi.fn(),
    },
  },
}));

import { authenticateClient } from '../middleware/clientAuth.js';
import { staffOnly, ownDataOnly, setStaffFilter } from '../middleware/staffAuth.js';

describe('authenticateClient middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should authenticate valid client token', async () => {
    const mockPrisma = (await import('@peacase/database')).prisma;

    const clientPayload = {
      clientId: 'client-123',
      salonId: 'salon-123',
      email: 'client@test.com',
      type: 'client',
    };

    const token = jwt.sign(
      clientPayload,
      'test-secret-key-for-middleware-testing-12345',
      { expiresIn: '15m' }
    );

    (mockPrisma.client.findUnique as any).mockResolvedValue({
      id: 'client-123',
      salonId: 'salon-123',
      email: 'client@test.com',
      firstName: 'John',
      lastName: 'Doe',
      isActive: true,
    });

    const req = createMockRequest({
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await authenticateClient(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect((req as any).client).toBeDefined();
    expect((req as any).client.id).toBe('client-123');
  });

  it('should return 401 when no token provided', async () => {
    const req = createMockRequest({
      headers: {},
    });
    const res = createMockResponse();
    const next = createMockNext();

    await authenticateClient(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'No token provided',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when token is invalid', async () => {
    const req = createMockRequest({
      headers: {
        authorization: 'Bearer invalid-token',
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await authenticateClient(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when token type is not client', async () => {
    const token = jwt.sign(
      {
        userId: 'user-123',
        salonId: 'salon-123',
        role: 'admin',
      },
      'test-secret-key-for-middleware-testing-12345',
      { expiresIn: '15m' }
    );

    const req = createMockRequest({
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await authenticateClient(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid token type',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should authenticate with valid token even if client not in database', async () => {
    // Note: authenticateClient middleware does NOT check database
    // It only validates JWT and stores payload in request
    // Route handlers are responsible for checking if client exists
    const mockPrisma = (await import('@peacase/database')).prisma;

    const token = jwt.sign(
      {
        clientId: 'nonexistent',
        salonId: 'salon-123',
        email: 'test@test.com',
        type: 'client',
      },
      'test-secret-key-for-middleware-testing-12345',
      { expiresIn: '15m' }
    );

    (mockPrisma.client.findUnique as any).mockResolvedValue(null);

    const req = createMockRequest({
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await authenticateClient(req, res, next);

    // Should pass authentication (JWT is valid)
    expect(next).toHaveBeenCalledTimes(1);
    expect((req as any).client).toBeDefined();
    expect((req as any).client.id).toBe('nonexistent');
  });

  it('should authenticate with valid token regardless of client active status', async () => {
    // Note: authenticateClient middleware does NOT check isActive
    // It only validates JWT and stores payload in request
    // Route handlers are responsible for checking if client is active
    const mockPrisma = (await import('@peacase/database')).prisma;

    const token = jwt.sign(
      {
        clientId: 'client-123',
        salonId: 'salon-123',
        email: 'test@test.com',
        type: 'client',
      },
      'test-secret-key-for-middleware-testing-12345',
      { expiresIn: '15m' }
    );

    (mockPrisma.client.findUnique as any).mockResolvedValue({
      id: 'client-123',
      salonId: 'salon-123',
      email: 'test@test.com',
      firstName: 'John',
      lastName: 'Doe',
      isActive: false, // Inactive
    });

    const req = createMockRequest({
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await authenticateClient(req, res, next);

    // Should pass authentication (JWT is valid)
    expect(next).toHaveBeenCalledTimes(1);
    expect((req as any).client).toBeDefined();
    expect((req as any).client.id).toBe('client-123');
  });
});

// ============================================
// STAFF AUTH MIDDLEWARE TESTS
// ============================================

describe('staffOnly middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow staff role', () => {
    const req = createMockRequest();
    req.user = { userId: 'user-123', salonId: 'salon-123', role: 'staff' };
    const res = createMockResponse();
    const next = createMockNext();

    staffOnly(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should allow admin role', () => {
    const req = createMockRequest();
    req.user = { userId: 'user-123', salonId: 'salon-123', role: 'admin' };
    const res = createMockResponse();
    const next = createMockNext();

    staffOnly(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should allow owner role', () => {
    const req = createMockRequest();
    req.user = { userId: 'user-123', salonId: 'salon-123', role: 'owner' };
    const res = createMockResponse();
    const next = createMockNext();

    staffOnly(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should return 401 when not authenticated', () => {
    const req = createMockRequest();
    // No req.user
    const res = createMockResponse();
    const next = createMockNext();

    staffOnly(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 when role is not staff/admin/owner', () => {
    const req = createMockRequest();
    req.user = { userId: 'user-123', salonId: 'salon-123', role: 'client' };
    const res = createMockResponse();
    const next = createMockNext();

    staffOnly(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('ownDataOnly middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow admin to access any staff data', () => {
    const req = createMockRequest();
    req.user = { userId: 'admin-123', salonId: 'salon-123', role: 'admin' };
    req.params = { staffId: 'other-staff-123' };
    const res = createMockResponse();
    const next = createMockNext();

    ownDataOnly(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should allow owner to access any staff data', () => {
    const req = createMockRequest();
    req.user = { userId: 'owner-123', salonId: 'salon-123', role: 'owner' };
    req.params = { staffId: 'staff-123' };
    const res = createMockResponse();
    const next = createMockNext();

    ownDataOnly(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should allow staff to access their own data', () => {
    const req = createMockRequest();
    req.user = { userId: 'staff-123', salonId: 'salon-123', role: 'staff' };
    req.params = { staffId: 'staff-123' };
    const res = createMockResponse();
    const next = createMockNext();

    ownDataOnly(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should allow staff when no staffId param (general endpoint)', () => {
    const req = createMockRequest();
    req.user = { userId: 'staff-123', salonId: 'salon-123', role: 'staff' };
    req.params = {};
    const res = createMockResponse();
    const next = createMockNext();

    ownDataOnly(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should return 403 when staff tries to access other staff data', () => {
    const req = createMockRequest();
    req.user = { userId: 'staff-123', salonId: 'salon-123', role: 'staff' };
    req.params = { staffId: 'other-staff-456' };
    const res = createMockResponse();
    const next = createMockNext();

    ownDataOnly(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You can only access your own data',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should use id param if staffId not available', () => {
    const req = createMockRequest();
    req.user = { userId: 'staff-123', salonId: 'salon-123', role: 'staff' };
    req.params = { id: 'staff-123' };
    const res = createMockResponse();
    const next = createMockNext();

    ownDataOnly(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should return 401 when not authenticated', () => {
    const req = createMockRequest();
    // No req.user
    const res = createMockResponse();
    const next = createMockNext();

    ownDataOnly(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('setStaffFilter middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should set staffId filter for staff users', () => {
    const req = createMockRequest();
    req.user = { userId: 'staff-123', salonId: 'salon-123', role: 'staff' };
    req.query = {};
    const res = createMockResponse();
    const next = createMockNext();

    setStaffFilter(req, res, next);

    expect(req.query.staffId).toBe('staff-123');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should not set staffId filter for admin users', () => {
    const req = createMockRequest();
    req.user = { userId: 'admin-123', salonId: 'salon-123', role: 'admin' };
    req.query = {};
    const res = createMockResponse();
    const next = createMockNext();

    setStaffFilter(req, res, next);

    expect(req.query.staffId).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should not set staffId filter for owner users', () => {
    const req = createMockRequest();
    req.user = { userId: 'owner-123', salonId: 'salon-123', role: 'owner' };
    req.query = {};
    const res = createMockResponse();
    const next = createMockNext();

    setStaffFilter(req, res, next);

    expect(req.query.staffId).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should return 401 when not authenticated', () => {
    const req = createMockRequest();
    // No req.user
    const res = createMockResponse();
    const next = createMockNext();

    setStaffFilter(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
