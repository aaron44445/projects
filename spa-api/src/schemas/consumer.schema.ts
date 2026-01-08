import { z } from 'zod';

// ============================================
// SPA LISTING SCHEMAS
// ============================================

export const listSpasSchema = z.object({
  query: z.object({
    city: z.string().optional(),
    state: z.string().optional(),
    category: z.string().optional(),
    amenities: z.string().optional(), // comma-separated
    minRating: z.coerce.number().min(1).max(5).optional(),
    priceRange: z.enum(['$', '$$', '$$$', '$$$$']).optional(),
    sort: z.enum(['rating', 'reviewCount', 'newest']).default('rating'),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(20),
  }),
});

export type ListSpasInput = z.infer<typeof listSpasSchema>['query'];

// ============================================
// AVAILABILITY SCHEMAS
// ============================================

export const getAvailabilitySchema = z.object({
  params: z.object({
    slug: z.string().min(1),
  }),
  query: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
    serviceId: z.string().min(1),
    staffId: z.string().optional(),
  }),
});

export type GetAvailabilityInput = z.infer<typeof getAvailabilitySchema>;

// ============================================
// BOOKING SCHEMAS
// ============================================

export const createBookingSchema = z.object({
  params: z.object({
    slug: z.string().min(1),
  }),
  body: z.object({
    serviceId: z.string().min(1),
    staffId: z.string().nullable().optional(),
    dateTime: z.string().datetime({ message: 'dateTime must be ISO format' }),
    customerName: z.string().min(1).max(100),
    customerEmail: z.string().email(),
    customerPhone: z.string().max(20).optional(),
    notes: z.string().max(500).optional(),
  }),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

// ============================================
// REVIEW SCHEMAS
// ============================================

export const listReviewsSchema = z.object({
  params: z.object({
    slug: z.string().min(1),
  }),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(10),
    sort: z.enum(['newest', 'highest', 'lowest']).default('newest'),
  }),
});

export type ListReviewsInput = z.infer<typeof listReviewsSchema>;

export const createReviewSchema = z.object({
  params: z.object({
    slug: z.string().min(1),
  }),
  body: z.object({
    rating: z.number().int().min(1).max(5),
    title: z.string().max(100).optional(),
    comment: z.string().max(2000).optional(),
    reviewerName: z.string().min(1).max(100),
    reviewerEmail: z.string().email().optional(),
    bookingId: z.string().optional(), // For verification
  }),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

// ============================================
// SEARCH SCHEMAS
// ============================================

export const searchSpasSchema = z.object({
  query: z.object({
    q: z.string().min(1),
    city: z.string().optional(),
    limit: z.coerce.number().int().positive().max(50).default(20),
  }),
});

export type SearchSpasInput = z.infer<typeof searchSpasSchema>['query'];

// ============================================
// DASHBOARD MARKETPLACE SCHEMAS
// ============================================

export const updateMarketplaceProfileSchema = z.object({
  body: z.object({
    profileSlug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and dashes only').optional(),
    description: z.string().max(5000).optional(),
    shortDescription: z.string().max(200).optional(),
    phone: z.string().max(20).optional(),
    address: z.string().max(200).optional(),
    businessHours: z.record(
      z.object({
        open: z.string().regex(/^\d{2}:\d{2}$/),
        close: z.string().regex(/^\d{2}:\d{2}$/),
      }).nullable()
    ).optional(),
    logo: z.string().url().optional().nullable(),
    coverImage: z.string().url().optional().nullable(),
    galleryImages: z.array(z.string().url()).max(10).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(50).optional(),
    zipCode: z.string().max(20).optional(),
    country: z.string().max(50).optional(),
    latitude: z.number().min(-90).max(90).optional().nullable(),
    longitude: z.number().min(-180).max(180).optional().nullable(),
    amenities: z.array(z.string()).optional(),
    priceRange: z.enum(['$', '$$', '$$$', '$$$$']).optional().nullable(),
    metaTitle: z.string().max(60).optional(),
    metaDescription: z.string().max(160).optional(),
  }),
});

export type UpdateMarketplaceProfileInput = z.infer<typeof updateMarketplaceProfileSchema>['body'];
