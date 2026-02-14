import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ServicesContent } from '@/components/ServicesContent';
import { BreadcrumbSchema, FAQSchema } from '@/app/structured-data';

const serviceFaqs = [
  {
    question: 'How long does a typical web design project take?',
    answer: 'Most web design projects take 4-8 weeks from kickoff to launch, depending on complexity. We provide a detailed timeline during our discovery call so you know exactly what to expect.',
  },
  {
    question: 'Do you work with startups or only established businesses?',
    answer: 'We work with both. Whether you are a startup needing your first brand identity or an established business looking for a website redesign, we tailor our approach to your stage and budget.',
  },
  {
    question: 'What technologies do you use for web development?',
    answer: 'We primarily build with React, Next.js, and TypeScript for performance and SEO. For CMS needs we integrate headless solutions like Sanity or Contentful. Every stack decision is driven by your project requirements.',
  },
  {
    question: 'Do you offer ongoing support after launch?',
    answer: 'Yes. We offer monthly maintenance and support packages that include performance monitoring, security updates, content changes, and priority bug fixes to keep your site running at peak performance.',
  },
  {
    question: 'How much does a website cost?',
    answer: 'Every project is unique. A simple marketing website starts around $5,000, while more complex web applications or e-commerce builds range higher. We provide a detailed quote after our discovery call.',
  },
  {
    question: 'Can you help with SEO and digital marketing?',
    answer: 'Absolutely. Every website we build is SEO-optimized from the ground up — fast load times, structured data, semantic HTML, and mobile-first design. We also offer dedicated SEO and content marketing services.',
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('services');
  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: { canonical: '/services' },
    openGraph: {
      title: `${t('title')} | Blok Blok Studio`,
      description: t('subtitle'),
      url: 'https://blokblokstudio.com/services',
      siteName: 'Blok Blok Studio',
      type: 'website',
      images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Blok Blok Studio Services' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${t('title')} | Blok Blok Studio`,
      description: t('subtitle'),
      images: ['/og-image.jpg'],
    },
  };
}

export default function ServicesPage() {
  return (
    <div className="page-transition">
      <BreadcrumbSchema items={[
        { name: 'Home', url: '/' },
        { name: 'Services', url: '/services' },
      ]} />
      <FAQSchema faqs={serviceFaqs} />
      <ServicesContent faqs={serviceFaqs} />
    </div>
  );
}
