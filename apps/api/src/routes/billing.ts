import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  SUBSCRIPTION_PLANS,
  SubscriptionPlanId,
  createCheckoutSession,
  createPortalSession,
  getSubscription,
  getBillingHistory,
  checkPlanLimits,
} from '../services/subscriptions.js';
import { asyncHandler } from '../lib/errorUtils.js';

const router = Router();

// Validation schemas
const createCheckoutSchema = z.object({
  planId: z.enum(['professional', 'enterprise']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

const createPortalSchema = z.object({
  returnUrl: z.string().url(),
});

// ============================================
// GET /api/v1/billing/plans
// List available subscription plans
// ============================================
router.get('/plans', asyncHandler(async (req: Request, res: Response) => {
  try {
    const plans = Object.values(SUBSCRIPTION_PLANS).map((plan) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      features: plan.features,
      limits: plan.limits,
    }));

    res.json({
      success: true,
      data: { plans },
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch subscription plans',
      },
    });
  }
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
      console.error('Error creating checkout session:', error);
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
      console.error('Error creating portal session:', error);
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
      console.error('Error fetching subscription:', error);
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
      console.error('Error fetching billing history:', error);
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

export { router as billingRouter };
