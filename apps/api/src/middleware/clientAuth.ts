import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@peacase/database';
import { env } from '../lib/env.js';
import logger from '../lib/logger.js';

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
        error: { code: 'UNAUTHORIZED', message: 'Please log in to continue.' }
      });
    }

    const token = authHeader.substring(7);

    let payload: ClientJwtPayload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET) as ClientJwtPayload;
    } catch (error) {
      // Provide specific error messages based on JWT error type
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          success: false,
          error: { code: 'TOKEN_EXPIRED', message: 'Your session has expired. Please log in again.' }
        });
      }

      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          success: false,
          error: { code: 'INVALID_TOKEN', message: 'Your session is invalid. Please log in again.' }
        });
      }

      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication failed. Please log in again.' }
      });
    }

    if (payload.type !== 'client') {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid session type. Please use the client portal to log in.' }
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
    logger.error({ err: error }, 'Client auth middleware error');
    return res.status(500).json({
      success: false,
      error: { code: 'AUTH_ERROR', message: 'Something went wrong. Please try again.' }
    });
  }
};
