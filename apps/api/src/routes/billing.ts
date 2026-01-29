import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '@peacase/database';
import { authenticate, authorize } from '../middleware/auth.js';
import logger from '../lib/logger.js';
import { withSalonId } from '../lib/prismaUtils.js';
import {
  SUBSCRIPTION_PLANS,
  ADDON_DETAILS,
  ADDON_PRICE_AMOUNT,
  SubscriptionPlanId,
  createCheckoutSession,
  createPortalSession,
  getSubscription,
  getBillingHistory,
  checkPlanLimits,
  addAddon,
  removeAddon,
  getCheckoutPreview,
  acceptTerms,
} from '../services/subscriptions.js';
import { asyncHandler } from '../lib/errorUtils.js';

const router = Router();

// Validation schemas
const createCheckoutSchema = z.object({
  planId: z.enum(['professional', 'enterprise']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  addonIds: z.array(z.string()).optional(),
});

const createPortalSchema = z.object({
  returnUrl: z.string().url(),
});

const addAddonSchema = z.object({
  addonId: z.string(),
});

const acceptTermsSchema = z.object({
  version: z.string(),
});

// ============================================
// GET /api/v1/billing/plans
// List available subscription plans
// ============================================
router.get('/plans', asyncHandler(async (req: Request, res: Response) => {
  const plans = Object.values(SUBSCRIPTION_PLANS).map((plan) => ({
    id: plan.id,
    name: plan.name,
    description: plan.description,
    price: plan.price,
    features: plan.features,
    limits: plan.limits,
  }));

  const addons = Object.entries(ADDON_DETAILS).map(([id, details]) => ({
    id,
    name: details.name,
    description: details.description,
    price: ADDON_PRICE_AMOUNT,
  }));

  res.json({
    success: true,
    data: { plans, addons },
  });
}));

// ============================================
// POST /api/v1/billing/create-checkout
// Create Stripe Checkout session for subscription
// ============================================
router.post(
  '/create-checkout',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = createCheckoutSchema.parse(req.body);
      const salonId = req.user!.salonId;

      const session = await createCheckoutSession({
        salonId,
        planId: data.planId as SubscriptionPlanId,
        successUrl: data.successUrl,
        cancelUrl: data.cancelUrl,
        addonIds: data.addonIds,
      });

      res.json({
        success: true,
        data: {
          sessionId: session.id,
          url: session.url,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.flatten().fieldErrors,
          },
        });
      }
      logger.error({ err: error, salonId: req.user!.salonId }, 'Error creating checkout session');
      res.status(500).json({
        success: false,
        error: {
          code: 'CHECKOUT_ERROR',
          message: 'Failed to create checkout session',
        },
      });
    }
  })
);

// ============================================
// POST /api/v1/billing/create-portal
// Create Stripe Customer Portal session
// ============================================
router.post(
  '/create-portal',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = createPortalSchema.parse(req.body);
      const salonId = req.user!.salonId;

      const session = await createPortalSession({
        salonId,
        returnUrl: data.returnUrl,
      });

      res.json({
        success: true,
        data: {
          url: session.url,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.flatten().fieldErrors,
          },
        });
      }
      logger.error({ err: error, salonId: req.user!.salonId }, 'Error creating portal session');
      res.status(500).json({
        success: false,
        error: {
          code: 'PORTAL_ERROR',
          message: 'Failed to create customer portal session',
        },
      });
    }
  })
);

// ============================================
// GET /api/v1/billing/subscription
// Get current subscription status
// ============================================
router.get(
  '/subscription',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const salonId = req.user!.salonId;

      const subscription = await getSubscription(salonId);
      const limits = await checkPlanLimits(salonId);

      res.json({
        success: true,
        data: {
          subscription,
          usage: {
            staff: {
              current: limits.currentStaff,
              max: limits.maxStaff,
            },
            clients: {
              current: limits.currentClients,
              max: limits.maxClients,
            },
          },
          withinLimits: limits.withinLimits,
        },
      });
    } catch (error) {
      logger.error({ err: error, salonId: req.user!.salonId }, 'Error fetching subscription');
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to fetch subscription status',
        },
      });
    }
  })
);

// ============================================
// GET /api/v1/billing/history
// Get billing history
// ============================================
router.get(
  '/history',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const salonId = req.user!.salonId;
      const limit = parseInt(req.query.limit as string) || 10;

      const history = await getBillingHistory(salonId, limit);

      res.json({
        success: true,
        data: { history },
      });
    } catch (error) {
      logger.error({ err: error, salonId: req.user!.salonId }, 'Error fetching billing history');
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to fetch billing history',
        },
      });
    }
  })
);

// ============================================
// POST /api/v1/billing/add-addon
// Add an add-on to the subscription
// ============================================
router.post(
  '/add-addon',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = addAddonSchema.parse(req.body);
      const salonId = req.user!.salonId;

      const addon = await addAddon(salonId, data.addonId);

      res.json({
        success: true,
        data: { addon },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.flatten().fieldErrors,
          },
        });
      }
      if (error instanceof Error) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'ADDON_ERROR',
            message: error.message,
          },
        });
      }
      logger.error({ err: error, salonId: req.user!.salonId }, 'Error adding addon');
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to add addon',
        },
      });
    }
  })
);

// ============================================
// DELETE /api/v1/billing/remove-addon/:addonId
// Remove an add-on from the subscription
// ============================================
router.delete(
  '/remove-addon/:addonId',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { addonId } = req.params;
      const salonId = req.user!.salonId;

      await removeAddon(salonId, addonId);

      res.json({
        success: true,
        message: 'Add-on removed successfully',
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'ADDON_ERROR',
            message: error.message,
          },
        });
      }
      logger.error({ err: error, salonId: req.user!.salonId }, 'Error removing addon');
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to remove addon',
        },
      });
    }
  })
);

// ============================================
// POST /api/v1/billing/accept-terms
// Accept terms of service
// ============================================
router.post(
  '/accept-terms',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = acceptTermsSchema.parse(req.body);
      const salonId = req.user!.salonId;

      await acceptTerms(salonId, data.version);

      res.json({
        success: true,
        message: 'Terms accepted',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.flatten().fieldErrors,
          },
        });
      }
      logger.error({ err: error, salonId: req.user!.salonId }, 'Error accepting terms');
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to accept terms',
        },
      });
    }
  })
);

// ============================================
// GET /api/v1/billing/checkout-preview
// Get checkout pricing preview
// ============================================
router.get(
  '/checkout-preview',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const planId = (req.query.planId as string) || 'professional';
      const addonIdsParam = req.query.addonIds as string;
      const addonIds = addonIdsParam ? addonIdsParam.split(',').filter(Boolean) : [];

      if (!['free', 'professional', 'enterprise'].includes(planId)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid plan ID',
          },
        });
      }

      const preview = await getCheckoutPreview(planId as SubscriptionPlanId, addonIds);

      res.json({
        success: true,
        data: preview,
      });
    } catch (error) {
      logger.error({ err: error }, 'Error getting checkout preview');
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to get checkout preview',
        },
      });
    }
  })
);

// ============================================
// GET /api/v1/billing/terms-status
// Check if salon has accepted terms
// ============================================
router.get(
  '/terms-status',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const salonId = req.user!.salonId;

      const salon = await prisma.salon.findUnique({
        where: { id: salonId },
        select: {
          termsAcceptedAt: true,
          termsVersion: true,
        },
      });

      res.json({
        success: true,
        data: {
          accepted: !!salon?.termsAcceptedAt,
          acceptedAt: salon?.termsAcceptedAt,
          version: salon?.termsVersion,
        },
      });
    } catch (error) {
      logger.error({ err: error, salonId: req.user!.salonId }, 'Error checking terms status');
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to check terms status',
        },
      });
    }
  })
);

export { router as billingRouter };
