import { describe, it, expect, beforeEach } from 'vitest';
import {
  request,
  app,
  createTestSalon,
  createTestUser,
  generateTestTokens,
  storeRefreshToken,
  uniqueId,
} from './helpers';
import { prisma } from './setup';

describe('Auth API', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new salon and user successfully', async () => {
      const id = uniqueId();
      const salonName = `New Salon ${id}`;
      const email = `register-${id}@test.com`;

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          salonName,
          email,
          password: 'SecurePassword123!',
          phone: '555-123-4567',
          timezone: 'America/New_York',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(email);
      expect(response.body.data.salon).toBeDefined();
      expect(response.body.data.salon.name).toBe(salonName);
      expect(response.body.data.tokens).toBeDefined();
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();

      // Clean up
      const salon = await prisma.salon.findFirst({
        where: { email },
      });
      if (salon) {
        await prisma.refreshToken.deleteMany({ where: { user: { salonId: salon.id } } });
        await prisma.user.deleteMany({ where: { salonId: salon.id } });
        await prisma.salon.delete({ where: { id: salon.id } });
      }
    });

    it('should return 400 when email already exists', async () => {
      const salon = await createTestSalon();
      const user = await createTestUser(salon.id);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          salonName: 'Another Salon',
          email: user.email,
          password: 'AnotherPassword123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMAIL_EXISTS');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          salonName: 'Test Salon',
          email: 'not-an-email',
          password: 'Password123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for short password', async () => {
      const id = uniqueId();

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          salonName: 'Test Salon',
          email: `test-${id}@test.com`,
          password: 'short',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when salon name is missing', async () => {
      const id = uniqueId();

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `test-${id}@test.com`,
          password: 'Password123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const salon = await createTestSalon();
      const user = await createTestUser(salon.id, {
        password: 'TestPassword123!',
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'TestPassword123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(user.email);
      expect(response.body.data.salon).toBeDefined();
      expect(response.body.data.tokens).toBeDefined();
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
    });

    it('should return 401 for invalid password', async () => {
      const salon = await createTestSalon();
      const user = await createTestUser(salon.id, {
        password: 'CorrectPassword123!',
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'SomePassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should update lastLogin timestamp on successful login', async () => {
      const salon = await createTestSalon();
      const user = await createTestUser(salon.id, {
        password: 'TestPassword123!',
      });

      const beforeLogin = new Date();

      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'TestPassword123!',
        });

      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      expect(updatedUser?.lastLogin).toBeDefined();
      expect(new Date(updatedUser!.lastLogin!).getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      const salon = await createTestSalon();
      const user = await createTestUser(salon.id);
      const tokens = generateTestTokens(user.id, salon.id);
      await storeRefreshToken(user.id, tokens.refreshToken);

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${tokens.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Logged out successfully');
    });

    it('should logout successfully without token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh tokens successfully with valid refresh token', async () => {
      const salon = await createTestSalon();
      const user = await createTestUser(salon.id);
      const tokens = generateTestTokens(user.id, salon.id);
      await storeRefreshToken(user.id, tokens.refreshToken);

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: tokens.refreshToken,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens).toBeDefined();
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
      // New tokens should be different
      expect(response.body.data.tokens.accessToken).not.toBe(tokens.accessToken);
    });

    it('should return 400 when refresh token is missing', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should return 401 for refresh token not in database', async () => {
      const salon = await createTestSalon();
      const user = await createTestUser(salon.id);
      const tokens = generateTestTokens(user.id, salon.id);
      // Note: Not storing the token in database

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: tokens.refreshToken,
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('Authentication Flow', () => {
    it('should complete full registration -> login -> refresh -> logout flow', async () => {
      const id = uniqueId();
      const email = `flow-${id}@test.com`;
      const password = 'FlowTestPassword123!';

      // Step 1: Register
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          salonName: `Flow Test Salon ${id}`,
          email,
          password,
        });

      expect(registerResponse.status).toBe(201);
      const { accessToken: regAccessToken, refreshToken: regRefreshToken } = registerResponse.body.data.tokens;

      // Step 2: Login with the same credentials
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password });

      expect(loginResponse.status).toBe(200);
      const { accessToken: loginAccessToken, refreshToken: loginRefreshToken } = loginResponse.body.data.tokens;
      expect(loginAccessToken).toBeDefined();

      // Step 3: Refresh token
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: loginRefreshToken });

      expect(refreshResponse.status).toBe(200);
      const { accessToken: newAccessToken } = refreshResponse.body.data.tokens;
      expect(newAccessToken).toBeDefined();
      expect(newAccessToken).not.toBe(loginAccessToken);

      // Step 4: Logout
      const logoutResponse = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${newAccessToken}`);

      expect(logoutResponse.status).toBe(200);

      // Clean up
      const salon = await prisma.salon.findFirst({ where: { email } });
      if (salon) {
        await prisma.refreshToken.deleteMany({ where: { user: { salonId: salon.id } } });
        await prisma.user.deleteMany({ where: { salonId: salon.id } });
        await prisma.salon.delete({ where: { id: salon.id } });
      }
    });
  });
});
