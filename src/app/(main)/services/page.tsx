import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ServicesContent } from '@/components/ServicesContent';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('services');
  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: { canonical: '/services' },
  };
}

export default function ServicesPage() {
  return (
    <div className="page-transition">
      <ServicesContent />
    </div>
  );
}
