import { Router, Request, Response } from 'express';
import { prisma } from '@peacase/database';
import { authenticate } from '../middleware/auth.js';
import { sendEmail, appointmentConfirmationEmail } from '../services/email.js';
import { sendSms, appointmentConfirmationSms } from '../services/sms.js';
import {
  createAppointmentSchema,
  updateAppointmentSchema
} from '../validation/schemas.js';

const router = Router();

// ============================================
// GET /api/v1/appointments
// List appointments with filters
// ============================================
router.get('/', authenticate, async (req: Request, res: Response) => {
  const { dateFrom, dateTo, staffId, status, page = '1', pageSize = '50' } = req.query;

  const where = {
    salonId: req.user!.salonId,
    ...(dateFrom && { startTime: { gte: new Date(dateFrom as string) } }),
    ...(dateTo && { startTime: { lte: new Date(dateTo as string) } }),
    ...(staffId && { staffId: staffId as string }),
    ...(status && { status: status as string }),
  };

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        staff: {
          select: { id: true, firstName: true, lastName: true },
        },
        service: {
          select: { id: true, name: true, color: true, durationMinutes: true },
        },
      },
      orderBy: { startTime: 'asc' },
      skip: (parseInt(page as string) - 1) * parseInt(pageSize as string),
      take: parseInt(pageSize as string),
    }),
    prisma.appointment.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      items: appointments,
      total,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
      totalPages: Math.ceil(total / parseInt(pageSize as string)),
    },
  });
});

// ============================================
// GET /api/v1/appointments/availability
// Get available time slots
// ============================================
router.get('/availability', authenticate, async (req: Request, res: Response) => {
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

  const service = await prisma.service.findFirst({
    where: { id: serviceId as string, salonId: req.user!.salonId },
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

  // Get existing appointments for the date
  const startOfDay = new Date(date as string);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date as string);
  endOfDay.setHours(23, 59, 59, 999);

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      salonId: req.user!.salonId,
      startTime: { gte: startOfDay, lte: endOfDay },
      status: { notIn: ['cancelled'] },
      ...(staffId && { staffId: staffId as string }),
    },
  });

  // Generate available slots (9am - 5pm, 30 min increments)
  const slots = [];
  for (let hour = 9; hour < 17; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const slotTime = new Date(date as string);
      slotTime.setHours(hour, min, 0, 0);
      const slotEnd = new Date(slotTime.getTime() + service.durationMinutes * 60000);

      // Check if slot conflicts with existing appointments
      const hasConflict = existingAppointments.some((apt) => {
        const aptStart = new Date(apt.startTime);
        const aptEnd = new Date(apt.endTime);
        return (
          (slotTime >= aptStart && slotTime < aptEnd) ||
          (slotEnd > aptStart && slotEnd <= aptEnd) ||
          (slotTime <= aptStart && slotEnd >= aptEnd)
        );
      });

      slots.push({
        time: `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
        available: !hasConflict,
      });
    }
  }

  res.json({
    success: true,
    data: slots,
  });
});

// ============================================
// GET /api/v1/appointments/:id
// Get appointment details
// ============================================
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const appointment = await prisma.appointment.findFirst({
    where: {
      id: req.params.id,
      salonId: req.user!.salonId,
    },
    include: {
      client: true,
      staff: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      service: true,
      payments: true,
    },
  });

  if (!appointment) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Appointment not found',
      },
    });
  }

  res.json({
    success: true,
    data: appointment,
  });
});

// ============================================
// POST /api/v1/appointments
// Create new appointment
// ============================================
router.post('/', authenticate, async (req: Request, res: Response) => {
  // Validate request body
  const validationResult = createAppointmentSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid appointment data',
        details: validationResult.error.errors,
      },
    });
  }

  const {
    clientId,
    staffId,
    serviceId,
    startTime,
    notes,
    status,
  } = validationResult.data;

  // Get service details
  const service = await prisma.service.findFirst({
    where: { id: serviceId, salonId: req.user!.salonId },
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

  // Calculate end time (including buffer)
  const start = new Date(startTime);
  const end = new Date(start.getTime() + service.durationMinutes * 60000);
  const endWithBuffer = new Date(end.getTime() + service.bufferMinutes * 60000);

  // Check for conflicts (using buffer time)
  const conflict = await prisma.appointment.findFirst({
    where: {
      salonId: req.user!.salonId,
      staffId,
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
            { startTime: { lt: endWithBuffer } },
            { endTime: { gte: endWithBuffer } },
          ],
        },
        {
          AND: [
            { startTime: { gte: start } },
            { endTime: { lte: endWithBuffer } },
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
        message: 'Staff member is not available at this time',
      },
    });
  }

  // Fetch client and staff for notifications
  const [client, staff] = await Promise.all([
    prisma.client.findUnique({ where: { id: clientId } }),
    prisma.user.findUnique({ where: { id: staffId } }),
  ]);

  const appointment = await prisma.appointment.create({
    data: {
      salonId: req.user!.salonId,
      clientId,
      staffId,
      serviceId,
      startTime: start,
      endTime: end,
      durationMinutes: service.durationMinutes,
      price: service.price,
      status,
      notes,
      source: 'manual',
    },
    include: {
      client: {
        select: { firstName: true, lastName: true },
      },
      staff: {
        select: { firstName: true, lastName: true },
      },
      service: {
        select: { name: true, color: true },
      },
    },
  });

  // Send confirmation notifications
  const salon = await prisma.salon.findUnique({ where: { id: req.user!.salonId } });
  const formattedDateTime = new Date(appointment.startTime).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  // Send email confirmation
  if (client?.email && client?.optedInReminders) {
    await sendEmail({
      to: client.email,
      subject: `Appointment Confirmed - ${salon?.name}`,
      html: appointmentConfirmationEmail({
        clientName: client.firstName,
        serviceName: service.name,
        staffName: `${staff?.firstName} ${staff?.lastName}`,
        dateTime: formattedDateTime,
        salonName: salon?.name || '',
        salonAddress: salon?.address || '',
      }),
    });
  }

  // Send SMS confirmation
  if (client?.phone && client?.optedInReminders) {
    await sendSms({
      to: client.phone,
      message: appointmentConfirmationSms({
        clientName: client.firstName,
        serviceName: service.name,
        dateTime: formattedDateTime,
        salonName: salon?.name || '',
      }),
    });
  }

  res.status(201).json({
    success: true,
    data: appointment,
  });
});

// ============================================
// PATCH /api/v1/appointments/:id
// Update appointment
// ============================================
router.patch('/:id', authenticate, async (req: Request, res: Response) => {
  // Validate request body
  const validationResult = updateAppointmentSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid appointment data',
        details: validationResult.error.errors,
      },
    });
  }

  const appointment = await prisma.appointment.findFirst({
    where: { id: req.params.id, salonId: req.user!.salonId },
  });

  if (!appointment) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Appointment not found',
      },
    });
  }

  const { status, notes, startTime, staffId, serviceId, cancellationReason } = validationResult.data;

  const updateData: Record<string, unknown> = {};

  if (status) updateData.status = status;
  if (notes !== undefined) updateData.notes = notes;
  if (cancellationReason) updateData.cancellationReason = cancellationReason;
  if (status === 'cancelled') updateData.cancelledAt = new Date();

  // Handle time/staff change - check for conflicts
  if (startTime || staffId) {
    // Get service details for conflict checking
    const targetServiceId = serviceId || appointment.serviceId;
    const service = await prisma.service.findFirst({
      where: { id: targetServiceId, salonId: req.user!.salonId },
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

    const start = startTime ? new Date(startTime) : appointment.startTime;
    const end = new Date(start.getTime() + service.durationMinutes * 60000);
    const endWithBuffer = new Date(end.getTime() + service.bufferMinutes * 60000);
    const targetStaffId = staffId || appointment.staffId;

    // Check for conflicts (exclude current appointment)
    const conflict = await prisma.appointment.findFirst({
      where: {
        id: { not: req.params.id },
        salonId: req.user!.salonId,
        staffId: targetStaffId,
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
              { startTime: { lt: endWithBuffer } },
              { endTime: { gte: endWithBuffer } },
            ],
          },
          {
            AND: [
              { startTime: { gte: start } },
              { endTime: { lte: endWithBuffer } },
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
          message: 'Staff member is not available at this time',
        },
      });
    }

    // Update time if changed
    if (startTime) {
      updateData.startTime = start;
      updateData.endTime = new Date(start.getTime() + service.durationMinutes * 60000);
      updateData.durationMinutes = service.durationMinutes;
      updateData.price = service.price;
    }
  }

  if (staffId) updateData.staffId = staffId;
  if (serviceId) updateData.serviceId = serviceId;

  const updated = await prisma.appointment.update({
    where: { id: req.params.id },
    data: updateData,
    include: {
      client: {
        select: { firstName: true, lastName: true },
      },
      staff: {
        select: { firstName: true, lastName: true },
      },
      service: {
        select: { name: true, color: true },
      },
    },
  });

  res.json({
    success: true,
    data: updated,
  });
});

// ============================================
// POST /api/v1/appointments/:id/complete
// Mark appointment as completed
// ============================================
router.post('/:id/complete', authenticate, async (req: Request, res: Response) => {
  const appointment = await prisma.appointment.findFirst({
    where: { id: req.params.id, salonId: req.user!.salonId },
  });

  if (!appointment) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Appointment not found',
      },
    });
  }

  const updated = await prisma.appointment.update({
    where: { id: req.params.id },
    data: { status: 'completed' },
  });

  res.json({
    success: true,
    data: updated,
  });
});

// ============================================
// POST /api/v1/appointments/:id/no-show
// Mark appointment as no-show
// ============================================
router.post('/:id/no-show', authenticate, async (req: Request, res: Response) => {
  const appointment = await prisma.appointment.findFirst({
    where: { id: req.params.id, salonId: req.user!.salonId },
  });

  if (!appointment) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Appointment not found',
      },
    });
  }

  const updated = await prisma.appointment.update({
    where: { id: req.params.id },
    data: { status: 'no_show' },
  });

  res.json({
    success: true,
    data: updated,
  });
});

export { router as appointmentsRouter };
