/* ==========================================================================
 * TermsContent.tsx
 * ==========================================================================
 *
 * Terms of Service Page -- Full page content
 *
 * This component renders the Terms of Service page with clear terms
 * governing the use of Blok Blok Studio services.
 *
 * Sections:
 *   1. Hero (title + last updated date)
 *   2. Acceptance of Terms
 *   3. Services Description
 *   4. User Responsibilities
 *   5. Intellectual Property
 *   6. Limitation of Liability
 *   7. Governing Law
 *   8. Changes to Terms
 *
 * All user-facing strings are pulled from the "terms" translation namespace
 * via next-intl.
 * ========================================================================== */

'use client';

import { useTranslations } from 'next-intl';
import { AnimatedSection } from './AnimatedSection';
import { motion } from 'framer-motion';

export function TermsContent() {
  const t = useTranslations('terms');

  return (
    <section className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-5 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">

        {/* ==================================================================
         * 1. HERO SECTION
         * ================================================================== */}
        <AnimatedSection className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6">
            Terms of Service
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Last updated: February 13, 2026
          </p>
        </AnimatedSection>

        {/* ==================================================================
         * 2. ACCEPTANCE OF TERMS
         * ================================================================== */}
        <AnimatedSection delay={0.1} className="mb-8 sm:mb-12">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold mb-4">Acceptance of Terms</h2>
            <p className="text-gray-400 leading-relaxed">
              By accessing and using the Blok Blok Studio website and services, you accept and agree to be
              bound by these Terms of Service. If you do not agree to these terms, please do not use our
              website or services. These terms apply to all visitors, users, and others who access or use
              our services.
            </p>
          </div>
        </AnimatedSection>

        {/* ==================================================================
         * 3. SERVICES DESCRIPTION
         * ================================================================== */}
        <AnimatedSection delay={0.15} className="mb-8 sm:mb-12">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold mb-4">Services Description</h2>
            <p className="text-gray-400 leading-relaxed">
              Blok Blok Studio provides digital design and development services, including but not limited to
              web design, web development, branding, and digital strategy. The specific scope of services will
              be defined in individual project agreements or statements of work. We reserve the right to modify,
              suspend, or discontinue any aspect of our services at any time without prior notice.
            </p>
          </div>
        </AnimatedSection>

        {/* ==================================================================
         * 4. USER RESPONSIBILITIES
         * ================================================================== */}
        <AnimatedSection delay={0.2} className="mb-8 sm:mb-12">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold mb-4">User Responsibilities</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              When using our services, you agree to:
            </p>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span>Provide accurate, current, and complete information</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span>Maintain the security and confidentiality of any account credentials</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span>Not use our services for any unlawful or prohibited purposes</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span>Not interfere with or disrupt the integrity or performance of our services</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span>Comply with all applicable laws and regulations</span>
              </li>
            </ul>
          </div>
        </AnimatedSection>

        {/* ==================================================================
         * 5. INTELLECTUAL PROPERTY
         * ================================================================== */}
        <AnimatedSection delay={0.25} className="mb-8 sm:mb-12">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold mb-4">Intellectual Property</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              All content on the Blok Blok Studio website, including text, graphics, logos, images, and
              software, is the property of Blok Blok Studio or its content suppliers and is protected by
              international copyright laws.
            </p>
            <p className="text-gray-400 leading-relaxed">
              For client projects, intellectual property rights will be defined in the project agreement.
              Upon full payment, clients typically receive ownership of the final deliverables, while
              Blok Blok Studio retains the right to showcase the work in our portfolio and marketing materials
              unless otherwise agreed in writing.
            </p>
          </div>
        </AnimatedSection>

        {/* ==================================================================
         * 6. LIMITATION OF LIABILITY
         * ================================================================== */}
        <AnimatedSection delay={0.3} className="mb-8 sm:mb-12">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold mb-4">Limitation of Liability</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              To the fullest extent permitted by law, Blok Blok Studio shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages, including but not limited to loss of
              profits, data, use, or goodwill, arising from:
            </p>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span>Your access to or use of or inability to access or use our services</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span>Any conduct or content of any third party on our services</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span>Unauthorized access, use, or alteration of your transmissions or content</span>
              </li>
            </ul>
            <p className="text-gray-400 leading-relaxed mt-4">
              Our total liability for any claims under these terms shall not exceed the amount paid by you
              to Blok Blok Studio for the services in question.
            </p>
          </div>
        </AnimatedSection>

        {/* ==================================================================
         * 7. GOVERNING LAW
         * ================================================================== */}
        <AnimatedSection delay={0.35} className="mb-8 sm:mb-12">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold mb-4">Governing Law</h2>
            <p className="text-gray-400 leading-relaxed">
              These Terms of Service shall be governed by and construed in accordance with the laws of the
              jurisdiction in which Blok Blok Studio operates, without regard to its conflict of law provisions.
              Any disputes arising from these terms or your use of our services shall be resolved in the courts
              of that jurisdiction.
            </p>
          </div>
        </AnimatedSection>

        {/* ==================================================================
         * 8. CHANGES TO TERMS
         * ================================================================== */}
        <AnimatedSection delay={0.4}>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold mb-4">Changes to Terms</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              We reserve the right to modify these Terms of Service at any time. If we make material changes,
              we will notify you by updating the "Last updated" date at the top of this page. Your continued
              use of our services after such modifications constitutes your acceptance of the updated terms.
            </p>
            <p className="text-gray-400 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at{' '}
              <a href="mailto:legal@blokblok.studio" className="text-white hover:text-white/80 underline transition-colors">
                legal@blokblok.studio
              </a>
            </p>
          </div>
        </AnimatedSection>

      </div>
    </section>
  );
}
