import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '@peacase/database';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/onboarding/status
router.get('/status', async (req: Request, res: Response) => {
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

  res.json({
    success: true,
    data: salon,
  });
});

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

router.post('/business-info', async (req: Request, res: Response) => {
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
});

// POST /api/v1/onboarding/working-hours
const workingHoursSchema = z.object({
  hours: z.array(z.object({
    day: z.string(),
    isOpen: z.boolean(),
    open: z.string(),
    close: z.string(),
  })),
});

router.post('/working-hours', async (req: Request, res: Response) => {
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

    // Delete existing availability and create new
    await prisma.staffAvailability.deleteMany({
      where: { staffId: adminUser.id },
    });

    const dayMap: Record<string, number> = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6,
    };

    for (const hour of data.hours) {
      await prisma.staffAvailability.create({
        data: {
          staffId: adminUser.id,
          dayOfWeek: dayMap[hour.day] ?? 0,
          startTime: hour.open,
          endTime: hour.close,
          isAvailable: hour.isOpen,
        },
      });
    }

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
});

// POST /api/v1/onboarding/services
const servicesSchema = z.object({
  services: z.array(z.object({
    name: z.string().min(1),
    duration: z.number().min(15),
    price: z.number().min(0),
    category: z.string().optional(),
  })).min(1),
});

router.post('/services', async (req: Request, res: Response) => {
  try {
    const data = servicesSchema.parse(req.body);

    // Create services
    for (const service of data.services) {
      await prisma.service.create({
        data: {
          salonId: req.user!.salonId,
          name: service.name,
          durationMinutes: service.duration,
          price: service.price,
        },
      });
    }

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
});

// POST /api/v1/onboarding/complete
router.post('/complete', async (req: Request, res: Response) => {
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
});

export { router as onboardingRouter };
