'use client';

import { ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { SalonSettingsProvider } from '@/contexts/SalonSettingsContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LocationProvider } from '@/hooks/useLocations';
import { HelpBot } from '@/components/HelpBot';
import { CookieConsent } from '@/components/CookieConsent';

export function Providers({ children }: { children: ReactNode }) {
  // Create QueryClient inside component to avoid sharing state between requests in SSR
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Default stale time - individual queries can override
            staleTime: 30000,
            // Retry failed queries with exponential backoff
            retry: 3,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <SalonSettingsProvider>
              <LocationProvider>
                {children}
                <HelpBot />
                <CookieConsent />
              </LocationProvider>
            </SalonSettingsProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
