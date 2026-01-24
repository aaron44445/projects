'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { SalonSettingsProvider } from '@/contexts/SalonSettingsContext';
import { LocationProvider } from '@/hooks/useLocations';
import { HelpBot } from '@/components/HelpBot';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <SalonSettingsProvider>
          <LocationProvider>
            {children}
            <HelpBot />
          </LocationProvider>
        </SalonSettingsProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}
