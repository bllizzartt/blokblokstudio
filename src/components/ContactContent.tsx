/**
 * ============================================================================
 * ContactContent.tsx — Full /contact Page Component
 * ============================================================================
 *
 * PURPOSE:
 *   Renders the entire Contact page, including:
 *     1. A page header (title + subtitle)
 *     2. A contact form (name, email, company, message, submit button)
 *     3. A sidebar with contact info (email, phone, address) and a map placeholder
 *     4. A success message shown after form submission
 *
 * IMPORTANT — FORM DOES NOT SEND DATA:
 *   The form's handleSubmit currently just sets `submitted = true` to show
 *   the success message. It does NOT actually send the form data anywhere.
 *   You MUST integrate a backend service (API route, email service, etc.)
 *   to make the form functional. See the handleSubmit function below for
 *   where to add that logic.
 *
 * TRANSLATIONS:
 *   All user-facing text comes from the "contact" namespace in your
 *   translation JSON files (e.g., messages/en.json under "contact").
 *   Keys used:
 *     - contact.title        → page heading
 *     - contact.subtitle     → page subheading
 *     - contact.name         → name field label + placeholder
 *     - contact.email        → email field label + placeholder
 *     - contact.company      → company field label + placeholder
 *     - contact.message      → message field label + placeholder
 *     - contact.submit       → submit button text
 *     - contact.success      → success message heading
 *     - contact.info_title   → sidebar heading ("Contact Info" etc.)
 *     - contact.info_email   → displayed email address
 *     - contact.info_phone   → displayed phone number
 *     - contact.info_address → displayed physical address
 *
 * TO EDIT TEXT:
 *   - Page title/subtitle → edit "contact.title" / "contact.subtitle" in translation files
 *   - Form labels → edit "contact.name", "contact.email", etc.
 *   - Contact info → edit "contact.info_email", "contact.info_phone", "contact.info_address"
 *   - Success message → edit "contact.success"
 *
 * TO REPLACE THE MAP PLACEHOLDER:
 *   The map area at the bottom of the sidebar is currently a styled
 *   placeholder. Replace the placeholder div with an actual map embed
 *   (Google Maps iframe, Mapbox component, etc.). See the inline comment
 *   in the map section below.
 *
 * REFERENCED FILES / DEPENDENCIES:
 *   - ./AnimatedSection   → scroll-triggered reveal animation wrapper
 *   - next-intl           → i18n translation hook (useTranslations)
 *   - framer-motion       → animation library (motion for button + success message)
 *
 * STYLING:
 *   - Uses Tailwind CSS utility classes throughout.
 *   - "glass-card" is a custom utility class for the frosted-glass card look.
 *   - Responsive breakpoints: sm (640px), md (768px), lg (1024px).
 *   - Layout: 5-column grid on lg — form takes 3 cols, sidebar takes 2 cols.
 *
 * ============================================================================
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AnimatedSection } from './AnimatedSection';
import { motion } from 'framer-motion';

/**
 * ---------------------------------------------------------------------------
 * ContactContent Component
 * ---------------------------------------------------------------------------
 * Main export. Renders the full /contact page layout with form + sidebar.
 * ---------------------------------------------------------------------------
 */
export function ContactContent() {
  /**
   * Translation hook — pulls all keys from the "contact" namespace.
   * To change any displayed text, edit your translation JSON files
   * (e.g., messages/en.json → "contact": { ... }).
   */
  const t = useTranslations('contact');

  /**
   * Submission state — controls whether to show the form or the success message.
   * Set to `true` after the user clicks Submit.
   */
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const res = await fetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          company: formData.get('company'),
          message: formData.get('message'),
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    /**
     * Outer section wrapper.
     * - pt-24 / sm:pt-32 → top padding (room for the fixed navbar)
     * - pb-16 / sm:pb-24 → bottom padding
     * - px-5 / sm:px-6 / lg:px-8 → horizontal padding
     */
    <section className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-5 sm:px-6 lg:px-8">
      {/* Max-width container — keeps content centered on wide screens */}
      <div className="max-w-7xl mx-auto">

        {/* ================================================================
            SECTION 1: Page Header (Title + Subtitle)
            ================================================================
            TO EDIT: Change "contact.title" and "contact.subtitle" in
            your translation files.
        */}
        <AnimatedSection className="text-center mb-12 sm:mb-16 lg:mb-20">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6">
            {t('title')}
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </AnimatedSection>

        {/* ================================================================
            MAIN LAYOUT: 5-Column Grid
            ================================================================
            On desktop (lg+):
              - Left side (3 cols): Contact form or success message
              - Right side (2 cols): Sidebar with contact info + map
            On mobile: stacks vertically (single column).
        */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 sm:gap-12 lg:gap-16">

          {/* ==============================================================
              LEFT COLUMN: Contact Form / Success Message (3 of 5 cols)
              ==============================================================
          */}
          <AnimatedSection className="lg:col-span-3">
            {submitted ? (
              /* --------------------------------------------------------
                 SUCCESS MESSAGE
                 --------------------------------------------------------
                 Shown after the form is submitted. Animates in with
                 a fade + slight scale-up via framer-motion.

                 TO EDIT: Change "contact.success" in translation files
                 to update the success heading text.
              */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center"
              >
                {/* Green checkmark icon */}
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-8 h-8 text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                {/* Success heading text from translations */}
                <h3 className="text-2xl font-semibold mb-2">{t('success')}</h3>
              </motion.div>
            ) : (
              /* --------------------------------------------------------
                 CONTACT FORM
                 --------------------------------------------------------
                 Contains: Name, Email, Company, Message, Submit button.
                 All labels and placeholders come from translations.

                 NOTE: The form does NOT send data — see handleSubmit above.
                 You need to add backend integration to make it work.
              */
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">

                {/* Name + Email fields — side by side on sm+ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

                  {/* Name field (required) */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      {t('name')}
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-sm sm:text-base text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30 transition-colors"
                      placeholder={t('name')}
                    />
                  </div>

                  {/* Email field (required) */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      {t('email')}
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-sm sm:text-base text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30 transition-colors"
                      placeholder={t('email')}
                    />
                  </div>
                </div>

                {/* Company field (optional) */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {t('company')}
                  </label>
                  <input
                    type="text"
                    name="company"
                    className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30 transition-colors"
                    placeholder={t('company')}
                  />
                </div>

                {/* Message textarea (required) */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {t('message')}
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={6}
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-sm sm:text-base text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30 transition-colors resize-none"
                    placeholder={t('message')}
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}

                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto px-10 py-4 rounded-full bg-white text-black font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Sending...' : t('submit')}
                </motion.button>
              </form>
            )}
          </AnimatedSection>

          {/* ==============================================================
              RIGHT COLUMN: Contact Info Sidebar (2 of 5 cols)
              ==============================================================
              Contains:
                - Contact info heading
                - Email, Phone, and Address blocks (each with an icon)
                - A map placeholder at the bottom
          */}
          <AnimatedSection delay={0.2} className="lg:col-span-2">
            <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-6 sm:space-y-8">

              {/* Sidebar heading — from "contact.info_title" */}
              <h3 className="text-lg font-semibold">{t('info_title')}</h3>

              {/* Contact info rows (email, phone, address) */}
              <div className="space-y-6">

                {/* --------------------------------------------------
                    EMAIL ROW
                    --------------------------------------------------
                    Icon: envelope/mail SVG
                    TO EDIT: Change "contact.info_email" in translation files.
                    The value is used as both the display text and the
                    mailto: link href.
                */}
                <div className="flex items-start gap-4">
                  {/* Email icon container */}
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Email</p>
                    {/* Clickable mailto link using the translated email address */}
                    <a
                      href={`mailto:${t('info_email')}`}
                      className="text-sm hover:text-white transition-colors"
                    >
                      {t('info_email')}
                    </a>
                  </div>
                </div>

                {/* --------------------------------------------------
                    PHONE ROW
                    --------------------------------------------------
                    Icon: phone SVG
                    TO EDIT: Change "contact.info_phone" in translation files.
                    The value is used as both the display text and the
                    tel: link href.
                */}
                <div className="flex items-start gap-4">
                  {/* Phone icon container */}
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Phone</p>
                    {/* Clickable tel link using the translated phone number */}
                    <a
                      href={`tel:${t('info_phone')}`}
                      className="text-sm hover:text-white transition-colors"
                    >
                      {t('info_phone')}
                    </a>
                  </div>
                </div>

                {/* --------------------------------------------------
                    ADDRESS / LOCATION ROW
                    --------------------------------------------------
                    Icon: map pin SVG
                    TO EDIT: Change "contact.info_address" in translation files.
                    This is plain text (not a link).
                */}
                <div className="flex items-start gap-4">
                  {/* Location pin icon container */}
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Location</p>
                    <p className="text-sm">{t('info_address')}</p>
                  </div>
                </div>
              </div>

              {/* ----------------------------------------------------------
                  MAP PLACEHOLDER
                  ----------------------------------------------------------
                  Currently shows a styled placeholder with a map icon.
                  This does NOT display a real map.

                  TO REPLACE WITH A REAL MAP:
                    Remove or replace the contents of this div with an
                    actual map component or iframe. For example:

                    Google Maps embed:
                      <iframe
                        src="https://www.google.com/maps/embed?pb=YOUR_EMBED_PARAMS"
                        className="w-full h-full border-0"
                        allowFullScreen
                        loading="lazy"
                      />

                    Or use a library like react-leaflet, @vis.gl/react-google-maps, etc.
              */}
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden relative">
                {/* Subtle grid pattern overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />
                {/* Centered placeholder icon + "Map" label */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <svg
                      className="w-8 h-8 text-white/15 mx-auto mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                      />
                    </svg>
                    <p className="text-xs text-white/15">Map</p>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
