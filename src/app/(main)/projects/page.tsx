import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ProjectsContent } from '@/components/ProjectsContent';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('projects');
  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: { canonical: '/projects' },
  };
}

export default function ProjectsPage() {
  return (
    <div className="page-transition">
      <ProjectsContent />
    </div>
  );
}
