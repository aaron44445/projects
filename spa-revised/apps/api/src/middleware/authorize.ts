/**
 * Authorization Middleware
 * Role-based access control (RBAC) for protected routes
 */

import { Request, Response, NextFunction } from 'express'
import { hasPermission } from '../services/auth.service'
import { AuthenticatedRequest } from './auth'

/**
 * Create authorization middleware for specific permissions
 * @param requiredPermissions Array of required permissions
 * @returns Middleware function
 */
export function authorize(requiredPermissions: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' })
        return
      }

      // Check if user has required permissions
      const hasAccess = hasPermission(req.user.role, requiredPermissions)

      if (!hasAccess) {
        res.status(403).json({ error: 'Insufficient permissions' })
        return
      }

      next()
    } catch (error: any) {
      res.status(403).json({ error: error.message || 'Forbidden' })
    }
  }
}

/**
 * Shorthand: Require admin role
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin role required' })
    return
  }
  next()
}

/**
 * Shorthand: Require manager or admin role
 */
export function requireManager(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || (req.user.role !== 'manager' && req.user.role !== 'admin')) {
    res.status(403).json({ error: 'Manager role required' })
    return
  }
  next()
}
