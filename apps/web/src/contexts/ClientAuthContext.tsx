'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { TOKEN_KEYS } from '@/types/auth';
import { API_CONFIG } from '@/config/api';

// Token refresh settings
const TOKEN_CHECK_INTERVAL = 30 * 1000; // Check every 30 seconds
const REFRESH_THRESHOLD_MINUTES = 30; // Refresh if expiring within 30 minutes

// Use standardized token keys
const ACCESS_TOKEN_KEY = TOKEN_KEYS.client.access;
const REFRESH_TOKEN_KEY = TOKEN_KEYS.client.refresh;

// Decode JWT payload to check expiry
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
  if (!payload?.exp) return true;
  const expiresAt = payload.exp * 1000;
  const now = Date.now();
  const threshold = withinMinutes * 60 * 1000;
  return (expiresAt - now) < threshold;
}

interface Client {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  loyaltyPoints?: number;
  salon?: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
  };
}

interface ClientAuthContextType {
  client: Client | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, salonSlug: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  salonSlug: string;
}

const ClientAuthContext = createContext<ClientAuthContextType | null>(null);

const API_URL = API_CONFIG.baseUrl;

export function ClientAuthProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const getStoredTokens = () => {
    if (typeof window === 'undefined') return { accessToken: null, refreshToken: null };
    return {
      accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
      refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY)
    };
  };

  const storeTokens = (accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  };

  const clearTokens = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  };

  const fetchClient = async (accessToken: string): Promise<Client | null> => {
    try {
      const response = await fetch(`${API_URL}/api/v1/client-auth/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch client:', error);
      return null;
    }
  };

  const refreshTokens = async (): Promise<{ accessToken: string; refreshToken: string } | null> => {
    const { refreshToken } = getStoredTokens();
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${API_URL}/api/v1/client-auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        storeTokens(data.data.accessToken, data.data.refreshToken);
        return data.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to refresh tokens:', error);
      return null;
    }
  };

  const refreshAuth = async () => {
    const { accessToken } = getStoredTokens();

    if (accessToken) {
      // Check if token is expiring soon and refresh proactively
      if (isTokenExpiringSoon(accessToken, REFRESH_THRESHOLD_MINUTES)) {
        const newTokens = await refreshTokens();
        if (newTokens) {
          const clientData = await fetchClient(newTokens.accessToken);
          if (clientData) {
            setClient(clientData);
            setIsLoading(false);
            return;
          }
        }
      } else {
        const clientData = await fetchClient(accessToken);
        if (clientData) {
          setClient(clientData);
          setIsLoading(false);
          return;
        }

        // Try refreshing tokens if fetch failed
        const newTokens = await refreshTokens();
        if (newTokens) {
          const clientData = await fetchClient(newTokens.accessToken);
          if (clientData) {
            setClient(clientData);
            setIsLoading(false);
            return;
          }
        }
      }
    }

    clearTokens();
    setClient(null);
    setIsLoading(false);
  };

  // Start background token refresh timer
  const startTokenRefreshTimer = () => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }

    refreshTimerRef.current = setInterval(async () => {
      const { accessToken } = getStoredTokens();
      if (accessToken && isTokenExpiringSoon(accessToken, REFRESH_THRESHOLD_MINUTES)) {
        await refreshTokens();
      }
    }, TOKEN_CHECK_INTERVAL);
  };

  // Stop token refresh timer
  const stopTokenRefreshTimer = () => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  };

  useEffect(() => {
    const init = async () => {
      await refreshAuth();
      const { accessToken } = getStoredTokens();
      if (accessToken) {
        startTokenRefreshTimer();
      }
    };
    init();

    return () => {
      stopTokenRefreshTimer();
    };
  }, []);

  // Handle visibility change (refresh token when user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const { accessToken } = getStoredTokens();
        if (accessToken && isTokenExpiringSoon(accessToken, REFRESH_THRESHOLD_MINUTES)) {
          await refreshTokens();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const login = async (email: string, password: string, salonSlug: string) => {
    const response = await fetch(`${API_URL}/api/v1/client-auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.toLowerCase().trim(), password, salonSlug })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Login failed');
    }

    storeTokens(data.data.accessToken, data.data.refreshToken);
    setClient({
      ...data.data.client,
      salon: { slug: salonSlug } as Client['salon']
    });

    // Fetch full client data
    const clientData = await fetchClient(data.data.accessToken);
    if (clientData) {
      setClient(clientData);
    }

    // Start background refresh timer
    startTokenRefreshTimer();
  };

  const register = async (registerData: RegisterData) => {
    const normalizedData = {
      ...registerData,
      email: registerData.email.toLowerCase().trim(),
    };

    const response = await fetch(`${API_URL}/api/v1/client-auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalizedData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Registration failed');
    }

    storeTokens(data.data.accessToken, data.data.refreshToken);
    setClient({
      ...data.data.client,
      salon: { slug: registerData.salonSlug } as Client['salon']
    });

    // Fetch full client data
    const clientData = await fetchClient(data.data.accessToken);
    if (clientData) {
      setClient(clientData);
    }

    // Start background refresh timer
    startTokenRefreshTimer();
  };

  const logout = async () => {
    stopTokenRefreshTimer();
    const { refreshToken } = getStoredTokens();

    try {
      await fetch(`${API_URL}/api/v1/client-auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getStoredTokens().accessToken}`
        },
        body: JSON.stringify({ refreshToken })
      });
    } catch (error) {
      console.error('Logout error:', error);
    }

    clearTokens();
    setClient(null);
    router.push('/portal/login');
  };

  return (
    <ClientAuthContext.Provider
      value={{
        client,
        isLoading,
        isAuthenticated: !!client,
        login,
        register,
        logout,
        refreshAuth
      }}
    >
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  const context = useContext(ClientAuthContext);
  if (!context) {
    throw new Error('useClientAuth must be used within a ClientAuthProvider');
  }
  return context;
}
