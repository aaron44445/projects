// Centralized API configuration
// This file provides consistent API URL definitions across the application

// Strip /api/v1 suffix from env var if present, to get base URL
const getBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!envUrl) return 'http://localhost:3001';
  return envUrl.replace(/\/api\/v1\/?$/, '');
};

export const API_CONFIG = {
  // Base URL without /api/v1 suffix (for embed widgets, etc.)
  baseUrl: getBaseUrl(),

  // Full API URL with /api/v1
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',

  // Public API helper (no auth required)
  publicApiUrl: (slug: string) =>
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/public/${slug}`,

  // Client portal API base
  get clientPortalUrl() {
    return `${this.apiUrl}/client-portal`;
  },

  // Staff portal API base
  get staffPortalUrl() {
    return `${this.apiUrl}/staff-portal`;
  },
} as const;

export default API_CONFIG;
