/**
 * ============================================================
 * ROOT LAYOUT — app/layout.tsx
 * ============================================================
 * This is the top-level layout that wraps EVERY page on the site.
 * It includes: HTML head (favicon, manifest), global CSS, Navbar,
 * Footer, i18n (translation) provider, and SEO metadata.
 *
 * KEY FILES:
 * - Global styles: /src/app/globals.css
 * - Navbar component: /src/components/Navbar.tsx
 * - Footer component: /src/components/Footer.tsx
 * - i18n config: /src/i18n/request.ts
 * - Translation files: /src/messages/{locale}.json
 * - Structured data: /src/app/structured-data.tsx
 * - Favicon: /public/favicon.ico
 * - Manifest: /public/manifest.json
 *
 * TO EDIT:
 * - Site title/description → edit the `metadata` object below
 * - OG image for social sharing → replace /public/og-image.jpg
 * - Google verification → replace 'YOUR_GOOGLE_VERIFICATION_CODE'
 * - Favicon → replace /public/favicon.ico
 * - Fonts → change --font-sans in globals.css
 * ============================================================
 */

import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import './globals.css';
import { OrganizationSchema, WebsiteSchema } from './structured-data';
import { CookieConsent } from '@/components/CookieConsent';

export const metadata: Metadata = {
  metadataBase: new URL('https://blokblokstudio.com'),
  title: {
    default: 'Blok Blok Studio | Creative Digital Agency',
    template: '%s | Blok Blok Studio',
  },
  description:
    'Blok Blok Studio is a creative digital agency crafting bold brands, stunning websites, and digital products that move people. Web design, branding, app development, and digital marketing.',
  keywords: [
    'digital agency',
    'web design',
    'branding',
    'app development',
    'creative studio',
    'UI/UX design',
    'digital marketing',
    'Blok Blok Studio',
  ],
  authors: [{ name: 'Blok Blok Studio' }],
  creator: 'Blok Blok Studio',
  publisher: 'Blok Blok Studio',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://blokblokstudio.com',
    siteName: 'Blok Blok Studio',
    title: 'Blok Blok Studio | Creative Digital Agency',
    description:
      'A creative digital agency crafting bold brands, stunning websites, and digital products that move people.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Blok Blok Studio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blok Blok Studio | Creative Digital Agency',
    description:
      'A creative digital agency crafting bold brands, stunning websites, and digital products that move people.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // verification: { google: 'ADD_YOUR_GOOGLE_VERIFICATION_CODE' },
};

/**
 * Root layout — minimal shell shared by ALL routes.
 * Navbar/Footer are added by (main)/layout.tsx for main site pages.
 * The (funnel) route group gets NO Navbar/Footer.
 */
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-black text-white antialiased font-sans noise-overlay">
        <OrganizationSchema />
        <WebsiteSchema />
        <NextIntlClientProvider messages={messages}>
          {children}
          <CookieConsent />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
