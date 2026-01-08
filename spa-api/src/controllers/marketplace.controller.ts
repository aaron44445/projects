import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';
import { generateUniqueProfileSlug } from '../lib/consumer.js';

// ============================================
// MARKETPLACE PROFILE MANAGEMENT
// ============================================

/**
 * GET /api/marketplace/profile
 * Get current organization's marketplace profile
 */
export async function getMarketplaceProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const orgId = req.user!.organizationId;

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        isPublished: true,
        profileSlug: true,
        description: true,
        shortDescription: true,
        phone: true,
        address: true,
        businessHours: true,
        logo: true,
        coverImage: true,
        galleryImages: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        latitude: true,
        longitude: true,
        amenities: true,
        priceRange: true,
        metaTitle: true,
        metaDescription: true,
        averageRating: true,
        reviewCount: true,
        // Include counts for requirements check
        _count: {
          select: {
            services: { where: { isActive: true } },
            bookings: { where: { source: 'marketplace' } },
          },
        },
      },
    });

    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Calculate readiness
    const requirements = {
      profileSlug: !!org.profileSlug,
      description: !!org.description || !!org.shortDescription,
      hasImage: !!org.logo || !!org.coverImage,
      hasService: org._count.services > 0,
      hasBusinessHours: !!org.businessHours,
    };

    const isReady = Object.values(requirements).every(Boolean);

    res.json({
      ...org,
      _count: undefined,
      requirements,
      isReady,
      marketplaceBookings: org._count.bookings,
      activeServices: org._count.services,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/marketplace/profile
 * Update marketplace profile fields
 */
export async function updateMarketplaceProfile(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const orgId = req.user!.organizationId;
    const {
      profileSlug,
      description,
      shortDescription,
      phone,
      address,
      businessHours,
      logo,
      coverImage,
      galleryImages,
      city,
      state,
      zipCode,
      country,
      latitude,
      longitude,
      amenities,
      priceRange,
      metaTitle,
      metaDescription,
    } = req.body;

    // Validate profileSlug uniqueness if provided
    if (profileSlug) {
      const existing = await prisma.organization.findFirst({
        where: {
          profileSlug,
          id: { not: orgId },
        },
      });

      if (existing) {
        return res.status(409).json({ error: 'Profile slug is already taken' });
      }
    }

    const updated = await prisma.organization.update({
      where: { id: orgId },
      data: {
        profileSlug,
        description,
        shortDescription,
        phone,
        address,
        businessHours,
        logo,
        coverImage,
        galleryImages,
        city,
        state,
        zipCode,
        country,
        latitude,
        longitude,
        amenities,
        priceRange,
        metaTitle,
        metaDescription,
      },
      select: {
        id: true,
        name: true,
        isPublished: true,
        profileSlug: true,
        description: true,
        shortDescription: true,
        phone: true,
        address: true,
        businessHours: true,
        logo: true,
        coverImage: true,
        galleryImages: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        latitude: true,
        longitude: true,
        amenities: true,
        priceRange: true,
        metaTitle: true,
        metaDescription: true,
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/marketplace/publish
 * Publish organization to marketplace
 */
export async function publishToMarketplace(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const orgId = req.user!.organizationId;

    // Get current org
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        profileSlug: true,
        description: true,
        shortDescription: true,
        logo: true,
        coverImage: true,
        businessHours: true,
        _count: {
          select: {
            services: { where: { isActive: true } },
          },
        },
      },
    });

    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Check requirements
    const errors: string[] = [];

    if (!org.profileSlug && !org.name) {
      errors.push('Profile slug is required');
    }

    if (!org.description && !org.shortDescription) {
      errors.push('Description is required');
    }

    if (!org.logo && !org.coverImage) {
      errors.push('At least one image (logo or cover) is required');
    }

    if (org._count.services === 0) {
      errors.push('At least one active service is required');
    }

    if (!org.businessHours) {
      errors.push('Business hours must be set');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Cannot publish - requirements not met',
        requirements: errors,
      });
    }

    // Generate profileSlug if not set
    let slug = org.profileSlug;
    if (!slug) {
      slug = await generateUniqueProfileSlug(org.name, orgId);
    }

    // Publish
    const updated = await prisma.organization.update({
      where: { id: orgId },
      data: {
        isPublished: true,
        profileSlug: slug,
      },
      select: {
        id: true,
        name: true,
        isPublished: true,
        profileSlug: true,
      },
    });

    res.json({
      message: 'Successfully published to marketplace',
      profileUrl: `/spa/${updated.profileSlug}`,
      ...updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/marketplace/unpublish
 * Remove organization from marketplace
 */
export async function unpublishFromMarketplace(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const orgId = req.user!.organizationId;

    const updated = await prisma.organization.update({
      where: { id: orgId },
      data: {
        isPublished: false,
      },
      select: {
        id: true,
        name: true,
        isPublished: true,
        profileSlug: true,
      },
    });

    res.json({
      message: 'Removed from marketplace',
      ...updated,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// MARKETPLACE STATS
// ============================================

/**
 * GET /api/marketplace/stats
 * Get marketplace statistics for dashboard
 */
export async function getMarketplaceStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const orgId = req.user!.organizationId;

    // Get booking stats
    const [totalBookings, pendingBookings, recentBookings, reviewStats] = await Promise.all([
      prisma.booking.count({
        where: { organizationId: orgId, source: 'marketplace' },
      }),
      prisma.booking.count({
        where: { organizationId: orgId, source: 'marketplace', status: 'pending' },
      }),
      prisma.booking.findMany({
        where: { organizationId: orgId, source: 'marketplace' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          customerName: true,
          dateTime: true,
          status: true,
          totalPrice: true,
          service: {
            select: { name: true },
          },
          createdAt: true,
        },
      }),
      prisma.review.aggregate({
        where: { organizationId: orgId, status: 'published' },
        _avg: { rating: true },
        _count: { id: true },
      }),
    ]);

    // Calculate revenue from marketplace bookings
    const revenue = await prisma.booking.aggregate({
      where: {
        organizationId: orgId,
        source: 'marketplace',
        status: 'completed',
      },
      _sum: { totalPrice: true },
    });

    res.json({
      bookings: {
        total: totalBookings,
        pending: pendingBookings,
        recent: recentBookings,
      },
      reviews: {
        average: reviewStats._avg.rating || 0,
        count: reviewStats._count.id,
      },
      revenue: {
        total: Number(revenue._sum.totalPrice || 0),
      },
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// MARKETPLACE BOOKINGS
// ============================================

/**
 * GET /api/marketplace/bookings
 * List marketplace bookings for organization
 */
export async function listMarketplaceBookings(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const orgId = req.user!.organizationId;
    const { status, page = 1, limit = 20 } = req.query;

    const pageNum = Number(page);
    const limitNum = Math.min(Number(limit), 50);
    const skip = (pageNum - 1) * limitNum;

    const where: { organizationId: string; source: string; status?: string } = {
      organizationId: orgId,
      source: 'marketplace',
    };

    if (status) {
      where.status = status as string;
    }

    const [total, bookings] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        orderBy: { dateTime: 'desc' },
        skip,
        take: limitNum,
        select: {
          id: true,
          customerName: true,
          customerEmail: true,
          customerPhone: true,
          dateTime: true,
          duration: true,
          totalPrice: true,
          status: true,
          confirmationNumber: true,
          notes: true,
          createdAt: true,
          service: {
            select: { id: true, name: true },
          },
          staff: {
            select: { id: true, name: true },
          },
        },
      }),
    ]);

    res.json({
      bookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/marketplace/bookings/:id/status
 * Update booking status
 */
export async function updateBookingStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const orgId = req.user!.organizationId;
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Verify booking belongs to org
    const booking = await prisma.booking.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        status: true,
        confirmationNumber: true,
      },
    });

    // If confirmed, create corresponding appointment
    if (status === 'confirmed' && !booking.appointmentId) {
      // TODO: Create internal appointment and link to booking
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

// ============================================
// MARKETPLACE REVIEWS
// ============================================

/**
 * GET /api/marketplace/reviews
 * List reviews for organization
 */
export async function listOrgReviews(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const orgId = req.user!.organizationId;
    const { status, page = 1, limit = 20 } = req.query;

    const pageNum = Number(page);
    const limitNum = Math.min(Number(limit), 50);
    const skip = (pageNum - 1) * limitNum;

    const where: { organizationId: string; status?: string } = {
      organizationId: orgId,
    };

    if (status) {
      where.status = status as string;
    }

    const [total, reviews] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        select: {
          id: true,
          rating: true,
          title: true,
          comment: true,
          reviewerName: true,
          reviewerEmail: true,
          isVerified: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    res.json({
      reviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/marketplace/reviews/:id/status
 * Update review moderation status
 */
export async function updateReviewStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const orgId = req.user!.organizationId;
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'published', 'hidden'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Verify review belongs to org
    const review = await prisma.review.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const updated = await prisma.review.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        status: true,
      },
    });

    // Update org rating
    const { updateSpaRating } = await import('../lib/consumer.js');
    await updateSpaRating(orgId);

    res.json(updated);
  } catch (error) {
    next(error);
  }
}
