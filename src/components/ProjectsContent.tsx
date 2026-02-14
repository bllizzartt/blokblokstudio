/**
 * ============================================================================
 * ProjectsContent.tsx — Full /projects Page Component
 * ============================================================================
 *
 * PURPOSE:
 *   Renders the entire Projects page, including:
 *     1. A page header (title + subtitle)
 *     2. A row of filter buttons (All, Web, Branding, App, Marketing)
 *     3. An animated, filterable grid of project cards
 *
 * HOW FILTERING WORKS:
 *   - The active filter is stored in React state (`activeFilter`).
 *   - Clicking a filter button updates the state.
 *   - The `filtered` array is recomputed: "all" shows everything, otherwise
 *     it filters by the project's `category` field.
 *   - Framer Motion's `AnimatePresence` + `layout` props handle the
 *     smooth add/remove animation when projects enter or leave the grid.
 *
 * PROJECT DATA:
 *   - All project data is hardcoded in the `allProjects` array below.
 *   - Each project has: id, title, category, year, desc.
 *   - TO ADD/EDIT/REMOVE PROJECTS: modify the `allProjects` array directly.
 *   - Project images are currently placeholders (gradient + grid pattern).
 *     Replace the placeholder <div> inside each card with an <Image> or
 *     <img> to use real project screenshots.
 *
 * TRANSLATIONS:
 *   Text comes from the "projects" namespace in your translation JSON files.
 *   Keys used:
 *     - projects.title            → page heading
 *     - projects.subtitle         → page subheading
 *     - projects.filter_all       → "All" filter button label
 *     - projects.filter_web       → "Web" filter button label
 *     - projects.filter_brand     → "Branding" filter button label
 *     - projects.filter_app       → "App" filter button label
 *     - projects.filter_marketing → "Marketing" filter button label
 *
 * TO EDIT TEXT:
 *   - Page title/subtitle → edit "projects.title" / "projects.subtitle"
 *     in your translation files (e.g., messages/en.json).
 *   - Filter button labels → edit "projects.filter_*" keys.
 *   - Project titles/descriptions → edit the `allProjects` array below
 *     (these are NOT translated — they are hardcoded English strings).
 *
 * TO ADD A NEW FILTER CATEGORY:
 *   1. Add a new entry to the `filters` array in the component.
 *   2. Add a matching translation key (e.g., "projects.filter_newcategory").
 *   3. Set the `category` field on your projects to match the filter key.
 *
 * REFERENCED FILES / DEPENDENCIES:
 *   - ./AnimatedSection   → scroll-triggered reveal animation wrapper
 *   - next-intl           → i18n translation hook (useTranslations)
 *   - framer-motion       → animation library (motion, AnimatePresence)
 *
 * STYLING:
 *   - Uses Tailwind CSS utility classes throughout.
 *   - "glass-card" is a custom utility class for the frosted-glass card look.
 *   - Responsive breakpoints: sm (640px), md (768px), lg (1024px).
 *
 * ============================================================================
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { AnimatedSection } from './AnimatedSection';
import Link from 'next/link';

/**
 * ---------------------------------------------------------------------------
 * Project Data Array (Hardcoded)
 * ---------------------------------------------------------------------------
 * Each project object contains:
 *   - id:       Unique identifier (used as React key for animations)
 *   - title:    Project name displayed on the card
 *   - category: Must match one of the filter keys ("web", "brand", "app", "marketing")
 *   - year:     Year string displayed on the card
 *   - desc:     Short description shown below the title
 *
 * TO ADD A NEW PROJECT:
 *   Add a new object to this array with a unique `id`.
 *   Make sure the `category` matches an existing filter key.
 *
 * TO EDIT A PROJECT:
 *   Find it by title or id and change the fields directly.
 *
 * TO REMOVE A PROJECT:
 *   Delete the entire object from the array.
 *
 * NOTE: These strings are NOT translated. If you need i18n for project
 * data, you would need to move these strings into your translation files
 * and reference them via t() calls.
 * ---------------------------------------------------------------------------
 */
const allProjects = [
  { id: 1, title: 'Coach Kofi', category: 'web', year: '2025', desc: 'High-performance personal brand and coaching platform with bold visual identity.', slug: 'coach-kofi', image: '/images/projects/coachkofi.png' },
  { id: 2, title: 'Nanny & Nest', category: 'web', year: '2025', desc: 'Warm, trust-focused membership platform for a premium childcare and home assistance agency.', slug: 'nanny-and-nest', image: '/images/projects/nannyandnest.png' },
  { id: 3, title: 'Exotic Ripz', category: 'web', year: '2025', desc: 'Vibrant e-commerce platform for a collectible trading card community brand.', slug: 'exotic-ripz', image: '/images/projects/exoticripz.png' },
  { id: 4, title: 'The New School', category: 'web', year: '2024', desc: 'Institutional web presence for The New School\'s Center for Military-Affiliated Students.', slug: 'military-newschool', image: '/images/projects/military-newschool.png' },
  { id: 5, title: 'Public Affair', category: 'brand', year: '2024', desc: 'Sophisticated brand identity and web experience for a premium lifestyle brand.', slug: 'public-affair', image: '/images/projects/public-affair.png' },
];

/**
 * ---------------------------------------------------------------------------
 * ProjectsContent Component
 * ---------------------------------------------------------------------------
 * Main export. Renders the full /projects page layout with interactive
 * filtering and animated card transitions.
 * ---------------------------------------------------------------------------
 */
export function ProjectsContent() {
  /**
   * Translation hook — pulls all keys from the "projects" namespace.
   * To change any displayed text, edit your translation JSON files
   * (e.g., messages/en.json → "projects": { ... }).
   */
  const t = useTranslations('projects');

  /**
   * Active filter state — defaults to "all" (show every project).
   * Updated when the user clicks a filter button.
   */
  const [activeFilter, setActiveFilter] = useState('all');

  /**
   * Filter button definitions.
   * Each has a `key` (matches project category values) and a `label`
   * (pulled from translations for i18n support).
   *
   * TO ADD A NEW FILTER:
   *   1. Add { key: 'newkey', label: t('filter_newkey') } here.
   *   2. Add the "projects.filter_newkey" translation key.
   *   3. Use category: 'newkey' on your project objects above.
   */
  const filters = [
    { key: 'all', label: t('filter_all') },
    { key: 'web', label: t('filter_web') },
    { key: 'brand', label: t('filter_brand') },
  ];

  /**
   * Compute the filtered list of projects based on the active filter.
   * "all" returns everything; otherwise filters by category match.
   */
  const filtered =
    activeFilter === 'all'
      ? allProjects
      : allProjects.filter((p) => p.category === activeFilter);

  return (
    /**
     * Outer section wrapper.
     * - pt-24 / sm:pt-32 → top padding (room for the fixed navbar)
     * - pb-16 / sm:pb-24 → bottom padding
     * - px-5 / sm:px-6 / lg:px-8 → horizontal padding
     */
    <section className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-5 sm:px-6 lg:px-8">
      {/* Max-width container — keeps content centered on wide screens */}
      <div className="max-w-7xl mx-auto">

        {/* ================================================================
            SECTION 1: Page Header (Title + Subtitle)
            ================================================================
            TO EDIT: Change "projects.title" and "projects.subtitle" in
            your translation files.
        */}
        <AnimatedSection className="text-center mb-10 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6">
            {t('title')}
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </AnimatedSection>

        {/* ================================================================
            SECTION 2: Filter Buttons
            ================================================================
            A horizontal row of pill-shaped buttons. Clicking a button
            sets `activeFilter`, which triggers re-filtering and animation.

            Active button: white background, black text.
            Inactive buttons: subtle bg, gray text, border on hover.

            TO EDIT LABELS: Change the "projects.filter_*" translation keys.
        */}
        <AnimatedSection delay={0.2} className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10 sm:mb-16">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm transition-all duration-300 ${
                activeFilter === filter.key
                  ? 'bg-white text-black'                                              /* Active state */
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10' /* Inactive state */
              }`}
            >
              {filter.label}
            </button>
          ))}
        </AnimatedSection>

        {/* ================================================================
            SECTION 3: Project Cards Grid
            ================================================================
            Uses framer-motion's `layout` prop on the grid container so
            that the grid smoothly rearranges when items are filtered.

            AnimatePresence with mode="popLayout" handles the enter/exit
            animations for individual cards.

            Grid: 1 col on mobile, 2 on sm, 3 on lg.
        */}
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((project) => (
              /**
               * Individual project card wrapper.
               * - layout: enables smooth position animation when grid rearranges
               * - initial/animate/exit: fade + scale animation on enter/leave
               * - whileHover: lifts card up 6px on hover
               */
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                whileHover={{ y: -6 }}
                className="group cursor-pointer"
              >
                <Link href={`/projects/${project.slug}`}>
                <div className="rounded-2xl sm:rounded-3xl overflow-hidden glass-card">

                  {/* ----------------------------------------------------
                      Project Image / Placeholder
                      ----------------------------------------------------
                      Currently shows a gradient placeholder with a subtle
                      grid pattern and a centered image icon.

                      TO REPLACE WITH A REAL IMAGE:
                        Remove this entire div and replace it with:
                        <div className="aspect-[4/3] relative overflow-hidden">
                          <Image src={project.image} alt={project.title} fill className="object-cover" />
                        </div>
                        Make sure to add an `image` field to each project
                        in the allProjects array and import Image from next/image.
                  */}
                  <div className="aspect-[4/3] relative overflow-hidden bg-gray-900">
                    {project.image ? (
                      <Image
                        src={project.image}
                        alt={project.title}
                        fill
                        className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800" />
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px]" />
                      </>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-500" />
                  </div>

                  {/* ----------------------------------------------------
                      Project Card Text Content
                      ----------------------------------------------------
                      Shows category tag, year, title, and description.

                      TO EDIT: Modify the corresponding project object in
                      the allProjects array above.
                  */}
                  <div className="p-4 sm:p-6">
                    {/* Category + Year metadata row */}
                    <div className="flex items-center gap-3 mb-3">
                      {/* Category label (uppercase) */}
                      <span className="text-xs text-gray-500 uppercase tracking-wider">
                        {project.category}
                      </span>
                      {/* Small dot separator */}
                      <span className="w-1 h-1 rounded-full bg-gray-600" />
                      {/* Year */}
                      <span className="text-xs text-gray-500">{project.year}</span>
                    </div>
                    {/* Project title */}
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-white transition-colors">
                      {project.title}
                    </h3>
                    {/* Project description */}
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {project.desc}
                    </p>
                  </div>
                </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
