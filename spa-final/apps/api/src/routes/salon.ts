import { Router, Request, Response } from 'express';
import { prisma } from '@peacase/database';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// ============================================
// GET /api/v1/salon
// Get current salon details
// ============================================
router.get('/', authenticate, async (req: Request, res: Response) => {
  const salon = await prisma.salon.findUnique({
    where: { id: req.user!.salonId },
  });

  if (!salon) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Salon not found',
      },
    });
  }

  res.json({
    success: true,
    data: salon,
  });
});

// ============================================
// PATCH /api/v1/salon
// Update salon details
// ============================================
router.patch('/', authenticate, async (req: Request, res: Response) => {
  const { name, phone, address, city, state, zip, timezone, website, description } = req.body;

  const salon = await prisma.salon.update({
    where: { id: req.user!.salonId },
    data: {
      ...(name && { name }),
      ...(phone && { phone }),
      ...(address && { address }),
      ...(city && { city }),
      ...(state && { state }),
      ...(zip && { zip }),
      ...(timezone && { timezone }),
      ...(website && { website }),
      ...(description && { description }),
    },
  });

  res.json({
    success: true,
    data: salon,
  });
});

// ============================================
// GET /api/v1/salon/features
// Get enabled features
// ============================================
router.get('/features', authenticate, async (req: Request, res: Response) => {
  const salon = await prisma.salon.findUnique({
    where: { id: req.user!.salonId },
    select: { featuresEnabled: true, subscriptionPlan: true },
  });

  if (!salon) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Salon not found',
      },
    });
  }

  res.json({
    success: true,
    data: {
      plan: salon.subscriptionPlan,
      features: salon.featuresEnabled,
    },
  });
});

export { router as salonRouter };
