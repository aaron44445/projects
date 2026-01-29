import { Router } from 'express';
import { Prisma, prisma } from '@peacase/database';
import { authenticateClient, AuthenticatedClientRequest } from '../middleware/clientAuth.js';
import { sendEmail, appointmentCancellationEmail, appointmentConfirmationEmail } from '../services/email.js';
import { asyncHandler } from '../lib/errorUtils.js';
import logger from '../lib/logger.js';
import { withSalonId } from '../lib/prismaUtils.js';

export const clientPortalRouter = Router();

// All routes require client authentication
clientPortalRouter.use(authenticateClient);

/**
 * GET /api/v1/client-portal/dashboard
 * Get client dashboard data
 */
clientPortalRouter.get('/dashboard', asyncHandler(async (req, res, next) => {
  const { id: clientId, salonId } = (req as any as AuthenticatedClientRequest).client;

  // Include salonId in lookup for defense-in-depth
  const client = await prisma.client.findFirst({
    where: { id: clientId, salonId },
  });

  if (!client) {
    return res.status(404).json({
      success: false,
      error: { code: 'CLIENT_NOT_FOUND', message: 'Client not found' },
    });
  }

  // Get upcoming appointments
  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      clientId,
      salonId,
      startTime: { gte: new Date() },
      status: { in: ['pending', 'confirmed'] },
    },
    include: {
      service: true,
      staff: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      location: true,
    },
    orderBy: { startTime: 'asc' },
    take: 5,
  });

  // Get past appointments count
  const pastAppointmentsCount = await prisma.appointment.count({
    where: {
      clientId,
      salonId,
      status: { in: ['completed', 'cancelled'] },
    },
  });

  // Get client packages
  const packages = await prisma.clientPackage.findMany({
    where: { clientId, servicesRemaining: { gt: 0 } },
    include: { package: true },
  });

  // Calculate can cancel flag (24 hours before appointment)
  const appointmentsWithFlags = upcomingAppointments.map((apt) => {
    const hoursUntil = (apt.startTime.getTime() - Date.now()) / (1000 * 60 * 60);
    return {
      ...apt,
      canCancel: hoursUntil >= 24 && apt.status !== 'cancelled' && apt.status !== 'completed',
    };
  });

  res.json({
    success: true,
    data: {
      welcomeMessage: `Welcome back, ${client.firstName}!`,
      upcomingAppointments: appointmentsWithFlags,
      pastAppointmentsCount,
      packages,
      loyaltyPoints: client.loyaltyPoints || 0,
    },
  });
}));

/**
 * GET /api/v1/client-portal/appointments
 * Get client appointments with pagination and filtering
 */
clientPortalRouter.get('/appointments', asyncHandler(async (req, res, next) => {
  const { id: clientId, salonId } = (req as any as AuthenticatedClientRequest).client;
  const { page = '1', limit = '10', status } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  let statusFilter: Prisma.AppointmentWhereInput = {};

  if (status === 'upcoming') {
    statusFilter = {
      startTime: { gte: new Date() },
      status: { in: ['pending', 'confirmed'] },
    };
  } else if (status === 'past') {
    statusFilter = {
      OR: [
        { startTime: { lt: new Date() } },
        { status: { in: ['completed', 'cancelled'] } },
      ],
    };
  } else if (status === 'cancelled') {
    statusFilter = { status: 'cancelled' };
  }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        clientId,
        salonId,
        ...statusFilter,
      },
      include: {
        service: true,
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        location: true,
      },
      orderBy: { startTime: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.appointment.count({
      where: {
        clientId,
        salonId,
        ...statusFilter,
      },
    }),
  ]);

  res.json({
    success: true,
    data: {
      appointments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    },
  });
}));

/**
 * POST /api/v1/client-portal/appointments/:id/cancel
 * Cancel an appointment
 */
clientPortalRouter.post('/appointments/:id/cancel', asyncHandler(async (req, res, next) => {
  const { id: clientId, salonId } = (req as any as AuthenticatedClientRequest).client;
  const { id } = req.params;
  const { reason } = req.body;

  const appointment = await prisma.appointment.findFirst({
    where: { id, clientId, salonId },
    include: {
      service: true,
      staff: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      client: true,
    },
  });

  if (!appointment) {
    return res.status(404).json({
      success: false,
      error: { code: 'APPOINTMENT_NOT_FOUND', message: 'Appointment not found' },
    });
  }

  if (appointment.status === 'cancelled') {
    return res.status(400).json({
      success: false,
      error: { code: 'CANNOT_CANCEL', message: 'Appointment is already cancelled' },
    });
  }

  if (appointment.status === 'completed') {
    return res.status(400).json({
      success: false,
      error: { code: 'CANNOT_CANCEL', message: 'Cannot cancel completed appointment' },
    });
  }

  // Check 24-hour cancellation window
  const hoursUntil = (appointment.startTime.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursUntil < 24) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'CANCELLATION_WINDOW_PASSED',
        message: 'Appointments must be cancelled at least 24 hours in advance',
      },
    });
  }

  const updatedAppointment = await prisma.appointment.update({
    where: { id, salonId },
    data: {
      status: 'cancelled',
      cancellationReason: reason,
    },
    include: {
      service: true,
      staff: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  // Send cancellation email
  try {
    const salon = await prisma.salon.findUnique({
      where: { id: salonId },
      select: { name: true },
    });

    await sendEmail({
      to: appointment.client.email!,
      subject: 'Appointment Cancelled',
      html: appointmentCancellationEmail({
        clientName: `${appointment.client.firstName} ${appointment.client.lastName}`,
        salonName: salon?.name || '',
        serviceName: appointment.service.name,
        appointmentDate: appointment.startTime.toLocaleDateString(),
        appointmentTime: appointment.startTime.toLocaleTimeString(),
      }),
    });
  } catch (emailError) {
    // Don't fail the request if email fails
    logger.error({ err: emailError, appointmentId: id }, 'Failed to send cancellation email');
  }

  res.json({
    success: true,
    data: { appointment: updatedAppointment },
  });
}));

/**
 * POST /api/v1/client-portal/booking
 * Create a new booking
 */
clientPortalRouter.post('/booking', asyncHandler(async (req, res, next) => {
  const { id: clientId, salonId } = (req as any as AuthenticatedClientRequest).client;
  const { serviceId, staffId, startTime, notes } = req.body;

  if (!serviceId || !staffId || !startTime) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_FIELDS', message: 'serviceId, staffId, and startTime are required' },
    });
  }

  const service = await prisma.service.findFirst({
    where: { id: serviceId, salonId },
  });

  if (!service) {
    return res.status(404).json({
      success: false,
      error: { code: 'SERVICE_NOT_FOUND', message: 'Service not found' },
    });
  }

  const staff = await prisma.user.findFirst({
    where: { id: staffId, salonId },
  });

  if (!staff) {
    return res.status(404).json({
      success: false,
      error: { code: 'STAFF_NOT_FOUND', message: 'Staff not found' },
    });
  }

  // Include salonId in lookup for defense-in-depth
  const client = await prisma.client.findFirst({
    where: { id: clientId, salonId },
  });

  // Check for time conflicts
  const appointmentStart = new Date(startTime);
  const appointmentEnd = new Date(appointmentStart.getTime() + service.durationMinutes * 60 * 1000);

  const conflicts = await prisma.appointment.findMany({
    where: {
      staffId,
      status: { in: ['pending', 'confirmed'] },
      OR: [
        {
          AND: [
            { startTime: { lte: appointmentStart } },
            { endTime: { gt: appointmentStart } },
          ],
        },
        {
          AND: [
            { startTime: { lt: appointmentEnd } },
            { endTime: { gte: appointmentEnd } },
          ],
        },
        {
          AND: [
            { startTime: { gte: appointmentStart } },
            { endTime: { lte: appointmentEnd } },
          ],
        },
      ],
    },
  });

  if (conflicts.length > 0) {
    return res.status(409).json({
      success: false,
      error: { code: 'TIME_CONFLICT', message: 'This time slot is no longer available' },
    });
  }

  const appointment = await prisma.appointment.create({
    data: {
      salonId,
      clientId,
      staffId,
      serviceId,
      startTime: appointmentStart,
      endTime: appointmentEnd,
      durationMinutes: service.durationMinutes,
      price: service.price,
      status: 'confirmed',
      notes,
      source: 'client_portal',
    },
    include: {
      service: true,
      staff: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  // Send confirmation email
  try {
    const salon = await prisma.salon.findUnique({
      where: { id: salonId },
      select: { name: true, address: true, timezone: true, email: true },
    });

    // Calculate appointment end time for calendar links
    const appointmentEndTime = new Date(appointmentStart);
    appointmentEndTime.setMinutes(appointmentEndTime.getMinutes() + service.durationMinutes);

    await sendEmail({
      to: client!.email!,
      subject: 'Appointment Confirmed',
      html: appointmentConfirmationEmail({
        clientName: `${client!.firstName} ${client!.lastName}`,
        serviceName: service.name,
        staffName: `${staff.firstName} ${staff.lastName}`,
        dateTime: appointmentStart.toLocaleString(),
        salonName: salon?.name || '',
        salonAddress: salon?.address || '',
        // Calendar fields for "Add to Calendar" links
        startTime: appointmentStart,
        endTime: appointmentEndTime,
        salonTimezone: salon?.timezone,
        salonEmail: salon?.email,
      }),
    });
  } catch (emailError) {
    logger.error({ err: emailError, appointmentId: appointment.id }, 'Failed to send confirmation email');
  }

  res.status(201).json({
    success: true,
    data: { appointment },
  });
}));

/**
 * GET /api/v1/client-portal/profile
 * Get client profile
 */
clientPortalRouter.get('/profile', asyncHandler(async (req, res, next) => {
  const { id: clientId, salonId } = (req as any as AuthenticatedClientRequest).client;

  // Include salonId in lookup for defense-in-depth
  const client = await prisma.client.findFirst({
    where: { id: clientId, salonId },
  });

  if (!client) {
    return res.status(404).json({
      success: false,
      error: { code: 'CLIENT_NOT_FOUND', message: 'Client not found' },
    });
  }

  res.json({ success: true, data: client });
}));

/**
 * PUT /api/v1/client-portal/profile
 * Update client profile
 */
clientPortalRouter.put('/profile', asyncHandler(async (req, res, next) => {
  const { id: clientId, salonId } = (req as any as AuthenticatedClientRequest).client;
  const { firstName, lastName, phone, optedInMarketing } = req.body;

  const updatedClient = await prisma.client.update({
    where: { id: clientId, salonId },
    data: {
      firstName,
      lastName,
      phone,
      optedInMarketing,
    },
  });

  res.json({ success: true, data: updatedClient });
}));

/**
 * GET /api/v1/client-portal/packages
 * Get client packages and available packages
 */
clientPortalRouter.get('/packages', asyncHandler(async (req, res, next) => {
  const { id: clientId, salonId } = (req as any as AuthenticatedClientRequest).client;

  const [myPackages, availablePackages] = await Promise.all([
    prisma.clientPackage.findMany({
      where: { clientId },
      include: { package: true },
    }),
    prisma.package.findMany({
      where: { salonId, isActive: true },
      include: {
        packageServices: {
          include: { service: true },
        },
      },
    }),
  ]);

  res.json({
    success: true,
    data: {
      myPackages,
      availablePackages,
    },
  });
}));

/**
 * GET /api/v1/client-portal/services
 * Get available services
 */
clientPortalRouter.get('/services', asyncHandler(async (req, res, next) => {
  const { salonId } = (req as any as AuthenticatedClientRequest).client;

  const services = await prisma.service.findMany({
    where: { salonId, isActive: true },
    include: { category: true },
  });

  const categories = await prisma.serviceCategory.findMany({
    where: { salonId },
  });

  res.json({
    success: true,
    data: {
      services,
      categories,
    },
  });
}));

/**
 * GET /api/v1/client-portal/staff
 * Get active staff members
 */
clientPortalRouter.get('/staff', asyncHandler(async (req, res, next) => {
  const { salonId } = (req as any as AuthenticatedClientRequest).client;

  const staff = await prisma.user.findMany({
    where: {
      salonId,
      isActive: true,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
    },
  });

  res.json({ success: true, data: { staff } });
}));

/**
 * GET /api/v1/client-portal/appointments/:id/ics
 * Generate ICS calendar file for appointment
 */
clientPortalRouter.get('/appointments/:id/ics', asyncHandler(async (req, res, next) => {
  const { id: clientId, salonId } = (req as any as AuthenticatedClientRequest).client;
  const { id } = req.params;

  const appointment = await prisma.appointment.findFirst({
    where: { id, clientId, salonId },
    include: {
      service: true,
      staff: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      salon: {
        select: {
          name: true,
          address: true,
          city: true,
          state: true,
        },
      },
    },
  });

  if (!appointment) {
    return res.status(404).json({
      success: false,
      error: { code: 'APPOINTMENT_NOT_FOUND', message: 'Appointment not found' },
    });
  }

  // Generate ICS content
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const location = appointment.salon.address
    ? `${appointment.salon.address}, ${appointment.salon.city}, ${appointment.salon.state}`
    : '';

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Peacase//Appointment//EN
BEGIN:VEVENT
UID:${appointment.id}@peacase.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(appointment.startTime)}
DTEND:${formatDate(appointment.endTime)}
SUMMARY:${appointment.service.name} with ${appointment.staff.firstName} ${appointment.staff.lastName}
DESCRIPTION:Appointment at ${appointment.salon.name}
LOCATION:${location}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

  res.setHeader('Content-Type', 'text/calendar');
  res.setHeader('Content-Disposition', `attachment; filename="appointment-${appointment.id}.ics"`);
  res.send(icsContent);
}));
