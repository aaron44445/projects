import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '@peacase/database';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../lib/errorUtils.js';

const router = Router();

// Validation schema
const updatePreferencesSchema = z.object({
  newBookingEmail: z.boolean().optional(),
  cancellationEmail: z.boolean().optional(),
  dailySummaryEmail: z.boolean().optional(),
  weeklySummaryEmail: z.boolean().optional(),
  newReviewEmail: z.boolean().optional(),
  paymentReceivedEmail: z.boolean().optional(),
  notificationEmail: z.string().email().optional().nullable(),
});

// ============================================
// GET /api/v1/owner-notifications
// Get owner notification preferences
// ============================================
router.get(
  '/',
  authenticate,
  authorize('admin', 'manager'),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    // Get or create preferences
    let preferences = await prisma.ownerNotificationPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      // Get user email as default notification email
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      preferences = await prisma.ownerNotificationPreferences.create({
        data: {
          userId,
          notificationEmail: user?.email || null,
        },
      });
    }

    res.json({
      success: true,
      data: {
        newBookingEmail: preferences.newBookingEmail,
        cancellationEmail: preferences.cancellationEmail,
        dailySummaryEmail: preferences.dailySummaryEmail,
        weeklySummaryEmail: preferences.weeklySummaryEmail,
        newReviewEmail: preferences.newReviewEmail,
        paymentReceivedEmail: preferences.paymentReceivedEmail,
        notificationEmail: preferences.notificationEmail,
      },
    });
  })
);

// ============================================
// PATCH /api/v1/owner-notifications
// Update owner notification preferences
// ============================================
router.patch(
  '/',
  authenticate,
  authorize('admin', 'manager'),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const data = updatePreferencesSchema.parse(req.body);

      // Upsert preferences
      const preferences = await prisma.ownerNotificationPreferences.upsert({
        where: { userId },
        create: {
          userId,
          ...data,
        },
        update: data,
      });

      res.json({
        success: true,
        data: {
          newBookingEmail: preferences.newBookingEmail,
          cancellationEmail: preferences.cancellationEmail,
          dailySummaryEmail: preferences.dailySummaryEmail,
          weeklySummaryEmail: preferences.weeklySummaryEmail,
          newReviewEmail: preferences.newReviewEmail,
          paymentReceivedEmail: preferences.paymentReceivedEmail,
          notificationEmail: preferences.notificationEmail,
        },
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
// POST /api/v1/owner-notifications/test
// Send a test notification email
// ============================================
router.post(
  '/test',
  authenticate,
  authorize('admin', 'manager'),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { type } = req.body;

    // Get preferences to find notification email
    const preferences = await prisma.ownerNotificationPreferences.findUnique({
      where: { userId },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { salon: { select: { name: true } } },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }

    const notificationEmail = preferences?.notificationEmail || user.email;

    // In a real implementation, this would send an actual test email
    // For now, we'll just return success
    res.json({
      success: true,
      data: {
        message: `Test ${type || 'notification'} email would be sent to ${notificationEmail}`,
        testType: type || 'general',
        sentTo: notificationEmail,
      },
    });
  })
);

export { router as ownerNotificationsRouter };
