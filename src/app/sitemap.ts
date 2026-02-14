import type { MetadataRoute } from 'next';
import { getAllProjectSlugs } from '@/data/projects';
import { getAllBlogSlugs } from '@/data/blog';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://blokblokstudio.com';

  const mainRoutes = [
    '',
    '/projects',
    '/about',
    '/services',
    '/team',
    '/contact',
    '/blog',
    '/book',
  ];

  const legalRoutes = ['/privacy', '/terms', '/cookies', '/data-rights'];

  const projectSlugs = getAllProjectSlugs();
  const blogSlugs = getAllBlogSlugs();

  const entries: MetadataRoute.Sitemap = [
    // Main pages
    ...mainRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: route === '' ? ('weekly' as const) : ('monthly' as const),
      priority: route === '' ? 1 : route === '/blog' ? 0.9 : 0.8,
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
    // Blog posts (HTML)
    ...blogSlugs.map((slug) => ({
      url: `${baseUrl}/blog/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    // Blog posts (Markdown for AI)
    ...blogSlugs.map((slug) => ({
      url: `${baseUrl}/blog/${slug}/markdown`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    })),
    // LLM discovery files
    {
      url: `${baseUrl}/llms.txt`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.4,
    },
  ];

  return entries;
}
