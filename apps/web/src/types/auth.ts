// Standardized token storage keys across all auth contexts
// Using consistent peacase_ prefix for namespace isolation

export const TOKEN_KEYS = {
  // Owner/Admin auth (dashboard)
  owner: {
    access: 'peacase_access_token',
    refresh: 'peacase_refresh_token',
  },
  // Client portal auth
  client: {
    access: 'peacase_client_access_token',
    refresh: 'peacase_client_refresh_token',
  },
  // Staff portal auth
  staff: {
    access: 'peacase_staff_access_token',
    refresh: 'peacase_staff_refresh_token',
  },
} as const;

export type AuthContext = keyof typeof TOKEN_KEYS;

// Helper functions for token management
export function getAccessToken(context: AuthContext): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEYS[context].access);
}

export function getRefreshToken(context: AuthContext): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEYS[context].refresh);
}

export function setTokens(context: AuthContext, accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEYS[context].access, accessToken);
  localStorage.setItem(TOKEN_KEYS[context].refresh, refreshToken);
}

export function clearTokens(context: AuthContext): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEYS[context].access);
  localStorage.removeItem(TOKEN_KEYS[context].refresh);
}
