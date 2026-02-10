'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { AnimatedSection } from './AnimatedSection';
import { motion } from 'framer-motion';

const featuredProjects = [
  {
    title: 'Zenith Finance',
    category: 'Web Design',
    color: 'from-gray-900 to-gray-800',
    year: '2025',
  },
  {
    title: 'Aura Wellness',
    category: 'Branding',
    color: 'from-gray-800 to-gray-900',
    year: '2025',
  },
  {
    title: 'NovaTech App',
    category: 'App Development',
    color: 'from-gray-900 to-gray-800',
    year: '2024',
  },
  {
    title: 'Monolith Records',
    category: 'Web Design',
    color: 'from-gray-800 to-gray-900',
    year: '2024',
  },
];

export function HomeProjects() {
  const t = useTranslations('home');

  return (
    <section className="py-16 sm:py-24 lg:py-32 px-5 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 sm:mb-16 gap-4 sm:gap-6">
          <div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
              {t('projects_heading')}
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-xl">
              {t('projects_subheading')}
            </p>
          </div>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group"
          >
            {t('projects_cta')}
            <svg
              className="w-4 h-4 group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {featuredProjects.map((project, i) => (
            <AnimatedSection key={i} delay={i * 0.1}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.4 }}
                className="group relative overflow-hidden rounded-2xl sm:rounded-3xl cursor-pointer"
              >
                {/* Placeholder image area */}
                <div
                  className={`aspect-[4/3] bg-gradient-to-br ${project.color} relative`}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

                  {/* Image placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-2xl border border-white/10 flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-white/20"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-500" />
                </div>

                {/* Info */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">
                        {project.category} &mdash; {project.year}
                      </p>
                      <h3 className="text-lg sm:text-xl font-semibold">
                        {project.title}
                      </h3>
                    </div>
                    <motion.div
                      className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      whileHover={{ scale: 1.1 }}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 17L17 7M17 7H7M17 7v10"
                        />
                      </svg>
                    </motion.div>
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
