/**
 * ============================================================================
 * ProjectDetail.tsx — Individual Project Case Study Page
 * ============================================================================
 *
 * PURPOSE:
 *   Renders a full case study page for an individual project. Includes:
 *     1. A hero section with project title, category, year, and description
 *     2. A large placeholder image area (ready for real project screenshots)
 *     3. Project overview section (challenge, solution, results)
 *     4. A gallery grid of placeholder images
 *     5. A "Next Project" link at the bottom
 *
 * PROJECT DATA:
 *   All project data is defined in /src/data/projects.ts and imported here.
 *   See that file to add, edit, or remove projects.
 *
 * TO REPLACE PLACEHOLDER IMAGES:
 *   Set `heroImage` and `gallery` fields in /src/data/projects.ts to real
 *   image paths (e.g., '/images/projects/zenith-hero.jpg').
 *
 * REFERENCED FILES / DEPENDENCIES:
 *   - /src/data/projects.ts → shared project data (server + client)
 *   - ./AnimatedSection     → scroll-triggered reveal animation wrapper
 *   - framer-motion         → hover animations
 *   - next/link             → client-side navigation
 *
 * ============================================================================
 */

'use client';

import { AnimatedSection } from './AnimatedSection';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { projectsData } from '@/data/projects';

/**
 * ---------------------------------------------------------------------------
 * ProjectDetail Component
 * ---------------------------------------------------------------------------
 * Props:
 *   slug — URL slug matching a key in projectsData
 * ---------------------------------------------------------------------------
 */
export function ProjectDetail({ slug }: { slug: string }) {
  const project = projectsData[slug];

  if (!project) {
    return (
      <section className="pt-32 pb-24 px-5 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Project Not Found</h1>
        <Link href="/projects" className="text-gray-400 hover:text-white transition-colors">
          &larr; Back to Projects
        </Link>
      </section>
    );
  }

  const nextProject = project.nextSlug ? projectsData[project.nextSlug] : null;

  return (
    <div>
      {/* ================================================================
          SECTION 1: Project Hero
          ================================================================ */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-16 px-5 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors mb-8 sm:mb-12"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              Back to Projects
            </Link>

            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <span className="text-xs sm:text-sm text-gray-500 uppercase tracking-wider">
                {project.category}
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-600" />
              <span className="text-xs sm:text-sm text-gray-500">{project.year}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6">
              {project.title}
            </h1>

            <p className="text-gray-400 text-base sm:text-lg md:text-xl max-w-3xl mb-6">
              {project.desc}
            </p>
            {project.url && (
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-medium hover:bg-gray-100 transition-colors text-sm"
              >
                Visit Live Site
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </AnimatedSection>
        </div>
      </section>

      {/* ================================================================
          SECTION 2: Hero Image (Placeholder)
          ================================================================ */}
      <section className="px-5 sm:px-6 lg:px-8 mb-16 sm:mb-24">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection delay={0.2}>
            <div className="aspect-[16/9] rounded-2xl sm:rounded-3xl relative overflow-hidden bg-gray-900">
              {project.heroImage ? (
                <Image
                  src={project.heroImage}
                  alt={project.title}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 1280px"
                  priority
                />
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800" />
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
                </>
              )}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ================================================================
          SECTION 3: Challenge / Solution / Results
          ================================================================ */}
      <section className="px-5 sm:px-6 lg:px-8 mb-16 sm:mb-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {[
              { label: 'The Challenge', text: project.challenge },
              { label: 'Our Solution', text: project.solution },
              { label: 'The Results', text: project.results },
            ].map((section, i) => (
              <AnimatedSection key={i} delay={i * 0.1}>
                <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 h-full">
                  <span className="text-xs text-gray-600 uppercase tracking-wider">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="text-lg sm:text-xl font-semibold mt-2 mb-3 sm:mb-4">
                    {section.label}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                    {section.text}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          SECTION 4: Gallery Grid (Placeholders)
          ================================================================ */}
      <section className="px-5 sm:px-6 lg:px-8 mb-16 sm:mb-24">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection className="mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold">Project Gallery</h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {project.gallery.filter(img => img !== null).map((img, i) => (
              <AnimatedSection key={i} delay={i * 0.1}>
                <div className="aspect-[4/3] rounded-2xl sm:rounded-3xl relative overflow-hidden bg-gray-900">
                  <Image
                    src={img}
                    alt={`${project.title} gallery ${i + 1}`}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          SECTION 5: Next Project Link
          ================================================================ */}
      {nextProject && project.nextSlug && (
        <section className="px-5 sm:px-6 lg:px-8 pb-16 sm:pb-24">
          <div className="max-w-7xl mx-auto">
            <AnimatedSection>
              <Link href={`/projects/${project.nextSlug}`} className="block group">
                <div className="glass-card rounded-2xl sm:rounded-3xl p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wider mb-2">
                      Next Project
                    </p>
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold group-hover:text-white transition-colors">
                      {nextProject.title}
                    </h3>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white/5 transition-colors flex-shrink-0"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </motion.div>
                </div>
              </Link>
            </AnimatedSection>
          </div>
        </section>
      )}
    </div>
  );
}
