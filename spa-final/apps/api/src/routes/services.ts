import { Router, Request, Response } from 'express';
import { prisma } from '@peacase/database';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createServiceSchema,
  updateServiceSchema,
  createServiceCategorySchema
} from '../validation/schemas.js';

const router = Router();

// ============================================
// GET /api/v1/services
// List all services
// ============================================
router.get('/', authenticate, async (req: Request, res: Response) => {
  const services = await prisma.service.findMany({
    where: {
      salonId: req.user!.salonId,
      isActive: true,
    },
    include: {
      category: true,
    },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  });

  res.json({
    success: true,
    data: services,
  });
});

// ============================================
// GET /api/v1/services/categories
// List service categories
// ============================================
router.get('/categories', authenticate, async (req: Request, res: Response) => {
  const categories = await prisma.serviceCategory.findMany({
    where: { salonId: req.user!.salonId },
    include: {
      services: {
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      },
    },
    orderBy: { displayOrder: 'asc' },
  });

  res.json({
    success: true,
    data: categories,
  });
});

// ============================================
// POST /api/v1/services/categories
// Create service category
// ============================================
router.post(
  '/categories',
  authenticate,
  authorize('admin', 'manager'),
  async (req: Request, res: Response) => {
    // Validate request body
    const validationResult = createServiceCategorySchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid category data',
          details: validationResult.error.errors,
        },
      });
    }

    const { name, description } = validationResult.data;

    const category = await prisma.serviceCategory.create({
      data: {
        salonId: req.user!.salonId,
        name,
        description,
      },
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  }
);

// ============================================
// GET /api/v1/services/:id
// Get service details
// ============================================
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const service = await prisma.service.findFirst({
    where: {
      id: req.params.id,
      salonId: req.user!.salonId,
    },
    include: {
      category: true,
      staffServices: {
        include: {
          staff: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      },
    },
  });

  if (!service) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Service not found',
      },
    });
  }

  res.json({
    success: true,
    data: service,
  });
});

// ============================================
// POST /api/v1/services
// Create new service
// ============================================
router.post(
  '/',
  authenticate,
  authorize('admin', 'manager'),
  async (req: Request, res: Response) => {
    // Validate request body
    const validationResult = createServiceSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid service data',
          details: validationResult.error.errors,
        },
      });
    }

    const {
      name,
      description,
      durationMinutes,
      bufferMinutes,
      price,
      memberPrice,
      color,
      categoryId,
    } = validationResult.data;

    const service = await prisma.service.create({
      data: {
        salonId: req.user!.salonId,
        name,
        description,
        durationMinutes,
        bufferMinutes,
        price,
        memberPrice,
        color,
        categoryId,
      },
    });

    res.status(201).json({
      success: true,
      data: service,
    });
  }
);

// ============================================
// PATCH /api/v1/services/:id
// Update service
// ============================================
router.patch(
  '/:id',
  authenticate,
  authorize('admin', 'manager'),
  async (req: Request, res: Response) => {
    // Validate request body
    const validationResult = updateServiceSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid service data',
          details: validationResult.error.errors,
        },
      });
    }

    const service = await prisma.service.findFirst({
      where: { id: req.params.id, salonId: req.user!.salonId },
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Service not found',
        },
      });
    }

    // Only update whitelisted fields from validated data
    const updated = await prisma.service.update({
      where: { id: req.params.id },
      data: validationResult.data,
    });

    res.json({
      success: true,
      data: updated,
    });
  }
);

// ============================================
// DELETE /api/v1/services/:id
// Deactivate service
// ============================================
router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'manager'),
  async (req: Request, res: Response) => {
    const service = await prisma.service.findFirst({
      where: { id: req.params.id, salonId: req.user!.salonId },
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Service not found',
        },
      });
    }

    await prisma.service.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    res.json({
      success: true,
      data: { message: 'Service deactivated' },
    });
  }
);

export { router as servicesRouter };
