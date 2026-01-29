import { Request, Response, NextFunction } from 'express';

/**
 * Middleware that ensures the request is from the staff portal.
 * Checks for portalType: 'staff' claim in the JWT token.
 * Used to protect staff-only routes from owner portal access.
 */
export function staffPortalOnly(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
    });
  }

  // If token doesn't have portalType, it's an owner token (backward compatible)
  if (req.user.portalType && req.user.portalType !== 'staff') {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Staff portal access required' },
    });
  }

  next();
}

/**
 * Middleware that ensures the request is NOT from the staff portal.
 * Rejects tokens with portalType: 'staff' to prevent cross-portal access.
 * Used to protect owner routes from staff portal tokens.
 */
export function ownerPortalOnly(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
    });
  }

  // If portalType is 'staff', reject - staff cannot access owner routes
  if (req.user.portalType === 'staff') {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Staff tokens cannot access owner routes' },
    });
  }

  next();
}

/**
 * Middleware that ensures the authenticated user can only access their own data.
 * Used for staff-specific routes where staff should only see/modify their own records.
 */
export function staffOnly(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
      },
    });
  }

  // Admin and owner can access everything
  if (req.user.role === 'admin' || req.user.role === 'owner') {
    return next();
  }

  // Staff can only access staff routes
  if (req.user.role !== 'staff') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied',
      },
    });
  }

  next();
}

/**
 * Middleware that ensures staff can only access their own data.
 * Checks if the staffId in the route matches the authenticated user's ID.
 */
export function ownDataOnly(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
      },
    });
  }

  // Admin and owner can access any staff data
  if (req.user.role === 'admin' || req.user.role === 'owner') {
    return next();
  }

  // Staff can only access their own data
  const staffId = req.params.staffId || req.params.id;
  if (staffId && staffId !== req.user.userId) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You can only access your own data',
      },
    });
  }

  next();
}

/**
 * Middleware that sets staffId filter for queries.
 * For staff users, automatically filters to their own ID.
 */
export function setStaffFilter(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
      },
    });
  }

  // Staff users can only see their own data
  if (req.user.role === 'staff') {
    req.query.staffId = req.user.userId;
  }

  next();
}
