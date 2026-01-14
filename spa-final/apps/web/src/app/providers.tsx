'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { HelpBot } from '@/components/HelpBot';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SubscriptionProvider>
          {children}
          <HelpBot />
        </SubscriptionProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
