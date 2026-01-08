import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import {
  getMarketplaceProfile,
  updateMarketplaceProfile,
  publishToMarketplace,
  unpublishFromMarketplace,
  getMarketplaceStats,
  listMarketplaceBookings,
  updateBookingStatus,
  listOrgReviews,
  updateReviewStatus,
} from '../controllers/marketplace.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// PROFILE MANAGEMENT (OWNER, MANAGER)
// ============================================

// GET /api/marketplace/profile - Get marketplace profile
router.get('/profile', getMarketplaceProfile);

// PUT /api/marketplace/profile - Update marketplace profile
router.put('/profile', requireRole(['OWNER', 'MANAGER']), updateMarketplaceProfile);

// POST /api/marketplace/publish - Publish to marketplace
router.post('/publish', requireRole(['OWNER', 'MANAGER']), publishToMarketplace);

// POST /api/marketplace/unpublish - Remove from marketplace
router.post('/unpublish', requireRole(['OWNER', 'MANAGER']), unpublishFromMarketplace);

// ============================================
// STATS & ANALYTICS
// ============================================

// GET /api/marketplace/stats - Get marketplace statistics
router.get('/stats', getMarketplaceStats);

// ============================================
// BOOKING MANAGEMENT
// ============================================

// GET /api/marketplace/bookings - List marketplace bookings
router.get('/bookings', listMarketplaceBookings);

// PATCH /api/marketplace/bookings/:id/status - Update booking status
router.patch('/bookings/:id/status', updateBookingStatus);

// ============================================
// REVIEW MANAGEMENT
// ============================================

// GET /api/marketplace/reviews - List reviews
router.get('/reviews', listOrgReviews);

// PATCH /api/marketplace/reviews/:id/status - Moderate review
router.patch('/reviews/:id/status', requireRole(['OWNER', 'MANAGER']), updateReviewStatus);

export default router;
