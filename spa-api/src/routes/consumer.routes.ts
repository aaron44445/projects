import { Router } from 'express';
import {
  listSpas,
  getSpaProfile,
  getSpaServices,
  getSpaStaff,
  getAvailability,
  createBooking,
  listReviews,
  createReview,
  searchSpas,
  listCities,
  listCategories,
} from '../controllers/consumer.controller.js';

const router = Router();

// ============================================
// SPA LISTINGS (Public)
// ============================================

// GET /api/consumer/spas - List published spas
router.get('/spas', listSpas);

// GET /api/consumer/spas/:slug - Get spa profile
router.get('/spas/:slug', getSpaProfile);

// GET /api/consumer/spas/:slug/services - Get spa services
router.get('/spas/:slug/services', getSpaServices);

// GET /api/consumer/spas/:slug/staff - Get spa staff
router.get('/spas/:slug/staff', getSpaStaff);

// GET /api/consumer/spas/:slug/availability - Get available time slots
router.get('/spas/:slug/availability', getAvailability);

// POST /api/consumer/spas/:slug/book - Create booking
router.post('/spas/:slug/book', createBooking);

// GET /api/consumer/spas/:slug/reviews - List reviews
router.get('/spas/:slug/reviews', listReviews);

// POST /api/consumer/spas/:slug/reviews - Submit review
router.post('/spas/:slug/reviews', createReview);

// ============================================
// SEARCH & DISCOVERY (Public)
// ============================================

// GET /api/consumer/search - Search spas
router.get('/search', searchSpas);

// GET /api/consumer/cities - List cities with counts
router.get('/cities', listCities);

// GET /api/consumer/categories - List categories with counts
router.get('/categories', listCategories);

export default router;
