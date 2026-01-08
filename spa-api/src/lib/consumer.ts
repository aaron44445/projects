import { prisma } from './prisma.js';

// ============================================
// SLUG GENERATION
// ============================================

/**
 * Generate URL-friendly slug from a string
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with dashes
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
}

/**
 * Generate unique profile slug for marketplace
 */
export async function generateUniqueProfileSlug(name: string, orgId?: string): Promise<string> {
  let slug = generateSlug(name);
  let counter = 0;
  let uniqueSlug = slug;

  while (true) {
    const existing = await prisma.organization.findUnique({
      where: { profileSlug: uniqueSlug },
      select: { id: true },
    });

    // If no existing or it's the same org, use this slug
    if (!existing || (orgId && existing.id === orgId)) {
      return uniqueSlug;
    }

    // Try next variant
    counter++;
    uniqueSlug = `${slug}-${counter}`;
  }
}

// ============================================
// ADDRESS FORMATTING
// ============================================

interface AddressFields {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
}

/**
 * Format address for display
 */
export function formatAddress(org: AddressFields): string {
  const parts: string[] = [];

  if (org.address) parts.push(org.address);

  const cityStateZip: string[] = [];
  if (org.city) cityStateZip.push(org.city);
  if (org.state) cityStateZip.push(org.state);
  if (cityStateZip.length > 0 && org.zipCode) {
    cityStateZip.push(org.zipCode);
  }

  if (cityStateZip.length > 0) {
    parts.push(cityStateZip.join(', '));
  }

  if (org.country && org.country !== 'US') {
    parts.push(org.country);
  }

  return parts.join('\n');
}

// ============================================
// AVAILABILITY CALCULATIONS
// ============================================

export interface TimeSlot {
  time: string; // "09:00" format
  available: boolean;
  staffId?: string;
  staffName?: string;
}

export interface BusinessHours {
  [key: string]: { open: string; close: string } | null;
  // e.g., { "monday": { "open": "09:00", "close": "17:00" }, "sunday": null }
}

/**
 * Get day of week as lowercase string
 */
function getDayOfWeek(date: Date): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

/**
 * Parse time string to minutes since midnight
 */
function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Calculate available time slots for a given date, service, and optional staff
 */
export async function getAvailableSlots(
  orgId: string,
  date: Date,
  serviceId: string,
  staffId?: string
): Promise<TimeSlot[]> {
  // Get organization with business hours
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { businessHours: true },
  });

  if (!org) return [];

  // Get service duration
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { durationMinutes: true },
  });

  if (!service) return [];

  const businessHours = org.businessHours as BusinessHours | null;
  const dayOfWeek = getDayOfWeek(date);
  const dayHours = businessHours?.[dayOfWeek];

  // Spa closed on this day
  if (!dayHours) return [];

  const openMinutes = parseTimeToMinutes(dayHours.open);
  const closeMinutes = parseTimeToMinutes(dayHours.close);
  const serviceDuration = service.durationMinutes;

  // Get all staff who can perform this service (or specific staff if provided)
  const staffQuery: { organizationId: string; isActive: boolean; id?: string } = {
    organizationId: orgId,
    isActive: true,
  };

  if (staffId) {
    staffQuery.id = staffId;
  }

  const staffMembers = await prisma.staff.findMany({
    where: {
      ...staffQuery,
      staffServices: {
        some: { serviceId },
      },
    },
    select: { id: true, name: true },
  });

  if (staffMembers.length === 0) return [];

  // Get all appointments for this date
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const appointments = await prisma.appointment.findMany({
    where: {
      organizationId: orgId,
      staffId: staffId ? staffId : { in: staffMembers.map((s) => s.id) },
      startTime: { gte: startOfDay, lte: endOfDay },
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
    select: {
      staffId: true,
      startTime: true,
      endTime: true,
    },
  });

  // Also check bookings (for marketplace)
  const bookings = await prisma.booking.findMany({
    where: {
      organizationId: orgId,
      staffId: staffId ? staffId : { in: staffMembers.map((s) => s.id) },
      dateTime: { gte: startOfDay, lte: endOfDay },
      status: { in: ['pending', 'confirmed'] },
    },
    select: {
      staffId: true,
      dateTime: true,
      duration: true,
    },
  });

  // Build map of staff busy times
  const staffBusyTimes: Map<string, Array<{ start: number; end: number }>> = new Map();

  for (const staff of staffMembers) {
    staffBusyTimes.set(staff.id, []);
  }

  for (const apt of appointments) {
    const times = staffBusyTimes.get(apt.staffId);
    if (times) {
      const startMin = apt.startTime.getHours() * 60 + apt.startTime.getMinutes();
      const endMin = apt.endTime.getHours() * 60 + apt.endTime.getMinutes();
      times.push({ start: startMin, end: endMin });
    }
  }

  for (const booking of bookings) {
    if (!booking.staffId) continue;
    const times = staffBusyTimes.get(booking.staffId);
    if (times) {
      const startMin = booking.dateTime.getHours() * 60 + booking.dateTime.getMinutes();
      const endMin = startMin + booking.duration;
      times.push({ start: startMin, end: endMin });
    }
  }

  // Generate 30-minute slots
  const slots: TimeSlot[] = [];
  const slotInterval = 30;

  for (let slotStart = openMinutes; slotStart + serviceDuration <= closeMinutes; slotStart += slotInterval) {
    const slotEnd = slotStart + serviceDuration;
    const time = minutesToTime(slotStart);

    // Find available staff for this slot
    let availableStaff: { id: string; name: string } | null = null;

    for (const staff of staffMembers) {
      const busyTimes = staffBusyTimes.get(staff.id) || [];
      const isAvailable = !busyTimes.some(
        (busy) => slotStart < busy.end && slotEnd > busy.start
      );

      if (isAvailable) {
        availableStaff = staff;
        break;
      }
    }

    slots.push({
      time,
      available: availableStaff !== null,
      staffId: availableStaff?.id,
      staffName: availableStaff?.name,
    });
  }

  return slots;
}

/**
 * Check if a specific slot is available (for race condition prevention)
 */
export async function isSlotAvailable(
  orgId: string,
  staffId: string,
  dateTime: Date,
  duration: number
): Promise<boolean> {
  const endTime = new Date(dateTime.getTime() + duration * 60 * 1000);

  // Check appointments
  const conflictingAppointment = await prisma.appointment.findFirst({
    where: {
      organizationId: orgId,
      staffId,
      status: { in: ['PENDING', 'CONFIRMED'] },
      OR: [
        {
          AND: [
            { startTime: { lte: dateTime } },
            { endTime: { gt: dateTime } },
          ],
        },
        {
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gte: endTime } },
          ],
        },
        {
          AND: [
            { startTime: { gte: dateTime } },
            { endTime: { lte: endTime } },
          ],
        },
      ],
    },
  });

  if (conflictingAppointment) return false;

  // Check bookings
  const conflictingBooking = await prisma.booking.findFirst({
    where: {
      organizationId: orgId,
      staffId,
      status: { in: ['pending', 'confirmed'] },
      AND: [
        { dateTime: { lt: endTime } },
        {
          dateTime: {
            gte: new Date(dateTime.getTime() - duration * 60 * 1000),
          },
        },
      ],
    },
  });

  return !conflictingBooking;
}

// ============================================
// RATING CALCULATIONS
// ============================================

/**
 * Update spa's average rating and review count
 */
export async function updateSpaRating(orgId: string): Promise<void> {
  const result = await prisma.review.aggregate({
    where: {
      organizationId: orgId,
      status: 'published',
    },
    _avg: { rating: true },
    _count: { id: true },
  });

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      averageRating: result._avg.rating || 0,
      reviewCount: result._count.id,
    },
  });
}

// ============================================
// CONFIRMATION NUMBER
// ============================================

/**
 * Generate unique confirmation number for bookings
 */
export function generateConfirmationNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SPA-${timestamp}-${random}`;
}

// ============================================
// CITY/CATEGORY SLUGS
// ============================================

/**
 * Generate city slug from city and state
 */
export function generateCitySlug(city: string, state: string): string {
  return `${generateSlug(city)}-${state.toLowerCase()}`;
}

/**
 * Generate category slug
 */
export function generateCategorySlug(category: string): string {
  return generateSlug(category);
}
