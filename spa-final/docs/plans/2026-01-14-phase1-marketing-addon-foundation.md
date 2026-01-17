# Phase 1: Marketing Add-On Foundation - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up database schema and encryption infrastructure for the multi-tenant Marketing & Reminders add-on.

**Architecture:** Add new fields to Salon model for API key storage (encrypted) and add-on subscription tracking. Create AES-256-GCM encryption utility for secure key storage.

**Tech Stack:** Prisma ORM, Node.js crypto module, Vitest for testing, PostgreSQL

---

## Task 1: Add ENCRYPTION_KEY to Environment Variables

**Files:**
- Modify: `apps/api/src/lib/env.ts:9-53` (add to schema)
- Modify: `apps/api/src/__tests__/setup.ts:10-11` (add test default)
- Modify: `.env.production` (add placeholder)
- Modify: `.env.example` (add template)

**Step 1: Add ENCRYPTION_KEY to env schema**

In `apps/api/src/lib/env.ts`, add after line 52 (after CLOUDINARY_API_SECRET):

```typescript
  // Encryption key for API keys (required - 32 bytes hex encoded = 64 chars)
  ENCRYPTION_KEY: z.string().length(64, 'ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)').optional(),
```

**Step 2: Add test default to setup.ts**

In `apps/api/src/__tests__/setup.ts`, add after line 11:

```typescript
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a'.repeat(64); // 32-byte test key
```

**Step 3: Generate production encryption key**

Run:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output (64 hex characters).

**Step 4: Add to .env.production**

Add after the JWT secrets section:

```env
# Encryption key for salon API keys (32 bytes hex encoded)
ENCRYPTION_KEY=<paste-64-char-hex-key-here>
```

**Step 5: Add to .env.example**

Add after JWT section:

```env
# Encryption key for salon API keys (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=
```

**Step 6: Commit**

```bash
git add apps/api/src/lib/env.ts apps/api/src/__tests__/setup.ts .env.example
git commit -m "feat: add ENCRYPTION_KEY environment variable for API key storage"
```

---

## Task 2: Create Encryption Utility Module

**Files:**
- Create: `apps/api/src/lib/encryption.ts`

**Step 1: Create the encryption module**

Create file `apps/api/src/lib/encryption.ts`:

```typescript
import crypto from 'crypto';
import { env } from './env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Get the encryption key from environment
 * Throws if not configured
 */
function getEncryptionKey(): Buffer {
  const key = env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY is not configured');
  }
  return Buffer.from(key, 'hex');
}

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
    console.error('Encryption failed:', error);
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
    console.error('Decryption failed:', error);
    return null;
  }
}
```

**Step 2: Commit**

```bash
git add apps/api/src/lib/encryption.ts
git commit -m "feat: add AES-256-GCM encryption utility for API key storage"
```

---

## Task 3: Write Tests for Encryption Module

**Files:**
- Create: `apps/api/src/__tests__/encryption.test.ts`

**Step 1: Create the test file**

Create file `apps/api/src/__tests__/encryption.test.ts`:

```typescript
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
```

**Step 2: Run tests to verify they pass**

Run:
```bash
pnpm test:api -- --run encryption
```

Expected: All tests pass

**Step 3: Commit**

```bash
git add apps/api/src/__tests__/encryption.test.ts
git commit -m "test: add comprehensive tests for encryption module"
```

---

## Task 4: Add Marketing Add-On Fields to Salon Model

**Files:**
- Modify: `packages/database/prisma/schema.prisma:17-58` (Salon model)

**Step 1: Add new fields to Salon model**

In `packages/database/prisma/schema.prisma`, add after line 38 (after `updatedAt`), before the `// Relations` comment:

```prisma
  // Marketing & Reminders Add-On
  marketingAddonEnabled     Boolean   @default(false) @map("marketing_addon_enabled")
  marketingAddonSuspended   Boolean   @default(false) @map("marketing_addon_suspended")
  marketingAddonEnabledAt   DateTime? @map("marketing_addon_enabled_at")
  stripeMarketingSubId      String?   @map("stripe_marketing_sub_id")

  // SendGrid Configuration (Encrypted at application level)
  sendgridApiKeyEncrypted   String?   @map("sendgrid_api_key_encrypted")
  sendgridFromEmail         String?   @map("sendgrid_from_email")
  sendgridValidated         Boolean   @default(false) @map("sendgrid_validated")
  sendgridLastValidatedAt   DateTime? @map("sendgrid_last_validated_at")

  // Twilio Configuration (Encrypted at application level)
  twilioAccountSidEncrypted String?   @map("twilio_account_sid_encrypted")
  twilioAuthTokenEncrypted  String?   @map("twilio_auth_token_encrypted")
  twilioPhoneNumber         String?   @map("twilio_phone_number")
  twilioValidated           Boolean   @default(false) @map("twilio_validated")
  twilioLastValidatedAt     DateTime? @map("twilio_last_validated_at")
```

**Step 2: Commit schema change**

```bash
git add packages/database/prisma/schema.prisma
git commit -m "feat: add marketing add-on and API key fields to Salon model"
```

---

## Task 5: Create and Run Database Migration

**Files:**
- Creates: `packages/database/prisma/migrations/YYYYMMDDHHMMSS_add_marketing_addon_fields/migration.sql`

**Step 1: Generate the migration**

Run:
```bash
pnpm db:migrate -- --name add_marketing_addon_fields
```

This will create a new migration file with the SQL to add the new columns.

**Step 2: Verify the migration SQL**

Check the generated migration file. It should contain ALTER TABLE statements adding:
- `marketing_addon_enabled` (boolean, default false)
- `marketing_addon_suspended` (boolean, default false)
- `marketing_addon_enabled_at` (timestamp, nullable)
- `stripe_marketing_sub_id` (varchar, nullable)
- `sendgrid_api_key_encrypted` (text, nullable)
- `sendgrid_from_email` (varchar, nullable)
- `sendgrid_validated` (boolean, default false)
- `sendgrid_last_validated_at` (timestamp, nullable)
- `twilio_account_sid_encrypted` (text, nullable)
- `twilio_auth_token_encrypted` (text, nullable)
- `twilio_phone_number` (varchar, nullable)
- `twilio_validated` (boolean, default false)
- `twilio_last_validated_at` (timestamp, nullable)

**Step 3: Generate Prisma client**

Run:
```bash
pnpm db:generate
```

**Step 4: Verify migration in development**

Run:
```bash
pnpm db:push
```

**Step 5: Commit migration**

```bash
git add packages/database/prisma/migrations/
git commit -m "chore: add database migration for marketing add-on fields"
```

---

## Task 6: Update .env.production with Encryption Key

**Files:**
- Modify: `.env.production`

**Step 1: Generate a secure encryption key**

Run:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Step 2: Add to .env.production**

Add the generated key:
```env
# Encryption key for salon API keys (32 bytes hex encoded)
ENCRYPTION_KEY=<your-generated-64-char-hex-key>
```

**Step 3: DO NOT commit .env.production**

This file is git-ignored and contains secrets. Verify it's not staged:
```bash
git status
```

`.env.production` should NOT appear in the list.

---

## Task 7: Final Verification

**Step 1: Run all API tests**

Run:
```bash
pnpm test:api
```

Expected: All tests pass, including new encryption tests.

**Step 2: Run type check**

Run:
```bash
pnpm typecheck
```

Expected: No type errors.

**Step 3: Verify Prisma client has new fields**

Create a quick verification script or check in Prisma Studio:
```bash
pnpm db:studio
```

Navigate to the Salon table and verify the new columns exist.

**Step 4: Final commit (if any remaining changes)**

```bash
git status
# If there are uncommitted changes:
git add .
git commit -m "chore: phase 1 complete - marketing add-on foundation"
```

---

## Summary

After completing all tasks, you will have:

1. ✅ `ENCRYPTION_KEY` environment variable configured
2. ✅ `encryption.ts` utility module with AES-256-GCM encryption
3. ✅ Comprehensive tests for encryption/decryption
4. ✅ New Salon model fields for:
   - Marketing add-on subscription tracking
   - SendGrid API key storage (encrypted)
   - Twilio API key storage (encrypted)
   - Validation status tracking
5. ✅ Database migration applied

**Next Phase:** Phase 2 - API Key Management Endpoints
