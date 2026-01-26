'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { api, ApiError, isTokenExpiringSoon } from '@/lib/api';

// Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'owner' | 'admin' | 'manager' | 'staff' | 'receptionist';
  avatarUrl?: string;
  phone?: string;
  emailVerified?: boolean;
  createdAt: string;
  permissions?: string[]; // Permissions array from backend
  staffLocations?: Array<{
    location: { id: string; name: string };
    isPrimary: boolean;
  }>;
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
  businessType?: string;
  onboardingComplete?: boolean;
  onboardingStep?: number;
  multiLocationEnabled?: boolean;
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
  register: (ownerName: string, email: string, password: string, businessName: string, businessType: string) => Promise<{ requiresVerification: boolean }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  refreshSalonData: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_TOKEN_KEY = 'peacase_access_token';
const REFRESH_TOKEN_KEY = 'peacase_refresh_token';

// How often to check token expiry (every 30 seconds for more responsive refresh)
const TOKEN_CHECK_INTERVAL = 30 * 1000;
// Refresh if token expires within this many minutes (more aggressive)
const REFRESH_THRESHOLD_MINUTES = 30;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initializingRef = useRef(false);
  const initializedRef = useRef(false);

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
    if (typeof window === 'undefined') return null;

    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (accessToken && refreshToken) {
      return { accessToken, refreshToken };
    }
    return null;
  }, []);

  // Refresh authentication - this is the core function
  const refreshAuth = useCallback(async (): Promise<boolean> => {
    const tokens = getStoredTokens();
    if (!tokens?.refreshToken) {
      return false;
    }

    try {
      // Temporarily clear the API token to avoid using expired token for refresh
      const currentToken = api.getAccessToken();
      api.setAccessToken(null);

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

      // Restore old token if refresh failed (might still be valid)
      if (currentToken) {
        api.setAccessToken(currentToken);
      }
      return false;
    } catch (error) {
      // Only clear tokens if refresh definitively failed
      // (not just a network error)
      if (error instanceof ApiError &&
          (error.code === 'INVALID_TOKEN' || error.code === 'TOKEN_EXPIRED')) {
        clearTokens();
        setUser(null);
        setSalon(null);
      }
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
      if (error instanceof ApiError &&
          (error.code === 'TOKEN_EXPIRED' || error.code === 'SESSION_EXPIRED')) {
        // Token refresh is handled by the API client, if we still get here,
        // it means refresh failed and user needs to log in again
        clearTokens();
        setUser(null);
        setSalon(null);
      }
      return false;
    }
  }, [clearTokens]);

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

  // Register refresh callback with API client
  useEffect(() => {
    api.setRefreshCallback(refreshAuth);
    return () => {
      api.setRefreshCallback(null);
    };
  }, [refreshAuth]);

  // Initialize auth state on mount - only runs once
  useEffect(() => {
    // Prevent multiple initialization attempts (React Strict Mode, fast refresh, etc.)
    if (initializedRef.current || initializingRef.current) {
      return;
    }

    const initAuth = async () => {
      initializingRef.current = true;

      try {
        // Read tokens directly from localStorage (not via callback to avoid dependency issues)
        const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

        if (accessToken && refreshToken) {
          api.setAccessToken(accessToken);

          // If token is expiring soon, refresh first
          if (isTokenExpiringSoon(accessToken, REFRESH_THRESHOLD_MINUTES)) {
            try {
              // Attempt refresh with the stored refresh token
              api.setAccessToken(null); // Clear for refresh request
              const response = await api.post<{ accessToken: string; refreshToken?: string }>('/auth/refresh', {
                refreshToken,
              });

              if (response.success && response.data) {
                const newAccessToken = response.data.accessToken;
                const newRefreshToken = response.data.refreshToken || refreshToken;
                localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
                localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
                api.setAccessToken(newAccessToken);
              } else {
                // Refresh failed, clear tokens and let user log in again
                localStorage.removeItem(ACCESS_TOKEN_KEY);
                localStorage.removeItem(REFRESH_TOKEN_KEY);
                api.setAccessToken(null);
                setIsLoading(false);
                initializedRef.current = true;
                initializingRef.current = false;
                return;
              }
            } catch {
              // Refresh failed, clear tokens
              localStorage.removeItem(ACCESS_TOKEN_KEY);
              localStorage.removeItem(REFRESH_TOKEN_KEY);
              api.setAccessToken(null);
              setIsLoading(false);
              initializedRef.current = true;
              initializingRef.current = false;
              return;
            }
          }

          // Fetch user data with the valid token
          try {
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

            // Start background refresh timer
            if (refreshTimerRef.current) {
              clearInterval(refreshTimerRef.current);
            }
            refreshTimerRef.current = setInterval(async () => {
              const currentToken = localStorage.getItem(ACCESS_TOKEN_KEY);
              if (currentToken && isTokenExpiringSoon(currentToken, REFRESH_THRESHOLD_MINUTES)) {
                await refreshAuth();
              }
            }, TOKEN_CHECK_INTERVAL);
          } catch (error) {
            // Only clear tokens for specific auth errors
            if (error instanceof ApiError &&
                (error.code === 'TOKEN_EXPIRED' || error.code === 'SESSION_EXPIRED' || error.code === 'INVALID_TOKEN')) {
              localStorage.removeItem(ACCESS_TOKEN_KEY);
              localStorage.removeItem(REFRESH_TOKEN_KEY);
              api.setAccessToken(null);
            }
            // For other errors (network, etc.), keep tokens - user might still be logged in
          }
        }
      } finally {
        setIsLoading(false);
        initializedRef.current = true;
        initializingRef.current = false;
      }
    };

    initAuth();

    // Cleanup timer on unmount
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount

  // Handle storage events (for multi-tab sync)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === ACCESS_TOKEN_KEY) {
        if (event.newValue) {
          // Token was added/updated in another tab
          api.setAccessToken(event.newValue);
          fetchCurrentUser();
        } else {
          // Token was removed in another tab (logout)
          setUser(null);
          setSalon(null);
          stopTokenRefreshTimer();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchCurrentUser, stopTokenRefreshTimer]);

  // Handle visibility change (refresh token when user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        // User returned to the tab - check token validity
        const tokens = getStoredTokens();
        if (tokens?.accessToken) {
          // Proactively refresh if token is expiring soon
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
  const login = async (email: string, password: string): Promise<void> => {
    // Normalize inputs before sending to API
    const normalizedEmail = email.trim().toLowerCase();

    const response = await api.post<LoginResponse>('/auth/login', {
      email: normalizedEmail,
      password,
    });

    if (response.success && response.data) {
      const { user: userData, salon: salonData, tokens } = response.data;

      storeTokens(tokens);
      setUser(userData);
      setSalon(salonData);
      startTokenRefreshTimer();
    } else {
      throw new ApiError('LOGIN_FAILED', 'Login failed. Please try again.');
    }
  };

  // Register function
  const register = async (
    ownerName: string,
    email: string,
    password: string,
    businessName: string,
    businessType: string
  ): Promise<{ requiresVerification: boolean }> => {
    // Normalize inputs before sending to API
    const normalizedOwnerName = ownerName.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedBusinessName = businessName.trim();

    const response = await api.post<RegisterResponse>('/auth/register', {
      ownerName: normalizedOwnerName,
      email: normalizedEmail,
      password,
      businessName: normalizedBusinessName,
      businessType,
    });

    if (response.success && response.data) {
      const { user: userData, salon: salonData, tokens } = response.data;

      storeTokens(tokens);
      setUser(userData);
      setSalon(salonData);
      startTokenRefreshTimer();

      return { requiresVerification: false }; // No longer blocking on verification
    } else {
      throw new ApiError('REGISTER_FAILED', 'Registration failed. Please try again.');
    }
  };

  // Resend verification email
  const resendVerificationEmail = async (email: string): Promise<void> => {
    // Normalize email before sending to API
    const normalizedEmail = email.trim().toLowerCase();
    await api.post('/auth/resend-verification', { email: normalizedEmail });
  };

  // Refresh salon data (used after onboarding completion)
  const refreshSalonData = useCallback(async (): Promise<void> => {
    try {
      const salonResponse = await api.get<Salon>('/salon');
      if (salonResponse.success && salonResponse.data) {
        setSalon(salonResponse.data);
      }
    } catch (error) {
      console.error('Failed to refresh salon data:', error);
    }
  }, []);

  // Logout function
  const logout = async (): Promise<void> => {
    stopTokenRefreshTimer();

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
    refreshSalonData,
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
