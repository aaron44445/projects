import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '@peacase/database';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Async error wrapper to properly catch errors in async route handlers
function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Time format validation regex (HH:MM format)
const timeFormatRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

// All routes require authentication
router.use(authenticate);

// GET /api/v1/onboarding/status
router.get('/status', asyncHandler(async (req: Request, res: Response) => {
  const salon = await prisma.salon.findUnique({
    where: { id: req.user!.salonId },
    select: {
      onboardingComplete: true,
      onboardingStep: true,
      businessType: true,
      name: true,
      address: true,
      city: true,
      state: true,
      zip: true,
      phone: true,
      email: true,
      website: true,
    },
  });

  if (!salon) {
    return res.status(404).json({
      success: false,
      error: { code: 'SALON_NOT_FOUND', message: 'Salon not found' },
    });
  }

  res.json({
    success: true,
    data: salon,
  });
}));

// POST /api/v1/onboarding/business-info
const businessInfoSchema = z.object({
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional().or(z.literal('')),
});

router.post('/business-info', authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const data = businessInfoSchema.parse(req.body);

    await prisma.salon.update({
      where: { id: req.user!.salonId },
      data: {
        address: data.address,
        city: data.city,
        state: data.state,
        zip: data.zip,
        phone: data.phone,
        website: data.website || null,
        onboardingStep: 2,
      },
    });

    res.json({ success: true, data: { step: 2 } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.flatten() },
      });
    }
    throw error;
  }
}));

// POST /api/v1/onboarding/working-hours
const workingHoursSchema = z.object({
  hours: z.array(z.object({
    day: z.string(),
    isOpen: z.boolean(),
    open: z.string().regex(timeFormatRegex, 'Open time must be in HH:MM format'),
    close: z.string().regex(timeFormatRegex, 'Close time must be in HH:MM format'),
  })),
});

router.post('/working-hours', authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const data = workingHoursSchema.parse(req.body);

    // Get the admin user for this salon to store availability
    const adminUser = await prisma.user.findFirst({
      where: { salonId: req.user!.salonId, role: 'admin' },
    });

    if (!adminUser) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'Admin user not found' },
      });
    }

    const dayMap: Record<string, number> = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6,
    };

    // Delete existing availability and create new using createMany
    await prisma.staffAvailability.deleteMany({
      where: { staffId: adminUser.id },
    });

    await prisma.staffAvailability.createMany({
      data: data.hours.map(hour => ({
        staffId: adminUser.id,
        dayOfWeek: dayMap[hour.day] ?? 0,
        startTime: hour.open,
        endTime: hour.close,
        isAvailable: hour.isOpen,
      })),
    });

    await prisma.salon.update({
      where: { id: req.user!.salonId },
      data: { onboardingStep: 4 },
    });

    res.json({ success: true, data: { step: 4 } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.flatten() },
      });
    }
    throw error;
  }
}));

// POST /api/v1/onboarding/services
const servicesSchema = z.object({
  services: z.array(z.object({
    name: z.string().min(1),
    duration: z.number().min(15),
    price: z.number().min(0),
    category: z.string().optional(),
  })).min(1),
});

router.post('/services', authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const data = servicesSchema.parse(req.body);

    // Create services using createMany to avoid N+1 queries
    await prisma.service.createMany({
      data: data.services.map(service => ({
        salonId: req.user!.salonId,
        name: service.name,
        durationMinutes: service.duration,
        price: service.price,
      })),
    });

    await prisma.salon.update({
      where: { id: req.user!.salonId },
      data: { onboardingStep: 5 },
    });

    res.json({ success: true, data: { step: 5 } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.flatten() },
      });
    }
    throw error;
  }
}));

// POST /api/v1/onboarding/complete
router.post('/complete', authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  await prisma.salon.update({
    where: { id: req.user!.salonId },
    data: {
      onboardingComplete: true,
      onboardingStep: 6,
    },
  });

  res.json({
    success: true,
    data: { message: 'Onboarding complete', onboardingComplete: true },
  });
}));

export { router as onboardingRouter };
