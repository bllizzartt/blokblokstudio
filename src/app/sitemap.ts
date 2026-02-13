import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://blokblokstudio.com';

  const routes = [
    '',
    '/projects',
    '/about',
    '/services',
    '/team',
    '/contact',
    '/privacy',
    '/terms',
    '/cookies',
    '/data-rights',
  ];

  const legalRoutes = ['/privacy', '/terms', '/cookies', '/data-rights'];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : legalRoutes.includes(route) ? 0.3 : 0.8,
  }));
}
