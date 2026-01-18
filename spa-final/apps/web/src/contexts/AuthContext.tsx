'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api, ApiError } from '@/lib/api';

// Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'owner' | 'admin' | 'staff';
  avatarUrl?: string;
  phone?: string;
  emailVerified?: boolean;
  createdAt: string;
}

export interface Salon {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  timezone: string;
  currency: string;
  logo?: string;
  settings?: Record<string, unknown>;
  createdAt: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface LoginResponse {
  user: User;
  salon: Salon;
  tokens: AuthTokens;
}

interface RegisterResponse {
  user: User;
  salon: Salon;
  tokens: AuthTokens;
  requiresVerification?: boolean;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken?: string;
}

interface AuthContextType {
  user: User | null;
  salon: Salon | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (salonName: string, email: string, password: string, phone?: string, timezone?: string) => Promise<{ requiresVerification: boolean }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  resendVerificationEmail: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_TOKEN_KEY = 'peacase_access_token';
const REFRESH_TOKEN_KEY = 'peacase_refresh_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Store tokens in localStorage
  const storeTokens = useCallback((tokens: AuthTokens) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    api.setAccessToken(tokens.accessToken);
  }, []);

  // Clear tokens from localStorage
  const clearTokens = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    api.setAccessToken(null);
  }, []);

  // Get stored tokens
  const getStoredTokens = useCallback((): AuthTokens | null => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (accessToken && refreshToken) {
      return { accessToken, refreshToken };
    }
    return null;
  }, []);

  // Refresh authentication
  const refreshAuth = useCallback(async (): Promise<boolean> => {
    const tokens = getStoredTokens();
    if (!tokens?.refreshToken) {
      return false;
    }

    try {
      const response = await api.post<RefreshResponse>('/auth/refresh', {
        refreshToken: tokens.refreshToken,
      });

      if (response.success && response.data) {
        const newAccessToken = response.data.accessToken;
        const newRefreshToken = response.data.refreshToken || tokens.refreshToken;

        storeTokens({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        });

        return true;
      }
      return false;
    } catch {
      clearTokens();
      setUser(null);
      setSalon(null);
      return false;
    }
  }, [getStoredTokens, storeTokens, clearTokens]);

  // Fetch current user data
  const fetchCurrentUser = useCallback(async (): Promise<boolean> => {
    try {
      // Fetch user and salon data
      const [userResponse, salonResponse] = await Promise.all([
        api.get<User>('/users/me'),
        api.get<Salon>('/salon'),
      ]);

      if (userResponse.success && userResponse.data) {
        setUser(userResponse.data);
      }

      if (salonResponse.success && salonResponse.data) {
        setSalon(salonResponse.data);
      }

      return true;
    } catch (error) {
      if (error instanceof ApiError && error.code === 'TOKEN_EXPIRED') {
        // Try to refresh the token
        const refreshed = await refreshAuth();
        if (refreshed) {
          return fetchCurrentUser();
        }
      }
      return false;
    }
  }, [refreshAuth]);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const tokens = getStoredTokens();

      if (tokens?.accessToken) {
        api.setAccessToken(tokens.accessToken);

        const success = await fetchCurrentUser();
        if (!success) {
          // Token might be expired, try refresh
          const refreshed = await refreshAuth();
          if (refreshed) {
            await fetchCurrentUser();
          }
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, [getStoredTokens, fetchCurrentUser, refreshAuth]);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    const response = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    });

    if (response.success && response.data) {
      const { user: userData, salon: salonData, tokens } = response.data;

      storeTokens(tokens);
      setUser(userData);
      setSalon(salonData);
    } else {
      throw new ApiError('LOGIN_FAILED', 'Login failed. Please try again.');
    }
  };

  // Register function
  const register = async (
    salonName: string,
    email: string,
    password: string,
    phone?: string,
    timezone?: string
  ): Promise<{ requiresVerification: boolean }> => {
    const response = await api.post<RegisterResponse>('/auth/register', {
      salonName,
      email,
      password,
      phone,
      timezone: timezone || 'America/Chicago',
    });

    if (response.success && response.data) {
      const { user: userData, salon: salonData, tokens, requiresVerification } = response.data;

      storeTokens(tokens);
      setUser(userData);
      setSalon(salonData);

      return { requiresVerification: requiresVerification ?? true };
    } else {
      throw new ApiError('REGISTER_FAILED', 'Registration failed. Please try again.');
    }
  };

  // Resend verification email
  const resendVerificationEmail = async (email: string): Promise<void> => {
    await api.post('/auth/resend-verification', { email });
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout errors - we'll clear local state anyway
    } finally {
      clearTokens();
      setUser(null);
      setSalon(null);
    }
  };

  const value: AuthContextType = {
    user,
    salon,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshAuth,
    resendVerificationEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
