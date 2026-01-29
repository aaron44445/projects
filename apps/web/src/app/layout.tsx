import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { CookieConsent } from '@/components/CookieConsent';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://peacase.com'),
  alternates: {
    canonical: './',
  },
  title: {
    default: 'Peacase - Premium Spa & Salon Management',
    template: '%s | Peacase',
  },
  description:
    'Premium spa and salon management software. Everything you need to run your salon. Nothing you dont. Start with essentials, add only what you need.',
  keywords: [
    'salon management',
    'spa software',
    'appointment booking',
    'salon booking',
    'spa management',
    'beauty salon software',
    'hair salon software',
    'massage booking',
    'wellness software',
  ],
  authors: [{ name: 'Peacase' }],
  creator: 'Peacase',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://peacase.com',
    title: 'Peacase - Premium Spa & Salon Management',
    description: 'Premium spa and salon management software. Everything you need, nothing you dont.',
    siteName: 'Peacase',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Peacase - Premium Spa & Salon Management',
    description: 'Premium spa and salon management software.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakartaSans.variable}`}>
      <body className="font-sans">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Providers>
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
        </Providers>
        <CookieConsent />
      </body>
    </html>
  );
}
