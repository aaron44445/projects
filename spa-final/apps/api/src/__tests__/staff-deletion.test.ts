import { describe, it, expect } from 'vitest';
import {
  createTestContext,
  authenticatedRequest,
  uniqueId,
  createTestUser,
} from './helpers';
import { prisma } from './setup';

describe('Staff Deletion - Email Reuse', () => {
  describe('DELETE /api/v1/staff/:id', () => {
    it('should allow email reuse after staff deletion', async () => {
      const { salon, tokens } = await createTestContext();
      const testEmail = `reuse-${uniqueId()}@test.com`;

      // Step 1: Create a staff member
      const createResponse = await authenticatedRequest(tokens.accessToken)
        .post('/api/v1/staff')
        .send({
          email: testEmail,
          firstName: 'Test',
          lastName: 'Staff',
          role: 'staff',
        });

      expect(createResponse.status).toBe(201);
      const staffId = createResponse.body.data.id;

      // Step 2: Delete the staff member
      const deleteResponse = await authenticatedRequest(tokens.accessToken)
        .delete(`/api/v1/staff/${staffId}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);

      // Step 3: Verify the staff is deactivated and email is anonymized
      const deletedStaff = await prisma.user.findUnique({
        where: { id: staffId },
      });

      expect(deletedStaff).not.toBeNull();
      expect(deletedStaff!.isActive).toBe(false);
      expect(deletedStaff!.email).toMatch(/^deleted_\d+_/);

      // Step 4: Create a new staff member with the same email
      const recreateResponse = await authenticatedRequest(tokens.accessToken)
        .post('/api/v1/staff')
        .send({
          email: testEmail,
          firstName: 'New',
          lastName: 'Staff',
          role: 'staff',
        });

      expect(recreateResponse.status).toBe(201);
      expect(recreateResponse.body.success).toBe(true);
      expect(recreateResponse.body.data.email).toBe(testEmail);
    });

    it('should anonymize deactivated user email when creating with same email', async () => {
      const { salon, tokens } = await createTestContext();
      const testEmail = `anon-${uniqueId()}@test.com`;

      // Create a deactivated user directly (simulating old data)
      const deactivatedUser = await prisma.user.create({
        data: {
          salonId: salon.id,
          email: testEmail,
          firstName: 'Old',
          lastName: 'Staff',
          role: 'staff',
          isActive: false,
        },
      });

      // Try to create new staff with the same email
      const createResponse = await authenticatedRequest(tokens.accessToken)
        .post('/api/v1/staff')
        .send({
          email: testEmail,
          firstName: 'New',
          lastName: 'Staff',
          role: 'staff',
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);

      // Verify the old user's email was anonymized
      const oldUser = await prisma.user.findUnique({
        where: { id: deactivatedUser.id },
      });

      expect(oldUser!.email).toMatch(/^deleted_\d+_/);
    });

    it('should still reject duplicate email for active staff', async () => {
      const { salon, tokens } = await createTestContext();
      const testEmail = `active-${uniqueId()}@test.com`;

      // Create first staff member
      const firstResponse = await authenticatedRequest(tokens.accessToken)
        .post('/api/v1/staff')
        .send({
          email: testEmail,
          firstName: 'First',
          lastName: 'Staff',
          role: 'staff',
        });

      expect(firstResponse.status).toBe(201);

      // Try to create second staff with same email (should fail)
      const secondResponse = await authenticatedRequest(tokens.accessToken)
        .post('/api/v1/staff')
        .send({
          email: testEmail,
          firstName: 'Second',
          lastName: 'Staff',
          role: 'staff',
        });

      expect(secondResponse.status).toBe(400);
      expect(secondResponse.body.error.code).toBe('EMAIL_EXISTS');
    });
  });
});
