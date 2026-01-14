import { Router, Request, Response } from 'express';
import { prisma } from '@peacase/database';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// ============================================
// GET /api/v1/clients
// List clients with search and pagination
// ============================================
router.get('/', authenticate, async (req: Request, res: Response) => {
  const { search, page = '1', pageSize = '25' } = req.query;

  const where = {
    salonId: req.user!.salonId,
    isActive: true,
    ...(search && {
      OR: [
        { firstName: { contains: search as string, mode: 'insensitive' as const } },
        { lastName: { contains: search as string, mode: 'insensitive' as const } },
        { email: { contains: search as string, mode: 'insensitive' as const } },
        { phone: { contains: search as string } },
      ],
    }),
  };

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page as string) - 1) * parseInt(pageSize as string),
      take: parseInt(pageSize as string),
    }),
    prisma.client.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      items: clients,
      total,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
      totalPages: Math.ceil(total / parseInt(pageSize as string)),
    },
  });
});

// ============================================
// GET /api/v1/clients/:id
// Get client details with history
// ============================================
router.get('/:id', authenticate, async (req: Request, res: Response) => {
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
});

// ============================================
// POST /api/v1/clients
// Create new client
// ============================================
router.post('/', authenticate, async (req: Request, res: Response) => {
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
    const existing = await prisma.client.findFirst({
      where: {
        salonId: req.user!.salonId,
        isActive: true,
        OR: [
          ...(phone ? [{ phone }] : []),
          ...(email ? [{ email }] : []),
        ],
      },
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
});

// ============================================
// PATCH /api/v1/clients/:id
// Update client
// ============================================
router.patch('/:id', authenticate, async (req: Request, res: Response) => {
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
    where: { id: req.params.id },
    data: req.body,
  });

  res.json({
    success: true,
    data: updated,
  });
});

// ============================================
// POST /api/v1/clients/:id/notes
// Add note to client
// ============================================
router.post('/:id/notes', authenticate, async (req: Request, res: Response) => {
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
});

// ============================================
// GET /api/v1/clients/segments/counts
// Get client counts by segment for marketing
// ============================================
router.get('/segments/counts', authenticate, async (req: Request, res: Response) => {
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
});

export { router as clientsRouter };
