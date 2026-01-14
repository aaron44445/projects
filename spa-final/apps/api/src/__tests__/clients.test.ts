import { describe, it, expect, beforeEach } from 'vitest';
import {
  request,
  app,
  createTestContext,
  createTestClient,
  authenticatedRequest,
  uniqueId,
  generateTestTokens,
} from './helpers';
import { prisma } from './setup';

describe('Clients API', () => {
  describe('GET /api/v1/clients', () => {
    it('should list clients for authenticated user', async () => {
      const { salon, user, client, tokens } = await createTestContext();

      const response = await authenticatedRequest(tokens.accessToken)
        .get('/api/v1/clients');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeDefined();
      expect(Array.isArray(response.body.data.items)).toBe(true);
      expect(response.body.data.items.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data.total).toBeGreaterThanOrEqual(1);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/v1/clients');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should search clients by name', async () => {
      const { salon, user, tokens } = await createTestContext();
      await createTestClient(salon.id, { firstName: 'Searchable', lastName: 'Client' });

      const response = await authenticatedRequest(tokens.accessToken)
        .get('/api/v1/clients?search=Searchable');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items.some((c: { firstName: string }) => c.firstName === 'Searchable')).toBe(true);
    });

    it('should paginate clients correctly', async () => {
      const { salon, user, tokens } = await createTestContext();

      // Create more clients to test pagination
      for (let i = 0; i < 5; i++) {
        await createTestClient(salon.id, { firstName: `Paginated${i}`, lastName: 'Client' });
      }

      const response = await authenticatedRequest(tokens.accessToken)
        .get('/api/v1/clients?page=1&pageSize=3');

      expect(response.status).toBe(200);
      expect(response.body.data.items.length).toBeLessThanOrEqual(3);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.pageSize).toBe(3);
    });

    it('should only return clients from the same salon', async () => {
      const { salon, user, client, tokens } = await createTestContext();

      // Create another salon with a client
      const otherSalon = await prisma.salon.create({
        data: {
          name: 'Other Salon',
          slug: `other-salon-${uniqueId()}`,
          email: `other-${uniqueId()}@test.com`,
        },
      });
      await prisma.client.create({
        data: {
          salonId: otherSalon.id,
          firstName: 'Other',
          lastName: 'SalonClient',
          email: `other-client-${uniqueId()}@test.com`,
        },
      });

      const response = await authenticatedRequest(tokens.accessToken)
        .get('/api/v1/clients');

      expect(response.status).toBe(200);
      // Should not include clients from other salons
      const otherSalonClients = response.body.data.items.filter(
        (c: { salonId: string }) => c.salonId !== salon.id
      );
      expect(otherSalonClients.length).toBe(0);

      // Clean up
      await prisma.client.deleteMany({ where: { salonId: otherSalon.id } });
      await prisma.salon.delete({ where: { id: otherSalon.id } });
    });
  });

  describe('GET /api/v1/clients/:id', () => {
    it('should return client details by ID', async () => {
      const { salon, user, client, tokens } = await createTestContext();

      const response = await authenticatedRequest(tokens.accessToken)
        .get(`/api/v1/clients/${client.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(client.id);
      expect(response.body.data.firstName).toBe(client.firstName);
      expect(response.body.data.lastName).toBe(client.lastName);
    });

    it('should return 404 for non-existent client', async () => {
      const { tokens } = await createTestContext();
      const fakeId = 'non-existent-id';

      const response = await authenticatedRequest(tokens.accessToken)
        .get(`/api/v1/clients/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should not return client from different salon', async () => {
      const { tokens } = await createTestContext();

      // Create another salon with a client
      const otherSalon = await prisma.salon.create({
        data: {
          name: 'Other Salon',
          slug: `other-salon-${uniqueId()}`,
          email: `other-${uniqueId()}@test.com`,
        },
      });
      const otherClient = await prisma.client.create({
        data: {
          salonId: otherSalon.id,
          firstName: 'Other',
          lastName: 'Client',
          email: `other-${uniqueId()}@test.com`,
        },
      });

      const response = await authenticatedRequest(tokens.accessToken)
        .get(`/api/v1/clients/${otherClient.id}`);

      expect(response.status).toBe(404);

      // Clean up
      await prisma.client.delete({ where: { id: otherClient.id } });
      await prisma.salon.delete({ where: { id: otherSalon.id } });
    });
  });

  describe('POST /api/v1/clients', () => {
    it('should create a new client', async () => {
      const { salon, user, tokens } = await createTestContext();
      const id = uniqueId();

      const response = await authenticatedRequest(tokens.accessToken)
        .post('/api/v1/clients')
        .send({
          firstName: 'New',
          lastName: 'Client',
          email: `newclient-${id}@test.com`,
          phone: '555-NEW-1234',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('New');
      expect(response.body.data.lastName).toBe('Client');
      expect(response.body.data.email).toBe(`newclient-${id}@test.com`);
      expect(response.body.data.salonId).toBe(salon.id);

      // Clean up
      await prisma.client.delete({ where: { id: response.body.data.id } });
    });

    it('should return 400 when client with same email exists', async () => {
      const { salon, user, client, tokens } = await createTestContext();

      const response = await authenticatedRequest(tokens.accessToken)
        .post('/api/v1/clients')
        .send({
          firstName: 'Duplicate',
          lastName: 'Email',
          email: client.email,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CLIENT_EXISTS');
    });

    it('should return 400 when client with same phone exists', async () => {
      const { salon, user, client, tokens } = await createTestContext();

      const response = await authenticatedRequest(tokens.accessToken)
        .post('/api/v1/clients')
        .send({
          firstName: 'Duplicate',
          lastName: 'Phone',
          phone: client.phone,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CLIENT_EXISTS');
    });

    it('should create client with optional fields', async () => {
      const { salon, user, tokens } = await createTestContext();
      const id = uniqueId();

      const response = await authenticatedRequest(tokens.accessToken)
        .post('/api/v1/clients')
        .send({
          firstName: 'Full',
          lastName: 'Details',
          email: `fulldetails-${id}@test.com`,
          phone: '555-FULL-123',
          address: '123 Test St',
          city: 'Test City',
          state: 'TX',
          zip: '12345',
          birthday: '1990-01-15',
          notes: 'Test notes',
          communicationPreference: 'sms',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.address).toBe('123 Test St');
      expect(response.body.data.city).toBe('Test City');
      expect(response.body.data.state).toBe('TX');
      expect(response.body.data.communicationPreference).toBe('sms');

      // Clean up
      await prisma.client.delete({ where: { id: response.body.data.id } });
    });
  });

  describe('PATCH /api/v1/clients/:id', () => {
    it('should update client details', async () => {
      const { salon, user, client, tokens } = await createTestContext();

      const response = await authenticatedRequest(tokens.accessToken)
        .patch(`/api/v1/clients/${client.id}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('Updated');
      expect(response.body.data.lastName).toBe('Name');
    });

    it('should return 404 for non-existent client', async () => {
      const { tokens } = await createTestContext();

      const response = await authenticatedRequest(tokens.accessToken)
        .patch('/api/v1/clients/non-existent-id')
        .send({
          firstName: 'Updated',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should update only specified fields', async () => {
      const { salon, user, client, tokens } = await createTestContext();
      const originalEmail = client.email;

      const response = await authenticatedRequest(tokens.accessToken)
        .patch(`/api/v1/clients/${client.id}`)
        .send({
          firstName: 'OnlyFirst',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.firstName).toBe('OnlyFirst');
      expect(response.body.data.email).toBe(originalEmail); // Should remain unchanged
    });
  });

  describe('POST /api/v1/clients/:id/notes', () => {
    it('should add a note to client', async () => {
      const { salon, user, client, tokens } = await createTestContext();

      const response = await authenticatedRequest(tokens.accessToken)
        .post(`/api/v1/clients/${client.id}/notes`)
        .send({
          content: 'This is a test note for the client.',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe('This is a test note for the client.');
      expect(response.body.data.clientId).toBe(client.id);

      // Clean up
      await prisma.clientNote.delete({ where: { id: response.body.data.id } });
    });

    it('should return 404 for non-existent client', async () => {
      const { tokens } = await createTestContext();

      const response = await authenticatedRequest(tokens.accessToken)
        .post('/api/v1/clients/non-existent-id/notes')
        .send({
          content: 'Note content',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('Client Creation Flow', () => {
    it('should complete full create -> read -> update flow', async () => {
      const { salon, user, tokens } = await createTestContext();
      const id = uniqueId();

      // Step 1: Create client
      const createResponse = await authenticatedRequest(tokens.accessToken)
        .post('/api/v1/clients')
        .send({
          firstName: 'Flow',
          lastName: 'Test',
          email: `flowtest-${id}@test.com`,
          phone: '555-FLOW-000',
        });

      expect(createResponse.status).toBe(201);
      const clientId = createResponse.body.data.id;

      // Step 2: Read client
      const readResponse = await authenticatedRequest(tokens.accessToken)
        .get(`/api/v1/clients/${clientId}`);

      expect(readResponse.status).toBe(200);
      expect(readResponse.body.data.firstName).toBe('Flow');

      // Step 3: Update client
      const updateResponse = await authenticatedRequest(tokens.accessToken)
        .patch(`/api/v1/clients/${clientId}`)
        .send({
          firstName: 'UpdatedFlow',
          notes: 'Updated during flow test',
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.firstName).toBe('UpdatedFlow');

      // Step 4: Add note
      const noteResponse = await authenticatedRequest(tokens.accessToken)
        .post(`/api/v1/clients/${clientId}/notes`)
        .send({
          content: 'Flow test note',
        });

      expect(noteResponse.status).toBe(201);

      // Step 5: Verify in list
      const listResponse = await authenticatedRequest(tokens.accessToken)
        .get('/api/v1/clients?search=UpdatedFlow');

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.data.items.some((c: { id: string }) => c.id === clientId)).toBe(true);

      // Clean up
      await prisma.clientNote.deleteMany({ where: { clientId } });
      await prisma.client.delete({ where: { id: clientId } });
    });
  });
});
