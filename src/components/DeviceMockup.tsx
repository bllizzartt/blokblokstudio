'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { AnimatedSection } from './AnimatedSection';

/**
 * DeviceMockup — Showcases project screenshots inside CSS device frames
 * (MacBook, iPad Pro, iPhone Pro Max). Displayed on homepage between
 * hero and clients sections.
 *
 * When a real mockup image is available at /public/images/hero-devices.png,
 * set USE_REAL_IMAGE to true and it will render the image instead of CSS frames.
 */

const USE_REAL_IMAGE = false;
const REAL_IMAGE_PATH = '/images/hero-devices.png';

export function DeviceMockup() {
  if (USE_REAL_IMAGE) {
    return (
      <section className="py-8 sm:py-12 lg:py-16 px-5 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: 'easeOut' }}
            >
              <Image
                src={REAL_IMAGE_PATH}
                alt="Blok Blok Studio projects on MacBook, iPad, and iPhone"
                width={1400}
                height={800}
                className="w-full h-auto"
                priority
              />
            </motion.div>
          </AnimatedSection>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 sm:py-16 lg:py-24 px-5 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection>
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="relative"
          >
            {/* Ambient glow behind devices */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[80%] h-[60%] bg-white/[0.02] rounded-full blur-[100px]" />
            </div>

            {/* Device layout container */}
            <div className="relative flex items-end justify-center gap-4 sm:gap-6 lg:gap-8">

              {/* ── iPad Pro (left) ── */}
              <motion.div
                initial={{ opacity: 0, x: -40, rotate: -3 }}
                whileInView={{ opacity: 1, x: 0, rotate: -2 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="hidden md:block relative z-10 w-[220px] lg:w-[280px]"
              >
                {/* iPad frame */}
                <div className="rounded-[16px] lg:rounded-[20px] border-[6px] lg:border-[8px] border-gray-700 bg-gray-900 overflow-hidden shadow-2xl shadow-black/50">
                  {/* Top bezel with camera */}
                  <div className="h-3 lg:h-4 bg-gray-800 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-700" />
                  </div>
                  {/* Screen */}
                  <div className="aspect-[3/4] relative bg-gray-950">
                    <Image
                      src="/images/projects/nannyandnest.png"
                      alt="Nanny & Nest on iPad"
                      fill
                      className="object-cover object-top"
                      sizes="280px"
                    />
                  </div>
                </div>
              </motion.div>

              {/* ── MacBook (center) ── */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="relative z-20 w-full max-w-[500px] sm:max-w-[580px] lg:max-w-[680px]"
              >
                {/* Laptop screen */}
                <div className="rounded-t-[12px] sm:rounded-t-[16px] border-[4px] sm:border-[6px] border-gray-700 border-b-0 bg-gray-900 overflow-hidden shadow-2xl shadow-black/60">
                  {/* Top bezel with camera and notch */}
                  <div className="h-4 sm:h-6 bg-gray-800 flex items-center justify-center relative">
                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-gray-700" />
                  </div>
                  {/* Screen content */}
                  <div className="aspect-[16/10] relative bg-gray-950">
                    <Image
                      src="/images/projects/coachkofi.png"
                      alt="Coach Kofi website on MacBook"
                      fill
                      className="object-cover object-top"
                      sizes="(max-width: 640px) 100vw, 680px"
                      priority
                    />
                  </div>
                </div>
                {/* Laptop base/keyboard */}
                <div className="relative">
                  <div className="h-3 sm:h-4 bg-gradient-to-b from-gray-600 to-gray-700 rounded-b-[4px]" />
                  <div className="h-1.5 sm:h-2 bg-gray-800 mx-[15%] rounded-b-lg" />
                </div>
              </motion.div>

              {/* ── iPhone Pro Max (right) ── */}
              <motion.div
                initial={{ opacity: 0, x: 40, rotate: 3 }}
                whileInView={{ opacity: 1, x: 0, rotate: 2 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="relative z-30 w-[80px] sm:w-[100px] lg:w-[130px] -ml-6 sm:-ml-4 lg:ml-0"
              >
                {/* iPhone frame */}
                <div className="rounded-[14px] sm:rounded-[18px] lg:rounded-[24px] border-[3px] sm:border-[4px] lg:border-[5px] border-gray-700 bg-gray-900 overflow-hidden shadow-2xl shadow-black/50">
                  {/* Dynamic Island */}
                  <div className="h-4 sm:h-5 lg:h-6 bg-gray-900 flex items-center justify-center">
                    <div className="w-8 sm:w-10 lg:w-14 h-2 sm:h-2.5 lg:h-3 rounded-full bg-black" />
                  </div>
                  {/* Screen */}
                  <div className="aspect-[9/19] relative bg-gray-950">
                    <Image
                      src="/images/projects/coachkofi-mobile.png"
                      alt="Coach Kofi mobile on iPhone"
                      fill
                      className="object-cover object-top"
                      sizes="130px"
                    />
                  </div>
                  {/* Home indicator */}
                  <div className="h-3 sm:h-4 bg-gray-900 flex items-center justify-center">
                    <div className="w-8 sm:w-10 lg:w-12 h-1 rounded-full bg-gray-700" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Reflection/shadow under devices */}
            <div className="mt-4 mx-auto w-[80%] h-8 bg-gradient-to-t from-transparent to-white/[0.02] rounded-full blur-xl" />
          </motion.div>
        </AnimatedSection>
      </div>
    </section>
  );
}
