'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatedSection } from './AnimatedSection';
import { motion } from 'framer-motion';

const featuredProjects = [
  {
    title: 'Coach Kofi',
    category: 'Web Design',
    year: '2025',
    slug: 'coach-kofi',
    image: '/images/projects/coachkofi.png',
    url: 'https://coachkofi.de',
  },
  {
    title: 'Nanny & Nest',
    category: 'Web Design',
    year: '2025',
    slug: 'nanny-and-nest',
    image: '/images/projects/nannyandnest.png',
    url: 'https://www.nannyandnest.com',
  },
  {
    title: 'Exotic Ripz',
    category: 'E-Commerce',
    year: '2025',
    slug: 'exotic-ripz',
    image: '/images/projects/exoticripz.png',
    url: 'https://exoticripz.com',
  },
  {
    title: 'The New School',
    category: 'Web Design',
    year: '2024',
    slug: 'military-newschool',
    image: '/images/projects/military-newschool.png',
    url: 'https://www.military.newschool.edu',
  },
  {
    title: 'Public Affair',
    category: 'Branding',
    year: '2024',
    slug: 'public-affair',
    image: '/images/projects/public-affair.png',
    url: 'https://public-affair.com',
  },
];

export function HomeProjects() {
  const t = useTranslations('home');

  return (
    <section className="py-16 sm:py-24 lg:py-32 px-5 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </AnimatedSection>

        {/* Featured project — large hero card */}
        <AnimatedSection className="mb-4 sm:mb-6">
          <Link href={`/projects/${featuredProjects[0].slug}`}>
            <motion.div
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.4 }}
              className="group relative overflow-hidden rounded-2xl sm:rounded-3xl cursor-pointer"
            >
              <div className="aspect-[16/9] relative bg-gray-900">
                <Image
                  src={featuredProjects[0].image}
                  alt={featuredProjects[0].title}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 1280px"
                  priority
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-500" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-300 mb-1">
                      {featuredProjects[0].category} &mdash; {featuredProjects[0].year}
                    </p>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">
                      {featuredProjects[0].title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {featuredProjects[0].url}
                    </p>
                  </div>
                  <motion.div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/5 backdrop-blur-sm"
                    whileHover={{ scale: 1.1 }}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
                    </svg>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </Link>
        </AnimatedSection>

        {/* 2x2 grid of remaining projects */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {featuredProjects.slice(1).map((project, i) => (
            <AnimatedSection key={project.slug} delay={i * 0.1}>
              <Link href={`/projects/${project.slug}`}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.4 }}
                  className="group relative overflow-hidden rounded-2xl sm:rounded-3xl cursor-pointer"
                >
                  <div className="aspect-[4/3] relative bg-gray-900">
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      className="object-cover object-top"
                      sizes="(max-width: 640px) 100vw, 640px"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-500" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs text-gray-300 mb-1">
                          {project.category} &mdash; {project.year}
                        </p>
                        <h3 className="text-lg sm:text-xl font-semibold">
                          {project.title}
                        </h3>
                      </div>
                      <motion.div
                        className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/5 backdrop-blur-sm"
                        whileHover={{ scale: 1.1 }}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
                        </svg>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
