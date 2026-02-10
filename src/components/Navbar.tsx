/* ==========================================================================
 * Navbar.tsx — Main Site Navigation Bar
 * ==========================================================================
 *
 * PURPOSE:
 *   Renders the fixed navigation bar at the top of every page. Includes a
 *   desktop horizontal link menu, a call-to-action button, and a full-screen
 *   mobile menu overlay with animated hamburger toggle.
 *
 * KEY BEHAVIORS:
 *   - Slides down on initial page load (Framer Motion animation).
 *   - Gains a blurred dark background once the user scrolls past 50px.
 *   - Active page link is highlighted with a white underline indicator.
 *   - Mobile menu auto-closes whenever the route changes.
 *
 * REFERENCED FILES / ASSETS:
 *   - /public/logo.svg              -> Site logo image displayed in the navbar.
 *   - Translation namespace "nav"   -> All link labels come from the "nav"
 *                                      key inside your locale JSON files
 *                                      (e.g., /messages/en.json -> "nav").
 *
 * WHERE TO EDIT TEXT / IMAGES:
 *   - To change the logo       -> Replace /public/logo.svg (keep the same
 *                                  filename) or update the `src` prop below.
 *   - To change link labels    -> Edit the "nav" namespace in your locale
 *                                  JSON files (home, projects, about, etc.).
 *   - To add/remove nav links  -> Edit the `links` array inside this component.
 *   - To change the CTA button -> Look for the "CTA Button - Desktop" section.
 *
 * ========================================================================== */

'use client';

/* --------------------------------------------------------------------------
 * Imports
 * --------------------------------------------------------------------------
 * useState / useEffect  -> React hooks for local state and side effects.
 * Image                 -> Next.js optimized image component.
 * Link                  -> Next.js client-side navigation (no full reload).
 * usePathname           -> Returns the current URL path for active-link styling.
 * useTranslations       -> next-intl hook to pull translated strings.
 * motion / AnimatePresence -> Framer Motion animation primitives.
 * -------------------------------------------------------------------------- */
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';

export function Navbar() {
  /* --------------------------------------------------------------------------
   * Translation & Routing Hooks
   * --------------------------------------------------------------------------
   * t         -> Pulls strings from the "nav" namespace in locale JSON files.
   *              Example keys: t('home'), t('projects'), t('contact'), etc.
   * pathname  -> The current URL path (e.g., "/" or "/about"), used to
   *              highlight the active link.
   * -------------------------------------------------------------------------- */
  const t = useTranslations('nav');
  const pathname = usePathname();

  /* --------------------------------------------------------------------------
   * Local State
   * --------------------------------------------------------------------------
   * isOpen     -> Controls whether the mobile menu overlay is visible.
   * isScrolled -> Becomes true once the user scrolls down more than 50px;
   *               triggers the dark/blurred navbar background.
   * -------------------------------------------------------------------------- */
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  /* --------------------------------------------------------------------------
   * Scroll Listener
   * --------------------------------------------------------------------------
   * Attaches a scroll event listener on mount. When scrollY exceeds 50px,
   * `isScrolled` flips to true and the navbar background changes.
   * The listener is cleaned up on unmount to prevent memory leaks.
   * -------------------------------------------------------------------------- */
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* --------------------------------------------------------------------------
   * Close Mobile Menu on Route Change
   * --------------------------------------------------------------------------
   * Whenever `pathname` changes (user navigates to a new page), the mobile
   * menu is automatically closed so it does not remain open on the new page.
   * -------------------------------------------------------------------------- */
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  /* --------------------------------------------------------------------------
   * Navigation Links Array
   * --------------------------------------------------------------------------
   * Each object has:
   *   href  -> The route path this link points to.
   *   label -> The translated display text pulled from the "nav" namespace.
   *
   * TO ADD A NEW LINK:
   *   1. Add a new object here, e.g. { href: '/blog', label: t('blog') }.
   *   2. Add the matching key ("blog") to the "nav" namespace in every
   *      locale JSON file (e.g., /messages/en.json).
   *
   * TO REMOVE A LINK:
   *   Simply delete the corresponding object from this array.
   * -------------------------------------------------------------------------- */
  const links = [
    { href: '/', label: t('home') },
    { href: '/projects', label: t('projects') },
    { href: '/about', label: t('about') },
    { href: '/services', label: t('services') },
    { href: '/team', label: t('team') },
    { href: '/contact', label: t('contact') },
  ];

  return (
    <>
      {/* ================================================================
       * DESKTOP & MOBILE TOP BAR
       * ================================================================
       * This <motion.nav> is the fixed bar pinned to the top of the viewport.
       * - initial={{ y: -100 }} / animate={{ y: 0 }} -> slides down on load.
       * - The className toggles between transparent and blurred black
       *   depending on `isScrolled`.
       * ================================================================ */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'bg-black/80 backdrop-blur-xl border-b border-white/5'
            : 'bg-transparent'
        }`}
      >
        {/* Max-width container keeps content centered on large screens */}
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">

            {/* ==============================================================
             * LOGO
             * ==============================================================
             * Displays the site logo. Links back to the homepage ("/").
             *
             * TO CHANGE THE LOGO:
             *   - Replace /public/logo.svg with your new logo file, or
             *   - Update the `src` prop to point to a different image.
             *   - Adjust `width`, `height`, and the className sizing
             *     (h-8 / sm:h-10) as needed.
             * ============================================================== */}
            <Link href="/" className="relative z-50">
              <Image
                src="/logo.svg"
                alt="Blok Blok Studio"
                width={120}
                height={40}
                className="h-8 sm:h-10 w-auto"
                priority
              />
            </Link>

            {/* ==============================================================
             * DESKTOP NAVIGATION LINKS
             * ==============================================================
             * Hidden on small screens (hidden md:flex). Renders each link
             * from the `links` array as a horizontal menu item.
             *
             * Active link detection:
             *   - If `pathname === link.href`, the text is white and a small
             *     animated underline (layoutId="navbar-indicator") appears.
             *   - Otherwise the text is gray, turning white on hover.
             * ============================================================== */}
            <div className="hidden md:flex items-center gap-5 lg:gap-8">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative group"
                >
                  <span
                    className={`text-sm tracking-wide transition-colors duration-300 ${
                      pathname === link.href
                        ? 'text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {link.label}
                  </span>
                  {/* Animated underline indicator for the currently active page */}
                  {pathname === link.href && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute -bottom-1 left-0 right-0 h-px bg-white"
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </Link>
              ))}
            </div>

            {/* ==============================================================
             * CTA BUTTON (Desktop Only)
             * ==============================================================
             * A rounded "Contact" button shown only on medium+ screens.
             * Links to /contact. On hover it inverts to white bg / black text.
             *
             * TO CHANGE THE CTA DESTINATION:
             *   Update the `href` prop.
             * TO CHANGE THE CTA LABEL:
             *   Update the "contact" key inside the "nav" namespace of your
             *   locale JSON, or replace {t('contact')} with static text.
             * ============================================================== */}
            <div className="hidden md:block">
              <Link
                href="/contact"
                className="px-5 py-2.5 rounded-full border border-white/20 text-sm hover:bg-white hover:text-black transition-all duration-300"
              >
                {t('contact')}
              </Link>
            </div>

            {/* ==============================================================
             * MOBILE HAMBURGER TOGGLE BUTTON
             * ==============================================================
             * Visible only on screens smaller than `md` (md:hidden).
             * Three <motion.span> bars animate into an "X" when isOpen is
             * true (rotate + translate), and back to three bars when closed.
             * Toggling sets `isOpen` which controls the mobile overlay below.
             * ============================================================== */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="relative z-50 md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5"
              aria-label="Toggle menu"
            >
              {/* Top bar: rotates 45deg and shifts down when open */}
              <motion.span
                animate={{
                  rotate: isOpen ? 45 : 0,
                  y: isOpen ? 6 : 0,
                }}
                className="w-6 h-px bg-white block"
              />
              {/* Middle bar: fades out when open */}
              <motion.span
                animate={{ opacity: isOpen ? 0 : 1 }}
                className="w-6 h-px bg-white block"
              />
              {/* Bottom bar: rotates -45deg and shifts up when open */}
              <motion.span
                animate={{
                  rotate: isOpen ? -45 : 0,
                  y: isOpen ? -6 : 0,
                }}
                className="w-6 h-px bg-white block"
              />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ================================================================
       * MOBILE MENU OVERLAY
       * ================================================================
       * Full-screen dark overlay that appears when `isOpen` is true.
       * Only renders on screens smaller than `md` (md:hidden).
       *
       * AnimatePresence enables exit animations so the menu fades out
       * gracefully instead of disappearing instantly.
       *
       * Each link staggers in with a delay based on its index (i * 0.1s).
       * Clicking any link calls setIsOpen(false) to close the overlay.
       * ================================================================ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-black/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col items-center justify-center h-full gap-8">
              {links.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                >
                  <Link
                    href={link.href}
                    className={`text-3xl font-light tracking-wide ${
                      pathname === link.href ? 'text-white' : 'text-gray-500'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
