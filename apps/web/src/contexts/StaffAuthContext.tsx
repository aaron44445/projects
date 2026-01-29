'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { api, ApiError, isTokenExpiringSoon } from '@/lib/api';
import { TOKEN_KEYS } from '@/types/auth';

// Token refresh settings
const TOKEN_CHECK_INTERVAL = 30 * 1000; // Check every 30 seconds
const REFRESH_THRESHOLD_MINUTES = 30; // Refresh if expiring within 30 minutes

// Types for staff portal authentication
export interface StaffLocation {
  id: string;
  name: string;
  isPrimary: boolean;
}

export interface StaffUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'owner' | 'admin' | 'staff' | 'manager' | 'receptionist';
  avatarUrl?: string;
  phone?: string;
  certifications?: string;
  commissionRate?: number;
  salonId: string;
  salonName: string;
  isActive: boolean;
  createdAt: string;
  // Multi-location support
  assignedLocations?: StaffLocation[];
  primaryLocationId?: string;
}

interface StaffAuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface StaffLoginResponse {
  staff: StaffUser;
  tokens: StaffAuthTokens;
}

interface StaffRefreshResponse {
  accessToken: string;
  refreshToken?: string;
}

interface StaffAuthContextType {
  staff: StaffUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  updateProfile: (data: Partial<StaffUser>) => Promise<void>;
  // For external setup (invite flow)
  setTokens: (accessToken: string, refreshToken: string) => void;
  setStaff: (staff: StaffUser | Partial<StaffUser>) => void;
  // Location access helpers
  hasLocationAccess: (locationId: string) => boolean;
  getAllowedLocationIds: () => string[];
  isOwnerOrAdmin: () => boolean;
}

const StaffAuthContext = createContext<StaffAuthContextType | undefined>(undefined);

// Use centralized token keys for consistency
const STAFF_ACCESS_TOKEN_KEY = TOKEN_KEYS.staff.access;
const STAFF_REFRESH_TOKEN_KEY = TOKEN_KEYS.staff.refresh;

export function StaffAuthProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<StaffUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Store tokens in localStorage
  const storeTokens = useCallback((tokens: StaffAuthTokens) => {
    localStorage.setItem(STAFF_ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(STAFF_REFRESH_TOKEN_KEY, tokens.refreshToken);
    api.setAccessToken(tokens.accessToken);
  }, []);

  // Clear tokens from localStorage
  const clearTokens = useCallback(() => {
    localStorage.removeItem(STAFF_ACCESS_TOKEN_KEY);
    localStorage.removeItem(STAFF_REFRESH_TOKEN_KEY);
    api.setAccessToken(null);
  }, []);

  // Get stored tokens
  const getStoredTokens = useCallback((): StaffAuthTokens | null => {
    const accessToken = localStorage.getItem(STAFF_ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(STAFF_REFRESH_TOKEN_KEY);

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
      const response = await api.post<StaffRefreshResponse>('/staff-portal/auth/refresh', {
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
      setStaff(null);
      return false;
    }
  }, [getStoredTokens, storeTokens, clearTokens]);

  // Fetch current staff data
  const fetchCurrentStaff = useCallback(async (): Promise<boolean> => {
    try {
      const response = await api.get<StaffUser>('/staff-portal/me');

      if (response.success && response.data) {
        setStaff(response.data);
        return true;
      }
      return false;
    } catch (error) {
      if (error instanceof ApiError && error.code === 'TOKEN_EXPIRED') {
        const refreshed = await refreshAuth();
        if (refreshed) {
          return fetchCurrentStaff();
        }
      }
      return false;
    }
  }, [refreshAuth]);

  // Background token refresh timer
  const startTokenRefreshTimer = useCallback(() => {
    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }

    // Check token expiry periodically
    refreshTimerRef.current = setInterval(async () => {
      const tokens = getStoredTokens();
      if (!tokens?.accessToken) return;

      // If token is expiring soon, refresh it
      if (isTokenExpiringSoon(tokens.accessToken, REFRESH_THRESHOLD_MINUTES)) {
        await refreshAuth();
      }
    }, TOKEN_CHECK_INTERVAL);
  }, [getStoredTokens, refreshAuth]);

  // Stop the refresh timer
  const stopTokenRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const tokens = getStoredTokens();

      if (tokens?.accessToken) {
        api.setAccessToken(tokens.accessToken);

        // If token is expiring soon, refresh first
        if (isTokenExpiringSoon(tokens.accessToken, REFRESH_THRESHOLD_MINUTES)) {
          const refreshed = await refreshAuth();
          if (!refreshed) {
            setIsLoading(false);
            return;
          }
        }

        const success = await fetchCurrentStaff();
        if (success) {
          startTokenRefreshTimer();
        } else {
          const refreshed = await refreshAuth();
          if (refreshed) {
            await fetchCurrentStaff();
            startTokenRefreshTimer();
          }
        }
      }

      setIsLoading(false);
    };

    initAuth();

    // Cleanup timer on unmount
    return () => {
      stopTokenRefreshTimer();
    };
  }, [getStoredTokens, fetchCurrentStaff, refreshAuth, startTokenRefreshTimer, stopTokenRefreshTimer]);

  // Handle visibility change (refresh token when user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const tokens = getStoredTokens();
        if (tokens?.accessToken) {
          if (isTokenExpiringSoon(tokens.accessToken, REFRESH_THRESHOLD_MINUTES)) {
            await refreshAuth();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [getStoredTokens, refreshAuth]);

  // Login function
  const login = async (email: string, password: string, rememberMe?: boolean): Promise<void> => {
    const response = await api.post<StaffLoginResponse>('/staff-portal/auth/login', {
      email: email.toLowerCase().trim(),
      password,
      rememberMe: rememberMe ?? false,
    });

    if (response.success && response.data) {
      const { staff: staffData, tokens } = response.data;

      storeTokens(tokens);
      setStaff(staffData);
      startTokenRefreshTimer();
    } else {
      throw new ApiError('LOGIN_FAILED', 'Login failed. Please check your credentials.');
    }
  };

  // Update profile function
  const updateProfile = async (data: Partial<StaffUser>): Promise<void> => {
    const response = await api.patch<StaffUser>('/staff-portal/profile', data);

    if (response.success && response.data) {
      setStaff(response.data);
    } else {
      throw new ApiError('UPDATE_FAILED', 'Failed to update profile.');
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    stopTokenRefreshTimer();

    try {
      await api.post('/staff-portal/auth/logout');
    } catch {
      // Ignore logout errors - we'll clear local state anyway
    } finally {
      clearTokens();
      setStaff(null);
    }
  };

  // Location access helper functions

  // Check if owner/admin (they have access to all locations)
  const isOwnerOrAdmin = useCallback((): boolean => {
    return staff?.role === 'owner' || staff?.role === 'admin';
  }, [staff]);

  // Check if staff has access to a specific location
  const hasLocationAccess = useCallback((locationId: string): boolean => {
    // Owners and admins have access to all locations
    if (isOwnerOrAdmin()) return true;

    // Staff without assigned locations have access to none (shouldn't happen in normal flow)
    if (!staff?.assignedLocations || staff.assignedLocations.length === 0) return false;

    // Check if the location is in their assigned locations
    return staff.assignedLocations.some(loc => loc.id === locationId);
  }, [staff, isOwnerOrAdmin]);

  // Get array of all location IDs the staff has access to
  const getAllowedLocationIds = useCallback((): string[] => {
    // Owners and admins return empty array (meaning "all locations")
    if (isOwnerOrAdmin()) return [];

    // Staff return their assigned location IDs
    if (!staff?.assignedLocations) return [];
    return staff.assignedLocations.map(loc => loc.id);
  }, [staff, isOwnerOrAdmin]);

  // External setters for setup flow
  const setTokensExternal = useCallback((accessToken: string, refreshToken: string) => {
    storeTokens({ accessToken, refreshToken });
    startTokenRefreshTimer();
  }, [storeTokens, startTokenRefreshTimer]);

  const setStaffExternal = useCallback((staffData: StaffUser | Partial<StaffUser>) => {
    setStaff(staffData as StaffUser);
  }, []);

  const value: StaffAuthContextType = {
    staff,
    isAuthenticated: !!staff,
    isLoading,
    login,
    logout,
    refreshAuth,
    updateProfile,
    setTokens: setTokensExternal,
    setStaff: setStaffExternal,
    hasLocationAccess,
    getAllowedLocationIds,
    isOwnerOrAdmin,
  };

  return (
    <StaffAuthContext.Provider value={value}>
      {children}
    </StaffAuthContext.Provider>
  );
}

export function useStaffAuth() {
  const context = useContext(StaffAuthContext);
  if (context === undefined) {
    throw new Error('useStaffAuth must be used within a StaffAuthProvider');
  }
  return context;
}
