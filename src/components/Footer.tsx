/* ==========================================================================
 * Footer.tsx — Site-Wide Footer
 * ==========================================================================
 *
 * PURPOSE:
 *   Renders the footer that appears at the bottom of every page. It contains
 *   four columns: a brand/logo block, quick navigation links, social media
 *   links, and a newsletter signup form. Below those columns is a bottom bar
 *   with a copyright notice and a "Back to top" button.
 *
 * KEY BEHAVIORS:
 *   - The newsletter form currently prevents default submission (placeholder).
 *     You will need to wire up real form handling (API route, third-party
 *     service, etc.) when ready.
 *   - The "Back to top" button smoothly scrolls to the top of the page.
 *
 * REFERENCED FILES / ASSETS:
 *   - /public/logo.svg                  -> Footer logo image.
 *   - Translation namespace "footer"    -> Tagline, section headings,
 *                                          newsletter labels, copyright text.
 *                                          Lives in your locale JSON files
 *                                          (e.g., /messages/en.json -> "footer").
 *   - Translation namespace "nav"       -> Reuses the same link labels as
 *                                          the Navbar (home, projects, etc.).
 *
 * WHERE TO EDIT TEXT / IMAGES:
 *   - To change the logo         -> Replace /public/logo.svg or update `src`.
 *   - To change the tagline      -> Edit "footer.tagline" in locale JSON.
 *   - To change link labels      -> Edit the "nav" namespace in locale JSON.
 *   - To add/remove nav links    -> Edit the `links` array below.
 *   - To update social links     -> Edit the `socials` array below (change
 *                                    `href` from "#" to your real URLs).
 *   - To change newsletter text  -> Edit "footer.newsletter_title",
 *                                    "footer.newsletter_placeholder", and
 *                                    "footer.newsletter_button" in locale JSON.
 *   - To change the copyright    -> Edit "footer.copyright" in locale JSON.
 *                                    The year auto-updates via JS Date.
 *
 * ========================================================================== */

'use client';

/* --------------------------------------------------------------------------
 * Imports
 * --------------------------------------------------------------------------
 * Image            -> Next.js optimized image component for the footer logo.
 * Link             -> Next.js client-side navigation links.
 * useTranslations  -> next-intl hook to pull translated strings by namespace.
 * motion           -> Framer Motion for the "Back to top" hover animation.
 * -------------------------------------------------------------------------- */
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';

export function Footer() {
  /* --------------------------------------------------------------------------
   * Translation Hooks
   * --------------------------------------------------------------------------
   * t    -> Pulls from the "footer" namespace (tagline, headings, newsletter).
   * nav  -> Pulls from the "nav" namespace (reuses same link labels as Navbar).
   * -------------------------------------------------------------------------- */
  const t = useTranslations('footer');
  const nav = useTranslations('nav');

  /* --------------------------------------------------------------------------
   * Navigation Links Array
   * --------------------------------------------------------------------------
   * Mirrors the same pages as the Navbar. Labels come from the "nav" namespace.
   *
   * TO ADD A LINK:  Add a new object, e.g. { href: '/blog', label: nav('blog') }
   *                 and make sure the "blog" key exists in "nav" in locale JSON.
   * TO REMOVE:      Delete the corresponding object.
   * -------------------------------------------------------------------------- */
  const links = [
    { href: '/', label: nav('home') },
    { href: '/projects', label: nav('projects') },
    { href: '/about', label: nav('about') },
    { href: '/services', label: nav('services') },
    { href: '/team', label: nav('team') },
    { href: '/contact', label: nav('contact') },
  ];

  /* --------------------------------------------------------------------------
   * Legal Links Array
   * --------------------------------------------------------------------------
   * GDPR-required legal pages. Labels come from the "nav" namespace.
   * -------------------------------------------------------------------------- */
  const legalLinks = [
    { href: '/privacy', label: nav('privacy') },
    { href: '/terms', label: nav('terms') },
    { href: '/cookies', label: nav('cookies') },
    { href: '/data-rights', label: nav('data_rights') },
  ];

  /* --------------------------------------------------------------------------
   * Social Media Links Array
   * --------------------------------------------------------------------------
   * Each entry has a display `label` and an `href`.
   *
   * TO UPDATE SOCIAL URLS:
   *   Replace the "#" placeholder in `href` with your actual profile URLs.
   *   Example: { label: 'Twitter / X', href: 'https://x.com/yourstudio' }
   *
   * TO ADD / REMOVE A SOCIAL:
   *   Add or delete an object from this array.
   * -------------------------------------------------------------------------- */
  const socials = [
    { label: 'Twitter / X', href: '#' },
    { label: 'Instagram', href: '#' },
    { label: 'LinkedIn', href: '#' },
    { label: 'Dribbble', href: '#' },
  ];

  const [footerSubscribed, setFooterSubscribed] = useState(false);

  const handleFooterNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const email = new FormData(form).get('email');
    try {
      await fetch('/api/newsletter', {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: { 'Content-Type': 'application/json' },
      });
    } catch { /* ignore */ }
    setFooterSubscribed(true);
  };

  return (
    <footer className="border-t border-white/5 bg-black">
      {/* Max-width container with responsive padding */}
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">

        {/* ==============================================================
         * FOUR-COLUMN GRID
         * ==============================================================
         * Layout: 2 columns on mobile, 4 columns on large (lg) screens.
         * Columns: Brand | Quick Links | Socials | Newsletter
         * ============================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6">

          {/* ==============================================================
           * COLUMN 1: BRAND / LOGO
           * ==============================================================
           * Spans 2 columns on mobile / small screens, 1 column on large.
           * Shows the site logo (links to homepage) and a short tagline.
           *
           * TO CHANGE THE LOGO:
           *   Replace /public/logo.svg or change the `src` prop below.
           * TO CHANGE THE TAGLINE:
           *   Edit "footer.tagline" in your locale JSON files.
           * ============================================================== */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/logo.svg"
                alt="Blok Blok Studio"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              {t('tagline')}
            </p>
          </div>

          {/* ==============================================================
           * COLUMN 2: QUICK LINKS
           * ==============================================================
           * A vertical list of internal navigation links.
           * The heading text comes from "footer.quick_links" in locale JSON.
           * ============================================================== */}
          <div>
            <h4 className="text-sm font-medium mb-6 text-gray-300">
              {t('quick_links')}
            </h4>
            <ul className="space-y-3">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-500 hover:text-white transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ==============================================================
           * COLUMN 3: SOCIAL MEDIA LINKS
           * ==============================================================
           * External links that open in a new tab (target="_blank").
           * The heading text comes from "footer.connect" in locale JSON.
           *
           * TO UPDATE URLS: Change `href` values in the `socials` array above.
           * ============================================================== */}
          <div>
            <h4 className="text-sm font-medium mb-6 text-gray-300">
              {t('connect')}
            </h4>
            <ul className="space-y-3">
              {socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    className="text-sm text-gray-500 hover:text-white transition-colors duration-300"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ==============================================================
           * COLUMN 4: LEGAL LINKS
           * ==============================================================
           * GDPR-required legal pages (Privacy, Terms, Cookies, Data Rights).
           * ============================================================== */}
          <div>
            <h4 className="text-sm font-medium mb-6 text-gray-300">
              {t('legal')}
            </h4>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-500 hover:text-white transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ==============================================================
           * COLUMN 5: NEWSLETTER SIGNUP
           * ==============================================================
           * Spans 2 columns on mobile, 1 on large screens.
           * Contains an email input and a submit button.
           *
           * IMPORTANT: The form currently does nothing on submit
           * (e.preventDefault). To make it functional, replace the
           * onSubmit handler with your real logic (e.g., call an API route
           * or a third-party email service like Mailchimp / ConvertKit).
           *
           * Text comes from locale JSON:
           *   - "footer.newsletter_title"       -> Heading
           *   - "footer.newsletter_placeholder"  -> Input placeholder
           *   - "footer.newsletter_button"        -> Button label
           * ============================================================== */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1">
            <h4 className="text-sm font-medium mb-4 sm:mb-6 text-gray-300">
              {t('newsletter_title')}
            </h4>
            {footerSubscribed ? (
              <p className="text-green-400 text-sm flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Subscribed!
              </p>
            ) : (
              <form
                className="flex flex-col sm:flex-row gap-2"
                onSubmit={handleFooterNewsletter}
              >
                <input
                  type="email"
                  name="email"
                  required
                  placeholder={t('newsletter_placeholder')}
                  className="flex-1 min-w-0 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30 transition-colors"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors whitespace-nowrap"
                >
                  {t('newsletter_button')}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ==============================================================
         * BOTTOM BAR
         * ==============================================================
         * Sits below the four-column grid, separated by a thin border.
         * Left side:  Copyright notice with auto-updating year.
         * Right side: "Back to top" button that smooth-scrolls to top.
         *
         * TO CHANGE COPYRIGHT TEXT:
         *   Edit "footer.copyright" in your locale JSON files. The company
         *   name "Blok Blok Studio" is hardcoded below -- change it here
         *   if the company name changes.
         * ============================================================== */}
        <div className="mt-10 sm:mt-16 pt-6 sm:pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} Blok Blok Studio.{' '}
            {t('copyright')}
          </p>
          {/* "Back to top" button -- nudges up slightly on hover (whileHover) */}
          <motion.button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            whileHover={{ y: -2 }}
            className="text-xs text-gray-600 hover:text-white transition-colors"
          >
            Back to top &uarr;
          </motion.button>
        </div>
      </div>
    </footer>
  );
}
