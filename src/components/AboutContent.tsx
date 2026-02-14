/* ==========================================================================
 * AboutContent.tsx
 * ==========================================================================
 *
 * About Us Page -- Full page content
 *
 * This component renders the entire About page. It contains:
 *   1. Page header (title + subtitle)
 *   2. Visual hero (abstract creative composition with floating discipline cards)
 *   3. Mission & Vision cards (side by side)
 *   4. Animated stats counters (150+ projects, 80+ clients, 8+ years, 25+ awards)
 *   5. Company values grid (4 values in a 2-column layout)
 *
 * ---- Where text comes from ----
 * All user-facing strings are pulled from the "about" translation namespace
 * via next-intl. Edit them in your locale files, for example:
 *   /messages/en.json  -> "about.title"
 *   /messages/en.json  -> "about.subtitle"
 *   /messages/en.json  -> "about.mission_title"
 *   /messages/en.json  -> "about.mission_text"
 *   /messages/en.json  -> "about.vision_title"
 *   /messages/en.json  -> "about.vision_text"
 *   /messages/en.json  -> "about.stats_projects"
 *   /messages/en.json  -> "about.stats_clients"
 *   /messages/en.json  -> "about.stats_years"
 *   /messages/en.json  -> "about.stats_awards"
 *   /messages/en.json  -> "about.values_title"
 *   /messages/en.json  -> "about.value_1_title" / "about.value_1_text"
 *   /messages/en.json  -> "about.value_2_title" / "about.value_2_text"
 *   /messages/en.json  -> "about.value_3_title" / "about.value_3_text"
 *   /messages/en.json  -> "about.value_4_title" / "about.value_4_text"
 * (and the equivalent keys in every other locale file)
 *
 * ---- How to change stat numbers ----
 * The stats (150+, 80+, etc.) are hardcoded in the `stats` array inside the
 * component. Change `value` to set the number the counter animates to, and
 * `suffix` for the character after the number (e.g. "+").
 *
 * ---- Visual hero section ----
 * The hero area shows an abstract creative composition with pulsing
 * gradient orbs and floating glass discipline cards (Design, Development,
 * Strategy, Branding). Replace with a real team photo when available.
 *
 * ---- AnimatedCounter helper ----
 * A small internal component (defined at the top of this file) that counts
 * from 0 up to a target number when it scrolls into view. It uses
 * framer-motion's useInView hook to detect visibility and a setInterval
 * to animate the number over ~2 seconds.
 *
 * ---- Animations ----
 * - AnimatedSection: scroll-triggered fade/slide entrance for each block
 * - AnimatedCounter: counts up from 0 to target on first scroll into view
 * - motion.div (whileHover): stats cards scale up, values cards lift up
 *
 * ---- Referenced files / components ----
 * - ./AnimatedSection   -- scroll-triggered entrance animation wrapper
 * - framer-motion       -- useInView (counter visibility), motion.div (hover)
 * - next-intl           -- translations (useTranslations)
 * ========================================================================== */

'use client';

import { useTranslations } from 'next-intl';
import { AnimatedSection } from './AnimatedSection';
import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

/* ==========================================================================
 * AnimatedCounter (internal helper component)
 * ==========================================================================
 *
 * Renders a number that counts up from 0 to `target` when it scrolls into
 * the viewport. Used for the stats section (e.g. "150+").
 *
 * Props:
 *   target  -- the final number to count up to (e.g. 150)
 *   suffix  -- optional string appended after the number (e.g. "+")
 *
 * How it works:
 *   1. A ref is attached to the <span>, and framer-motion's `useInView`
 *      detects when it enters the viewport (fires only once).
 *   2. A setInterval runs every ~16ms (60fps) and increments the count.
 *   3. The total animation lasts about 2000ms (the `duration` variable).
 *   4. Once the count reaches the target, the interval is cleared.
 *
 * To change animation speed, adjust the `duration` variable (in ms).
 * ========================================================================== */
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef(null);
  /* `once: true` means the animation triggers only the first time it scrolls into view */
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const duration = 2000; /* Total animation time in milliseconds */
    const increment = target / (duration / 16); /* How much to add each frame (~60fps) */

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        /* Snap to the exact target number and stop */
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16); /* ~60 frames per second */

    return () => clearInterval(timer); /* Cleanup on unmount */
  }, [isInView, target]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

/* ==========================================================================
 * AboutContent (main export)
 * ==========================================================================
 * Renders the full About page layout. See the file header for a breakdown
 * of each section.
 * ========================================================================== */
export function AboutContent() {
  /* Pull translated strings from the "about" namespace */
  const t = useTranslations('about');

  /* ------------------------------------------------------------------
   * Company Values Data
   * ------------------------------------------------------------------
   * Four values displayed in a 2-column grid at the bottom of the page.
   * Each value has a title and descriptive text, both from translations.
   *
   * To add a value:  add a new object AND create matching translation keys
   *                  (e.g. "about.value_5_title" / "about.value_5_text").
   * To remove one:   delete the object from this array.
   * ------------------------------------------------------------------ */
  const values = [
    { title: t('value_1_title'), text: t('value_1_text') },
    { title: t('value_2_title'), text: t('value_2_text') },
    { title: t('value_3_title'), text: t('value_3_text') },
    { title: t('value_4_title'), text: t('value_4_text') },
  ];

  /* ------------------------------------------------------------------
   * Stats Data
   * ------------------------------------------------------------------
   * Displayed as big animated numbers in a 4-column row.
   *
   * To change a number: update the `value` field (e.g. 150 -> 200).
   * To change the suffix: update `suffix` (e.g. '+' -> '').
   * To change the label: edit the matching translation key.
   *
   * To add a stat:  add an object here AND create a translation key for
   *                 the label.
   * To remove one:  delete the object from this array.
   * ------------------------------------------------------------------ */
  const stats = [
    { value: 15, suffix: '+', label: t('stats_projects') },
    { value: 11, suffix: '', label: t('stats_clients') },
    { value: 2, suffix: '', label: t('stats_years') },
    { value: 6, suffix: '+', label: t('stats_awards') },
  ];

  return (
    /* ---- Page section wrapper ----
       Top padding is larger (pt-24/32) to account for the fixed navbar.
       Bottom padding provides spacing before the footer. */
    <section className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-5 sm:px-6 lg:px-8">
      {/* Max-width container -- keeps content centered on wide screens */}
      <div className="max-w-7xl mx-auto">

        {/* ==================================================================
         * 1. PAGE HEADER
         * ==================================================================
         * Centered title and subtitle. Text comes from translations:
         *   about.title      -- main heading (e.g. "About Us")
         *   about.subtitle   -- descriptive paragraph below the heading
         * ================================================================== */}
        <AnimatedSection className="text-center mb-14 sm:mb-20 lg:mb-24">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6">
            {t('title')}
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </AnimatedSection>

        {/* ==================================================================
         * 2. VISUAL HERO — Abstract creative composition
         * ================================================================== */}
        <AnimatedSection delay={0.2} className="mb-14 sm:mb-20 lg:mb-24">
          <div className="aspect-[16/9] sm:aspect-[21/9] rounded-2xl sm:rounded-3xl bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 relative overflow-hidden">
            {/* Dot grid pattern */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
                backgroundSize: '32px 32px',
              }}
            />

            {/* Animated gradient orbs */}
            <div className="absolute top-[10%] left-[15%] w-40 h-40 sm:w-64 sm:h-64 rounded-full bg-orange-500/20 blur-3xl animate-pulse" />
            <div className="absolute bottom-[10%] right-[10%] w-48 h-48 sm:w-72 sm:h-72 rounded-full bg-purple-600/15 blur-3xl animate-pulse [animation-delay:1s]" />
            <div className="absolute top-[40%] right-[35%] w-32 h-32 sm:w-48 sm:h-48 rounded-full bg-blue-500/10 blur-3xl animate-pulse [animation-delay:2s]" />

            {/* Floating glass cards representing disciplines */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full max-w-2xl h-full">
                {/* Design card */}
                <div className="absolute top-[15%] left-[8%] sm:left-[12%] px-4 py-3 sm:px-6 sm:py-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm transform -rotate-6 hover:rotate-0 transition-transform duration-500">
                  <span className="text-2xl sm:text-3xl mr-2">🎨</span>
                  <span className="text-xs sm:text-sm font-medium text-white/60">Design</span>
                </div>
                {/* Development card */}
                <div className="absolute top-[20%] right-[5%] sm:right-[10%] px-4 py-3 sm:px-6 sm:py-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm transform rotate-3 hover:rotate-0 transition-transform duration-500">
                  <span className="text-2xl sm:text-3xl mr-2">⚡</span>
                  <span className="text-xs sm:text-sm font-medium text-white/60">Development</span>
                </div>
                {/* Strategy card */}
                <div className="absolute bottom-[18%] left-[12%] sm:left-[18%] px-4 py-3 sm:px-6 sm:py-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm transform rotate-3 hover:rotate-0 transition-transform duration-500">
                  <span className="text-2xl sm:text-3xl mr-2">📈</span>
                  <span className="text-xs sm:text-sm font-medium text-white/60">Strategy</span>
                </div>
                {/* Branding card */}
                <div className="absolute bottom-[22%] right-[8%] sm:right-[15%] px-4 py-3 sm:px-6 sm:py-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                  <span className="text-2xl sm:text-3xl mr-2">✨</span>
                  <span className="text-xs sm:text-sm font-medium text-white/60">Branding</span>
                </div>

                {/* Center tagline */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center px-4">
                    <p className="text-lg sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-400 via-white to-purple-400 bg-clip-text text-transparent">
                      We build brands that stand out
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top & bottom edge fade for depth */}
            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-gray-950 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-gray-950 to-transparent" />
          </div>
        </AnimatedSection>

        {/* ==================================================================
         * 3. MISSION & VISION CARDS
         * ==================================================================
         * Two glass-style cards side by side (stacked on mobile).
         * Each has an icon, a heading, and a paragraph.
         *
         * Text comes from translations:
         *   about.mission_title / about.mission_text
         *   about.vision_title  / about.vision_text
         *
         * To change the icons, edit the SVG <path> elements below.
         * ================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 mb-14 sm:mb-20 lg:mb-24">
          {/* ---- Mission Card ---- */}
          <AnimatedSection>
            <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 h-full">
              {/* Lightning bolt icon */}
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 sm:mb-6">
                <svg className="w-6 h-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              {/* Mission heading -- edit in translations: about.mission_title */}
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">{t('mission_title')}</h2>
              {/* Mission body text -- edit in translations: about.mission_text */}
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed">{t('mission_text')}</p>
            </div>
          </AnimatedSection>

          {/* ---- Vision Card ---- */}
          <AnimatedSection delay={0.15}>
            <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 h-full">
              {/* Eye icon */}
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 sm:mb-6">
                <svg className="w-6 h-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              {/* Vision heading -- edit in translations: about.vision_title */}
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">{t('vision_title')}</h2>
              {/* Vision body text -- edit in translations: about.vision_text */}
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed">{t('vision_text')}</p>
            </div>
          </AnimatedSection>
        </div>

        {/* ==================================================================
         * 4. ANIMATED STATS COUNTERS
         * ==================================================================
         * A row of 4 stat cards (2 columns on mobile, 4 on md+).
         * Each card shows a large animated number and a label beneath it.
         *
         * The numbers count up from 0 when the section scrolls into view,
         * powered by the AnimatedCounter component defined above.
         *
         * To change a stat number: edit the `stats` array above.
         * To change the labels: edit the translation keys
         *   (about.stats_projects, about.stats_clients, etc.)
         *
         * Hover effect: cards scale up to 1.05x (motion.div whileHover).
         * ================================================================== */}
        <AnimatedSection className="mb-14 sm:mb-20 lg:mb-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 text-center"
              >
                {/* Animated number -- counts from 0 to stat.value on scroll */}
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-2">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                {/* Label below the number (e.g. "Projects Completed") */}
                <p className="text-xs sm:text-sm text-gray-500">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>

        {/* ==================================================================
         * 5. COMPANY VALUES
         * ==================================================================
         * A section heading followed by a 2-column grid of value cards.
         * Each card has a large faded number (01, 02, etc.), a title,
         * and a description.
         *
         * Text comes from translations:
         *   about.values_title
         *   about.value_1_title / about.value_1_text  (through value_4)
         *
         * To add a value: add an entry to the `values` array above and
         * create matching translation keys.
         *
         * Hover effect: cards lift up 4px (motion.div whileHover y: -4).
         * The large number becomes slightly more visible on hover
         * (text-white/5 -> text-white/10).
         * ================================================================== */}

        {/* Values section heading */}
        <AnimatedSection className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-10 sm:mb-16">
            {t('values_title')}
          </h2>
        </AnimatedSection>

        {/* Values grid -- 1 column on mobile, 2 columns on sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {values.map((value, i) => (
            <AnimatedSection key={i} delay={i * 0.1}>
              {/* Each value card lifts up slightly on hover */}
              <motion.div
                whileHover={{ y: -4 }}
                className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 group"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Large faded index number (01, 02, 03, 04)
                      Becomes slightly more visible on card hover via
                      group-hover:text-white/10 */}
                  <span className="text-4xl sm:text-5xl font-bold text-white/5 group-hover:text-white/10 transition-colors">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    {/* Value title -- from translations (e.g. about.value_1_title) */}
                    <h3 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2">{value.title}</h3>
                    {/* Value description -- from translations (e.g. about.value_1_text) */}
                    <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
                      {value.text}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
