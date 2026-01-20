/**
 * Unit Tests for Demo Routes
 *
 * Tests for demo request functionality including:
 * - POST /demo - Create demo request (public endpoint)
 * - Email notifications (confirmation + sales notification)
 * - Input validation
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma, resetAllMocks, configureMockReturn } from './mocks/prisma';

// Mock prisma FIRST (before any imports that use it)
vi.mock('@peacase/database', () => ({
  prisma: mockPrisma,
}));

// Mock email service
vi.mock('../services/email.js', () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));

// Import after mocks are set up
import { request, app } from './helpers';

describe('Demo Routes', () => {
  let mockSendEmail: any;

  beforeEach(async () => {
    resetAllMocks();
    vi.clearAllMocks();

    // Get the mocked sendEmail function
    const emailService = await import('../services/email.js');
    mockSendEmail = emailService.sendEmail as any;
    mockSendEmail.mockResolvedValue(true);
  });

  describe('POST /api/v1/demo', () => {
    const validDemoRequest = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '555-123-4567',
      businessName: 'Test Salon',
      businessSize: '5-10 employees',
      preferredDate: '2024-03-15',
      preferredTime: '2:00 PM',
      message: 'Looking forward to learning more about Peacase',
    };

    it('should create demo request successfully', async () => {
      const mockDemoRequest = {
        id: 'demo-123',
        ...validDemoRequest,
        status: 'pending',
        createdAt: new Date(),
      };

      configureMockReturn('demoRequest', 'create', mockDemoRequest);

      const response = await request(app)
        .post('/api/v1/demo')
        .send(validDemoRequest);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('demo-123');
      expect(response.body.data.message).toBe('Demo request submitted successfully');
    });

    it('should create demo request in database with correct data', async () => {
      configureMockReturn('demoRequest', 'create', {
        id: 'demo-123',
        ...validDemoRequest,
        status: 'pending',
      });

      await request(app)
        .post('/api/v1/demo')
        .send(validDemoRequest);

      expect(mockPrisma.demoRequest.create).toHaveBeenCalledWith({
        data: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '555-123-4567',
          businessName: 'Test Salon',
          businessSize: '5-10 employees',
          preferredDate: '2024-03-15',
          preferredTime: '2:00 PM',
          message: 'Looking forward to learning more about Peacase',
          status: 'pending',
        },
      });
    });

    it('should send confirmation email to requester', async () => {
      configureMockReturn('demoRequest', 'create', {
        id: 'demo-123',
        ...validDemoRequest,
      });

      await request(app)
        .post('/api/v1/demo')
        .send(validDemoRequest);

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@example.com',
          subject: 'Demo Request Received - Peacase',
          html: expect.stringContaining('John'),
        })
      );
    });

    it('should send notification email to sales team', async () => {
      configureMockReturn('demoRequest', 'create', {
        id: 'demo-123',
        ...validDemoRequest,
      });

      await request(app)
        .post('/api/v1/demo')
        .send(validDemoRequest);

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'sales@peacase.com',
          subject: 'New Demo Request: Test Salon',
          html: expect.stringContaining('John Doe'),
        })
      );
    });

    it('should include message in sales notification if provided', async () => {
      configureMockReturn('demoRequest', 'create', {
        id: 'demo-123',
        ...validDemoRequest,
      });

      await request(app)
        .post('/api/v1/demo')
        .send(validDemoRequest);

      // Get the second call (sales notification)
      const salesEmailCall = mockSendEmail.mock.calls.find(
        (call: any) => call[0].to === 'sales@peacase.com'
      );

      expect(salesEmailCall).toBeDefined();
      expect(salesEmailCall[0].html).toContain('Looking forward to learning more');
    });

    it('should succeed even if confirmation email fails', async () => {
      configureMockReturn('demoRequest', 'create', {
        id: 'demo-123',
        ...validDemoRequest,
      });

      // First call (confirmation) fails, second call (sales) succeeds
      mockSendEmail
        .mockRejectedValueOnce(new Error('Email service unavailable'))
        .mockResolvedValueOnce(true);

      const response = await request(app)
        .post('/api/v1/demo')
        .send(validDemoRequest);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should succeed even if sales notification fails', async () => {
      configureMockReturn('demoRequest', 'create', {
        id: 'demo-123',
        ...validDemoRequest,
      });

      // First call (confirmation) succeeds, second call (sales) fails
      mockSendEmail
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error('Email service unavailable'));

      const response = await request(app)
        .post('/api/v1/demo')
        .send(validDemoRequest);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should work without optional message field', async () => {
      const requestWithoutMessage = { ...validDemoRequest };
      delete (requestWithoutMessage as any).message;

      configureMockReturn('demoRequest', 'create', {
        id: 'demo-123',
        ...requestWithoutMessage,
        message: null,
      });

      const response = await request(app)
        .post('/api/v1/demo')
        .send(requestWithoutMessage);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      expect(mockPrisma.demoRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            message: null,
          }),
        })
      );
    });

    describe('Input validation', () => {
      it('should reject missing firstName', async () => {
        const invalidRequest = { ...validDemoRequest };
        delete (invalidRequest as any).firstName;

        const response = await request(app)
          .post('/api/v1/demo')
          .send(invalidRequest);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.details).toHaveProperty('firstName');
      });

      it('should reject missing lastName', async () => {
        const invalidRequest = { ...validDemoRequest };
        delete (invalidRequest as any).lastName;

        const response = await request(app)
          .post('/api/v1/demo')
          .send(invalidRequest);

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.details).toHaveProperty('lastName');
      });

      it('should reject invalid email format', async () => {
        const invalidRequest = {
          ...validDemoRequest,
          email: 'not-an-email',
        };

        const response = await request(app)
          .post('/api/v1/demo')
          .send(invalidRequest);

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.details).toHaveProperty('email');
      });

      it('should reject missing phone', async () => {
        const invalidRequest = { ...validDemoRequest };
        delete (invalidRequest as any).phone;

        const response = await request(app)
          .post('/api/v1/demo')
          .send(invalidRequest);

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.details).toHaveProperty('phone');
      });

      it('should reject empty phone', async () => {
        const invalidRequest = {
          ...validDemoRequest,
          phone: '',
        };

        const response = await request(app)
          .post('/api/v1/demo')
          .send(invalidRequest);

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should reject missing businessName', async () => {
        const invalidRequest = { ...validDemoRequest };
        delete (invalidRequest as any).businessName;

        const response = await request(app)
          .post('/api/v1/demo')
          .send(invalidRequest);

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.details).toHaveProperty('businessName');
      });

      it('should reject missing businessSize', async () => {
        const invalidRequest = { ...validDemoRequest };
        delete (invalidRequest as any).businessSize;

        const response = await request(app)
          .post('/api/v1/demo')
          .send(invalidRequest);

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.details).toHaveProperty('businessSize');
      });

      it('should reject missing preferredDate', async () => {
        const invalidRequest = { ...validDemoRequest };
        delete (invalidRequest as any).preferredDate;

        const response = await request(app)
          .post('/api/v1/demo')
          .send(invalidRequest);

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.details).toHaveProperty('preferredDate');
      });

      it('should reject missing preferredTime', async () => {
        const invalidRequest = { ...validDemoRequest };
        delete (invalidRequest as any).preferredTime;

        const response = await request(app)
          .post('/api/v1/demo')
          .send(invalidRequest);

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.details).toHaveProperty('preferredTime');
      });

      it('should reject empty strings for required fields', async () => {
        const invalidRequest = {
          ...validDemoRequest,
          firstName: '',
        };

        const response = await request(app)
          .post('/api/v1/demo')
          .send(invalidRequest);

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should accept all valid required fields', async () => {
        configureMockReturn('demoRequest', 'create', {
          id: 'demo-123',
          ...validDemoRequest,
        });

        const response = await request(app)
          .post('/api/v1/demo')
          .send(validDemoRequest);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });
    });

    describe('Error handling', () => {
      it('should handle database errors gracefully', async () => {
        configureMockReturn(
          'demoRequest',
          'create',
          new Error('Database connection failed'),
          { shouldReject: true }
        );

        const response = await request(app)
          .post('/api/v1/demo')
          .send(validDemoRequest);

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('SERVER_ERROR');
        expect(response.body.error.message).toBe('Failed to submit demo request. Please try again.');
      });

      it('should handle unexpected errors', async () => {
        configureMockReturn(
          'demoRequest',
          'create',
          new Error('Unexpected error'),
          { shouldReject: true }
        );

        const response = await request(app)
          .post('/api/v1/demo')
          .send(validDemoRequest);

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });
    });

    describe('Email content', () => {
      it('should include preferred date and time in confirmation email', async () => {
        configureMockReturn('demoRequest', 'create', {
          id: 'demo-123',
          ...validDemoRequest,
        });

        await request(app)
          .post('/api/v1/demo')
          .send(validDemoRequest);

        const confirmationCall = mockSendEmail.mock.calls.find(
          (call: any) => call[0].to === 'john@example.com'
        );

        expect(confirmationCall[0].html).toContain('2024-03-15');
        expect(confirmationCall[0].html).toContain('2:00 PM');
      });

      it('should address user by first name in confirmation email', async () => {
        configureMockReturn('demoRequest', 'create', {
          id: 'demo-123',
          ...validDemoRequest,
        });

        await request(app)
          .post('/api/v1/demo')
          .send(validDemoRequest);

        const confirmationCall = mockSendEmail.mock.calls.find(
          (call: any) => call[0].to === 'john@example.com'
        );

        expect(confirmationCall[0].html).toContain('Hi John');
      });

      it('should include all business details in sales notification', async () => {
        configureMockReturn('demoRequest', 'create', {
          id: 'demo-123',
          ...validDemoRequest,
        });

        await request(app)
          .post('/api/v1/demo')
          .send(validDemoRequest);

        const salesCall = mockSendEmail.mock.calls.find(
          (call: any) => call[0].to === 'sales@peacase.com'
        );

        const html = salesCall[0].html;
        expect(html).toContain('John Doe');
        expect(html).toContain('john@example.com');
        expect(html).toContain('555-123-4567');
        expect(html).toContain('Test Salon');
        expect(html).toContain('5-10 employees');
      });

      it('should not include message section if message is not provided', async () => {
        const requestWithoutMessage = { ...validDemoRequest };
        delete (requestWithoutMessage as any).message;

        configureMockReturn('demoRequest', 'create', {
          id: 'demo-123',
          ...requestWithoutMessage,
          message: null,
        });

        await request(app)
          .post('/api/v1/demo')
          .send(requestWithoutMessage);

        const salesCall = mockSendEmail.mock.calls.find(
          (call: any) => call[0].to === 'sales@peacase.com'
        );

        // The sales email should not have a message row if message is null
        expect(salesCall[0].html).not.toContain('<strong>Message:</strong>');
      });
    });

    describe('Public endpoint', () => {
      it('should not require authentication', async () => {
        configureMockReturn('demoRequest', 'create', {
          id: 'demo-123',
          ...validDemoRequest,
        });

        const response = await request(app)
          .post('/api/v1/demo')
          .send(validDemoRequest);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      it('should accept requests from anyone', async () => {
        configureMockReturn('demoRequest', 'create', {
          id: 'demo-123',
          ...validDemoRequest,
        });

        const response = await request(app)
          .post('/api/v1/demo')
          .send(validDemoRequest);

        expect(response.status).toBe(201);
      });
    });
  });
});
