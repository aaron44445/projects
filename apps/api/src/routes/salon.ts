import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma, Prisma } from '@peacase/database';
import { authenticate } from '../middleware/auth.js';
import { requireActiveSubscription } from '../middleware/subscription.js';
import { asyncHandler } from '../lib/errorUtils.js';
import logger from '../lib/logger.js';

const router = Router();

// Salon settings require active subscription
router.use(authenticate, requireActiveSubscription());

// Valid currency codes
const VALID_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD', 'CHF', 'SEK'] as const;

// Valid time formats
const VALID_TIME_FORMATS = ['12h', '24h'] as const;

// Valid date formats
const VALID_DATE_FORMATS = ['DMY', 'MDY', 'YMD'] as const;

// ISO 3166-1 alpha-2 country code pattern
const countryCodeRegex = /^[A-Z]{2}$/;

// Notification settings structure stored in Salon.notification_settings (JSON)
interface NotificationSettings {
  reminders: {
    enabled: boolean;
    timings: { hours: number; label: string }[];  // e.g., [{ hours: 24, label: '24 hours' }]
  };
  channels: {
    email: boolean;
    sms: boolean;
  };
  // Future: custom templates, etc.
}

// Default settings
const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  reminders: {
    enabled: true,
    timings: [
      { hours: 24, label: '24 hours before' },
      { hours: 2, label: '2 hours before' },
    ],
  },
  channels: {
    email: true,
    sms: true,
  },
};

// Salon update schema with internationalization and tax fields
const salonUpdateSchema = z.object({
  // Basic fields
  name: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
  timezone: z.string().optional(),
  website: z.string().url().optional().nullable().or(z.literal('')),
  description: z.string().optional().nullable(),
  multiLocationEnabled: z.boolean().optional(),

  // Internationalization fields
  currency: z.enum(VALID_CURRENCIES).optional(),
  locale: z.string().min(2).max(10).optional().nullable(),
  timeFormat: z.enum(VALID_TIME_FORMATS).optional(),
  dateFormat: z.enum(VALID_DATE_FORMATS).optional(),
  weekStartsOn: z.number().int().min(0).max(6).optional(),
  country: z.string().regex(countryCodeRegex, 'Country must be a 2-letter ISO code').optional().nullable(),

  // Branding fields
  brand_primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').optional(),
  brand_background_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').optional(),

  // Tax fields
  vatNumber: z.string().optional().nullable(),
  taxEnabled: z.boolean().optional(),
  taxRate: z.number().min(0).max(100).optional().nullable(),
  taxName: z.string().min(1).max(50).optional(),
  taxIncluded: z.boolean().optional(),

  // Staff policy fields
  requireTimeOffApproval: z.boolean().optional(),
});

// ============================================
// GET /api/v1/salon
// Get current salon details
// ============================================
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const salon = await prisma.salon.findUnique({
    where: { id: req.user!.salonId },
  });

  if (!salon) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Salon not found',
      },
    });
  }

  res.json({
    success: true,
    data: salon,
  });
}));

// ============================================
// PATCH /api/v1/salon
// Update salon details
// ============================================
router.patch('/', asyncHandler(async (req: Request, res: Response) => {
  // Validate request body with zod schema
  let data;
  try {
    data = salonUpdateSchema.parse(req.body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: error.flatten(),
        },
      });
    }
    throw error;
  }

  // Build update object - only include fields that were provided
  const updateData: Record<string, unknown> = {};

  // Basic fields
  if (data.name !== undefined) updateData.name = data.name;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.state !== undefined) updateData.state = data.state;
  if (data.zip !== undefined) updateData.zip = data.zip;
  if (data.timezone !== undefined) updateData.timezone = data.timezone;
  if (data.website !== undefined) updateData.website = data.website || null;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.multiLocationEnabled !== undefined) updateData.multiLocationEnabled = data.multiLocationEnabled;

  // Internationalization fields
  if (data.currency !== undefined) updateData.currency = data.currency;
  if (data.locale !== undefined) updateData.locale = data.locale;
  if (data.timeFormat !== undefined) updateData.timeFormat = data.timeFormat;
  if (data.dateFormat !== undefined) updateData.dateFormat = data.dateFormat;
  if (data.weekStartsOn !== undefined) updateData.weekStartsOn = data.weekStartsOn;
  if (data.country !== undefined) updateData.country = data.country;

  // Tax fields
  if (data.vatNumber !== undefined) updateData.vatNumber = data.vatNumber;
  if (data.taxEnabled !== undefined) updateData.taxEnabled = data.taxEnabled;
  if (data.taxRate !== undefined) updateData.taxRate = data.taxRate;
  if (data.taxName !== undefined) updateData.taxName = data.taxName;
  if (data.taxIncluded !== undefined) updateData.taxIncluded = data.taxIncluded;

  // Branding fields
  if (data.brand_primary_color !== undefined) updateData.brand_primary_color = data.brand_primary_color;
  if (data.brand_background_color !== undefined) updateData.brand_background_color = data.brand_background_color;

  // Staff policy fields
  if (data.requireTimeOffApproval !== undefined) updateData.requireTimeOffApproval = data.requireTimeOffApproval;

  const salon = await prisma.salon.update({
    where: { id: req.user!.salonId },
    data: updateData,
  });

  res.json({
    success: true,
    data: salon,
  });
}));

// ============================================
// GET /api/v1/salon/features
// Get enabled features
// ============================================
router.get('/features', asyncHandler(async (req: Request, res: Response) => {
  const salon = await prisma.salon.findUnique({
    where: { id: req.user!.salonId },
    select: { featuresEnabled: true, subscriptionPlan: true },
  });

  if (!salon) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Salon not found',
      },
    });
  }

  res.json({
    success: true,
    data: {
      plan: salon.subscriptionPlan,
      features: salon.featuresEnabled,
    },
  });
}));

// ============================================
// GET /api/v1/salon/widget-settings
// Get widget customization settings
// ============================================
router.get('/widget-settings', asyncHandler(async (req: Request, res: Response) => {
  const salon = await prisma.salon.findUnique({
    where: { id: req.user!.salonId },
    select: {
      widgetPrimaryColor: true,
      widgetAccentColor: true,
      widgetButtonStyle: true,
      widgetFontFamily: true,
    },
  });

  if (!salon) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Salon not found',
      },
    });
  }

  res.json({
    success: true,
    data: {
      primaryColor: salon.widgetPrimaryColor,
      accentColor: salon.widgetAccentColor,
      buttonStyle: salon.widgetButtonStyle,
      fontFamily: salon.widgetFontFamily,
    },
  });
}));

// ============================================
// PATCH /api/v1/salon/widget-settings
// Update widget customization settings
// ============================================
router.patch('/widget-settings', asyncHandler(async (req: Request, res: Response) => {
  const { primaryColor, accentColor, buttonStyle, fontFamily } = req.body;

  // Validate color format (hex)
  const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
  if (primaryColor && !hexColorRegex.test(primaryColor)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_COLOR',
        message: 'Primary color must be a valid hex color (e.g., #7C9A82)',
      },
    });
  }
  if (accentColor && !hexColorRegex.test(accentColor)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_COLOR',
        message: 'Accent color must be a valid hex color (e.g., #B5A8D5)',
      },
    });
  }

  // Validate button style
  const validButtonStyles = ['rounded', 'square'];
  if (buttonStyle && !validButtonStyles.includes(buttonStyle)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_BUTTON_STYLE',
        message: 'Button style must be "rounded" or "square"',
      },
    });
  }

  // Validate font family
  const validFontFamilies = ['system', 'modern', 'classic'];
  if (fontFamily && !validFontFamilies.includes(fontFamily)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_FONT_FAMILY',
        message: 'Font family must be "system", "modern", or "classic"',
      },
    });
  }

  const salon = await prisma.salon.update({
    where: { id: req.user!.salonId },
    data: {
      ...(primaryColor && { widgetPrimaryColor: primaryColor }),
      ...(accentColor && { widgetAccentColor: accentColor }),
      ...(buttonStyle && { widgetButtonStyle: buttonStyle }),
      ...(fontFamily && { widgetFontFamily: fontFamily }),
    },
    select: {
      widgetPrimaryColor: true,
      widgetAccentColor: true,
      widgetButtonStyle: true,
      widgetFontFamily: true,
    },
  });

  res.json({
    success: true,
    data: {
      primaryColor: salon.widgetPrimaryColor,
      accentColor: salon.widgetAccentColor,
      buttonStyle: salon.widgetButtonStyle,
      fontFamily: salon.widgetFontFamily,
    },
  });
}));

// ============================================
// GET /api/v1/salon/notification-settings
// Get notification settings
// ============================================
router.get('/notification-settings', asyncHandler(async (req: Request, res: Response) => {
  const salon = await prisma.salon.findUnique({
    where: { id: req.user!.salonId },
    select: { notification_settings: true },
  });

  if (!salon) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Salon not found' } });
  }

  let settings: NotificationSettings;
  try {
    const parsed = salon.notification_settings
      ? JSON.parse(salon.notification_settings)
      : {};

    // Merge with defaults to ensure all required fields exist
    // This handles the case where notification_settings is "{}" (empty object)
    settings = {
      reminders: {
        enabled: parsed.reminders?.enabled ?? DEFAULT_NOTIFICATION_SETTINGS.reminders.enabled,
        timings: parsed.reminders?.timings ?? DEFAULT_NOTIFICATION_SETTINGS.reminders.timings,
      },
      channels: {
        email: parsed.channels?.email ?? DEFAULT_NOTIFICATION_SETTINGS.channels.email,
        sms: parsed.channels?.sms ?? DEFAULT_NOTIFICATION_SETTINGS.channels.sms,
      },
    };
  } catch {
    settings = DEFAULT_NOTIFICATION_SETTINGS;
  }

  res.json({ success: true, data: settings });
}));

// ============================================
// PUT /api/v1/salon/notification-settings
// Update notification settings
// ============================================
router.put('/notification-settings', asyncHandler(async (req: Request, res: Response) => {
  // Only owner/admin can change notification settings
  if (!['owner', 'admin'].includes(req.user!.role)) {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only owners and admins can update notification settings' } });
  }

  const { reminders, channels } = req.body;

  // Validate reminder timings
  if (reminders?.timings) {
    if (!Array.isArray(reminders.timings)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_TIMINGS', message: 'Timings must be an array' } });
    }
    // Validate each timing is a positive number
    for (const timing of reminders.timings) {
      if (typeof timing.hours !== 'number' || timing.hours <= 0 || timing.hours > 168) {  // max 1 week
        return res.status(400).json({ success: false, error: { code: 'INVALID_TIMING', message: 'Each timing must have hours between 1 and 168' } });
      }
    }
  }

  // Get current settings and merge
  const salon = await prisma.salon.findUnique({
    where: { id: req.user!.salonId },
    select: { notification_settings: true },
  });

  let currentSettings: NotificationSettings;
  try {
    currentSettings = salon?.notification_settings
      ? JSON.parse(salon.notification_settings)
      : DEFAULT_NOTIFICATION_SETTINGS;
  } catch {
    currentSettings = DEFAULT_NOTIFICATION_SETTINGS;
  }

  // Merge new settings
  const newSettings: NotificationSettings = {
    reminders: {
      enabled: reminders?.enabled ?? currentSettings.reminders.enabled,
      timings: reminders?.timings ?? currentSettings.reminders.timings,
    },
    channels: {
      email: channels?.email ?? currentSettings.channels.email,
      sms: channels?.sms ?? currentSettings.channels.sms,
    },
  };

  // Save to database
  await prisma.salon.update({
    where: { id: req.user!.salonId },
    data: { notification_settings: JSON.stringify(newSettings) },
  });

  res.json({ success: true, data: newSettings });
}));

// ============================================
// GET /api/v1/salon/time-off-requests
// List pending time-off requests for all staff
// ============================================
router.get('/time-off-requests', asyncHandler(async (req: Request, res: Response) => {
  const salonId = req.user!.salonId;
  const { status } = req.query; // Optional filter: 'pending', 'approved', 'rejected'

  const requests = await prisma.timeOff.findMany({
    where: {
      staff: { salonId },
      ...(status ? { status: status as string } : {}),
    },
    include: {
      staff: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
    orderBy: [{ status: 'asc' }, { startDate: 'asc' }], // pending first, then by date
  });

  res.json({ success: true, data: requests });
}));

// ============================================
// PATCH /api/v1/salon/time-off-requests/:id
// Approve or reject a time-off request
// ============================================
const timeOffReviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reviewNotes: z.string().optional(),
});

router.patch('/time-off-requests/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const salonId = req.user!.salonId;
  const reviewerId = req.user!.userId;

  let data;
  try {
    data = timeOffReviewSchema.parse(req.body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: error.flatten(),
        },
      });
    }
    throw error;
  }

  // Verify request belongs to this salon's staff
  const existing = await prisma.timeOff.findFirst({
    where: { id, staff: { salonId } },
  });

  if (!existing) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Time off request not found' },
    });
  }

  const updated = await prisma.timeOff.update({
    where: { id },
    data: {
      status: data.status,
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
      reviewNotes: data.reviewNotes,
    },
    include: {
      staff: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  // Create notification for staff about status change
  await prisma.notificationJob.create({
    data: {
      salonId,
      staffId: updated.staffId,
      type: `time_off_${data.status}`,
      payload: JSON.stringify({
        staffId: updated.staffId,
        staffEmail: updated.staff.email,
        staffName: `${updated.staff.firstName} ${updated.staff.lastName}`,
        startDate: updated.startDate.toISOString(),
        endDate: updated.endDate.toISOString(),
        status: data.status,
        reviewNotes: data.reviewNotes || null,
      }),
      status: 'pending',
    },
  });

  res.json({ success: true, data: updated });
}));

export { router as salonRouter };
