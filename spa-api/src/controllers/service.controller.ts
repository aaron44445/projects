import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';
import { NotFoundError } from '../middleware/errorHandler.js';
import {
  CreateServiceInput,
  UpdateServiceInput,
  paginationSchema,
} from '../schemas/crud.schema.js';

/**
 * List all services for the organization
 */
export async function listServices(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const skip = (page - 1) * limit;
    const activeOnly = req.query.active === 'true';

    const where = {
      organizationId: req.user.organizationId,
      ...(activeOnly && { isActive: true }),
    };

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: { appointments: true },
          },
        },
      }),
      prisma.service.count({ where }),
    ]);

    res.json({
      data: services,
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
 * Get a single service by ID
 */
export async function getService(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const service = await prisma.service.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId,
      },
      include: {
        staffServices: {
          include: {
            staff: true,
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundError('Service');
    }

    res.json({ data: service });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new service
 */
export async function createService(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = req.body as CreateServiceInput;

    const service = await prisma.service.create({
      data: {
        name: data.name,
        description: data.description,
        durationMinutes: data.durationMinutes,
        price: data.price,
        isActive: data.isActive ?? true,
        organizationId: req.user.organizationId,
      },
    });

    res.status(201).json({ data: service });
  } catch (error) {
    next(error);
  }
}

/**
 * Update a service
 */
export async function updateService(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = req.body as UpdateServiceInput;

    // Check if service exists and belongs to org
    const existing = await prisma.service.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId,
      },
    });

    if (!existing) {
      throw new NotFoundError('Service');
    }

    const service = await prisma.service.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ data: service });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a service
 */
export async function deleteService(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Check if service exists and belongs to org
    const existing = await prisma.service.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId,
      },
    });

    if (!existing) {
      throw new NotFoundError('Service');
    }

    await prisma.service.delete({
      where: { id: req.params.id },
    });

    res.json({ data: { message: 'Service deleted successfully' } });
  } catch (error) {
    next(error);
  }
}
