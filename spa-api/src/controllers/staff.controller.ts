import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';
import { NotFoundError } from '../middleware/errorHandler.js';
import {
  CreateStaffInput,
  UpdateStaffInput,
  paginationSchema,
} from '../schemas/crud.schema.js';

/**
 * List all staff for the organization
 */
export async function listStaff(
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

    const [staff, total] = await Promise.all([
      prisma.staff.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
          staffServices: {
            include: {
              service: {
                select: { id: true, name: true },
              },
            },
          },
        },
      }),
      prisma.staff.count({ where }),
    ]);

    res.json({
      data: staff,
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
 * Get a single staff member by ID
 */
export async function getStaff(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const staff = await prisma.staff.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId,
      },
      include: {
        user: {
          select: { id: true, email: true, name: true, role: true },
        },
        staffServices: {
          include: {
            service: true,
          },
        },
        appointments: {
          where: {
            startTime: { gte: new Date() },
          },
          orderBy: { startTime: 'asc' },
          take: 10,
          include: {
            client: true,
            service: true,
          },
        },
      },
    });

    if (!staff) {
      throw new NotFoundError('Staff');
    }

    res.json({ data: staff });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new staff member
 */
export async function createStaff(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { serviceIds, ...data } = req.body as CreateStaffInput;

    const staff = await prisma.$transaction(async (tx) => {
      // Create staff
      const newStaff = await tx.staff.create({
        data: {
          name: data.name,
          title: data.title,
          isActive: data.isActive ?? true,
          userId: data.userId,
          organizationId: req.user.organizationId,
        },
      });

      // Link services if provided
      if (serviceIds && serviceIds.length > 0) {
        await tx.staffService.createMany({
          data: serviceIds.map((serviceId) => ({
            staffId: newStaff.id,
            serviceId,
          })),
        });
      }

      return newStaff;
    });

    // Fetch with relations
    const staffWithRelations = await prisma.staff.findUnique({
      where: { id: staff.id },
      include: {
        staffServices: {
          include: { service: true },
        },
      },
    });

    res.status(201).json({ data: staffWithRelations });
  } catch (error) {
    next(error);
  }
}

/**
 * Update a staff member
 */
export async function updateStaff(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { serviceIds, ...data } = req.body as UpdateStaffInput;

    // Check if staff exists and belongs to org
    const existing = await prisma.staff.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId,
      },
    });

    if (!existing) {
      throw new NotFoundError('Staff');
    }

    const staff = await prisma.$transaction(async (tx) => {
      // Update staff
      const updated = await tx.staff.update({
        where: { id: req.params.id },
        data,
      });

      // Update service links if provided
      if (serviceIds !== undefined) {
        // Remove existing links
        await tx.staffService.deleteMany({
          where: { staffId: req.params.id },
        });

        // Add new links
        if (serviceIds.length > 0) {
          await tx.staffService.createMany({
            data: serviceIds.map((serviceId) => ({
              staffId: req.params.id,
              serviceId,
            })),
          });
        }
      }

      return updated;
    });

    // Fetch with relations
    const staffWithRelations = await prisma.staff.findUnique({
      where: { id: staff.id },
      include: {
        staffServices: {
          include: { service: true },
        },
      },
    });

    res.json({ data: staffWithRelations });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a staff member
 */
export async function deleteStaff(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Check if staff exists and belongs to org
    const existing = await prisma.staff.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId,
      },
    });

    if (!existing) {
      throw new NotFoundError('Staff');
    }

    await prisma.staff.delete({
      where: { id: req.params.id },
    });

    res.json({ data: { message: 'Staff deleted successfully' } });
  } catch (error) {
    next(error);
  }
}
