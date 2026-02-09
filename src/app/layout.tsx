import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { OrganizationSchema, WebsiteSchema } from './structured-data';
import { StarFieldWrapper } from '@/components/StarFieldWrapper';

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
  verification: {
    google: 'YOUR_GOOGLE_VERIFICATION_CODE',
  },
};

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
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-black text-white antialiased font-sans noise-overlay">
        <OrganizationSchema />
        <WebsiteSchema />
        <NextIntlClientProvider messages={messages}>
          <StarFieldWrapper />
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
