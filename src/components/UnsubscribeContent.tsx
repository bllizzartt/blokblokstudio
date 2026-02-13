/* ==========================================================================
 * UnsubscribeContent.tsx — One-Click Unsubscribe Page
 * ==========================================================================
 *
 * PURPOSE:
 *   Handles the unsubscribe flow when a user clicks the unsubscribe link
 *   in a marketing email. Reads the token from the URL query param,
 *   calls the /api/unsubscribe endpoint, and shows the result.
 *
 * URL FORMAT: /unsubscribe?token=<unsubscribeToken>
 *
 * ========================================================================== */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import Link from 'next/link';

function UnsubscribeHandler() {
  const t = useTranslations('unsubscribe');
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'invalid'>('loading');
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }

    fetch('/api/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus('success');
          setEmail(data.email || '');
        } else {
          setStatus('error');
        }
      })
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        {/* Loading State */}
        {status === 'loading' && (
          <div>
            <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-6" />
            <p className="text-gray-400">{t('processing')}</p>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div>
            <div className="h-16 w-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="h-8 w-8 text-green-500"
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
            <h1 className="text-3xl font-bold mb-4">{t('success_title')}</h1>
            <p className="text-gray-400 mb-2">{t('success_message')}</p>
            {email && <p className="text-sm text-gray-500">{email}</p>}
            <Link
              href="/"
              className="inline-block mt-8 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors"
            >
              {t('back_home')}
            </Link>
          </div>
        )}

        {/* Error / Invalid State */}
        {(status === 'error' || status === 'invalid') && (
          <div>
            <div className="h-16 w-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="h-8 w-8 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-4">{t('error_title')}</h1>
            <p className="text-gray-400">{t('error_message')}</p>
            <Link
              href="/"
              className="inline-block mt-8 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors"
            >
              {t('back_home')}
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export function UnsubscribeContent() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <UnsubscribeHandler />
    </Suspense>
  );
}
