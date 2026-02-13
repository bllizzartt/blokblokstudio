import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PrivacyContent } from '@/components/PrivacyContent';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('privacy');
  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical: '/privacy' },
  };
}

export default function PrivacyPage() {
  return (
    <div className="page-transition">
      <PrivacyContent />
    </div>
  );
}
