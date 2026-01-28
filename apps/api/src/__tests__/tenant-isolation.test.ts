/**
 * Tenant Isolation Tests
 *
 * These tests verify that data from one salon cannot be accessed,
 * modified, or deleted by another salon. This is critical for
 * multi-tenant security.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  createTestSalon,
  createTestUser,
  createTestClient,
  createTestService,
  createTestAppointment,
  generateTestTokens,
  authenticatedRequest,
  TestSalon,
  TestUser,
  TestClient,
  TestService,
  TestAppointment,
} from './helpers';

describe('Tenant Isolation', () => {
  // Two completely separate salons
  let salonA: TestSalon;
  let salonB: TestSalon;
  let userA: TestUser & { password: string };
  let userB: TestUser & { password: string };
  let tokensA: { accessToken: string; refreshToken: string };
  let tokensB: { accessToken: string; refreshToken: string };

  // Salon A resources
  let clientA: TestClient;
  let serviceA: TestService;
  let appointmentA: TestAppointment;

  // Salon B resources
  let clientB: TestClient;
  let serviceB: TestService;
  let appointmentB: TestAppointment;

  beforeAll(async () => {
    // Create two independent salons
    salonA = await createTestSalon({ name: 'Salon A' });
    salonB = await createTestSalon({ name: 'Salon B' });

    // Create users for each salon
    userA = await createTestUser(salonA.id, { email: 'owner-a@test.com', role: 'owner' });
    userB = await createTestUser(salonB.id, { email: 'owner-b@test.com', role: 'owner' });

    // Generate tokens
    tokensA = generateTestTokens(userA.id, salonA.id, 'owner');
    tokensB = generateTestTokens(userB.id, salonB.id, 'owner');

    // Create resources for each salon
    clientA = await createTestClient(salonA.id);
    clientB = await createTestClient(salonB.id);

    serviceA = await createTestService(salonA.id);
    serviceB = await createTestService(salonB.id);

    appointmentA = await createTestAppointment(salonA.id, clientA.id, userA.id, serviceA.id);
    appointmentB = await createTestAppointment(salonB.id, clientB.id, userB.id, serviceB.id);
  });

  describe('Appointment Isolation', () => {
    it('salon A cannot read salon B appointment by ID', async () => {
      const response = await authenticatedRequest(tokensA.accessToken)
        .get(`/api/v1/appointments/${appointmentB.id}`);

      expect(response.status).toBe(404);
    });

    it('salon A cannot update salon B appointment', async () => {
      const response = await authenticatedRequest(tokensA.accessToken)
        .patch(`/api/v1/appointments/${appointmentB.id}`)
        .send({ notes: 'Cross-tenant attack' });

      expect(response.status).toBe(404);
    });

    it('salon A cannot cancel salon B appointment', async () => {
      const response = await authenticatedRequest(tokensA.accessToken)
        .post(`/api/v1/appointments/${appointmentB.id}/cancel`);

      expect(response.status).toBe(404);
    });

    it('salon A list excludes salon B appointments', async () => {
      const response = await authenticatedRequest(tokensA.accessToken)
        .get('/api/v1/appointments');

      expect(response.status).toBe(200);
      const appointmentIds = response.body.data.appointments?.map((a: any) => a.id) || [];
      expect(appointmentIds).not.toContain(appointmentB.id);
    });
  });

  describe('Client Isolation', () => {
    it('salon A cannot read salon B client by ID', async () => {
      const response = await authenticatedRequest(tokensA.accessToken)
        .get(`/api/v1/clients/${clientB.id}`);

      expect(response.status).toBe(404);
    });

    it('salon A cannot update salon B client', async () => {
      const response = await authenticatedRequest(tokensA.accessToken)
        .patch(`/api/v1/clients/${clientB.id}`)
        .send({ firstName: 'Hacked' });

      // Should be 404 (not found) not 200 (success)
      expect(response.status).toBe(404);
    });

    it('salon A list excludes salon B clients', async () => {
      const response = await authenticatedRequest(tokensA.accessToken)
        .get('/api/v1/clients');

      expect(response.status).toBe(200);
      const clientIds = response.body.data?.map((c: any) => c.id) || [];
      expect(clientIds).not.toContain(clientB.id);
    });
  });

  describe('Service Isolation', () => {
    it('salon A cannot read salon B service by ID', async () => {
      const response = await authenticatedRequest(tokensA.accessToken)
        .get(`/api/v1/services/${serviceB.id}`);

      expect(response.status).toBe(404);
    });

    it('salon A cannot update salon B service', async () => {
      const response = await authenticatedRequest(tokensA.accessToken)
        .patch(`/api/v1/services/${serviceB.id}`)
        .send({ price: 0 });

      expect(response.status).toBe(404);
    });

    it('salon A list excludes salon B services', async () => {
      const response = await authenticatedRequest(tokensA.accessToken)
        .get('/api/v1/services');

      expect(response.status).toBe(200);
      const serviceIds = response.body.data?.map((s: any) => s.id) || [];
      expect(serviceIds).not.toContain(serviceB.id);
    });
  });

  describe('Staff Isolation', () => {
    it('salon A cannot read salon B staff by ID', async () => {
      const response = await authenticatedRequest(tokensA.accessToken)
        .get(`/api/v1/staff/${userB.id}`);

      expect(response.status).toBe(404);
    });

    it('salon A cannot update salon B staff', async () => {
      const response = await authenticatedRequest(tokensA.accessToken)
        .patch(`/api/v1/staff/${userB.id}`)
        .send({ firstName: 'Hacked' });

      expect(response.status).toBe(404);
    });

    it('salon A list excludes salon B staff', async () => {
      const response = await authenticatedRequest(tokensA.accessToken)
        .get('/api/v1/staff');

      expect(response.status).toBe(200);
      const staffIds = response.body.data?.map((s: any) => s.id) || [];
      expect(staffIds).not.toContain(userB.id);
    });
  });

  describe('Cross-Tenant Data Integrity', () => {
    it('salon B data unchanged after salon A access attempts', async () => {
      // Verify client B still has original data
      const clientResponse = await authenticatedRequest(tokensB.accessToken)
        .get(`/api/v1/clients/${clientB.id}`);

      expect(clientResponse.status).toBe(200);
      expect(clientResponse.body.data.firstName).toBe(clientB.firstName);

      // Verify appointment B still has original status
      const appointmentResponse = await authenticatedRequest(tokensB.accessToken)
        .get(`/api/v1/appointments/${appointmentB.id}`);

      expect(appointmentResponse.status).toBe(200);
      expect(appointmentResponse.body.data.status).toBe('confirmed');
    });

    it('salon A can only access its own data', async () => {
      const clientResponse = await authenticatedRequest(tokensA.accessToken)
        .get(`/api/v1/clients/${clientA.id}`);
      expect(clientResponse.status).toBe(200);
      expect(clientResponse.body.data.id).toBe(clientA.id);

      const appointmentResponse = await authenticatedRequest(tokensA.accessToken)
        .get(`/api/v1/appointments/${appointmentA.id}`);
      expect(appointmentResponse.status).toBe(200);
      expect(appointmentResponse.body.data.id).toBe(appointmentA.id);
    });
  });
});
