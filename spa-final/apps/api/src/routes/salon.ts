import { Router, Request, Response } from 'express';
import { prisma } from '@peacase/database';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../lib/errorUtils.js';

const router = Router();

// ============================================
// GET /api/v1/salon
// Get current salon details
// ============================================
router.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
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
router.patch('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { name, phone, address, city, state, zip, timezone, website, description, multiLocationEnabled } = req.body;

  const salon = await prisma.salon.update({
    where: { id: req.user!.salonId },
    data: {
      ...(name && { name }),
      ...(phone && { phone }),
      ...(address && { address }),
      ...(city && { city }),
      ...(state && { state }),
      ...(zip && { zip }),
      ...(timezone && { timezone }),
      ...(website && { website }),
      ...(description && { description }),
      ...(typeof multiLocationEnabled === 'boolean' && { multiLocationEnabled }),
    },
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
router.get('/features', authenticate, asyncHandler(async (req: Request, res: Response) => {
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
router.get('/widget-settings', authenticate, asyncHandler(async (req: Request, res: Response) => {
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
router.patch('/widget-settings', authenticate, asyncHandler(async (req: Request, res: Response) => {
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

export { router as salonRouter };
