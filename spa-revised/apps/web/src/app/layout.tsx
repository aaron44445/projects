import type { Metadata } from 'next';
import { ReactNode } from 'react';
import './globals.css';
import { AuthInitializer } from '@/components/AuthInitializer';

export const metadata: Metadata = {
  title: 'Pecase - Salon Management',
  description: 'Professional salon management system',
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <AuthInitializer />
        {children}
      </body>
    </html>
  );
}
