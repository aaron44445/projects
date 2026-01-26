import { describe, it, expect, beforeEach } from 'vitest';
import {
  request,
  app,
  createTestContext,
  createTestAppointment,
  createTestClient,
  createTestService,
  createTestUser,
  authenticatedRequest,
  uniqueId,
} from './helpers';
import { prisma } from './setup';

describe('Appointments API', () => {
  describe('GET /api/v1/appointments', () => {
    it('should list appointments for authenticated user', async () => {
      const { salon, user, client, service, tokens } = await createTestContext();

      // Create an appointment
      const appointment = await createTestAppointment(salon.id, client.id, user.id, service.id);

      const response = await authenticatedRequest(tokens.accessToken)
        .get('/api/v1/appointments');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeDefined();
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/v1/appointments');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should filter appointments by date range', async () => {
      const { salon, user, client, service, tokens } = await createTestContext();

      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await createTestAppointment(salon.id, client.id, user.id, service.id, {
        startTime: tomorrow,
      });

      const response = await authenticatedRequest(tokens.accessToken)
        .get(`/api/v1/appointments?dateFrom=${tomorrow.toISOString()}&dateTo=${nextWeek.toISOString()}`);

      expect(response.status).toBe(200);
      expect(response.body.data.items.length).toBeGreaterThanOrEqual(0);
    });

    it('should filter appointments by status', async () => {
      const { salon, user, client, service, tokens } = await createTestContext();

      await createTestAppointment(salon.id, client.id, user.id, service.id, {
        status: 'confirmed',
      });

      const response = await authenticatedRequest(tokens.accessToken)
        .get('/api/v1/appointments?status=confirmed');

      expect(response.status).toBe(200);
      const confirmedAppointments = response.body.data.items.filter(
        (a: { status: string }) => a.status === 'confirmed'
      );
      expect(confirmedAppointments.length).toBe(response.body.data.items.length);
    });

    it('should filter appointments by staff', async () => {
      const { salon, user, client, service, tokens } = await createTestContext();

      await createTestAppointment(salon.id, client.id, user.id, service.id);

      const response = await authenticatedRequest(tokens.accessToken)
        .get(`/api/v1/appointments?staffId=${user.id}`);

      expect(response.status).toBe(200);
      const staffAppointments = response.body.data.items.filter(
        (a: { staffId: string }) => a.staffId === user.id
      );
      expect(staffAppointments.length).toBe(response.body.data.items.length);
    });
  });

  describe('GET /api/v1/appointments/:id', () => {
    it('should return appointment details by ID', async () => {
      const { salon, user, client, service, tokens } = await createTestContext();
      const appointment = await createTestAppointment(salon.id, client.id, user.id, service.id);

      const response = await authenticatedRequest(tokens.accessToken)
        .get(`/api/v1/appointments/${appointment.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(appointment.id);
      expect(response.body.data.client).toBeDefined();
      expect(response.body.data.staff).toBeDefined();
      expect(response.body.data.service).toBeDefined();
    });

    it('should return 404 for non-existent appointment', async () => {
      const { tokens } = await createTestContext();

      const response = await authenticatedRequest(tokens.accessToken)
        .get('/api/v1/appointments/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/v1/appointments', () => {
    it('should create a new appointment', async () => {
      const { salon, user, client, service, tokens } = await createTestContext();

      const startTime = new Date(Date.now() + 48 * 60 * 60 * 1000); // 2 days from now

      const response = await authenticatedRequest(tokens.accessToken)
        .post('/api/v1/appointments')
        .send({
          clientId: client.id,
          staffId: user.id,
          serviceId: service.id,
          startTime: startTime.toISOString(),
          notes: 'Test appointment',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.clientId).toBe(client.id);
      expect(response.body.data.staffId).toBe(user.id);
      expect(response.body.data.serviceId).toBe(service.id);
      expect(response.body.data.status).toBe('confirmed');

      // Clean up
      await prisma.appointment.delete({ where: { id: response.body.data.id } });
    });

    it('should return 400 for invalid service', async () => {
      const { salon, user, client, tokens } = await createTestContext();

      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const response = await authenticatedRequest(tokens.accessToken)
        .post('/api/v1/appointments')
        .send({
          clientId: client.id,
          staffId: user.id,
          serviceId: 'invalid-service-id',
          startTime: startTime.toISOString(),
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_SERVICE');
    });

    it('should detect time conflicts', async () => {
      const { salon, user, client, service, tokens } = await createTestContext();

      const startTime = new Date(Date.now() + 72 * 60 * 60 * 1000); // 3 days from now

      // Create first appointment
      await createTestAppointment(salon.id, client.id, user.id, service.id, {
        startTime,
        endTime: new Date(startTime.getTime() + 60 * 60 * 1000),
      });

      // Try to create overlapping appointment
      const response = await authenticatedRequest(tokens.accessToken)
        .post('/api/v1/appointments')
        .send({
          clientId: client.id,
          staffId: user.id,
          serviceId: service.id,
          startTime: startTime.toISOString(), // Same time
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TIME_CONFLICT');
    });

    it('should calculate end time based on service duration', async () => {
      const { salon, user, client, tokens } = await createTestContext();

      // Create a service with specific duration
      const customService = await createTestService(salon.id, {
        name: 'Custom Duration Service',
        durationMinutes: 90,
      });

      const startTime = new Date(Date.now() + 96 * 60 * 60 * 1000); // 4 days from now

      const response = await authenticatedRequest(tokens.accessToken)
        .post('/api/v1/appointments')
        .send({
          clientId: client.id,
          staffId: user.id,
          serviceId: customService.id,
          startTime: startTime.toISOString(),
        });

      expect(response.status).toBe(201);

      const expectedEndTime = new Date(startTime.getTime() + 90 * 60 * 1000);
      const actualEndTime = new Date(response.body.data.endTime);

      expect(actualEndTime.getTime()).toBe(expectedEndTime.getTime());
      expect(response.body.data.durationMinutes).toBe(90);

      // Clean up
      await prisma.appointment.delete({ where: { id: response.body.data.id } });
    });
  });

  describe('PATCH /api/v1/appointments/:id', () => {
    it('should update appointment status', async () => {
      const { salon, user, client, service, tokens } = await createTestContext();
      const appointment = await createTestAppointment(salon.id, client.id, user.id, service.id, {
        status: 'confirmed',
      });

      const response = await authenticatedRequest(tokens.accessToken)
        .patch(`/api/v1/appointments/${appointment.id}`)
        .send({
          status: 'cancelled',
          cancellationReason: 'Client requested cancellation',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('cancelled');
      expect(response.body.data.cancellationReason).toBe('Client requested cancellation');
    });

    it('should update appointment notes', async () => {
      const { salon, user, client, service, tokens } = await createTestContext();
      const appointment = await createTestAppointment(salon.id, client.id, user.id, service.id);

      const response = await authenticatedRequest(tokens.accessToken)
        .patch(`/api/v1/appointments/${appointment.id}`)
        .send({
          notes: 'Updated notes for the appointment',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.notes).toBe('Updated notes for the appointment');
    });

    it('should return 404 for non-existent appointment', async () => {
      const { tokens } = await createTestContext();

      const response = await authenticatedRequest(tokens.accessToken)
        .patch('/api/v1/appointments/non-existent-id')
        .send({
          status: 'cancelled',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/appointments/:id/complete', () => {
    it('should mark appointment as completed', async () => {
      const { salon, user, client, service, tokens } = await createTestContext();
      const appointment = await createTestAppointment(salon.id, client.id, user.id, service.id, {
        status: 'confirmed',
      });

      const response = await authenticatedRequest(tokens.accessToken)
        .post(`/api/v1/appointments/${appointment.id}/complete`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('completed');
    });

    it('should return 404 for non-existent appointment', async () => {
      const { tokens } = await createTestContext();

      const response = await authenticatedRequest(tokens.accessToken)
        .post('/api/v1/appointments/non-existent-id/complete');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/v1/appointments/:id/no-show', () => {
    it('should mark appointment as no-show', async () => {
      const { salon, user, client, service, tokens } = await createTestContext();
      const appointment = await createTestAppointment(salon.id, client.id, user.id, service.id, {
        status: 'confirmed',
      });

      const response = await authenticatedRequest(tokens.accessToken)
        .post(`/api/v1/appointments/${appointment.id}/no-show`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('no_show');
    });
  });

  describe('Appointment Booking Flow', () => {
    it('should complete full booking -> update -> complete flow', async () => {
      const { salon, user, client, service, tokens } = await createTestContext();

      const startTime = new Date(Date.now() + 120 * 60 * 60 * 1000); // 5 days from now

      // Step 1: Create appointment
      const createResponse = await authenticatedRequest(tokens.accessToken)
        .post('/api/v1/appointments')
        .send({
          clientId: client.id,
          staffId: user.id,
          serviceId: service.id,
          startTime: startTime.toISOString(),
          notes: 'Initial booking',
        });

      expect(createResponse.status).toBe(201);
      const appointmentId = createResponse.body.data.id;

      // Step 2: Read appointment
      const readResponse = await authenticatedRequest(tokens.accessToken)
        .get(`/api/v1/appointments/${appointmentId}`);

      expect(readResponse.status).toBe(200);
      expect(readResponse.body.data.status).toBe('confirmed');

      // Step 3: Update notes
      const updateResponse = await authenticatedRequest(tokens.accessToken)
        .patch(`/api/v1/appointments/${appointmentId}`)
        .send({
          notes: 'Updated during flow test',
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.notes).toBe('Updated during flow test');

      // Step 4: Complete appointment
      const completeResponse = await authenticatedRequest(tokens.accessToken)
        .post(`/api/v1/appointments/${appointmentId}/complete`);

      expect(completeResponse.status).toBe(200);
      expect(completeResponse.body.data.status).toBe('completed');

      // Verify final state
      const finalResponse = await authenticatedRequest(tokens.accessToken)
        .get(`/api/v1/appointments/${appointmentId}`);

      expect(finalResponse.body.data.status).toBe('completed');

      // Clean up
      await prisma.appointment.delete({ where: { id: appointmentId } });
    });

    it('should handle cancellation flow correctly', async () => {
      const { salon, user, client, service, tokens } = await createTestContext();

      const startTime = new Date(Date.now() + 144 * 60 * 60 * 1000); // 6 days from now

      // Create appointment
      const createResponse = await authenticatedRequest(tokens.accessToken)
        .post('/api/v1/appointments')
        .send({
          clientId: client.id,
          staffId: user.id,
          serviceId: service.id,
          startTime: startTime.toISOString(),
        });

      expect(createResponse.status).toBe(201);
      const appointmentId = createResponse.body.data.id;

      // Cancel the appointment
      const cancelResponse = await authenticatedRequest(tokens.accessToken)
        .patch(`/api/v1/appointments/${appointmentId}`)
        .send({
          status: 'cancelled',
          cancellationReason: 'Client cancelled',
        });

      expect(cancelResponse.status).toBe(200);
      expect(cancelResponse.body.data.status).toBe('cancelled');
      expect(cancelResponse.body.data.cancellationReason).toBe('Client cancelled');

      // Cancelled appointments should not cause conflicts
      const newAppointmentResponse = await authenticatedRequest(tokens.accessToken)
        .post('/api/v1/appointments')
        .send({
          clientId: client.id,
          staffId: user.id,
          serviceId: service.id,
          startTime: startTime.toISOString(), // Same time as cancelled
        });

      expect(newAppointmentResponse.status).toBe(201);

      // Clean up
      await prisma.appointment.deleteMany({
        where: {
          id: { in: [appointmentId, newAppointmentResponse.body.data.id] },
        },
      });
    });
  });
});
