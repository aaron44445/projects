import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBookingWithLock, BookingConflictError } from '../services/booking.js';
import { Prisma } from '@peacase/database';

// Mock prisma
vi.mock('@peacase/database', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@peacase/database')>();
  return {
    ...actual,
    prisma: {
      $transaction: vi.fn(),
    },
  };
});

// Import mocked prisma
import { prisma } from '@peacase/database';

describe('Booking Service', () => {
  const mockBookingData = {
    salonId: 'salon-123',
    clientId: 'client-456',
    staffId: 'staff-789',
    serviceId: 'service-abc',
    locationId: null,
    startTime: new Date('2026-01-25T10:00:00Z'),
    endTime: new Date('2026-01-25T11:00:00Z'),
    durationMinutes: 60,
    price: 50,
    notes: 'Test booking',
    source: 'online_booking',
  };

  const mockCreatedAppointment = {
    id: 'appointment-xyz',
    ...mockBookingData,
    status: 'confirmed',
    createdAt: new Date(),
    updatedAt: new Date(),
    client: {
      firstName: 'Test',
      lastName: 'Client',
      email: 'test@example.com',
    },
    staff: {
      firstName: 'Test',
      lastName: 'Staff',
    },
    service: {
      name: 'Test Service',
    },
    location: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('BookingConflictError', () => {
    it('should have correct code property', () => {
      const error = new BookingConflictError();
      expect(error.code).toBe('TIME_CONFLICT');
      expect(error.name).toBe('BookingConflictError');
    });

    it('should accept custom message', () => {
      const error = new BookingConflictError('Custom conflict message');
      expect(error.message).toBe('Custom conflict message');
    });

    it('should have default message', () => {
      const error = new BookingConflictError();
      expect(error.message).toBe('This time slot is no longer available');
    });

    it('should be instanceof Error', () => {
      const error = new BookingConflictError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('createBookingWithLock', () => {
    // Helper to create mock transaction object with both $executeRaw and $queryRaw
    const createMockTx = (conflictingAppointments: any[] = []) => ({
      $executeRaw: vi.fn().mockResolvedValue(1), // Mock advisory lock acquisition
      $queryRaw: vi.fn().mockResolvedValue(conflictingAppointments),
      appointment: {
        create: vi.fn().mockResolvedValue(mockCreatedAppointment),
      },
    });

    it('should successfully create a booking when no conflicts exist', async () => {
      const mockTx = createMockTx([]);

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      const result = await createBookingWithLock(mockBookingData);

      expect(result).toEqual(mockCreatedAppointment);
      expect(mockTx.$executeRaw).toHaveBeenCalledTimes(1); // Advisory lock acquired
      expect(mockTx.$queryRaw).toHaveBeenCalledTimes(1); // Conflict check
      expect(mockTx.appointment.create).toHaveBeenCalledTimes(1);
      expect(mockTx.appointment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            salonId: mockBookingData.salonId,
            clientId: mockBookingData.clientId,
            staffId: mockBookingData.staffId,
            status: 'confirmed',
          }),
        })
      );
    });

    it('should throw BookingConflictError when conflicting appointment exists', async () => {
      const mockTx = createMockTx([{ id: 'existing-appointment' }]);

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      await expect(createBookingWithLock(mockBookingData)).rejects.toThrow(
        BookingConflictError
      );

      expect(mockTx.$executeRaw).toHaveBeenCalledTimes(1); // Advisory lock still acquired
      expect(mockTx.$queryRaw).toHaveBeenCalledTimes(1); // Conflict check found conflict
      expect(mockTx.appointment.create).not.toHaveBeenCalled();
    });

    it('should retry on P2034 errors and succeed', async () => {
      let attemptCount = 0;
      const mockTx = createMockTx([]);

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        attemptCount++;
        if (attemptCount <= 2) {
          // Fail first 2 attempts with P2034
          const error = new Prisma.PrismaClientKnownRequestError('Write conflict', {
            code: 'P2034',
            clientVersion: '5.0.0',
          });
          throw error;
        }
        // Succeed on 3rd attempt
        return callback(mockTx);
      });

      const result = await createBookingWithLock(mockBookingData);

      expect(attemptCount).toBe(3);
      expect(result).toEqual(mockCreatedAppointment);
    });

    it('should throw after exhausting max retries on P2034', async () => {
      const p2034Error = new Prisma.PrismaClientKnownRequestError('Write conflict', {
        code: 'P2034',
        clientVersion: '5.0.0',
      });

      vi.mocked(prisma.$transaction).mockRejectedValue(p2034Error);

      await expect(createBookingWithLock(mockBookingData)).rejects.toThrow(
        Prisma.PrismaClientKnownRequestError
      );

      // Should have tried 5 times
      expect(prisma.$transaction).toHaveBeenCalledTimes(5);
    });

    it('should throw immediately on non-P2034 errors without retry', async () => {
      const otherError = new Error('Database connection failed');

      vi.mocked(prisma.$transaction).mockRejectedValue(otherError);

      await expect(createBookingWithLock(mockBookingData)).rejects.toThrow(
        'Database connection failed'
      );

      // Should only try once
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should throw BookingConflictError immediately without retry', async () => {
      const mockTx = createMockTx([{ id: 'conflict' }]);

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      await expect(createBookingWithLock(mockBookingData)).rejects.toThrow(
        BookingConflictError
      );

      // Should only try once (conflict is not retryable)
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should use correct transaction options', async () => {
      const mockTx = createMockTx([]);

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      await createBookingWithLock(mockBookingData);

      expect(prisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 10000,
          timeout: 30000,
        })
      );
    });

    it('should include appointment with related data', async () => {
      const mockTx = createMockTx([]);

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      await createBookingWithLock(mockBookingData);

      expect(mockTx.appointment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            client: expect.objectContaining({
              select: expect.objectContaining({
                firstName: true,
                lastName: true,
                email: true,
              }),
            }),
            staff: expect.objectContaining({
              select: expect.objectContaining({
                firstName: true,
                lastName: true,
              }),
            }),
            service: expect.objectContaining({
              select: expect.objectContaining({
                name: true,
              }),
            }),
            location: expect.any(Object),
          }),
        })
      );
    });
  });
});
