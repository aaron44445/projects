/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user information to request
 */

import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken, extractToken } from '../utils/auth'

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string
    salonId: string
    role: string
    email: string
  }
}

/**
 * Middleware to authenticate requests using JWT
 */
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    // Extract token from Authorization header
    const token = extractToken(req.headers.authorization)

    if (!token) {
      res.status(401).json({ error: 'Missing or invalid authorization header' })
      return
    }

    // Verify token
    const payload = verifyAccessToken(token)

    // Attach user to request
    req.user = {
      userId: payload.userId,
      salonId: payload.salonId,
      role: payload.role,
      email: payload.email,
    }

    next()
  } catch (error: any) {
    res.status(401).json({ error: error.message || 'Unauthorized' })
  }
}
