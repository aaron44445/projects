import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { prisma } from '@peacase/database';
import { asyncHandler } from '../lib/errorUtils.js';

export const locationsRouter = Router();

// Debug endpoint - no auth required
locationsRouter.get('/debug', (req, res) => {
  res.json({ success: true, message: 'Locations router is loaded' });
});

// All routes require authentication
locationsRouter.use(authenticate);

/**
 * GET /api/v1/locations
 * List all locations for the authenticated user's salon
 */
locationsRouter.get('/', asyncHandler(async (req, res, next) => {
  try {
    const { salonId } = req.user!;

    const locations = await prisma.location.findMany({
      where: { salonId },
      orderBy: [
        { isPrimary: 'desc' },
        { name: 'asc' },
      ],
    });

    res.json({ success: true, data: locations });
  } catch (error) {
    next(error);
  }
}));

/**
 * GET /api/v1/locations/:id
 * Get specific location details
 */
locationsRouter.get('/:id', asyncHandler(async (req, res, next) => {
  try {
    const { salonId } = req.user!;
    const { id } = req.params;

    const location = await prisma.location.findFirst({
      where: { id, salonId },
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Location not found' },
      });
    }

    res.json({ success: true, data: location });
  } catch (error) {
    next(error);
  }
}));

/**
 * POST /api/v1/locations
 * Create a new location (admin/owner only)
 */
locationsRouter.post('/', authorize('admin', 'owner'), asyncHandler(async (req, res, next) => {
  try {
    const { salonId } = req.user!;
    const { name, address, city, state, zip, phone, timezone, isPrimary } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Name is required' },
      });
    }

    // Check if salon has multi-location enabled
    const salon = await prisma.salon.findUnique({
      where: { id: salonId },
      include: {
        _count: {
          select: { locations: true },
        },
      },
    });

    const existingLocationCount = salon?._count.locations || 0;

    // If this is the second location and multi-location is not enabled, reject
    if (existingLocationCount >= 1 && !salon?.multiLocationEnabled) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MULTI_LOCATION_REQUIRED',
          message: 'Multi-location feature required to add additional locations',
        },
      });
    }

    // If setting as primary, clear other primary flags
    if (isPrimary) {
      await prisma.location.updateMany({
        where: { salonId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const location = await prisma.location.create({
      data: {
        salonId,
        name,
        address,
        city,
        state,
        zip,
        phone,
        timezone,
        isPrimary: isPrimary || existingLocationCount === 0, // First location is always primary
      },
    });

    res.status(201).json({ success: true, data: location });
  } catch (error) {
    next(error);
  }
}));

/**
 * PATCH /api/v1/locations/:id
 * Update location details (admin/owner only)
 */
locationsRouter.patch('/:id', authorize('admin', 'owner'), asyncHandler(async (req, res, next) => {
  try {
    const { salonId } = req.user!;
    const { id } = req.params;
    const updates = req.body;

    const location = await prisma.location.findFirst({
      where: { id, salonId },
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Location not found' },
      });
    }

    // If setting as primary, clear other primary flags
    if (updates.isPrimary === true) {
      await prisma.location.updateMany({
        where: { salonId, isPrimary: true, id: { not: id } },
        data: { isPrimary: false },
      });
    }

    const updatedLocation = await prisma.location.update({
      where: { id },
      data: updates,
    });

    res.json({ success: true, data: updatedLocation });
  } catch (error) {
    next(error);
  }
}));

/**
 * DELETE /api/v1/locations/:id
 * Delete a location (admin/owner only)
 */
locationsRouter.delete('/:id', authorize('admin', 'owner'), asyncHandler(async (req, res, next) => {
  try {
    const { salonId } = req.user!;
    const { id } = req.params;

    const location = await prisma.location.findFirst({
      where: { id, salonId },
      include: {
        _count: {
          select: { appointments: true },
        },
      },
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Location not found' },
      });
    }

    // Check if primary location with other locations
    if (location.isPrimary) {
      const otherLocations = await prisma.location.count({
        where: { salonId, id: { not: id } },
      });

      if (otherLocations > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CANNOT_DELETE_PRIMARY',
            message: 'Cannot delete primary location while other locations exist',
          },
        });
      }
    }

    // Check for future appointments
    const futureAppointments = await prisma.appointment.count({
      where: {
        locationId: id,
        startTime: { gte: new Date() },
        status: { in: ['pending', 'confirmed'] },
      },
    });

    if (futureAppointments > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'HAS_FUTURE_APPOINTMENTS',
          message: 'Cannot delete location with future appointments',
        },
      });
    }

    await prisma.location.delete({ where: { id } });

    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    next(error);
  }
}));

/**
 * GET /api/v1/locations/:id/staff
 * Get staff assigned to this location
 */
locationsRouter.get('/:id/staff', asyncHandler(async (req, res, next) => {
  try {
    const { salonId } = req.user!;
    const { id } = req.params;

    const location = await prisma.location.findFirst({
      where: { id, salonId },
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Location not found' },
      });
    }

    const staffLocations = await prisma.staffLocation.findMany({
      where: { locationId: id },
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    const staff = staffLocations.map((sl) => ({
      ...sl.staff,
      isPrimaryLocation: sl.isPrimary,
    }));

    res.json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
}));

/**
 * POST /api/v1/locations/:id/staff
 * Assign staff to location (admin/owner only)
 */
locationsRouter.post('/:id/staff', authorize('admin', 'owner'), asyncHandler(async (req, res, next) => {
  try {
    const { salonId } = req.user!;
    const { id } = req.params;
    const { staffId, isPrimary } = req.body;

    if (!staffId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'staffId is required' },
      });
    }

    const location = await prisma.location.findFirst({
      where: { id, salonId },
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Location not found' },
      });
    }

    const staff = await prisma.user.findFirst({
      where: { id: staffId, salonId },
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Staff not found' },
      });
    }

    const staffLocation = await prisma.staffLocation.create({
      data: {
        staffId,
        locationId: id,
        isPrimary: isPrimary || false,
      },
    });

    res.json({ success: true, data: staffLocation });
  } catch (error) {
    next(error);
  }
}));

/**
 * DELETE /api/v1/locations/:id/staff/:staffId
 * Remove staff from location (admin/owner only)
 */
locationsRouter.delete('/:id/staff/:staffId', authorize('admin', 'owner'), asyncHandler(async (req, res, next) => {
  try {
    const { salonId } = req.user!;
    const { id, staffId } = req.params;

    // Check for future appointments
    const futureAppointments = await prisma.appointment.count({
      where: {
        locationId: id,
        staffId,
        startTime: { gte: new Date() },
        status: { in: ['pending', 'confirmed'] },
      },
    });

    if (futureAppointments > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'HAS_FUTURE_APPOINTMENTS',
          message: 'Cannot remove staff with future appointments at this location',
        },
      });
    }

    const staffLocation = await prisma.staffLocation.findFirst({
      where: { locationId: id, staffId },
    });

    if (!staffLocation) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Staff assignment not found' },
      });
    }

    await prisma.staffLocation.delete({
      where: {
        staffId_locationId: {
          staffId,
          locationId: id,
        },
      },
    });

    res.json({ success: true, data: { removed: true } });
  } catch (error) {
    next(error);
  }
}));

/**
 * GET /api/v1/locations/:id/services
 * Get services available at this location with overrides
 */
locationsRouter.get('/:id/services', asyncHandler(async (req, res, next) => {
  try {
    const { salonId } = req.user!;
    const { id } = req.params;

    const location = await prisma.location.findFirst({
      where: { id, salonId },
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Location not found' },
      });
    }

    const serviceLocations = await prisma.serviceLocation.findMany({
      where: { locationId: id },
      include: {
        service: true,
      },
    });

    const services = serviceLocations.map((sl) => ({
      ...sl.service,
      effectivePrice: sl.priceOverride !== null ? Number(sl.priceOverride) : sl.service.price,
      effectiveDuration: sl.durationOverride !== null ? Number(sl.durationOverride) : sl.service.durationMinutes,
      hasOverride: !!(sl.priceOverride || sl.durationOverride),
    }));

    res.json({ success: true, data: services });
  } catch (error) {
    next(error);
  }
}));

/**
 * PUT /api/v1/locations/:id/services/:serviceId
 * Update service settings for location (admin/owner only)
 */
locationsRouter.put('/:id/services/:serviceId', authorize('admin', 'owner'), asyncHandler(async (req, res, next) => {
  try {
    const { salonId } = req.user!;
    const { id, serviceId } = req.params;
    const { isEnabled, priceOverride, durationOverride } = req.body;

    const service = await prisma.service.findFirst({
      where: { id: serviceId, salonId },
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Service not found' },
      });
    }

    const serviceLocation = await prisma.serviceLocation.upsert({
      where: {
        serviceId_locationId: {
          serviceId,
          locationId: id,
        },
      },
      create: {
        serviceId,
        locationId: id,
        isEnabled,
        priceOverride,
        durationOverride,
      },
      update: {
        isEnabled,
        priceOverride,
        durationOverride,
      },
    });

    res.json({
      success: true,
      data: {
        ...serviceLocation,
        effectivePrice: priceOverride ?? service.price,
        effectiveDuration: durationOverride ?? service.durationMinutes,
      },
    });
  } catch (error) {
    next(error);
  }
}));

/**
 * DELETE /api/v1/locations/:id/services/:serviceId
 * Remove service overrides for location (admin/owner only)
 */
locationsRouter.delete('/:id/services/:serviceId', authorize('admin', 'owner'), asyncHandler(async (req, res, next) => {
  try {
    const { id, serviceId } = req.params;

    const serviceLocation = await prisma.serviceLocation.findUnique({
      where: {
        serviceId_locationId: {
          serviceId,
          locationId: id,
        },
      },
    });

    if (!serviceLocation) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Service override not found' },
      });
    }

    await prisma.serviceLocation.delete({
      where: {
        serviceId_locationId: {
          serviceId,
          locationId: id,
        },
      },
    });

    res.json({ success: true, data: { reset: true } });
  } catch (error) {
    next(error);
  }
}));
