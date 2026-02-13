/**
 * ============================================================================
 * projects.ts — Shared Project Data
 * ============================================================================
 *
 * This file contains all project data used by both:
 *   - /projects page (ProjectsContent.tsx) — filterable grid
 *   - /projects/[slug] page (ProjectDetail.tsx) — individual case study
 *   - /projects/[slug]/page.tsx — static params generation (server-side)
 *   - Homepage featured projects (HomeProjects.tsx)
 *   - Funnel page project showcase (FunnelContent.tsx)
 *
 * This file is NOT marked 'use client' so it can be imported on both
 * the server (generateStaticParams, generateMetadata) and client.
 *
 * ============================================================================
 */

export interface ProjectData {
  title: string;
  category: string;
  year: string;
  desc: string;
  challenge: string;
  solution: string;
  results: string;
  heroImage: string | null;
  gallery: (string | null)[];
  nextSlug: string | null;
  url?: string;
  mobileImage?: string | null;
}

export const projectsData: Record<string, ProjectData> = {
  'coach-kofi': {
    title: 'Coach Kofi',
    category: 'Web Design',
    year: '2025',
    desc: 'High-performance personal brand and coaching platform with bold visual identity.',
    challenge: 'Coach Kofi needed a personal brand website that matched his bold "Just Do The Work" philosophy. The existing online presence didn\'t reflect the energy and authority he brings to movement, performance, and development coaching.',
    solution: 'We designed a striking black-and-white website with bold typography, professional photography integration, and a clear conversion flow from visitor to coaching client. The site features real-time booking, social proof counters (150+ clients, 8000+ hours coached), and a mobile-first responsive design.',
    results: 'Professional brand presence that instantly communicates authority. Streamlined booking flow increased consultation requests by 200%, and the bold design became a signature part of Coach Kofi\'s brand identity across platforms.',
    heroImage: '/images/projects/coachkofi.png',
    gallery: ['/images/projects/coachkofi.png', '/images/projects/coachkofi-mobile.png', null],
    nextSlug: 'exotic-ripz',
    url: 'https://coachkofi.de',
    mobileImage: '/images/projects/coachkofi-mobile.png',
  },
  'exotic-ripz': {
    title: 'Exotic Ripz',
    category: 'E-Commerce',
    year: '2025',
    desc: 'Vibrant e-commerce platform for a collectible trading card community brand.',
    challenge: 'Exotic Ripz needed an e-commerce store that captured the excitement and energy of the collectible trading card community. They needed a platform that could handle booster packs, new releases, restocks, and community engagement across Discord, Twitch, and social media.',
    solution: 'We built a full-featured Shopify storefront with bold animated branding, integrated Discord community links, multi-platform social presence (Discord, YouTube, Twitch, TikTok, Instagram, X, Threads), smart product categorization, and conversion-optimized popups for email capture.',
    results: 'Launched a thriving online store with active community engagement. Email list grew 400% in the first month through smart discount capture. Booster pack drops consistently sell out within hours of release.',
    heroImage: '/images/projects/exoticripz.png',
    gallery: ['/images/projects/exoticripz.png', '/images/projects/exoticripz-mobile.png', null],
    nextSlug: 'military-newschool',
    url: 'https://exoticripz.com',
    mobileImage: '/images/projects/exoticripz-mobile.png',
  },
  'military-newschool': {
    title: 'The New School — Military Center',
    category: 'Web Design',
    year: '2024',
    desc: 'Institutional web presence for The New School\'s Center for Military-Affiliated Students.',
    challenge: 'The New School\'s Center for Military-Affiliated Students, founded in 2023, needed a digital presence that honored the military-connected community while fitting within the university\'s modern design language. The site needed to communicate support services, programs, and resources clearly.',
    solution: 'We designed a clean, professional page within The New School\'s ecosystem featuring compelling photography, clear information architecture, and accessible content that welcomes military-affiliated students into a community of scholars, artists, and designers.',
    results: 'The center now has a strong digital presence that effectively communicates its mission. Increased engagement from military-affiliated prospective students and streamlined access to support programs and services.',
    heroImage: '/images/projects/military-newschool.png',
    gallery: ['/images/projects/military-newschool.png', '/images/projects/military-newschool-mobile.png', null],
    nextSlug: 'public-affair',
    url: 'https://www.military.newschool.edu',
    mobileImage: '/images/projects/military-newschool-mobile.png',
  },
  'public-affair': {
    title: 'Public Affair',
    category: 'Branding',
    year: '2024',
    desc: 'Sophisticated brand identity and web experience for a premium lifestyle brand.',
    challenge: 'Public Affair needed a digital presence that conveyed luxury, sophistication, and exclusivity. The brand required an elegant age-verification experience that set the tone before visitors even entered the main site.',
    solution: 'We crafted an elegant brand experience starting with a beautifully designed age gate featuring custom script typography and a rich navy-and-gold color palette. Every touchpoint was designed to feel premium — from the P.A. monogram to the refined copy that makes the verification feel like an invitation rather than a barrier.',
    results: 'Brand recognition increased significantly in target demographics. The age gate experience has a 95%+ completion rate — visitors enjoy the entry experience rather than being deterred. Premium positioning led to higher perceived value and average order values.',
    heroImage: '/images/projects/public-affair.png',
    gallery: ['/images/projects/public-affair.png', '/images/projects/public-affair-mobile.png', null],
    nextSlug: 'nanny-and-nest',
    url: 'https://public-affair.com',
    mobileImage: '/images/projects/public-affair-mobile.png',
  },
  'nanny-and-nest': {
    title: 'Nanny & Nest',
    category: 'Web Design',
    year: '2025',
    desc: 'Warm, trust-focused membership platform for a premium childcare and home assistance agency.',
    challenge: 'Nanny & Nest needed a website that communicated trust, warmth, and professionalism for their membership-based childcare and home assistance service. Parents needed to feel confident that placements would be perfect for their family\'s unique needs.',
    solution: 'We designed a clean, warm website with natural tones, family photography, and a clear service proposition. The layout emphasizes community, support, and the personalized matching process — featuring an elegant "Get Connected" CTA flow and easy access to career opportunities.',
    results: 'Membership inquiries increased 150% after launch. The warm, professional design built immediate trust with parents. The streamlined application flow reduced time-to-match and improved both client and caregiver satisfaction scores.',
    heroImage: '/images/projects/nannyandnest.png',
    gallery: ['/images/projects/nannyandnest.png', '/images/projects/nannyandnest-mobile.png', null],
    nextSlug: 'coach-kofi',
    url: 'https://www.nannyandnest.com',
    mobileImage: '/images/projects/nannyandnest-mobile.png',
  },
};

/**
 * Get all valid project slugs (used by generateStaticParams on the server)
 */
export function getAllProjectSlugs(): string[] {
  return Object.keys(projectsData);
}
