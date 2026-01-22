import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '@peacase/database';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../lib/errorUtils.js';
import {
  PERMISSIONS,
  ROLES,
  requirePermission,
  hasPermission,
  isRoleAtLeast,
  getUserLocationIds,
} from '../middleware/permissions.js';

const router = Router();

// ============================================
// GET /api/v1/users
// List staff members
// ============================================
router.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  // Check if user can view all staff
  if (!hasPermission(req.user!.role, PERMISSIONS.VIEW_ALL_STAFF)) {
    // Staff can only see themselves
    const self = await prisma.user.findUnique({
      where: { id: req.user!.userId },
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
    });
    return res.json({
      success: true,
      data: self ? [self] : [],
    });
  }

  // Get location filter for managers
  const userLocations = await getUserLocationIds(
    req.user!.userId,
    req.user!.salonId,
    req.user!.role
  );

  let staffFilter: any = {
    salonId: req.user!.salonId,
    isActive: true,
  };

  // If manager, only show staff from their locations
  if (userLocations !== null && req.user!.role === ROLES.MANAGER) {
    const staffInLocations = await prisma.staffLocation.findMany({
      where: { locationId: { in: userLocations } },
      select: { staffId: true },
    });
    const staffIds = staffInLocations.map((sl) => sl.staffId);
    staffFilter.id = { in: staffIds };
  }

  const users = await prisma.user.findMany({
    where: staffFilter,
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
      staffLocations: {
        include: { location: { select: { id: true, name: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    success: true,
    data: users,
  });
}));

// ============================================
// GET /api/v1/users/me
// Get current authenticated user
// ============================================
router.get('/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
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
      staffLocations: {
        include: { location: { select: { id: true, name: true } } },
      },
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

  // Get user's permissions
  const permissions = Object.values(PERMISSIONS).filter((p) =>
    hasPermission(user.role, p)
  );

  res.json({
    success: true,
    data: {
      ...user,
      permissions,
    },
  });
}));

// ============================================
// GET /api/v1/users/:id
// Get staff member details
// ============================================
router.get('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  // Staff can only view themselves
  if (
    !hasPermission(req.user!.role, PERMISSIONS.VIEW_ALL_STAFF) &&
    req.params.id !== req.user!.userId
  ) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You can only view your own profile',
      },
    });
  }

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
      staffLocations: {
        include: { location: true },
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
// POST /api/v1/users
// Create staff member (requires CREATE_STAFF permission)
// ============================================
router.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.CREATE_STAFF),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, firstName, lastName, phone, role, certifications, locationIds } =
      req.body;

    // Validate role - can't create a user with higher role than yourself
    if (role && !isRoleAtLeast(req.user!.role, role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Cannot create a user with higher privileges than your own',
        },
      });
    }

    // Managers can only create staff/receptionist roles
    if (
      req.user!.role === ROLES.MANAGER &&
      role &&
      !['staff', 'receptionist'].includes(role)
    ) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Managers can only create staff or receptionist accounts',
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

    // Create user
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

    // Assign to locations if provided (batch create for better performance)
    if (locationIds && Array.isArray(locationIds) && locationIds.length > 0) {
      await prisma.staffLocation.createMany({
        data: locationIds.map((locId: string, idx: number) => ({
          staffId: user.id,
          locationId: locId,
          isPrimary: idx === 0,
        })),
      });
    }

    // Workaround: Fetch user and staffLocations separately due to Prisma include issue
    const [userRecord, staffLocations] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
      }),
      prisma.staffLocation.findMany({
        where: { staffId: user.id },
        include: { location: { select: { id: true, name: true } } },
      }),
    ]);

    // Manually attach staffLocations to user
    const userWithLocations = {
      ...userRecord,
      staffLocations,
    };

    res.status(201).json({
      success: true,
      data: userWithLocations,
    });
  })
);

// ============================================
// PATCH /api/v1/users/:id
// Update staff member
// ============================================
router.patch('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const {
    firstName,
    lastName,
    phone,
    role,
    certifications,
    avatarUrl,
    locationIds,
  } = req.body;

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

  // Check edit permissions
  const isSelf = req.params.id === req.user!.userId;
  const canEditOthers = hasPermission(req.user!.role, PERMISSIONS.EDIT_STAFF);

  if (!isSelf && !canEditOthers) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You can only edit your own profile',
      },
    });
  }

  // Role change requires specific permission
  if (role && role !== targetUser.role) {
    if (!hasPermission(req.user!.role, PERMISSIONS.CHANGE_STAFF_ROLE)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to change user roles',
        },
      });
    }

    // Can't promote someone to a higher role than yourself
    if (!isRoleAtLeast(req.user!.role, role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Cannot assign a role higher than your own',
        },
      });
    }

    // Can't demote an owner unless you're also an owner
    if (targetUser.role === ROLES.OWNER && req.user!.role !== ROLES.OWNER) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only owners can modify other owner accounts',
        },
      });
    }
  }

  // Update user
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(phone !== undefined && { phone }),
      ...(role && { role }),
      ...(certifications !== undefined && { certifications }),
      ...(avatarUrl !== undefined && { avatarUrl }),
    },
  });

  // Update location assignments if provided
  if (locationIds !== undefined && hasPermission(req.user!.role, PERMISSIONS.EDIT_STAFF)) {
    // Remove existing assignments
    await prisma.staffLocation.deleteMany({
      where: { staffId: req.params.id },
    });

    // Add new assignments (batch create for better performance)
    if (Array.isArray(locationIds) && locationIds.length > 0) {
      await prisma.staffLocation.createMany({
        data: locationIds.map((locId: string, idx: number) => ({
          staffId: req.params.id,
          locationId: locId,
          isPrimary: idx === 0,
        })),
      });
    }
  }

  // Workaround: Fetch user and staffLocations separately due to Prisma include issue
  const [updatedUser, staffLocations] = await Promise.all([
    prisma.user.findUnique({
      where: { id: req.params.id },
    }),
    prisma.staffLocation.findMany({
      where: { staffId: req.params.id },
      include: { location: { select: { id: true, name: true } } },
    }),
  ]);

  res.json({
    success: true,
    data: {
      ...updatedUser,
      staffLocations,
    },
  });
}));

// ============================================
// DELETE /api/v1/users/:id
// Deactivate staff member (requires DELETE_STAFF permission)
// ============================================
router.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.DELETE_STAFF),
  asyncHandler(async (req: Request, res: Response) => {
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

    // Can't delete yourself
    if (req.params.id === req.user!.userId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OPERATION',
          message: 'Cannot deactivate your own account',
        },
      });
    }

    // Can't delete someone with higher/equal role unless you're owner
    if (
      isRoleAtLeast(targetUser.role, req.user!.role) &&
      req.user!.role !== ROLES.OWNER
    ) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Cannot deactivate a user with equal or higher privileges',
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
// POST /api/v1/users/change-password
// Change own password
// ============================================
router.post('/change-password', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Current password and new password are required',
      },
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
  });

  if (!user || !user.passwordHash) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_OPERATION',
        message: 'Cannot change password for this account type',
      },
    });
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_PASSWORD',
        message: 'Current password is incorrect',
      },
    });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: req.user!.userId },
    data: { passwordHash: hashedPassword },
  });

  res.json({
    success: true,
    data: { message: 'Password changed successfully' },
  });
}));

export { router as usersRouter };
