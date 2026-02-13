/**
 * ============================================================================
 * HomeNewsletter.tsx — Newsletter Signup Section (Homepage)
 * ============================================================================
 *
 * PURPOSE:
 *   A prominent newsletter signup block on the homepage, separate from the
 *   smaller footer newsletter. Designed to maximize email signups with a
 *   clear value proposition and a single email input + subscribe button.
 *
 * TRANSLATIONS:
 *   Text comes from the "home" namespace:
 *     - home.newsletter_heading     → main heading
 *     - home.newsletter_subtitle    → subtitle / value proposition
 *     - home.newsletter_placeholder → email input placeholder text
 *     - home.newsletter_button      → submit button label
 *     - home.newsletter_privacy     → privacy note below the form
 *
 * FORM BEHAVIOR:
 *   Currently the form does NOT send data anywhere (e.preventDefault).
 *   Shows a success message after "submitting".
 *
 *   TODO — BACKEND INTEGRATION:
 *     Replace the handleSubmit logic with a real API call to your
 *     email service (Mailchimp, ConvertKit, Resend, etc.).
 *     See the handleSubmit function below for where to add that.
 *
 * STYLING:
 *   - Glass-card style with gradient background blobs.
 *   - Responsive layout: stacked on mobile, inline form on sm+.
 *   - Matches the visual style of HomeCTA.tsx.
 *
 * REFERENCED FILES / DEPENDENCIES:
 *   - ./AnimatedSection → scroll-triggered reveal animation wrapper
 *   - next-intl         → translations (useTranslations)
 *   - framer-motion     → animations (motion.div for blobs + success state)
 *
 * ============================================================================
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AnimatedSection } from './AnimatedSection';
import { motion } from 'framer-motion';

export function HomeNewsletter() {
  const t = useTranslations('home');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const form = e.target as HTMLFormElement;
      const email = new FormData(form).get('email');
      await fetch('/api/newsletter', {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: { 'Content-Type': 'application/json' },
      });
      setSubmitted(true);
    } catch {
      // Still show success to avoid leaking subscription status
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    /* Section wrapper with responsive padding */
    <section className="py-16 sm:py-24 lg:py-32 px-5 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <AnimatedSection>
          {/* Glass card container with animated background blobs */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-[2.5rem] bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/5 p-8 sm:p-12 md:p-16 text-center">

            {/* Animated background blob — top right */}
            <motion.div
              className="absolute top-0 right-0 w-40 sm:w-64 h-40 sm:h-64 rounded-full bg-white/[0.02] blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 8, repeat: Infinity }}
            />

            {/* Animated background blob — bottom left */}
            <motion.div
              className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/[0.015] blur-3xl"
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{ duration: 10, repeat: Infinity }}
            />

            {/* Content — positioned above the blobs */}
            <div className="relative z-10">

              {/* Mail icon */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6 sm:mb-8">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              {/* Heading */}
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                {t('newsletter_heading')}
              </h2>

              {/* Subtitle / value proposition */}
              <p className="text-gray-400 text-sm sm:text-base max-w-lg mx-auto mb-8 sm:mb-10">
                {t('newsletter_subtitle')}
              </p>

              {submitted ? (
                /* ── SUCCESS STATE ──
                   Shown after form submission. Fades in with scale animation.
                */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center gap-2 text-green-400"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm sm:text-base font-medium">You&apos;re subscribed!</span>
                </motion.div>
              ) : (
                /* ── NEWSLETTER FORM ──
                   Email input + subscribe button.
                   Stacks on mobile, inline on sm+.
                */
                <>
                  <form
                    onSubmit={handleSubmit}
                    className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
                  >
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder={t('newsletter_placeholder')}
                      className="flex-1 min-w-0 px-5 py-3.5 rounded-full bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30 transition-colors"
                    />
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 sm:px-8 py-3.5 rounded-full bg-white text-black text-sm font-medium hover:bg-gray-100 transition-colors whitespace-nowrap"
                    >
                      {t('newsletter_button')}
                    </motion.button>
                  </form>

                  {/* Privacy note */}
                  <p className="text-xs text-gray-600 mt-4">
                    {t('newsletter_privacy')}
                  </p>
                </>
              )}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
