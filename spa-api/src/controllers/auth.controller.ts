import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { hashPassword, comparePassword } from '../lib/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
} from '../lib/jwt.js';
import { generateSecureToken, getExpiryDate } from '../utils/token.js';
import { generateSlug } from '../utils/slug.js';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from '../lib/email.js';
import {
  RegisterInput,
  CustomerRegisterInput,
  LoginInput,
  RefreshInput,
  VerifyEmailInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '../schemas/auth.schema.js';
import { AuthenticatedRequest } from '../types/index.js';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../middleware/errorHandler.js';

/**
 * Register a new user and organization
 */
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password, name, businessName } = req.body as RegisterInput;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Generate slug from business name
    let slug = generateSlug(businessName);

    // Check if slug exists, append random if needed
    const existingOrg = await prisma.organization.findUnique({
      where: { slug },
    });

    if (existingOrg) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create organization and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user first (without org reference)
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name,
          role: 'OWNER',
          organizationId: 'temp', // Will update after org creation
        },
      });

      // Create organization with user as owner
      const organization = await tx.organization.create({
        data: {
          name: businessName,
          slug,
          ownerId: user.id,
        },
      });

      // Update user with correct organizationId
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { organizationId: organization.id },
      });

      // Create email verification token
      const verificationToken = generateSecureToken();
      await tx.emailVerification.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          token: verificationToken,
          expiresAt: getExpiryDate(24), // 24 hours
        },
      });

      // Create refresh token
      const refreshTokenRecord = await tx.refreshToken.create({
        data: {
          userId: user.id,
          token: generateSecureToken(),
          expiresAt: getRefreshTokenExpiry(),
        },
      });

      return {
        user: updatedUser,
        organization,
        verificationToken,
        refreshToken: refreshTokenRecord.token,
      };
    });

    // Send verification email (async, don't wait)
    sendVerificationEmail(email, result.verificationToken, result.organization.slug).catch(
      console.error
    );

    // Generate access token
    const accessToken = generateAccessToken({
      userId: result.user.id,
      email: result.user.email,
      organizationId: result.organization.id,
      role: result.user.role,
    });

    res.status(201).json({
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          emailVerified: false,
        },
        organization: {
          id: result.organization.id,
          name: result.organization.name,
          slug: result.organization.slug,
        },
        accessToken,
        refreshToken: result.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Register a new customer (no organization)
 */
export async function registerCustomer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password, name, phone } = req.body as CustomerRegisterInput;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create customer user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        phone,
        userType: 'CUSTOMER',
        role: 'STAFF', // Not used for customers but required by schema
      },
    });

    // Create refresh token
    const refreshTokenRecord = await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: generateSecureToken(),
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    // Generate access token
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      organizationId: null,
      role: user.role,
      userType: 'CUSTOMER',
    });

    res.status(201).json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          userType: 'CUSTOMER',
        },
        accessToken,
        refreshToken: refreshTokenRecord.token,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Login with email and password (supports both business and customer users)
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body as LoginInput;

    // Find user with organization (organization is optional for customers)
    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedError('Account is disabled');
    }

    // Verify password
    const isValid = await comparePassword(password, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Create refresh token
    const refreshTokenRecord = await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: generateSecureToken(),
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    // Generate access token
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
      userType: user.userType,
    });

    // Build response based on user type
    if (user.userType === 'CUSTOMER') {
      // Customer login response (no organization)
      res.json({
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            userType: 'CUSTOMER',
            emailVerified: !!user.emailVerifiedAt,
          },
          accessToken,
          refreshToken: refreshTokenRecord.token,
          redirectTo: '/account', // Redirect customers to their account
        },
      });
    } else {
      // Business user login response (with organization)
      res.json({
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            userType: 'BUSINESS',
            emailVerified: !!user.emailVerifiedAt,
          },
          organization: user.organization ? {
            id: user.organization.id,
            name: user.organization.name,
            slug: user.organization.slug,
          } : null,
          accessToken,
          refreshToken: refreshTokenRecord.token,
          redirectTo: '/', // Redirect business users to dashboard
        },
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Refresh access token
 */
export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refreshToken } = req.body as RefreshInput;

    // Find refresh token
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Get user with organization
    const user = await prisma.user.findUnique({
      where: { id: tokenRecord.userId },
      include: { organization: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or disabled');
    }

    // Delete old refresh token and create new one
    const [_, newTokenRecord] = await prisma.$transaction([
      prisma.refreshToken.delete({ where: { id: tokenRecord.id } }),
      prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: generateSecureToken(),
          expiresAt: getRefreshTokenExpiry(),
        },
      }),
    ]);

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
    });

    res.json({
      data: {
        accessToken,
        refreshToken: newTokenRecord.token,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Logout - invalidate refresh token
 */
export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refreshToken } = req.body as RefreshInput;

    // Delete refresh token if it exists
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });

    res.json({ data: { message: 'Logged out successfully' } });
  } catch (error) {
    next(error);
  }
}

/**
 * Verify email address
 */
export async function verifyEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token } = req.body as VerifyEmailInput;

    // Find verification token
    const verification = await prisma.emailVerification.findUnique({
      where: { token },
    });

    if (!verification || verification.expiresAt < new Date()) {
      throw new ValidationError([
        { field: 'token', message: 'Invalid or expired verification token' },
      ]);
    }

    // Update user and delete token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: verification.userId },
        data: { emailVerifiedAt: new Date() },
      }),
      prisma.emailVerification.delete({ where: { id: verification.id } }),
    ]);

    res.json({ data: { message: 'Email verified successfully' } });
  } catch (error) {
    next(error);
  }
}

/**
 * Resend verification email
 */
export async function resendVerification(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    // Check if already verified
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
    });

    if (dbUser?.emailVerifiedAt) {
      res.json({ data: { message: 'Email already verified' } });
      return;
    }

    // Delete old verification tokens
    await prisma.emailVerification.deleteMany({
      where: { userId: user.userId },
    });

    // Create new verification token
    const token = generateSecureToken();
    await prisma.emailVerification.create({
      data: {
        userId: user.userId,
        organizationId: user.organizationId,
        token,
        expiresAt: getExpiryDate(24),
      },
    });

    // Send email
    await sendVerificationEmail(user.email, token, '');

    res.json({ data: { message: 'Verification email sent' } });
  } catch (error) {
    next(error);
  }
}

/**
 * Request password reset
 */
export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = req.body as ForgotPasswordInput;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      res.json({ data: { message: 'If the email exists, a reset link has been sent' } });
      return;
    }

    // Delete old reset tokens
    await prisma.passwordReset.deleteMany({
      where: { userId: user.id },
    });

    // Create reset token
    const token = generateSecureToken();
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        organizationId: user.organizationId,
        token,
        expiresAt: getExpiryDate(1), // 1 hour
      },
    });

    // Send email
    await sendPasswordResetEmail(email, token);

    res.json({ data: { message: 'If the email exists, a reset link has been sent' } });
  } catch (error) {
    next(error);
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token, password } = req.body as ResetPasswordInput;

    // Find reset token
    const resetToken = await prisma.passwordReset.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.expiresAt < new Date() || resetToken.usedAt) {
      throw new ValidationError([
        { field: 'token', message: 'Invalid or expired reset token' },
      ]);
    }

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordReset.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      // Invalidate all refresh tokens for security
      prisma.refreshToken.deleteMany({
        where: { userId: resetToken.userId },
      }),
    ]);

    res.json({ data: { message: 'Password reset successfully' } });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current user info (handles both business and customer users)
 */
export async function me(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { organization: true },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    if (user.userType === 'CUSTOMER') {
      // Customer response (no organization)
      res.json({
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            avatar: user.avatar,
            userType: 'CUSTOMER',
            emailVerified: !!user.emailVerifiedAt,
          },
        },
      });
    } else {
      // Business user response (with organization)
      res.json({
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            userType: 'BUSINESS',
            emailVerified: !!user.emailVerifiedAt,
          },
          organization: user.organization ? {
            id: user.organization.id,
            name: user.organization.name,
            slug: user.organization.slug,
            plan: user.organization.plan,
          } : null,
        },
      });
    }
  } catch (error) {
    next(error);
  }
}
