import { Router, Request, Response } from 'express';
import { prisma } from '@peacase/database';
import { sendEmail, appointmentConfirmationEmail } from '../services/email.js';
import { sendSms, appointmentConfirmationSms } from '../services/sms.js';
import { asyncHandler } from '../lib/errorUtils.js';

const router = Router();

// ============================================
// GET /api/v1/public/:slug/salon
// Get salon public info (name, logo, branding)
// ============================================
router.get('/:slug/salon', asyncHandler(async (req: Request, res: Response) => {
  const salon = await prisma.salon.findUnique({
    where: { slug: req.params.slug },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      zip: true,
      timezone: true,
      // Widget customization
      widgetPrimaryColor: true,
      widgetAccentColor: true,
      widgetButtonStyle: true,
      widgetFontFamily: true,
      // Booking settings
      bookingEnabled: true,
      bookingMinNoticeHours: true,
      bookingMaxAdvanceDays: true,
      bookingSlotInterval: true,
      bookingRequirePhone: true,
      bookingRequireEmail: true,
    },
  });

  if (!salon) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Salon not found',
      },
    });
  }

  res.json({
    success: true,
    data: {
      id: salon.id,
      name: salon.name,
      slug: salon.slug,
      logoUrl: salon.logoUrl,
      phone: salon.phone,
      address: salon.address,
      city: salon.city,
      state: salon.state,
      zip: salon.zip,
      timezone: salon.timezone,
      bookingEnabled: salon.bookingEnabled,
      widget: {
        primaryColor: salon.widgetPrimaryColor,
        accentColor: salon.widgetAccentColor,
        buttonStyle: salon.widgetButtonStyle,
        fontFamily: salon.widgetFontFamily,
      },
      bookingSettings: {
        minNoticeHours: salon.bookingMinNoticeHours,
        maxAdvanceDays: salon.bookingMaxAdvanceDays,
        slotInterval: salon.bookingSlotInterval,
        requirePhone: salon.bookingRequirePhone,
        requireEmail: salon.bookingRequireEmail,
      },
    },
  });
}));

// ============================================
// GET /api/v1/public/:slug/locations
// Get salon's active locations
// ============================================
router.get('/:slug/locations', asyncHandler(async (req: Request, res: Response) => {
  const salon = await prisma.salon.findUnique({
    where: { slug: req.params.slug },
    select: { id: true },
  });

  if (!salon) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Salon not found',
      },
    });
  }

  const locations = await prisma.location.findMany({
    where: {
      salonId: salon.id,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
      state: true,
      zip: true,
      phone: true,
      timezone: true,
      hours: true,
      isPrimary: true,
    },
    orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
  });

  res.json({
    success: true,
    data: locations,
  });
}));

// ============================================
// GET /api/v1/public/:slug/services
// Get salon's active services (optionally filtered by location)
// ============================================
router.get('/:slug/services', asyncHandler(async (req: Request, res: Response) => {
  const { locationId } = req.query;
  const salon = await prisma.salon.findUnique({
    where: { slug: req.params.slug },
    select: { id: true },
  });

  if (!salon) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Salon not found',
      },
    });
  }

  const services = await prisma.service.findMany({
    where: {
      salonId: salon.id,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
      durationMinutes: true,
      price: true,
      color: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      serviceLocations: locationId ? {
        where: { locationId: locationId as string },
      } : false,
    },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  });

  // Filter out disabled services for this location and apply overrides
  const filteredServices = services.filter(service => {
    if (!locationId) return true;
    const locationSettings = (service as any).serviceLocations?.[0];
    // If no settings exist, service is enabled by default
    if (!locationSettings) return true;
    return locationSettings.isEnabled;
  });

  // Group by category
  const categorized = filteredServices.reduce((acc, service) => {
    const categoryName = service.category?.name || 'Other Services';
    const categoryId = service.category?.id || 'uncategorized';
    const locationSettings = locationId ? (service as any).serviceLocations?.[0] : null;

    if (!acc[categoryId]) {
      acc[categoryId] = {
        id: categoryId,
        name: categoryName,
        services: [],
      };
    }

    acc[categoryId].services.push({
      id: service.id,
      name: service.name,
      description: service.description,
      durationMinutes: locationSettings?.durationOverride || service.durationMinutes,
      price: locationSettings?.priceOverride ? Number(locationSettings.priceOverride) : service.price,
      color: service.color,
    });

    return acc;
  }, {} as Record<string, { id: string; name: string; services: Array<{ id: string; name: string; description: string | null; durationMinutes: number; price: number; color: string }> }>);

  res.json({
    success: true,
    data: Object.values(categorized),
  });
}));

// ============================================
// GET /api/v1/public/:slug/staff
// Get salon's bookable staff (optionally filtered by location and/or service)
// ============================================
router.get('/:slug/staff', asyncHandler(async (req: Request, res: Response) => {
  const { serviceId, locationId } = req.query;

  const salon = await prisma.salon.findUnique({
    where: { slug: req.params.slug },
    select: { id: true },
  });

  if (!salon) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Salon not found',
      },
    });
  }

  const staff = await prisma.user.findMany({
    where: {
      salonId: salon.id,
      isActive: true,
      // If serviceId provided, only get staff who can perform that service
      ...(serviceId && {
        staffServices: {
          some: {
            serviceId: serviceId as string,
            isAvailable: true,
          },
        },
      }),
      // If locationId provided, only get staff assigned to that location
      ...(locationId && {
        staffLocations: {
          some: {
            locationId: locationId as string,
          },
        },
      }),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      staffServices: {
        select: {
          serviceId: true,
        },
      },
      staffLocations: locationId ? {
        where: { locationId: locationId as string },
        select: { isPrimary: true },
      } : false,
    },
    orderBy: { firstName: 'asc' },
  });

  res.json({
    success: true,
    data: staff.map((s) => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      firstName: s.firstName,
      lastName: s.lastName,
      avatarUrl: s.avatarUrl,
      serviceIds: s.staffServices.map((ss) => ss.serviceId),
      isPrimaryForLocation: locationId ? (s as any).staffLocations?.[0]?.isPrimary : undefined,
    })),
  });
}));

// ============================================
// GET /api/v1/public/:slug/availability
// Get available time slots with comprehensive checks
// ============================================
router.get('/:slug/availability', asyncHandler(async (req: Request, res: Response) => {
  const { date, serviceId, staffId, locationId } = req.query;

  if (!date || !serviceId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_PARAMS',
        message: 'Date and serviceId are required',
      },
    });
  }

  const salon = await prisma.salon.findUnique({
    where: { slug: req.params.slug },
    select: {
      id: true,
      bookingEnabled: true,
      bookingMinNoticeHours: true,
      bookingMaxAdvanceDays: true,
      bookingSlotInterval: true,
    },
  });

  if (!salon) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Salon not found' },
    });
  }

  // Check if booking is enabled
  if (!salon.bookingEnabled) {
    return res.json({ success: true, data: [] });
  }

  const requestedDate = new Date(date as string);
  const now = new Date();

  // Check max advance days
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + salon.bookingMaxAdvanceDays);
  if (requestedDate > maxDate) {
    return res.json({ success: true, data: [] });
  }

  // Check if date is in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (requestedDate < today) {
    return res.json({ success: true, data: [] });
  }

  const service = await prisma.service.findFirst({
    where: { id: serviceId as string, salonId: salon.id, isActive: true },
  });

  if (!service) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Service not found' },
    });
  }

  const dayOfWeek = requestedDate.getDay();
  const slotInterval = salon.bookingSlotInterval || 30;

  // Get location hours if locationId provided
  let businessHours: { open: string; close: string } | null = null;
  if (locationId) {
    const locationHoursRecord = await prisma.locationHours.findUnique({
      where: {
        locationId_dayOfWeek: {
          locationId: locationId as string,
          dayOfWeek,
        },
      },
    });

    if (locationHoursRecord?.isClosed) {
      return res.json({ success: true, data: [] });
    }

    if (locationHoursRecord?.openTime && locationHoursRecord?.closeTime) {
      businessHours = {
        open: locationHoursRecord.openTime,
        close: locationHoursRecord.closeTime,
      };
    }
  }

  // Default hours if not set
  if (!businessHours) {
    const defaultHours: Record<number, { open: string; close: string } | null> = {
      0: null, // Sunday closed
      1: { open: '09:00', close: '17:00' },
      2: { open: '09:00', close: '17:00' },
      3: { open: '09:00', close: '17:00' },
      4: { open: '09:00', close: '17:00' },
      5: { open: '09:00', close: '17:00' },
      6: { open: '10:00', close: '16:00' },
    };
    businessHours = defaultHours[dayOfWeek];
  }

  if (!businessHours) {
    return res.json({ success: true, data: [] });
  }

  const [openHour, openMin] = businessHours.open.split(':').map(Number);
  const [closeHour, closeMin] = businessHours.close.split(':').map(Number);

  // Get staff who can perform this service
  const staffQuery: Record<string, unknown> = {
    salonId: salon.id,
    isActive: true,
    staffServices: {
      some: { serviceId: serviceId as string, isAvailable: true },
    },
  };

  if (staffId) {
    staffQuery.id = staffId as string;
  }

  if (locationId) {
    staffQuery.staffLocations = {
      some: { locationId: locationId as string },
    };
  }

  const staffMembers = await prisma.user.findMany({
    where: staffQuery,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      staffAvailability: {
        where: locationId
          ? { dayOfWeek, OR: [{ locationId: locationId as string }, { locationId: null }] }
          : { dayOfWeek },
      },
      timeOff: {
        where: {
          startDate: { lte: new Date(date as string + 'T23:59:59') },
          endDate: { gte: new Date(date as string + 'T00:00:00') },
        },
      },
    },
  });

  if (staffMembers.length === 0) {
    return res.json({ success: true, data: [] });
  }

  // Get existing appointments for all relevant staff
  const startOfDay = new Date(date as string);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date as string);
  endOfDay.setHours(23, 59, 59, 999);

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      salonId: salon.id,
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
  const minNoticeTime = new Date(now.getTime() + salon.bookingMinNoticeHours * 60 * 60 * 1000);

  // Total time needed including buffer
  const totalDuration = service.durationMinutes + (service.bufferMinutes || 0);

  // Generate slots
  const slots: Array<{ time: string; staffId: string; staffName: string }> = [];

  // Helper to check if slot has conflict
  const hasConflict = (staffMemberId: string, slotStart: Date, slotEnd: Date) => {
    return existingAppointments.some((apt) => {
      if (apt.staffId !== staffMemberId) return false;
      const aptStart = new Date(apt.startTime);
      const aptEnd = new Date(apt.endTime);
      return (
        (slotStart >= aptStart && slotStart < aptEnd) ||
        (slotEnd > aptStart && slotEnd <= aptEnd) ||
        (slotStart <= aptStart && slotEnd >= aptEnd)
      );
    });
  };

  // Helper to check staff availability for day
  const getStaffHours = (staffMember: typeof staffMembers[0]): { start: string; end: string } | null => {
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
  };

  // Generate all possible slots
  for (let hour = openHour; hour <= closeHour; hour++) {
    for (let min = (hour === openHour ? openMin : 0); min < 60; min += slotInterval) {
      const slotTime = new Date(requestedDate);
      slotTime.setHours(hour, min, 0, 0);

      // Skip if before minimum notice
      if (slotTime < minNoticeTime) continue;

      const slotEnd = new Date(slotTime.getTime() + totalDuration * 60000);

      // Skip if would end after business hours
      const closeTime = new Date(requestedDate);
      closeTime.setHours(closeHour, closeMin, 0, 0);
      if (slotEnd > closeTime) continue;

      // Check each staff member
      for (const staffMember of staffMembers) {
        const staffHours = getStaffHours(staffMember);
        if (!staffHours) continue;

        // Check if slot is within staff's working hours
        const [staffStartHour, staffStartMin] = staffHours.start.split(':').map(Number);
        const [staffEndHour, staffEndMin] = staffHours.end.split(':').map(Number);
        const staffStart = new Date(requestedDate);
        staffStart.setHours(staffStartHour, staffStartMin, 0, 0);
        const staffEnd = new Date(requestedDate);
        staffEnd.setHours(staffEndHour, staffEndMin, 0, 0);

        if (slotTime < staffStart || slotEnd > staffEnd) continue;

        // Check for conflicts with existing appointments
        if (hasConflict(staffMember.id, slotTime, slotEnd)) continue;

        // Slot is available for this staff member
        slots.push({
          time: `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
          staffId: staffMember.id,
          staffName: `${staffMember.firstName} ${staffMember.lastName}`,
        });
      }
    }
  }

  // Deduplicate by time if not filtering by specific staff
  // Return unique times with first available staff
  const uniqueSlots = staffId
    ? slots
    : Object.values(
        slots.reduce(
          (acc, slot) => {
            if (!acc[slot.time]) acc[slot.time] = slot;
            return acc;
          },
          {} as Record<string, typeof slots[0]>
        )
      );

  res.json({
    success: true,
    data: uniqueSlots.sort((a, b) => a.time.localeCompare(b.time)),
  });
}));

// ============================================
// GET /api/v1/public/:slug/soonest-available
// Find soonest available slot across all locations for a service
// ============================================
router.get('/:slug/soonest-available', asyncHandler(async (req: Request, res: Response) => {
  const { serviceId } = req.query;

  if (!serviceId) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_PARAMS', message: 'serviceId is required' },
    });
  }

  const salon = await prisma.salon.findUnique({
    where: { slug: req.params.slug },
    select: { id: true },
  });

  if (!salon) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Salon not found' },
    });
  }

  const service = await prisma.service.findFirst({
    where: { id: serviceId as string, salonId: salon.id, isActive: true },
  });

  if (!service) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Service not found' },
    });
  }

  const locations = await prisma.location.findMany({
    where: { salonId: salon.id, isActive: true },
    select: { id: true, name: true, address: true, city: true, state: true },
  });

  const results: Array<{
    locationId: string;
    locationName: string;
    address: string;
    date: string;
    time: string;
  }> = [];

  // Check next 14 days for availability at each location
  for (const location of locations) {
    // Get staff available at this location who can do this service
    const availableStaff = await prisma.user.findMany({
      where: {
        salonId: salon.id,
        isActive: true,
        staffServices: { some: { serviceId: serviceId as string, isAvailable: true } },
        staffLocations: { some: { locationId: location.id } },
      },
      select: { id: true },
    });

    if (availableStaff.length === 0) continue;

    let foundForLocation = false;
    for (let dayOffset = 0; dayOffset < 14 && !foundForLocation; dayOffset++) {
      const checkDate = new Date();
      checkDate.setDate(checkDate.getDate() + dayOffset);
      const dayOfWeek = checkDate.getDay();
      const dateStr = checkDate.toISOString().split('T')[0];

      // Check location hours
      const locationHours = await prisma.locationHours.findUnique({
        where: { locationId_dayOfWeek: { locationId: location.id, dayOfWeek } },
      });

      if (locationHours?.isClosed || !locationHours?.openTime) continue;

      const [openHour, openMin] = locationHours.openTime.split(':').map(Number);
      const [closeHour, closeMin] = locationHours.closeTime!.split(':').map(Number);

      // Check for first available slot
      for (let hour = openHour; hour < closeHour && !foundForLocation; hour++) {
        for (let min = 0; min < 60 && !foundForLocation; min += 30) {
          const slotTime = new Date(checkDate);
          slotTime.setHours(hour, min, 0, 0);

          // Skip past times
          if (slotTime <= new Date()) continue;

          const slotEnd = new Date(slotTime.getTime() + service.durationMinutes * 60000);

          // Check if any staff is available
          for (const staff of availableStaff) {
            const conflict = await prisma.appointment.findFirst({
              where: {
                staffId: staff.id,
                status: { notIn: ['cancelled'] },
                OR: [
                  { AND: [{ startTime: { lte: slotTime } }, { endTime: { gt: slotTime } }] },
                  { AND: [{ startTime: { lt: slotEnd } }, { endTime: { gte: slotEnd } }] },
                  { AND: [{ startTime: { gte: slotTime } }, { endTime: { lte: slotEnd } }] },
                ],
              },
            });

            if (!conflict) {
              const address = [location.address, location.city, location.state].filter(Boolean).join(', ');
              results.push({
                locationId: location.id,
                locationName: location.name,
                address,
                date: dateStr,
                time: `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
              });
              foundForLocation = true;
              break;
            }
          }
        }
      }
    }
  }

  res.json({
    success: true,
    data: results.sort((a, b) =>
      new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()
    ),
  });
}));

// ============================================
// POST /api/v1/public/:slug/book
// Create a booking (creates client if needed)
// ============================================
router.post('/:slug/book', asyncHandler(async (req: Request, res: Response) => {
  const {
    serviceId,
    staffId,
    locationId,
    startTime,
    firstName,
    lastName,
    email,
    phone,
    notes,
    optInReminders = true,
  } = req.body;

  // Validate required fields
  if (!serviceId || !startTime || !firstName || !lastName || !email) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_FIELDS',
        message: 'Service, start time, name, and email are required',
      },
    });
  }

  const salon = await prisma.salon.findUnique({
    where: { slug: req.params.slug },
  });

  if (!salon) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Salon not found',
      },
    });
  }

  // Get service
  const service = await prisma.service.findFirst({
    where: { id: serviceId, salonId: salon.id, isActive: true },
  });

  if (!service) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_SERVICE',
        message: 'Service not found',
      },
    });
  }

  // Determine staff member
  let assignedStaffId = staffId;

  if (!assignedStaffId) {
    // Find first available staff member for this service at this time
    const start = new Date(startTime);
    const end = new Date(start.getTime() + service.durationMinutes * 60000);

    const availableStaff = await prisma.user.findMany({
      where: {
        salonId: salon.id,
        isActive: true,
        staffServices: {
          some: {
            serviceId: serviceId,
            isAvailable: true,
          },
        },
      },
      select: { id: true },
    });

    for (const staff of availableStaff) {
      const conflict = await prisma.appointment.findFirst({
        where: {
          salonId: salon.id,
          staffId: staff.id,
          status: { notIn: ['cancelled'] },
          OR: [
            {
              AND: [
                { startTime: { lte: start } },
                { endTime: { gt: start } },
              ],
            },
            {
              AND: [
                { startTime: { lt: end } },
                { endTime: { gte: end } },
              ],
            },
            {
              AND: [
                { startTime: { gte: start } },
                { endTime: { lte: end } },
              ],
            },
          ],
        },
      });

      if (!conflict) {
        assignedStaffId = staff.id;
        break;
      }
    }

    if (!assignedStaffId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_AVAILABILITY',
          message: 'No staff available at this time',
        },
      });
    }
  }

  // Verify the specific staff is available if provided
  if (staffId) {
    const start = new Date(startTime);
    const end = new Date(start.getTime() + service.durationMinutes * 60000);

    const conflict = await prisma.appointment.findFirst({
      where: {
        salonId: salon.id,
        staffId: staffId,
        status: { notIn: ['cancelled'] },
        OR: [
          {
            AND: [
              { startTime: { lte: start } },
              { endTime: { gt: start } },
            ],
          },
          {
            AND: [
              { startTime: { lt: end } },
              { endTime: { gte: end } },
            ],
          },
          {
            AND: [
              { startTime: { gte: start } },
              { endTime: { lte: end } },
            ],
          },
        ],
      },
    });

    if (conflict) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TIME_CONFLICT',
          message: 'This time slot is no longer available',
        },
      });
    }
  }

  // Find or create client
  let client = await prisma.client.findFirst({
    where: {
      salonId: salon.id,
      email: email.toLowerCase(),
    },
  });

  if (!client) {
    client = await prisma.client.create({
      data: {
        salonId: salon.id,
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone,
        notes: 'Added via online booking',
        optedInReminders: optInReminders,
      },
    });
  } else {
    // Update client info if they provided new phone
    if (phone && phone !== client.phone) {
      client = await prisma.client.update({
        where: { id: client.id },
        data: { phone },
      });
    }
  }

  // Create appointment
  const start = new Date(startTime);

  // Get location-specific service settings if locationId provided
  let effectiveDuration = service.durationMinutes;
  let effectivePrice = service.price;

  if (locationId) {
    const serviceLocation = await prisma.serviceLocation.findUnique({
      where: { serviceId_locationId: { serviceId, locationId } },
    });
    if (serviceLocation) {
      if (serviceLocation.durationOverride) effectiveDuration = serviceLocation.durationOverride;
      if (serviceLocation.priceOverride) effectivePrice = Number(serviceLocation.priceOverride);
    }
  }

  const end = new Date(start.getTime() + effectiveDuration * 60000);

  const appointment = await prisma.appointment.create({
    data: {
      salonId: salon.id,
      locationId: locationId || null,
      clientId: client.id,
      staffId: assignedStaffId,
      serviceId: serviceId,
      startTime: start,
      endTime: end,
      durationMinutes: effectiveDuration,
      price: effectivePrice,
      status: 'confirmed',
      notes,
      source: 'online_booking',
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

  // Format date/time for notifications
  const formattedDateTime = new Date(appointment.startTime).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  // Build address - use location address if available, otherwise salon address
  const loc = appointment.location;
  const appointmentAddress = loc
    ? `${loc.address || ''}, ${loc.city || ''}, ${loc.state || ''} ${loc.zip || ''}`.trim()
    : `${salon.address || ''}, ${salon.city || ''}, ${salon.state || ''} ${salon.zip || ''}`.trim();

  // Send confirmation email
  if (client.email) {
    try {
      await sendEmail({
        to: client.email,
        subject: `Appointment Confirmed - ${salon.name}`,
        html: appointmentConfirmationEmail({
          clientName: client.firstName,
          serviceName: service.name,
          staffName: `${appointment.staff.firstName} ${appointment.staff.lastName}`,
          dateTime: formattedDateTime,
          salonName: salon.name,
          salonAddress: appointmentAddress,
        }),
      });
    } catch (e) {
      console.error('Failed to send confirmation email:', e);
    }
  }

  // Send confirmation SMS
  if (client.phone && optInReminders) {
    try {
      await sendSms({
        to: client.phone,
        message: appointmentConfirmationSms({
          clientName: client.firstName,
          serviceName: service.name,
          dateTime: formattedDateTime,
          salonName: salon.name,
        }),
      });
    } catch (e) {
      console.error('Failed to send confirmation SMS:', e);
    }
  }

  res.status(201).json({
    success: true,
    data: {
      id: appointment.id,
      service: appointment.service.name,
      staff: `${appointment.staff.firstName} ${appointment.staff.lastName}`,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      location: loc ? {
        name: loc.name,
        address: appointmentAddress,
      } : null,
      client: {
        firstName: appointment.client.firstName,
        lastName: appointment.client.lastName,
        email: appointment.client.email,
      },
    },
  });
}));

export { router as publicRouter };
