'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { SalonSettingsProvider } from '@/contexts/SalonSettingsContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LocationProvider } from '@/hooks/useLocations';
import { HelpBot } from '@/components/HelpBot';
import { CookieConsent } from '@/components/CookieConsent';

export function Providers({ children }: { children: ReactNode }) {
  return (
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
  );
}
