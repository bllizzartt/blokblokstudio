'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedSection } from './AnimatedSection';

const allProjects = [
  { id: 1, title: 'Zenith Finance', category: 'web', year: '2025', desc: 'A comprehensive fintech platform redesign with focus on user trust and clarity.' },
  { id: 2, title: 'Aura Wellness', category: 'brand', year: '2025', desc: 'Complete brand identity for a luxury wellness brand expanding globally.' },
  { id: 3, title: 'NovaTech App', category: 'app', year: '2024', desc: 'Cross-platform mobile application for next-gen project management.' },
  { id: 4, title: 'Monolith Records', category: 'web', year: '2024', desc: 'Immersive music label website with audio-reactive visuals.' },
  { id: 5, title: 'Apex Athletics', category: 'brand', year: '2024', desc: 'Dynamic sports brand identity system with motion design guidelines.' },
  { id: 6, title: 'Horizon Travel', category: 'marketing', year: '2024', desc: 'Multi-channel digital marketing campaign driving 300% booking increase.' },
  { id: 7, title: 'Vortex Gaming', category: 'web', year: '2023', desc: 'High-performance esports team website with live stats integration.' },
  { id: 8, title: 'Luna Cosmetics', category: 'app', year: '2023', desc: 'AR-powered beauty app with virtual try-on and personalized routines.' },
  { id: 9, title: 'Echo Media', category: 'marketing', year: '2023', desc: 'Full-scale digital presence overhaul and content strategy execution.' },
];

export function ProjectsContent() {
  const t = useTranslations('projects');
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { key: 'all', label: t('filter_all') },
    { key: 'web', label: t('filter_web') },
    { key: 'brand', label: t('filter_brand') },
    { key: 'app', label: t('filter_app') },
    { key: 'marketing', label: t('filter_marketing') },
  ];

  const filtered =
    activeFilter === 'all'
      ? allProjects
      : allProjects.filter((p) => p.category === activeFilter);

  return (
    <section className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-5 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <AnimatedSection className="text-center mb-10 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6">
            {t('title')}
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </AnimatedSection>

        {/* Filters */}
        <AnimatedSection delay={0.2} className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10 sm:mb-16">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm transition-all duration-300 ${
                activeFilter === filter.key
                  ? 'bg-white text-black'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </AnimatedSection>

        {/* Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((project) => (
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
                <div className="rounded-2xl sm:rounded-3xl overflow-hidden glass-card">
                  {/* Image placeholder */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-gray-900 to-gray-800 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-2xl border border-white/10 flex items-center justify-center group-hover:border-white/20 transition-colors">
                        <svg className="w-6 h-6 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-500" />
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs text-gray-500 uppercase tracking-wider">
                        {project.category}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-gray-600" />
                      <span className="text-xs text-gray-500">{project.year}</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-white transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {project.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
