import { Request, Response, NextFunction } from 'express';
import { prisma } from '@peacase/database';
import logger from '../lib/logger.js';

// Plan limits configuration - Professional only with unlimited
const PLAN_LIMITS = {
  professional: { maxStaff: null, maxClients: null }, // null = unlimited
} as const;

type PlanId = keyof typeof PLAN_LIMITS;

/**
 * Middleware to check if salon has an active subscription (with grace period support)
 * CRITICAL: No free plan - requires actual subscription record
 */
export function requireActiveSubscription() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const salonId = req.user?.salonId;
      if (!salonId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const subscription = await prisma.subscription.findUnique({
        where: { salonId },
      });

      // No subscription record = must subscribe (no free tier)
      if (!subscription) {
        return res.status(402).json({
          success: false,
          error: {
            code: 'SUBSCRIPTION_REQUIRED',
            message: 'A subscription is required to access this feature. Start your 14-day free trial.',
            upgrade_url: '/pricing',
          },
        });
      }

      const now = new Date();
      const isActive = subscription.status === 'active';
      const isTrialing = subscription.status === 'trialing';
      const inGracePeriod = subscription.graceEndsAt && subscription.graceEndsAt > now;

      // Trial, active, or grace period = allow access
      if (isActive || isTrialing || inGracePeriod) {
        return next();
      }

      return res.status(402).json({
        success: false,
        error: {
          code: 'SUBSCRIPTION_EXPIRED',
          message: 'Your subscription has expired. Please update your payment method to continue.',
          upgrade_url: '/settings?tab=subscription',
        },
      });
    } catch (error) {
      logger.error({ err: error, salonId: req.user?.salonId }, 'Subscription check error');
      next(error);
    }
  };
}

/**
 * Middleware factory to check if a specific add-on is enabled
 */
export function requireAddon(addonId: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const salonId = req.user?.salonId;
      if (!salonId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const subscription = await prisma.subscription.findUnique({
        where: { salonId },
        include: { addons: true },
      });

      // During trial, all add-ons are accessible (full feature access)
      if (subscription?.status === 'trialing') {
        return next();
      }

      // Check if addon is active
      const addon = subscription?.addons.find(
        (a) => a.addonId === addonId && a.status === 'active'
      );

      if (!addon) {
        const addonNames: Record<string, string> = {
          online_booking: 'Online Booking',
          payment_processing: 'Payment Processing',
          reminders: 'SMS/Email Reminders',
          reports: 'Reports & Analytics',
          memberships: 'Packages & Memberships',
          gift_cards: 'Gift Cards',
          marketing: 'Marketing Automation',
        };

        return res.status(402).json({
          success: false,
          error: {
            code: 'ADDON_REQUIRED',
            message: `The ${addonNames[addonId] || addonId} add-on is required for this feature.`,
            addon_id: addonId,
            upgrade_url: '/settings?tab=subscription',
          },
        });
      }

      next();
    } catch (error) {
      logger.error({ err: error, salonId: req.user?.salonId, addonId }, 'Add-on check error');
      next(error);
    }
  };
}

/**
 * Middleware to check plan limits before creating staff or clients
 */
export function checkPlanLimits(resource: 'staff' | 'clients') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const salonId = req.user?.salonId;
      if (!salonId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      // Get salon with subscription and current counts
      const salon = await prisma.salon.findUnique({
        where: { id: salonId },
        include: {
          subscription: true,
          users: { where: { isActive: true } },
          clients: { where: { isActive: true } },
        },
      });

      if (!salon) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Salon not found' },
        });
      }

      const plan = (salon.subscription?.plan || 'professional') as PlanId;
      const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.professional;

      if (resource === 'staff') {
        const currentCount = salon.users.length;
        const maxAllowed = limits.maxStaff;

        if (maxAllowed !== null && currentCount >= maxAllowed) {
          return res.status(402).json({
            success: false,
            error: {
              code: 'PLAN_LIMIT_REACHED',
              message: `Your ${plan} plan allows up to ${maxAllowed} staff member${maxAllowed === 1 ? '' : 's'}. Upgrade to add more.`,
              resource: 'staff',
              current: currentCount,
              limit: maxAllowed,
              upgrade_url: '/settings?tab=subscription',
            },
          });
        }
      }

      if (resource === 'clients') {
        const currentCount = salon.clients.length;
        const maxAllowed = limits.maxClients;

        if (maxAllowed !== null && currentCount >= maxAllowed) {
          return res.status(402).json({
            success: false,
            error: {
              code: 'PLAN_LIMIT_REACHED',
              message: `Your ${plan} plan allows up to ${maxAllowed} clients. Upgrade to add more.`,
              resource: 'clients',
              current: currentCount,
              limit: maxAllowed,
              upgrade_url: '/settings?tab=subscription',
            },
          });
        }
      }

      next();
    } catch (error) {
      logger.error({ err: error, salonId: req.user?.salonId, resource }, 'Plan limits check error');
      next(error);
    }
  };
}

/**
 * Check if a salon has a specific add-on (for use in route handlers)
 */
export async function hasAddon(salonId: string, addonId: string): Promise<boolean> {
  const subscription = await prisma.subscription.findUnique({
    where: { salonId },
    include: { addons: true },
  });

  return !!subscription?.addons.find(
    (a) => a.addonId === addonId && a.status === 'active'
  );
}
