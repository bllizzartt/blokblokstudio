import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AboutContent } from '@/components/AboutContent';
import { BreadcrumbSchema } from '@/app/structured-data';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('about');
  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: { canonical: '/about' },
    openGraph: {
      title: `${t('title')} | Blok Blok Studio`,
      description: t('subtitle'),
      url: 'https://blokblokstudio.com/about',
      siteName: 'Blok Blok Studio',
      type: 'website',
      images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Blok Blok Studio' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${t('title')} | Blok Blok Studio`,
      description: t('subtitle'),
      images: ['/og-image.jpg'],
    },
  };
}

export default function AboutPage() {
  return (
    <div className="page-transition">
      <BreadcrumbSchema items={[
        { name: 'Home', url: '/' },
        { name: 'About', url: '/about' },
      ]} />
      <AboutContent />
    </div>
  );
}
