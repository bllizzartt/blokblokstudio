import { NextResponse } from 'next/server';
import { blogPosts } from '@/data/blog';
import { projectsData } from '@/data/projects';

/**
 * GET /llms.txt
 * Standard discovery file for LLMs and AI crawlers.
 * See: https://llmstxt.org
 */
export async function GET() {
  const projectEntries = Object.entries(projectsData);

  const content = [
    '# Blok Blok Studio',
    '',
    '> Blok Blok Studio is a digital agency based in Berlin, Germany specializing in web design, branding, SEO, and digital strategy for businesses worldwide.',
    '',
    '## About',
    '',
    'Blok Blok Studio builds high-performance websites, brand identities, and digital experiences that drive results. Founded by Chase Haynes (Parsons School of Design), the studio works with businesses across Europe and the US.',
    '',
    '- Mission: To empower brands with innovative digital solutions that connect, engage, and inspire their audiences worldwide.',
    '- Vision: To be the creative partner of choice for brands that dare to stand out in the digital landscape.',
    '- Values: Innovation, Excellence, Collaboration, Integrity',
    '- Track Record: 15+ projects delivered, 11 clients served, founded 2024, 6+ industries served',
    '',
    '## Team',
    '',
    '- **Chase Haynes** — Founder. Based in Berlin, Germany. Studied Design and Technology at Parsons School of Design.',
    '- **Kyle Talley** — Senior Graphic Designer. Based in Richmond, Virginia, USA. Studied Creative Advertising at Virginia Commonwealth University.',
    '- **Stephen Darling** — Senior Web Designer. Based in Arlington, Virginia, USA. Studied Interactive Design and Computer Science at James Madison University.',
    '',
    '## Services',
    '',
    '- **Web Design & Development** — Custom websites that are visually stunning, lightning-fast, and optimized for conversion.',
    '- **Brand Identity** — Distinctive brand systems that tell your story and create lasting impressions.',
    '- **App Development** — Native and cross-platform applications built for performance and user delight.',
    '- **Digital Marketing** — Data-driven strategies that amplify your reach and maximize ROI.',
    '- **UI/UX Design** — User-centered design that transforms complex problems into intuitive experiences.',
    '- **SEO & Analytics** — Strategic optimization to boost your visibility and track what matters.',
    '',
    '## Process',
    '',
    '1. Discovery — Understand goals, audience, and market',
    '2. Strategy — Tailored roadmap aligning creative vision with business objectives',
    '3. Design — Compelling visuals and intuitive interfaces',
    '4. Development — Modern technologies ensuring speed, scalability, and reliability',
    '5. Launch & Optimize — Deploy, monitor, and continuously refine',
    '',
    '## Portfolio',
    '',
    ...projectEntries.map(
      ([slug, project]) =>
        `- [${project.title}](https://blokblokstudio.com/projects/${slug}) (${project.category}, ${project.year}): ${project.desc}`
    ),
    '',
    '## Blog Posts',
    '',
    ...blogPosts.map(
      (post) =>
        `- [${post.title}](https://blokblokstudio.com/blog/${post.slug}/markdown): ${post.description}`
    ),
    '',
    '## Contact',
    '',
    '- Website: https://blokblokstudio.com',
    '- Email: hello@blokblokstudio.com',
    '- Instagram: https://www.instagram.com/blokblokstudio/',
    '- LinkedIn: https://www.linkedin.com/company/blok-blok-studio/',
    '- Book a Call: https://blokblokstudio.com/book',
    '',
    '## Full Content',
    '',
    'For the complete content of all pages, projects, and blog posts in one file, see [/llms-full.txt](https://blokblokstudio.com/llms-full.txt)',
  ].join('\n');

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
