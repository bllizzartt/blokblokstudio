'use client';

import { useTranslations } from 'next-intl';
import { AnimatedSection } from './AnimatedSection';
import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

export function AboutContent() {
  const t = useTranslations('about');

  const values = [
    { title: t('value_1_title'), text: t('value_1_text') },
    { title: t('value_2_title'), text: t('value_2_text') },
    { title: t('value_3_title'), text: t('value_3_text') },
    { title: t('value_4_title'), text: t('value_4_text') },
  ];

  const stats = [
    { value: 150, suffix: '+', label: t('stats_projects') },
    { value: 80, suffix: '+', label: t('stats_clients') },
    { value: 8, suffix: '+', label: t('stats_years') },
    { value: 25, suffix: '+', label: t('stats_awards') },
  ];

  return (
    <section className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-5 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <AnimatedSection className="text-center mb-14 sm:mb-20 lg:mb-24">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6">
            {t('title')}
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </AnimatedSection>

        {/* Image placeholder */}
        <AnimatedSection delay={0.2} className="mb-14 sm:mb-20 lg:mb-24">
          <div className="aspect-[16/9] sm:aspect-[21/9] rounded-2xl sm:rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px] sm:bg-[size:50px_50px]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border border-white/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm text-white/20">Team Photo</p>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 mb-14 sm:mb-20 lg:mb-24">
          <AnimatedSection>
            <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 h-full">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 sm:mb-6">
                <svg className="w-6 h-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">{t('mission_title')}</h2>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed">{t('mission_text')}</p>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.15}>
            <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 h-full">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 sm:mb-6">
                <svg className="w-6 h-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">{t('vision_title')}</h2>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed">{t('vision_text')}</p>
            </div>
          </AnimatedSection>
        </div>

        {/* Stats */}
        <AnimatedSection className="mb-14 sm:mb-20 lg:mb-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 text-center"
              >
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-2">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-xs sm:text-sm text-gray-500">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>

        {/* Values */}
        <AnimatedSection className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-10 sm:mb-16">
            {t('values_title')}
          </h2>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {values.map((value, i) => (
            <AnimatedSection key={i} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -4 }}
                className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 group"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <span className="text-4xl sm:text-5xl font-bold text-white/5 group-hover:text-white/10 transition-colors">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2">{value.title}</h3>
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
