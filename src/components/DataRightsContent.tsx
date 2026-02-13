/* ==========================================================================
 * DataRightsContent.tsx — GDPR Data Subject Rights Page
 * ==========================================================================
 *
 * PURPOSE:
 *   Allows users to exercise their GDPR rights: request a copy of their
 *   personal data (Right to Access) or permanently delete it (Right to
 *   Erasure). Sends a verification email before processing.
 *
 * URL: /data-rights
 * ALSO HANDLES: ?status=deleted (after deletion redirect)
 *               ?status=error&reason=expired (after error redirect)
 *
 * ========================================================================== */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';

type RequestType = 'export' | 'delete' | null;

function DataRightsHandler() {
  const t = useTranslations('gdpr');
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [requestType, setRequestType] = useState<RequestType>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'deleted' | 'expired'>('idle');
  const [message, setMessage] = useState('');

  // Handle redirect query params from /api/gdpr/delete
  useEffect(() => {
    const urlStatus = searchParams.get('status');
    const reason = searchParams.get('reason');

    if (urlStatus === 'deleted') {
      setStatus('deleted');
      setMessage(t('data_deleted_message'));
    } else if (urlStatus === 'error') {
      setStatus('error');
      if (reason === 'expired') {
        setMessage(t('token_expired'));
      } else {
        setMessage(t('request_error'));
      }
    }
  }, [searchParams, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !requestType) return;

    setStatus('loading');

    try {
      const res = await fetch('/api/gdpr/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: requestType }),
      });

      const data = await res.json();

      if (data.success) {
        setStatus('success');
        setMessage(t('request_sent_message'));
      } else {
        setStatus('error');
        setMessage(data.error || t('request_error'));
      }
    } catch {
      setStatus('error');
      setMessage(t('request_error'));
    }
  };

  return (
    <div className="min-h-screen py-20 sm:py-28 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
            {t('data_rights_title')}
          </h1>
          <p className="text-gray-400 text-lg mb-12 leading-relaxed">
            {t('data_rights_subtitle')}
          </p>

          {/* Success: Deletion confirmed (redirect from API) */}
          {status === 'deleted' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center"
            >
              <div className="h-16 w-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">{t('data_deleted_title')}</h2>
              <p className="text-gray-400">{message}</p>
            </motion.div>
          )}

          {/* Success: Verification email sent */}
          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center"
            >
              <div className="h-16 w-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">{t('check_email_title')}</h2>
              <p className="text-gray-400">{message}</p>
            </motion.div>
          )}

          {/* Form — shown when idle, loading, error, or expired */}
          {(status === 'idle' || status === 'loading' || status === 'error' || status === 'expired') && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label htmlFor="gdpr-email" className="block text-sm font-medium mb-2">
                  {t('your_email')}
                </label>
                <input
                  id="gdpr-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                  placeholder="you@example.com"
                />
              </div>

              {/* Request Type Selection */}
              <div>
                <label className="block text-sm font-medium mb-3">
                  {t('request_type')}
                </label>
                <div className="space-y-3">
                  {/* Export Option */}
                  <label
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                      requestType === 'export'
                        ? 'border-orange-500 bg-orange-500/5'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="requestType"
                      value="export"
                      checked={requestType === 'export'}
                      onChange={() => setRequestType('export')}
                      className="mt-1 accent-orange-500"
                    />
                    <div>
                      <div className="font-medium">{t('export_data')}</div>
                      <div className="text-sm text-gray-400 mt-1">{t('export_description')}</div>
                    </div>
                  </label>

                  {/* Delete Option */}
                  <label
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                      requestType === 'delete'
                        ? 'border-red-500 bg-red-500/5'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="requestType"
                      value="delete"
                      checked={requestType === 'delete'}
                      onChange={() => setRequestType('delete')}
                      className="mt-1 accent-red-500"
                    />
                    <div>
                      <div className="font-medium">{t('delete_data')}</div>
                      <div className="text-sm text-gray-400 mt-1">{t('delete_description')}</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Error Message */}
              {(status === 'error' || status === 'expired') && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                  {message}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!email || !requestType || status === 'loading'}
                className="w-full px-8 py-4 rounded-full bg-white text-black font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {status === 'loading' ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {t('processing')}
                  </span>
                ) : (
                  t('submit_request')
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export function DataRightsContent() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <DataRightsHandler />
    </Suspense>
  );
}
