import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { TermsContent } from '@/components/TermsContent';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('terms');
  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical: '/terms' },
  };
}

export default function TermsPage() {
  return (
    <div className="page-transition">
      <TermsContent />
    </div>
  );
}
