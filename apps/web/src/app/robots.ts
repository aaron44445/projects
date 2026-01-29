import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://peacase.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard',
        '/dashboard/*',
        '/admin',
        '/admin/*',
        '/api',
        '/api/*',
        '/settings',
        '/settings/*',
        '/staff',
        '/staff/*',
        '/calendar',
        '/clients',
        '/services',
        '/packages',
        '/gift-cards',
        '/marketing',
        '/reports',
        '/notifications',
        '/locations',
        '/onboarding',
        '/setup',
        '/portal',
        '/embed',
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
