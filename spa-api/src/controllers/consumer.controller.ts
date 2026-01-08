import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import {
  getAvailableSlots,
  isSlotAvailable,
  updateSpaRating,
  generateConfirmationNumber,
  formatAddress,
  generateCitySlug,
  generateCategorySlug,
} from '../lib/consumer.js';
import { Prisma } from '@prisma/client';

// ============================================
// SPA LISTING
// ============================================

/**
 * GET /api/consumer/spas
 * List published spas for marketplace
 */
export async function listSpas(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      city,
      state,
      category,
      amenities,
      minRating,
      priceRange,
      sort = 'rating',
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = Number(page);
    const limitNum = Math.min(Number(limit), 50);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: Prisma.OrganizationWhereInput = {
      isPublished: true,
    };

    if (city) where.city = city as string;
    if (state) where.state = state as string;
    if (priceRange) where.priceRange = priceRange as string;
    if (minRating) where.averageRating = { gte: Number(minRating) };

    if (amenities) {
      const amenityList = (amenities as string).split(',').map((a) => a.trim());
      where.amenities = { hasEvery: amenityList };
    }

    // Filter by service category
    if (category) {
      where.services = {
        some: {
          category: category as string,
          isActive: true,
        },
      };
    }

    // Build order by
    let orderBy: Prisma.OrganizationOrderByWithRelationInput;
    switch (sort) {
      case 'reviewCount':
        orderBy = { reviewCount: 'desc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'rating':
      default:
        orderBy = { averageRating: 'desc' };
    }

    // Get total count and spas
    const [total, spas] = await Promise.all([
      prisma.organization.count({ where }),
      prisma.organization.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        select: {
          id: true,
          name: true,
          profileSlug: true,
          shortDescription: true,
          logo: true,
          coverImage: true,
          city: true,
          state: true,
          averageRating: true,
          reviewCount: true,
          priceRange: true,
        },
      }),
    ]);

    res.json({
      spas,
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

// ============================================
// SPA PROFILE
// ============================================

/**
 * GET /api/consumer/spas/:slug
 * Get full spa profile
 */
export async function getSpaProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;

    const spa = await prisma.organization.findFirst({
      where: {
        profileSlug: slug,
        isPublished: true,
      },
      select: {
        id: true,
        name: true,
        profileSlug: true,
        description: true,
        shortDescription: true,
        logo: true,
        coverImage: true,
        galleryImages: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        latitude: true,
        longitude: true,
        phone: true,
        businessHours: true,
        amenities: true,
        priceRange: true,
        averageRating: true,
        reviewCount: true,
        metaTitle: true,
        metaDescription: true,
        services: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            durationMinutes: true,
            price: true,
            category: true,
          },
          orderBy: { name: 'asc' },
        },
        staff: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            title: true,
            avatar: true,
          },
          orderBy: { name: 'asc' },
        },
        reviews: {
          where: { status: 'published' },
          select: {
            id: true,
            rating: true,
            title: true,
            comment: true,
            reviewerName: true,
            isVerified: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!spa) {
      return res.status(404).json({ error: 'Spa not found' });
    }

    // Format address
    const formattedAddress = formatAddress({
      address: spa.address,
      city: spa.city,
      state: spa.state,
      zipCode: spa.zipCode,
    });

    res.json({
      ...spa,
      formattedAddress,
      recentReviews: spa.reviews,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// SPA SERVICES
// ============================================

/**
 * GET /api/consumer/spas/:slug/services
 * List spa's bookable services
 */
export async function getSpaServices(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;

    const spa = await prisma.organization.findFirst({
      where: {
        profileSlug: slug,
        isPublished: true,
      },
      select: { id: true },
    });

    if (!spa) {
      return res.status(404).json({ error: 'Spa not found' });
    }

    const services = await prisma.service.findMany({
      where: {
        organizationId: spa.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        durationMinutes: true,
        price: true,
        category: true,
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    res.json(services);
  } catch (error) {
    next(error);
  }
}

// ============================================
// SPA STAFF
// ============================================

/**
 * GET /api/consumer/spas/:slug/staff
 * List spa's staff for booking selection
 */
export async function getSpaStaff(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;

    const spa = await prisma.organization.findFirst({
      where: {
        profileSlug: slug,
        isPublished: true,
      },
      select: { id: true },
    });

    if (!spa) {
      return res.status(404).json({ error: 'Spa not found' });
    }

    const staff = await prisma.staff.findMany({
      where: {
        organizationId: spa.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        title: true,
        avatar: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json(staff);
  } catch (error) {
    next(error);
  }
}

// ============================================
// AVAILABILITY
// ============================================

/**
 * GET /api/consumer/spas/:slug/availability
 * Get available time slots
 */
export async function getAvailability(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const { date, serviceId, staffId } = req.query;

    if (!date || !serviceId) {
      return res.status(400).json({ error: 'date and serviceId are required' });
    }

    const spa = await prisma.organization.findFirst({
      where: {
        profileSlug: slug,
        isPublished: true,
      },
      select: { id: true },
    });

    if (!spa) {
      return res.status(404).json({ error: 'Spa not found' });
    }

    // Verify service belongs to spa
    const service = await prisma.service.findFirst({
      where: {
        id: serviceId as string,
        organizationId: spa.id,
        isActive: true,
      },
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Verify staff if provided
    if (staffId) {
      const staff = await prisma.staff.findFirst({
        where: {
          id: staffId as string,
          organizationId: spa.id,
          isActive: true,
        },
      });

      if (!staff) {
        return res.status(404).json({ error: 'Staff not found' });
      }
    }

    const parsedDate = new Date(date as string);
    const slots = await getAvailableSlots(
      spa.id,
      parsedDate,
      serviceId as string,
      staffId as string | undefined
    );

    res.json({
      date: date as string,
      slots,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// BOOKING
// ============================================

/**
 * POST /api/consumer/spas/:slug/book
 * Create a booking
 */
export async function createBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const { serviceId, staffId, dateTime, customerName, customerEmail, customerPhone, notes } =
      req.body;

    // Find spa
    const spa = await prisma.organization.findFirst({
      where: {
        profileSlug: slug,
        isPublished: true,
      },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        phone: true,
      },
    });

    if (!spa) {
      return res.status(404).json({ error: 'Spa not found' });
    }

    // Verify service
    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        organizationId: spa.id,
        isActive: true,
      },
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Verify staff if provided
    let selectedStaff = null;
    let actualStaffId = staffId;

    if (staffId) {
      selectedStaff = await prisma.staff.findFirst({
        where: {
          id: staffId,
          organizationId: spa.id,
          isActive: true,
        },
      });

      if (!selectedStaff) {
        return res.status(404).json({ error: 'Staff not found' });
      }
    } else {
      // Find any available staff for this time
      const parsedDateTime = new Date(dateTime);
      const staffMembers = await prisma.staff.findMany({
        where: {
          organizationId: spa.id,
          isActive: true,
          staffServices: {
            some: { serviceId },
          },
        },
      });

      for (const staff of staffMembers) {
        const available = await isSlotAvailable(
          spa.id,
          staff.id,
          parsedDateTime,
          service.durationMinutes
        );
        if (available) {
          selectedStaff = staff;
          actualStaffId = staff.id;
          break;
        }
      }

      if (!selectedStaff) {
        return res.status(409).json({ error: 'No staff available at this time' });
      }
    }

    // Check slot availability (race condition check)
    const parsedDateTime = new Date(dateTime);
    const available = await isSlotAvailable(
      spa.id,
      actualStaffId,
      parsedDateTime,
      service.durationMinutes
    );

    if (!available) {
      return res.status(409).json({ error: 'This time slot is no longer available' });
    }

    // Create booking in transaction
    const booking = await prisma.$transaction(async (tx) => {
      // Create booking
      const newBooking = await tx.booking.create({
        data: {
          organizationId: spa.id,
          serviceId,
          staffId: actualStaffId,
          dateTime: parsedDateTime,
          duration: service.durationMinutes,
          totalPrice: service.price,
          customerName,
          customerEmail,
          customerPhone,
          notes,
          confirmationNumber: generateConfirmationNumber(),
          status: 'pending',
          source: 'marketplace',
        },
        include: {
          service: {
            select: { name: true, durationMinutes: true, price: true },
          },
          staff: {
            select: { name: true },
          },
        },
      });

      return newBooking;
    });

    // TODO: Send confirmation email to customer
    // TODO: Send notification email to spa

    res.status(201).json({
      bookingId: booking.id,
      confirmationNumber: booking.confirmationNumber,
      status: booking.status,
      dateTime: booking.dateTime,
      service: {
        name: booking.service.name,
        duration: booking.service.durationMinutes,
        price: Number(booking.service.price),
      },
      staff: booking.staff ? { name: booking.staff.name } : null,
      spa: {
        name: spa.name,
        address: formatAddress(spa),
        phone: spa.phone,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// REVIEWS
// ============================================

/**
 * GET /api/consumer/spas/:slug/reviews
 * List reviews with pagination
 */
export async function listReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 10, sort = 'newest' } = req.query;

    const pageNum = Number(page);
    const limitNum = Math.min(Number(limit), 50);
    const skip = (pageNum - 1) * limitNum;

    const spa = await prisma.organization.findFirst({
      where: {
        profileSlug: slug,
        isPublished: true,
      },
      select: { id: true },
    });

    if (!spa) {
      return res.status(404).json({ error: 'Spa not found' });
    }

    // Build order by
    let orderBy: Prisma.ReviewOrderByWithRelationInput;
    switch (sort) {
      case 'highest':
        orderBy = { rating: 'desc' };
        break;
      case 'lowest':
        orderBy = { rating: 'asc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
    }

    // Get reviews with summary
    const [total, reviews, ratingBreakdown] = await Promise.all([
      prisma.review.count({
        where: { organizationId: spa.id, status: 'published' },
      }),
      prisma.review.findMany({
        where: { organizationId: spa.id, status: 'published' },
        orderBy,
        skip,
        take: limitNum,
        select: {
          id: true,
          rating: true,
          title: true,
          comment: true,
          reviewerName: true,
          isVerified: true,
          createdAt: true,
        },
      }),
      prisma.review.groupBy({
        by: ['rating'],
        where: { organizationId: spa.id, status: 'published' },
        _count: { id: true },
      }),
    ]);

    // Calculate average
    const aggregate = await prisma.review.aggregate({
      where: { organizationId: spa.id, status: 'published' },
      _avg: { rating: true },
    });

    // Build breakdown object
    const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const group of ratingBreakdown) {
      breakdown[group.rating] = group._count.id;
    }

    res.json({
      reviews,
      summary: {
        average: aggregate._avg.rating || 0,
        total,
        breakdown,
      },
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
 * POST /api/consumer/spas/:slug/reviews
 * Submit a review
 */
export async function createReview(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const { rating, title, comment, reviewerName, reviewerEmail, bookingId } = req.body;

    const spa = await prisma.organization.findFirst({
      where: {
        profileSlug: slug,
        isPublished: true,
      },
      select: { id: true },
    });

    if (!spa) {
      return res.status(404).json({ error: 'Spa not found' });
    }

    // Check if booking exists for verification
    let isVerified = false;
    if (bookingId) {
      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          organizationId: spa.id,
          customerEmail: reviewerEmail,
          status: 'completed',
        },
      });
      isVerified = !!booking;
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        organizationId: spa.id,
        rating,
        title,
        comment,
        reviewerName,
        reviewerEmail,
        bookingId,
        isVerified,
        status: 'published',
      },
      select: {
        id: true,
        rating: true,
        title: true,
        comment: true,
        reviewerName: true,
        isVerified: true,
        createdAt: true,
      },
    });

    // Update spa rating
    await updateSpaRating(spa.id);

    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
}

// ============================================
// SEARCH
// ============================================

/**
 * GET /api/consumer/search
 * Search spas
 */
export async function searchSpas(req: Request, res: Response, next: NextFunction) {
  try {
    const { q, city, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query (q) is required' });
    }

    const query = q as string;
    const limitNum = Math.min(Number(limit), 50);

    const where: Prisma.OrganizationWhereInput = {
      isPublished: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
        {
          services: {
            some: {
              name: { contains: query, mode: 'insensitive' },
              isActive: true,
            },
          },
        },
      ],
    };

    if (city) {
      where.city = city as string;
    }

    const results = await prisma.organization.findMany({
      where,
      take: limitNum,
      orderBy: { averageRating: 'desc' },
      select: {
        id: true,
        name: true,
        profileSlug: true,
        shortDescription: true,
        logo: true,
        city: true,
        averageRating: true,
      },
    });

    // Determine match type for each result
    const resultsWithMatchType = results.map((spa) => {
      let matchType = 'description';
      if (spa.name.toLowerCase().includes(query.toLowerCase())) {
        matchType = 'name';
      } else if (spa.city?.toLowerCase().includes(query.toLowerCase())) {
        matchType = 'city';
      }
      return { ...spa, matchType };
    });

    res.json({
      results: resultsWithMatchType,
      total: results.length,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// CITIES & CATEGORIES
// ============================================

/**
 * GET /api/consumer/cities
 * List cities with spa counts
 */
export async function listCities(req: Request, res: Response, next: NextFunction) {
  try {
    const cityCounts = await prisma.organization.groupBy({
      by: ['city', 'state'],
      where: {
        isPublished: true,
        city: { not: null },
        state: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const cities = cityCounts
      .filter((c) => c.city && c.state)
      .map((c) => ({
        city: c.city!,
        state: c.state!,
        slug: generateCitySlug(c.city!, c.state!),
        count: c._count.id,
      }));

    res.json(cities);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/consumer/categories
 * List service categories with counts
 */
export async function listCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const categoryCounts = await prisma.service.groupBy({
      by: ['category'],
      where: {
        isActive: true,
        category: { not: null },
        organization: { isPublished: true },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const categories = categoryCounts
      .filter((c) => c.category)
      .map((c) => ({
        category: c.category!,
        slug: generateCategorySlug(c.category!),
        count: c._count.id,
      }));

    res.json(categories);
  } catch (error) {
    next(error);
  }
}
