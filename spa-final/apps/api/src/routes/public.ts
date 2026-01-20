import { Router, Request, Response } from 'express';
import { prisma } from '@peacase/database';
import { sendEmail, appointmentConfirmationEmail } from '../services/email.js';
import { sendSms, appointmentConfirmationSms } from '../services/sms.js';

const router = Router();

// ============================================
// GET /api/v1/public/:slug/salon
// Get salon public info (name, logo, branding)
// ============================================
router.get('/:slug/salon', async (req: Request, res: Response) => {
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
      widget: {
        primaryColor: salon.widgetPrimaryColor,
        accentColor: salon.widgetAccentColor,
        buttonStyle: salon.widgetButtonStyle,
        fontFamily: salon.widgetFontFamily,
      },
    },
  });
});

// ============================================
// GET /api/v1/public/:slug/services
// Get salon's active services
// ============================================
router.get('/:slug/services', async (req: Request, res: Response) => {
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
    },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  });

  // Group by category
  const categorized = services.reduce((acc, service) => {
    const categoryName = service.category?.name || 'Other Services';
    const categoryId = service.category?.id || 'uncategorized';

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
      durationMinutes: service.durationMinutes,
      price: service.price,
      color: service.color,
    });

    return acc;
  }, {} as Record<string, { id: string; name: string; services: Array<{ id: string; name: string; description: string | null; durationMinutes: number; price: number; color: string }> }>);

  res.json({
    success: true,
    data: Object.values(categorized),
  });
});

// ============================================
// GET /api/v1/public/:slug/staff
// Get salon's bookable staff
// ============================================
router.get('/:slug/staff', async (req: Request, res: Response) => {
  const { serviceId } = req.query;

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
    })),
  });
});

// ============================================
// GET /api/v1/public/:slug/availability
// Get available time slots
// ============================================
router.get('/:slug/availability', async (req: Request, res: Response) => {
  const { date, serviceId, staffId } = req.query;

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

  const service = await prisma.service.findFirst({
    where: { id: serviceId as string, salonId: salon.id, isActive: true },
  });

  if (!service) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Service not found',
      },
    });
  }

  // Default business hours (9am-5pm)
  const dayOfWeek = new Date(date as string).getDay();
  // Closed on Sunday (day 0), open Mon-Sat
  const defaultHours: Record<number, { open: string; close: string } | null> = {
    0: null, // Sunday closed
    1: { open: '09:00', close: '17:00' },
    2: { open: '09:00', close: '17:00' },
    3: { open: '09:00', close: '17:00' },
    4: { open: '09:00', close: '17:00' },
    5: { open: '09:00', close: '17:00' },
    6: { open: '10:00', close: '16:00' }, // Saturday shorter
  };
  const todayHours = defaultHours[dayOfWeek];

  // If closed this day, return empty slots
  if (!todayHours) {
    return res.json({
      success: true,
      data: [],
    });
  }

  // Parse hours
  const [openHour, openMin] = todayHours.open.split(':').map(Number);
  const [closeHour, closeMin] = todayHours.close.split(':').map(Number);

  // Get existing appointments for the date
  const startOfDay = new Date(date as string);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date as string);
  endOfDay.setHours(23, 59, 59, 999);

  // Build staff filter
  let staffFilter = {};
  if (staffId) {
    staffFilter = { staffId: staffId as string };
  } else {
    // Get all staff who can perform this service
    const availableStaff = await prisma.user.findMany({
      where: {
        salonId: salon.id,
        isActive: true,
        staffServices: {
          some: {
            serviceId: serviceId as string,
            isAvailable: true,
          },
        },
      },
      select: { id: true },
    });
    staffFilter = { staffId: { in: availableStaff.map((s) => s.id) } };
  }

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      salonId: salon.id,
      startTime: { gte: startOfDay, lte: endOfDay },
      status: { notIn: ['cancelled'] },
      ...staffFilter,
    },
    select: {
      staffId: true,
      startTime: true,
      endTime: true,
    },
  });

  // Generate available slots (30 min increments)
  const slots: Array<{ time: string; available: boolean }> = [];
  const slotDuration = 30; // minutes

  for (let hour = openHour; hour < closeHour; hour++) {
    for (let min = (hour === openHour ? openMin : 0); min < 60; min += slotDuration) {
      // Don't go past closing time
      if (hour === closeHour - 1 && min + slotDuration > closeMin) break;
      if (hour >= closeHour) break;

      const slotTime = new Date(date as string);
      slotTime.setHours(hour, min, 0, 0);

      // Skip past times for today
      if (slotTime < new Date()) {
        continue;
      }

      const slotEnd = new Date(slotTime.getTime() + service.durationMinutes * 60000);

      // Check if any staff member is available at this time
      let hasAvailableStaff = false;

      if (staffId) {
        // Check specific staff
        const hasConflict = existingAppointments.some((apt) => {
          if (apt.staffId !== staffId) return false;
          const aptStart = new Date(apt.startTime);
          const aptEnd = new Date(apt.endTime);
          return (
            (slotTime >= aptStart && slotTime < aptEnd) ||
            (slotEnd > aptStart && slotEnd <= aptEnd) ||
            (slotTime <= aptStart && slotEnd >= aptEnd)
          );
        });
        hasAvailableStaff = !hasConflict;
      } else {
        // Check if ANY staff who can do this service is available
        const staffIds = await prisma.user.findMany({
          where: {
            salonId: salon.id,
            isActive: true,
            staffServices: {
              some: {
                serviceId: serviceId as string,
                isAvailable: true,
              },
            },
          },
          select: { id: true },
        });

        for (const staff of staffIds) {
          const hasConflict = existingAppointments.some((apt) => {
            if (apt.staffId !== staff.id) return false;
            const aptStart = new Date(apt.startTime);
            const aptEnd = new Date(apt.endTime);
            return (
              (slotTime >= aptStart && slotTime < aptEnd) ||
              (slotEnd > aptStart && slotEnd <= aptEnd) ||
              (slotTime <= aptStart && slotEnd >= aptEnd)
            );
          });
          if (!hasConflict) {
            hasAvailableStaff = true;
            break;
          }
        }
      }

      if (hasAvailableStaff) {
        slots.push({
          time: `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
          available: true,
        });
      }
    }
  }

  res.json({
    success: true,
    data: slots,
  });
});

// ============================================
// POST /api/v1/public/:slug/book
// Create a booking (creates client if needed)
// ============================================
router.post('/:slug/book', async (req: Request, res: Response) => {
  const {
    serviceId,
    staffId,
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
  const end = new Date(start.getTime() + service.durationMinutes * 60000);

  const appointment = await prisma.appointment.create({
    data: {
      salonId: salon.id,
      clientId: client.id,
      staffId: assignedStaffId,
      serviceId: serviceId,
      startTime: start,
      endTime: end,
      durationMinutes: service.durationMinutes,
      price: service.price,
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
          salonAddress: `${salon.address || ''}, ${salon.city || ''}, ${salon.state || ''} ${salon.zip || ''}`.trim(),
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
      client: {
        firstName: appointment.client.firstName,
        lastName: appointment.client.lastName,
        email: appointment.client.email,
      },
    },
  });
});

export { router as publicRouter };
