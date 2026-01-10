'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';

export function AuthInitializer() {
  useEffect(() => {
    // Initialize auth store - this will restore persisted state from localStorage
    const authStore = useAuthStore.getState();

    // If we have a refresh token but no access token, try to refresh
    if (authStore.refreshToken && !authStore.accessToken) {
      authStore.refreshAccessToken().catch(() => {
        // Refresh failed, store is already cleared
      });
    }
  }, []);

  return null;
}
