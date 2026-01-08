import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';
import { NotFoundError } from '../middleware/errorHandler.js';
import {
  CreateClientInput,
  UpdateClientInput,
  paginationSchema,
} from '../schemas/crud.schema.js';

/**
 * List all clients for the organization
 */
export async function listClients(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where: { organizationId: req.user.organizationId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.client.count({
        where: { organizationId: req.user.organizationId },
      }),
    ]);

    res.json({
      data: clients,
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
 * Get a single client by ID
 */
export async function getClient(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const client = await prisma.client.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId,
      },
      include: {
        appointments: {
          orderBy: { startTime: 'desc' },
          take: 10,
          include: {
            service: true,
            staff: true,
          },
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!client) {
      throw new NotFoundError('Client');
    }

    res.json({ data: client });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new client
 */
export async function createClient(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = req.body as CreateClientInput;

    const client = await prisma.client.create({
      data: {
        ...data,
        organizationId: req.user.organizationId,
      },
    });

    res.status(201).json({ data: client });
  } catch (error) {
    next(error);
  }
}

/**
 * Update a client
 */
export async function updateClient(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = req.body as UpdateClientInput;

    // Check if client exists and belongs to org
    const existing = await prisma.client.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId,
      },
    });

    if (!existing) {
      throw new NotFoundError('Client');
    }

    const client = await prisma.client.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ data: client });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a client
 */
export async function deleteClient(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Check if client exists and belongs to org
    const existing = await prisma.client.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId,
      },
    });

    if (!existing) {
      throw new NotFoundError('Client');
    }

    await prisma.client.delete({
      where: { id: req.params.id },
    });

    res.json({ data: { message: 'Client deleted successfully' } });
  } catch (error) {
    next(error);
  }
}
