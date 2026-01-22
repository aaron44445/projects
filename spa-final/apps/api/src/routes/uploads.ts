import { Router, Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import {
  uploadImage,
  uploadAvatar,
  uploadServiceImage,
  uploadSalonLogo,
  uploadGalleryImage,
  deleteImage,
  validateFileSize,
  validateMimeType,
  UPLOAD_PRESETS,
} from '../services/upload.js';
import { asyncHandler } from '../lib/errorUtils.js';

const router = Router();

// ============================================
// MULTER CONFIGURATION
// ============================================

// File size limits
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Configure multer for memory storage (buffer uploads to Cloudinary)
const storage = multer.memoryStorage();

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Validate MIME type
  if (!validateMimeType(file.mimetype, ALLOWED_MIME_TYPES)) {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
    return;
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1, // Single file uploads only
  },
  fileFilter,
});

// Error handling middleware for multer
function handleMulterError(err: Error, req: Request, res: Response, next: () => void) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `File size exceeds the ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
        },
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TOO_MANY_FILES',
          message: 'Only one file can be uploaded at a time',
        },
      });
    }
    return res.status(400).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: err.message,
      },
    });
  }

  if (err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_FILE_TYPE',
        message: err.message,
      },
    });
  }

  next();
}

// ============================================
// VALIDATION SCHEMAS
// ============================================

const uploadTypeSchema = z.enum(['image', 'avatar', 'logo', 'service', 'gallery']);

const deleteParamsSchema = z.object({
  publicId: z.string().min(1),
});

// ============================================
// ROUTES
// ============================================

/**
 * POST /api/v1/uploads/image
 * Upload a general image (salon logos, service images, etc.)
 *
 * Body (multipart/form-data):
 * - file: The image file
 * - type: 'logo' | 'service' | 'gallery' | 'image' (optional, defaults to 'image')
 *
 * NOTE: For production deployments, consider integrating virus scanning
 * before processing uploads. Options include:
 * - ClamAV daemon with clamav-daemon npm package
 * - AWS Lambda with ClamAV for serverless scanning
 * - VirusTotal API for cloud-based scanning
 * - Commercial solutions like Scanii or Cloudmersive
 */
router.post(
  '/image',
  authenticate,
  upload.single('file'),
  handleMulterError,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_FILE',
            message: 'No file provided',
          },
        });
      }

      // Additional size validation (belt and suspenders)
      if (!validateFileSize(file.size, MAX_FILE_SIZE)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: `File size exceeds the ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
          },
        });
      }

      // Get upload type from body
      const type = req.body.type || 'image';
      const parseResult = uploadTypeSchema.safeParse(type);

      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TYPE',
            message: 'Invalid upload type. Must be one of: image, avatar, logo, service, gallery',
          },
        });
      }

      let result;

      switch (parseResult.data) {
        case 'logo':
          result = await uploadSalonLogo(file.buffer, req.user?.salonId);
          break;
        case 'service':
          result = await uploadServiceImage(file.buffer, req.body.serviceId);
          break;
        case 'gallery':
          result = await uploadGalleryImage(file.buffer);
          break;
        case 'avatar':
          result = await uploadAvatar(file.buffer, req.user?.userId);
          break;
        default:
          result = await uploadImage(file.buffer, {
            folder: `peacase/salons/${req.user?.salonId || 'general'}`,
          });
      }

      res.status(201).json({
        success: true,
        data: {
          publicId: result.publicId,
          url: result.secureUrl,
          thumbnailUrl: result.thumbnailUrl,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
        },
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: error instanceof Error ? error.message : 'Failed to upload image',
        },
      });
    }
  })
);

/**
 * POST /api/v1/uploads/avatar
 * Upload a user avatar with face-detection cropping
 *
 * Body (multipart/form-data):
 * - file: The image file
 *
 * Returns optimized avatar URL with automatic face detection
 */
router.post(
  '/avatar',
  authenticate,
  upload.single('file'),
  handleMulterError,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_FILE',
            message: 'No file provided',
          },
        });
      }

      // Validate file size
      if (!validateFileSize(file.size, MAX_FILE_SIZE)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: `File size exceeds the ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
          },
        });
      }

      const result = await uploadAvatar(file.buffer, req.user?.userId);

      res.status(201).json({
        success: true,
        data: {
          publicId: result.publicId,
          url: result.secureUrl,
          thumbnailUrl: result.thumbnailUrl,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
        },
      });
    } catch (error) {
      console.error('Avatar upload error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: error instanceof Error ? error.message : 'Failed to upload avatar',
        },
      });
    }
  })
);

/**
 * DELETE /api/v1/uploads/:publicId
 * Delete an uploaded image by its public ID
 *
 * Params:
 * - publicId: The Cloudinary public ID (URL encoded if contains slashes)
 */
router.delete(
  '/:publicId(*)',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { publicId } = req.params;

      if (!publicId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PUBLIC_ID',
            message: 'Public ID is required',
          },
        });
      }

      // Validate that the publicId belongs to the user's salon
      // This prevents users from deleting other salons' images
      const salonId = req.user?.salonId;
      if (salonId && !publicId.includes(`peacase/salons/${salonId}`) &&
          !publicId.includes('peacase/avatars') &&
          !publicId.includes('peacase/services') &&
          !publicId.includes('peacase/gallery')) {
        // Check if it's a valid peacase path
        if (!publicId.startsWith('peacase/')) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You do not have permission to delete this image',
            },
          });
        }
      }

      const result = await deleteImage(publicId);

      if (result.result === 'not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Image not found',
          },
        });
      }

      res.json({
        success: true,
        data: {
          message: 'Image deleted successfully',
          publicId,
        },
      });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to delete image',
        },
      });
    }
  })
);

/**
 * GET /api/v1/uploads/config
 * Get upload configuration for frontend
 */
router.get('/config', authenticate, (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      maxFileSize: MAX_FILE_SIZE,
      maxFileSizeMB: MAX_FILE_SIZE / (1024 * 1024),
      allowedMimeTypes: ALLOWED_MIME_TYPES,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
      presets: Object.keys(UPLOAD_PRESETS),
    },
  });
});

export { router as uploadsRouter };
