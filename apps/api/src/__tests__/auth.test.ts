/**
 * Comprehensive Unit Tests for Auth Routes
 *
 * Tests all authentication endpoints with mocked dependencies:
 * - POST /api/v1/auth/register
 * - POST /api/v1/auth/login
 * - POST /api/v1/auth/logout
 * - POST /api/v1/auth/refresh
 * - POST /api/v1/auth/forgot-password
 * - POST /api/v1/auth/reset-password
 * - POST /api/v1/auth/verify-email
 * - POST /api/v1/auth/resend-verification
 *
 * Run with: pnpm test auth
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import crypto from 'crypto';
import {
  mockPrisma,
  configureMockReturn,
  configureMockImplementation,
  resetAllMocks,
  mockData,
} from './mocks/prisma';

// Mock external dependencies before importing routes
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(async (password: string) => `hashed_${password}`),
    compare: vi.fn(async (password: string, hash: string) => {
      return hash === `hashed_${password}`;
    }),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn((payload: any, secret: string, options: any) => {
      return `jwt_token_${payload.userId}_${options.expiresIn}`;
    }),
    verify: vi.fn((token: string, secret: string) => {
      // Mock token verification - extract userId from mock token
      if (token.startsWith('jwt_token_')) {
        const parts = token.split('_');
        return {
          userId: parts[2] || 'user-123',
          salonId: 'salon-123',
          role: 'admin',
        };
      }
      if (token.startsWith('valid_refresh_')) {
        return {
          userId: token.replace('valid_refresh_', ''),
          salonId: 'salon-123',
          role: 'admin',
          type: 'refresh',
        };
      }
      throw new Error('Invalid token');
    }),
  },
}));

vi.mock('../services/email.js', () => ({
  sendEmail: vi.fn(async () => true),
  passwordResetEmail: vi.fn(() => '<html>Reset email</html>'),
  emailVerificationEmail: vi.fn(() => '<html>Verification email</html>'),
}));

vi.mock('../middleware/rateLimit.js', () => ({
  // New specific rate limiters
  loginRateLimit: vi.fn((req, res, next) => next()),
  signupRateLimit: vi.fn((req, res, next) => next()),
  passwordResetRateLimit: vi.fn((req, res, next) => next()),
  emailVerificationRateLimit: vi.fn((req, res, next) => next()),
  tokenRefreshRateLimit: vi.fn((req, res, next) => next()),
  generalRateLimit: vi.fn((req, res, next) => next()),
  // Legacy aliases for backward compatibility
  authRateLimit: vi.fn((req, res, next) => next()),
  strictRateLimit: vi.fn((req, res, next) => next()),
}));

vi.mock('../middleware/csrf.js', () => ({
  csrfTokenHandler: vi.fn((req, res) => res.json({ token: 'mock-csrf-token' })),
  clearCsrfToken: vi.fn((req, res) => {}),
}));

vi.mock('@peacase/database', () => ({
  prisma: mockPrisma,
}));

// Import after mocks are set up
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../services/email.js';
import { authRouter } from '../routes/auth';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRouter);

describe('Auth Routes - Comprehensive Unit Tests', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    describe('Success Cases', () => {
      it('should register new user with valid data', async () => {
        const mockSalon = mockData.salon({ id: 'new-salon-123' });
        const mockUser = mockData.user('new-salon-123', { id: 'new-user-123' });
        const mockToken = mockData.refreshToken('new-user-123');

        // Mock: no existing user
        configureMockReturn('user', 'findFirst', null);

        // Mock: no existing slug
        configureMockReturn('salon', 'findUnique', null);

        // Mock: salon creation
        configureMockReturn('salon', 'create', mockSalon);

        // Mock: user creation
        configureMockReturn('user', 'create', mockUser);

        // Mock: refresh token creation
        configureMockReturn('refreshToken', 'create', mockToken);

        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            ownerName: 'John Doe',
            email: 'john@test.com',
            password: 'SecurePass123',
            phone: '555-1234',
            businessName: 'John\'s Salon',
            businessType: 'salon',
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.user).toBeDefined();
        expect(response.body.data.user.id).toBe('new-user-123');
        expect(response.body.data.salon).toBeDefined();
        expect(response.body.data.salon.id).toBe('new-salon-123');
        expect(response.body.data.tokens).toBeDefined();
        expect(response.body.data.tokens.accessToken).toContain('jwt_token_');
        expect(response.body.data.tokens.refreshToken).toContain('jwt_token_');
      });

      it('should auto-generate business name from owner name if not provided', async () => {
        const mockSalon = mockData.salon({ name: 'John\'s Business' });
        const mockUser = mockData.user(mockSalon.id);

        configureMockReturn('user', 'findFirst', null);
        configureMockReturn('salon', 'findUnique', null);
        configureMockReturn('salon', 'create', mockSalon);
        configureMockReturn('user', 'create', mockUser);
        configureMockReturn('refreshToken', 'create', mockData.refreshToken(mockUser.id));

        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            ownerName: 'John Smith',
            email: 'john@test.com',
            password: 'SecurePass123',
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      it('should normalize email (trim and lowercase)', async () => {
        const mockSalon = mockData.salon();
        const mockUser = mockData.user(mockSalon.id, { email: 'test@example.com' });

        configureMockReturn('user', 'findFirst', null);
        configureMockReturn('salon', 'findUnique', null);
        configureMockReturn('salon', 'create', mockSalon);
        configureMockReturn('user', 'create', mockUser);
        configureMockReturn('refreshToken', 'create', mockData.refreshToken(mockUser.id));

        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            ownerName: 'Test User',
            email: '  TeSt@ExAmPlE.com  ',
            password: 'SecurePass123',
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      it('should handle slug collision by appending counter', async () => {
        const mockSalon = mockData.salon({ slug: 'test-salon-1' });
        const mockUser = mockData.user(mockSalon.id);

        configureMockReturn('user', 'findFirst', null);

        // First slug check: already exists
        configureMockImplementation('salon', 'findUnique', async (args) => {
          if (args?.where?.slug === 'test-salon') {
            return mockData.salon({ slug: 'test-salon' });
          }
          // Second check for test-salon-1: available
          return null;
        });

        configureMockReturn('salon', 'create', mockSalon);
        configureMockReturn('user', 'create', mockUser);
        configureMockReturn('refreshToken', 'create', mockData.refreshToken(mockUser.id));

        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            ownerName: 'Test User',
            email: 'test@example.com',
            password: 'SecurePass123',
            businessName: 'Test Salon',
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      it('should hash password with bcrypt', async () => {
        const mockSalon = mockData.salon();
        const mockUser = mockData.user(mockSalon.id);

        configureMockReturn('user', 'findFirst', null);
        configureMockReturn('salon', 'findUnique', null);
        configureMockReturn('salon', 'create', mockSalon);
        configureMockReturn('user', 'create', mockUser);
        configureMockReturn('refreshToken', 'create', mockData.refreshToken(mockUser.id));

        await request(app)
          .post('/api/v1/auth/register')
          .send({
            ownerName: 'Test User',
            email: 'test@test.com',
            password: 'MyPassword123',
          });

        expect(bcrypt.hash).toHaveBeenCalledWith('MyPassword123', 12);
      });
    });

    describe('Validation Errors', () => {
      it('should reject registration with missing ownerName', async () => {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: 'test@test.com',
            password: 'SecurePass123',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.message).toBe('Required');
      });

      it('should reject registration with ownerName too short', async () => {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            ownerName: 'A',
            email: 'test@test.com',
            password: 'SecurePass123',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should reject registration with missing email', async () => {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            ownerName: 'Test User',
            password: 'SecurePass123',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should reject registration with invalid email format', async () => {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            ownerName: 'Test User',
            email: 'not-an-email',
            password: 'SecurePass123',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.message).toContain('email');
      });

      it('should reject registration with missing password', async () => {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            ownerName: 'Test User',
            email: 'test@test.com',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should reject registration with password too short', async () => {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            ownerName: 'Test User',
            email: 'test@test.com',
            password: 'short',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.message).toContain('8 characters');
      });
    });

    describe('Business Logic Errors', () => {
      it('should reject registration when email already exists', async () => {
        const existingUser = mockData.user('salon-123', { email: 'existing@test.com' });
        const existingSalon = mockData.salon({ id: 'salon-123' });

        configureMockReturn('user', 'findFirst', { ...existingUser, salon: existingSalon });

        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            ownerName: 'New User',
            email: 'existing@test.com',
            password: 'SecurePass123',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('EMAIL_EXISTS');
        expect(response.body.error.message).toContain('already exists');
      });
    });
  });

  describe('POST /api/v1/auth/login', () => {
    describe('Success Cases', () => {
      it('should login successfully with valid credentials', async () => {
        const mockSalon = mockData.salon({ id: 'salon-123' });
        const mockUser = mockData.user('salon-123', {
          id: 'user-123',
          email: 'test@test.com',
          passwordHash: 'hashed_correctpass',
        });

        configureMockReturn('user', 'findFirst', {
          ...mockUser,
          salon: mockSalon,
        });
        configureMockReturn('user', 'update', mockUser);
        configureMockReturn('refreshToken', 'create', mockData.refreshToken('user-123'));

        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'test@test.com',
            password: 'correctpass',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.user).toBeDefined();
        expect(response.body.data.user.id).toBe('user-123');
        expect(response.body.data.salon).toBeDefined();
        expect(response.body.data.salon.id).toBe('salon-123');
        expect(response.body.data.tokens).toBeDefined();
        expect(response.body.data.tokens.accessToken).toBeDefined();
        expect(response.body.data.tokens.refreshToken).toBeDefined();
      });

      it('should update lastLogin timestamp on successful login', async () => {
        const mockSalon = mockData.salon();
        const mockUser = mockData.user(mockSalon.id, {
          email: 'test@test.com',
          passwordHash: 'hashed_password123',
        });

        configureMockReturn('user', 'findFirst', { ...mockUser, salon: mockSalon });
        configureMockReturn('user', 'update', mockUser);
        configureMockReturn('refreshToken', 'create', mockData.refreshToken(mockUser.id));

        await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'test@test.com',
            password: 'password123',
          });

        // Verify update was called
        expect(mockPrisma.user.update).toHaveBeenCalled();
      });

      it('should normalize email during login', async () => {
        const mockSalon = mockData.salon();
        const mockUser = mockData.user(mockSalon.id, {
          email: 'test@test.com',
          passwordHash: 'hashed_password',
        });

        configureMockReturn('user', 'findFirst', { ...mockUser, salon: mockSalon });
        configureMockReturn('user', 'update', mockUser);
        configureMockReturn('refreshToken', 'create', mockData.refreshToken(mockUser.id));

        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: '  TeSt@TeSt.CoM  ',
            password: 'password',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('Validation Errors', () => {
      it('should reject login with missing email', async () => {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            password: 'password123',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should reject login with invalid email format', async () => {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'not-an-email',
            password: 'password123',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should reject login with missing password', async () => {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'test@test.com',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('Authentication Errors', () => {
      it('should reject login with non-existent email', async () => {
        configureMockReturn('user', 'findFirst', null);

        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'nonexistent@test.com',
            password: 'password123',
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
        expect(response.body.error.message).toContain('Invalid email or password');
      });

      it('should reject login with incorrect password', async () => {
        const mockSalon = mockData.salon();
        const mockUser = mockData.user(mockSalon.id, {
          email: 'test@test.com',
          passwordHash: 'hashed_correctpass',
        });

        configureMockReturn('user', 'findFirst', { ...mockUser, salon: mockSalon });

        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'test@test.com',
            password: 'wrongpass',
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
      });

      it('should reject login for inactive user', async () => {
        const mockUser = mockData.user('salon-123', {
          isActive: false,
        });

        // findFirst with isActive: true will return null
        configureMockReturn('user', 'findFirst', null);

        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'test@test.com',
            password: 'password123',
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
      });

      it('should reject login for user without passwordHash', async () => {
        const mockSalon = mockData.salon();
        const mockUser = mockData.user(mockSalon.id, {
          passwordHash: null,
        });

        configureMockReturn('user', 'findFirst', { ...mockUser, salon: mockSalon });

        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'test@test.com',
            password: 'password123',
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
      });
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      configureMockReturn('refreshToken', 'deleteMany', { count: 1 });

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer valid_token_123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Logged out successfully');
    });

    it('should logout successfully without token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Logged out successfully');
    });

    it('should handle deleteMany errors gracefully', async () => {
      configureMockReturn('refreshToken', 'deleteMany', new Error('Database error'), {
        shouldReject: true,
      });

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer valid_token_123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    describe('Success Cases', () => {
      it('should refresh tokens with valid refresh token', async () => {
        const mockToken = mockData.refreshToken('user-123', {
          token: 'valid_refresh_user-123',
          expiresAt: new Date(Date.now() + 7 * 86400000),
        });

        configureMockReturn('refreshToken', 'findFirst', mockToken);
        configureMockReturn('refreshToken', 'update', mockToken);

        const response = await request(app)
          .post('/api/v1/auth/refresh')
          .send({
            refreshToken: 'valid_refresh_user-123',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.accessToken).toBeDefined();
        expect(response.body.data.refreshToken).toBeDefined();
      });

      it('should update refresh token in database', async () => {
        const mockToken = mockData.refreshToken('user-123', {
          token: 'valid_refresh_user-123',
        });

        configureMockReturn('refreshToken', 'findFirst', mockToken);
        configureMockReturn('refreshToken', 'update', mockToken);

        await request(app)
          .post('/api/v1/auth/refresh')
          .send({
            refreshToken: 'valid_refresh_user-123',
          });

        expect(mockPrisma.refreshToken.update).toHaveBeenCalled();
      });
    });

    describe('Validation Errors', () => {
      it('should reject refresh without token', async () => {
        const response = await request(app)
          .post('/api/v1/auth/refresh')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('MISSING_TOKEN');
        expect(response.body.error.message).toContain('required');
      });
    });

    describe('Authentication Errors', () => {
      it('should reject invalid refresh token', async () => {
        const response = await request(app)
          .post('/api/v1/auth/refresh')
          .send({
            refreshToken: 'invalid_token',
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_TOKEN');
      });

      it('should reject refresh token not in database', async () => {
        configureMockReturn('refreshToken', 'findFirst', null);

        const response = await request(app)
          .post('/api/v1/auth/refresh')
          .send({
            refreshToken: 'valid_refresh_user-123',
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_TOKEN');
      });

      it('should reject expired refresh token', async () => {
        const expiredToken = mockData.refreshToken('user-123', {
          token: 'valid_refresh_user-123',
          expiresAt: new Date(Date.now() - 1000), // Expired
        });

        // findFirst with expiresAt > now will return null
        configureMockReturn('refreshToken', 'findFirst', null);

        const response = await request(app)
          .post('/api/v1/auth/refresh')
          .send({
            refreshToken: 'valid_refresh_user-123',
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_TOKEN');
      });
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    describe('Success Cases', () => {
      it('should send reset email for existing user', async () => {
        const mockUser = mockData.user('salon-123', {
          email: 'test@test.com',
          firstName: 'John',
        });

        configureMockReturn('user', 'findFirst', mockUser);
        configureMockReturn('passwordResetToken', 'updateMany', { count: 0 });
        configureMockReturn('passwordResetToken', 'create', {
          id: 'token-123',
          userId: mockUser.id,
          tokenHash: 'hashed_token',
          expiresAt: new Date(),
          used: false,
          createdAt: new Date(),
        });

        const response = await request(app)
          .post('/api/v1/auth/forgot-password')
          .send({
            email: 'test@test.com',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.message).toContain('password reset link');
        expect(sendEmail).toHaveBeenCalled();
      });

      it('should return success for non-existent email (security)', async () => {
        configureMockReturn('user', 'findFirst', null);

        const response = await request(app)
          .post('/api/v1/auth/forgot-password')
          .send({
            email: 'nonexistent@test.com',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.message).toContain('password reset link');
        expect(sendEmail).not.toHaveBeenCalled();
      });

      it('should return success for inactive user (security)', async () => {
        const inactiveUser = mockData.user('salon-123', {
          isActive: false,
        });

        // findFirst with isActive: true returns null
        configureMockReturn('user', 'findFirst', null);

        const response = await request(app)
          .post('/api/v1/auth/forgot-password')
          .send({
            email: 'inactive@test.com',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(sendEmail).not.toHaveBeenCalled();
      });

      it('should invalidate existing reset tokens', async () => {
        const mockUser = mockData.user('salon-123');

        configureMockReturn('user', 'findFirst', mockUser);
        configureMockReturn('passwordResetToken', 'updateMany', { count: 2 });
        configureMockReturn('passwordResetToken', 'create', {
          id: 'token-123',
          userId: mockUser.id,
          tokenHash: 'hash',
          expiresAt: new Date(),
          used: false,
          createdAt: new Date(),
        });

        await request(app)
          .post('/api/v1/auth/forgot-password')
          .send({
            email: 'test@test.com',
          });

        expect(mockPrisma.passwordResetToken.updateMany).toHaveBeenCalled();
      });

      it('should normalize email before lookup', async () => {
        const mockUser = mockData.user('salon-123', {
          email: 'test@test.com',
        });

        configureMockReturn('user', 'findFirst', mockUser);
        configureMockReturn('passwordResetToken', 'updateMany', { count: 0 });
        configureMockReturn('passwordResetToken', 'create', {
          id: 'token-123',
          userId: mockUser.id,
          tokenHash: 'hash',
          expiresAt: new Date(),
          used: false,
          createdAt: new Date(),
        });

        const response = await request(app)
          .post('/api/v1/auth/forgot-password')
          .send({
            email: '  TeSt@TeSt.CoM  ',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('Validation Errors', () => {
      it('should reject invalid email format', async () => {
        const response = await request(app)
          .post('/api/v1/auth/forgot-password')
          .send({
            email: 'not-an-email',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should reject missing email', async () => {
        const response = await request(app)
          .post('/api/v1/auth/forgot-password')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    describe('Success Cases', () => {
      it('should reset password with valid token', async () => {
        const mockUser = mockData.user('salon-123');
        const mockResetToken = {
          id: 'reset-token-123',
          userId: mockUser.id,
          tokenHash: crypto.createHash('sha256').update('valid_token').digest('hex'),
          expiresAt: new Date(Date.now() + 3600000),
          used: false,
          createdAt: new Date(),
          user: mockUser,
        };

        configureMockReturn('passwordResetToken', 'findFirst', mockResetToken);
        configureMockReturn('user', 'update', mockUser);
        configureMockReturn('passwordResetToken', 'update', { ...mockResetToken, used: true });
        configureMockReturn('refreshToken', 'deleteMany', { count: 1 });

        const response = await request(app)
          .post('/api/v1/auth/reset-password')
          .send({
            token: 'valid_token',
            password: 'NewSecurePass123',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.message).toContain('reset successfully');
      });

      it('should hash new password', async () => {
        const mockUser = mockData.user('salon-123');
        const mockResetToken = {
          id: 'reset-token-123',
          userId: mockUser.id,
          tokenHash: crypto.createHash('sha256').update('valid_token').digest('hex'),
          expiresAt: new Date(Date.now() + 3600000),
          used: false,
          createdAt: new Date(),
          user: mockUser,
        };

        configureMockReturn('passwordResetToken', 'findFirst', mockResetToken);
        configureMockReturn('user', 'update', mockUser);
        configureMockReturn('passwordResetToken', 'update', mockResetToken);
        configureMockReturn('refreshToken', 'deleteMany', { count: 0 });

        await request(app)
          .post('/api/v1/auth/reset-password')
          .send({
            token: 'valid_token',
            password: 'NewPassword123',
          });

        expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123', 12);
      });

      it('should mark reset token as used', async () => {
        const mockUser = mockData.user('salon-123');
        const mockResetToken = {
          id: 'reset-token-123',
          userId: mockUser.id,
          tokenHash: crypto.createHash('sha256').update('valid_token').digest('hex'),
          expiresAt: new Date(Date.now() + 3600000),
          used: false,
          createdAt: new Date(),
          user: mockUser,
        };

        configureMockReturn('passwordResetToken', 'findFirst', mockResetToken);
        configureMockReturn('user', 'update', mockUser);
        configureMockReturn('passwordResetToken', 'update', mockResetToken);
        configureMockReturn('refreshToken', 'deleteMany', { count: 0 });

        await request(app)
          .post('/api/v1/auth/reset-password')
          .send({
            token: 'valid_token',
            password: 'NewPassword123',
          });

        expect(mockPrisma.passwordResetToken.update).toHaveBeenCalled();
      });

      it('should invalidate all refresh tokens', async () => {
        const mockUser = mockData.user('salon-123');
        const mockResetToken = {
          id: 'reset-token-123',
          userId: mockUser.id,
          tokenHash: crypto.createHash('sha256').update('valid_token').digest('hex'),
          expiresAt: new Date(Date.now() + 3600000),
          used: false,
          createdAt: new Date(),
          user: mockUser,
        };

        configureMockReturn('passwordResetToken', 'findFirst', mockResetToken);
        configureMockReturn('user', 'update', mockUser);
        configureMockReturn('passwordResetToken', 'update', mockResetToken);
        configureMockReturn('refreshToken', 'deleteMany', { count: 3 });

        await request(app)
          .post('/api/v1/auth/reset-password')
          .send({
            token: 'valid_token',
            password: 'NewPassword123',
          });

        expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalled();
      });
    });

    describe('Validation Errors', () => {
      it('should reject missing token', async () => {
        const response = await request(app)
          .post('/api/v1/auth/reset-password')
          .send({
            password: 'NewPassword123',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should reject missing password', async () => {
        const response = await request(app)
          .post('/api/v1/auth/reset-password')
          .send({
            token: 'some_token',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should reject password too short', async () => {
        const response = await request(app)
          .post('/api/v1/auth/reset-password')
          .send({
            token: 'some_token',
            password: 'short',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('Authentication Errors', () => {
      it('should reject invalid token', async () => {
        configureMockReturn('passwordResetToken', 'findFirst', null);

        const response = await request(app)
          .post('/api/v1/auth/reset-password')
          .send({
            token: 'invalid_token',
            password: 'NewPassword123',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_TOKEN');
        expect(response.body.error.message).toContain('Invalid or expired');
      });

      it('should reject expired token', async () => {
        const expiredToken = {
          id: 'reset-token-123',
          userId: 'user-123',
          tokenHash: crypto.createHash('sha256').update('expired_token').digest('hex'),
          expiresAt: new Date(Date.now() - 1000),
          used: false,
          createdAt: new Date(),
        };

        // findFirst with expiresAt > now returns null
        configureMockReturn('passwordResetToken', 'findFirst', null);

        const response = await request(app)
          .post('/api/v1/auth/reset-password')
          .send({
            token: 'expired_token',
            password: 'NewPassword123',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_TOKEN');
      });

      it('should reject already used token', async () => {
        const usedToken = {
          id: 'reset-token-123',
          userId: 'user-123',
          tokenHash: 'hash',
          expiresAt: new Date(Date.now() + 3600000),
          used: true,
          createdAt: new Date(),
        };

        // findFirst with used: false returns null
        configureMockReturn('passwordResetToken', 'findFirst', null);

        const response = await request(app)
          .post('/api/v1/auth/reset-password')
          .send({
            token: 'used_token',
            password: 'NewPassword123',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_TOKEN');
      });
    });
  });

  describe('POST /api/v1/auth/verify-email', () => {
    describe('Success Cases', () => {
      it('should verify email with valid token', async () => {
        const mockSalon = mockData.salon({ id: 'salon-123' });
        const mockUser = mockData.user('salon-123', {
          emailVerified: false,
        });
        const mockVerificationToken = {
          id: 'verification-123',
          userId: mockUser.id,
          token: 'valid_verification_token',
          expiresAt: new Date(Date.now() + 86400000),
          createdAt: new Date(),
          user: { ...mockUser, salon: mockSalon },
        };

        configureMockReturn('emailVerificationToken', 'findUnique', mockVerificationToken);
        configureMockReturn('user', 'update', { ...mockUser, emailVerified: true, salon: mockSalon });
        configureMockReturn('emailVerificationToken', 'delete', mockVerificationToken);

        const response = await request(app)
          .post('/api/v1/auth/verify-email')
          .send({
            token: 'valid_verification_token',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.message).toContain('verified successfully');
        expect(response.body.data.user.emailVerified).toBe(true);
      });

      it('should delete verification token after use', async () => {
        const mockSalon = mockData.salon();
        const mockUser = mockData.user(mockSalon.id);
        const mockVerificationToken = {
          id: 'verification-123',
          userId: mockUser.id,
          token: 'valid_token',
          expiresAt: new Date(Date.now() + 86400000),
          createdAt: new Date(),
          user: { ...mockUser, salon: mockSalon },
        };

        configureMockReturn('emailVerificationToken', 'findUnique', mockVerificationToken);
        configureMockReturn('user', 'update', { ...mockUser, emailVerified: true, salon: mockSalon });
        configureMockReturn('emailVerificationToken', 'delete', mockVerificationToken);

        await request(app)
          .post('/api/v1/auth/verify-email')
          .send({
            token: 'valid_token',
          });

        expect(mockPrisma.emailVerificationToken.delete).toHaveBeenCalled();
      });
    });

    describe('Validation Errors', () => {
      it('should reject missing token', async () => {
        const response = await request(app)
          .post('/api/v1/auth/verify-email')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should reject empty token', async () => {
        const response = await request(app)
          .post('/api/v1/auth/verify-email')
          .send({
            token: '',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('Authentication Errors', () => {
      it('should reject invalid token', async () => {
        configureMockReturn('emailVerificationToken', 'findUnique', null);

        const response = await request(app)
          .post('/api/v1/auth/verify-email')
          .send({
            token: 'invalid_token',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_TOKEN');
      });

      it('should reject expired token', async () => {
        const expiredToken = {
          id: 'verification-123',
          userId: 'user-123',
          token: 'expired_token',
          expiresAt: new Date(Date.now() - 1000),
          createdAt: new Date(),
          user: mockData.user('salon-123', { salon: mockData.salon() }),
        };

        configureMockReturn('emailVerificationToken', 'findUnique', expiredToken);
        configureMockReturn('emailVerificationToken', 'delete', expiredToken);

        const response = await request(app)
          .post('/api/v1/auth/verify-email')
          .send({
            token: 'expired_token',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('TOKEN_EXPIRED');
        expect(mockPrisma.emailVerificationToken.delete).toHaveBeenCalled();
      });
    });
  });

  describe('POST /api/v1/auth/resend-verification', () => {
    describe('Success Cases', () => {
      it('should send verification email for unverified user', async () => {
        const mockSalon = mockData.salon();
        const mockUser = mockData.user(mockSalon.id, {
          email: 'test@test.com',
          emailVerified: false,
        });

        configureMockReturn('user', 'findFirst', { ...mockUser, salon: mockSalon });
        configureMockReturn('emailVerificationToken', 'deleteMany', { count: 0 });
        configureMockReturn('emailVerificationToken', 'create', {
          id: 'token-123',
          userId: mockUser.id,
          token: 'verification_token',
          expiresAt: new Date(),
          createdAt: new Date(),
        });

        const response = await request(app)
          .post('/api/v1/auth/resend-verification')
          .send({
            email: 'test@test.com',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.message).toContain('verification link');
        expect(sendEmail).toHaveBeenCalled();
      });

      it('should return success for non-existent email (security)', async () => {
        configureMockReturn('user', 'findFirst', null);

        const response = await request(app)
          .post('/api/v1/auth/resend-verification')
          .send({
            email: 'nonexistent@test.com',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(sendEmail).not.toHaveBeenCalled();
      });

      it('should return success for already verified user (security)', async () => {
        const mockSalon = mockData.salon();
        const mockUser = mockData.user(mockSalon.id, {
          emailVerified: true,
        });

        configureMockReturn('user', 'findFirst', { ...mockUser, salon: mockSalon });

        const response = await request(app)
          .post('/api/v1/auth/resend-verification')
          .send({
            email: 'verified@test.com',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(sendEmail).not.toHaveBeenCalled();
      });

      it('should normalize email before lookup', async () => {
        const mockSalon = mockData.salon();
        const mockUser = mockData.user(mockSalon.id, {
          email: 'test@test.com',
          emailVerified: false,
        });

        configureMockReturn('user', 'findFirst', { ...mockUser, salon: mockSalon });
        configureMockReturn('emailVerificationToken', 'deleteMany', { count: 0 });
        configureMockReturn('emailVerificationToken', 'create', {
          id: 'token-123',
          userId: mockUser.id,
          token: 'token',
          expiresAt: new Date(),
          createdAt: new Date(),
        });

        const response = await request(app)
          .post('/api/v1/auth/resend-verification')
          .send({
            email: '  TeSt@TeSt.CoM  ',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('Validation Errors', () => {
      it('should reject invalid email format', async () => {
        const response = await request(app)
          .post('/api/v1/auth/resend-verification')
          .send({
            email: 'not-an-email',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should reject missing email', async () => {
        const response = await request(app)
          .post('/api/v1/auth/resend-verification')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle database transaction properly in password reset', async () => {
      const mockUser = mockData.user('salon-123');
      const mockResetToken = {
        id: 'reset-token-123',
        userId: mockUser.id,
        tokenHash: crypto.createHash('sha256').update('valid_token').digest('hex'),
        expiresAt: new Date(Date.now() + 3600000),
        used: false,
        createdAt: new Date(),
        user: mockUser,
      };

      configureMockReturn('passwordResetToken', 'findFirst', mockResetToken);
      configureMockReturn('user', 'update', mockUser);
      configureMockReturn('passwordResetToken', 'update', mockResetToken);
      configureMockReturn('refreshToken', 'deleteMany', { count: 0 });

      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'valid_token',
          password: 'NewPassword123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should generate unique slugs with proper collision handling', async () => {
      const mockSalon = mockData.salon({ slug: 'test-salon-2' });
      const mockUser = mockData.user(mockSalon.id);

      configureMockReturn('user', 'findFirst', null);

      let callCount = 0;
      configureMockImplementation('salon', 'findUnique', async (args) => {
        callCount++;
        // First two slugs exist, third is available
        if (callCount <= 2) {
          return mockData.salon({ slug: args?.where?.slug });
        }
        return null;
      });

      configureMockReturn('salon', 'create', mockSalon);
      configureMockReturn('user', 'create', mockUser);
      configureMockReturn('refreshToken', 'create', mockData.refreshToken(mockUser.id));

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ownerName: 'Test User',
          email: 'test@test.com',
          password: 'Password123',
          businessName: 'Test Salon',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should handle special characters in business name for slug generation', async () => {
      const mockSalon = mockData.salon({ slug: 'johns-spa-salon' });
      const mockUser = mockData.user(mockSalon.id);

      configureMockReturn('user', 'findFirst', null);
      configureMockReturn('salon', 'findUnique', null);
      configureMockReturn('salon', 'create', mockSalon);
      configureMockReturn('user', 'create', mockUser);
      configureMockReturn('refreshToken', 'create', mockData.refreshToken(mockUser.id));

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ownerName: 'Test User',
          email: 'test@test.com',
          password: 'Password123',
          businessName: 'John\'s Spa & Salon!!!',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });
});
