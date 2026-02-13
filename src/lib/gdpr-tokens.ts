/* ==========================================================================
 * gdpr-tokens.ts — Token Utilities for GDPR Data Requests
 * ==========================================================================
 *
 * PURPOSE:
 *   Generates and verifies time-limited tokens for sensitive GDPR operations
 *   like data export and data deletion requests. Uses base64url encoding
 *   with a 15-minute expiry for security.
 *
 * USAGE:
 *   generateVerificationToken(email) -> returns a token string
 *   verifyToken(token)              -> returns { valid, email? }
 *
 * ========================================================================== */

import crypto from 'crypto';

/**
 * Generate a time-limited verification token for data export/deletion requests.
 * Token encodes the email, timestamp, and random bytes in base64url format.
 * Expires after 15 minutes.
 */
export function generateVerificationToken(email: string): string {
  const payload = {
    email,
    timestamp: Date.now(),
    random: crypto.randomBytes(16).toString('hex'),
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

/**
 * Verify a token is valid and not expired (15-minute window).
 * Returns the decoded email if valid.
 */
export function verifyToken(token: string): { valid: boolean; email?: string } {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64url').toString());
    const age = Date.now() - payload.timestamp;
    const fifteenMin = 15 * 60 * 1000;

    if (age > fifteenMin) {
      return { valid: false };
    }

    return { valid: true, email: payload.email };
  } catch {
    return { valid: false };
  }
}
