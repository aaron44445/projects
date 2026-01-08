import { Request } from 'express';
import { UserRole } from '@prisma/client';

/**
 * Authenticated user info attached to request
 */
export interface AuthUser {
  userId: string;
  email: string;
  organizationId: string;
  role: UserRole;
}

/**
 * Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

/**
 * API Error response format
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Array<{ field: string; message: string }>;
}

/**
 * API Success response format
 */
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    perPage?: number;
  };
}

/**
 * Pagination params
 */
export interface PaginationParams {
  page: number;
  perPage: number;
  skip: number;
  take: number;
}
