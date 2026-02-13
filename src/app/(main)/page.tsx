import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { HomeHero } from '@/components/HomeHero';
import { DeviceMockup } from '@/components/DeviceMockup';
import { HomeClients } from '@/components/HomeClients';
import { HomeServices } from '@/components/HomeServices';
import { HomeProjects } from '@/components/HomeProjects';
import { HomeTestimonials } from '@/components/HomeTestimonials';
import { HomeNewsletter } from '@/components/HomeNewsletter';
import { HomeCTA } from '@/components/HomeCTA';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('home');
  return {
    title: 'Blok Blok Studio | Creative Digital Agency',
    description: t('hero_subtitle'),
    alternates: {
      canonical: '/',
    },
  };
}

export default function HomePage() {
  return (
    <div className="page-transition">
      <HomeHero />
      <DeviceMockup />
      <HomeClients />
      <HomeServices />
      <HomeProjects />
      <HomeTestimonials />
      <HomeNewsletter />
      <HomeCTA />
    </div>
  );
}
