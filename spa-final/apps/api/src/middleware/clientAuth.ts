import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@peacase/database';
import { env } from '../lib/env.js';

export interface ClientJwtPayload {
  clientId: string;
  salonId: string;
  email: string;
  type: 'client';
}

export interface AuthenticatedClientRequest extends Request {
  client: {
    id: string;
    salonId: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export const authenticateClient = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'No token provided' }
      });
    }

    const token = authHeader.substring(7);

    let payload: ClientJwtPayload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET) as ClientJwtPayload;
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' }
      });
    }

    if (payload.type !== 'client') {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid token type' }
      });
    }

    // Store payload in request - route handlers will verify client exists if needed
    (req as AuthenticatedClientRequest).client = {
      id: payload.clientId,
      salonId: payload.salonId,
      email: payload.email,
      firstName: '', // Will be populated by route handler
      lastName: '' // Will be populated by route handler
    };

    next();
  } catch (error) {
    console.error('Client auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'AUTH_ERROR', message: 'Authentication error' }
    });
  }
};
