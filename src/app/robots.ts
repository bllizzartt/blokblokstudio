import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/'],
      },
      {
        // AI crawlers — explicitly allow blog markdown and llms.txt
        userAgent: ['GPTBot', 'ChatGPT-User', 'Google-Extended', 'anthropic-ai', 'ClaudeBot', 'cohere-ai', 'PerplexityBot'],
        allow: ['/llms.txt', '/llms-full.txt', '/blog/'],
      },
    ],
    sitemap: 'https://blokblokstudio.com/sitemap.xml',
  };
}
