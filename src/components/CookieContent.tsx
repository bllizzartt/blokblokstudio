/* ==========================================================================
 * CookieContent.tsx
 * ==========================================================================
 *
 * Cookie Policy Page -- Full page content
 *
 * This component renders the Cookie Policy page. Blok Blok Studio uses
 * minimal cookies (localStorage for consent preferences only), so this
 * policy is intentionally brief and transparent.
 *
 * Sections:
 *   1. Hero (title + last updated date)
 *   2. What Are Cookies
 *   3. Our Use of Cookies (localStorage only, no tracking)
 *   4. Third-Party Cookies (none currently)
 *   5. Managing Cookies
 *   6. Policy Updates
 *
 * All user-facing strings are pulled from the "cookies" translation namespace
 * via next-intl.
 * ========================================================================== */

'use client';

import { useTranslations } from 'next-intl';
import { AnimatedSection } from './AnimatedSection';
import { motion } from 'framer-motion';

export function CookieContent() {
  const t = useTranslations('cookies');

  return (
    <section className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-5 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">

        {/* ==================================================================
         * 1. HERO SECTION
         * ================================================================== */}
        <AnimatedSection className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6">
            Cookie Policy
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Last updated: February 13, 2026
          </p>
        </AnimatedSection>

        {/* ==================================================================
         * 2. WHAT ARE COOKIES
         * ================================================================== */}
        <AnimatedSection delay={0.1} className="mb-8 sm:mb-12">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold mb-4">What Are Cookies</h2>
            <p className="text-gray-400 leading-relaxed">
              Cookies are small text files that are stored on your device when you visit a website. They are
              widely used to make websites work more efficiently and provide information to website owners.
              Cookies can be "session" cookies (deleted when you close your browser) or "persistent" cookies
              (remain on your device for a set period).
            </p>
          </div>
        </AnimatedSection>

        {/* ==================================================================
         * 3. OUR USE OF COOKIES
         * ================================================================== */}
        <AnimatedSection delay={0.15} className="mb-8 sm:mb-12">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold mb-4">Our Use of Cookies</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              Blok Blok Studio takes a privacy-first approach. We use minimal cookies and tracking on our website:
            </p>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span><strong className="text-white">Cookie Consent Preference:</strong> We use localStorage to remember whether you have accepted or declined cookies. This is essential for complying with GDPR and respecting your choice.</span>
              </li>
            </ul>
            <p className="text-gray-400 leading-relaxed mt-4">
              <strong className="text-white">We do not use:</strong>
            </p>
            <ul className="space-y-2 text-gray-400 mt-2">
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span>Analytics or tracking cookies (e.g., Google Analytics)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span>Advertising cookies</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span>Third-party tracking scripts</span>
              </li>
            </ul>
          </div>
        </AnimatedSection>

        {/* ==================================================================
         * 4. THIRD-PARTY COOKIES
         * ================================================================== */}
        <AnimatedSection delay={0.2} className="mb-8 sm:mb-12">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold mb-4">Third-Party Cookies</h2>
            <p className="text-gray-400 leading-relaxed">
              We do not currently use any third-party cookies on our website. If this changes in the future,
              we will update this policy and provide clear information about any third-party services and their
              cookie usage.
            </p>
          </div>
        </AnimatedSection>

        {/* ==================================================================
         * 5. MANAGING COOKIES
         * ================================================================== */}
        <AnimatedSection delay={0.25} className="mb-8 sm:mb-12">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold mb-4">Managing Cookies</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              You have full control over cookies on your device:
            </p>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span><strong className="text-white">Browser Settings:</strong> Most web browsers allow you to control cookies through their settings. You can set your browser to refuse cookies or delete cookies that have already been set.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span><strong className="text-white">Our Cookie Banner:</strong> You can accept or decline cookies through the banner that appears on your first visit to our site.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span><strong className="text-white">Change Your Preference:</strong> Clear your browser's localStorage to reset your cookie consent preference.</span>
              </li>
            </ul>
            <p className="text-gray-400 leading-relaxed mt-4">
              Please note that blocking or deleting cookies may impact your experience on our website, though
              given our minimal use of cookies, the impact should be negligible.
            </p>
          </div>
        </AnimatedSection>

        {/* ==================================================================
         * 6. POLICY UPDATES
         * ================================================================== */}
        <AnimatedSection delay={0.3}>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold mb-4">Policy Updates</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              We may update this Cookie Policy from time to time to reflect changes in our practices or for
              legal or regulatory reasons. When we make changes, we will update the "Last updated" date at
              the top of this page.
            </p>
            <p className="text-gray-400 leading-relaxed">
              If you have questions about our use of cookies, please contact us at{' '}
              <a href="mailto:privacy@blokblok.studio" className="text-white hover:text-white/80 underline transition-colors">
                privacy@blokblok.studio
              </a>
            </p>
          </div>
        </AnimatedSection>

      </div>
    </section>
  );
}
