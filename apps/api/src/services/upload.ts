import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { env } from '../lib/env.js';

// ============================================
// CLOUDINARY CONFIGURATION
// ============================================

// Only configure Cloudinary if credentials are provided
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Check if Cloudinary is configured
 */
export function isCloudinaryConfigured(): boolean {
  return !!(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
}

// ============================================
// TYPES
// ============================================

export interface UploadOptions {
  folder?: string;
  publicId?: string;
  transformation?: TransformationOptions;
  resourceType?: 'image' | 'raw' | 'video' | 'auto';
  allowedFormats?: string[];
  maxFileSize?: number;
}

export interface TransformationOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'thumb' | 'limit';
  gravity?: 'face' | 'center' | 'auto';
  quality?: 'auto' | 'auto:low' | 'auto:good' | 'auto:best' | number;
  format?: 'webp' | 'jpg' | 'png' | 'auto';
  aspectRatio?: string;
}

export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  thumbnailUrl?: string;
}

export interface DeleteResult {
  result: 'ok' | 'not found';
}

// ============================================
// PRESET TRANSFORMATIONS
// ============================================

export const UPLOAD_PRESETS = {
  // Salon logos - square format with good quality
  salonLogo: {
    folder: 'peacase/salons/logos',
    transformation: {
      width: 400,
      height: 400,
      crop: 'fill' as const,
      gravity: 'center' as const,
      quality: 'auto:good' as const,
      format: 'webp' as const,
    },
  },

  // Service images - landscape format for cards
  serviceImage: {
    folder: 'peacase/services',
    transformation: {
      width: 800,
      height: 600,
      crop: 'fill' as const,
      gravity: 'auto' as const,
      quality: 'auto:good' as const,
      format: 'webp' as const,
    },
  },

  // User avatars - circular format optimized
  avatar: {
    folder: 'peacase/avatars',
    transformation: {
      width: 200,
      height: 200,
      crop: 'thumb' as const,
      gravity: 'face' as const,
      quality: 'auto:good' as const,
      format: 'webp' as const,
    },
  },

  // Gallery images - high quality for portfolio
  gallery: {
    folder: 'peacase/gallery',
    transformation: {
      width: 1200,
      height: 800,
      crop: 'limit' as const,
      quality: 'auto:best' as const,
      format: 'webp' as const,
    },
  },
} as const;

// ============================================
// UPLOAD UTILITIES
// ============================================

/**
 * Upload an image buffer to Cloudinary
 *
 * @param buffer - The file buffer to upload
 * @param options - Upload options including folder, transformations, etc.
 * @returns Upload result with URLs and metadata
 *
 * NOTE: For production, consider adding virus scanning before upload.
 * Services like ClamAV or cloud-based solutions (VirusTotal API, AWS Lambda with ClamAV)
 * can be integrated to scan file buffers before processing.
 */
export async function uploadImage(
  buffer: Buffer,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const {
    folder = 'peacase/uploads',
    publicId,
    transformation,
    resourceType = 'image',
    allowedFormats = ['jpg', 'jpeg', 'png', 'webp'],
  } = options;

  return new Promise((resolve, reject) => {
    const uploadOptions: Record<string, unknown> = {
      folder,
      resource_type: resourceType,
      allowed_formats: allowedFormats,
      unique_filename: true,
      overwrite: false,
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    // Apply transformation if provided
    if (transformation) {
      uploadOptions.transformation = buildTransformation(transformation);
    }

    // Always generate eager thumbnail for quick loading
    uploadOptions.eager = [
      { width: 150, height: 150, crop: 'thumb', gravity: 'auto', format: 'webp' },
    ];
    uploadOptions.eager_async = true;

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) {
          reject(new Error(`Upload failed: ${error.message}`));
          return;
        }

        if (!result) {
          reject(new Error('Upload failed: No result returned'));
          return;
        }

        const thumbnailUrl = result.eager?.[0]?.secure_url;

        resolve({
          publicId: result.public_id,
          url: result.url,
          secureUrl: result.secure_url,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          thumbnailUrl,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Upload an avatar with face-detection optimized cropping
 */
export async function uploadAvatar(buffer: Buffer, userId?: string): Promise<UploadResult> {
  const options: UploadOptions = {
    ...UPLOAD_PRESETS.avatar,
    publicId: userId ? `avatar_${userId}` : undefined,
  };

  return uploadImage(buffer, options);
}

/**
 * Upload a service image with landscape optimization
 */
export async function uploadServiceImage(buffer: Buffer, serviceId?: string): Promise<UploadResult> {
  const options: UploadOptions = {
    ...UPLOAD_PRESETS.serviceImage,
    publicId: serviceId ? `service_${serviceId}` : undefined,
  };

  return uploadImage(buffer, options);
}

/**
 * Upload a salon logo with square optimization
 */
export async function uploadSalonLogo(buffer: Buffer, salonId?: string): Promise<UploadResult> {
  const options: UploadOptions = {
    ...UPLOAD_PRESETS.salonLogo,
    publicId: salonId ? `salon_${salonId}` : undefined,
  };

  return uploadImage(buffer, options);
}

/**
 * Upload a gallery image with high quality preservation
 */
export async function uploadGalleryImage(buffer: Buffer): Promise<UploadResult> {
  return uploadImage(buffer, UPLOAD_PRESETS.gallery);
}

/**
 * Delete an image from Cloudinary by public ID
 */
export async function deleteImage(publicId: string): Promise<DeleteResult> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        reject(new Error(`Delete failed: ${error.message}`));
        return;
      }

      resolve({
        result: result?.result === 'ok' ? 'ok' : 'not found',
      });
    });
  });
}

/**
 * Generate an optimized URL for an existing image with transformations
 */
export function getOptimizedUrl(
  publicId: string,
  transformation?: TransformationOptions
): string {
  const transformOptions = transformation
    ? buildTransformation(transformation)
    : { quality: 'auto', format: 'webp' };

  return cloudinary.url(publicId, {
    ...transformOptions,
    secure: true,
  });
}

/**
 * Generate a thumbnail URL for an existing image
 */
export function getThumbnailUrl(
  publicId: string,
  size: number = 150
): string {
  return cloudinary.url(publicId, {
    width: size,
    height: size,
    crop: 'thumb',
    gravity: 'auto',
    quality: 'auto',
    format: 'webp',
    secure: true,
  });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function buildTransformation(options: TransformationOptions): Record<string, unknown> {
  const transformation: Record<string, unknown> = {};

  if (options.width) transformation.width = options.width;
  if (options.height) transformation.height = options.height;
  if (options.crop) transformation.crop = options.crop;
  if (options.gravity) transformation.gravity = options.gravity;
  if (options.quality) transformation.quality = options.quality;
  if (options.format) transformation.format = options.format;
  if (options.aspectRatio) transformation.aspect_ratio = options.aspectRatio;

  return transformation;
}

/**
 * Validate file size (in bytes)
 * Default max: 5MB for images
 */
export function validateFileSize(bytes: number, maxBytes: number = 5 * 1024 * 1024): boolean {
  return bytes <= maxBytes;
}

/**
 * Validate file MIME type
 */
export function validateMimeType(
  mimeType: string,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp']
): boolean {
  return allowedTypes.includes(mimeType);
}

/**
 * Extract public ID from Cloudinary URL
 */
export function extractPublicId(url: string): string | null {
  try {
    // URL format: https://res.cloudinary.com/{cloud}/image/upload/v{version}/{public_id}.{format}
    const match = url.match(/\/v\d+\/(.+)\.\w+$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export { cloudinary };
