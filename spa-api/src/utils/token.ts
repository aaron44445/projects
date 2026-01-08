import crypto from 'crypto';

/**
 * Generate a secure random token (URL-safe base64)
 */
export function generateSecureToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

/**
 * Generate expiry date from hours
 */
export function getExpiryDate(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}
