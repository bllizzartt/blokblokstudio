'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { AnimatedSection } from './AnimatedSection';
import { MagneticButton } from './MagneticButton';
import { motion } from 'framer-motion';

export function HomeCTA() {
  const t = useTranslations('home');

  return (
    <section className="py-16 sm:py-24 lg:py-32 px-5 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection>
          <div className="relative overflow-hidden rounded-2xl sm:rounded-[2.5rem] bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/5 p-8 sm:p-12 md:p-20 text-center">
            {/* Background decoration */}
            <motion.div
              className="absolute top-0 right-0 w-40 sm:w-80 h-40 sm:h-80 rounded-full bg-white/[0.02] blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{ duration: 8, repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-white/[0.015] blur-3xl"
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 10, repeat: Infinity }}
            />

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
                {t('cta_heading')}
              </h2>
              <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto mb-8 sm:mb-10">
                {t('cta_subheading')}
              </p>
              <MagneticButton as="div">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 sm:gap-3 px-8 sm:px-10 py-4 sm:py-5 rounded-full bg-white text-black font-medium text-base sm:text-lg hover:bg-gray-100 transition-colors"
                >
                  {t('cta_button')}
                  <svg
                    className="w-5 h-5"
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
              </MagneticButton>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
