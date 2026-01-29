import crypto from 'crypto';
import { getEncryptionKey } from './env.js';
import logger from './logger.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypt a string using AES-256-GCM
 * @param plaintext - The string to encrypt
 * @returns Encrypted string in format: iv:authTag:ciphertext (all hex encoded)
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:ciphertext
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a string encrypted with encrypt()
 * @param encryptedText - The encrypted string in format iv:authTag:ciphertext
 * @returns The original plaintext string
 * @throws Error if decryption fails (invalid key, tampered data, etc.)
 */
export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey();

  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format');
  }

  const [ivHex, authTagHex, ciphertext] = parts;

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  if (iv.length !== IV_LENGTH) {
    throw new Error('Invalid IV length');
  }

  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error('Invalid auth tag length');
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Check if a value is encrypted (has the expected format)
 * @param value - The value to check
 * @returns true if the value appears to be encrypted
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false;

  const parts = value.split(':');
  if (parts.length !== 3) return false;

  const [ivHex, authTagHex, ciphertext] = parts;

  // Check hex format and lengths
  const hexRegex = /^[0-9a-f]+$/i;

  return (
    hexRegex.test(ivHex) &&
    hexRegex.test(authTagHex) &&
    hexRegex.test(ciphertext) &&
    ivHex.length === IV_LENGTH * 2 &&
    authTagHex.length === AUTH_TAG_LENGTH * 2 &&
    ciphertext.length > 0
  );
}

/**
 * Safely encrypt a value, returning null if encryption fails
 * @param plaintext - The string to encrypt
 * @returns Encrypted string or null if encryption fails
 */
export function safeEncrypt(plaintext: string | null | undefined): string | null {
  if (!plaintext) return null;

  try {
    return encrypt(plaintext);
  } catch (error) {
    logger.error({ error }, 'Encryption failed');
    return null;
  }
}

/**
 * Safely decrypt a value, returning null if decryption fails
 * @param encryptedText - The encrypted string
 * @returns Decrypted string or null if decryption fails
 */
export function safeDecrypt(encryptedText: string | null | undefined): string | null {
  if (!encryptedText) return null;

  try {
    return decrypt(encryptedText);
  } catch (error) {
    logger.error({ error }, 'Decryption failed');
    return null;
  }
}
