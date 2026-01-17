import { describe, it, expect, beforeAll } from 'vitest';
import { encrypt, decrypt, isEncrypted, safeEncrypt, safeDecrypt } from '../lib/encryption.js';

// Ensure test encryption key is set
beforeAll(() => {
  process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a'.repeat(64);
});

describe('Encryption Module', () => {
  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt a simple string', () => {
      const plaintext = 'SG.test-api-key-12345';

      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt an empty string', () => {
      const plaintext = '';

      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt special characters', () => {
      const plaintext = 'SG.abc123!@#$%^&*()_+-=[]{}|;:,.<>?';

      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt unicode characters', () => {
      const plaintext = 'API-Key-日本語-한국어-🔑';

      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertexts for same plaintext (unique IV)', () => {
      const plaintext = 'SG.same-key-same-key';

      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);

      // But both should decrypt to the same value
      expect(decrypt(encrypted1)).toBe(plaintext);
      expect(decrypt(encrypted2)).toBe(plaintext);
    });

    it('should have correct format (iv:authTag:ciphertext)', () => {
      const plaintext = 'test-value';
      const encrypted = encrypt(plaintext);

      const parts = encrypted.split(':');
      expect(parts.length).toBe(3);

      const [iv, authTag, ciphertext] = parts;
      expect(iv.length).toBe(32); // 16 bytes = 32 hex chars
      expect(authTag.length).toBe(32); // 16 bytes = 32 hex chars
      expect(ciphertext.length).toBeGreaterThan(0);
    });
  });

  describe('decrypt error handling', () => {
    it('should throw on invalid format (missing parts)', () => {
      expect(() => decrypt('invalid')).toThrow('Invalid encrypted text format');
      expect(() => decrypt('part1:part2')).toThrow('Invalid encrypted text format');
    });

    it('should throw on tampered IV', () => {
      const encrypted = encrypt('test');
      const parts = encrypted.split(':');
      parts[0] = 'x'.repeat(32); // Tamper IV

      expect(() => decrypt(parts.join(':'))).toThrow();
    });

    it('should throw on tampered auth tag', () => {
      const encrypted = encrypt('test');
      const parts = encrypted.split(':');
      parts[1] = 'x'.repeat(32); // Tamper auth tag

      expect(() => decrypt(parts.join(':'))).toThrow();
    });

    it('should throw on tampered ciphertext', () => {
      const encrypted = encrypt('test');
      const parts = encrypted.split(':');
      parts[2] = 'x'.repeat(parts[2].length); // Tamper ciphertext

      expect(() => decrypt(parts.join(':'))).toThrow();
    });
  });

  describe('isEncrypted', () => {
    it('should return true for encrypted values', () => {
      const encrypted = encrypt('test-api-key');
      expect(isEncrypted(encrypted)).toBe(true);
    });

    it('should return false for plain text', () => {
      expect(isEncrypted('SG.plain-text-key')).toBe(false);
      expect(isEncrypted('not-encrypted')).toBe(false);
    });

    it('should return false for empty/null values', () => {
      expect(isEncrypted('')).toBe(false);
      expect(isEncrypted(null as any)).toBe(false);
      expect(isEncrypted(undefined as any)).toBe(false);
    });

    it('should return false for invalid formats', () => {
      expect(isEncrypted('only:two:parts:but:wrong')).toBe(false);
      expect(isEncrypted('short:short:short')).toBe(false);
    });
  });

  describe('safeEncrypt', () => {
    it('should encrypt valid values', () => {
      const result = safeEncrypt('test-key');
      expect(result).not.toBeNull();
      expect(isEncrypted(result!)).toBe(true);
    });

    it('should return null for null/undefined', () => {
      expect(safeEncrypt(null)).toBeNull();
      expect(safeEncrypt(undefined)).toBeNull();
    });

    it('should return null for empty string', () => {
      // Empty string is falsy, so safeEncrypt returns null
      expect(safeEncrypt('')).toBeNull();
    });
  });

  describe('safeDecrypt', () => {
    it('should decrypt valid encrypted values', () => {
      const encrypted = encrypt('my-secret-key');
      const decrypted = safeDecrypt(encrypted);
      expect(decrypted).toBe('my-secret-key');
    });

    it('should return null for null/undefined', () => {
      expect(safeDecrypt(null)).toBeNull();
      expect(safeDecrypt(undefined)).toBeNull();
    });

    it('should return null for invalid encrypted text', () => {
      expect(safeDecrypt('invalid-data')).toBeNull();
      expect(safeDecrypt('tampered:data:here')).toBeNull();
    });
  });

  describe('real-world API key formats', () => {
    it('should handle SendGrid API key format', () => {
      const sendgridKey = 'SG.abcdefghijklmnop.qrstuvwxyz1234567890ABCDEFGHIJKLMNOP';

      const encrypted = encrypt(sendgridKey);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(sendgridKey);
    });

    it('should handle Twilio Account SID format', () => {
      const twilioSid = 'ACtest00000000000000000000000000';

      const encrypted = encrypt(twilioSid);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(twilioSid);
    });

    it('should handle Twilio Auth Token format', () => {
      const twilioToken = 'abcdef1234567890abcdef1234567890';

      const encrypted = encrypt(twilioToken);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(twilioToken);
    });
  });
});
