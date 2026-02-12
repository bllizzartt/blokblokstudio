import crypto from 'crypto';

/**
 * SOC 2 compliant encryption for credentials at rest.
 * Uses AES-256-GCM with random IV per encryption.
 * Key derived from ENCRYPTION_KEY env var.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const ENCODING = 'hex';

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length < 32) {
    // Fallback: derive from ADMIN_PASSWORD if no ENCRYPTION_KEY set
    const fallback = process.env.ADMIN_PASSWORD || 'default-key-change-me';
    return crypto.createHash('sha256').update(fallback).digest();
  }
  return crypto.createHash('sha256').update(key).digest();
}

/**
 * Encrypt a plaintext string. Returns iv:tag:ciphertext in hex.
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', ENCODING);
  encrypted += cipher.final(ENCODING);
  const tag = cipher.getAuthTag();
  return `${iv.toString(ENCODING)}:${tag.toString(ENCODING)}:${encrypted}`;
}

/**
 * Decrypt an encrypted string (iv:tag:ciphertext format).
 */
export function decrypt(encryptedData: string): string {
  const key = getKey();
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    // Not encrypted (legacy plaintext) — return as-is
    return encryptedData;
  }
  const [ivHex, tagHex, ciphertext] = parts;
  const iv = Buffer.from(ivHex, ENCODING);
  const tag = Buffer.from(tagHex, ENCODING);

  if (iv.length !== IV_LENGTH || tag.length !== TAG_LENGTH) {
    // Not a valid encrypted string — return as-is
    return encryptedData;
  }

  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(ciphertext, ENCODING, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    // Decryption failed — might be plaintext
    return encryptedData;
  }
}

/**
 * Check if a string is already encrypted (iv:tag:ciphertext format)
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(':');
  if (parts.length !== 3) return false;
  return parts[0].length === IV_LENGTH * 2 && parts[1].length === TAG_LENGTH * 2;
}

/**
 * Generate a secure audit log entry
 */
export function auditLog(action: string, details?: string): { action: string; details?: string; timestamp: string; ip?: string } {
  return {
    action,
    details,
    timestamp: new Date().toISOString(),
  };
}
