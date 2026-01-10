import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface AuthState {
  user: {
    id: string;
    email: string;
    salonName?: string;
    phone?: string;
  } | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;

  // Methods
  login: (email: string, password: string) => Promise<void>;
  register: (
    salonName: string,
    email: string,
    phone: string,
    password: string
  ) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
  isAuthenticated: () => boolean;
  setAccessToken: (token: string | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${API_URL}/auth/login`, {
            email,
            password,
          });

          const { accessToken, refreshToken, user } = response.data.data;

          set({
            user,
            accessToken,
            refreshToken,
            isLoading: false,
          });
        } catch (err: any) {
          const errorMessage =
            err.response?.data?.message || 'Login failed. Please try again.';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw new Error(errorMessage);
        }
      },

      register: async (
        salonName: string,
        email: string,
        phone: string,
        password: string
      ) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${API_URL}/auth/register`, {
            salonName,
            email,
            phone,
            password,
          });

          const { accessToken, refreshToken, user } = response.data.data;

          set({
            user,
            accessToken,
            refreshToken,
            isLoading: false,
          });
        } catch (err: any) {
          const errorMessage =
            err.response?.data?.message || 'Registration failed. Please try again.';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw new Error(errorMessage);
        }
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          error: null,
        });
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();

        if (!refreshToken) {
          return false;
        }

        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken: newAccessToken } = response.data.data;

          set({
            accessToken: newAccessToken,
          });

          return true;
        } catch (err: any) {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            error: 'Session expired. Please login again.',
          });
          return false;
        }
      },

      isAuthenticated: () => {
        const { accessToken } = get();
        return !!accessToken;
      },

      setAccessToken: (token: string | null) => {
        set({ accessToken: token });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
