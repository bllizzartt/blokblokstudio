'use client';

import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  analytics: false,
  marketing: false,
};

export function CookieConsent() {
  const t = useTranslations('gdpr');
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const saveAndClose = (prefs: CookiePreferences) => {
    localStorage.setItem('cookie-consent', JSON.stringify(prefs));
    setShowBanner(false);
  };

  const handleAcceptAll = () => {
    saveAndClose({ essential: true, analytics: true, marketing: true });
  };

  const handleRejectAll = () => {
    saveAndClose({ essential: true, analytics: false, marketing: false });
  };

  const handleSavePreferences = () => {
    saveAndClose(preferences);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
        >
          <div className="max-w-2xl mx-auto">
            <div className="bg-black/95 backdrop-blur-lg border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl">

              {!showPreferences ? (
                /* ── Default view: brief message + 3 buttons ── */
                <>
                  <p className="text-white text-sm leading-relaxed mb-4">
                    {t('cookie_banner_text')}{' '}
                    <Link href="/privacy" className="text-gray-300 hover:text-white underline transition-colors">
                      {t('privacy_policy')}
                    </Link>{' '}
                    {t('and')}{' '}
                    <Link href="/cookies" className="text-gray-300 hover:text-white underline transition-colors">
                      {t('cookie_policy')}
                    </Link>.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button
                      onClick={handleRejectAll}
                      className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors text-sm font-medium"
                    >
                      Reject All
                    </button>
                    <button
                      onClick={() => setShowPreferences(true)}
                      className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors text-sm font-medium"
                    >
                      Manage Preferences
                    </button>
                    <button
                      onClick={handleAcceptAll}
                      className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-white text-black hover:bg-white/90 transition-colors text-sm font-medium"
                    >
                      Accept All
                    </button>
                  </div>
                </>
              ) : (
                /* ── Expanded view: category toggles ── */
                <>
                  <h3 className="text-white font-semibold mb-4">Cookie Preferences</h3>

                  <div className="space-y-3 mb-5">
                    {/* Essential — always on */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                      <div>
                        <p className="text-white text-sm font-medium">Essential</p>
                        <p className="text-gray-500 text-xs mt-0.5">Required for the website to function. Cannot be disabled.</p>
                      </div>
                      <div className="w-10 h-6 bg-white/20 rounded-full relative cursor-not-allowed">
                        <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full" />
                      </div>
                    </div>

                    {/* Analytics */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                      <div>
                        <p className="text-white text-sm font-medium">Analytics</p>
                        <p className="text-gray-500 text-xs mt-0.5">Help us understand how visitors interact with our website.</p>
                      </div>
                      <button
                        onClick={() => setPreferences(p => ({ ...p, analytics: !p.analytics }))}
                        className={`w-10 h-6 rounded-full relative transition-colors ${preferences.analytics ? 'bg-white/30' : 'bg-white/10'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${preferences.analytics ? 'right-1 bg-white' : 'left-1 bg-gray-500'}`} />
                      </button>
                    </div>

                    {/* Marketing */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                      <div>
                        <p className="text-white text-sm font-medium">Marketing</p>
                        <p className="text-gray-500 text-xs mt-0.5">Used to deliver relevant advertisements and track campaigns.</p>
                      </div>
                      <button
                        onClick={() => setPreferences(p => ({ ...p, marketing: !p.marketing }))}
                        className={`w-10 h-6 rounded-full relative transition-colors ${preferences.marketing ? 'bg-white/30' : 'bg-white/10'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${preferences.marketing ? 'right-1 bg-white' : 'left-1 bg-gray-500'}`} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button
                      onClick={() => setShowPreferences(false)}
                      className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors text-sm font-medium"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSavePreferences}
                      className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-white text-black hover:bg-white/90 transition-colors text-sm font-medium"
                    >
                      Save Preferences
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
