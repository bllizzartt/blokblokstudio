/* ==========================================================================
 * PrivacyContent.tsx
 * ==========================================================================
 *
 * Privacy Policy Page -- Full page content
 *
 * This component renders the Privacy Policy page with GDPR-compliant
 * information about data collection, usage, and user rights.
 *
 * Sections:
 *   1. Hero (title + last updated date)
 *   2. Introduction
 *   3. What Data We Collect
 *   4. How We Use Your Data
 *   5. Third-Party Services
 *   6. Data Retention
 *   7. Your Rights under GDPR
 *   8. Contact Information
 *
 * All user-facing strings are pulled from the "privacy" translation namespace
 * via next-intl.
 * ========================================================================== */

'use client';

import { useTranslations } from 'next-intl';
import { AnimatedSection } from './AnimatedSection';
import Link from 'next/link';

export function PrivacyContent() {
  const t = useTranslations('privacy');

  return (
    <section className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-5 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">

        {/* ==================================================================
         * 1. HERO SECTION
         * ================================================================== */}
        <AnimatedSection className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6">
            Privacy Policy
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Last updated: February 13, 2026
          </p>
        </AnimatedSection>

        {/* ==================================================================
         * 2. INTRODUCTION
         * ================================================================== */}
        <AnimatedSection delay={0.1} className="mb-8 sm:mb-12">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold mb-4">Introduction</h2>
            <p className="text-gray-400 leading-relaxed">
              At Blok Blok Studio, we respect your privacy and are committed to protecting your personal data.
              This privacy policy explains how we collect, use, and safeguard your information when you visit
              our website or use our services. This policy complies with the General Data Protection Regulation
              (GDPR) and other applicable data protection laws.
            </p>
          </div>
        </AnimatedSection>

        {/* ==================================================================
         * 3. WHAT DATA WE COLLECT
         * ================================================================== */}
        <AnimatedSection delay={0.15} className="mb-8 sm:mb-12">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold mb-4">What Data We Collect</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              We collect the following types of personal information:
            </p>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span><strong className="text-white">Contact Information:</strong> Name, email address, phone number</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span><strong className="text-white">Business Information:</strong> Company name, industry, website URL</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span><strong className="text-white">Project Details:</strong> Information you provide about your project requirements</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span><strong className="text-white">Technical Data:</strong> IP address (for cookie consent tracking only)</span>
              </li>
            </ul>
          </div>
        </AnimatedSection>

        {/* ==================================================================
         * 4. HOW WE USE YOUR DATA
         * ================================================================== */}
        <AnimatedSection delay={0.2} className="mb-8 sm:mb-12">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold mb-4">How We Use Your Data</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              We use your personal information for the following purposes:
            </p>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span><strong className="text-white">Responding to Inquiries:</strong> To answer your questions and provide information about our services</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span><strong className="text-white">Service Delivery:</strong> To provide and manage the services you request</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span><strong className="text-white">Marketing Communications:</strong> To send you updates about our services (only with your explicit consent)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span><strong className="text-white">Service Improvement:</strong> To analyze and improve our website and services</span>
              </li>
            </ul>
          </div>
        </AnimatedSection>

        {/* ==================================================================
         * 5. THIRD-PARTY SERVICES
         * ================================================================== */}
        <AnimatedSection delay={0.25} className="mb-8 sm:mb-12">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold mb-4">Third-Party Services</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              We use the following third-party services to process your data:
            </p>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span><strong className="text-white">Resend:</strong> For email delivery and communication</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span><strong className="text-white">Telegram:</strong> For internal notifications about new inquiries</span>
              </li>
            </ul>
            <p className="text-gray-400 leading-relaxed mt-4">
              These services are GDPR-compliant and process your data according to their own privacy policies.
              We do not use tracking cookies or analytics services.
            </p>
          </div>
        </AnimatedSection>

        {/* ==================================================================
         * 6. DATA RETENTION
         * ================================================================== */}
        <AnimatedSection delay={0.3} className="mb-8 sm:mb-12">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold mb-4">Data Retention</h2>
            <p className="text-gray-400 leading-relaxed">
              We retain your personal data only for as long as necessary to fulfill the purposes outlined in
              this policy, unless a longer retention period is required by law. You may request deletion of
              your data at any time, and we will comply within 30 days unless we have a legal obligation to
              retain it. Typically, we retain your data until you request deletion or until our business
              relationship ends.
            </p>
          </div>
        </AnimatedSection>

        {/* ==================================================================
         * 7. YOUR RIGHTS UNDER GDPR
         * ================================================================== */}
        <AnimatedSection delay={0.35} className="mb-8 sm:mb-12">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold mb-4">Your Rights under GDPR</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              Under the General Data Protection Regulation (GDPR), you have the following rights:
            </p>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span><strong className="text-white">Right to Access:</strong> Request a copy of the personal data we hold about you</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span><strong className="text-white">Right to Rectification:</strong> Request correction of inaccurate or incomplete data</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span><strong className="text-white">Right to Erasure:</strong> Request deletion of your personal data</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span><strong className="text-white">Right to Object:</strong> Object to processing of your personal data</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span><strong className="text-white">Right to Data Portability:</strong> Request a copy of your data in a machine-readable format</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span><strong className="text-white">Right to Withdraw Consent:</strong> Withdraw consent for marketing communications at any time</span>
              </li>
            </ul>
            <p className="text-gray-400 leading-relaxed mt-4">
              To exercise any of these rights, please visit our{' '}
              <Link href="/data-rights" className="text-white hover:text-white/80 underline transition-colors">
                Data Rights Request page
              </Link>
              {' '}or contact us using the information below.
            </p>
          </div>
        </AnimatedSection>

        {/* ==================================================================
         * 8. LEGAL BASIS FOR PROCESSING
         * ================================================================== */}
        <AnimatedSection delay={0.4} className="mb-8 sm:mb-12">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold mb-4">Legal Basis for Processing</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              Under Article 6 of the GDPR, we process your personal data based on the following legal grounds:
            </p>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">&bull;</span>
                <span><strong className="text-white">Consent (Art. 6(1)(a)):</strong> When you subscribe to our newsletter or submit a contact form with explicit consent</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">&bull;</span>
                <span><strong className="text-white">Contractual Necessity (Art. 6(1)(b)):</strong> When processing is necessary to fulfill a service agreement with you</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">&bull;</span>
                <span><strong className="text-white">Legitimate Interest (Art. 6(1)(f)):</strong> For internal analytics, improving our services, and protecting the security of our website</span>
              </li>
            </ul>
            <p className="text-gray-400 leading-relaxed mt-4">
              You may withdraw your consent at any time without affecting the lawfulness of processing carried out before withdrawal.
            </p>
          </div>
        </AnimatedSection>

        {/* ==================================================================
         * 9. INTERNATIONAL DATA TRANSFERS
         * ================================================================== */}
        <AnimatedSection delay={0.45} className="mb-8 sm:mb-12">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold mb-4">International Data Transfers</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              Some of our third-party service providers may process your data outside the European Economic Area (EEA). When this occurs, we ensure appropriate safeguards are in place:
            </p>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">&bull;</span>
                <span><strong className="text-white">Vercel:</strong> Our hosting provider may process data in the United States. Vercel complies with applicable data protection frameworks.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">&bull;</span>
                <span><strong className="text-white">Resend:</strong> Our email delivery provider may process data in the United States. Transfers are covered by Standard Contractual Clauses (SCCs).</span>
              </li>
            </ul>
            <p className="text-gray-400 leading-relaxed mt-4">
              We only transfer data to countries or organizations that provide an adequate level of protection or where appropriate safeguards (such as SCCs or binding corporate rules) are in place.
            </p>
          </div>
        </AnimatedSection>

        {/* ==================================================================
         * 10. SUPERVISORY AUTHORITY
         * ================================================================== */}
        <AnimatedSection delay={0.5} className="mb-8 sm:mb-12">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold mb-4">Supervisory Authority</h2>
            <p className="text-gray-400 leading-relaxed">
              If you believe that our processing of your personal data violates the GDPR, you have the right to lodge a complaint with a supervisory authority in the EU member state of your habitual residence, place of work, or place of the alleged infringement. You may also contact us first so we can try to resolve the issue directly.
            </p>
          </div>
        </AnimatedSection>

        {/* ==================================================================
         * 11. CONTACT INFORMATION
         * ================================================================== */}
        <AnimatedSection delay={0.55}>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              If you have any questions about this Privacy Policy or how we handle your personal data,
              please contact us at:
            </p>
            <p className="text-white">
              <strong>Email:</strong>{' '}
              <a href="mailto:hello@blokblokstudio.com" className="hover:text-white/80 transition-colors">
                hello@blokblokstudio.com
              </a>
            </p>
          </div>
        </AnimatedSection>

      </div>
    </section>
  );
}
