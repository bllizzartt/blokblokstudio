'use client';

import { motion, useInView, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useState, useRef, useEffect, useCallback } from 'react';

/* ── Animation helpers ── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const scaleUp = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

function Section({
  children,
  className = '',
  delay = 0,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  id?: string;
}) {
  return (
    <motion.section
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      variants={fadeUp}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ── Animated counter ── */
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ── Accent line divider ── */
function AccentDivider() {
  return (
    <div className="flex items-center justify-center py-2">
      <div className="h-px w-16 bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />
    </div>
  );
}

/* ── Data ── */

const trustedBrands = [
  { name: 'Coach Kofi', image: '/images/projects/coachkofi.png', url: 'coachkofi.de', category: 'Coaching' },
  { name: 'Nanny & Nest', image: '/images/projects/nannyandnest.png', url: 'nannyandnest.com', category: 'Childcare' },
  { name: 'Exotic Ripz', image: '/images/projects/exoticripz.png', url: 'exoticripz.com', category: 'E-Commerce' },
  { name: 'The New School', image: '/images/projects/military-newschool.png', url: 'military.newschool.edu', category: 'Education' },
  { name: 'Public Affair', image: '/images/projects/public-affair.png', url: 'public-affair.com', category: 'Lifestyle' },
  { name: 'KDS Systems', image: '/images/projects/kdssys.png', url: 'kdssys.com', category: 'IT Services' },
];

const moreTestimonials = [
  {
    quote: 'They completely changed how our customers experience our brand online. The ROI has been unreal — we saw a 5x return in the first quarter alone.',
    name: 'David Kim',
    role: 'CTO, NovaPay',
    initials: 'DK',
    stat: '5x ROI',
  },
  {
    quote: 'From concept to launch in under a month. The speed and quality blew us away. Our conversion rate tripled overnight.',
    name: 'Lisa Tran',
    role: 'Founder, Luma Beauty',
    initials: 'LT',
    stat: '3x Conversions',
  },
  {
    quote: 'We tried three agencies before finding Blok Blok. The difference is night and day. They actually understand what brands need to grow.',
    name: 'Alex Hartley',
    role: 'CMO, Prism Health',
    initials: 'AH',
    stat: '300% Growth',
  },
];

const roadmapSteps = [
  {
    num: '01',
    title: 'Discovery Call',
    desc: 'A quick 15-minute call to understand your goals, audience, and vision. We learn about your brand, target customers, and what success looks like.',
    duration: '15 min',
  },
  {
    num: '02',
    title: 'Strategy & Proposal',
    desc: 'We build a tailored plan with clear deliverables, timeline, and transparent pricing. You\'ll know exactly what you\'re getting.',
    duration: '2–3 days',
  },
  {
    num: '03',
    title: 'Design Phase',
    desc: 'Wireframes, mockups, and revisions until the design feels perfect for your brand. We iterate until you love it.',
    duration: '1–2 weeks',
  },
  {
    num: '04',
    title: 'Development & Build',
    desc: 'We bring the design to life with clean, fast code and regular check-ins. You see progress every step of the way.',
    duration: '2–4 weeks',
  },
  {
    num: '05',
    title: 'Launch & Support',
    desc: 'We launch your project and provide ongoing support to ensure long-term success. Your growth is our mission.',
    duration: 'Ongoing',
  },
];

/* ── SVG Illustrations for roadmap steps ── */
function StepIllustration({ step }: { step: string }) {
  const shared = 'w-full h-full';
  switch (step) {
    case '01':
      // Video call / discovery call illustration
      return (
        <svg className={shared} viewBox="0 0 280 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Monitor/Screen */}
          <rect x="40" y="20" width="200" height="130" rx="12" fill="rgba(255,255,255,0.03)" stroke="rgba(249,115,22,0.3)" strokeWidth="1.5" />
          <rect x="50" y="30" width="180" height="100" rx="6" fill="rgba(249,115,22,0.05)" />
          {/* Person silhouette left */}
          <circle cx="110" cy="65" r="16" fill="rgba(249,115,22,0.15)" stroke="rgba(249,115,22,0.3)" strokeWidth="1" />
          <rect x="94" y="85" width="32" height="35" rx="6" fill="rgba(249,115,22,0.1)" stroke="rgba(249,115,22,0.2)" strokeWidth="1" />
          {/* Person silhouette right */}
          <circle cx="170" cy="65" r="16" fill="rgba(239,68,68,0.15)" stroke="rgba(239,68,68,0.3)" strokeWidth="1" />
          <rect x="154" y="85" width="32" height="35" rx="6" fill="rgba(239,68,68,0.1)" stroke="rgba(239,68,68,0.2)" strokeWidth="1" />
          {/* Video call indicator */}
          <circle cx="140" cy="45" r="4" fill="rgba(34,197,94,0.6)" />
          {/* Monitor stand */}
          <rect x="120" y="150" width="40" height="8" rx="2" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <rect x="130" y="158" width="20" height="12" rx="2" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          {/* Chat bubbles */}
          <rect x="60" y="35" width="35" height="12" rx="6" fill="rgba(249,115,22,0.2)" />
          <rect x="185" y="50" width="35" height="12" rx="6" fill="rgba(239,68,68,0.2)" />
          {/* Signal waves */}
          <path d="M200 30 Q210 25, 210 35" stroke="rgba(34,197,94,0.3)" strokeWidth="1.5" fill="none" />
          <path d="M205 25 Q218 18, 218 38" stroke="rgba(34,197,94,0.2)" strokeWidth="1.5" fill="none" />
        </svg>
      );
    case '02':
      // Strategy / planning / calendar illustration
      return (
        <svg className={shared} viewBox="0 0 280 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Clipboard */}
          <rect x="70" y="15" width="140" height="170" rx="10" fill="rgba(255,255,255,0.03)" stroke="rgba(249,115,22,0.3)" strokeWidth="1.5" />
          <rect x="110" y="8" width="60" height="16" rx="8" fill="rgba(249,115,22,0.15)" stroke="rgba(249,115,22,0.3)" strokeWidth="1" />
          {/* Checklist items */}
          <rect x="90" y="45" width="14" height="14" rx="3" fill="rgba(34,197,94,0.15)" stroke="rgba(34,197,94,0.4)" strokeWidth="1.5" />
          <path d="M93 52 L96 55 L101 49" stroke="rgba(34,197,94,0.6)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <rect x="112" y="48" width="80" height="8" rx="4" fill="rgba(255,255,255,0.06)" />
          <rect x="90" y="72" width="14" height="14" rx="3" fill="rgba(34,197,94,0.15)" stroke="rgba(34,197,94,0.4)" strokeWidth="1.5" />
          <path d="M93 79 L96 82 L101 76" stroke="rgba(34,197,94,0.6)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <rect x="112" y="75" width="70" height="8" rx="4" fill="rgba(255,255,255,0.06)" />
          <rect x="90" y="99" width="14" height="14" rx="3" fill="rgba(249,115,22,0.15)" stroke="rgba(249,115,22,0.3)" strokeWidth="1.5" />
          <rect x="112" y="102" width="75" height="8" rx="4" fill="rgba(255,255,255,0.06)" />
          <rect x="90" y="126" width="14" height="14" rx="3" fill="rgba(249,115,22,0.15)" stroke="rgba(249,115,22,0.3)" strokeWidth="1.5" />
          <rect x="112" y="129" width="65" height="8" rx="4" fill="rgba(255,255,255,0.06)" />
          {/* Price tag */}
          <rect x="90" y="155" width="100" height="18" rx="9" fill="rgba(249,115,22,0.1)" stroke="rgba(249,115,22,0.2)" strokeWidth="1" />
          <rect x="100" y="159" width="30" height="10" rx="5" fill="rgba(249,115,22,0.2)" />
          {/* Floating elements */}
          <circle cx="225" cy="40" r="15" fill="rgba(249,115,22,0.05)" stroke="rgba(249,115,22,0.15)" strokeWidth="1" />
          <text x="220" y="45" fill="rgba(249,115,22,0.4)" fontSize="12" fontWeight="bold">$</text>
          <rect x="215" y="70" width="40" height="30" rx="6" fill="rgba(239,68,68,0.05)" stroke="rgba(239,68,68,0.15)" strokeWidth="1" />
          <rect x="222" y="78" width="26" height="3" rx="1.5" fill="rgba(239,68,68,0.2)" />
          <rect x="222" y="85" width="18" height="3" rx="1.5" fill="rgba(239,68,68,0.15)" />
        </svg>
      );
    case '03':
      // Design / wireframe illustration
      return (
        <svg className={shared} viewBox="0 0 280 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Browser window */}
          <rect x="35" y="20" width="210" height="155" rx="10" fill="rgba(255,255,255,0.03)" stroke="rgba(249,115,22,0.3)" strokeWidth="1.5" />
          {/* Browser chrome */}
          <rect x="35" y="20" width="210" height="28" rx="10" fill="rgba(255,255,255,0.04)" />
          <circle cx="52" cy="34" r="4" fill="rgba(239,68,68,0.4)" />
          <circle cx="64" cy="34" r="4" fill="rgba(234,179,8,0.4)" />
          <circle cx="76" cy="34" r="4" fill="rgba(34,197,94,0.4)" />
          <rect x="95" y="30" width="100" height="8" rx="4" fill="rgba(255,255,255,0.06)" />
          {/* Layout wireframe */}
          <rect x="50" y="58" width="70" height="10" rx="3" fill="rgba(249,115,22,0.2)" />
          <rect x="50" y="75" width="180" height="40" rx="6" fill="rgba(249,115,22,0.06)" stroke="rgba(249,115,22,0.15)" strokeWidth="1" />
          {/* Grid wireframe blocks */}
          <rect x="50" y="122" width="55" height="40" rx="4" fill="rgba(239,68,68,0.06)" stroke="rgba(239,68,68,0.15)" strokeWidth="1" />
          <rect x="112" y="122" width="55" height="40" rx="4" fill="rgba(249,115,22,0.06)" stroke="rgba(249,115,22,0.15)" strokeWidth="1" />
          <rect x="174" y="122" width="55" height="40" rx="4" fill="rgba(234,179,8,0.06)" stroke="rgba(234,179,8,0.15)" strokeWidth="1" />
          {/* Pen tool cursor */}
          <path d="M230 85 L245 100 L240 105 L235 103 Z" fill="rgba(249,115,22,0.4)" stroke="rgba(249,115,22,0.6)" strokeWidth="1" />
          <path d="M235 103 L233 110 L240 105" fill="rgba(249,115,22,0.3)" />
          {/* Color swatches */}
          <circle cx="255" cy="140" r="8" fill="rgba(249,115,22,0.3)" stroke="rgba(249,115,22,0.5)" strokeWidth="1" />
          <circle cx="255" cy="158" r="8" fill="rgba(239,68,68,0.3)" stroke="rgba(239,68,68,0.5)" strokeWidth="1" />
        </svg>
      );
    case '04':
      // Development / code illustration
      return (
        <svg className={shared} viewBox="0 0 280 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Laptop base */}
          <rect x="40" y="25" width="200" height="125" rx="10" fill="rgba(255,255,255,0.03)" stroke="rgba(249,115,22,0.3)" strokeWidth="1.5" />
          <path d="M25 150 L255 150 L245 165 Q240 170, 235 170 L45 170 Q40 170, 35 165 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          {/* Screen */}
          <rect x="50" y="35" width="180" height="105" rx="4" fill="rgba(15,15,25,0.8)" />
          {/* Code lines */}
          <rect x="60" y="45" width="40" height="5" rx="2.5" fill="rgba(239,68,68,0.4)" />
          <rect x="105" y="45" width="60" height="5" rx="2.5" fill="rgba(255,255,255,0.1)" />
          <rect x="72" y="56" width="30" height="5" rx="2.5" fill="rgba(249,115,22,0.4)" />
          <rect x="107" y="56" width="50" height="5" rx="2.5" fill="rgba(34,197,94,0.3)" />
          <rect x="72" y="67" width="45" height="5" rx="2.5" fill="rgba(96,165,250,0.3)" />
          <rect x="122" y="67" width="35" height="5" rx="2.5" fill="rgba(255,255,255,0.08)" />
          <rect x="72" y="78" width="55" height="5" rx="2.5" fill="rgba(168,85,247,0.3)" />
          <rect x="132" y="78" width="40" height="5" rx="2.5" fill="rgba(249,115,22,0.25)" />
          <rect x="60" y="89" width="35" height="5" rx="2.5" fill="rgba(239,68,68,0.4)" />
          <rect x="60" y="100" width="50" height="5" rx="2.5" fill="rgba(249,115,22,0.3)" />
          <rect x="115" y="100" width="40" height="5" rx="2.5" fill="rgba(34,197,94,0.25)" />
          <rect x="72" y="111" width="65" height="5" rx="2.5" fill="rgba(255,255,255,0.06)" />
          <rect x="72" y="122" width="45" height="5" rx="2.5" fill="rgba(96,165,250,0.25)" />
          {/* Terminal cursor */}
          <rect x="60" y="122" width="7" height="5" rx="1" fill="rgba(249,115,22,0.5)">
            <animate attributeName="opacity" values="1;0;1" dur="1.2s" repeatCount="indefinite" />
          </rect>
          {/* Progress indicator */}
          <rect x="165" y="45" width="55" height="20" rx="4" fill="rgba(34,197,94,0.05)" stroke="rgba(34,197,94,0.2)" strokeWidth="1" />
          <rect x="170" y="52" width="35" height="6" rx="3" fill="rgba(34,197,94,0.15)" />
          <rect x="170" y="52" width="25" height="6" rx="3" fill="rgba(34,197,94,0.4)" />
        </svg>
      );
    case '05':
      // Launch / rocket illustration
      return (
        <svg className={shared} viewBox="0 0 280 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Dashboard screen */}
          <rect x="50" y="20" width="180" height="120" rx="10" fill="rgba(255,255,255,0.03)" stroke="rgba(249,115,22,0.3)" strokeWidth="1.5" />
          {/* Top bar */}
          <rect x="50" y="20" width="180" height="22" rx="10" fill="rgba(255,255,255,0.04)" />
          <circle cx="66" cy="31" r="3.5" fill="rgba(34,197,94,0.5)" />
          <rect x="78" y="28" width="50" height="6" rx="3" fill="rgba(255,255,255,0.06)" />
          {/* Chart going up */}
          <path d="M70 120 L100 105 L130 110 L160 85 L190 70 L210 50" stroke="rgba(249,115,22,0.5)" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M70 120 L100 105 L130 110 L160 85 L190 70 L210 50 L210 120 L70 120 Z" fill="rgba(249,115,22,0.05)" />
          {/* Data points */}
          <circle cx="100" cy="105" r="3" fill="rgba(249,115,22,0.6)" />
          <circle cx="130" cy="110" r="3" fill="rgba(249,115,22,0.6)" />
          <circle cx="160" cy="85" r="3" fill="rgba(249,115,22,0.6)" />
          <circle cx="190" cy="70" r="3" fill="rgba(249,115,22,0.6)" />
          <circle cx="210" cy="50" r="4" fill="rgba(249,115,22,0.8)" stroke="rgba(249,115,22,0.4)" strokeWidth="4" />
          {/* Rocket */}
          <g transform="translate(200, 30) rotate(30)">
            <path d="M0 -10 Q0 -20, 5 -25 Q10 -20, 10 -10 L10 5 L0 5 Z" fill="rgba(249,115,22,0.4)" stroke="rgba(249,115,22,0.6)" strokeWidth="1" />
            <rect x="2" y="-5" width="6" height="4" rx="1" fill="rgba(96,165,250,0.3)" />
            <path d="M0 5 L-3 10 L0 8 Z" fill="rgba(239,68,68,0.4)" />
            <path d="M10 5 L13 10 L10 8 Z" fill="rgba(239,68,68,0.4)" />
            <path d="M2 8 L5 15 L8 8" fill="rgba(249,115,22,0.3)" />
          </g>
          {/* Support indicators */}
          <rect x="60" y="150" width="160" height="30" rx="8" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <circle cx="80" cy="165" r="8" fill="rgba(34,197,94,0.1)" stroke="rgba(34,197,94,0.3)" strokeWidth="1" />
          <path d="M77 165 L79 167 L83 163" stroke="rgba(34,197,94,0.5)" strokeWidth="1.5" fill="none" />
          <rect x="95" y="161" width="60" height="4" rx="2" fill="rgba(255,255,255,0.06)" />
          <rect x="95" y="168" width="40" height="3" rx="1.5" fill="rgba(255,255,255,0.04)" />
          {/* Sparkles */}
          <circle cx="240" cy="45" r="2" fill="rgba(234,179,8,0.4)" />
          <circle cx="250" cy="65" r="1.5" fill="rgba(249,115,22,0.3)" />
          <circle cx="45" cy="55" r="1.5" fill="rgba(249,115,22,0.3)" />
        </svg>
      );
    default:
      return null;
  }
}

const benefits = [
  {
    title: 'Custom Design, Not Templates',
    desc: 'Every project is designed from scratch to match your unique brand and goals.',
    icon: '✏️',
    color: 'from-orange-500/10 to-red-500/5',
  },
  {
    title: 'Lightning-Fast Performance',
    desc: 'We build with modern frameworks for sites that load in under 2 seconds.',
    icon: '⚡',
    color: 'from-yellow-500/10 to-amber-500/5',
  },
  {
    title: 'SEO-Optimized From Day One',
    desc: 'Your site is structured and coded for maximum search engine visibility.',
    icon: '🔍',
    color: 'from-green-500/10 to-emerald-500/5',
  },
  {
    title: 'Mobile-First Approach',
    desc: 'Pixel-perfect experiences across every device, from phones to ultrawide monitors.',
    icon: '📱',
    color: 'from-blue-500/10 to-cyan-500/5',
  },
  {
    title: 'Conversion-Focused',
    desc: 'Strategic layouts and CTAs designed to turn visitors into paying customers.',
    icon: '🎯',
    color: 'from-purple-500/10 to-violet-500/5',
  },
  {
    title: 'Ongoing Support',
    desc: 'We don\'t disappear after launch. Get continued support whenever you need it.',
    icon: '🤝',
    color: 'from-pink-500/10 to-rose-500/5',
  },
];

const serviceModules = [
  {
    title: 'Brand Foundation',
    icon: '🎨',
    items: ['Logo & Visual Identity', 'Brand Guidelines', 'Color & Typography System', 'Brand Voice & Messaging'],
  },
  {
    title: 'Web Presence',
    icon: '🌐',
    items: ['Custom Website Design', 'Responsive Development', 'CMS Integration', 'Performance Optimization'],
  },
  {
    title: 'Growth Engine',
    icon: '📈',
    items: ['SEO Strategy & Execution', 'Content Marketing', 'Social Media Strategy', 'Analytics & Reporting'],
  },
  {
    title: 'Digital Products',
    icon: '📱',
    items: ['Mobile App Development', 'Web Applications', 'E-commerce Solutions', 'API & Integrations'],
  },
];

const projectShowcase = [
  { label: 'Coach Kofi', stat: '+200%', metric: 'Consultations', image: '/images/projects/coachkofi.png', url: 'coachkofi.de' },
  { label: 'Exotic Ripz', stat: '+400%', metric: 'Email Growth', image: '/images/projects/exoticripz.png', url: 'exoticripz.com' },
  { label: 'The New School', stat: '10x', metric: 'Engagement', image: '/images/projects/military-newschool.png', url: 'military.newschool.edu' },
  { label: 'Public Affair', stat: '95%+', metric: 'Completion Rate', image: '/images/projects/public-affair.png', url: 'public-affair.com' },
  { label: 'Nanny & Nest', stat: '+150%', metric: 'Inquiries', image: '/images/projects/nannyandnest.png', url: 'nannyandnest.com' },
  { label: 'KDS Systems', stat: '+180%', metric: 'Qualified Leads', image: '/images/projects/kdssys.png', url: 'kdssys.com' },
];

const included = [
  { item: 'Dedicated project manager', icon: '👤' },
  { item: 'Unlimited design revisions', icon: '🔄' },
  { item: 'Mobile-responsive design', icon: '📱' },
  { item: 'SEO-optimized code', icon: '🔍' },
  { item: 'Analytics dashboard setup', icon: '📊' },
  { item: 'Content management system', icon: '📝' },
  { item: '90-day post-launch support', icon: '🛡️' },
  { item: 'Performance monitoring', icon: '⚡' },
  { item: 'SSL & security setup', icon: '🔒' },
  { item: 'Social media integration', icon: '🔗' },
];

const auditBenefits = [
  'Personalized website & brand review',
  'Conversion optimization tips',
  'SEO quick-wins you can implement today',
  'Competitor analysis snapshot',
  'Custom recommendations for your industry',
];

const idealFor = [
  { text: 'Startups launching their first digital presence', yes: true },
  { text: 'Established businesses needing a rebrand', yes: true },
  { text: 'E-commerce brands looking to increase conversions', yes: true },
  { text: 'SaaS companies that need a polished product site', yes: true },
  { text: 'Anyone who needs a generic template site', yes: false },
  { text: 'Businesses looking for the cheapest option', yes: false },
];

const faqs = [
  { q: 'How long does a typical project take?', a: 'Most projects are completed in 3–6 weeks depending on scope. A simple landing page can be done in under a week, while a full brand + website package typically takes 4–6 weeks.' },
  { q: 'What if I don\'t like the design?', a: 'We offer unlimited design revisions. We work closely with you throughout the process and won\'t move to development until you\'re 100% happy with the design.' },
  { q: 'Do I need to have my content ready?', a: 'Not necessarily. We can work with rough ideas and help refine your messaging. For an additional fee, we also offer professional copywriting services.' },
  { q: 'Can I update the website myself after launch?', a: 'Absolutely. We build with user-friendly CMS platforms so you can easily update content, images, and pages without any coding knowledge.' },
  { q: 'What\'s included in post-launch support?', a: 'Our support includes bug fixes, minor content updates, performance monitoring, security updates, and priority access to our team via email or Slack.' },
  { q: 'Do you work with clients outside the US?', a: 'Yes! We work with clients worldwide. Our process is fully remote with regular video check-ins to keep everything on track regardless of timezone.' },
  { q: 'What if I just want to learn more before committing?', a: 'That\'s exactly what the free audit is for. Fill out the form, get a personalized review of your digital presence, and then decide if you\'d like to take the next step. Zero pressure, zero commitment.' },
];

/* ── CTA Button ── */
function CTAButton({ text = 'Get Your Free Audit', className = '', variant = 'primary' }: { text?: string; className?: string; variant?: 'primary' | 'secondary' }) {
  const base = variant === 'primary'
    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-400 hover:to-red-400 shadow-lg shadow-orange-500/20'
    : 'bg-white/10 text-white hover:bg-white/20 border border-white/10';
  return (
    <motion.a
      href="#audit"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className={`inline-flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-5 rounded-full font-semibold text-sm sm:text-base transition-all ${base} ${className}`}
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {text}
    </motion.a>
  );
}

/* ── Audit Lead Capture Form ── */
function AuditForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    field: '',
    website: '',
    noWebsite: false,
    problem: '',
    consent: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Something went wrong');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    const exploreLinks = [
      { label: 'Our Projects', href: '/projects', icon: '🎨', desc: 'See our latest work' },
      { label: 'Services', href: '/services', icon: '⚡', desc: 'What we can do for you' },
      { label: 'Blog', href: '/blog', icon: '📖', desc: 'Tips & insights' },
      { label: 'Meet the Team', href: '/team', icon: '👋', desc: 'The people behind the work' },
    ];

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12 sm:py-16"
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold mb-3">You&apos;re In!</h3>
        <p className="text-gray-400 text-base sm:text-lg max-w-md mx-auto mb-2">
          We&apos;ll send your personalized audit to <strong className="text-white">{formData.email}</strong> within 24 hours.
        </p>
        <p className="text-sm text-gray-500 mb-10">Keep an eye on your inbox (check spam too).</p>

        {/* Explore the site */}
        <div className="border-t border-white/10 pt-10">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-6">While you wait, explore our site</p>
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            {exploreLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="group flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-orange-500/30 hover:bg-white/[0.06] transition-all"
              >
                <span className="text-2xl">{link.icon}</span>
                <span className="text-sm font-medium text-white group-hover:text-orange-400 transition-colors">{link.label}</span>
                <span className="text-xs text-gray-500">{link.desc}</span>
              </a>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  const inputBase = 'w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/40 focus:bg-white/[0.06] transition-colors';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="audit-name" className="block text-xs text-gray-400 mb-1.5 ml-1">Your Name</label>
          <input
            id="audit-name"
            type="text"
            required
            placeholder="John Smith"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={inputBase}
          />
        </div>
        <div>
          <label htmlFor="audit-email" className="block text-xs text-gray-400 mb-1.5 ml-1">Email Address</label>
          <input
            id="audit-email"
            type="email"
            required
            placeholder="john@company.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={inputBase}
          />
        </div>
      </div>

      <div>
        <label htmlFor="audit-field" className="block text-xs text-gray-400 mb-1.5 ml-1">Field of Work / Industry</label>
        <input
          id="audit-field"
          type="text"
          required
          placeholder="e.g. E-commerce, SaaS, Healthcare, Real Estate..."
          value={formData.field}
          onChange={(e) => setFormData({ ...formData, field: e.target.value })}
          className={inputBase}
        />
      </div>

      <div>
        <label htmlFor="audit-website" className="block text-xs text-gray-400 mb-1.5 ml-1">Current Website URL</label>
        <div className="relative">
          <input
            id="audit-website"
            type="url"
            placeholder="https://yourwebsite.com"
            disabled={formData.noWebsite}
            value={formData.noWebsite ? '' : formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            className={`${inputBase} ${formData.noWebsite ? 'opacity-40 cursor-not-allowed' : ''}`}
          />
        </div>
        <label className="flex items-center gap-2.5 mt-2.5 ml-1 cursor-pointer group">
          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
            formData.noWebsite
              ? 'bg-orange-500/20 border-orange-500/40'
              : 'bg-white/[0.04] border-white/10 group-hover:border-white/20'
          }`}>
            {formData.noWebsite && (
              <svg className="w-3 h-3 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <input
            type="checkbox"
            className="sr-only"
            checked={formData.noWebsite}
            onChange={(e) => setFormData({ ...formData, noWebsite: e.target.checked, website: '' })}
          />
          <span className="text-sm text-gray-400">I don&apos;t have a website yet — <span className="text-orange-400">we&apos;ll take care of that for you</span></span>
        </label>
      </div>

      <div>
        <label htmlFor="audit-problem" className="block text-xs text-gray-400 mb-1.5 ml-1">What&apos;s your biggest challenge right now?</label>
        <textarea
          id="audit-problem"
          required
          rows={3}
          placeholder="e.g. My website doesn't convert visitors, I need a complete rebrand, I'm launching a new product and need a site fast..."
          value={formData.problem}
          onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
          className={`${inputBase} resize-none`}
        />
      </div>

      {/* GDPR Consent Checkbox */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className={`w-5 h-5 mt-0.5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
          formData.consent
            ? 'bg-orange-500/20 border-orange-500/40'
            : 'bg-white/[0.04] border-white/10 group-hover:border-white/20'
        }`}>
          {formData.consent && (
            <svg className="w-3 h-3 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <input
          type="checkbox"
          className="sr-only"
          checked={formData.consent}
          onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
        />
        <span className="text-xs sm:text-sm text-gray-400 leading-relaxed">
          I agree to the{' '}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 underline underline-offset-2">
            Privacy Policy
          </a>{' '}
          and{' '}
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 underline underline-offset-2">
            Terms of Service
          </a>
        </span>
      </label>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {error}
        </div>
      )}

      <motion.button
        type="submit"
        disabled={submitting}
        whileHover={{ scale: submitting ? 1 : 1.02 }}
        whileTap={{ scale: submitting ? 1 : 0.98 }}
        className="w-full flex items-center justify-center gap-3 px-8 py-4 sm:py-5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold text-sm sm:text-base shadow-lg shadow-orange-500/20 hover:from-orange-400 hover:to-red-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Sending...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Get My Free Audit
          </>
        )}
      </motion.button>

      <p className="text-xs text-gray-600 text-center flex items-center justify-center gap-1.5">
        <svg className="w-3.5 h-3.5 text-green-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Your data is protected. Unsubscribe anytime with one click.
      </p>
    </form>
  );
}

/* ── FAQ Accordion ── */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      className={`border border-white/5 rounded-2xl mb-3 overflow-hidden transition-colors ${open ? 'bg-white/[0.03]' : 'bg-transparent hover:bg-white/[0.02]'}`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 sm:p-6 text-left gap-4"
      >
        <span className="text-sm sm:text-base font-medium">{q}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <p className="px-5 sm:px-6 pb-5 sm:pb-6 text-sm sm:text-base text-gray-400 leading-relaxed">{a}</p>
      </motion.div>
    </motion.div>
  );
}

/* ── Exit-Intent Popup ── */
function ExitIntentPopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('exit-popup-dismissed');
    if (dismissed) return;

    let timer: NodeJS.Timeout;
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 5) {
        timer = setTimeout(() => setShow(true), 100);
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(timer);
    };
  }, []);

  const dismiss = useCallback(() => {
    setShow(false);
    sessionStorage.setItem('exit-popup-dismissed', 'true');
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onClick={dismiss}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-md w-full bg-gradient-to-br from-gray-900 to-black border border-orange-500/20 rounded-3xl p-8 sm:p-10 text-center"
          >
            <button
              onClick={dismiss}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-2xl font-bold mb-3">Wait — Don&apos;t Leave Empty-Handed</h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Get a free audit of your website. We&apos;ll show you exactly what&apos;s holding you back — no strings attached.
            </p>
            <button
              onClick={() => {
                dismiss();
                document.getElementById('audit')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-semibold hover:from-orange-600 hover:to-red-600 transition-all"
            >
              Get My Free Audit
            </button>
            <p className="text-xs text-gray-600 mt-4">Takes 60 seconds. No spam, ever.</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Social Proof Notification ── */
function SocialProofToast() {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(0);

  const notifications = [
    { name: 'Sarah', location: 'London', action: 'booked a discovery call', time: '2 hours ago' },
    { name: 'Marcus', location: 'New York', action: 'signed up for an audit', time: '4 hours ago' },
    { name: 'Yuki', location: 'Tokyo', action: 'started a project', time: '6 hours ago' },
    { name: 'Elena', location: 'Berlin', action: 'booked a discovery call', time: '8 hours ago' },
    { name: 'James', location: 'Sydney', action: 'requested a proposal', time: '12 hours ago' },
  ];

  useEffect(() => {
    const showTimer = setTimeout(() => {
      setVisible(true);
      const interval = setInterval(() => {
        setVisible(false);
        setTimeout(() => {
          setCurrent((c) => (c + 1) % notifications.length);
          setVisible(true);
        }, 500);
      }, 6000);
      const hideAfter = setTimeout(() => {
        clearInterval(interval);
        setVisible(false);
      }, 30000);
      return () => { clearInterval(interval); clearTimeout(hideAfter); };
    }, 8000);
    return () => clearTimeout(showTimer);
  }, []);

  const n = notifications[current];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 left-6 z-50 max-w-xs"
        >
          <div className="bg-black/90 backdrop-blur-lg border border-white/10 rounded-2xl p-4 flex items-center gap-3 shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-orange-400">{n.name[0]}</span>
            </div>
            <div>
              <p className="text-sm text-white">
                <strong>{n.name}</strong> from {n.location}
              </p>
              <p className="text-xs text-gray-500">{n.action} &middot; {n.time}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ================================================================
 * PITCH VIDEO — Click-to-play video with poster overlay
 * ================================================================ */
function PitchVideo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    // Small delay to ensure the video element is rendered
    setTimeout(() => {
      videoRef.current?.play();
    }, 100);
  }, []);

  return (
    <div className="relative aspect-video rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10">
      {/* Video element (always mounted for preloading poster) */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        src="/videos/pitch.mp4"
        poster="/videos/pitch-poster.jpg"
        playsInline
        controls={isPlaying}
        preload="metadata"
        onEnded={() => setIsPlaying(false)}
      />

      {/* Play overlay — hides once playing */}
      {!isPlaying && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 cursor-pointer bg-black/40"
          onClick={handlePlay}
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center shadow-2xl shadow-orange-500/30"
          >
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </motion.div>
          <p className="text-sm sm:text-base text-white/80 font-medium">Watch how we help brands grow</p>
          <p className="text-xs text-white/40">1 min watch</p>
        </div>
      )}
    </div>
  );
}

/* ================================================================
 * MAIN FUNNEL — Highly visual sales page for /audit
 * ================================================================ */
export function FunnelContent() {
  return (
    <div className="page-transition overflow-hidden">
      <ExitIntentPopup />
      <SocialProofToast />

      {/* ================================================================
       * 1. BANNER — Urgency / announcement bar
       * ================================================================ */}
      <div className="bg-gradient-to-r from-orange-500/10 via-red-500/5 to-orange-500/10 border-b border-orange-500/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center gap-2 text-xs sm:text-sm">
          <span className="inline-block w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          <span className="text-gray-300">
            Limited Availability — Only accepting <strong className="text-orange-400">3 new clients</strong> this month
          </span>
        </div>
      </div>

      {/* ================================================================
       * 2. SOCIAL PROOF BAR — Stats with visual accents
       * ================================================================ */}
      <Section className="py-10 sm:py-12 px-5 border-b border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 text-center">
            {[
              { value: 50, suffix: '+', label: 'Projects Delivered' },
              { value: 40, suffix: '+', label: 'Happy Clients' },
              { value: 5, suffix: '+', label: 'Years Experience' },
              { value: 98, suffix: '%', label: 'Client Satisfaction' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                variants={fadeUp}
              >
                <p className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
                  <Counter target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ================================================================
       * 3. HERO — Bold headline with visual background
       * ================================================================ */}
      <section className="relative py-16 sm:py-20 lg:py-28 px-5 sm:px-6 text-center overflow-hidden">
        {/* Animated background orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-orange-500/[0.04] blur-[120px]"
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-red-500/[0.03] blur-[100px]"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, delay: 2 }}
        />

        <div className="relative z-10 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <Image
              src="/logo.svg"
              alt="Blok Blok Studio"
              width={240}
              height={75}
              className="h-14 sm:h-16 lg:h-20 w-auto mx-auto"
              priority
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs sm:text-sm mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            Digital Agency for Ambitious Brands
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6"
          >
            We Build Digital Experiences That{' '}
            <span className="bg-gradient-to-r from-orange-400 via-red-400 to-orange-400 bg-clip-text text-transparent">
              Drive Revenue
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10"
          >
            Stop losing customers to a mediocre online presence. We design and develop
            high-converting websites, brands, and apps — so you can focus on running your business.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <CTAButton />
            <CTAButton text="See Our Work" variant="secondary" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-xs text-gray-600 mt-6 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Free audit. No commitment required.
          </motion.p>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/10 flex items-start justify-center p-1.5">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-orange-400"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* ================================================================
       * 4. VIDEO SALES LETTER — Pitch video
       * ================================================================ */}
      <Section className="py-8 sm:py-12 px-5 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <PitchVideo />
        </div>
      </Section>

      {/* ================================================================
       * 5. CTA — Mid-page call to action
       * ================================================================ */}
      <Section className="py-12 sm:py-16 px-5 sm:px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <AccentDivider />
          <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-orange-400/60 mb-4 mt-4">We&apos;ve helped 40+ brands grow</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Ready to Transform Your Digital Presence?
          </h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Join the brands that chose to stand out instead of blend in.
          </p>
          <CTAButton />
        </div>
      </Section>

      {/* ================================================================
       * 6. STORY + PROBLEM — Visual narrative section
       * ================================================================ */}
      <Section className="py-20 sm:py-28 lg:py-36 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs mb-6">
                Our Story
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 leading-tight">
                We Started Because We Saw a{' '}
                <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">Problem</span>
              </h2>
              <div className="space-y-4 text-gray-400 text-sm sm:text-base leading-relaxed">
                <p>
                  Too many talented businesses were stuck with generic template websites that
                  didn&apos;t reflect their quality. They were losing customers before they even had
                  a chance to make an impression.
                </p>
                <p>
                  We&apos;ve seen businesses struggle with agencies that overpromise and underdeliver —
                  missed deadlines, bloated costs, and websites that look the same as everyone else&apos;s.
                </p>
                <p className="text-white font-medium">
                  That&apos;s why we built Blok Blok Studio. We believe every brand deserves a digital
                  presence that&apos;s as bold and unique as the people behind it.
                </p>
              </div>
            </div>

            {/* Visual problem cards with colored accents */}
            <div className="space-y-4">
              {[
                { icon: '😤', problem: 'Your website looks like every other template site in your industry', color: 'border-l-red-500/40' },
                { icon: '📉', problem: 'Visitors leave within seconds because your site doesn\'t build trust', color: 'border-l-orange-500/40' },
                { icon: '⏰', problem: 'Your last agency missed deadlines and went over budget', color: 'border-l-yellow-500/40' },
                { icon: '🤷', problem: 'You\'re not sure how to turn website traffic into actual customers', color: 'border-l-amber-500/40' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  variants={fadeUp}
                  className={`bg-white/[0.03] border border-white/5 border-l-4 ${item.color} rounded-xl sm:rounded-2xl p-5 sm:p-6 flex items-start gap-4 hover:bg-white/[0.05] transition-colors`}
                >
                  <span className="text-2xl sm:text-3xl flex-shrink-0">{item.icon}</span>
                  <p className="text-sm sm:text-base text-gray-300">{item.problem}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ================================================================
       * 7. SOCIAL PROOF — Trusted by Brands That Dare to Stand Out
       * ================================================================ */}
      <section className="py-20 sm:py-28 px-5 sm:px-6 relative overflow-hidden">
        {/* Background accent */}
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/[0.02] via-transparent to-transparent" />

        <div className="max-w-6xl mx-auto relative z-10">
          <Section>
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs mb-6">
                Our Portfolio
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-4">
              Trusted by Brands That{' '}
              <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                Dare to Stand Out
              </span>
            </h2>
            <p className="text-center text-gray-500 text-sm mb-12 sm:mb-16 max-w-2xl mx-auto">
              From startups to established brands, we build digital experiences that drive real results across industries
            </p>
          </Section>

          {/* Brand showcase grid — 3x2 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
            {trustedBrands.map((brand, i) => (
              <motion.div
                key={brand.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                variants={scaleUp}
                className="group relative aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden border border-white/5 hover:border-orange-500/20 transition-all duration-500"
              >
                {/* Project screenshot */}
                <Image
                  src={brand.image}
                  alt={brand.name}
                  fill
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 640px) 50vw, 33vw"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

                {/* Brand info at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                  <p className="text-xs text-orange-400/80 mb-1">{brand.category}</p>
                  <h3 className="text-sm sm:text-base font-semibold text-white">{brand.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">{brand.url}</p>
                </div>

                {/* Hover arrow */}
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/5 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-white/10">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
                  </svg>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <CTAButton text="Join These Brands — Get Your Free Audit" />
          </div>
        </div>
      </section>

      {/* ================================================================
       * 8. TRANSFORMATION — Visual before/after
       * ================================================================ */}
      <Section className="py-20 sm:py-28 lg:py-36 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 sm:mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs mb-6">
              The Transformation
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              From Invisible to{' '}
              <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">Unforgettable</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Before */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} transition={{ duration: 0.5 }}
              className="relative rounded-2xl sm:rounded-3xl p-8 sm:p-10 bg-gradient-to-br from-red-500/[0.06] to-transparent border border-red-500/10 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl" />
              <div className="flex items-center gap-3 mb-8 relative z-10">
                <div className="w-4 h-4 rounded-full bg-red-500/60 shadow-lg shadow-red-500/20" />
                <p className="text-sm font-bold text-red-400/80 uppercase tracking-wider">Before</p>
              </div>
              <ul className="space-y-5 relative z-10">
                {['Generic template website', 'Slow load times', 'No clear call to action', 'Poor mobile experience', 'Low search rankings', 'Zero brand consistency'].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm sm:text-base text-gray-400">
                    <svg className="w-5 h-5 flex-shrink-0 text-red-500/60 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* After */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} transition={{ duration: 0.5, delay: 0.15 }}
              className="relative rounded-2xl sm:rounded-3xl p-8 sm:p-10 bg-gradient-to-br from-green-500/[0.06] to-transparent border border-green-500/10 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl" />
              <div className="flex items-center gap-3 mb-8 relative z-10">
                <div className="w-4 h-4 rounded-full bg-green-500/60 shadow-lg shadow-green-500/20" />
                <p className="text-sm font-bold text-green-400/80 uppercase tracking-wider">After</p>
              </div>
              <ul className="space-y-5 relative z-10">
                {['Custom design that stands out', 'Sub-2-second load times', 'Strategic CTAs driving conversions', 'Pixel-perfect on every device', 'SEO-optimized for top rankings', 'Cohesive brand everywhere'].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm sm:text-base text-gray-300">
                    <svg className="w-5 h-5 flex-shrink-0 text-green-500/60 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* ================================================================
       * 9. BENEFITS — Visual cards with colored gradients
       * ================================================================ */}
      <section className="py-20 sm:py-28 px-5 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/[0.01] to-transparent" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-14 sm:mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs mb-6">
              Why Choose Us
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Built Different. Built Better.
            </h2>
          </div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
          >
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className={`relative rounded-2xl sm:rounded-3xl p-6 sm:p-8 bg-gradient-to-br ${b.color} border border-white/5 overflow-hidden group hover:border-white/10 transition-colors`}
              >
                <span className="text-3xl sm:text-4xl mb-5 block">{b.icon}</span>
                <h3 className="text-base sm:text-lg font-semibold mb-2">{b.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================================================================
       * 10. ROADMAP — Alternating zigzag layout with SVG illustrations
       * ================================================================ */}
      <section className="py-20 sm:py-28 lg:py-36 px-5 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/[0.015] to-transparent" />
        <div className="max-w-6xl mx-auto relative z-10">
          <Section>
            <div className="text-center mb-14 sm:mb-20">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs mb-6">
                Our Process
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                From First Call to{' '}
                <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">Launch Day</span>
              </h2>
              <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto mt-6">
                A simple, transparent 5-step process designed to get you results — fast.
              </p>
            </div>
          </Section>

          {/* Timeline with alternating steps */}
          <div className="relative">
            {/* Center vertical timeline line — hidden on mobile */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2">
              <div className="h-full bg-gradient-to-b from-orange-500/30 via-orange-500/10 to-transparent" />
            </div>

            {/* Mobile left-side timeline line */}
            <div className="lg:hidden absolute left-5 top-0 bottom-0 w-px">
              <div className="h-full bg-gradient-to-b from-orange-500/30 via-orange-500/10 to-transparent" />
            </div>

            <div className="space-y-12 lg:space-y-20">
              {roadmapSteps.map((step, i) => {
                const isEven = i % 2 === 0;
                return (
                  <motion.div
                    key={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    variants={fadeUp}
                    className="relative"
                  >
                    {/* Step number circle on timeline — desktop (centered) */}
                    <div className="hidden lg:flex absolute left-1/2 top-8 -translate-x-1/2 z-20">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20 border-4 border-black">
                        <span className="text-sm font-bold text-white">{step.num}</span>
                      </div>
                    </div>

                    {/* Step number circle — mobile (left side) */}
                    <div className="lg:hidden absolute left-0 top-0 z-20">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20 border-[3px] border-black">
                        <span className="text-xs font-bold text-white">{step.num}</span>
                      </div>
                    </div>

                    {/* Desktop: Alternating layout */}
                    <div className={`hidden lg:grid lg:grid-cols-2 lg:gap-16 items-center ${isEven ? '' : ''}`}>
                      {/* Illustration side */}
                      <div className={`${isEven ? 'lg:order-1 lg:pr-12' : 'lg:order-2 lg:pl-12'}`}>
                        <motion.div
                          initial="hidden"
                          whileInView="visible"
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                          variants={scaleUp}
                          className="relative aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-white/[0.02] to-white/[0.005] border border-white/5 p-6 flex items-center justify-center group hover:border-orange-500/10 transition-colors"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <StepIllustration step={step.num} />
                        </motion.div>
                      </div>

                      {/* Text side */}
                      <div className={`${isEven ? 'lg:order-2 lg:pl-12' : 'lg:order-1 lg:pr-12 lg:text-right'}`}>
                        <div className={`flex items-center gap-3 mb-3 flex-wrap ${isEven ? '' : 'lg:justify-end'}`}>
                          <span className="text-xs font-bold text-orange-400/70 uppercase tracking-wider">Step {step.num}</span>
                          <span className="text-xs px-3 py-1 rounded-full bg-orange-500/10 text-orange-400/60 border border-orange-500/10">{step.duration}</span>
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-bold mb-4">{step.title}</h3>
                        <p className="text-base text-gray-400 leading-relaxed max-w-md">{step.desc}</p>
                      </div>
                    </div>

                    {/* Mobile: Stacked layout with left offset */}
                    <div className="lg:hidden pl-14">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <span className="text-xs font-bold text-orange-400/70 uppercase tracking-wider">Step {step.num}</span>
                        <span className="text-xs px-3 py-1 rounded-full bg-orange-500/10 text-orange-400/60 border border-orange-500/10">{step.duration}</span>
                      </div>
                      <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                      <p className="text-sm text-gray-400 leading-relaxed mb-5">{step.desc}</p>
                      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-white/[0.02] to-white/[0.005] border border-white/5 p-4 flex items-center justify-center">
                        <StepIllustration step={step.num} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="text-center mt-16">
            <CTAButton text="Start With Step 1 — Get Your Free Audit" />
          </div>
        </div>
      </section>

      {/* ================================================================
       * 11. SERVICE MODULAR BREAKDOWN — Visual module cards
       * ================================================================ */}
      <section className="py-20 sm:py-28 px-5 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/[0.015] to-transparent" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-14 sm:mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs mb-6">
              What We Offer
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              End-to-End Digital Solutions
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto mt-6">
              Everything you need under one roof — from brand strategy to final deployment.
            </p>
          </div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {serviceModules.map((mod, i) => (
              <motion.div key={i} variants={fadeUp} transition={{ duration: 0.5 }}
                className="rounded-2xl sm:rounded-3xl p-6 sm:p-8 bg-white/[0.02] border border-white/5 hover:border-orange-500/10 transition-colors">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl">{mod.icon}</span>
                  <h3 className="text-lg sm:text-xl font-semibold">{mod.title}</h3>
                </div>
                <ul className="space-y-3">
                  {mod.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm sm:text-base text-gray-400">
                      <svg className="w-4 h-4 flex-shrink-0 text-orange-500/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================================================================
       * 12. SOCIAL PROOF — Project showcase with visual stats
       *
       * TODO: Replace gradient backgrounds with real project screenshots.
       * Use <Image src="/projects/name.jpg" fill className="object-cover" />
       * ================================================================ */}
      <Section className="py-20 sm:py-28 lg:py-36 px-5 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 sm:mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs mb-6">
              Our Work
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Real Results, Real Projects
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {projectShowcase.map((project, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                variants={scaleUp}
                className="group relative aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer"
              >
                {/* Real project screenshot */}
                <Image
                  src={project.image}
                  alt={project.label}
                  fill
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Stats overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                  <p className="text-xs text-gray-400 mb-1">{project.label}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold text-white">{project.stat}</span>
                    <span className="text-sm text-gray-400">{project.metric}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{project.url}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ================================================================
       * 13. WHAT'S INCLUDED — Visual checklist with icons
       * ================================================================ */}
      <section className="py-20 sm:py-28 px-5 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/[0.02] via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-14 sm:mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs mb-6">
              Everything You Get
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              What&apos;s Included
            </h2>
          </div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-3xl mx-auto">
            {included.map((item, i) => (
              <motion.div key={i} variants={fadeUp} transition={{ duration: 0.4 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-orange-500/10 transition-colors">
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <span className="text-sm sm:text-base text-gray-300">{item.item}</span>
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center mt-12">
            <CTAButton text="Get All This — Claim Your Free Audit" />
          </div>
        </div>
      </section>

      {/* ================================================================
       * 14. FREE AUDIT — Lead capture form
       * Connected to /api/audit → Prisma DB + Email + Telegram notifications
       * ================================================================ */}
      <section id="audit" className="scroll-mt-8 py-20 sm:py-28 lg:py-36 px-5 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/[0.03] via-red-500/[0.015] to-transparent" />
        <motion.div
          className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full bg-orange-500/[0.03] blur-[120px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity }}
        />

        <div className="max-w-5xl mx-auto relative z-10">
          <Section>
            <div className="text-center mb-14 sm:mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs mb-6">
                100% Free — No Strings Attached
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                Get Your Free{' '}
                <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">Website Audit</span>
              </h2>
              <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
                Tell us about your business and we&apos;ll send you a personalized audit with actionable insights — within 24 hours.
              </p>
            </div>
          </Section>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14">
            {/* Form — takes 3 columns */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              transition={{ duration: 0.5 }} variants={fadeUp}
              className="lg:col-span-3 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 bg-white/[0.02] border border-white/5"
            >
              <AuditForm />
            </motion.div>

            {/* Benefits sidebar — takes 2 columns */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }} variants={fadeUp}
              className="lg:col-span-2"
            >
              <div className="sticky top-8">
                <h3 className="text-lg sm:text-xl font-semibold mb-6">What You&apos;ll Get:</h3>
                <ul className="space-y-4 mb-8">
                  {auditBenefits.map((benefit, i) => (
                    <motion.li
                      key={i}
                      initial="hidden" whileInView="visible" viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                      variants={fadeUp}
                      className="flex items-start gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3.5 h-3.5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm sm:text-base text-gray-300">{benefit}</span>
                    </motion.li>
                  ))}
                </ul>

                {/* Social proof mini */}
                <div className="rounded-2xl p-5 sm:p-6 bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, j) => (
                      <svg key={j} className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed mb-3">
                    &ldquo;The audit alone was worth more than what other agencies charged us for a full consultation. Incredible value.&rdquo;
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/10 flex items-center justify-center border border-orange-500/10">
                      <span className="text-[10px] font-medium text-orange-400/80">LT</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium">Lisa Tran</p>
                      <p className="text-[10px] text-gray-500">Founder, Luma Beauty</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================================================================
       * 15. WHO IT'S FOR — Visual comparison
       * ================================================================ */}
      <section className="py-20 sm:py-28 px-5 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/[0.01] to-transparent" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-14 sm:mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs mb-6">
              Is This For You?
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Who We Work With
            </h2>
          </div>

          <div className="rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 bg-white/[0.02] border border-white/5">
            <div className="space-y-3">
              {idealFor.map((item, i) => (
                <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }} variants={fadeUp}
                  className={`flex items-center gap-4 p-3 sm:p-4 rounded-xl ${item.yes ? 'bg-green-500/[0.03] border border-green-500/5' : 'bg-red-500/[0.03] border border-red-500/5'}`}>
                  {item.yes ? (
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-red-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                  <span className={`text-sm sm:text-base ${item.yes ? 'text-gray-300' : 'text-gray-500'}`}>
                    {item.text}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
       * 16. SOCIAL PROOF — More testimonials with stats
       * ================================================================ */}
      <Section className="py-20 sm:py-28 lg:py-36 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 sm:mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs mb-6">
              Testimonials
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Trusted by Brands That{' '}
              <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">Dare to Stand Out</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {moreTestimonials.map((t, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }} variants={fadeUp}
                className="rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col bg-white/[0.02] border border-white/5 hover:border-orange-500/10 transition-colors">
                {/* Stat badge */}
                <div className="inline-flex self-start items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-semibold mb-5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  {t.stat}
                </div>

                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-6 flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/10 flex items-center justify-center flex-shrink-0 border border-orange-500/10">
                    <span className="text-xs font-medium text-orange-400/80">{t.initials}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ================================================================
       * 17. COMPARISON TABLE — DIY vs Freelancer vs Blok Blok
       * ================================================================ */}
      <section className="py-20 sm:py-28 px-5 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent" />
        <div className="max-w-4xl mx-auto relative z-10">
          <Section>
            <div className="text-center mb-14 sm:mb-20">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs mb-6">
                Compare
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                Why Choose Us?
              </h2>
              <p className="text-gray-400 mt-4 max-w-lg mx-auto">See how we stack up against the alternatives.</p>
            </div>
          </Section>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 pr-4 text-gray-500 font-normal w-1/4" />
                  <th className="py-4 px-4 text-center text-gray-400 font-medium">DIY / Templates</th>
                  <th className="py-4 px-4 text-center text-gray-400 font-medium">Freelancer</th>
                  <th className="py-4 px-4 text-center font-semibold">
                    <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">Blok Blok Studio</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Custom Design', diy: false, freelancer: true, us: true },
                  { feature: 'SEO Optimization', diy: false, freelancer: false, us: true },
                  { feature: 'Mobile-First', diy: false, freelancer: true, us: true },
                  { feature: 'Conversion Strategy', diy: false, freelancer: false, us: true },
                  { feature: 'Ongoing Support', diy: false, freelancer: false, us: true },
                  { feature: 'Brand Strategy', diy: false, freelancer: false, us: true },
                  { feature: 'Fast Turnaround', diy: true, freelancer: false, us: true },
                  { feature: 'Scalable Code', diy: false, freelancer: false, us: true },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-3.5 pr-4 text-gray-300 font-medium">{row.feature}</td>
                    <td className="py-3.5 px-4 text-center">
                      {row.diy ? (
                        <span className="text-yellow-500">~</span>
                      ) : (
                        <svg className="w-5 h-5 text-gray-700 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {row.freelancer ? (
                        <svg className="w-5 h-5 text-yellow-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-700 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <svg className="w-5 h-5 text-green-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ================================================================
       * 18. FAQ & OBJECTION HANDLING
       * ================================================================ */}
      <section className="py-20 sm:py-28 px-5 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/[0.01] to-transparent" />
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="text-center mb-14 sm:mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs mb-6">
              FAQ
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Got Questions?
            </h2>
            <p className="text-gray-400 mt-4">Everything you need to know before getting started.</p>
          </div>

          {faqs.map((faq, i) => (
            <FAQItem key={i} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>

      {/* ================================================================
       * FINAL CTA — Get Your Free Audit
       * ================================================================ */}
      <section className="py-20 sm:py-28 lg:py-36 px-5 sm:px-6">
        <Section>
          <div className="max-w-3xl mx-auto text-center">
            <div className="relative overflow-hidden rounded-2xl sm:rounded-[2.5rem] p-10 sm:p-14 md:p-20 border border-orange-500/10">
              {/* Rich gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.08] via-red-500/[0.04] to-transparent" />
              <motion.div
                className="absolute top-0 right-0 w-80 h-80 rounded-full bg-orange-500/[0.05] blur-[100px]"
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 8, repeat: Infinity }}
              />
              <motion.div
                className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-red-500/[0.03] blur-[80px]"
                animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 10, repeat: Infinity }}
              />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs mb-6">
                  Let&apos;s Go
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 leading-tight">
                  Your Brand Deserves Better
                </h2>
                <p className="text-gray-400 text-base sm:text-lg max-w-lg mx-auto mb-10">
                  Get a free, personalized audit of your digital presence. No commitment — just actionable insights you can use right away.
                </p>

                <CTAButton text="Get Your Free Audit Now" />

                <p className="text-xs text-gray-600 mt-6 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Takes 60 seconds. Delivered to your inbox within 24 hours.
                </p>
              </div>
            </div>
          </div>
        </Section>
      </section>

      {/* ── Minimal footer ── */}
      <footer className="py-8 px-5 text-center border-t border-white/5">
        <p className="text-xs text-gray-600">
          &copy; {new Date().getFullYear()} Blok Blok Studio. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
