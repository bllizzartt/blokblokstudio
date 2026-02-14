import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ContactContent } from '@/components/ContactContent';
import { BreadcrumbSchema } from '@/app/structured-data';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('contact');
  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: { canonical: '/contact' },
    openGraph: {
      title: `${t('title')} | Blok Blok Studio`,
      description: t('subtitle'),
      url: 'https://blokblokstudio.com/contact',
      siteName: 'Blok Blok Studio',
      type: 'website',
      images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Contact Blok Blok Studio' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${t('title')} | Blok Blok Studio`,
      description: t('subtitle'),
      images: ['/og-image.jpg'],
    },
  };
}

export default function ContactPage() {
  return (
    <div className="page-transition">
      <BreadcrumbSchema items={[
        { name: 'Home', url: '/' },
        { name: 'Contact', url: '/contact' },
      ]} />
      <ContactContent />
    </div>
  );
}
