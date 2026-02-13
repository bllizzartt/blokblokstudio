/* ==========================================================================
 * gdpr-tokens.ts — Token Utilities for GDPR Data Requests
 * ==========================================================================
 *
 * PURPOSE:
 *   Generates and verifies HMAC-signed, time-limited tokens for sensitive
 *   GDPR operations like data export and data deletion requests.
 *   Uses base64url encoding with a 15-minute expiry.
 *
 * USAGE:
 *   generateVerificationToken(email) -> returns a signed token string
 *   verifyToken(token)              -> returns { valid, email? }
 *
 * ========================================================================== */

import crypto from 'crypto';

const TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Get the signing key for HMAC. Uses ENCRYPTION_KEY, then ADMIN_PASSWORD.
 * Never falls back to a hardcoded default.
 */
function getSigningKey(): string {
  const key = process.env.ENCRYPTION_KEY || process.env.ADMIN_PASSWORD;
  if (!key) {
    throw new Error('ENCRYPTION_KEY or ADMIN_PASSWORD must be set for GDPR token signing');
  }
  return key;
}

/**
 * Generate an HMAC signature for a payload string.
 */
function signPayload(payload: string): string {
  return crypto.createHmac('sha256', getSigningKey()).update(payload).digest('base64url');
}

/**
 * Generate a time-limited, HMAC-signed verification token for data export/deletion requests.
 * Token format: base64url(payload).signature
 * Expires after 15 minutes.
 */
export function generateVerificationToken(email: string): string {
  const payload = JSON.stringify({
    email,
    timestamp: Date.now(),
    random: crypto.randomBytes(16).toString('hex'),
  });
  const encoded = Buffer.from(payload).toString('base64url');
  const signature = signPayload(encoded);
  return `${encoded}.${signature}`;
}

/**
 * Verify a signed token is valid and not expired (15-minute window).
 * Returns the decoded email if valid.
 */
export function verifyToken(token: string): { valid: boolean; email?: string } {
  try {
    const dotIndex = token.lastIndexOf('.');
    if (dotIndex === -1) {
      return { valid: false };
    }

    const encoded = token.substring(0, dotIndex);
    const signature = token.substring(dotIndex + 1);

    // Verify HMAC signature using timing-safe comparison
    const expectedSignature = signPayload(encoded);
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return { valid: false };
    }

    // Decode and check expiry
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString());
    const age = Date.now() - payload.timestamp;

    if (age > TOKEN_EXPIRY_MS) {
      return { valid: false };
    }

    return { valid: true, email: payload.email };
  } catch {
    return { valid: false };
  }
}
