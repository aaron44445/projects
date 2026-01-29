import { Router, Request, Response } from 'express';
import { Prisma, prisma } from '@peacase/database';
import { authenticate } from '../middleware/auth.js';
import { requireActiveSubscription, checkPlanLimits } from '../middleware/subscription.js';
import { asyncHandler } from '../lib/errorUtils.js';
import logger from '../lib/logger.js';
import { withSalonId } from '../lib/prismaUtils.js';

const router = Router();

// All client routes require active subscription
router.use(authenticate, requireActiveSubscription());

// ============================================
// GET /api/v1/clients
// List clients with search and pagination
// ============================================
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { search, page = '1', pageSize = '25' } = req.query;

  const parsedPage = parseInt(page as string);
  const parsedPageSize = parseInt(pageSize as string);
  const skip = (parsedPage - 1) * parsedPageSize;

  const where: Prisma.ClientWhereInput = {
    ...withSalonId(req.user!.salonId),
    isActive: true,
    ...(search && {
      OR: [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string } },
      ],
    }),
  };

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: parsedPageSize,
    }),
    prisma.client.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      items: clients,
      total,
      page: parsedPage,
      pageSize: parsedPageSize,
      totalPages: Math.ceil(total / parsedPageSize),
    },
  });
}));

// ============================================
// GET /api/v1/clients/:id
// Get client details with history
// ============================================
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const client = await prisma.client.findFirst({
    where: {
      id: req.params.id,
      salonId: req.user!.salonId,
    },
    include: {
      appointments: {
        orderBy: { startTime: 'desc' },
        take: 10,
        include: {
          service: true,
          staff: {
            select: { firstName: true, lastName: true },
          },
        },
      },
      clientNotes: {
        orderBy: { createdAt: 'desc' },
        include: {
          staff: {
            select: { firstName: true, lastName: true },
          },
        },
      },
    },
  });

  if (!client) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Client not found',
      },
    });
  }

  res.json({
    success: true,
    data: client,
  });
}));

// ============================================
// POST /api/v1/clients
// Create new client
// ============================================
router.post('/', checkPlanLimits('clients'), asyncHandler(async (req: Request, res: Response) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    address,
    city,
    state,
    zip,
    birthday,
    notes,
    preferredStaffId,
    communicationPreference,
  } = req.body;

  // Check for duplicate by phone or email
  if (phone || email) {
    // Build where clause based on what fields are provided
    const whereClause: Prisma.ClientWhereInput = {
      ...withSalonId(req.user!.salonId),
      isActive: true,
    };

    // If both phone and email, use OR
    if (phone && email) {
      whereClause.OR = [
        { phone },
        { email },
      ];
    } else if (phone) {
      // Only phone
      whereClause.phone = phone;
    } else if (email) {
      // Only email
      whereClause.email = email;
    }

    const existing = await prisma.client.findFirst({
      where: whereClause,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CLIENT_EXISTS',
          message: 'A client with this phone or email already exists',
        },
      });
    }
  }

  const client = await prisma.client.create({
    data: {
      salonId: req.user!.salonId,
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      state,
      zip,
      birthday: birthday ? new Date(birthday) : null,
      notes,
      preferredStaffId,
      communicationPreference: communicationPreference || 'email',
    },
  });

  res.status(201).json({
    success: true,
    data: client,
  });
}));

// ============================================
// PATCH /api/v1/clients/:id
// Update client
// ============================================
router.patch('/:id', asyncHandler(async (req: Request, res: Response) => {
  const client = await prisma.client.findFirst({
    where: { id: req.params.id, salonId: req.user!.salonId },
  });

  if (!client) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Client not found',
      },
    });
  }

  const updated = await prisma.client.update({
    where: { id: req.params.id, salonId: req.user!.salonId },
    data: req.body,
  });

  res.json({
    success: true,
    data: updated,
  });
}));

// ============================================
// POST /api/v1/clients/:id/notes
// Add note to client
// ============================================
router.post('/:id/notes', asyncHandler(async (req: Request, res: Response) => {
  const { content } = req.body;

  const client = await prisma.client.findFirst({
    where: { id: req.params.id, salonId: req.user!.salonId },
  });

  if (!client) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Client not found',
      },
    });
  }

  const note = await prisma.clientNote.create({
    data: {
      clientId: req.params.id,
      staffId: req.user!.userId,
      content,
    },
    include: {
      staff: {
        select: { firstName: true, lastName: true },
      },
    },
  });

  res.status(201).json({
    success: true,
    data: note,
  });
}));

// ============================================
// GET /api/v1/clients/segments/counts
// Get client counts by segment for marketing
// ============================================
router.get('/segments/counts', asyncHandler(async (req: Request, res: Response) => {
  const salonId = req.user!.salonId;
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  // Get all active clients count
  const allClientsCount = await prisma.client.count({
    where: { salonId, isActive: true },
  });

  // New clients (joined in last 30 days)
  const newClientsCount = await prisma.client.count({
    where: {
      salonId,
      isActive: true,
      createdAt: { gte: thirtyDaysAgo },
    },
  });

  // Inactive clients (no appointments in 60+ days)
  const inactiveClientsCount = await prisma.client.count({
    where: {
      salonId,
      isActive: true,
      appointments: {
        none: {
          startTime: { gte: sixtyDaysAgo },
        },
      },
    },
  });

  // VIP clients (5+ appointments or total spending > $500)
  // For simplicity, we'll count clients with 5+ appointments
  const vipClients = await prisma.client.findMany({
    where: { salonId, isActive: true },
    select: {
      id: true,
      _count: {
        select: { appointments: true },
      },
    },
  });
  const vipClientsCount = vipClients.filter(c => c._count.appointments >= 5).length;

  res.json({
    success: true,
    data: {
      all: allClientsCount,
      new: newClientsCount,
      inactive: inactiveClientsCount,
      vip: vipClientsCount,
    },
  });
}));

export { router as clientsRouter };
