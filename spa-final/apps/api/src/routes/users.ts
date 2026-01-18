import { Router, Request, Response } from 'express';
import { prisma } from '@peacase/database';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// ============================================
// GET /api/v1/users
// List staff members
// ============================================
router.get('/', authenticate, async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    where: {
      salonId: req.user!.salonId,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      avatarUrl: true,
      certifications: true,
      lastLogin: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    success: true,
    data: users,
  });
});

// ============================================
// GET /api/v1/users/me
// Get current authenticated user
// ============================================
router.get('/me', authenticate, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      avatarUrl: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'User not found',
      },
    });
  }

  res.json({
    success: true,
    data: user,
  });
});

// ============================================
// GET /api/v1/users/:id
// Get staff member details
// ============================================
router.get('/:id', authenticate, async (req: Request, res: Response) => {
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
});

// ============================================
// POST /api/v1/users
// Create staff member (admin only)
// ============================================
router.post(
  '/',
  authenticate,
  authorize('admin'),
  async (req: Request, res: Response) => {
    const { email, firstName, lastName, phone, role, certifications } = req.body;

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
      },
    });

    res.status(201).json({
      success: true,
      data: user,
    });
  }
);

// ============================================
// PATCH /api/v1/users/:id
// Update staff member
// ============================================
router.patch('/:id', authenticate, async (req: Request, res: Response) => {
  const { firstName, lastName, phone, role, certifications, avatarUrl } = req.body;

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

  // Only admins can change roles
  if (role && req.user!.role !== 'admin') {
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
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(phone && { phone }),
      ...(role && { role }),
      ...(certifications && { certifications }),
      ...(avatarUrl && { avatarUrl }),
    },
  });

  res.json({
    success: true,
    data: user,
  });
});

// ============================================
// DELETE /api/v1/users/:id
// Deactivate staff member (admin only)
// ============================================
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  async (req: Request, res: Response) => {
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
  }
);

export { router as usersRouter };
