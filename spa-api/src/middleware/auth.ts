import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt.js';
import { AuthenticatedRequest, AuthUser } from '../types/index.js';
import { UserRole } from '@prisma/client';

/**
 * Authentication middleware
 * Verifies JWT access token and attaches user info to request
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'No token provided',
      },
    });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);

    // Attach user info to request
    (req as AuthenticatedRequest).user = {
      userId: payload.userId,
      email: payload.email,
      organizationId: payload.organizationId,
      role: payload.role as UserRole,
    };

    next();
  } catch (error) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      },
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't require it
 */
export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    (req as AuthenticatedRequest).user = {
      userId: payload.userId,
      email: payload.email,
      organizationId: payload.organizationId,
      role: payload.role as UserRole,
    };
  } catch {
    // Token invalid, but that's okay for optional auth
  }

  next();
}
