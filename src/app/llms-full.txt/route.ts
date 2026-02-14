import { NextResponse } from 'next/server';
import { blogPosts } from '@/data/blog';
import { projectsData } from '@/data/projects';

/**
 * GET /llms-full.txt
 * Full-content version — entire site content for AI models to consume in one request.
 * Includes: about, team, services, projects (full case studies), funnel, and blog posts.
 */
export async function GET() {
  const projectEntries = Object.entries(projectsData);

  const sections: string[] = [];

  // ── Header ──
  sections.push(
    '# Blok Blok Studio — Full Site Content',
    '',
    '> Blok Blok Studio is a digital agency based in Berlin, Germany specializing in web design, branding, SEO, and digital strategy for businesses worldwide.',
    '',
    'Website: https://blokblokstudio.com',
    'Email: hello@blokblokstudio.com',
    'Instagram: https://www.instagram.com/blokblokstudio/',
    'LinkedIn: https://www.linkedin.com/company/blok-blok-studio/',
    '',
    '---',
    ''
  );

  // ── About ──
  sections.push(
    '# About Blok Blok Studio',
    '',
    'We are a collective of designers, developers, and strategists passionate about creating meaningful digital experiences.',
    '',
    '**Mission:** To empower brands with innovative digital solutions that connect, engage, and inspire their audiences worldwide.',
    '',
    '**Vision:** To be the creative partner of choice for brands that dare to stand out in the digital landscape.',
    '',
    '## Our Values',
    '',
    '- **Innovation** — We push boundaries and explore new possibilities in every project.',
    '- **Excellence** — We hold ourselves to the highest standards of quality and craftsmanship.',
    '- **Collaboration** — We believe the best work comes from strong partnerships with our clients.',
    '- **Integrity** — We operate with transparency, honesty, and respect in everything we do.',
    '',
    '## By the Numbers',
    '',
    '- 15+ Projects Delivered',
    '- 11 Happy Clients',
    '- 2 Years in Business (Founded 2024)',
    '- 6+ Industries Served',
    '',
    '---',
    ''
  );

  // ── Team ──
  sections.push(
    '# Our Team',
    '',
    '## Chase Haynes — Founder',
    '',
    '- Based in: Berlin, Germany',
    '- Studied: Design and Technology at Parsons School of Design',
    '- Enjoys: Art Museums, Traveling, Content Creation',
    '- LinkedIn: https://www.linkedin.com/in/chase-haynes/',
    '- Instagram: https://www.instagram.com/haynes2va/',
    '',
    '## Kyle Talley — Senior Graphic Designer',
    '',
    '- Based in: Richmond, Virginia, USA',
    '- Studied: Creative Advertising at Virginia Commonwealth University',
    '- Enjoys: Brazilian Jiu Jitsu, Animation, Thrifting',
    '- LinkedIn: https://www.linkedin.com/in/kylebtalley/',
    '- Instagram: https://www.instagram.com/ta11ey_/',
    '',
    '## Stephen Darling — Senior Web Designer',
    '',
    '- Based in: Arlington, Virginia, USA',
    '- Studied: Interactive Design and Computer Science at James Madison University',
    '- Enjoys: Movies, Film Photography, Cooking',
    '- Instagram: https://www.instagram.com/stephen.darling/',
    '',
    '---',
    ''
  );

  // ── Services ──
  sections.push(
    '# Services',
    '',
    'End-to-end digital solutions tailored to elevate your brand and drive growth.',
    '',
    '## Web Design & Development',
    'Custom websites that are visually stunning, lightning-fast, and optimized for conversion. Built with modern frameworks like Next.js for maximum performance and SEO.',
    '',
    '## Brand Identity',
    'Distinctive brand systems that tell your story and create lasting impressions. Logo design, visual identity, color palettes, typography, and brand guidelines.',
    '',
    '## App Development',
    'Native and cross-platform applications built for performance and user delight.',
    '',
    '## Digital Marketing',
    'Data-driven strategies that amplify your reach and maximize ROI.',
    '',
    '## UI/UX Design',
    'User-centered design that transforms complex problems into intuitive experiences. Wireframing, prototyping, and design systems.',
    '',
    '## SEO & Analytics',
    'Strategic optimization to boost your visibility and track what matters. Technical SEO, content strategy, structured data, and conversion tracking.',
    '',
    '## Our Process',
    '',
    '1. **Discovery** (15-min call) — We dive deep into your goals, audience, and market to build a solid foundation.',
    '2. **Strategy** (2–3 days) — We craft a tailored roadmap that aligns creative vision with business objectives.',
    '3. **Design** (1–2 weeks) — We create compelling visuals and intuitive interfaces that captivate users.',
    '4. **Development** (2–4 weeks) — We build with modern technologies ensuring speed, scalability, and reliability.',
    '5. **Launch & Optimize** (Ongoing) — We deploy, monitor, and continuously refine to maximize performance.',
    '',
    '---',
    ''
  );

  // ── Portfolio / Projects ──
  sections.push('# Portfolio — Case Studies', '');

  for (const [slug, project] of projectEntries) {
    sections.push(
      `## ${project.title}`,
      '',
      `**Category:** ${project.category}  `,
      `**Year:** ${project.year}  `,
      project.url ? `**Live URL:** ${project.url}  ` : '',
      `**Page:** https://blokblokstudio.com/projects/${slug}`,
      '',
      `**Overview:** ${project.desc}`,
      '',
      `**Challenge:** ${project.challenge}`,
      '',
      `**Solution:** ${project.solution}`,
      '',
      `**Results:** ${project.results}`,
      '',
      '---',
      ''
    );
  }

  // ── Funnel / Why Choose Us ──
  sections.push(
    '# Why Choose Blok Blok Studio',
    '',
    '## What You Get',
    '',
    '- **Custom Design** — No templates. Every project is designed from scratch for your specific brand and goals.',
    '- **Lightning-Fast Performance** — Sites built for speed with Core Web Vitals optimization, CDN delivery, and modern frameworks.',
    '- **SEO-Optimized** — Structured data, meta tags, sitemaps, and technical SEO built into every project from day one.',
    '- **Mobile-First** — Responsive design that looks and works perfectly on every device.',
    '- **Conversion-Focused** — Every design decision is driven by data and optimized to turn visitors into customers.',
    '- **Ongoing Support** — We don\'t disappear after launch. Continuous optimization and support included.',
    '',
    '## Service Packages',
    '',
    '### Brand Foundation',
    'Logo design, visual identity system, brand guidelines, and brand strategy.',
    '',
    '### Web Presence',
    'Custom website design and development, SEO setup, and performance optimization.',
    '',
    '### Growth Engine',
    'Digital marketing strategy, content creation, analytics setup, and conversion optimization.',
    '',
    '### Digital Products',
    'App design and development, SaaS interfaces, and interactive digital experiences.',
    '',
    '## Client Testimonials',
    '',
    '- **Sarah Chen** (CEO, Zenith Finance): Praised the quality and professionalism of the work.',
    '- **Marcus Rivera** (Founder, Aura Wellness): Reported 10x return on investment.',
    '- **Emily Park** (Marketing Director, Horizon Travel): Called Blok Blok Studio one of the best agencies they\'ve worked with.',
    '- **Jake Morrison** (CEO, Altitude Sports): Nearly doubled revenue in 3 months.',
    '- **David Kim** (NovaPay): 5x ROI on their digital investment.',
    '- **Lisa Tran** (Luma Beauty): 3x increase in conversions.',
    '- **Alex Hartley** (Prism Health): 300% growth in digital presence.',
    '',
    '## Comparison: DIY vs Freelancer vs Blok Blok Studio',
    '',
    '| Feature | DIY / Template | Freelancer | Blok Blok Studio |',
    '|---------|---------------|------------|------------------|',
    '| Custom Design | No | Partial | Yes |',
    '| SEO Optimization | Basic | Varies | Full |',
    '| Performance | Low | Medium | High |',
    '| Brand Strategy | No | No | Yes |',
    '| Ongoing Support | No | Limited | Yes |',
    '| Conversion Focus | No | Varies | Yes |',
    '| Timeline | Self-paced | Varies | 4–6 weeks |',
    '| Results Guarantee | No | No | Yes |',
    '',
    '---',
    ''
  );

  // ── Blog Posts ──
  sections.push('# Blog', '');

  for (const post of blogPosts) {
    sections.push(
      `## ${post.title}`,
      '',
      `> ${post.description}`,
      '',
      `**Published:** ${post.date}  `,
      `**Category:** ${post.category}  `,
      `**Read Time:** ${post.readTime}  `,
      `**URL:** https://blokblokstudio.com/blog/${post.slug}`,
      '',
      post.content,
      '',
      '---',
      ''
    );
  }

  // ── Footer ──
  sections.push(
    '# Contact Blok Blok Studio',
    '',
    '- **Website:** https://blokblokstudio.com',
    '- **Email:** hello@blokblokstudio.com',
    '- **Instagram:** https://www.instagram.com/blokblokstudio/',
    '- **LinkedIn:** https://www.linkedin.com/company/blok-blok-studio/',
    '- **Free Website Audit:** https://blokblokstudio.com/audit',
    '',
    'Blok Blok Studio — Crafting digital experiences that inspire.',
  );

  return new NextResponse(sections.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
