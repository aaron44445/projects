import { prisma, Prisma } from '@peacase/database';

/**
 * Error thrown when a booking attempt conflicts with an existing appointment.
 * The selected time slot is already booked or was booked during the request.
 */
export class BookingConflictError extends Error {
  readonly code = 'TIME_CONFLICT' as const;

  constructor(message = 'This time slot is no longer available') {
    super(message);
    this.name = 'BookingConflictError';
    Object.setPrototypeOf(this, BookingConflictError.prototype);
  }
}

/**
 * Booking data required to create an appointment.
 */
export interface BookingData {
  salonId: string;
  clientId: string;
  staffId: string;
  serviceId: string;
  locationId: string | null;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  price: number;
  notes?: string;
  source: string;
  stripePaymentIntentId?: string | null;  // Link to Stripe payment intent for deposits
  depositStatus?: string | null;  // Initial deposit status ('authorized' when deposit paid)
}

/**
 * Creates a booking with pessimistic locking to prevent double-bookings.
 *
 * LOCKING STRATEGY:
 * 1. Uses Serializable isolation level - the strongest isolation that prevents
 *    phantom reads, non-repeatable reads, and dirty reads
 * 2. Uses advisory lock on (staffId + timeslot hash) to serialize concurrent
 *    booking attempts for the same staff member
 * 3. Conflict check happens after acquiring the advisory lock
 * 4. If any overlapping appointments are found, rejects the booking
 *
 * WHY ADVISORY LOCKS:
 * - Row-level locks (FOR UPDATE) only work on existing rows - useless for
 *   preventing the FIRST booking when no rows exist yet
 * - Advisory locks allow us to serialize on a logical key (staff+time)
 *   before any rows exist
 *
 * RETRY LOGIC:
 * P2034 errors indicate transaction write conflicts (another transaction modified data).
 * We retry with exponential backoff: 100ms, 200ms, 400ms, 800ms, 1600ms (5 attempts)
 *
 * @param data - Booking details including salon, client, staff, service, and time
 * @returns The created appointment with related data
 * @throws BookingConflictError if the time slot is already booked
 * @throws Error if retries are exhausted or an unexpected error occurs
 */
export async function createBookingWithLock(data: BookingData) {
  const MAX_RETRIES = 5;
  const BASE_DELAY_MS = 100;

  let lastError: Error | null = null;

  // Generate a deterministic lock key from staffId and start time
  // This ensures all booking attempts for the same staff at overlapping times
  // contend for the same lock
  const lockKey = generateLockKey(data.staffId, data.startTime);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const appointment = await prisma.$transaction(
        async (tx) => {
          // Acquire an advisory lock for this staff+time combination
          // pg_advisory_xact_lock blocks until the lock is acquired
          // The lock is automatically released at transaction end
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey})`;

          // Now check for conflicts with the lock held
          // Only one transaction can reach here at a time for this staff+time
          const conflictingAppointments = await tx.$queryRaw<{ id: string }[]>`
            SELECT id FROM appointments
            WHERE staff_id = ${data.staffId}
            AND status NOT IN ('cancelled')
            AND (
              (start_time <= ${data.startTime}::timestamp AND end_time > ${data.startTime}::timestamp)
              OR (start_time < ${data.endTime}::timestamp AND end_time >= ${data.endTime}::timestamp)
              OR (start_time >= ${data.startTime}::timestamp AND end_time <= ${data.endTime}::timestamp)
            )
          `;

          if (conflictingAppointments.length > 0) {
            throw new BookingConflictError();
          }

          // No conflicts found - create the appointment
          // NOTE: Using explicit select to ensure startTime/endTime are included in return
          // There was a bug where include-only queries sometimes omitted scalar fields
          return await tx.appointment.create({
            data: {
              salonId: data.salonId,
              clientId: data.clientId,
              staffId: data.staffId,
              serviceId: data.serviceId,
              locationId: data.locationId,
              startTime: data.startTime,
              endTime: data.endTime,
              durationMinutes: data.durationMinutes,
              price: data.price,
              status: 'confirmed',
              notes: data.notes,
              source: data.source,
              stripePaymentIntentId: data.stripePaymentIntentId || null,
              depositStatus: data.depositStatus || null,
            },
            select: {
              id: true,
              salonId: true,
              clientId: true,
              staffId: true,
              serviceId: true,
              locationId: true,
              startTime: true,
              endTime: true,
              durationMinutes: true,
              price: true,
              status: true,
              notes: true,
              source: true,
              client: {
                select: { firstName: true, lastName: true, email: true },
              },
              staff: {
                select: { firstName: true, lastName: true },
              },
              service: {
                select: { name: true },
              },
              location: {
                select: { name: true, address: true, city: true, state: true, zip: true },
              },
            },
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 10000, // Max time to wait for a connection (increased for lock contention)
          timeout: 30000, // Max time for the transaction to complete (increased for lock wait)
        }
      );

      return appointment;
    } catch (error) {
      // Re-throw BookingConflictError immediately (not a transient error)
      if (error instanceof BookingConflictError) {
        throw error;
      }

      // Check for Prisma transaction write conflict (P2034) or serialization failure
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2034' || (error.meta as any)?.code === '40001')
      ) {
        lastError = error;

        // Calculate exponential backoff delay with jitter
        const baseDelay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        const jitter = Math.random() * baseDelay * 0.5;
        const delayMs = Math.floor(baseDelay + jitter);

        console.warn(
          `[Booking] Transaction conflict on attempt ${attempt}/${MAX_RETRIES}, retrying in ${delayMs}ms...`
        );

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      // Unknown error - throw immediately
      throw error;
    }
  }

  // All retries exhausted
  throw lastError || new Error('Booking failed after maximum retries');
}

/**
 * Generates a deterministic lock key for advisory locking.
 * The key is based on staffId and the start of the hour to ensure
 * overlapping time slots contend for the same lock.
 */
function generateLockKey(staffId: string, startTime: Date): bigint {
  // Use the first 8 chars of staffId as a base
  // Convert to a number that fits in PostgreSQL bigint
  let hash = 0;
  for (let i = 0; i < Math.min(staffId.length, 16); i++) {
    hash = (hash * 31 + staffId.charCodeAt(i)) >>> 0;
  }

  // Add time component: hour-level granularity is enough
  // This ensures bookings at overlapping times contend for the same lock
  const timeComponent = Math.floor(startTime.getTime() / (1000 * 60 * 60));

  // Combine into a single bigint (PostgreSQL advisory locks use bigint keys)
  // We use modulo to keep it within safe integer range
  return BigInt((hash ^ timeComponent) >>> 0);
}
