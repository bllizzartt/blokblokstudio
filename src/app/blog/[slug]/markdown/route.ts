import { NextRequest, NextResponse } from 'next/server';
import { getBlogPost, getAllBlogSlugs } from '@/data/blog';

/**
 * GET /blog/:slug/markdown
 * Returns the blog post as clean markdown for AI scrapers, ChatGPT, etc.
 * Content-Type: text/markdown so LLMs and crawlers can consume it directly.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return new NextResponse('# 404 — Post Not Found\n\nThis blog post does not exist.', {
      status: 404,
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
  }

  const markdown = [
    `# ${post.title}`,
    '',
    `> ${post.description}`,
    '',
    `**Published:** ${post.date}  `,
    `**Category:** ${post.category}  `,
    `**Read Time:** ${post.readTime}  `,
    `**Author:** Blok Blok Studio  `,
    `**URL:** https://blokblokstudio.com/blog/${post.slug}`,
    '',
    '---',
    '',
    post.content,
    '',
    '---',
    '',
    '*Published by [Blok Blok Studio](https://blokblokstudio.com) — a digital agency specializing in web design, branding, and SEO.*',
  ].join('\n');

  return new NextResponse(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}

/**
 * Generate static params so Next.js can pre-render markdown for each post.
 */
export async function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}
