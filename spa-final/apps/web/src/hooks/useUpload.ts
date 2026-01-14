'use client';

import { useState, useCallback, useRef } from 'react';
import { api, ApiError } from '@/lib/api';

// ============================================
// TYPES
// ============================================

export type UploadType = 'image' | 'avatar' | 'logo' | 'service' | 'gallery';

export interface UploadedImage {
  publicId: string;
  url: string;
  thumbnailUrl?: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

export interface UploadConfig {
  maxFileSize: number;
  maxFileSizeMB: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  presets: string[];
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UseUploadOptions {
  type?: UploadType;
  onSuccess?: (result: UploadedImage) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: UploadProgress) => void;
}

export interface UseUploadReturn {
  // State
  isUploading: boolean;
  progress: UploadProgress | null;
  error: string | null;
  preview: string | null;
  uploadedImage: UploadedImage | null;

  // Actions
  selectFile: (file: File) => void;
  upload: () => Promise<UploadedImage | null>;
  uploadFile: (file: File) => Promise<UploadedImage | null>;
  deleteImage: (publicId: string) => Promise<boolean>;
  reset: () => void;
  clearError: () => void;

  // Validation
  validateFile: (file: File) => string | null;

  // Refs
  inputRef: React.RefObject<HTMLInputElement>;
  openFilePicker: () => void;
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useUpload(options: UseUploadOptions = {}): UseUploadReturn {
  const { type = 'image', onSuccess, onError, onProgress } = options;

  // State
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ============================================
  // VALIDATION
  // ============================================

  const validateFile = useCallback((file: File): string | null => {
    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return `Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`;
    }

    // Check file size
    if (file.size > DEFAULT_MAX_FILE_SIZE) {
      return `File size exceeds ${DEFAULT_MAX_FILE_SIZE / (1024 * 1024)}MB limit`;
    }

    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      return `Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`;
    }

    return null;
  }, []);

  // ============================================
  // FILE SELECTION
  // ============================================

  const selectFile = useCallback((file: File) => {
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      onError?.(validationError);
      return;
    }

    // Clear previous state
    setError(null);
    setUploadedImage(null);

    // Store selected file
    setSelectedFile(file);

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
  }, [validateFile, onError]);

  // ============================================
  // UPLOAD FUNCTIONS
  // ============================================

  const uploadWithProgress = useCallback(async (
    file: File,
    uploadType: UploadType
  ): Promise<UploadedImage> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', uploadType);

      const xhr = new XMLHttpRequest();
      abortControllerRef.current = new AbortController();

      // Track progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progressData: UploadProgress = {
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
          };
          setProgress(progressData);
          onProgress?.(progressData);
        }
      });

      xhr.addEventListener('load', () => {
        try {
          const response = JSON.parse(xhr.responseText);

          if (xhr.status >= 200 && xhr.status < 300 && response.success) {
            resolve(response.data as UploadedImage);
          } else {
            reject(new Error(response.error?.message || 'Upload failed'));
          }
        } catch {
          reject(new Error('Invalid response from server'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      // Determine endpoint based on type
      const endpoint = uploadType === 'avatar' ? '/uploads/avatar' : '/uploads/image';

      xhr.open('POST', `${API_BASE}${endpoint}`);

      // Add auth token if available
      const token = api.getAccessToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.send(formData);
    });
  }, [onProgress]);

  const upload = useCallback(async (): Promise<UploadedImage | null> => {
    if (!selectedFile) {
      setError('No file selected');
      return null;
    }

    setIsUploading(true);
    setError(null);
    setProgress({ loaded: 0, total: 100, percentage: 0 });

    try {
      const result = await uploadWithProgress(selectedFile, type);

      setUploadedImage(result);
      setProgress({ loaded: 100, total: 100, percentage: 100 });
      onSuccess?.(result);

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      onError?.(message);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, type, uploadWithProgress, onSuccess, onError]);

  const uploadFile = useCallback(async (file: File): Promise<UploadedImage | null> => {
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      onError?.(validationError);
      return null;
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    setIsUploading(true);
    setError(null);
    setProgress({ loaded: 0, total: 100, percentage: 0 });

    try {
      const result = await uploadWithProgress(file, type);

      setUploadedImage(result);
      setProgress({ loaded: 100, total: 100, percentage: 100 });
      onSuccess?.(result);

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      onError?.(message);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [type, validateFile, uploadWithProgress, onSuccess, onError]);

  // ============================================
  // DELETE FUNCTION
  // ============================================

  const deleteImage = useCallback(async (publicId: string): Promise<boolean> => {
    try {
      const encodedId = encodeURIComponent(publicId);
      const response = await api.delete(`/uploads/${encodedId}`);

      if (response.success) {
        // Clear state if deleted image matches current
        if (uploadedImage?.publicId === publicId) {
          setUploadedImage(null);
          setPreview(null);
        }
        return true;
      }

      return false;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete image';
      setError(message);
      onError?.(message);
      return false;
    }
  }, [uploadedImage, onError]);

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  const reset = useCallback(() => {
    // Abort any ongoing upload
    abortControllerRef.current?.abort();

    // Revoke preview URL to free memory
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    // Reset all state
    setIsUploading(false);
    setProgress(null);
    setError(null);
    setPreview(null);
    setUploadedImage(null);
    setSelectedFile(null);

    // Clear input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [preview]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return {
    // State
    isUploading,
    progress,
    error,
    preview,
    uploadedImage,

    // Actions
    selectFile,
    upload,
    uploadFile,
    deleteImage,
    reset,
    clearError,

    // Validation
    validateFile,

    // Refs
    inputRef,
    openFilePicker,
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
  return ALLOWED_MIME_TYPES.includes(file.type);
}
