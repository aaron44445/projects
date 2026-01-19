import { Router, Request, Response } from 'express';
import { prisma } from '@peacase/database';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// ============================================
// GET /api/v1/salon/setup-progress
// Get setup progress for the current salon
// ============================================
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    let progress = await prisma.setupProgress.findUnique({
      where: { salonId: user.salonId },
    });

    if (!progress) {
      progress = await prisma.setupProgress.create({
        data: { salonId: user.salonId },
      });
    }

    res.json({ success: true, data: { setupProgress: progress } });
  } catch (error) {
    console.error('Get setup progress error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to get setup progress',
      },
    });
  }
});

// ============================================
// PATCH /api/v1/salon/setup-progress
// Update setup progress for the current salon
// ============================================
router.patch('/', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const updates = req.body;

    // Only allow specific fields to be updated
    const allowedFields = ['businessHours', 'firstService', 'firstStaff', 'bookingPage', 'paymentMethod'];
    const filteredUpdates: Record<string, boolean> = {};
    for (const field of allowedFields) {
      if (typeof updates[field] === 'boolean') {
        filteredUpdates[field] = updates[field];
      }
    }

    let progress = await prisma.setupProgress.upsert({
      where: { salonId: user.salonId },
      update: filteredUpdates,
      create: { salonId: user.salonId, ...filteredUpdates },
    });

    // Check if all steps are complete
    const allComplete =
      progress.businessHours &&
      progress.firstService &&
      progress.firstStaff &&
      progress.bookingPage &&
      progress.paymentMethod;

    // Mark as completed if all steps done and not already marked
    if (allComplete && !progress.completedAt) {
      progress = await prisma.setupProgress.update({
        where: { salonId: user.salonId },
        data: { completedAt: new Date() },
      });
    }

    res.json({ success: true, data: { setupProgress: progress } });
  } catch (error) {
    console.error('Update setup progress error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to update setup progress',
      },
    });
  }
});

export { router as setupProgressRouter };
