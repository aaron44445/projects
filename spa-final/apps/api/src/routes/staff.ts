import { Router, Request, Response } from 'express';
import { prisma } from '@peacase/database';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../lib/errorUtils.js';

const router = Router();

// ============================================
// GET /api/v1/staff
// List staff members with services and availability
// ============================================
router.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    where: {
      salonId: req.user!.salonId,
      isActive: true,
    },
    include: {
      staffServices: {
        include: { service: true },
      },
      staffAvailability: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    success: true,
    data: users,
  });
}));

// ============================================
// GET /api/v1/staff/:id
// Get staff member details
// ============================================
router.get('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findFirst({
    where: {
      id: req.params.id,
      salonId: req.user!.salonId,
    },
    include: {
      staffAvailability: true,
      staffServices: {
        include: { service: true },
      },
    },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Staff member not found',
      },
    });
  }

  res.json({
    success: true,
    data: user,
  });
}));

// ============================================
// POST /api/v1/staff
// Create staff member (admin/owner only)
// ============================================
router.post(
  '/',
  authenticate,
  authorize('admin', 'owner'),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, firstName, lastName, phone, role, certifications, commissionRate } = req.body;

    if (!email || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Email, first name, and last name are required',
        },
      });
    }

    // Check if email exists in this salon
    const existing = await prisma.user.findFirst({
      where: { salonId: req.user!.salonId, email },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'A staff member with this email already exists',
        },
      });
    }

    const user = await prisma.user.create({
      data: {
        salonId: req.user!.salonId,
        email,
        firstName,
        lastName,
        phone,
        role: role || 'staff',
        certifications,
        commissionRate: commissionRate ? parseFloat(commissionRate) : null,
      },
      include: {
        staffServices: true,
        staffAvailability: true,
      },
    });

    res.status(201).json({
      success: true,
      data: user,
    });
  })
);

// ============================================
// PATCH /api/v1/staff/:id
// Update staff member
// ============================================
router.patch('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, phone, role, certifications, avatarUrl, commissionRate, isActive, onlineBookingEnabled } = req.body;

  // Check if user can update this staff member
  const targetUser = await prisma.user.findFirst({
    where: { id: req.params.id, salonId: req.user!.salonId },
  });

  if (!targetUser) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Staff member not found',
      },
    });
  }

  // Only admins/owners can change roles
  if (role && !['admin', 'owner'].includes(req.user!.role)) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Only admins can change user roles',
      },
    });
  }

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(phone !== undefined && { phone }),
      ...(role !== undefined && { role }),
      ...(certifications !== undefined && { certifications }),
      ...(avatarUrl !== undefined && { avatarUrl }),
      ...(commissionRate !== undefined && { commissionRate: parseFloat(commissionRate) }),
      ...(isActive !== undefined && { isActive }),
      ...(onlineBookingEnabled !== undefined && { onlineBookingEnabled }),
    },
    include: {
      staffServices: true,
      staffAvailability: true,
    },
  });

  res.json({
    success: true,
    data: user,
  });
}));

// ============================================
// DELETE /api/v1/staff/:id
// Deactivate staff member (admin only)
// ============================================
router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'owner'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = await prisma.user.findFirst({
      where: { id: req.params.id, salonId: req.user!.salonId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Staff member not found',
        },
      });
    }

    // Soft delete
    await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    res.json({
      success: true,
      data: { message: 'Staff member deactivated' },
    });
  })
);

// ============================================
// PUT /api/v1/staff/:id/availability
// Set staff availability schedule
// ============================================
router.put('/:id/availability', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { availability } = req.body;
  const staffId = req.params.id;

  // Verify staff belongs to salon
  const user = await prisma.user.findFirst({
    where: { id: staffId, salonId: req.user!.salonId },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Staff member not found',
      },
    });
  }

  if (!Array.isArray(availability)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Availability must be an array',
      },
    });
  }

  // Delete existing availability and create new
  await prisma.staffAvailability.deleteMany({
    where: { staffId },
  });

  if (availability.length > 0) {
    await prisma.staffAvailability.createMany({
      data: availability.map((a: { dayOfWeek: number; startTime: string; endTime: string; isAvailable?: boolean }) => ({
        staffId,
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
        isAvailable: a.isAvailable !== false,
      })),
    });
  }

  res.json({
    success: true,
    data: { message: 'Availability updated' },
  });
}));

// ============================================
// PUT /api/v1/staff/:id/services
// Set staff services (which services they can perform)
// ============================================
router.put('/:id/services', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { serviceIds } = req.body;
  const staffId = req.params.id;

  // Verify staff belongs to salon
  const user = await prisma.user.findFirst({
    where: { id: staffId, salonId: req.user!.salonId },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Staff member not found',
      },
    });
  }

  if (!Array.isArray(serviceIds)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'serviceIds must be an array',
      },
    });
  }

  // Verify all services belong to this salon
  if (serviceIds.length > 0) {
    const services = await prisma.service.findMany({
      where: {
        id: { in: serviceIds },
        salonId: req.user!.salonId,
      },
    });

    // Verify that all requested service IDs were found
    const foundServiceIds = services.map(s => s.id);
    const missingServiceIds = serviceIds.filter(id => !foundServiceIds.includes(id));

    if (missingServiceIds.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SERVICES',
          message: 'One or more services not found',
        },
      });
    }
  }

  // Delete existing staff services and create new
  await prisma.staffService.deleteMany({
    where: { staffId },
  });

  if (serviceIds.length > 0) {
    await prisma.staffService.createMany({
      data: serviceIds.map((serviceId: string) => ({
        staffId,
        serviceId,
        isAvailable: true,
      })),
    });
  }

  res.json({
    success: true,
    data: { message: 'Staff services updated' },
  });
}));

export { router as staffRouter };
