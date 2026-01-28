import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '@peacase/database';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../lib/errorUtils.js';
import { passwordSchema } from '../lib/passwordValidation.js';

const router = Router();

// Validation schemas
const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  locale: z.string().optional().nullable(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

// ============================================
// GET /api/v1/account/profile
// Get current user profile
// ============================================
router.get(
  '/profile',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        locale: true,
        role: true,
        avatarUrl: true,
        emailVerified: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }

    res.json({
      success: true,
      data: user,
    });
  })
);

// ============================================
// PATCH /api/v1/account/profile
// Update current user profile
// ============================================
router.patch(
  '/profile',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const data = updateProfileSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        locale: true,
        role: true,
        avatarUrl: true,
        emailVerified: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    res.json({
      success: true,
      data: user,
    });
  })
);

// ============================================
// POST /api/v1/account/change-password
// Change current user password
// ============================================
router.post(
  '/change-password',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const data = changePasswordSchema.parse(req.body);

      // Get user with password hash
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, passwordHash: true },
      });

      if (!user || !user.passwordHash) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_PASSWORD', message: 'Account does not have a password set' },
        });
      }

      // Verify current password
      const isValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_PASSWORD', message: 'Current password is incorrect' },
        });
      }

      // Hash and update new password
      const newPasswordHash = await bcrypt.hash(data.newPassword, 12);
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      });

      // Invalidate all other sessions (security: force re-login on other devices)
      await prisma.userSession.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true },
      });

      res.json({
        success: true,
        data: { message: 'Password changed successfully' },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.flatten().fieldErrors;
        const firstField = Object.keys(fieldErrors)[0];
        const firstMessage = firstField && fieldErrors[firstField]?.[0]
          ? fieldErrors[firstField]![0]
          : 'Please check your input';

        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: firstMessage },
        });
      }
      throw error;
    }
  })
);

// ============================================
// GET /api/v1/account/sessions
// List active sessions
// ============================================
router.get(
  '/sessions',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const sessions = await prisma.userSession.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActive: 'desc' },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        location: true,
        lastActive: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: sessions,
    });
  })
);

// ============================================
// DELETE /api/v1/account/sessions/:id
// Revoke a specific session
// ============================================
router.delete(
  '/sessions/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const sessionId = req.params.id;

    const session = await prisma.userSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Session not found' },
      });
    }

    await prisma.userSession.update({
      where: { id: sessionId },
      data: { isRevoked: true },
    });

    res.json({
      success: true,
      data: { message: 'Session revoked' },
    });
  })
);

// ============================================
// DELETE /api/v1/account/sessions
// Revoke all other sessions
// ============================================
router.delete(
  '/sessions',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    // Get current session token hash from header to preserve current session
    const authHeader = req.headers.authorization;
    let currentTokenHash: string | null = null;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      currentTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    }

    // Revoke all sessions except current
    const result = await prisma.userSession.updateMany({
      where: {
        userId,
        isRevoked: false,
        ...(currentTokenHash ? { tokenHash: { not: currentTokenHash } } : {}),
      },
      data: { isRevoked: true },
    });

    res.json({
      success: true,
      data: { message: `${result.count} sessions revoked` },
    });
  })
);

// ============================================
// GET /api/v1/account/login-history
// Get login history
// ============================================
router.get(
  '/login-history',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 20;

    const history = await prisma.loginHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        location: true,
        success: true,
        failReason: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: history,
    });
  })
);

// ============================================
// POST /api/v1/account/data-export
// Request data export (GDPR)
// ============================================
router.post(
  '/data-export',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const salonId = req.user!.salonId;

    // Get comprehensive user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        salon: {
          select: {
            name: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            zip: true,
            country: true,
          },
        },
        staffServices: {
          include: {
            service: { select: { name: true } },
          },
        },
        staffLocations: {
          include: {
            location: { select: { name: true } },
          },
        },
        appointments: {
          take: 100,
          orderBy: { createdAt: 'desc' },
          select: {
            startTime: true,
            endTime: true,
            status: true,
            price: true,
            notes: true,
            createdAt: true,
          },
        },
        loginHistory: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          select: {
            ipAddress: true,
            location: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }

    // Format data for export
    const exportData = {
      exportedAt: new Date().toISOString(),
      personalInfo: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
      businessInfo: user.salon,
      services: user.staffServices.map(ss => ss.service.name),
      locations: user.staffLocations.map(sl => sl.location.name),
      recentAppointments: user.appointments,
      recentLoginHistory: user.loginHistory,
    };

    res.json({
      success: true,
      data: exportData,
    });
  })
);

// ============================================
// POST /api/v1/account/delete-request
// Request account deletion
// ============================================
router.post(
  '/delete-request',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const salonId = req.user!.salonId;
    const { reason } = req.body;

    // Check if there's already a pending deletion request
    const existingRequest = await prisma.accountDeletionRequest.findFirst({
      where: { userId, status: 'pending' },
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_REQUESTED',
          message: 'A deletion request is already pending',
          scheduledDeletion: existingRequest.scheduledDeletion,
        },
      });
    }

    // Create deletion request (30 days grace period)
    const scheduledDeletion = new Date();
    scheduledDeletion.setDate(scheduledDeletion.getDate() + 30);

    const request = await prisma.accountDeletionRequest.create({
      data: {
        userId,
        salonId,
        reason,
        scheduledDeletion,
      },
    });

    res.json({
      success: true,
      data: {
        message: 'Account deletion requested. Your account will be deleted in 30 days.',
        scheduledDeletion: request.scheduledDeletion,
        canCancel: true,
      },
    });
  })
);

// ============================================
// DELETE /api/v1/account/delete-request
// Cancel account deletion request
// ============================================
router.delete(
  '/delete-request',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const request = await prisma.accountDeletionRequest.findFirst({
      where: { userId, status: 'pending' },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'No pending deletion request found' },
      });
    }

    await prisma.accountDeletionRequest.update({
      where: { id: request.id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: { message: 'Account deletion request cancelled' },
    });
  })
);

// ============================================
// GET /api/v1/account/delete-request
// Get current deletion request status
// ============================================
router.get(
  '/delete-request',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const request = await prisma.accountDeletionRequest.findFirst({
      where: { userId, status: 'pending' },
      select: {
        id: true,
        status: true,
        reason: true,
        scheduledDeletion: true,
        requestedAt: true,
      },
    });

    res.json({
      success: true,
      data: request,
    });
  })
);

export { router as accountRouter };
