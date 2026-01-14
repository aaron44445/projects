'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { HelpBot } from '@/components/HelpBot';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        {children}
        <HelpBot />
      </SubscriptionProvider>
    </AuthProvider>
  );
}
