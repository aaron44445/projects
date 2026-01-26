'use client';

import { ReactNode } from 'react';
import { StaffAuthProvider } from '@/contexts/StaffAuthContext';

export default function StaffPortalLayout({ children }: { children: ReactNode }) {
  return (
    <StaffAuthProvider>
      {children}
    </StaffAuthProvider>
  );
}
