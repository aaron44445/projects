import { Router, Request, Response } from 'express';
import { prisma } from '@peacase/database';
import { authenticate } from '../middleware/auth.js';
import {
  PERMISSIONS,
  ROLES,
  hasPermission,
  requirePermission,
  requireAnyPermission,
  getUserLocationIds,
} from '../middleware/permissions.js';
import { asyncHandler } from '../lib/errorUtils.js';
import { processAppointmentRefund, RefundResult } from '../lib/refundHelper.js';
import { capturePaymentIntent } from '../services/payments.js';

const router = Router();

// ============================================
// GET /api/v1/appointments
// List appointments with filters
// ============================================
router.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { dateFrom, dateTo, staffId, status, locationId, page = '1', pageSize = '50' } = req.query;

  // Build base filter
  const startTimeFilter: any = {};
  if (dateFrom) {
    startTimeFilter.gte = new Date(dateFrom as string);
  }
  if (dateTo) {
    startTimeFilter.lte = new Date(dateTo as string);
  }

  const where: any = {
    salonId: req.user!.salonId,
    ...(Object.keys(startTimeFilter).length > 0 && { startTime: startTimeFilter }),
    ...(status && { status: status as string }),
  };

  // Staff role: can only view their own appointments
  if (!hasPermission(req.user!.role, PERMISSIONS.VIEW_ALL_APPOINTMENTS)) {
    where.staffId = req.user!.userId;
  } else if (staffId) {
    // If they can view all but specified a staff filter
    where.staffId = staffId as string;
  }

  // Location-based filtering for managers
  const userLocations = await getUserLocationIds(
    req.user!.userId,
    req.user!.salonId,
    req.user!.role
  );

  if (userLocations !== null) {
    // User is restricted to specific locations (managers)
    if (userLocations.length === 0) {
      // No location access
      return res.json({
        success: true,
        data: { items: [], total: 0, page: 1, pageSize: 50, totalPages: 0 },
      });
    }
    // Managers see their locations plus unassigned appointments
    // If they also passed a locationId param, filter to just that location + null
    if (locationId) {
      // Make sure they have access to the requested location
      if (!userLocations.includes(locationId as string)) {
        return res.json({
          success: true,
          data: { items: [], total: 0, page: 1, pageSize: 50, totalPages: 0 },
        });
      }
      where.OR = [
        { locationId: locationId as string },
        { locationId: null },
      ];
    } else {
      where.OR = [
        { locationId: { in: userLocations } },
        { locationId: null },
      ];
    }
  } else if (locationId) {
    // Non-managers (admin/owner) with location filter
    // Include appointments at this location OR with no location
    where.OR = [
      { locationId: locationId as string },
      { locationId: null },
    ];
  }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true, phone: true, email: true },
        },
        staff: {
          select: { id: true, firstName: true, lastName: true },
        },
        service: {
          select: { id: true, name: true, color: true, durationMinutes: true, price: true },
        },
        location: {
          select: { id: true, name: true },
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
}));

// ============================================
// GET /api/v1/appointments/availability
// Get available time slots
// ============================================
router.get('/availability', authenticate, asyncHandler(async (req: Request, res: Response) => {
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
      ...(locationId && { locationId: locationId as string }),
    },
  });

  // Generate available slots (9am - 5pm, 30 min increments)
  const slots: Array<{ time: string; available: boolean }> = [];
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
}));

// ============================================
// GET /api/v1/appointments/:id
// Get appointment details
// ============================================
router.get('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
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
      location: true,
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

  // Staff can only view their own appointments
  if (
    !hasPermission(req.user!.role, PERMISSIONS.VIEW_ALL_APPOINTMENTS) &&
    appointment.staffId !== req.user!.userId
  ) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You can only view your own appointments',
      },
    });
  }

  res.json({
    success: true,
    data: appointment,
  });
}));

// ============================================
// POST /api/v1/appointments
// Create new appointment (requires BOOK_APPOINTMENTS permission)
// ============================================
router.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.BOOK_APPOINTMENTS),
  asyncHandler(async (req: Request, res: Response) => {
    const {
      clientId,
      staffId,
      serviceId,
      startTime,
      notes,
      locationId,
      status = 'confirmed',
    } = req.body;

    // Verify staff belongs to user's accessible locations (for managers)
    const userLocations = await getUserLocationIds(
      req.user!.userId,
      req.user!.salonId,
      req.user!.role
    );

    if (userLocations !== null && locationId) {
      if (!userLocations.includes(locationId)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You cannot book appointments for this location',
          },
        });
      }
    }

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

    // Calculate end time
    const start = new Date(startTime);
    const end = new Date(start.getTime() + service.durationMinutes * 60000);

    // Check for conflicts
    const conflict = await prisma.appointment.findFirst({
      where: {
        salonId: req.user!.salonId,
        staffId,
        status: { notIn: ['cancelled'] },
        OR: [
          {
            AND: [{ startTime: { lte: start } }, { endTime: { gt: start } }],
          },
          {
            AND: [{ startTime: { lt: end } }, { endTime: { gte: end } }],
          },
          {
            AND: [{ startTime: { gte: start } }, { endTime: { lte: end } }],
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
        locationId: locationId || null,
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
        location: {
          select: { id: true, name: true },
        },
      },
    });

    // Send confirmation notifications
    const salon = await prisma.salon.findUnique({
      where: { id: req.user!.salonId },
      select: { name: true, address: true, timezone: true, email: true },
    });
    const formattedDateTime = new Date(appointment.startTime).toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    // Calculate appointment end time for calendar links
    const appointmentEndTime = new Date(appointment.startTime);
    appointmentEndTime.setMinutes(appointmentEndTime.getMinutes() + service.durationMinutes);

    // Enqueue notification job (async - don't await the actual send)
    // This improves API response time from 2-5s to <200ms
    if (client?.optedInReminders && (client?.email || client?.phone)) {
      await prisma.notificationJob.create({
        data: {
          salonId: req.user!.salonId,
          clientId: appointment.clientId,
          appointmentId: appointment.id,
          type: 'booking_confirmation',
          payload: JSON.stringify({
            type: 'booking_confirmation',
            channels: [
              ...(client.email ? ['email'] as const : []),
              ...(client.phone ? ['sms'] as const : []),
            ],
            data: {
              clientName: client.firstName,
              clientEmail: client.email,
              clientPhone: client.phone,
              serviceName: service.name,
              staffName: `${staff?.firstName} ${staff?.lastName}`,
              dateTime: formattedDateTime,
              salonName: salon?.name || '',
              salonAddress: salon?.address || '',
              startTime: appointment.startTime,
              endTime: appointmentEndTime,
              salonTimezone: salon?.timezone,
              salonEmail: salon?.email,
            },
          }),
          status: 'pending',
          attempts: 0,
          maxAttempts: 3,
        },
      });
    }

    res.status(201).json({
      success: true,
      data: appointment,
    });
  })
);

// ============================================
// PATCH /api/v1/appointments/:id
// Update appointment (requires EDIT_APPOINTMENTS permission)
// ============================================
router.patch(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.EDIT_APPOINTMENTS),
  asyncHandler(async (req: Request, res: Response) => {
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

    const { status, notes, startTime, staffId, serviceId, locationId, cancellationReason } =
      req.body;

    const updateData: Record<string, unknown> = {};

    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (cancellationReason) updateData.cancellationReason = cancellationReason;
    if (status === 'cancelled') updateData.cancelledAt = new Date();
    if (locationId !== undefined) updateData.locationId = locationId;

    // Handle time change
    if (startTime && serviceId) {
      const service = await prisma.service.findUnique({ where: { id: serviceId } });
      if (service) {
        const start = new Date(startTime);
        updateData.startTime = start;
        updateData.endTime = new Date(start.getTime() + service.durationMinutes * 60000);
        updateData.durationMinutes = service.durationMinutes;
        updateData.price = service.price;
      }
    }

    if (staffId) updateData.staffId = staffId;
    if (serviceId) updateData.serviceId = serviceId;

    const updated = await prisma.appointment.update({
      where: { id: req.params.id, salonId: req.user!.salonId },
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
        location: {
          select: { id: true, name: true },
        },
      },
    });

    res.json({
      success: true,
      data: updated,
    });
  })
);

// ============================================
// POST /api/v1/appointments/:id/cancel
// Cancel appointment with refund processing
// ============================================
router.post(
  '/:id/cancel',
  authenticate,
  requirePermission(PERMISSIONS.CANCEL_APPOINTMENTS),
  asyncHandler(async (req: Request, res: Response) => {
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

    // Already cancelled?
    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_CANCELLED',
          message: 'Appointment is already cancelled',
        },
      });
    }

    const { cancellationReason, cancelledBy = 'salon' } = req.body;

    // Process refund if deposit exists
    let refundResult: RefundResult | null = null;
    if (appointment.stripePaymentIntentId || appointment.depositAmount) {
      try {
        refundResult = await processAppointmentRefund({
          appointmentId: req.params.id,
          cancelledBy: cancelledBy as 'client' | 'salon',
          reason: cancellationReason,
          requestedByUserId: req.user!.userId,
        });
      } catch (error: any) {
        console.error('[Cancel] Refund processing error:', error);
        // Don't block cancellation on refund failure - log and continue
      }
    }

    // Update appointment status
    const updated = await prisma.appointment.update({
      where: { id: req.params.id, salonId: req.user!.salonId },
      data: {
        status: 'cancelled',
        cancellationReason,
        cancelledAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: {
        appointment: updated,
        refund: refundResult,
      },
    });
  })
);

// ============================================
// POST /api/v1/appointments/:id/complete
// Mark appointment as completed
// ============================================
router.post(
  '/:id/complete',
  authenticate,
  requirePermission(PERMISSIONS.EDIT_APPOINTMENTS),
  asyncHandler(async (req: Request, res: Response) => {
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
      where: { id: req.params.id, salonId: req.user!.salonId },
      data: { status: 'completed' },
    });

    res.json({
      success: true,
      data: updated,
    });
  })
);

// ============================================
// POST /api/v1/appointments/:id/no-show
// Mark appointment as no-show
// ============================================
router.post(
  '/:id/no-show',
  authenticate,
  requirePermission(PERMISSIONS.EDIT_APPOINTMENTS),
  asyncHandler(async (req: Request, res: Response) => {
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
      where: { id: req.params.id, salonId: req.user!.salonId },
      data: { status: 'no_show' },
    });

    res.json({
      success: true,
      data: updated,
    });
  })
);

// ============================================
// POST /api/v1/appointments/:id/capture-payment
// Capture the authorized deposit (when service is rendered)
// ============================================
router.post(
  '/:id/capture-payment',
  authenticate,
  requirePermission(PERMISSIONS.EDIT_APPOINTMENTS),
  asyncHandler(async (req: Request, res: Response) => {
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

    if (!appointment.stripePaymentIntentId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_PAYMENT',
          message: 'No payment intent associated with this appointment',
        },
      });
    }

    if (appointment.depositStatus !== 'authorized') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: `Cannot capture payment with status: ${appointment.depositStatus}`,
        },
      });
    }

    try {
      // Capture the authorized payment
      const paymentIntent = await capturePaymentIntent(appointment.stripePaymentIntentId);

      // Update appointment
      await prisma.appointment.update({
        where: { id: req.params.id, salonId: req.user!.salonId },
        data: {
          depositStatus: 'captured',
        },
      });

      // Update payment record
      await prisma.payment.updateMany({
        where: { stripePaymentId: appointment.stripePaymentIntentId },
        data: {
          status: 'captured',
        },
      });

      res.json({
        success: true,
        data: {
          captured: true,
          amount: paymentIntent.amount / 100,
        },
      });
    } catch (error: any) {
      console.error('[Capture] Error capturing payment:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CAPTURE_FAILED',
          message: error.message || 'Failed to capture payment',
        },
      });
    }
  })
);

export { router as appointmentsRouter };
