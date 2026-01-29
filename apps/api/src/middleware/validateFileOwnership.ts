import { Request, Response, NextFunction } from 'express';
import { prisma } from '@peacase/database';
import logger from '../lib/logger.js';

// Extend Request type to include file metadata
interface FileOwnershipRequest extends Request {
  fileMetadata?: {
    id: string;
    publicId: string;
    salonId: string;
    userId: string;
  };
}

/**
 * Middleware to verify file ownership before allowing DELETE operations.
 *
 * Security features:
 * - Database lookup is authoritative source of ownership
 * - Returns 404 for both "not found" and "unauthorized" (prevents enumeration)
 * - Logs suspicious access attempts for security monitoring
 */
export async function validateFileOwnership(
  req: FileOwnershipRequest,
  res: Response,
  next: NextFunction
) {
  const { publicId } = req.params;
  const userId = req.user?.userId;
  const salonId = req.user?.salonId;

  // If no auth context, return 404 (don't reveal that auth is the issue)
  if (!userId || !salonId) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'File not found',
      },
    });
  }

  try {
    // Database lookup to verify ownership
    const file = await prisma.fileUpload.findFirst({
      where: { publicId },
      select: { id: true, publicId: true, salonId: true, userId: true },
    });

    // File doesn't exist in our tracking
    if (!file) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'File not found',
        },
      });
    }

    // Verify salon ownership (defense in depth)
    if (file.salonId !== salonId) {
      // Log suspicious attempt - this could indicate an attack
      logger.warn({
        userId,
        userSalonId: salonId,
        requestedFileId: publicId,
        actualFileSalonId: file.salonId,
        ipAddress: req.ip || req.headers['x-forwarded-for'],
        userAgent: req.get('user-agent'),
      }, 'File ownership violation attempt');

      // Return 404 to prevent enumeration (don't reveal file exists)
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'File not found',
        },
      });
    }

    // Ownership verified - attach metadata to request for handler use
    req.fileMetadata = file;
    next();
  } catch (error) {
    logger.error({ err: error, publicId }, 'File ownership validation error');
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Unable to verify file access',
      },
    });
  }
}
