import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { prisma } from './setup';
import app from '../app.js';

/**
 * Integration tests for concurrent booking prevention.
 *
 * These tests verify that the booking system correctly handles race conditions
 * when multiple users attempt to book the same time slot simultaneously.
 *
 * The key behavior being tested:
 * - Exactly 1 booking succeeds when N concurrent requests target the same slot
 * - N-1 requests receive TIME_CONFLICT error with alternative slots
 * - No double-bookings occur
 */
describe('Booking Concurrency', () => {
  let testSalon: { id: string; slug: string };
  let testService: { id: string; durationMinutes: number };
  let testStaff: { id: string };
  let testLocation: { id: string };

  // Create test fixtures
  beforeAll(async () => {
    // Create salon with booking enabled
    const salon = await prisma.salon.create({
      data: {
        name: 'Concurrency Test Salon',
        slug: `concurrency-test-${Date.now()}`,
        email: `concurrency-test-${Date.now()}@test.com`,
        timezone: 'America/Chicago',
        bookingEnabled: true,
        bookingMinNoticeHours: 0, // Allow immediate booking for tests
        bookingMaxAdvanceDays: 60,
        bookingSlotInterval: 30,
      },
    });
    testSalon = { id: salon.id, slug: salon.slug };

    // Create location
    const location = await prisma.location.create({
      data: {
        salonId: salon.id,
        name: 'Test Location',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        isActive: true,
        isPrimary: true,
      },
    });
    testLocation = { id: location.id };

    // Create location hours (open 9-5 every day)
    for (let day = 0; day <= 6; day++) {
      await prisma.locationHours.create({
        data: {
          locationId: location.id,
          dayOfWeek: day,
          openTime: '09:00',
          closeTime: '17:00',
          isClosed: false,
        },
      });
    }

    // Create service
    const service = await prisma.service.create({
      data: {
        salonId: salon.id,
        name: 'Test Service',
        durationMinutes: 30,
        price: 50,
        color: '#C7DCC8',
        isActive: true,
        onlineBookingEnabled: true,
      },
    });
    testService = { id: service.id, durationMinutes: service.durationMinutes };

    // Create staff member with online booking enabled
    const staff = await prisma.user.create({
      data: {
        salonId: salon.id,
        email: `concurrency-staff-${Date.now()}@test.com`,
        passwordHash: 'hashed-password',
        firstName: 'Test',
        lastName: 'Staff',
        role: 'staff',
        isActive: true,
        onlineBookingEnabled: true,
      },
    });
    testStaff = { id: staff.id };

    // Assign staff to service
    await prisma.staffService.create({
      data: {
        staffId: staff.id,
        serviceId: service.id,
        isAvailable: true,
      },
    });

    // Assign staff to location
    await prisma.staffLocation.create({
      data: {
        staffId: staff.id,
        locationId: location.id,
        isPrimary: true,
      },
    });

    // Create staff availability (available 9-5 every day)
    for (let day = 0; day <= 6; day++) {
      await prisma.staffAvailability.create({
        data: {
          staffId: staff.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00',
        },
      });
    }
  });

  // Cleanup test data
  afterAll(async () => {
    if (testSalon?.id) {
      // Delete in order respecting foreign key constraints
      await prisma.appointment.deleteMany({ where: { salonId: testSalon.id } });
      await prisma.client.deleteMany({ where: { salonId: testSalon.id } });
      await prisma.staffAvailability.deleteMany({
        where: { staff: { salonId: testSalon.id } },
      });
      await prisma.staffLocation.deleteMany({
        where: { staff: { salonId: testSalon.id } },
      });
      await prisma.staffService.deleteMany({
        where: { staff: { salonId: testSalon.id } },
      });
      await prisma.locationHours.deleteMany({
        where: { location: { salonId: testSalon.id } },
      });
      await prisma.location.deleteMany({ where: { salonId: testSalon.id } });
      await prisma.user.deleteMany({ where: { salonId: testSalon.id } });
      await prisma.service.deleteMany({ where: { salonId: testSalon.id } });
      await prisma.salon.delete({ where: { id: testSalon.id } });
    }
  });

  describe('prevents double booking under concurrent load', () => {
    it('allows exactly one booking when 20 concurrent requests target the same slot', async () => {
      const concurrentRequests = 20;

      // Calculate a future time slot (tomorrow at 10:00 AM)
      const targetTime = new Date();
      targetTime.setDate(targetTime.getDate() + 1);
      targetTime.setHours(10, 0, 0, 0);

      // Create N booking requests simultaneously
      const promises = Array(concurrentRequests)
        .fill(null)
        .map((_, i) =>
          request(app)
            .post(`/api/v1/public/${testSalon.slug}/book`)
            .send({
              serviceId: testService.id,
              staffId: testStaff.id,
              locationId: testLocation.id,
              startTime: targetTime.toISOString(),
              firstName: 'Concurrent',
              lastName: `User${i}`,
              email: `concurrent-test-${i}-${Date.now()}@example.com`,
            })
        );

      const results = await Promise.all(promises);

      // Count successes and conflicts
      const successes = results.filter((r) => r.status === 201);
      const conflicts = results.filter(
        (r) => r.status === 400 && r.body?.error?.code === 'TIME_CONFLICT'
      );
      const otherErrors = results.filter(
        (r) => r.status !== 201 && !(r.status === 400 && r.body?.error?.code === 'TIME_CONFLICT')
      );

      // Log for debugging if test fails
      if (successes.length !== 1) {
        console.log('Successes:', successes.length);
        console.log('Conflicts:', conflicts.length);
        console.log(
          'Other errors:',
          otherErrors.map((e) => ({ status: e.status, body: e.body }))
        );
      }

      // Exactly one success
      expect(successes.length).toBe(1);

      // Rest are conflicts
      expect(conflicts.length).toBe(concurrentRequests - 1);

      // No unexpected errors
      expect(otherErrors.length).toBe(0);

      // Verify only one appointment exists in database for this time slot
      const appointments = await prisma.appointment.findMany({
        where: {
          salonId: testSalon.id,
          staffId: testStaff.id,
          startTime: targetTime,
          status: { notIn: ['cancelled'] },
        },
      });
      expect(appointments.length).toBe(1);
    }, 60000); // Allow 60s for concurrent test

    it('returns alternative slots when time is taken', async () => {
      // Calculate a different future time slot (day after tomorrow at 11:00 AM)
      const targetTime = new Date();
      targetTime.setDate(targetTime.getDate() + 2);
      targetTime.setHours(11, 0, 0, 0);

      // First booking should succeed
      const firstBooking = await request(app)
        .post(`/api/v1/public/${testSalon.slug}/book`)
        .send({
          serviceId: testService.id,
          staffId: testStaff.id,
          locationId: testLocation.id,
          startTime: targetTime.toISOString(),
          firstName: 'First',
          lastName: 'Booker',
          email: `first-booker-${Date.now()}@example.com`,
        });

      expect(firstBooking.status).toBe(201);
      expect(firstBooking.body.success).toBe(true);

      // Second booking should conflict but receive alternatives
      const secondBooking = await request(app)
        .post(`/api/v1/public/${testSalon.slug}/book`)
        .send({
          serviceId: testService.id,
          staffId: testStaff.id,
          locationId: testLocation.id,
          startTime: targetTime.toISOString(),
          firstName: 'Second',
          lastName: 'Booker',
          email: `second-booker-${Date.now()}@example.com`,
        });

      expect(secondBooking.status).toBe(400);
      expect(secondBooking.body.success).toBe(false);
      expect(secondBooking.body.error.code).toBe('TIME_CONFLICT');
      expect(secondBooking.body.error.message).toBe('This time slot is no longer available');

      // Verify alternatives are provided
      expect(secondBooking.body.alternatives).toBeDefined();
      expect(Array.isArray(secondBooking.body.alternatives)).toBe(true);
      expect(secondBooking.body.alternatives.length).toBeGreaterThan(0);

      // Each alternative should have required fields
      secondBooking.body.alternatives.forEach(
        (alt: { time: string; date: string; staffId: string; staffName: string }) => {
          expect(alt.time).toBeDefined();
          expect(alt.date).toBeDefined();
          expect(alt.staffId).toBeDefined();
          expect(alt.staffName).toBeDefined();
        }
      );
    });

    it('handles multiple overlapping time ranges correctly', async () => {
      // Test that partial overlaps are also caught
      // Book 2:00 PM - 2:30 PM
      const baseTime = new Date();
      baseTime.setDate(baseTime.getDate() + 3);
      baseTime.setHours(14, 0, 0, 0);

      // First booking: 2:00 PM
      const firstBooking = await request(app)
        .post(`/api/v1/public/${testSalon.slug}/book`)
        .send({
          serviceId: testService.id,
          staffId: testStaff.id,
          locationId: testLocation.id,
          startTime: baseTime.toISOString(),
          firstName: 'Overlap',
          lastName: 'Test1',
          email: `overlap-test1-${Date.now()}@example.com`,
        });

      expect(firstBooking.status).toBe(201);

      // Try to book 2:15 PM (overlaps with 2:00-2:30 slot)
      const overlapTime = new Date(baseTime);
      overlapTime.setMinutes(15);

      const overlapBooking = await request(app)
        .post(`/api/v1/public/${testSalon.slug}/book`)
        .send({
          serviceId: testService.id,
          staffId: testStaff.id,
          locationId: testLocation.id,
          startTime: overlapTime.toISOString(),
          firstName: 'Overlap',
          lastName: 'Test2',
          email: `overlap-test2-${Date.now()}@example.com`,
        });

      // Should fail due to overlap
      expect(overlapBooking.status).toBe(400);
      expect(overlapBooking.body.error.code).toBe('TIME_CONFLICT');
    });
  });

  describe('booking flow validation', () => {
    it('requires all mandatory fields', async () => {
      const response = await request(app)
        .post(`/api/v1/public/${testSalon.slug}/book`)
        .send({
          // Missing required fields
          firstName: 'Test',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('MISSING_FIELDS');
    });

    it('returns 404 for non-existent salon', async () => {
      const response = await request(app)
        .post('/api/v1/public/non-existent-salon/book')
        .send({
          serviceId: testService.id,
          staffId: testStaff.id,
          startTime: new Date().toISOString(),
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
        });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });
});
