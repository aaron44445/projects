/**
 * Unit Tests for Upload Service and Routes
 *
 * Tests for Cloudinary image upload functionality including:
 * - Upload service functions (uploadImage, deleteImage, etc.)
 * - Upload routes (POST /uploads/image, DELETE /uploads/:publicId)
 * - File validation (size, MIME type)
 * - Multer error handling
 * - Image transformations
 * - Avatar, logo, service, gallery presets
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock environment FIRST
vi.mock('../lib/env.js', () => ({
  env: {
    CLOUDINARY_CLOUD_NAME: 'test-cloud',
    CLOUDINARY_API_KEY: 'test-api-key',
    CLOUDINARY_API_SECRET: 'test-api-secret',
  },
}));

// Mock Cloudinary
vi.mock('cloudinary', () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload_stream: vi.fn(),
      destroy: vi.fn(),
    },
    url: vi.fn(),
  },
}));

// Import after mocks are set up
import { request, app, createTestSalon, createTestUser, generateTestTokens } from './helpers';
import * as uploadService from '../services/upload';

describe('Upload Service', () => {
  let mockUploadStream: any;
  let mockDestroy: any;
  let mockUrl: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Get the mocked cloudinary functions
    const cloudinary = await import('cloudinary');
    mockUploadStream = cloudinary.v2.uploader.upload_stream as any;
    mockDestroy = cloudinary.v2.uploader.destroy as any;
    mockUrl = cloudinary.v2.url as any;
  });

  describe('isCloudinaryConfigured', () => {
    it('should return true when Cloudinary is configured', () => {
      expect(uploadService.isCloudinaryConfigured()).toBe(true);
    });
  });

  describe('uploadImage', () => {
    it('should upload image successfully', async () => {
      const mockResult = {
        public_id: 'peacase/uploads/test-image',
        url: 'http://res.cloudinary.com/test/image.jpg',
        secure_url: 'https://res.cloudinary.com/test/image.jpg',
        format: 'jpg',
        width: 800,
        height: 600,
        bytes: 50000,
        eager: [
          { secure_url: 'https://res.cloudinary.com/test/thumb.jpg' },
        ],
      };

      mockUploadStream.mockImplementation((options, callback) => {
        const stream = {
          end: (buffer: Buffer) => {
            callback(undefined, mockResult);
          },
        };
        return stream;
      });

      const buffer = Buffer.from('fake-image-data');
      const result = await uploadService.uploadImage(buffer);

      expect(result).toEqual({
        publicId: 'peacase/uploads/test-image',
        url: 'http://res.cloudinary.com/test/image.jpg',
        secureUrl: 'https://res.cloudinary.com/test/image.jpg',
        format: 'jpg',
        width: 800,
        height: 600,
        bytes: 50000,
        thumbnailUrl: 'https://res.cloudinary.com/test/thumb.jpg',
      });
    });

    it('should apply custom transformations', async () => {
      mockUploadStream.mockImplementation((options, callback) => {
        const stream = {
          end: (buffer: Buffer) => {
            callback(undefined, {
              public_id: 'test',
              url: 'http://test.jpg',
              secure_url: 'https://test.jpg',
              format: 'jpg',
              width: 400,
              height: 400,
              bytes: 10000,
              eager: [],
            });
          },
        };
        return stream;
      });

      const buffer = Buffer.from('fake-image-data');
      await uploadService.uploadImage(buffer, {
        folder: 'test-folder',
        transformation: {
          width: 400,
          height: 400,
          crop: 'fill',
          quality: 'auto:good',
        },
      });

      expect(mockUploadStream).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: 'test-folder',
          transformation: expect.objectContaining({
            width: 400,
            height: 400,
            crop: 'fill',
            quality: 'auto:good',
          }),
        }),
        expect.any(Function)
      );
    });

    it('should handle upload errors', async () => {
      mockUploadStream.mockImplementation((options, callback) => {
        const stream = {
          end: (buffer: Buffer) => {
            callback({ message: 'Upload failed' }, undefined);
          },
        };
        return stream;
      });

      const buffer = Buffer.from('fake-image-data');

      await expect(uploadService.uploadImage(buffer)).rejects.toThrow('Upload failed');
    });

    it('should handle no result error', async () => {
      mockUploadStream.mockImplementation((options, callback) => {
        const stream = {
          end: (buffer: Buffer) => {
            callback(undefined, undefined);
          },
        };
        return stream;
      });

      const buffer = Buffer.from('fake-image-data');

      await expect(uploadService.uploadImage(buffer)).rejects.toThrow('No result returned');
    });

    it('should use custom public ID when provided', async () => {
      mockUploadStream.mockImplementation((options, callback) => {
        const stream = {
          end: (buffer: Buffer) => {
            callback(undefined, {
              public_id: 'custom-id',
              url: 'http://test.jpg',
              secure_url: 'https://test.jpg',
              format: 'jpg',
              width: 800,
              height: 600,
              bytes: 50000,
              eager: [],
            });
          },
        };
        return stream;
      });

      const buffer = Buffer.from('fake-image-data');
      await uploadService.uploadImage(buffer, { publicId: 'custom-id' });

      expect(mockUploadStream).toHaveBeenCalledWith(
        expect.objectContaining({
          public_id: 'custom-id',
        }),
        expect.any(Function)
      );
    });

    it('should generate eager thumbnails', async () => {
      mockUploadStream.mockImplementation((options, callback) => {
        const stream = {
          end: (buffer: Buffer) => {
            callback(undefined, {
              public_id: 'test',
              url: 'http://test.jpg',
              secure_url: 'https://test.jpg',
              format: 'jpg',
              width: 800,
              height: 600,
              bytes: 50000,
              eager: [],
            });
          },
        };
        return stream;
      });

      const buffer = Buffer.from('fake-image-data');
      await uploadService.uploadImage(buffer);

      expect(mockUploadStream).toHaveBeenCalledWith(
        expect.objectContaining({
          eager: [
            { width: 150, height: 150, crop: 'thumb', gravity: 'auto', format: 'webp' },
          ],
          eager_async: true,
        }),
        expect.any(Function)
      );
    });
  });

  describe('uploadAvatar', () => {
    it('should upload avatar with face detection', async () => {
      mockUploadStream.mockImplementation((options, callback) => {
        const stream = {
          end: (buffer: Buffer) => {
            callback(undefined, {
              public_id: 'peacase/avatars/avatar_user-123',
              url: 'http://avatar.jpg',
              secure_url: 'https://avatar.jpg',
              format: 'webp',
              width: 200,
              height: 200,
              bytes: 5000,
              eager: [],
            });
          },
        };
        return stream;
      });

      const buffer = Buffer.from('fake-image-data');
      const result = await uploadService.uploadAvatar(buffer, 'user-123');

      expect(mockUploadStream).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: 'peacase/avatars',
          public_id: 'avatar_user-123',
          transformation: expect.objectContaining({
            width: 200,
            height: 200,
            crop: 'thumb',
            gravity: 'face',
          }),
        }),
        expect.any(Function)
      );

      expect(result.publicId).toBe('peacase/avatars/avatar_user-123');
    });
  });

  describe('uploadServiceImage', () => {
    it('should upload service image with landscape optimization', async () => {
      mockUploadStream.mockImplementation((options, callback) => {
        const stream = {
          end: (buffer: Buffer) => {
            callback(undefined, {
              public_id: 'peacase/services/service_svc-123',
              url: 'http://service.jpg',
              secure_url: 'https://service.jpg',
              format: 'webp',
              width: 800,
              height: 600,
              bytes: 50000,
              eager: [],
            });
          },
        };
        return stream;
      });

      const buffer = Buffer.from('fake-image-data');
      await uploadService.uploadServiceImage(buffer, 'svc-123');

      expect(mockUploadStream).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: 'peacase/services',
          public_id: 'service_svc-123',
          transformation: expect.objectContaining({
            width: 800,
            height: 600,
            crop: 'fill',
          }),
        }),
        expect.any(Function)
      );
    });
  });

  describe('uploadSalonLogo', () => {
    it('should upload salon logo with square optimization', async () => {
      mockUploadStream.mockImplementation((options, callback) => {
        const stream = {
          end: (buffer: Buffer) => {
            callback(undefined, {
              public_id: 'peacase/salons/logos/salon_salon-123',
              url: 'http://logo.jpg',
              secure_url: 'https://logo.jpg',
              format: 'webp',
              width: 400,
              height: 400,
              bytes: 10000,
              eager: [],
            });
          },
        };
        return stream;
      });

      const buffer = Buffer.from('fake-image-data');
      await uploadService.uploadSalonLogo(buffer, 'salon-123');

      expect(mockUploadStream).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: 'peacase/salons/logos',
          public_id: 'salon_salon-123',
          transformation: expect.objectContaining({
            width: 400,
            height: 400,
            crop: 'fill',
            gravity: 'center',
          }),
        }),
        expect.any(Function)
      );
    });
  });

  describe('uploadGalleryImage', () => {
    it('should upload gallery image with high quality', async () => {
      mockUploadStream.mockImplementation((options, callback) => {
        const stream = {
          end: (buffer: Buffer) => {
            callback(undefined, {
              public_id: 'peacase/gallery/img-123',
              url: 'http://gallery.jpg',
              secure_url: 'https://gallery.jpg',
              format: 'webp',
              width: 1200,
              height: 800,
              bytes: 200000,
              eager: [],
            });
          },
        };
        return stream;
      });

      const buffer = Buffer.from('fake-image-data');
      await uploadService.uploadGalleryImage(buffer);

      expect(mockUploadStream).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: 'peacase/gallery',
          transformation: expect.objectContaining({
            width: 1200,
            height: 800,
            quality: 'auto:best',
          }),
        }),
        expect.any(Function)
      );
    });
  });

  describe('deleteImage', () => {
    it('should delete image successfully', async () => {
      mockDestroy.mockImplementation((publicId, callback) => {
        callback(null, { result: 'ok' });
      });

      const result = await uploadService.deleteImage('peacase/uploads/test-image');

      expect(result).toEqual({ result: 'ok' });
      expect(mockDestroy).toHaveBeenCalledWith('peacase/uploads/test-image', expect.any(Function));
    });

    it('should handle not found result', async () => {
      mockDestroy.mockImplementation((publicId, callback) => {
        callback(null, { result: 'not found' });
      });

      const result = await uploadService.deleteImage('nonexistent-image');

      expect(result).toEqual({ result: 'not found' });
    });

    it('should handle delete errors', async () => {
      mockDestroy.mockImplementation((publicId, callback) => {
        callback({ message: 'Delete failed' }, null);
      });

      await expect(uploadService.deleteImage('test-image')).rejects.toThrow('Delete failed');
    });
  });

  describe('Validation utilities', () => {
    it('should validate file size within limit', () => {
      const result = uploadService.validateFileSize(1024 * 1024); // 1MB
      expect(result).toBe(true);
    });

    it('should reject file size exceeding limit', () => {
      const result = uploadService.validateFileSize(10 * 1024 * 1024); // 10MB
      expect(result).toBe(false);
    });

    it('should validate allowed MIME types', () => {
      expect(uploadService.validateMimeType('image/jpeg')).toBe(true);
      expect(uploadService.validateMimeType('image/png')).toBe(true);
      expect(uploadService.validateMimeType('image/webp')).toBe(true);
    });

    it('should reject disallowed MIME types', () => {
      expect(uploadService.validateMimeType('application/pdf')).toBe(false);
      expect(uploadService.validateMimeType('text/html')).toBe(false);
    });

    it('should extract public ID from Cloudinary URL', () => {
      const url = 'https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg';
      const publicId = uploadService.extractPublicId(url);
      expect(publicId).toBe('sample');
    });

    it('should return null for invalid URL', () => {
      const publicId = uploadService.extractPublicId('invalid-url');
      expect(publicId).toBeNull();
    });
  });

  describe('URL generation', () => {
    it('should generate optimized URL with transformations', () => {
      mockUrl.mockReturnValue('https://res.cloudinary.com/test/optimized.jpg');

      const url = uploadService.getOptimizedUrl('test-image', {
        width: 300,
        height: 200,
        crop: 'fill',
      });

      expect(mockUrl).toHaveBeenCalledWith(
        'test-image',
        expect.objectContaining({
          width: 300,
          height: 200,
          crop: 'fill',
          secure: true,
        })
      );

      expect(url).toBe('https://res.cloudinary.com/test/optimized.jpg');
    });

    it('should generate thumbnail URL', () => {
      mockUrl.mockReturnValue('https://res.cloudinary.com/test/thumb.jpg');

      const url = uploadService.getThumbnailUrl('test-image', 100);

      expect(mockUrl).toHaveBeenCalledWith(
        'test-image',
        expect.objectContaining({
          width: 100,
          height: 100,
          crop: 'thumb',
          gravity: 'auto',
          format: 'webp',
          secure: true,
        })
      );

      expect(url).toBe('https://res.cloudinary.com/test/thumb.jpg');
    });
  });
});

describe('Upload Routes', () => {
  let mockUploadStream: any;
  let mockDestroy: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Get the mocked cloudinary functions
    const cloudinary = await import('cloudinary');
    mockUploadStream = cloudinary.v2.uploader.upload_stream as any;
    mockDestroy = cloudinary.v2.uploader.destroy as any;

    // Setup default successful upload mock
    mockUploadStream.mockImplementation((options, callback) => {
      const stream = {
        end: (buffer: Buffer) => {
          callback(undefined, {
            public_id: 'peacase/uploads/test',
            url: 'http://test.jpg',
            secure_url: 'https://test.jpg',
            format: 'jpg',
            width: 800,
            height: 600,
            bytes: 50000,
            eager: [{ secure_url: 'https://thumb.jpg' }],
          });
        },
      };
      return stream;
    });
  });

  describe('POST /api/v1/uploads/image', () => {
    it('should upload image with authentication', async () => {
      const salon = await createTestSalon();
      const user = await createTestUser(salon.id);
      const tokens = generateTestTokens(user.id, salon.id);

      const response = await request(app)
        .post('/api/v1/uploads/image')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .attach('file', Buffer.from('fake-image-data'), 'test.jpg');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        publicId: 'peacase/uploads/test',
        url: 'https://test.jpg',
        format: 'jpg',
        width: 800,
        height: 600,
      });
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/v1/uploads/image')
        .attach('file', Buffer.from('fake-image-data'), 'test.jpg');

      expect(response.status).toBe(401);
    });

    it('should reject request with no file', async () => {
      const salon = await createTestSalon();
      const user = await createTestUser(salon.id);
      const tokens = generateTestTokens(user.id, salon.id);

      const response = await request(app)
        .post('/api/v1/uploads/image')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('NO_FILE');
    });

    it('should upload with type=logo', async () => {
      const salon = await createTestSalon();
      const user = await createTestUser(salon.id);
      const tokens = generateTestTokens(user.id, salon.id);

      const response = await request(app)
        .post('/api/v1/uploads/image')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .field('type', 'logo')
        .attach('file', Buffer.from('fake-image-data'), 'logo.jpg');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should upload with type=service', async () => {
      const salon = await createTestSalon();
      const user = await createTestUser(salon.id);
      const tokens = generateTestTokens(user.id, salon.id);

      const response = await request(app)
        .post('/api/v1/uploads/image')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .field('type', 'service')
        .attach('file', Buffer.from('fake-image-data'), 'service.jpg');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should reject invalid upload type', async () => {
      const salon = await createTestSalon();
      const user = await createTestUser(salon.id);
      const tokens = generateTestTokens(user.id, salon.id);

      const response = await request(app)
        .post('/api/v1/uploads/image')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .field('type', 'invalid-type')
        .attach('file', Buffer.from('fake-image-data'), 'test.jpg');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_TYPE');
    });
  });

  describe('POST /api/v1/uploads/avatar', () => {
    it('should upload avatar', async () => {
      const salon = await createTestSalon();
      const user = await createTestUser(salon.id);
      const tokens = generateTestTokens(user.id, salon.id);

      const response = await request(app)
        .post('/api/v1/uploads/avatar')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .attach('file', Buffer.from('fake-image-data'), 'avatar.jpg');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.publicId).toBeDefined();
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/v1/uploads/avatar')
        .attach('file', Buffer.from('fake-image-data'), 'avatar.jpg');

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/v1/uploads/:publicId', () => {
    it('should delete image with authentication', async () => {
      mockDestroy.mockImplementation((publicId, callback) => {
        callback(null, { result: 'ok' });
      });

      const salon = await createTestSalon();
      const user = await createTestUser(salon.id);
      const tokens = generateTestTokens(user.id, salon.id);

      const response = await request(app)
        .delete(`/api/v1/uploads/peacase/salons/${salon.id}/test-image`)
        .set('Authorization', `Bearer ${tokens.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Image deleted successfully');
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .delete('/api/v1/uploads/peacase/uploads/test-image');

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent image', async () => {
      mockDestroy.mockImplementation((publicId, callback) => {
        callback(null, { result: 'not found' });
      });

      const salon = await createTestSalon();
      const user = await createTestUser(salon.id);
      const tokens = generateTestTokens(user.id, salon.id);

      const response = await request(app)
        .delete('/api/v1/uploads/peacase/avatars/nonexistent')
        .set('Authorization', `Bearer ${tokens.accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/v1/uploads/config', () => {
    it('should return upload configuration', async () => {
      const salon = await createTestSalon();
      const user = await createTestUser(salon.id);
      const tokens = generateTestTokens(user.id, salon.id);

      const response = await request(app)
        .get('/api/v1/uploads/config')
        .set('Authorization', `Bearer ${tokens.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        maxFileSize: expect.any(Number),
        maxFileSizeMB: expect.any(Number),
        allowedMimeTypes: expect.any(Array),
        allowedExtensions: expect.any(Array),
        presets: expect.any(Array),
      });
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/v1/uploads/config');

      expect(response.status).toBe(401);
    });
  });
});
