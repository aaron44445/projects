const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: Record<string, string[]> };
}

export class ApiError extends Error {
  constructor(public code: string, message: string, public details?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
  }
}

// Token storage keys (must match AuthContext)
const ACCESS_TOKEN_KEY = 'peacase_access_token';
const REFRESH_TOKEN_KEY = 'peacase_refresh_token';

// Decode JWT payload without verification (just to check expiry)
function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

// Check if token expires within given minutes
function isTokenExpiringSoon(token: string, withinMinutes: number = 5): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true; // Assume expired if can't decode

  const expiresAt = payload.exp * 1000; // Convert to ms
  const now = Date.now();
  const threshold = withinMinutes * 60 * 1000;

  return (expiresAt - now) < threshold;
}

// Check if token is expired
function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

type RefreshCallback = () => Promise<boolean>;

class ApiClient {
  private accessToken: string | null = null;
  private refreshCallback: RefreshCallback | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  // Set callback for token refresh (called from AuthContext)
  setRefreshCallback(callback: RefreshCallback | null) {
    this.refreshCallback = callback;
  }

  // Proactively refresh token if expiring soon
  private async ensureValidToken(): Promise<void> {
    if (!this.accessToken) return;

    // If token is expiring soon (within 5 minutes), refresh proactively
    if (isTokenExpiringSoon(this.accessToken, 5)) {
      await this.refreshTokenIfNeeded();
    }
  }

  // Refresh token with deduplication (prevent multiple simultaneous refreshes)
  private async refreshTokenIfNeeded(): Promise<boolean> {
    if (!this.refreshCallback) return false;

    // If already refreshing, wait for that to complete
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.refreshCallback();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  // Helper to wait for a specified number of milliseconds
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<ApiResponse<T>> {
    // Proactively refresh if token is expiring soon (but not for refresh endpoint itself)
    if (!endpoint.includes('/auth/refresh')) {
      await this.ensureValidToken();
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    // Add timeout to prevent infinite hangs
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        const errorCode = data.error?.code || 'UNKNOWN';
        const errorMessage = data.error?.message || 'An error occurred';

        // Handle 429 (rate limit) errors - retry with exponential backoff (max 3 retries)
        if (response.status === 429 && retryCount < 3) {
          // Get retry delay from header, or use exponential backoff
          const retryAfter = response.headers.get('Retry-After');
          const delayMs = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : Math.min(1000 * Math.pow(2, retryCount), 10000); // 1s, 2s, 4s max 10s

          await this.sleep(delayMs);
          return this.request<T>(endpoint, options, retryCount + 1);
        }

        // Handle 401 errors - try to refresh token and retry once
        if (response.status === 401 && retryCount === 0 && !endpoint.includes('/auth/refresh')) {
          const refreshed = await this.refreshTokenIfNeeded();
          if (refreshed) {
            // Retry the original request with new token
            return this.request<T>(endpoint, options, retryCount + 1);
          }

          // Refresh failed - provide user-friendly message
          throw new ApiError(
            'SESSION_EXPIRED',
            'Your session has expired. Please log in again.',
            data.error?.details
          );
        }

        // Provide user-friendly messages for common errors
        const friendlyMessage = this.getFriendlyErrorMessage(errorCode, errorMessage);
        throw new ApiError(errorCode, friendlyMessage, data.error?.details);
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('TIMEOUT', 'Request timed out. Please check your connection and try again.');
      }
      throw error;
    }
  }

  // Convert technical errors to user-friendly messages
  private getFriendlyErrorMessage(code: string, message: string): string {
    const friendlyMessages: Record<string, string> = {
      'INVALID_TOKEN': 'Your session has expired. Please log in again.',
      'TOKEN_EXPIRED': 'Your session has expired. Please log in again.',
      'UNAUTHORIZED': 'Please log in to continue.',
      'FORBIDDEN': 'You don\'t have permission to perform this action.',
      'NOT_FOUND': 'The requested resource was not found.',
      'VALIDATION_ERROR': message, // Keep validation messages as-is
      'RATE_LIMITED': 'Too many requests. Please wait a moment and try again.',
      'SERVER_ERROR': 'Something went wrong. Please try again later.',
    };

    return friendlyMessages[code] || message;
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async patch<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();

// Export utility functions for use elsewhere
export { isTokenExpired, isTokenExpiringSoon, decodeJwtPayload };
