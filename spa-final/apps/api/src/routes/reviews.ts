import { Router, Request, Response } from 'express';
import { prisma } from '@peacase/database';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// ============================================
// GET /api/v1/reviews
// List reviews with filters (status, rating, pagination)
// ============================================
router.get('/', authenticate, async (req: Request, res: Response) => {
  const { status, rating, page = '1', pageSize = '25' } = req.query;

  const where = {
    salonId: req.user!.salonId,
    ...(status === 'approved' && { isApproved: true }),
    ...(status === 'pending' && { isApproved: false }),
    ...(rating && { rating: parseInt(rating as string) }),
  };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      skip: (parseInt(page as string) - 1) * parseInt(pageSize as string),
      take: parseInt(pageSize as string),
      include: {
        client: {
          select: { firstName: true, lastName: true, email: true },
        },
        appointment: {
          select: {
            startTime: true,
            service: {
              select: { name: true },
            },
            staff: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        responses: {
          include: {
            respondedBy: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    }),
    prisma.review.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      items: reviews,
      total,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
      totalPages: Math.ceil(total / parseInt(pageSize as string)),
    },
  });
});

// ============================================
// POST /api/v1/reviews/:id/respond
// Add response to review
// ============================================
router.post(
  '/:id/respond',
  authenticate,
  authorize('admin', 'manager'),
  async (req: Request, res: Response) => {
    const { responseText } = req.body;

    if (!responseText) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Response text is required',
        },
      });
    }

    // Verify review exists and belongs to this salon
    const review = await prisma.review.findFirst({
      where: {
        id: req.params.id,
        salonId: req.user!.salonId,
      },
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Review not found',
        },
      });
    }

    const response = await prisma.reviewResponse.create({
      data: {
        reviewId: req.params.id,
        responseText,
        respondedById: req.user!.userId,
      },
      include: {
        respondedBy: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: response,
    });
  }
);

// ============================================
// PATCH /api/v1/reviews/:id/approve
// Approve a review
// ============================================
router.patch(
  '/:id/approve',
  authenticate,
  authorize('admin', 'manager'),
  async (req: Request, res: Response) => {
    // Verify review exists and belongs to this salon
    const review = await prisma.review.findFirst({
      where: {
        id: req.params.id,
        salonId: req.user!.salonId,
      },
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Review not found',
        },
      });
    }

    const updated = await prisma.review.update({
      where: { id: req.params.id },
      data: {
        isApproved: true,
        approvedAt: new Date(),
      },
      include: {
        client: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    res.json({
      success: true,
      data: updated,
    });
  }
);

export { router as reviewsRouter };
