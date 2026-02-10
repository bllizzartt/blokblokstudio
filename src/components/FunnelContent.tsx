'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';

/* ── Animation helpers ── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
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
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      variants={fadeUp}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ── Data ── */
const services = [
  {
    icon: '🌐',
    title: 'Web Design & Development',
    desc: 'Custom-built websites and web apps that convert visitors into loyal customers.',
  },
  {
    icon: '🎨',
    title: 'Brand Identity & Strategy',
    desc: 'Complete brand systems — logo, color, typography, voice — that make you unforgettable.',
  },
  {
    icon: '📱',
    title: 'App Development',
    desc: 'Native and cross-platform mobile apps built for speed and engagement.',
  },
  {
    icon: '📈',
    title: 'Digital Marketing & SEO',
    desc: 'Data-driven campaigns and SEO strategies that put you in front of the right people.',
  },
  {
    icon: '🎬',
    title: 'Motion & Video',
    desc: 'Scroll animations, promo videos, and motion graphics that bring your brand to life.',
  },
  {
    icon: '⚡',
    title: 'Automation & AI',
    desc: 'Smart workflows and AI integrations that save you time and scale your operations.',
  },
];

const roadmapSteps = [
  {
    num: '01',
    title: 'Discovery Call',
    desc: 'A quick 15-minute call to understand your goals, audience, and vision.',
    duration: '15 min',
  },
  {
    num: '02',
    title: 'Strategy & Proposal',
    desc: 'We build a tailored plan with clear deliverables, timeline, and transparent pricing.',
    duration: '2–3 days',
  },
  {
    num: '03',
    title: 'Design Phase',
    desc: 'Wireframes, mockups, and revisions until the design feels perfect for your brand.',
    duration: '1–2 weeks',
  },
  {
    num: '04',
    title: 'Development & Build',
    desc: 'We bring the design to life with clean, fast code and regular check-ins.',
    duration: '2–4 weeks',
  },
  {
    num: '05',
    title: 'Launch & Support',
    desc: 'We launch your project and provide ongoing support to ensure long-term success.',
    duration: 'Ongoing',
  },
];

const testimonials = [
  {
    quote: 'Blok Blok Studio transformed our entire digital presence. Their creative vision and attention to detail exceeded every expectation we had.',
    name: 'Sarah Chen',
    role: 'CEO, Zenith Finance',
    initials: 'SC',
  },
  {
    quote: 'Working with this team felt like a true partnership. They understood our brand instantly and delivered a website that perfectly represents who we are.',
    name: 'Marcus Rivera',
    role: 'Founder, Aura Wellness',
    initials: 'MR',
  },
  {
    quote: 'The results speak for themselves — 300% increase in conversions within three months of our new site going live. Incredible work from start to finish.',
    name: 'Emily Park',
    role: 'Marketing Director, Horizon Travel',
    initials: 'EP',
  },
];

const videoTestimonials = [
  {
    quote: 'They completely changed how our customers experience our brand online. The ROI has been unreal.',
    name: 'David Kim',
    role: 'CTO, NovaPay',
    initials: 'DK',
  },
  {
    quote: 'From concept to launch in under a month. The speed and quality blew us away.',
    name: 'Lisa Tran',
    role: 'Founder, Luma Beauty',
    initials: 'LT',
  },
  {
    quote: 'We tried three agencies before finding Blok Blok. The difference is night and day.',
    name: 'Jake Morrison',
    role: 'CEO, Altitude Sports',
    initials: 'JM',
  },
];

const benefits = [
  {
    title: 'Custom Design, Not Templates',
    desc: 'Every project is designed from scratch to match your unique brand and goals.',
  },
  {
    title: 'Lightning-Fast Performance',
    desc: 'We build with modern frameworks for sites that load in under 2 seconds.',
  },
  {
    title: 'SEO-Optimized From Day One',
    desc: 'Your site is structured and coded for maximum search engine visibility.',
  },
  {
    title: 'Mobile-First Approach',
    desc: 'Pixel-perfect experiences across every device, from phones to ultrawide monitors.',
  },
  {
    title: 'Conversion-Focused',
    desc: 'Strategic layouts and CTAs designed to turn visitors into paying customers.',
  },
  {
    title: 'Ongoing Support & Maintenance',
    desc: 'We don\'t disappear after launch. Get continued support whenever you need it.',
  },
];

const serviceModules = [
  {
    title: 'Brand Foundation',
    items: ['Logo & Visual Identity', 'Brand Guidelines', 'Color & Typography System', 'Brand Voice & Messaging'],
  },
  {
    title: 'Web Presence',
    items: ['Custom Website Design', 'Responsive Development', 'CMS Integration', 'Performance Optimization'],
  },
  {
    title: 'Growth Engine',
    items: ['SEO Strategy & Execution', 'Content Marketing', 'Social Media Strategy', 'Analytics & Reporting'],
  },
  {
    title: 'Digital Products',
    items: ['Mobile App Development', 'Web Applications', 'E-commerce Solutions', 'API & Integrations'],
  },
];

const included = [
  'Dedicated project manager',
  'Unlimited design revisions',
  'Mobile-responsive design',
  'SEO-optimized code',
  'Analytics dashboard setup',
  'Content management system',
  '90-day post-launch support',
  'Performance monitoring',
  'SSL certificate & security setup',
  'Social media integration',
];

const pricingPlans = [
  {
    name: 'Starter',
    price: '$2,500',
    desc: 'Perfect for small businesses and startups who need a strong foundation.',
    features: [
      'Custom landing page',
      'Mobile responsive design',
      'Basic SEO setup',
      'Contact form integration',
      '30-day support',
    ],
    cta: 'Get Started',
    featured: false,
  },
  {
    name: 'Growth',
    price: '$5,000',
    desc: 'For brands ready to level up their digital presence and start converting.',
    features: [
      'Multi-page website (up to 8)',
      'Custom brand identity',
      'Advanced SEO strategy',
      'CMS integration',
      'Analytics dashboard',
      '60-day support',
    ],
    cta: 'Most Popular',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    desc: 'Full-scale digital transformation for established businesses.',
    features: [
      'Unlimited pages & features',
      'Complete brand overhaul',
      'Web & mobile app development',
      'Marketing automation',
      'Dedicated team',
      '90-day priority support',
    ],
    cta: 'Let\'s Talk',
    featured: false,
  },
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
  {
    q: 'How long does a typical project take?',
    a: 'Most projects are completed in 3–6 weeks depending on scope. A simple landing page can be done in under a week, while a full brand + website package typically takes 4–6 weeks.',
  },
  {
    q: 'What if I don\'t like the design?',
    a: 'We offer unlimited design revisions. We work closely with you throughout the process and won\'t move to development until you\'re 100% happy with the design.',
  },
  {
    q: 'Do I need to have my content ready?',
    a: 'Not necessarily. We can work with rough ideas and help refine your messaging. For an additional fee, we also offer professional copywriting services.',
  },
  {
    q: 'Can I update the website myself after launch?',
    a: 'Absolutely. We build with user-friendly CMS platforms so you can easily update content, images, and pages without any coding knowledge.',
  },
  {
    q: 'What\'s included in post-launch support?',
    a: 'Our support includes bug fixes, minor content updates, performance monitoring, security updates, and priority access to our team via email or Slack.',
  },
  {
    q: 'Do you work with clients outside the US?',
    a: 'Yes! We work with clients worldwide. Our process is fully remote with regular video check-ins to keep everything on track regardless of timezone.',
  },
  {
    q: 'What if I just want to chat first before committing?',
    a: 'That\'s exactly what the free 15-minute call is for. Zero pressure, zero commitment — just a conversation about your goals and how we might help.',
  },
];

/* ── Calendly CTA button (reusable) ── */
/*
 * TODO: Replace href="#book" with your Calendly URL:
 * href="https://calendly.com/your-username/15min"
 */
function CTAButton({ text = 'Book Your Free 15-Min Call', className = '' }: { text?: string; className?: string }) {
  return (
    <motion.a
      href="#book"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className={`inline-flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-5 rounded-full bg-white text-black font-semibold text-sm sm:text-base hover:bg-gray-100 transition-colors ${className}`}
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      {text}
    </motion.a>
  );
}

/* ── FAQ Accordion Item ── */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 sm:py-6 text-left gap-4"
      >
        <span className="text-sm sm:text-base font-medium">{q}</span>
        <motion.svg
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-5 h-5 flex-shrink-0 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </motion.svg>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <p className="pb-5 sm:pb-6 text-sm sm:text-base text-gray-400 leading-relaxed">{a}</p>
      </motion.div>
    </div>
  );
}

/* ================================================================
 * MAIN FUNNEL COMPONENT
 *
 * Layout follows the funnel structure:
 * 1.  Banner (top bar)
 * 2.  Social Proof (logos / stats bar)
 * 3.  Hero Section
 * 4.  Video Sales Letter
 * 5.  CTA
 * 6.  Story + Problem
 * 7.  Social Proof — Video + Quote excerpts
 * 8.  Transformation
 * 9.  Benefits
 * 10. Roadmap
 * 11. Service Modular Breakdown
 * 12. Social Proof — Real Screenshots
 * 13. What's Included
 * 14. Pricing Plans
 * 15. Who It's For + Comparison
 * 16. Social Proof — More Testimonials
 * 17. FAQ & Objection Handling
 * + Final CTA + Minimal Footer
 * ================================================================ */
export function FunnelContent() {
  return (
    <div className="page-transition">

      {/* ================================================================
       * 1. BANNER — Top announcement bar
       * ================================================================ */}
      <div className="bg-white/[0.04] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center gap-2 text-xs sm:text-sm">
          <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-gray-300">
            Limited Availability — Only accepting <strong className="text-white">3 new clients</strong> this month
          </span>
        </div>
      </div>

      {/* ================================================================
       * 2. SOCIAL PROOF — Trust badges / stats bar
       * ================================================================ */}
      <Section className="py-8 sm:py-10 px-5 border-b border-white/5">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-gray-500 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-lg sm:text-xl">50+</span>
            <span>Projects Delivered</span>
          </div>
          <div className="w-px h-4 bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-lg sm:text-xl">40+</span>
            <span>Happy Clients</span>
          </div>
          <div className="w-px h-4 bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-lg sm:text-xl">5+</span>
            <span>Years Experience</span>
          </div>
          <div className="w-px h-4 bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-2">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="ml-1">5.0 Average Rating</span>
          </div>
        </div>
      </Section>

      {/* ================================================================
       * 3. HERO SECTION
       * ================================================================ */}
      <section className="relative py-20 sm:py-28 lg:py-36 px-5 sm:px-6 text-center overflow-hidden">
        {/* Background glow */}
        <motion.div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-white/[0.02] blur-[100px]"
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-10"
          >
            <Image
              src="/logo.svg"
              alt="Blok Blok Studio"
              width={160}
              height={50}
              className="h-10 sm:h-12 w-auto mx-auto"
              priority
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gray-500 mb-6"
          >
            Digital Agency for Ambitious Brands
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6"
          >
            We Build Digital Experiences That{' '}
            <span className="gradient-text">Drive Revenue</span>
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
          >
            <CTAButton />
            <p className="text-xs text-gray-600 mt-4">Free 15-min call. No commitment required.</p>
          </motion.div>
        </div>
      </section>

      {/* ================================================================
       * 4. VIDEO SALES LETTER
       *
       * TODO: Replace the placeholder with an actual video embed.
       * Swap the div below with an <iframe> or <video> element.
       * Example: <iframe src="https://www.youtube.com/embed/VIDEO_ID" .../>
       * ================================================================ */}
      <Section className="py-16 sm:py-20 px-5 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative aspect-video rounded-2xl sm:rounded-3xl overflow-hidden bg-white/[0.03] border border-white/10">
            {/* Placeholder — replace with your video */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors">
                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">Watch how we help brands grow</p>
            </div>
          </div>
        </div>
      </Section>

      {/* ================================================================
       * 5. CTA — Primary call to action
       * ================================================================ */}
      <Section className="py-10 sm:py-14 px-5 sm:px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Ready to Transform Your Digital Presence?
          </h2>
          <p className="text-gray-400 mb-8">
            Join 40+ brands that chose to stand out instead of blend in.
          </p>
          <CTAButton />
        </div>
      </Section>

      {/* ================================================================
       * 6. STORY + PROBLEM SECTION
       * ================================================================ */}
      <Section className="py-20 sm:py-28 lg:py-36 px-5 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Story side */}
            <div>
              <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gray-500 mb-6">Our Story</p>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6 leading-tight">
                We Started Because We Saw a <span className="gradient-text">Problem</span>
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
                <p>
                  That&apos;s why we built Blok Blok Studio. We believe every brand deserves a digital
                  presence that&apos;s as bold and unique as the people behind it.
                </p>
              </div>
            </div>

            {/* Problem cards */}
            <div className="space-y-4">
              {[
                { icon: '😤', problem: 'Your website looks like every other template site in your industry' },
                { icon: '📉', problem: 'Visitors leave within seconds because your site doesn\'t build trust' },
                { icon: '⏰', problem: 'Your last agency missed deadlines and went over budget' },
                { icon: '🤷', problem: 'You\'re not sure how to turn website traffic into actual customers' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  variants={fadeUp}
                  className="glass-card rounded-xl sm:rounded-2xl p-5 sm:p-6 flex items-start gap-4"
                >
                  <span className="text-2xl flex-shrink-0">{item.icon}</span>
                  <p className="text-sm sm:text-base text-gray-300">{item.problem}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ================================================================
       * 7. SOCIAL PROOF — Video + Quote Excerpts
       *
       * TODO: Replace placeholder circles with actual video thumbnails.
       * Use <Image> or <video> elements for real testimonial videos.
       * ================================================================ */}
      <Section className="py-20 sm:py-28 px-5 sm:px-6 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 sm:mb-20">
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gray-500 mb-6">Client Stories</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Don&apos;t Take Our Word for It
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videoTestimonials.map((t, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                variants={fadeUp}
                className="glass-card rounded-2xl sm:rounded-3xl overflow-hidden"
              >
                {/* Video placeholder */}
                <div className="aspect-video bg-white/[0.03] flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                <div className="p-5 sm:p-6">
                  <p className="text-sm text-gray-300 leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-white/60">{t.initials}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ================================================================
       * 8. TRANSFORMATION — Before vs After
       * ================================================================ */}
      <Section className="py-20 sm:py-28 lg:py-36 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 sm:mb-20">
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gray-500 mb-6">The Transformation</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              From Invisible to <span className="gradient-text">Unforgettable</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Before */}
            <div className="glass-card rounded-2xl sm:rounded-3xl p-8 sm:p-10 border-red-500/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <p className="text-sm font-medium text-red-400/80 uppercase tracking-wider">Before</p>
              </div>
              <ul className="space-y-4">
                {[
                  'Generic template website that blends in',
                  'Slow load times losing visitors',
                  'No clear call to action',
                  'Poor mobile experience',
                  'Low search engine rankings',
                  'Zero brand consistency',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm sm:text-base text-gray-400">
                    <svg className="w-5 h-5 flex-shrink-0 text-red-500/60 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* After */}
            <div className="glass-card rounded-2xl sm:rounded-3xl p-8 sm:p-10 border-green-500/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <p className="text-sm font-medium text-green-400/80 uppercase tracking-wider">After</p>
              </div>
              <ul className="space-y-4">
                {[
                  'Custom design that stands out instantly',
                  'Sub-2-second load times',
                  'Strategic CTAs driving conversions',
                  'Pixel-perfect on every device',
                  'SEO-optimized for top rankings',
                  'Cohesive brand across every touchpoint',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm sm:text-base text-gray-300">
                    <svg className="w-5 h-5 flex-shrink-0 text-green-500/60 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* ================================================================
       * 9. BENEFITS
       * ================================================================ */}
      <Section className="py-20 sm:py-28 px-5 sm:px-6 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 sm:mb-20">
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gray-500 mb-6">Why Choose Us</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Built Different. Built Better.
            </h2>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-5">
                  <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-semibold mb-2">{b.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ================================================================
       * 10. ROADMAP — Step-by-step process timeline
       * ================================================================ */}
      <Section className="py-20 sm:py-28 lg:py-36 px-5 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14 sm:mb-20">
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gray-500 mb-6">Our Process</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              From First Call to <span className="gradient-text">Launch Day</span>
            </h2>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-px bg-white/10 hidden sm:block" />

            <div className="space-y-8 sm:space-y-12">
              {roadmapSteps.map((step, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  variants={fadeUp}
                  className="flex gap-5 sm:gap-8 items-start"
                >
                  <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative z-10">
                    <span className="text-sm sm:text-base font-bold text-white/60">{step.num}</span>
                  </div>
                  <div className="pt-1 sm:pt-3">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg sm:text-xl font-semibold">{step.title}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-500">{step.duration}</span>
                    </div>
                    <p className="text-sm sm:text-base text-gray-400 leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ================================================================
       * 11. SERVICE MODULAR BREAKDOWN
       * ================================================================ */}
      <Section className="py-20 sm:py-28 px-5 sm:px-6 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 sm:mb-20">
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gray-500 mb-6">What We Offer</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              End-to-End Digital Solutions
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto mt-6">
              Everything you need under one roof — from brand strategy to final deployment.
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
          >
            {serviceModules.map((mod, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8"
              >
                <h3 className="text-lg sm:text-xl font-semibold mb-5">{mod.title}</h3>
                <ul className="space-y-3">
                  {mod.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm sm:text-base text-gray-400">
                      <svg className="w-4 h-4 flex-shrink-0 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      </Section>

      {/* ================================================================
       * 12. SOCIAL PROOF — Real Screenshots
       *
       * TODO: Replace placeholders with actual project screenshots.
       * Use <Image src="/projects/screenshot.png" ... /> for real images.
       * ================================================================ */}
      <Section className="py-20 sm:py-28 lg:py-36 px-5 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 sm:mb-20">
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gray-500 mb-6">Our Work</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Real Results, Real Projects
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { label: 'E-Commerce Redesign', stat: '+240% Conversions' },
              { label: 'SaaS Landing Page', stat: '+180% Sign-ups' },
              { label: 'Brand Identity', stat: '10x Brand Recognition' },
              { label: 'Mobile App', stat: '50K+ Downloads' },
              { label: 'Restaurant Website', stat: '+300% Online Orders' },
              { label: 'Portfolio Site', stat: '3x Client Inquiries' },
            ].map((project, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                variants={fadeUp}
                className="group relative aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden bg-white/[0.03] border border-white/5"
              >
                {/* Placeholder — replace with real screenshot via <Image> */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium mb-1">{project.label}</p>
                  <p className="text-xs text-green-400/80">{project.stat}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ================================================================
       * 13. WHAT'S INCLUDED
       * ================================================================ */}
      <Section className="py-20 sm:py-28 px-5 sm:px-6 bg-white/[0.01]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14 sm:mb-20">
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gray-500 mb-6">Everything You Get</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              What&apos;s Included
            </h2>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 max-w-2xl mx-auto"
          >
            {included.map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                transition={{ duration: 0.4 }}
                className="flex items-center gap-3 py-2"
              >
                <svg className="w-5 h-5 flex-shrink-0 text-green-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm sm:text-base text-gray-300">{item}</span>
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center mt-12">
            <CTAButton text="Get All This — Book a Call" />
          </div>
        </div>
      </Section>

      {/* ================================================================
       * 14. PRICING PLANS
       * ================================================================ */}
      <Section className="py-20 sm:py-28 lg:py-36 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 sm:mb-20">
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gray-500 mb-6">Pricing</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Transparent Pricing, No Surprises
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto mt-6">
              Every project is unique. These are starting points — we&apos;ll build a custom quote on our call.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {pricingPlans.map((plan, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                variants={fadeUp}
                className={`rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col ${
                  plan.featured
                    ? 'bg-white/[0.06] border-2 border-white/20 relative'
                    : 'glass-card'
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-white text-black text-xs font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="text-lg sm:text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl sm:text-4xl font-bold">{plan.price}</span>
                  {plan.price !== 'Custom' && <span className="text-sm text-gray-500 ml-1">starting</span>}
                </div>
                <p className="text-sm text-gray-400 mb-6">{plan.desc}</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm text-gray-300">
                      <svg className="w-4 h-4 flex-shrink-0 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <CTAButton
                  text={plan.cta}
                  className={plan.featured ? '' : 'bg-white/10 text-white hover:bg-white/20'}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ================================================================
       * 15. WHO IT'S FOR + COMPARISON
       * ================================================================ */}
      <Section className="py-20 sm:py-28 px-5 sm:px-6 bg-white/[0.01]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14 sm:mb-20">
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gray-500 mb-6">Is This For You?</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Who We Work With
            </h2>
          </div>

          <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10">
            <div className="space-y-4">
              {idealFor.map((item, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  variants={fadeUp}
                  className="flex items-center gap-4 py-2"
                >
                  {item.yes ? (
                    <svg className="w-5 h-5 flex-shrink-0 text-green-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 flex-shrink-0 text-red-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className={`text-sm sm:text-base ${item.yes ? 'text-gray-300' : 'text-gray-500'}`}>
                    {item.text}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ================================================================
       * 16. SOCIAL PROOF — More Testimonials (Text cards)
       * ================================================================ */}
      <Section className="py-20 sm:py-28 lg:py-36 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 sm:mb-20">
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gray-500 mb-6">Testimonials</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Trusted by Brands That <span className="gradient-text">Dare to Stand Out</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                variants={fadeUp}
                className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col"
              >
                <div className="flex gap-1 mb-5">
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
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-white/60">{t.initials}</span>
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
       * 17. FAQ & OBJECTION HANDLING
       * ================================================================ */}
      <Section className="py-20 sm:py-28 px-5 sm:px-6 bg-white/[0.01]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14 sm:mb-20">
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gray-500 mb-6">FAQ</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Got Questions?
            </h2>
          </div>

          <div className="divide-y divide-white/0">
            {faqs.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </Section>

      {/* ================================================================
       * FINAL CTA — Book a Call
       *
       * TODO: Replace href="#" with your Calendly URL:
       * href="https://calendly.com/your-username/15min"
       * ================================================================ */}
      <section id="book" className="py-20 sm:py-28 lg:py-36 px-5 sm:px-6">
        <Section>
          <div className="max-w-3xl mx-auto text-center">
            <div className="relative overflow-hidden rounded-2xl sm:rounded-[2.5rem] bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/5 p-10 sm:p-14 md:p-20">
              <motion.div
                className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/[0.03] blur-3xl"
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 8, repeat: Infinity }}
              />
              <motion.div
                className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/[0.02] blur-3xl"
                animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 10, repeat: Infinity }}
              />

              <div className="relative z-10">
                <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gray-500 mb-6">Let&apos;s Go</p>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 leading-tight">
                  Your Brand Deserves Better
                </h2>
                <p className="text-gray-400 text-base sm:text-lg max-w-lg mx-auto mb-10">
                  Book a free 15-minute discovery call. No pressure, no commitment — just a real conversation about your goals and how we can help you get there.
                </p>

                <CTAButton text="Book Your Free 15-Min Call" />

                <p className="text-xs text-gray-600 mt-6">
                  No sales pitch. Just a real conversation.
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
