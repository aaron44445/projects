import { z } from 'zod';

/**
 * Password requirement test functions
 * Exported for use in frontend password strength indicators
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: (p: string) => p.length >= 8,
  hasUppercase: (p: string) => /[A-Z]/.test(p),
  hasLowercase: (p: string) => /[a-z]/.test(p),
  hasNumber: (p: string) => /[0-9]/.test(p),
  hasSpecialChar: (p: string) => /[^A-Za-z0-9]/.test(p),
} as const;

/**
 * Password validation schema with complexity requirements
 * Enforces: min 8 chars, uppercase, lowercase, number, special character
 */
export const passwordSchema = z
  .string()
  .min(1, 'Password is required')
  .refine(PASSWORD_REQUIREMENTS.minLength, {
    message: 'Password must be at least 8 characters',
  })
  .refine(PASSWORD_REQUIREMENTS.hasUppercase, {
    message: 'Password must contain at least one uppercase letter (A-Z)',
  })
  .refine(PASSWORD_REQUIREMENTS.hasLowercase, {
    message: 'Password must contain at least one lowercase letter (a-z)',
  })
  .refine(PASSWORD_REQUIREMENTS.hasNumber, {
    message: 'Password must contain at least one number (0-9)',
  })
  .refine(PASSWORD_REQUIREMENTS.hasSpecialChar, {
    message: 'Password must contain at least one special character (!@#$%^&*)',
  });
