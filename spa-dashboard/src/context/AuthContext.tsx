import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, User, Organization } from '../lib/api';

interface AuthState {
  user: User | null;
  organization: Organization | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, businessName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'spa_access_token';
const REFRESH_KEY = 'spa_refresh_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    organization: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Initialize auth state from stored tokens
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem(TOKEN_KEY);
      const refreshToken = localStorage.getItem(REFRESH_KEY);

      if (!accessToken || !refreshToken) {
        setState(s => ({ ...s, isLoading: false }));
        return;
      }

      api.setAccessToken(accessToken);

      try {
        const { user, organization } = await api.getMe();
        setState({
          user,
          organization,
          isLoading: false,
          isAuthenticated: true,
        });
      } catch {
        // Token expired, try refresh
        try {
          const tokens = await api.refreshToken(refreshToken);
          localStorage.setItem(TOKEN_KEY, tokens.accessToken);
          localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
          api.setAccessToken(tokens.accessToken);

          const { user, organization } = await api.getMe();
          setState({
            user,
            organization,
            isLoading: false,
            isAuthenticated: true,
          });
        } catch {
          // Refresh failed, clear tokens
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(REFRESH_KEY);
          api.setAccessToken(null);
          setState({
            user: null,
            organization: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const { user, organization, accessToken, refreshToken } = await api.login(email, password);

    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    api.setAccessToken(accessToken);

    setState({
      user,
      organization,
      isLoading: false,
      isAuthenticated: true,
    });
  };

  const register = async (email: string, password: string, name: string, businessName: string) => {
    const { user, organization, accessToken, refreshToken } = await api.register(
      email,
      password,
      name,
      businessName
    );

    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    api.setAccessToken(accessToken);

    setState({
      user,
      organization,
      isLoading: false,
      isAuthenticated: true,
    });
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem(REFRESH_KEY);

    if (refreshToken) {
      try {
        await api.logout(refreshToken);
      } catch {
        // Ignore logout errors
      }
    }

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    api.setAccessToken(null);

    setState({
      user: null,
      organization: null,
      isLoading: false,
      isAuthenticated: false,
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
