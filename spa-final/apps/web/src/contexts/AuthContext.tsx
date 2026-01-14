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
  avatar?: string;
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

interface LoginResponse {
  user: User;
  salon: Salon;
}

interface RegisterResponse {
  user: User;
  salon: Salon;
  requiresVerification?: boolean;
}

interface RefreshResponse {
  success: boolean;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Refresh authentication using HTTP-only cookies
  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await api.post<RefreshResponse>('/auth/refresh');

      if (response.success) {
        // Token is refreshed in HTTP-only cookie automatically
        return true;
      }
      return false;
    } catch {
      setUser(null);
      setSalon(null);
      return false;
    }
  }, []);

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
      // Try to fetch current user (cookies will be sent automatically)
      const success = await fetchCurrentUser();

      if (!success) {
        // Token might be expired, try refresh
        const refreshed = await refreshAuth();
        if (refreshed) {
          await fetchCurrentUser();
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, [fetchCurrentUser, refreshAuth]);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    const response = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    });

    if (response.success && response.data) {
      const { user: userData, salon: salonData } = response.data;

      // Tokens are set in HTTP-only cookies automatically
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
      const { user: userData, salon: salonData, requiresVerification } = response.data;

      // Tokens are set in HTTP-only cookies automatically
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
      // Cookies are cleared by the backend
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
