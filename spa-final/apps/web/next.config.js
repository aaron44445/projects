/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker deployment (only in CI/Docker, not on Windows)
  ...(process.env.CI || process.env.DOCKER ? { output: 'standalone' } : {}),

  // Transpile workspace packages
  transpilePackages: ['@peacase/ui', '@peacase/types'],

  // Image configuration
  images: {
    domains: ['localhost'],
    // Support remote images in production
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
};

module.exports = nextConfig;
