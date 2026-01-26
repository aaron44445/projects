'use client';

import { ReactNode } from 'react';
import { ClientAuthProvider } from '@/contexts/ClientAuthContext';

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <ClientAuthProvider>
      {children}
    </ClientAuthProvider>
  );
}
