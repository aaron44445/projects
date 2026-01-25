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
}

/**
 * Creates a booking with pessimistic locking to prevent double-bookings.
 *
 * LOCKING STRATEGY:
 * 1. Uses RepeatableRead isolation level to prevent phantom reads
 * 2. Uses SELECT FOR UPDATE SKIP LOCKED to acquire row-level locks
 *    - FOR UPDATE: Blocks other transactions from modifying the rows
 *    - SKIP LOCKED: Immediately returns if rows are locked (avoids waiting)
 * 3. If any overlapping appointments are found (locked or not), rejects the booking
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

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const appointment = await prisma.$transaction(
        async (tx) => {
          // Use raw SQL with FOR UPDATE SKIP LOCKED to check for conflicts
          // This acquires exclusive locks on any overlapping appointments,
          // preventing other transactions from booking the same slot
          const conflictingAppointments = await tx.$queryRaw<{ id: string }[]>`
            SELECT id FROM "Appointment"
            WHERE "staffId" = ${data.staffId}
            AND status NOT IN ('cancelled')
            AND (
              ("startTime" <= ${data.startTime}::timestamp AND "endTime" > ${data.startTime}::timestamp)
              OR ("startTime" < ${data.endTime}::timestamp AND "endTime" >= ${data.endTime}::timestamp)
              OR ("startTime" >= ${data.startTime}::timestamp AND "endTime" <= ${data.endTime}::timestamp)
            )
            FOR UPDATE SKIP LOCKED
          `;

          if (conflictingAppointments.length > 0) {
            throw new BookingConflictError();
          }

          // No conflicts found - create the appointment
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
            },
            include: {
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
          isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
          maxWait: 5000, // Max time to wait for a connection
          timeout: 10000, // Max time for the transaction to complete
        }
      );

      return appointment;
    } catch (error) {
      // Re-throw BookingConflictError immediately (not a transient error)
      if (error instanceof BookingConflictError) {
        throw error;
      }

      // Check for Prisma transaction write conflict (P2034)
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'
      ) {
        lastError = error;

        // Calculate exponential backoff delay
        const delayMs = BASE_DELAY_MS * Math.pow(2, attempt - 1);

        console.warn(
          `[Booking] P2034 write conflict on attempt ${attempt}/${MAX_RETRIES}, retrying in ${delayMs}ms...`
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
