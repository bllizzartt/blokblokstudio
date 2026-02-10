import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ContactContent } from '@/components/ContactContent';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('contact');
  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: { canonical: '/contact' },
  };
}

export default function ContactPage() {
  return (
    <div className="page-transition">
      <ContactContent />
    </div>
  );
}
