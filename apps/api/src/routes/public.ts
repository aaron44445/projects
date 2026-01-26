import { Router, Request, Response } from 'express';
import { prisma } from '@peacase/database';
import { sendEmail, appointmentConfirmationEmail } from '../services/email.js';
import { sendSms, appointmentConfirmationSms } from '../services/sms.js';
import { sendNotification } from '../services/notifications.js';
import { asyncHandler } from '../lib/errorUtils.js';
import { createBookingWithLock, BookingConflictError } from '../services/booking.js';
import { calculateAvailableSlots, findAlternativeSlots } from '../services/availability.js';
import { createDepositPaymentIntent } from '../services/payments.js';

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
      // Deposit settings
      requireDeposit: true,
      depositPercentage: true,
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
      requireDeposit: salon.requireDeposit || false,
      depositPercentage: salon.depositPercentage || 20,
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
      onlineBookingEnabled: true,
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

  // Build base query for staff who can perform the service (if specified)
  const baseWhere: any = {
    salonId: salon.id,
    isActive: true,
    onlineBookingEnabled: true,
  };

  // If serviceId provided, only get staff who can perform that service
  if (serviceId) {
    baseWhere.staffServices = {
      some: {
        serviceId: serviceId as string,
        isAvailable: true,
      },
    };
  }

  let staff: any[] = [];

  if (locationId) {
    // Get staff explicitly assigned to this location
    const assignedStaff = await prisma.user.findMany({
      where: {
        ...baseWhere,
        staffLocations: {
          some: {
            locationId: locationId as string,
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        staffServices: {
          select: { serviceId: true },
        },
        staffLocations: {
          where: { locationId: locationId as string },
          select: { isPrimary: true },
        },
      },
      orderBy: { firstName: 'asc' },
    });

    const assignedIds = assignedStaff.map(s => s.id);

    // Also get staff with NO location assignments (available at all locations)
    const unassignedStaff = await prisma.user.findMany({
      where: {
        ...baseWhere,
        staffLocations: { none: {} },
        id: { notIn: assignedIds },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        staffServices: {
          select: { serviceId: true },
        },
      },
      orderBy: { firstName: 'asc' },
    });

    staff = [...assignedStaff, ...unassignedStaff];
  } else {
    // No location filter - return all online-bookable staff
    staff = await prisma.user.findMany({
      where: baseWhere,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        staffServices: {
          select: { serviceId: true },
        },
      },
      orderBy: { firstName: 'asc' },
    });
  }

  res.json({
    success: true,
    data: staff.map((s) => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      firstName: s.firstName,
      lastName: s.lastName,
      avatarUrl: s.avatarUrl,
      serviceIds: s.staffServices.map((ss: any) => ss.serviceId),
      isPrimaryForLocation: locationId ? s.staffLocations?.[0]?.isPrimary : undefined,
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

  // Verify service exists
  const service = await prisma.service.findFirst({
    where: { id: serviceId as string, salonId: salon.id, isActive: true },
  });

  if (!service) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Service not found' },
    });
  }

  // Use the availability service to calculate slots
  const requestedDate = new Date(date as string);
  const slots = await calculateAvailableSlots({
    salonId: salon.id,
    locationId: locationId as string | undefined,
    serviceId: serviceId as string,
    staffId: staffId as string | undefined,
    date: requestedDate,
  });

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

  // Transform response to match expected format (backward compatible)
  res.json({
    success: true,
    data: uniqueSlots
      .sort((a, b) => a.time.localeCompare(b.time))
      .map((s) => ({
        time: s.time,
        staffId: s.staffId,
        staffName: s.staffName,
      })),
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
    stripePaymentIntentId,  // Optional - only passed when deposit was paid
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

    // Build query for available staff (must be active, online-bookable, and can perform service)
    const staffQuery: any = {
      salonId: salon.id,
      isActive: true,
      onlineBookingEnabled: true,
      staffServices: {
        some: {
          serviceId: serviceId,
          isAvailable: true,
        },
      },
    };

    // If location specified, filter by location (but include staff with no location assignments)
    let availableStaff: { id: string }[] = [];

    if (locationId) {
      // Staff assigned to this location
      const assignedStaff = await prisma.user.findMany({
        where: {
          ...staffQuery,
          staffLocations: { some: { locationId } },
        },
        select: { id: true },
      });

      const assignedIds = assignedStaff.map(s => s.id);

      // Staff with no location assignments (available at all locations)
      const unassignedStaff = await prisma.user.findMany({
        where: {
          ...staffQuery,
          staffLocations: { none: {} },
          id: { notIn: assignedIds },
        },
        select: { id: true },
      });

      availableStaff = [...assignedStaff, ...unassignedStaff];
    } else {
      availableStaff = await prisma.user.findMany({
        where: staffQuery,
        select: { id: true },
      });
    }

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

  // Note: Conflict check is now handled atomically by createBookingWithLock
  // which uses database-level locking to prevent race conditions

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
    // Update client info if they provided new details
    const updates: { firstName?: string; lastName?: string; phone?: string; optedInReminders?: boolean } = {};

    if (firstName && firstName !== client.firstName) updates.firstName = firstName;
    if (lastName && lastName !== client.lastName) updates.lastName = lastName;
    if (phone && phone !== client.phone) updates.phone = phone;
    if (optInReminders !== undefined && optInReminders !== client.optedInReminders) {
      updates.optedInReminders = optInReminders;
    }

    if (Object.keys(updates).length > 0) {
      client = await prisma.client.update({
        where: { id: client.id },
        data: updates,
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

  // Create appointment using atomic booking service with pessimistic locking
  let appointment;
  try {
    appointment = await createBookingWithLock({
      salonId: salon.id,
      clientId: client.id,
      staffId: assignedStaffId,
      serviceId: serviceId,
      locationId: locationId || null,
      startTime: start,
      endTime: end,
      durationMinutes: effectiveDuration,
      price: effectivePrice,
      notes,
      source: 'online_booking',
      stripePaymentIntentId: stripePaymentIntentId || null,  // Link to payment
      depositStatus: stripePaymentIntentId ? 'authorized' : null,  // Set initial status
    });
  } catch (error) {
    if (error instanceof BookingConflictError) {
      // Find alternative slots when a conflict occurs
      const alternatives = await findAlternativeSlots({
        salonId: salon.id,
        locationId: locationId || undefined,
        serviceId: serviceId,
        staffId: staffId || undefined, // Only same staff if client selected specific staff
        date: new Date(startTime),
        excludeTime: new Date(startTime),
        limit: 3,
      });

      return res.status(400).json({
        success: false,
        error: {
          code: 'TIME_CONFLICT',
          message: 'This time slot is no longer available',
        },
        alternatives: alternatives.map((slot) => ({
          time: slot.time,
          date: slot.startTime.toISOString().split('T')[0],
          staffId: slot.staffId,
          staffName: slot.staffName,
        })),
      });
    }
    throw error;
  }

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

  // Send booking confirmation notification
  const channels: ('email' | 'sms')[] = [];
  if (client.email) channels.push('email');
  if (client.phone && optInReminders) channels.push('sms');

  // Debug: Log appointment times before notification
  console.log('[BOOKING] Appointment created with times:', {
    appointmentId: appointment.id,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    startTimeType: typeof appointment.startTime,
    endTimeType: typeof appointment.endTime,
    startTimeIsDate: appointment.startTime instanceof Date,
    endTimeIsDate: appointment.endTime instanceof Date,
    salonTimezone: salon.timezone,
  });

  if (channels.length > 0) {
    try {
      await sendNotification({
        salonId: salon.id,
        clientId: client.id,
        appointmentId: appointment.id,
        type: 'booking_confirmation',
        channels,
        data: {
          clientName: client.firstName,
          clientEmail: client.email || undefined,
          clientPhone: client.phone || undefined,
          serviceName: service.name,
          staffName: `${appointment.staff.firstName} ${appointment.staff.lastName}`,
          dateTime: formattedDateTime,
          salonName: salon.name,
          salonAddress: appointmentAddress,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          salonTimezone: salon.timezone,
        },
      });
    } catch (e) {
      console.error('Failed to send booking confirmation:', e);
      // Don't block booking completion on notification failure
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

// ============================================
// POST /api/v1/public/:slug/create-payment-intent
// Create a payment intent for booking deposit (public, unauthenticated)
// ============================================
router.post('/:slug/create-payment-intent', asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const { serviceId, servicePrice, clientEmail, staffId, locationId, appointmentDate } = req.body;

  // Find salon by slug
  const salon = await prisma.salon.findUnique({
    where: { slug },
  });

  if (!salon) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Salon not found' },
    });
  }

  // Check if salon requires deposits
  if (!salon.requireDeposit) {
    return res.status(400).json({
      success: false,
      error: { code: 'DEPOSITS_NOT_REQUIRED', message: 'This salon does not require deposits for booking' },
    });
  }

  // Validate required fields
  if (!serviceId || !servicePrice || !clientEmail || !appointmentDate) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_FIELDS', message: 'Missing required fields: serviceId, servicePrice, clientEmail, appointmentDate' },
    });
  }

  // Verify service exists and price matches (security: don't trust client-provided price)
  const service = await prisma.service.findFirst({
    where: { id: serviceId, salonId: salon.id, isActive: true },
  });

  if (!service) {
    return res.status(404).json({
      success: false,
      error: { code: 'SERVICE_NOT_FOUND', message: 'Service not found' },
    });
  }

  // Use server-side price, not client-provided
  const actualServicePrice = service.price;

  // Get or create client for this email
  let client = await prisma.client.findFirst({
    where: { email: clientEmail, salonId: salon.id },
  });

  if (!client) {
    // Will be created during booking, but we need an ID for metadata
    // For now, use a placeholder that will be updated when booking completes
    client = await prisma.client.create({
      data: {
        salonId: salon.id,
        email: clientEmail,
        firstName: 'Pending',
        lastName: 'Booking',
      },
    });
  }

  try {
    const { clientSecret, depositAmountCents } = await createDepositPaymentIntent({
      salonId: salon.id,
      serviceId,
      clientId: client.id,
      clientEmail,
      servicePrice: actualServicePrice,
      depositPercentage: salon.depositPercentage || 20,
      appointmentDate,
      staffId,
      locationId,
    });

    res.json({
      success: true,
      data: {
        clientSecret,
        depositAmountCents,
        servicePrice: actualServicePrice,
        depositPercentage: salon.depositPercentage || 20,
      },
    });
  } catch (error: any) {
    console.error('[Payment] Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      error: { code: 'PAYMENT_ERROR', message: 'Failed to initialize payment' },
    });
  }
}));

export { router as publicRouter };
