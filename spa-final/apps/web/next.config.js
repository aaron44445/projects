/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker deployment (only in CI/Docker, not on Windows)
  ...(process.env.CI || process.env.DOCKER ? { output: 'standalone' } : {}),

  // Transpile workspace packages
  transpilePackages: ['@peacase/ui', '@peacase/types'],

  // Production optimizations
  swcMinify: true,
  compress: true,
  poweredByHeader: false,

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
    // Image optimization
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },

  // Allow embedding the booking widget in iframes on any site
  async headers() {
    return [
      {
        source: '/embed/:slug*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Content-Security-Policy',
            value: 'frame-ancestors *',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
