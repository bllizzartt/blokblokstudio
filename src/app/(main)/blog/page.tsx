import type { Metadata } from 'next';
import { BlogListContent } from '@/components/BlogListContent';
import { BreadcrumbSchema } from '@/app/structured-data';

export const metadata: Metadata = {
  title: 'Blog — Insights on Web Design, Branding & SEO',
  description:
    'Expert insights on web design, branding, SEO, and digital marketing from Blok Blok Studio. Actionable tips to grow your online presence.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog — Insights on Web Design, Branding & SEO | Blok Blok Studio',
    description:
      'Expert insights on web design, branding, SEO, and digital marketing from Blok Blok Studio.',
    url: 'https://blokblokstudio.com/blog',
    siteName: 'Blok Blok Studio',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Blok Blok Studio Blog' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog — Insights on Web Design, Branding & SEO | Blok Blok Studio',
    description:
      'Expert insights on web design, branding, SEO, and digital marketing from Blok Blok Studio.',
    images: ['/og-image.jpg'],
  },
};

export default function BlogPage() {
  return (
    <div className="page-transition">
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: 'Blog', url: '/blog' },
        ]}
      />
      <BlogListContent />
    </div>
  );
}
