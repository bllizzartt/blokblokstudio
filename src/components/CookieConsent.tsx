/* ==========================================================================
 * CookieConsent.tsx
 * ==========================================================================
 *
 * Cookie Consent Banner -- GDPR-compliant cookie consent
 *
 * This component displays a fixed bottom banner on first visit asking users
 * to accept or decline cookies. The user's choice is stored in localStorage.
 *
 * Features:
 *   - Shows only on first visit (checks localStorage 'cookie-consent')
 *   - Accept/Decline buttons
 *   - Links to Privacy Policy and Cookie Policy pages
 *   - Smooth slide-up animation (framer-motion AnimatePresence)
 *   - Glass card styling consistent with site design
 *
 * How it works:
 *   1. On mount, checks localStorage for 'cookie-consent' key
 *   2. If not found, shows the banner
 *   3. User clicks Accept or Decline
 *   4. Choice is saved to localStorage ('accepted' or 'declined')
 *   5. Banner disappears and won't show again
 *
 * To reset: Clear localStorage in browser dev tools
 *
 * All user-facing strings come from the "gdpr" translation namespace.
 * ========================================================================== */

'use client';

import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export function CookieConsent() {
  const t = useTranslations('gdpr');
  const [showBanner, setShowBanner] = useState(false);

  /* ------------------------------------------------------------------
   * Check localStorage on mount
   * ------------------------------------------------------------------
   * If 'cookie-consent' doesn't exist, show the banner.
   * We use useEffect to avoid hydration mismatches (client-only check).
   * ------------------------------------------------------------------ */
  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      /* No consent recorded yet -- show the banner */
      setShowBanner(true);
    }
  }, []);

  /* ------------------------------------------------------------------
   * Handle Accept
   * ------------------------------------------------------------------
   * Stores 'accepted' in localStorage and hides the banner.
   * ------------------------------------------------------------------ */
  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShowBanner(false);
  };

  /* ------------------------------------------------------------------
   * Handle Decline
   * ------------------------------------------------------------------
   * Stores 'declined' in localStorage and hides the banner.
   * (Since we don't use tracking cookies, both options have the same
   * functional effect, but we respect the user's explicit choice.)
   * ------------------------------------------------------------------ */
  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        /* Fixed bottom banner with high z-index to stay above other content */
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
        >
          {/* Max-width container to prevent banner from being too wide on large screens */}
          <div className="max-w-6xl mx-auto">
            {/* Glass card with backdrop blur and border */}
            <div className="bg-black/90 backdrop-blur-lg border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

                {/* Left side: Banner text and links */}
                <div className="flex-1">
                  <p className="text-white text-sm sm:text-base leading-relaxed mb-2">
                    {t('cookie_banner_text')}{' '}
                    <Link href="/privacy" className="text-gray-300 hover:text-white underline transition-colors">
                      {t('privacy_policy')}
                    </Link>{' '}
                    {t('and')}{' '}
                    <Link href="/cookies" className="text-gray-300 hover:text-white underline transition-colors">
                      {t('cookie_policy')}
                    </Link>.
                  </p>
                </div>

                {/* Right side: Accept/Decline buttons */}
                <div className="flex gap-3 w-full sm:w-auto">
                  {/* Decline button -- secondary style */}
                  <button
                    onClick={handleDecline}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors text-sm font-medium"
                  >
                    {t('decline')}
                  </button>
                  {/* Accept button -- primary style */}
                  <button
                    onClick={handleAccept}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-white text-black hover:bg-white/90 transition-colors text-sm font-medium"
                  >
                    {t('accept')}
                  </button>
                </div>

              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
