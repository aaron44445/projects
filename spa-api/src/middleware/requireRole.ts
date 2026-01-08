import { Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest } from '../types/index.js';

/**
 * Role hierarchy - higher index = more permissions
 */
const ROLE_HIERARCHY: UserRole[] = ['STAFF', 'MANAGER', 'OWNER'];

/**
 * Check if user role has sufficient permissions
 */
function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const userLevel = ROLE_HIERARCHY.indexOf(userRole);
  const requiredLevel = ROLE_HIERARCHY.indexOf(requiredRole);
  return userLevel >= requiredLevel;
}

/**
 * Middleware to require a minimum role level
 * Must be used after authenticate middleware
 */
export function requireRole(minimumRole: UserRole) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    if (!hasPermission(user.role, minimumRole)) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `This action requires ${minimumRole} role or higher`,
        },
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to require owner role
 */
export const requireOwner = requireRole('OWNER');

/**
 * Middleware to require manager role (or owner)
 */
export const requireManager = requireRole('MANAGER');

/**
 * Middleware to require staff role (anyone authenticated)
 */
export const requireStaff = requireRole('STAFF');
