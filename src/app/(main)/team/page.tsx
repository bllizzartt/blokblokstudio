import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { TeamContent } from '@/components/TeamContent';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('team');
  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: { canonical: '/team' },
  };
}

export default function TeamPage() {
  return (
    <div className="page-transition">
      <TeamContent />
    </div>
  );
}
