import { prisma } from '@peacase/database';

/**
 * Represents an available time slot for booking.
 */
export interface AvailableSlot {
  time: string;        // "HH:mm" format
  staffId: string;
  staffName: string;
  startTime: Date;     // Full datetime for booking
  endTime: Date;       // Full datetime for booking
}

/**
 * Parameters for calculating available slots.
 */
export interface AvailabilityParams {
  salonId: string;
  locationId?: string;
  serviceId: string;
  staffId?: string;
  date: Date;
}

/**
 * Parameters for finding alternative slots (extends availability params).
 */
export interface AlternativeSlotParams extends AvailabilityParams {
  excludeTime: Date;
  limit?: number;
}

/**
 * Staff member with availability info for slot calculation.
 */
interface StaffWithAvailability {
  id: string;
  firstName: string;
  lastName: string;
  staffAvailability: Array<{
    dayOfWeek: number;
    isAvailable: boolean;
    startTime: string;
    endTime: string;
    locationId: string | null;
  }>;
  timeOff: Array<{
    startDate: Date;
    endDate: Date;
  }>;
}

/**
 * Appointment info for conflict checking.
 */
interface AppointmentForConflict {
  staffId: string;
  startTime: Date;
  endTime: Date;
}

/**
 * Business hours for a day.
 */
interface BusinessHours {
  open: string;
  close: string;
}

/**
 * Check if a time slot conflicts with any existing appointments.
 *
 * @param staffId - Staff member ID to check
 * @param slotStart - Start time of proposed slot
 * @param slotEnd - End time of proposed slot
 * @param appointments - Array of existing appointments
 * @returns True if there is a conflict
 */
export function hasConflict(
  staffId: string,
  slotStart: Date,
  slotEnd: Date,
  appointments: AppointmentForConflict[]
): boolean {
  return appointments.some((apt) => {
    if (apt.staffId !== staffId) return false;
    const aptStart = new Date(apt.startTime);
    const aptEnd = new Date(apt.endTime);
    return (
      // Slot starts during appointment
      (slotStart >= aptStart && slotStart < aptEnd) ||
      // Slot ends during appointment
      (slotEnd > aptStart && slotEnd <= aptEnd) ||
      // Slot completely contains appointment
      (slotStart <= aptStart && slotEnd >= aptEnd)
    );
  });
}

/**
 * Get business hours for a specific day.
 *
 * @param locationId - Location ID to check (optional)
 * @param dayOfWeek - Day of week (0 = Sunday)
 * @returns Business hours or null if closed
 */
async function getBusinessHours(
  locationId: string | undefined,
  dayOfWeek: number
): Promise<BusinessHours | null> {
  // Try location-specific hours first
  if (locationId) {
    const locationHoursRecord = await prisma.locationHours.findUnique({
      where: {
        locationId_dayOfWeek: {
          locationId: locationId,
          dayOfWeek,
        },
      },
    });

    if (locationHoursRecord?.isClosed) {
      return null;
    }

    if (locationHoursRecord?.openTime && locationHoursRecord?.closeTime) {
      return {
        open: locationHoursRecord.openTime,
        close: locationHoursRecord.closeTime,
      };
    }
  }

  // Default hours if not set
  const defaultHours: Record<number, BusinessHours | null> = {
    0: null, // Sunday closed
    1: { open: '09:00', close: '17:00' },
    2: { open: '09:00', close: '17:00' },
    3: { open: '09:00', close: '17:00' },
    4: { open: '09:00', close: '17:00' },
    5: { open: '09:00', close: '17:00' },
    6: { open: '10:00', close: '16:00' },
  };
  return defaultHours[dayOfWeek];
}

/**
 * Get staff working hours for a specific day.
 *
 * @param staffMember - Staff member with availability data
 * @param businessHours - Default business hours to fall back to
 * @returns Staff working hours or null if not working
 */
function getStaffHours(
  staffMember: StaffWithAvailability,
  businessHours: BusinessHours | null
): { start: string; end: string } | null {
  // Check if staff is on time off
  if (staffMember.timeOff.length > 0) {
    return null;
  }

  // Get staff availability for this day
  const availability = staffMember.staffAvailability.find((a) => a.isAvailable);
  if (availability) {
    return { start: availability.startTime, end: availability.endTime };
  }

  // No availability set - use business hours as default
  if (businessHours) {
    return { start: businessHours.open, end: businessHours.close };
  }
  return null;
}

/**
 * Get staff members who can perform a service at a location.
 *
 * @param salonId - Salon ID
 * @param serviceId - Service ID
 * @param staffId - Specific staff ID (optional)
 * @param locationId - Location ID (optional)
 * @param date - Date to check availability
 * @returns Array of staff members with availability data
 */
async function getAvailableStaff(
  salonId: string,
  serviceId: string,
  staffId: string | undefined,
  locationId: string | undefined,
  date: Date
): Promise<StaffWithAvailability[]> {
  const dayOfWeek = date.getDay();
  const dateStr = date.toISOString().split('T')[0];

  const baseStaffQuery: Record<string, unknown> = {
    salonId: salonId,
    isActive: true,
    onlineBookingEnabled: true,
    staffServices: {
      some: { serviceId: serviceId, isAvailable: true },
    },
  };

  if (staffId) {
    baseStaffQuery.id = staffId;
  }

  const staffSelect = {
    id: true,
    firstName: true,
    lastName: true,
    staffAvailability: {
      where: locationId
        ? { dayOfWeek, OR: [{ locationId: locationId }, { locationId: null }] }
        : { dayOfWeek },
    },
    timeOff: {
      where: {
        startDate: { lte: new Date(dateStr + 'T23:59:59') },
        endDate: { gte: new Date(dateStr + 'T00:00:00') },
      },
    },
  };

  let staffMembers: StaffWithAvailability[] = [];

  if (locationId && !staffId) {
    // Get staff assigned to this location
    const assignedStaff = await prisma.user.findMany({
      where: {
        ...baseStaffQuery,
        staffLocations: { some: { locationId: locationId } },
      },
      select: staffSelect,
    });

    const assignedIds = assignedStaff.map((s) => s.id);

    // Also get staff with no location assignments (available at all locations)
    const unassignedStaff = await prisma.user.findMany({
      where: {
        ...baseStaffQuery,
        staffLocations: { none: {} },
        id: { notIn: assignedIds },
      },
      select: staffSelect,
    });

    staffMembers = [...assignedStaff, ...unassignedStaff] as StaffWithAvailability[];
  } else {
    staffMembers = (await prisma.user.findMany({
      where: baseStaffQuery,
      select: staffSelect,
    })) as StaffWithAvailability[];
  }

  return staffMembers;
}

/**
 * Calculate available time slots for a given date, service, and optional staff/location.
 *
 * IMPORTANT: Slot duration always includes buffer time (durationMinutes + bufferMinutes).
 *
 * @param params - Availability parameters
 * @returns Array of available slots
 */
export async function calculateAvailableSlots(
  params: AvailabilityParams
): Promise<AvailableSlot[]> {
  const { salonId, locationId, serviceId, staffId, date } = params;

  // Get salon booking settings
  const salon = await prisma.salon.findUnique({
    where: { id: salonId },
    select: {
      bookingEnabled: true,
      bookingMinNoticeHours: true,
      bookingMaxAdvanceDays: true,
      bookingSlotInterval: true,
    },
  });

  if (!salon || !salon.bookingEnabled) {
    return [];
  }

  const now = new Date();

  // Check max advance days
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + salon.bookingMaxAdvanceDays);
  if (date > maxDate) {
    return [];
  }

  // Check if date is in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) {
    return [];
  }

  // Get service
  const service = await prisma.service.findFirst({
    where: { id: serviceId, salonId: salonId, isActive: true },
  });

  if (!service) {
    return [];
  }

  const dayOfWeek = date.getDay();
  const slotInterval = salon.bookingSlotInterval || 30;

  // Get business hours
  const businessHours = await getBusinessHours(locationId, dayOfWeek);
  if (!businessHours) {
    return [];
  }

  const [openHour, openMin] = businessHours.open.split(':').map(Number);
  const [closeHour, closeMin] = businessHours.close.split(':').map(Number);

  // Get staff members
  const staffMembers = await getAvailableStaff(
    salonId,
    serviceId,
    staffId,
    locationId,
    date
  );

  if (staffMembers.length === 0) {
    return [];
  }

  // Get existing appointments for all relevant staff
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      salonId: salonId,
      staffId: { in: staffMembers.map((s) => s.id) },
      startTime: { gte: startOfDay, lte: endOfDay },
      status: { notIn: ['cancelled'] },
    },
    select: {
      staffId: true,
      startTime: true,
      endTime: true,
    },
  });

  // Calculate minimum allowed time (respecting min notice)
  const minNoticeTime = new Date(
    now.getTime() + salon.bookingMinNoticeHours * 60 * 60 * 1000
  );

  // CRITICAL: Total time needed including buffer
  const totalDuration = service.durationMinutes + (service.bufferMinutes || 0);

  // Generate slots
  const slots: AvailableSlot[] = [];

  // Generate all possible slots
  for (let hour = openHour; hour <= closeHour; hour++) {
    for (
      let min = hour === openHour ? openMin : 0;
      min < 60;
      min += slotInterval
    ) {
      const slotTime = new Date(date);
      slotTime.setHours(hour, min, 0, 0);

      // Skip if before minimum notice
      if (slotTime < minNoticeTime) continue;

      const slotEnd = new Date(slotTime.getTime() + totalDuration * 60000);

      // Skip if would end after business hours
      const closeTime = new Date(date);
      closeTime.setHours(closeHour, closeMin, 0, 0);
      if (slotEnd > closeTime) continue;

      // Check each staff member
      for (const staffMember of staffMembers) {
        const staffHours = getStaffHours(staffMember, businessHours);
        if (!staffHours) continue;

        // Check if slot is within staff's working hours
        const [staffStartHour, staffStartMin] = staffHours.start
          .split(':')
          .map(Number);
        const [staffEndHour, staffEndMin] = staffHours.end.split(':').map(Number);
        const staffStart = new Date(date);
        staffStart.setHours(staffStartHour, staffStartMin, 0, 0);
        const staffEnd = new Date(date);
        staffEnd.setHours(staffEndHour, staffEndMin, 0, 0);

        if (slotTime < staffStart || slotEnd > staffEnd) continue;

        // Check for conflicts with existing appointments
        if (hasConflict(staffMember.id, slotTime, slotEnd, existingAppointments))
          continue;

        // Slot is available for this staff member
        slots.push({
          time: `${hour.toString().padStart(2, '0')}:${min
            .toString()
            .padStart(2, '0')}`,
          staffId: staffMember.id,
          staffName: `${staffMember.firstName} ${staffMember.lastName}`,
          startTime: new Date(slotTime),
          endTime: new Date(slotEnd),
        });
      }
    }
  }

  return slots;
}

/**
 * Find alternative time slots when the requested slot is unavailable.
 *
 * Strategy:
 * 1. First, find slots on the same day (excluding the conflicted time)
 * 2. If not enough, expand to next 7 days
 * 3. If staffId was specified, alternatives must be for the same staff
 *
 * @param params - Parameters including exclude time and limit
 * @returns Array of alternative slots (up to limit, default 3)
 */
export async function findAlternativeSlots(
  params: AlternativeSlotParams
): Promise<AvailableSlot[]> {
  const { salonId, locationId, serviceId, staffId, date, excludeTime, limit = 3 } = params;

  const alternatives: AvailableSlot[] = [];
  const excludeTimeStr = excludeTime.toISOString();

  // Search same day first
  const sameDaySlots = await calculateAvailableSlots({
    salonId,
    locationId,
    serviceId,
    staffId,
    date,
  });

  // Filter out the excluded time slot
  for (const slot of sameDaySlots) {
    if (slot.startTime.toISOString() === excludeTimeStr) continue;
    alternatives.push(slot);
    if (alternatives.length >= limit) {
      return alternatives;
    }
  }

  // If not enough, search next 7 days
  for (let dayOffset = 1; dayOffset <= 7 && alternatives.length < limit; dayOffset++) {
    const futureDate = new Date(date);
    futureDate.setDate(futureDate.getDate() + dayOffset);
    futureDate.setHours(0, 0, 0, 0);

    const futureDaySlots = await calculateAvailableSlots({
      salonId,
      locationId,
      serviceId,
      staffId,
      date: futureDate,
    });

    for (const slot of futureDaySlots) {
      alternatives.push(slot);
      if (alternatives.length >= limit) {
        return alternatives;
      }
    }
  }

  return alternatives;
}
