import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CookieContent } from '@/components/CookieContent';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('cookies');
  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical: '/cookies' },
  };
}

export default function CookiesPage() {
  return (
    <div className="page-transition">
      <CookieContent />
    </div>
  );
}
