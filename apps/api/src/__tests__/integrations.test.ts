import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  request,
  app,
  createTestSalon,
  createTestUser,
  generateTestTokens,
  uniqueId,
} from './helpers';
import { prisma } from './setup';

// Mock SendGrid
vi.mock('@sendgrid/mail', () => ({
  default: {
    setApiKey: vi.fn(),
    send: vi.fn().mockResolvedValue([{ statusCode: 202 }]),
  },
}));

// Mock Twilio
vi.mock('twilio', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      api: {
        accounts: vi.fn().mockReturnValue({
          fetch: vi.fn().mockResolvedValue({ sid: 'ACtest', status: 'active' }),
        }),
      },
      incomingPhoneNumbers: {
        list: vi.fn().mockResolvedValue([{ phoneNumber: '+15551234567' }]),
      },
      messages: {
        create: vi.fn().mockResolvedValue({ sid: 'SM123', status: 'sent' }),
      },
    })),
  };
});

describe('Integrations API', () => {
  describe('Stripe Connect (placeholder)', () => {
    // Note: POST /integrations/stripe/connect endpoint is not implemented
    // in the integrations.ts file. This is a placeholder for future implementation.
    it('should be implemented in the future', () => {
      expect(true).toBe(true);
    });
  });

  describe('GET /api/v1/integrations/status', () => {
    it('should return integration status for authenticated owner', async () => {
      const salon = await createTestSalon();
      const user = await createTestUser(salon.id, { role: 'owner' });
      const tokens = generateTestTokens(user.id, salon.id, 'owner');

      const response = await request(app)
        .get('/api/v1/integrations/status')
        .set('Authorization', `Bearer ${tokens.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.marketingAddon).toBeDefined();
      expect(response.body.data.sendgrid).toBeDefined();
      expect(response.body.data.twilio).toBeDefined();
    });

    it('should return integration status for authenticated admin', async () => {
      const salon = await createTestSalon();
      const user = await createTestUser(salon.id, { role: 'admin' });
      const tokens = generateTestTokens(user.id, salon.id, 'admin');

      const response = await request(app)
        .get('/api/v1/integrations/status')
        .set('Authorization', `Bearer ${tokens.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/v1/integrations/status');

      expect(response.status).toBe(401);
    });

    it('should return 403 for staff role', async () => {
      const salon = await createTestSalon();
      const user = await createTestUser(salon.id, { role: 'staff' });
      const tokens = generateTestTokens(user.id, salon.id, 'staff');

      const response = await request(app)
        .get('/api/v1/integrations/status')
        .set('Authorization', `Bearer ${tokens.accessToken}`);

      expect(response.status).toBe(403);
    });

    it('should show grace period info when addon is enabled', async () => {
      const salon = await createTestSalon();
      const user = await createTestUser(salon.id, { role: 'owner' });
      const tokens = generateTestTokens(user.id, salon.id, 'owner');

      // Enable marketing addon
      await prisma.salon.update({
        where: { id: salon.id },
        data: {
          marketingAddonEnabled: true,
          marketingAddonEnabledAt: new Date(),
        },
      });

      const response = await request(app)
        .get('/api/v1/integrations/status')
        .set('Authorization', `Bearer ${tokens.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.gracePeriod).toBeDefined();
      expect(response.body.data.gracePeriod.active).toBe(true);
      expect(response.body.data.gracePeriod.daysRemaining).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/v1/integrations/sendgrid', () => {
    it('should save SendGrid configuration for owner', async () => {
      const salon = await createTestSalon();
      const user = await createTestUser(salon.id, { role: 'owner' });
      const tokens = generateTestTokens(user.id, salon.id, 'owner');

      const response = await request(app)
        .put('/api/v1/integrations/sendgrid')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({
          apiKey: 'SG.test-api-key-12345',
          fromEmail: 'noreply@testsalon.com',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.fromEmail).toBe('noreply@testsalon.com');
      expect(response.body.data.validated).toBe(true);

      // Verify database was updated
      const updatedSalon = await prisma.salon.findUnique({
        where: { id: salon.id },
        select: {
          sendgridApiKeyEncrypted: true,
          sendgridFromEmail: true,
          sendgridValidated: true,
        },
      });

      expect(updatedSalon?.sendgridApiKeyEncrypted).toBeDefined();
      expect(updatedSalon?.sendgridFromEmail).toBe('noreply@testsalon.com');
      expect(updatedSalon?.sendgridValidated).toBe(true);
    });

    it('should reject invalid API key format', async () => {
      const salon = await createTestSalon();
      const user = await createTestUser(salon.id, { role: 'owner' });
      const tokens = generateTestTokens(user.id, salon.id, 'owner');

      const response = await request(app)
        .put('/api/v1/integrations/sendgrid')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({
          apiKey: 'invalid-key-not-starting-with-SG',
          fromEmail: 'noreply@testsalon.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid email format', async () => {
      const salon = await createTestSalon();
      const user = await createTestUser(salon.id, { role: 'owner' });
      const tokens = generateTestTokens(user.id, salon.id, 'owner');

      const response = await request(app)
        .put('/api/v1/integrations/sendgrid')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({
          apiKey: 'SG.valid-key',
          fromEmail: 'not-an-email',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .put('/api/v1/integrations/sendgrid')
        .send({
          apiKey: 'SG.test-key',
          fromEmail: 'test@test.com',
        });

      expect(response.status).toBe(401);
    });

    it('should return 403 for staff role', async () => {
      const salon = await createTestSalon();
      const user = await createTestUser(salon.id, { role: 'staff' });
      const tokens = generateTestTokens(user.id, salon.id, 'staff');

      const response = await request(app)
        .put('/api/v1/integrations/sendgrid')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({
          apiKey: 'SG.test-key',
          fromEmail: 'test@test.com',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/v1/integrations/sendgrid/test', () => {
    it('should test SendGrid key without saving', async () => {
      const salon = await createTestSalon();
      const user = await createTestUser(salon.id, { role: 'owner' });
      const tokens = generateTestTokens(user.id, salon.id, 'owner');

      const response = await request(app)
        .post('/api/v1/integrations/sendgrid/test')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({
          apiKey: 'SG.test-api-key',
          fromEmail: 'test@testsalon.com',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify database was NOT updated
      const salon2 = await prisma.salon.findUnique({
        where: { id: salon.id },
        select: { sendgridApiKeyEncrypted: true },
      });

      expect(salon2?.sendgridApiKeyEncrypted).toBeNull();
    });

    it('should reject invalid API key format', async () => {
      const salon = await createTestSalon();
      const user = await createTestUser(salon.id, { role: 'owner' });
      const tokens = generateTestTokens(user.id, salon.id, 'owner');

      const response = await request(app)
        .post('/api/v1/integrations/sendgrid/test')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({
          apiKey: 'invalid-key',
          fromEmail: 'test@test.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/integrations/sendgrid', () => {
    it('should remove SendGrid configuration', async () => {
      const salon = await createTestSalon();
      const user = await createTestUser(salon.id, { role: 'owner' });
      const tokens = generateTestTokens(user.id, salon.id, 'owner');

      // First save a config
      await prisma.salon.update({
        where: { id: salon.id },
        data: {
          sendgridApiKeyEncrypted: 'encrypted-key',
          sendgridFromEmail: 'test@test.com',
          sendgridValidated: true,
          sendgridLastValidatedAt: new Date(),
        },
      });

      const response = await request(app)
        .delete('/api/v1/integrations/sendgrid')
        .set('Authorization', `Bearer ${tokens.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify database was cleared
      const updatedSalon = await prisma.salon.findUnique({
        where: { id: salon.id },
        select: {
          sendgridApiKeyEncrypted: true,
          sendgridFromEmail: true,
          sendgridValidated: true,
        },
      });

      expect(updatedSalon?.sendgridApiKeyEncrypted).toBeNull();
      expect(updatedSalon?.sendgridFromEmail).toBeNull();
      expect(updatedSalon?.sendgridValidated).toBe(false);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .delete('/api/v1/integrations/sendgrid');

      expect(response.status).toBe(401);
    });

    it('should return 403 for staff role', async () => {
      const salon = await createTestSalon();
      const user = await createTestUser(salon.id, { role: 'staff' });
      const tokens = generateTestTokens(user.id, salon.id, 'staff');

      const response = await request(app)
        .delete('/api/v1/integrations/sendgrid')
        .set('Authorization', `Bearer ${tokens.accessToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/v1/integrations/twilio', () => {
    it('should save Twilio configuration for owner', async () => {
      const salon = await createTestSalon();
      const user = await createTestUser(salon.id, { role: 'owner' });
      const tokens = generateTestTokens(user.id, salon.id, 'owner');

      const response = await request(app)
        .put('/api/v1/integrations/twilio')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({
          accountSid: 'ACtest1234567890',
          authToken: 'test-auth-token',
          phoneNumber: '+15551234567',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.phoneNumber).toBe('+15551234567');
      expect(response.body.data.validated).toBe(true);

      // Verify database was updated
      const updatedSalon = await prisma.salon.findUnique({
        where: { id: salon.id },
        select: {
          twilioAccountSidEncrypted: true,
          twilioAuthTokenEncrypted: true,
          twilioPhoneNumber: true,
          twilioValidated: true,
        },
      });

      expect(updatedSalon?.twilioAccountSidEncrypted).toBeDefined();
      expect(updatedSalon?.twilioAuthTokenEncrypted).toBeDefined();
      expect(updatedSalon?.twilioPhoneNumber).toBe('+15551234567');
      expect(updatedSalon?.twilioValidated).toBe(true);
    });

    it('should reject invalid Account SID format', async () => {
      const salon = await createTestSalon();
      const user = await createTestUser(salon.id, { role: 'owner' });
      const tokens = generateTestTokens(user.id, salon.id, 'owner');

      const response = await request(app)
        .put('/api/v1/integrations/twilio')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({
          accountSid: 'invalid-sid',
          authToken: 'test-auth-token',
          phoneNumber: '+15551234567',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid phone number format', async () => {
      const salon = await createTestSalon();
      const user = await createTestUser(salon.id, { role: 'owner' });
      const tokens = generateTestTokens(user.id, salon.id, 'owner');

      const response = await request(app)
        .put('/api/v1/integrations/twilio')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({
          accountSid: 'ACtest1234567890',
          authToken: 'test-auth-token',
          phoneNumber: '555-123-4567', // Not E.164 format
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .put('/api/v1/integrations/twilio')
        .send({
          accountSid: 'ACtest1234567890',
          authToken: 'test-auth-token',
          phoneNumber: '+15551234567',
        });

      expect(response.status).toBe(401);
    });

    it('should return 403 for staff role', async () => {
      const salon = await createTestSalon();
      const user = await createTestUser(salon.id, { role: 'staff' });
      const tokens = generateTestTokens(user.id, salon.id, 'staff');

      const response = await request(app)
        .put('/api/v1/integrations/twilio')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({
          accountSid: 'ACtest1234567890',
          authToken: 'test-auth-token',
          phoneNumber: '+15551234567',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/v1/integrations/twilio/test', () => {
    it('should test Twilio credentials without saving', async () => {
      const salon = await createTestSalon();
      const user = await createTestUser(salon.id, { role: 'owner' });
      const tokens = generateTestTokens(user.id, salon.id, 'owner');

      const response = await request(app)
        .post('/api/v1/integrations/twilio/test')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({
          accountSid: 'ACtest1234567890',
          authToken: 'test-auth-token',
          phoneNumber: '+15551234567',
          testPhoneNumber: '+15559876543',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.messageSid).toBeDefined();

      // Verify database was NOT updated
      const salon2 = await prisma.salon.findUnique({
        where: { id: salon.id },
        select: { twilioAccountSidEncrypted: true },
      });

      expect(salon2?.twilioAccountSidEncrypted).toBeNull();
    });

    it('should reject invalid Account SID format', async () => {
      const salon = await createTestSalon();
      const user = await createTestUser(salon.id, { role: 'owner' });
      const tokens = generateTestTokens(user.id, salon.id, 'owner');

      const response = await request(app)
        .post('/api/v1/integrations/twilio/test')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({
          accountSid: 'invalid-sid',
          authToken: 'test-auth-token',
          phoneNumber: '+15551234567',
          testPhoneNumber: '+15559876543',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid test phone number format', async () => {
      const salon = await createTestSalon();
      const user = await createTestUser(salon.id, { role: 'owner' });
      const tokens = generateTestTokens(user.id, salon.id, 'owner');

      const response = await request(app)
        .post('/api/v1/integrations/twilio/test')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({
          accountSid: 'ACtest1234567890',
          authToken: 'test-auth-token',
          phoneNumber: '+15551234567',
          testPhoneNumber: 'invalid-phone',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/integrations/twilio', () => {
    it('should remove Twilio configuration', async () => {
      const salon = await createTestSalon();
      const user = await createTestUser(salon.id, { role: 'owner' });
      const tokens = generateTestTokens(user.id, salon.id, 'owner');

      // First save a config
      await prisma.salon.update({
        where: { id: salon.id },
        data: {
          twilioAccountSidEncrypted: 'encrypted-sid',
          twilioAuthTokenEncrypted: 'encrypted-token',
          twilioPhoneNumber: '+15551234567',
          twilioValidated: true,
          twilioLastValidatedAt: new Date(),
        },
      });

      const response = await request(app)
        .delete('/api/v1/integrations/twilio')
        .set('Authorization', `Bearer ${tokens.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify database was cleared
      const updatedSalon = await prisma.salon.findUnique({
        where: { id: salon.id },
        select: {
          twilioAccountSidEncrypted: true,
          twilioAuthTokenEncrypted: true,
          twilioPhoneNumber: true,
          twilioValidated: true,
        },
      });

      expect(updatedSalon?.twilioAccountSidEncrypted).toBeNull();
      expect(updatedSalon?.twilioAuthTokenEncrypted).toBeNull();
      expect(updatedSalon?.twilioPhoneNumber).toBeNull();
      expect(updatedSalon?.twilioValidated).toBe(false);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .delete('/api/v1/integrations/twilio');

      expect(response.status).toBe(401);
    });

    it('should return 403 for staff role', async () => {
      const salon = await createTestSalon();
      const user = await createTestUser(salon.id, { role: 'staff' });
      const tokens = generateTestTokens(user.id, salon.id, 'staff');

      const response = await request(app)
        .delete('/api/v1/integrations/twilio')
        .set('Authorization', `Bearer ${tokens.accessToken}`);

      expect(response.status).toBe(403);
    });
  });
});
