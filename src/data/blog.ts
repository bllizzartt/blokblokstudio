export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  category: string;
  image: string;
  gradient: string;
  icon: string;
  content: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'why-your-website-is-losing-customers',
    title: 'Why Your Website Is Losing Customers (And How to Fix It)',
    description: 'Most business websites lose 70% of visitors in the first 3 seconds. Here are the top reasons why — and what you can do about it today.',
    date: '2026-02-14',
    readTime: '5 min read',
    category: 'Web Design',
    image: '/og-image.jpg',
    gradient: 'from-blue-600 via-indigo-700 to-purple-800',
    icon: '🌐',
    content: `
Your website has about 3 seconds to make an impression. If it fails, visitors leave — and they rarely come back. Here's what's driving them away and how to fix it.

## 1. Slow Load Times Kill Conversions

Every second of delay reduces conversions by 7%. If your site takes more than 3 seconds to load, you're losing nearly a quarter of your potential customers before they even see your content.

**The fix:** Optimize images (use WebP/AVIF), enable compression, use a CDN, and minimize JavaScript bundles. Consider a modern framework like Next.js that offers built-in performance optimizations.

## 2. No Clear Value Proposition

If a visitor can't understand what you do and why it matters within 5 seconds of landing on your homepage, they'll bounce. Generic headlines like "Welcome to Our Website" don't cut it.

**The fix:** Lead with a clear, benefit-driven headline. Tell visitors exactly what problem you solve and who you solve it for. Use social proof (client logos, stats, testimonials) to build instant credibility.

## 3. Poor Mobile Experience

Over 60% of web traffic comes from mobile devices. If your site isn't responsive or has tiny tap targets and unreadable text on mobile, you're alienating the majority of your audience.

**The fix:** Design mobile-first. Test on real devices. Ensure buttons are at least 44px tall, text is readable without zooming, and navigation is thumb-friendly.

## 4. Weak or Missing CTAs

If visitors can't figure out what to do next, they leave. Every page needs a clear call to action — whether that's booking a call, requesting a quote, or downloading a resource.

**The fix:** Use one primary CTA per page. Make it visually prominent with contrasting colors. Use action-oriented language ("Get Your Free Audit" beats "Submit").

## 5. No Trust Signals

People buy from businesses they trust. If your site lacks testimonials, case studies, certifications, or even a real team photo, visitors will hesitate to reach out.

**The fix:** Add social proof throughout your site — not just on a dedicated testimonials page. Show real results, real people, and real numbers.

## Ready to Fix Your Website?

If any of these issues sound familiar, you're not alone. Most business websites suffer from at least two or three of these problems. The good news? They're all fixable.

Book a free audit with our team and we'll show you exactly what's holding your site back — and how to turn it into a growth engine.
    `.trim(),
  },
  {
    slug: 'seo-checklist-2026',
    title: 'The Ultimate SEO Checklist for 2026',
    description: 'A comprehensive guide to the SEO fundamentals every business website needs to rank on Google in 2026. Structured data, Core Web Vitals, and more.',
    date: '2026-02-10',
    readTime: '7 min read',
    category: 'SEO',
    image: '/og-image.jpg',
    gradient: 'from-emerald-600 via-green-700 to-teal-800',
    icon: '📈',
    content: `
SEO in 2026 is about speed, structure, and user experience. Here's everything you need to check off to give your site the best chance at ranking.

## Technical SEO Foundations

- **HTTPS everywhere** — SSL is table stakes. Google won't rank insecure sites.
- **Fast Core Web Vitals** — LCP under 2.5s, FID under 100ms, CLS under 0.1.
- **Mobile-first indexing** — Google indexes mobile versions first. Your mobile site IS your site.
- **Clean URL structure** — Use descriptive, keyword-rich URLs. Avoid query parameters.
- **XML sitemap** — Submit to Google Search Console. Keep it updated.
- **robots.txt** — Block what shouldn't be indexed (admin pages, API routes).

## On-Page SEO

- **Unique title tags** — Every page needs a unique, descriptive title under 60 characters.
- **Meta descriptions** — Compelling descriptions under 155 characters that encourage clicks.
- **Heading hierarchy** — One H1 per page, logical H2-H6 structure.
- **Internal linking** — Connect related pages. Use descriptive anchor text.
- **Image optimization** — Alt text, compressed formats (WebP/AVIF), lazy loading.

## Structured Data

Structured data helps Google understand your content and can earn you rich results (FAQ dropdowns, star ratings, breadcrumbs).

- **Organization schema** — Tell Google who you are.
- **LocalBusiness schema** — Essential for local SEO.
- **BreadcrumbList schema** — Helps navigation in search results.
- **FAQPage schema** — Can earn expanded FAQ snippets in search.
- **Article schema** — For blog posts and news content.

## Content Strategy

- **Target long-tail keywords** — Less competition, higher intent.
- **Answer real questions** — Use tools like "People Also Ask" for content ideas.
- **Update old content** — Fresh content ranks better. Review quarterly.
- **Build topical authority** — Create clusters of related content around your core topics.

## The Bottom Line

SEO isn't a one-time project — it's an ongoing practice. But getting the fundamentals right from day one gives you a massive advantage over competitors who treat it as an afterthought.
    `.trim(),
  },
  {
    slug: 'brand-identity-investment',
    title: 'Why Brand Identity Is the Best Investment You\'ll Make',
    description: 'Your brand is more than a logo. A strong brand identity builds trust, commands premium pricing, and turns customers into advocates.',
    date: '2026-02-05',
    readTime: '4 min read',
    category: 'Branding',
    image: '/og-image.jpg',
    gradient: 'from-purple-600 via-fuchsia-700 to-pink-800',
    icon: '✨',
    content: `
Most businesses think branding is just a logo and some colors. But a strong brand identity is the single most valuable asset your business can own.

## What Brand Identity Actually Is

Brand identity is the complete visual and verbal system that represents your business. It includes your logo, color palette, typography, voice, messaging, and the feelings people associate with your name.

Think of the world's most valuable brands. You recognize them instantly — not just by their logo, but by their entire visual language and the way they make you feel.

## Why It Matters for Growth

**1. Trust at first sight.** People form opinions about your business in milliseconds. A polished, cohesive brand signals professionalism and reliability.

**2. Premium pricing.** Strong brands command higher prices. Customers pay more for perceived quality and emotional connection.

**3. Customer loyalty.** People don't just buy products — they buy into brands. A strong identity creates emotional attachment that competitors can't replicate.

**4. Marketing efficiency.** When your brand is clear and consistent, every marketing dollar works harder. People remember you. They recognize you. They come back.

## Signs You Need a Brand Refresh

- Your visual identity looks dated or inconsistent across platforms
- Customers can't articulate what makes you different
- You're competing primarily on price rather than value
- Your team isn't sure how to represent the brand consistently

## The ROI of Branding

Research consistently shows that consistent brand presentation across all platforms increases revenue by up to 23%. That's not a cost — that's an investment with measurable returns.

Ready to build a brand that works as hard as you do? Let's talk about what a brand transformation could look like for your business.
    `.trim(),
  },
];

export function getAllBlogSlugs(): string[] {
  return blogPosts.map((p) => p.slug);
}

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function getBlogCategories(): string[] {
  return [...new Set(blogPosts.map((p) => p.category))];
}
