'use client';

import { useTranslations } from 'next-intl';
import { AnimatedSection } from './AnimatedSection';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { MagneticButton } from './MagneticButton';

const serviceIcons = [
  <svg key="1" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  <svg key="2" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>,
  <svg key="3" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  <svg key="4" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>,
  <svg key="5" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>,
  <svg key="6" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
];

export function ServicesContent() {
  const t = useTranslations('services');

  const services = Array.from({ length: 6 }, (_, i) => ({
    title: t(`service_${i + 1}_title` as 'service_1_title'),
    desc: t(`service_${i + 1}_desc` as 'service_1_desc'),
    icon: serviceIcons[i],
  }));

  const steps = Array.from({ length: 5 }, (_, i) => ({
    title: t(`step_${i + 1}_title` as 'step_1_title'),
    desc: t(`step_${i + 1}_desc` as 'step_1_desc'),
  }));

  return (
    <section className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-5 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <AnimatedSection className="text-center mb-14 sm:mb-20 lg:mb-24">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6">
            {t('title')}
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </AnimatedSection>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-16 sm:mb-24 lg:mb-32">
          {services.map((service, i) => (
            <AnimatedSection key={i} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 h-full group cursor-pointer"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/5 flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-white/10 transition-colors">
                  <div className="text-gray-400 group-hover:text-white transition-colors">
                    {service.icon}
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 group-hover:text-white transition-colors">
                  {service.title}
                </h3>
                <p className="text-gray-500 text-xs sm:text-sm leading-relaxed group-hover:text-gray-400 transition-colors">
                  {service.desc}
                </p>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>

        {/* Process */}
        <AnimatedSection className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
            {t('process_title')}
          </h2>
        </AnimatedSection>

        <div className="relative mb-16 sm:mb-24">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8">
            {steps.map((step, i) => (
              <AnimatedSection key={i} delay={i * 0.12}>
                <div className={`text-center relative ${i === 4 ? 'col-span-2 sm:col-span-1 max-w-[200px] mx-auto sm:max-w-none' : ''}`}>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full glass-card flex items-center justify-center mx-auto mb-4 sm:mb-6 relative z-10"
                  >
                    <span className="text-lg sm:text-xl lg:text-2xl font-bold text-white/40">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </motion.div>
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-1.5 sm:mb-2">{step.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>

        {/* CTA */}
        <AnimatedSection className="text-center">
          <MagneticButton as="div">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 sm:gap-3 px-8 sm:px-10 py-4 sm:py-5 rounded-full bg-white text-black font-medium text-base sm:text-lg hover:bg-gray-100 transition-colors"
            >
              Start Your Project
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </MagneticButton>
        </AnimatedSection>
      </div>
    </section>
  );
}
