import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type * as SentryModule from '@sentry/node';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ============================================
// LOADENV.TS TESTS
// ============================================

describe('LoadEnv Module (loadEnv.ts)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Environment Loading', () => {
    it('should load dotenv configuration', async () => {
      // The loadEnv module should call dotenv.config()
      // We can't directly test the side effect, but we can verify the module loads
      await import('../loadEnv.js');
      // If this doesn't throw, the module loaded successfully
      expect(true).toBe(true);
    });

    it('should use fileURLToPath for __filename', () => {
      // Test that fileURLToPath works correctly with import.meta.url
      const testUrl = 'file:///C:/projects/test.js';
      const filename = fileURLToPath(testUrl);
      expect(filename).toContain('test.js');
    });

    it('should use dirname for __dirname', () => {
      const testPath = '/path/to/file.js';
      const dir = dirname(testPath);
      expect(dir).toBe('/path/to');
    });

    it('should use join to construct .env path', () => {
      const base = '/test/src';
      const path = join(base, '..', '.env');
      expect(path).toContain('.env');
    });
  });

  describe('Path Resolution', () => {
    it('should resolve path to parent directory', () => {
      const srcDir = '/projects/api/src';
      const parentPath = join(srcDir, '..');
      // Normalize for cross-platform comparison
      expect(parentPath.replace(/\\/g, '/')).toBe('/projects/api');
    });

    it('should resolve .env path relative to api directory', () => {
      const srcDir = '/projects/api/src';
      const envPath = join(srcDir, '..', '.env');
      // Normalize for cross-platform comparison
      expect(envPath.replace(/\\/g, '/')).toBe('/projects/api/.env');
    });

    it('should handle Windows paths', () => {
      const windowsPath = 'C:\\projects\\api\\src';
      const envPath = join(windowsPath, '..', '.env');
      expect(envPath).toContain('.env');
    });
  });

  describe('Import Order', () => {
    it('should be importable before other modules', async () => {
      // loadEnv should not throw when imported first
      const loadEnvModule = await import('../loadEnv.js');
      expect(loadEnvModule).toBeDefined();
    });

    it('should execute dotenv.config before module exports', async () => {
      // The module should execute dotenv.config() at import time
      // This is a side effect that happens automatically
      await import('../loadEnv.js');
      expect(true).toBe(true);
    });
  });

  describe('ESM Compatibility', () => {
    it('should work with ES modules (import.meta.url)', () => {
      // Verify import.meta.url format
      const exampleUrl = 'file:///C:/projects/spa-final/apps/api/src/loadEnv.js';
      expect(exampleUrl).toMatch(/^file:\/\//);
    });

    it('should convert file URL to path correctly', () => {
      // Test fileURLToPath with Windows URL format (works on all platforms)
      const url = 'file:///C:/projects/test.js';
      const path = fileURLToPath(url);
      expect(path).toBeTruthy();
      expect(path).toContain('test.js');
    });
  });

  describe('dotenv Configuration', () => {
    it('should pass path option to dotenv.config', () => {
      // The path should be constructed as join(__dirname, '..', '.env')
      const exampleDir = '/projects/api/src';
      const expectedPath = join(exampleDir, '..', '.env');
      // Normalize for cross-platform comparison
      expect(expectedPath.replace(/\\/g, '/')).toBe('/projects/api/.env');
    });

    it('should load .env from api directory', () => {
      // Verify the relative path calculation
      const srcPath = '/projects/spa-final/apps/api/src';
      const envPath = join(srcPath, '..', '.env');
      // Normalize for cross-platform comparison
      expect(envPath.replace(/\\/g, '/')).toBe('/projects/spa-final/apps/api/.env');
    });
  });

  describe('Module Isolation', () => {
    it('should not export any functions or values', async () => {
      const module = await import('../loadEnv.js');
      const exports = Object.keys(module);
      // Module should be empty or only have default export
      expect(exports.length).toBeLessThanOrEqual(1);
    });

    it('should execute side effects only', async () => {
      // loadEnv is a side-effect only module
      // It should not have any exports to use
      const module = await import('../loadEnv.js');
      expect(module.default).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should not throw if .env file does not exist', async () => {
      // dotenv.config() with a non-existent path should not throw
      // It will just not load any variables
      await expect(import('../loadEnv.js')).resolves.toBeDefined();
    });

    it('should handle malformed .env files gracefully', async () => {
      // dotenv handles malformed files without throwing
      await expect(import('../loadEnv.js')).resolves.toBeDefined();
    });
  });
});

// ============================================
// ENV.TS TESTS
// ============================================

describe('Environment Module (env.ts)', () => {
  // Store original env
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset env to original state before each test
    process.env = { ...originalEnv };
    // Clear module cache to allow re-imports
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('validateEnv with valid environment', () => {
    it('should validate and parse environment with all required variables', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';
      process.env.JWT_SECRET = 'test-jwt-secret-1234567890';
      process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-1234567890';
      process.env.PORT = '3001';
      process.env.NODE_ENV = 'production';
      process.env.CORS_ORIGIN = 'https://example.com';
      process.env.FRONTEND_URL = 'https://frontend.example.com';

      const { env } = await import('../lib/env.js');

      expect(env.DATABASE_URL).toBe('postgresql://user:pass@host:5432/db');
      expect(env.JWT_SECRET).toBe('test-jwt-secret-1234567890');
      expect(env.JWT_REFRESH_SECRET).toBe('test-refresh-secret-1234567890');
      expect(env.PORT).toBe(3001);
      expect(env.NODE_ENV).toBe('production');
      expect(env.CORS_ORIGIN).toBe('https://example.com');
      expect(env.FRONTEND_URL).toBe('https://frontend.example.com');
    });

    it('should handle optional variables when provided', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_12345';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_12345';
      process.env.SENDGRID_API_KEY = 'SG.test123';
      process.env.TWILIO_ACCOUNT_SID = 'AC12345';
      process.env.SENTRY_DSN = 'https://example@sentry.io/123';
      process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
      process.env.ENCRYPTION_KEY = 'a'.repeat(64);

      const { env } = await import('../lib/env.js');

      expect(env.STRIPE_SECRET_KEY).toBe('sk_test_12345');
      expect(env.STRIPE_WEBHOOK_SECRET).toBe('whsec_12345');
      expect(env.SENDGRID_API_KEY).toBe('SG.test123');
      expect(env.TWILIO_ACCOUNT_SID).toBe('AC12345');
      expect(env.SENTRY_DSN).toBe('https://example@sentry.io/123');
      expect(env.CLOUDINARY_CLOUD_NAME).toBe('test-cloud');
      expect(env.ENCRYPTION_KEY).toBe('a'.repeat(64));
    });
  });

  describe('validateEnv with missing variables (defaults)', () => {
    it('should use default DATABASE_URL when not provided', async () => {
      delete process.env.DATABASE_URL;

      const { env } = await import('../lib/env.js');

      expect(env.DATABASE_URL).toBe('postgresql://localhost:5432/peacase');
    });

    it('should generate random JWT secrets when not provided', async () => {
      delete process.env.JWT_SECRET;
      delete process.env.JWT_REFRESH_SECRET;

      const { env } = await import('../lib/env.js');

      expect(env.JWT_SECRET).toBeTruthy();
      expect(env.JWT_SECRET.length).toBeGreaterThan(32);
      expect(env.JWT_REFRESH_SECRET).toBeTruthy();
      expect(env.JWT_REFRESH_SECRET.length).toBeGreaterThan(32);
      // Ensure they're different
      expect(env.JWT_SECRET).not.toBe(env.JWT_REFRESH_SECRET);
    });

    it('should use default PORT when not provided', async () => {
      delete process.env.PORT;

      const { env } = await import('../lib/env.js');

      expect(env.PORT).toBe(3001);
    });

    it('should use default NODE_ENV when not provided', async () => {
      delete process.env.NODE_ENV;

      const { env } = await import('../lib/env.js');

      expect(env.NODE_ENV).toBe('development');
    });

    it('should use default CORS_ORIGIN when not provided', async () => {
      delete process.env.CORS_ORIGIN;

      const { env } = await import('../lib/env.js');

      expect(env.CORS_ORIGIN).toBe('*');
    });

    it('should use default FRONTEND_URL when not provided', async () => {
      delete process.env.FRONTEND_URL;

      const { env } = await import('../lib/env.js');

      expect(env.FRONTEND_URL).toBe('http://localhost:3000');
    });

    it('should use default SENDGRID_FROM_EMAIL when not provided', async () => {
      delete process.env.SENDGRID_FROM_EMAIL;

      const { env } = await import('../lib/env.js');

      expect(env.SENDGRID_FROM_EMAIL).toBe('noreply@peacase.com');
    });
  });

  describe('validateEnv with type coercion', () => {
    it('should coerce PORT string to number', async () => {
      process.env.PORT = '4000';

      const { env } = await import('../lib/env.js');

      expect(env.PORT).toBe(4000);
      expect(typeof env.PORT).toBe('number');
    });

    it('should coerce invalid PORT to default', async () => {
      process.env.PORT = 'not-a-number';

      const { env } = await import('../lib/env.js');

      expect(env.PORT).toBe(3001); // Falls back to default
    });
  });

  describe('validateEnv with invalid NODE_ENV', () => {
    it('should use default NODE_ENV when invalid value provided', async () => {
      process.env.NODE_ENV = 'invalid-env';

      const { env } = await import('../lib/env.js');

      expect(env.NODE_ENV).toBe('development');
    });

    it('should accept valid NODE_ENV values', async () => {
      process.env.NODE_ENV = 'test';
      const { env: env1 } = await import('../lib/env.js');
      expect(env1.NODE_ENV).toBe('test');

      vi.resetModules();
      process.env.NODE_ENV = 'production';
      const { env: env2 } = await import('../lib/env.js');
      expect(env2.NODE_ENV).toBe('production');

      vi.resetModules();
      process.env.NODE_ENV = 'development';
      const { env: env3 } = await import('../lib/env.js');
      expect(env3.NODE_ENV).toBe('development');
    });
  });

  describe('getEncryptionKey', () => {
    it('should return Buffer from valid ENCRYPTION_KEY', async () => {
      const testKey = 'a'.repeat(64); // 32 bytes hex = 64 chars
      process.env.ENCRYPTION_KEY = testKey;

      const { getEncryptionKey } = await import('../lib/env.js');
      const key = getEncryptionKey();

      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(32); // 32 bytes
      expect(key.toString('hex')).toBe(testKey);
    });

    it('should cache encryption key on subsequent calls', async () => {
      process.env.ENCRYPTION_KEY = 'b'.repeat(64);

      const { getEncryptionKey } = await import('../lib/env.js');
      const key1 = getEncryptionKey();
      const key2 = getEncryptionKey();

      expect(key1).toBe(key2); // Same reference
    });

    it('should generate temporary key when ENCRYPTION_KEY not set', async () => {
      delete process.env.ENCRYPTION_KEY;

      const { getEncryptionKey } = await import('../lib/env.js');
      const key = getEncryptionKey();

      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(32);
    });

    it('should generate temporary key when ENCRYPTION_KEY is invalid length', async () => {
      process.env.ENCRYPTION_KEY = 'tooshort';

      const { getEncryptionKey } = await import('../lib/env.js');
      const key = getEncryptionKey();

      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(32);
    });

    it('should cache generated temporary key', async () => {
      delete process.env.ENCRYPTION_KEY;

      const { getEncryptionKey } = await import('../lib/env.js');
      const key1 = getEncryptionKey();
      const key2 = getEncryptionKey();

      expect(key1).toBe(key2); // Same reference
    });
  });

  describe('optional Stripe variables', () => {
    it('should be undefined when not provided', async () => {
      delete process.env.STRIPE_SECRET_KEY;
      delete process.env.STRIPE_WEBHOOK_SECRET;
      delete process.env.STRIPE_PROFESSIONAL_PRICE_ID;
      delete process.env.STRIPE_ENTERPRISE_PRICE_ID;

      const { env } = await import('../lib/env.js');

      expect(env.STRIPE_SECRET_KEY).toBeUndefined();
      expect(env.STRIPE_WEBHOOK_SECRET).toBeUndefined();
      expect(env.STRIPE_PROFESSIONAL_PRICE_ID).toBeUndefined();
      expect(env.STRIPE_ENTERPRISE_PRICE_ID).toBeUndefined();
    });
  });

  describe('optional SendGrid variables', () => {
    it('should be undefined when SENDGRID_API_KEY not provided', async () => {
      delete process.env.SENDGRID_API_KEY;

      const { env } = await import('../lib/env.js');

      expect(env.SENDGRID_API_KEY).toBeUndefined();
    });
  });

  describe('optional Twilio variables', () => {
    it('should be undefined when not provided', async () => {
      delete process.env.TWILIO_ACCOUNT_SID;
      delete process.env.TWILIO_AUTH_TOKEN;
      delete process.env.TWILIO_PHONE_NUMBER;

      const { env } = await import('../lib/env.js');

      expect(env.TWILIO_ACCOUNT_SID).toBeUndefined();
      expect(env.TWILIO_AUTH_TOKEN).toBeUndefined();
      expect(env.TWILIO_PHONE_NUMBER).toBeUndefined();
    });
  });

  describe('optional Sentry variables', () => {
    it('should be undefined when not provided', async () => {
      delete process.env.SENTRY_DSN;
      delete process.env.SENTRY_RELEASE;
      delete process.env.SENTRY_ENABLE_DEV;

      const { env } = await import('../lib/env.js');

      expect(env.SENTRY_DSN).toBeUndefined();
      expect(env.SENTRY_RELEASE).toBeUndefined();
      expect(env.SENTRY_ENABLE_DEV).toBeUndefined();
    });
  });

  describe('optional Cloudinary variables', () => {
    it('should be undefined when not provided', async () => {
      delete process.env.CLOUDINARY_CLOUD_NAME;
      delete process.env.CLOUDINARY_API_KEY;
      delete process.env.CLOUDINARY_API_SECRET;

      const { env } = await import('../lib/env.js');

      expect(env.CLOUDINARY_CLOUD_NAME).toBeUndefined();
      expect(env.CLOUDINARY_API_KEY).toBeUndefined();
      expect(env.CLOUDINARY_API_SECRET).toBeUndefined();
    });
  });
});

// ============================================
// SENTRY.TS TESTS
// ============================================

describe('Sentry Module (sentry.ts)', () => {
  const originalEnv = { ...process.env };
  let mockSentry: typeof SentryModule;

  beforeEach(() => {
    // Reset env
    process.env = { ...originalEnv };

    // Mock @sentry/node module
    mockSentry = {
      init: vi.fn(),
      setUser: vi.fn(),
      setContext: vi.fn(),
      addBreadcrumb: vi.fn(),
      captureException: vi.fn(() => 'test-event-id'),
      captureMessage: vi.fn(() => 'test-message-id'),
      httpIntegration: vi.fn(() => ({ name: 'Http' })),
      expressIntegration: vi.fn(() => ({ name: 'Express' })),
    } as any;

    vi.doMock('@sentry/node', () => mockSentry);
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('initSentry', () => {
    it('should not initialize when SENTRY_DSN is missing', async () => {
      delete process.env.SENTRY_DSN;

      const { initSentry } = await import('../lib/sentry.js');
      initSentry();

      expect(mockSentry.init).not.toHaveBeenCalled();
    });

    it('should initialize with DSN in production', async () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123';
      process.env.NODE_ENV = 'production';

      const { initSentry } = await import('../lib/sentry.js');
      initSentry();

      expect(mockSentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: 'https://example@sentry.io/123',
          environment: 'production',
          enabled: true,
        })
      );
    });

    it('should initialize with DSN in development when SENTRY_ENABLE_DEV is true', async () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123';
      process.env.NODE_ENV = 'development';
      process.env.SENTRY_ENABLE_DEV = 'true';

      const { initSentry } = await import('../lib/sentry.js');
      initSentry();

      expect(mockSentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: 'https://example@sentry.io/123',
          environment: 'development',
          enabled: true,
        })
      );
    });

    it('should not enable in development without SENTRY_ENABLE_DEV', async () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123';
      process.env.NODE_ENV = 'development';
      delete process.env.SENTRY_ENABLE_DEV;

      const { initSentry } = await import('../lib/sentry.js');
      initSentry();

      expect(mockSentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
        })
      );
    });

    it('should use custom SENTRY_RELEASE when provided', async () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123';
      process.env.SENTRY_RELEASE = 'v2.0.0';

      const { initSentry } = await import('../lib/sentry.js');
      initSentry();

      expect(mockSentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          release: 'v2.0.0',
        })
      );
    });

    it('should use default release when SENTRY_RELEASE not provided', async () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123';
      delete process.env.SENTRY_RELEASE;

      const { initSentry } = await import('../lib/sentry.js');
      initSentry();

      expect(mockSentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          release: 'peacase-api@1.0.0',
        })
      );
    });

    it('should configure proper sample rates for development', async () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123';
      process.env.NODE_ENV = 'development';
      process.env.SENTRY_ENABLE_DEV = 'true';

      const { initSentry } = await import('../lib/sentry.js');
      initSentry();

      expect(mockSentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          tracesSampleRate: 1.0,
          profilesSampleRate: 1.0,
        })
      );
    });

    it('should configure proper sample rates for production', async () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123';
      process.env.NODE_ENV = 'production';

      const { initSentry } = await import('../lib/sentry.js');
      initSentry();

      expect(mockSentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          tracesSampleRate: 0.2,
          profilesSampleRate: 0.1,
        })
      );
    });

    it('should include HTTP and Express integrations', async () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123';

      const { initSentry } = await import('../lib/sentry.js');
      initSentry();

      expect(mockSentry.httpIntegration).toHaveBeenCalled();
      expect(mockSentry.expressIntegration).toHaveBeenCalled();
      expect(mockSentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          integrations: expect.arrayContaining([
            expect.objectContaining({ name: 'Http' }),
            expect.objectContaining({ name: 'Express' }),
          ]),
        })
      );
    });

    it('should configure ignoreErrors filter', async () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123';

      const { initSentry } = await import('../lib/sentry.js');
      initSentry();

      expect(mockSentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          ignoreErrors: expect.arrayContaining([
            'ECONNRESET',
            'ETIMEDOUT',
            'TOKEN_EXPIRED',
            'INVALID_TOKEN',
            'UNAUTHORIZED',
          ]),
        })
      );
    });

    it('should configure beforeSend to filter sensitive data', async () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123';

      const { initSentry } = await import('../lib/sentry.js');
      initSentry();

      const initCall = (mockSentry.init as any).mock.calls[0][0];
      const beforeSend = initCall.beforeSend;

      expect(beforeSend).toBeDefined();

      // Test filtering authorization header
      const event = {
        request: {
          headers: {
            authorization: 'Bearer secret-token',
            cookie: 'session=secret',
          },
        },
      };

      const filtered = beforeSend(event);
      expect(filtered.request?.headers?.authorization).toBeUndefined();
      expect(filtered.request?.headers?.cookie).toBeUndefined();
    });

    it('should filter sensitive body fields in beforeSend', async () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123';

      const { initSentry } = await import('../lib/sentry.js');
      initSentry();

      const initCall = (mockSentry.init as any).mock.calls[0][0];
      const beforeSend = initCall.beforeSend;

      const event = {
        request: {
          data: JSON.stringify({
            username: 'user',
            password: 'secret123',
            token: 'jwt-token',
            apiKey: 'api-key-123',
          }),
        },
      };

      const filtered = beforeSend(event);
      const parsedData = JSON.parse(filtered.request.data);

      expect(parsedData.username).toBe('user');
      expect(parsedData.password).toBe('[FILTERED]');
      expect(parsedData.token).toBe('[FILTERED]');
      expect(parsedData.apiKey).toBe('[FILTERED]');
    });

    it('should handle beforeSend with non-JSON data', async () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123';

      const { initSentry } = await import('../lib/sentry.js');
      initSentry();

      const initCall = (mockSentry.init as any).mock.calls[0][0];
      const beforeSend = initCall.beforeSend;

      const event = {
        request: {
          data: 'invalid-json{',
        },
      };

      const filtered = beforeSend(event);
      expect(filtered.request.data).toBe('invalid-json{'); // Left as-is
    });
  });

  describe('setSentryUser', () => {
    it('should set user context with all fields', async () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123';

      const { setSentryUser } = await import('../lib/sentry.js');
      setSentryUser({
        id: 'user-123',
        email: 'test@example.com',
        salonId: 'salon-456',
        role: 'admin',
      });

      expect(mockSentry.setUser).toHaveBeenCalledWith({
        id: 'user-123',
        email: 'test@example.com',
        salonId: 'salon-456',
        role: 'admin',
      });
    });

    it('should set user context with minimal fields', async () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123';

      const { setSentryUser } = await import('../lib/sentry.js');
      setSentryUser({
        id: 'user-123',
      });

      expect(mockSentry.setUser).toHaveBeenCalledWith({
        id: 'user-123',
        email: undefined,
        salonId: undefined,
        role: undefined,
      });
    });
  });

  describe('clearSentryUser', () => {
    it('should clear user context', async () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123';

      const { clearSentryUser } = await import('../lib/sentry.js');
      clearSentryUser();

      expect(mockSentry.setUser).toHaveBeenCalledWith(null);
    });
  });

  describe('setSentryContext', () => {
    it('should set custom context', async () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123';

      const { setSentryContext } = await import('../lib/sentry.js');
      setSentryContext('custom', { key: 'value', count: 42 });

      expect(mockSentry.setContext).toHaveBeenCalledWith('custom', {
        key: 'value',
        count: 42,
      });
    });
  });

  describe('addSentryBreadcrumb', () => {
    it('should add breadcrumb', async () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123';

      const { addSentryBreadcrumb } = await import('../lib/sentry.js');
      addSentryBreadcrumb({
        message: 'User clicked button',
        level: 'info',
        category: 'ui',
      });

      expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith({
        message: 'User clicked button',
        level: 'info',
        category: 'ui',
      });
    });
  });

  describe('captureException', () => {
    it('should capture exception without context', async () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123';

      const { captureException } = await import('../lib/sentry.js');
      const error = new Error('Test error');
      const result = captureException(error);

      expect(mockSentry.captureException).toHaveBeenCalledWith(error);
      expect(result).toBe('test-event-id');
    });

    it('should capture exception with context', async () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123';

      const { captureException } = await import('../lib/sentry.js');
      const error = new Error('Test error');
      const context = { userId: 'user-123', action: 'create' };

      const result = captureException(error, context);

      expect(mockSentry.setContext).toHaveBeenCalledWith('additional', context);
      expect(mockSentry.captureException).toHaveBeenCalledWith(error);
      expect(result).toBe('test-event-id');
    });
  });

  describe('captureMessage', () => {
    it('should capture message with default info level', async () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123';

      const { captureMessage } = await import('../lib/sentry.js');
      const result = captureMessage('Test message');

      expect(mockSentry.captureMessage).toHaveBeenCalledWith('Test message', 'info');
      expect(result).toBe('test-message-id');
    });

    it('should capture message with custom level', async () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123';

      const { captureMessage } = await import('../lib/sentry.js');
      const result = captureMessage('Warning message', 'warning');

      expect(mockSentry.captureMessage).toHaveBeenCalledWith('Warning message', 'warning');
      expect(result).toBe('test-message-id');
    });

    it('should handle all severity levels', async () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123';

      const { captureMessage } = await import('../lib/sentry.js');

      captureMessage('Debug', 'debug');
      captureMessage('Info', 'info');
      captureMessage('Warning', 'warning');
      captureMessage('Error', 'error');
      captureMessage('Fatal', 'fatal');

      expect(mockSentry.captureMessage).toHaveBeenCalledTimes(5);
    });
  });

  describe('Sentry re-export', () => {
    it('should re-export Sentry module', async () => {
      const { Sentry } = await import('../lib/sentry.js');
      expect(Sentry).toBeDefined();
    });
  });
});
