import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '@peacase/database';
import { authRateLimit, strictRateLimit } from '../middleware/rateLimit.js';
import { sendEmail, passwordResetEmail, emailVerificationEmail } from '../services/email.js';
import { env } from '../lib/env.js';
import { csrfTokenHandler, clearCsrfToken } from '../middleware/csrf.js';

const router = Router();

// Async error wrapper to properly catch errors in async route handlers
function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Generate a secure random verification token
function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Create and send verification email
async function createAndSendVerificationEmail(userId: string, email: string, salonName: string): Promise<boolean> {
  // Delete any existing verification tokens for this user
  await prisma.emailVerificationToken.deleteMany({
    where: { userId },
  });

  // Generate new token
  const token = generateVerificationToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Store token in database
  await prisma.emailVerificationToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  // Build verification URL
  const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;

  // Send verification email
  return sendEmail({
    to: email,
    subject: 'Verify your Peacase account',
    html: emailVerificationEmail({
      salonName,
      verificationUrl,
    }),
  });
}

// Validation schemas
const registerSchema = z.object({
  salonName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  timezone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

const resendVerificationSchema = z.object({
  email: z.string().email(),
});

// Generate tokens
function generateTokens(userId: string, salonId: string, role: string) {
  const accessToken = jwt.sign(
    { userId, salonId, role },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const refreshToken = jwt.sign(
    { userId, salonId, role, type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
}

// Generate slug from salon name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ============================================
// POST /api/v1/auth/register
// ============================================
router.post('/register', authRateLimit, asyncHandler(async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    // Check if email already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: data.email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'An account with this email already exists',
        },
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Generate unique slug
    let slug = generateSlug(data.salonName);
    let slugExists = await prisma.salon.findUnique({ where: { slug } });
    let counter = 1;
    while (slugExists) {
      slug = `${generateSlug(data.salonName)}-${counter}`;
      slugExists = await prisma.salon.findUnique({ where: { slug } });
      counter++;
    }

    // Create salon and admin user in transaction
    const result = await prisma.$transaction(async (tx) => {
      const salon = await tx.salon.create({
        data: {
          name: data.salonName,
          slug,
          email: data.email,
          phone: data.phone,
          timezone: data.timezone || 'America/Chicago',
        },
      });

      const user = await tx.user.create({
        data: {
          salonId: salon.id,
          email: data.email,
          passwordHash,
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
          emailVerified: false,
        },
      });

      return { salon, user };
    });

    // Generate tokens
    const tokens = generateTokens(result.user.id, result.salon.id, result.user.role);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        userId: result.user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Send verification email (don't block registration if email fails)
    try {
      await createAndSendVerificationEmail(result.user.id, result.user.email, result.salon.name);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          role: result.user.role,
          emailVerified: result.user.emailVerified,
        },
        salon: {
          id: result.salon.id,
          name: result.salon.name,
          slug: result.salon.slug,
        },
        tokens,
        requiresVerification: true,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.flatten().fieldErrors,
        },
      });
    }
    throw error;
  }
}));

// ============================================
// POST /api/v1/auth/login
// ============================================
router.post('/login', authRateLimit, asyncHandler(async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findFirst({
      where: { email: data.email, isActive: true },
      include: { salon: true },
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    // Verify password
    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate tokens
    const tokens = generateTokens(user.id, user.salonId, user.role);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          emailVerified: user.emailVerified,
        },
        salon: {
          id: user.salon.id,
          name: user.salon.name,
          slug: user.salon.slug,
        },
        tokens,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
        },
      });
    }
    throw error;
  }
}));

// ============================================
// POST /api/v1/auth/verify-email
// ============================================
router.post('/verify-email', authRateLimit, async (req: Request, res: Response) => {
  try {
    const data = verifyEmailSchema.parse(req.body);

    // Find the verification token
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token: data.token },
      include: { user: { include: { salon: true } } },
    });

    if (!verificationToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid verification token',
        },
      });
    }

    // Check if token has expired
    if (verificationToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id },
      });

      return res.status(400).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Verification token has expired. Please request a new one.',
        },
      });
    }

    // Mark user as verified
    const updatedUser = await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: true },
      include: { salon: true },
    });

    // Delete the used token
    await prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });

    res.json({
      success: true,
      data: {
        message: 'Email verified successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
          emailVerified: updatedUser.emailVerified,
        },
        salon: {
          id: updatedUser.salon.id,
          name: updatedUser.salon.name,
          slug: updatedUser.salon.slug,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
        },
      });
    }
    throw error;
  }
});

// ============================================
// POST /api/v1/auth/resend-verification
// ============================================
router.post('/resend-verification', strictRateLimit, async (req: Request, res: Response) => {
  try {
    const data = resendVerificationSchema.parse(req.body);

    // Find user by email
    const user = await prisma.user.findFirst({
      where: { email: data.email },
      include: { salon: true },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        data: {
          message: 'If an account exists with this email, a verification link has been sent.',
        },
      });
    }

    // If already verified, no need to send again
    if (user.emailVerified) {
      return res.json({
        success: true,
        data: {
          message: 'If an account exists with this email, a verification link has been sent.',
        },
      });
    }

    // Send verification email
    try {
      await createAndSendVerificationEmail(user.id, user.email, user.salon.name);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }

    res.json({
      success: true,
      data: {
        message: 'If an account exists with this email, a verification link has been sent.',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
        },
      });
    }
    throw error;
  }
});

// ============================================
// POST /api/v1/auth/logout
// ============================================
router.post('/logout', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      // Delete refresh token if exists
      await prisma.refreshToken.deleteMany({
        where: { token },
      });
    } catch {
      // Ignore errors
    }
  }

  res.json({
    success: true,
    data: { message: 'Logged out successfully' },
  });
});

// ============================================
// POST /api/v1/auth/refresh
// ============================================
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_TOKEN',
        message: 'Refresh token is required',
      },
    });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      env.JWT_REFRESH_SECRET
    ) as { userId: string; salonId: string; role: string };

    // Check if token exists in database
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        expiresAt: { gt: new Date() },
      },
    });

    if (!storedToken) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired refresh token',
        },
      });
    }

    // Generate new tokens
    const tokens = generateTokens(decoded.userId, decoded.salonId, decoded.role);

    // Update refresh token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      success: true,
      data: { tokens },
    });
  } catch {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired refresh token',
      },
    });
  }
});

// ============================================
// GET /api/v1/auth/csrf-token
// Generate and return a CSRF token
// ============================================
router.get('/csrf-token', csrfTokenHandler);

// ============================================
// POST /api/v1/auth/logout (with CSRF cleanup)
// Note: The main logout handler clears refresh tokens
// This endpoint also clears CSRF tokens for complete cleanup
// ============================================
router.post('/logout-csrf', (req: Request, res: Response) => {
  clearCsrfToken(req, res);
  res.json({
    success: true,
    data: { message: 'CSRF token cleared' },
  });
});

// ============================================
// POST /api/v1/auth/forgot-password
// ============================================
router.post('/forgot-password', strictRateLimit, async (req: Request, res: Response) => {
  try {
    const data = forgotPasswordSchema.parse(req.body);

    // Find user by email
    const user = await prisma.user.findFirst({
      where: { email: data.email, isActive: true },
    });

    // Always return success to prevent email enumeration
    // But only send email if user exists
    if (user) {
      // Invalidate any existing reset tokens for this user
      await prisma.passwordResetToken.updateMany({
        where: { userId: user.id, used: false },
        data: { used: true },
      });

      // Generate secure random token
      const token = crypto.randomBytes(32).toString('hex');

      // Hash the token before storing (security: don't store plain tokens)
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Token expires in 1 hour
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      // Store hashed token in database
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      // Build reset URL (token is sent in URL, NOT the hash)
      const frontendUrl = env.FRONTEND_URL;
      const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

      // Send email
      const emailHtml = passwordResetEmail({
        recipientName: user.firstName || 'there',
        resetUrl,
        expiresInMinutes: 60,
      });

      await sendEmail({
        to: user.email,
        subject: 'Reset Your Password - Peacase',
        html: emailHtml,
      });
    }

    // Always return success (security: don't reveal if email exists)
    res.json({
      success: true,
      data: {
        message: 'If an account exists with that email, a password reset link has been sent.',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please provide a valid email address',
        },
      });
    }
    throw error;
  }
});

// ============================================
// POST /api/v1/auth/reset-password
// ============================================
router.post('/reset-password', strictRateLimit, async (req: Request, res: Response) => {
  try {
    const data = resetPasswordSchema.parse(req.body);

    // Hash the incoming token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(data.token).digest('hex');

    // Find valid, unused token
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        used: false,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired password reset link. Please request a new one.',
        },
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Update password and mark token as used (in transaction)
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
      // Invalidate all refresh tokens for security (force re-login)
      prisma.refreshToken.deleteMany({
        where: { userId: resetToken.userId },
      }),
    ]);

    res.json({
      success: true,
      data: {
        message: 'Password has been reset successfully. You can now log in with your new password.',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.flatten().fieldErrors,
        },
      });
    }
    throw error;
  }
});

export { router as authRouter };
