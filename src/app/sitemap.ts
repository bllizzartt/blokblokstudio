import type { MetadataRoute } from 'next';
import { getAllProjectSlugs } from '@/data/projects';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://blokblokstudio.com';

  const mainRoutes = [
    '',
    '/projects',
    '/about',
    '/services',
    '/team',
    '/contact',
    '/book',
  ];

  const legalRoutes = ['/privacy', '/terms', '/cookies', '/data-rights'];

  const projectSlugs = getAllProjectSlugs();

  const entries: MetadataRoute.Sitemap = [
    // Main pages
    ...mainRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: route === '' ? ('weekly' as const) : ('monthly' as const),
      priority: route === '' ? 1 : 0.8,
    })),
    // Legal pages
    ...legalRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    })),
    // Individual project pages
    ...projectSlugs.map((slug) => ({
      url: `${baseUrl}/projects/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];

  return entries;
}
