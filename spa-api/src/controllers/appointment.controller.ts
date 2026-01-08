import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';
import { NotFoundError, ConflictError } from '../middleware/errorHandler.js';
import {
  CreateAppointmentInput,
  UpdateAppointmentInput,
  UpdateAppointmentStatusInput,
  paginationSchema,
} from '../schemas/crud.schema.js';

/**
 * List appointments for the organization
 */
export async function listAppointments(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const skip = (page - 1) * limit;

    // Optional filters
    const { staffId, clientId, status, startDate, endDate } = req.query;

    const where: any = {
      organizationId: req.user.organizationId,
    };

    if (staffId) where.staffId = staffId;
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate as string);
      if (endDate) where.startTime.lte = new Date(endDate as string);
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        orderBy: { startTime: 'asc' },
        skip,
        take: limit,
        include: {
          client: {
            select: { id: true, name: true, email: true, phone: true },
          },
          staff: {
            select: { id: true, name: true, title: true },
          },
          service: {
            select: { id: true, name: true, durationMinutes: true, price: true },
          },
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    res.json({
      data: appointments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single appointment by ID
 */
export async function getAppointment(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId,
      },
      include: {
        client: true,
        staff: true,
        service: true,
        transaction: true,
      },
    });

    if (!appointment) {
      throw new NotFoundError('Appointment');
    }

    res.json({ data: appointment });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new appointment
 */
export async function createAppointment(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = req.body as CreateAppointmentInput;
    const startTime = new Date(data.startTime);

    // Get service duration
    const service = await prisma.service.findFirst({
      where: {
        id: data.serviceId,
        organizationId: req.user.organizationId,
      },
    });

    if (!service) {
      throw new NotFoundError('Service');
    }

    // Calculate end time
    const endTime = new Date(startTime.getTime() + service.durationMinutes * 60 * 1000);

    // Check for overlapping appointments for the staff
    const overlapping = await prisma.appointment.findFirst({
      where: {
        staffId: data.staffId,
        organizationId: req.user.organizationId,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        OR: [
          {
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
        ],
      },
    });

    if (overlapping) {
      throw new ConflictError('Staff has an overlapping appointment');
    }

    const appointment = await prisma.appointment.create({
      data: {
        clientId: data.clientId,
        staffId: data.staffId,
        serviceId: data.serviceId,
        startTime,
        endTime,
        notes: data.notes,
        organizationId: req.user.organizationId,
      },
      include: {
        client: true,
        staff: true,
        service: true,
      },
    });

    res.status(201).json({ data: appointment });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an appointment
 */
export async function updateAppointment(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = req.body as UpdateAppointmentInput;

    // Check if appointment exists and belongs to org
    const existing = await prisma.appointment.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId,
      },
      include: { service: true },
    });

    if (!existing) {
      throw new NotFoundError('Appointment');
    }

    // Prepare update data
    const updateData: any = { ...data };

    // If start time or service changed, recalculate end time
    if (data.startTime || data.serviceId) {
      const service = data.serviceId
        ? await prisma.service.findUnique({ where: { id: data.serviceId } })
        : existing.service;

      if (!service) {
        throw new NotFoundError('Service');
      }

      const startTime = data.startTime ? new Date(data.startTime) : existing.startTime;
      updateData.startTime = startTime;
      updateData.endTime = new Date(startTime.getTime() + service.durationMinutes * 60 * 1000);

      // Check for overlapping appointments
      const overlapping = await prisma.appointment.findFirst({
        where: {
          id: { not: req.params.id },
          staffId: data.staffId || existing.staffId,
          organizationId: req.user.organizationId,
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          OR: [
            {
              startTime: { lt: updateData.endTime },
              endTime: { gt: updateData.startTime },
            },
          ],
        },
      });

      if (overlapping) {
        throw new ConflictError('Staff has an overlapping appointment');
      }
    }

    const appointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        client: true,
        staff: true,
        service: true,
      },
    });

    res.json({ data: appointment });
  } catch (error) {
    next(error);
  }
}

/**
 * Update appointment status
 */
export async function updateAppointmentStatus(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { status } = req.body as UpdateAppointmentStatusInput;

    // Check if appointment exists and belongs to org
    const existing = await prisma.appointment.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId,
      },
    });

    if (!existing) {
      throw new NotFoundError('Appointment');
    }

    const appointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        client: true,
        staff: true,
        service: true,
      },
    });

    res.json({ data: appointment });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete an appointment
 */
export async function deleteAppointment(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Check if appointment exists and belongs to org
    const existing = await prisma.appointment.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId,
      },
    });

    if (!existing) {
      throw new NotFoundError('Appointment');
    }

    await prisma.appointment.delete({
      where: { id: req.params.id },
    });

    res.json({ data: { message: 'Appointment deleted successfully' } });
  } catch (error) {
    next(error);
  }
}
