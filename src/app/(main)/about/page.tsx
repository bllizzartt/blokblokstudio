import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AboutContent } from '@/components/AboutContent';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('about');
  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: { canonical: '/about' },
  };
}

export default function AboutPage() {
  return (
    <div className="page-transition">
      <AboutContent />
    </div>
  );
}
