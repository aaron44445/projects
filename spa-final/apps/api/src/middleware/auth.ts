import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../lib/env.js';
import { setSentryUser } from '../lib/sentry.js';

interface JWTPayload {
  userId: string;
  salonId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      userLocations?: string[] | null; // null = all locations, array = specific locations
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Please log in to continue.',
      },
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(
      token,
      env.JWT_SECRET
    ) as JWTPayload;

    req.user = decoded;

    // Set Sentry user context for error tracking
    setSentryUser({
      id: decoded.userId,
      salonId: decoded.salonId,
      role: decoded.role,
    });

    next();
  } catch (error) {
    // Provide specific error messages based on JWT error type
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Your session has expired. Please log in again.',
        },
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Your session is invalid. Please log in again.',
        },
      });
    }

    if (error instanceof jwt.NotBeforeError) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_NOT_ACTIVE',
          message: 'Your session is not yet active. Please try again.',
        },
      });
    }

    // Generic error fallback
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication failed. Please log in again.',
      },
    });
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Please log in to continue.',
        },
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You don\'t have permission to perform this action.',
        },
      });
    }

    next();
  };
}
