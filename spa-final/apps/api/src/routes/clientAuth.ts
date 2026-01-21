import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '@peacase/database';
import { env } from '../lib/env.js';
import { sendEmail, clientWelcomeEmail, clientPasswordResetEmail, clientVerificationEmail } from '../services/email.js';
import { loginRateLimit, signupRateLimit, passwordResetRateLimit } from '../middleware/rateLimit.js';
import { authenticateClient, AuthenticatedClientRequest, ClientJwtPayload } from '../middleware/clientAuth.js';
import { asyncHandler } from '../lib/errorUtils.js';

const PORTAL_URL = env.CORS_ORIGIN || 'http://localhost:3000';

export const clientAuthRouter = Router();

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '7d';  // 7 days - matches staff tokens for consistent UX
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

// Generate JWT tokens for client
function generateClientTokens(client: { id: string; salonId: string; email: string }) {
  const accessToken = jwt.sign(
    { clientId: client.id, salonId: client.salonId, email: client.email, type: 'client' } as ClientJwtPayload,
    env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = crypto.randomBytes(64).toString('hex');
  const refreshTokenExpiry = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  return { accessToken, refreshToken, refreshTokenExpiry };
}

// POST /api/v1/client-auth/register
clientAuthRouter.post('/register', signupRateLimit, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone, salonSlug } = req.body;

    if (!email || !password || !firstName || !lastName || !salonSlug) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Email, password, first name, last name, and salon are required' }
      });
    }

    // Find salon by slug
    const salon = await prisma.salon.findUnique({
      where: { slug: salonSlug }
    });

    if (!salon) {
      return res.status(404).json({
        success: false,
        error: { code: 'SALON_NOT_FOUND', message: 'Salon not found' }
      });
    }

    // Check if client already exists in this salon
    const existingClient = await prisma.client.findFirst({
      where: {
        email,
        salonId: salon.id
      }
    });

    if (existingClient) {
      // If client exists but has no password, this is an upgrade from booking-only
      if (!existingClient.passwordHash) {
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        const updatedClient = await prisma.client.update({
          where: { id: existingClient.id },
          data: {
            passwordHash,
            firstName,
            lastName,
            phone: phone || existingClient.phone
          }
        });

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        await prisma.clientEmailVerificationToken.create({
          data: {
            clientId: updatedClient.id,
            token: verificationToken,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
          }
        });

        // Send verification email
        try {
          await sendEmail({
            to: email,
            subject: `Verify your ${salon.name} account`,
            html: clientVerificationEmail({
              clientName: updatedClient.firstName,
              salonName: salon.name,
              verificationToken,
              portalUrl: PORTAL_URL
            })
          });
        } catch (emailError) {
          console.error('Failed to send verification email:', emailError);
        }

        const tokens = generateClientTokens({
          id: updatedClient.id,
          salonId: updatedClient.salonId,
          email: email
        });

        await prisma.clientRefreshToken.create({
          data: {
            clientId: updatedClient.id,
            token: tokens.refreshToken,
            expiresAt: tokens.refreshTokenExpiry
          }
        });

        return res.status(200).json({
          success: true,
          data: {
            message: 'Account upgraded successfully',
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            client: {
              id: updatedClient.id,
              email,
              firstName: updatedClient.firstName,
              lastName: updatedClient.lastName,
              emailVerified: updatedClient.emailVerified
            }
          }
        });
      }

      return res.status(409).json({
        success: false,
        error: { code: 'CLIENT_EXISTS', message: 'An account with this email already exists' }
      });
    }

    // Create new client
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const newClient = await prisma.client.create({
      data: {
        salonId: salon.id,
        email,
        passwordHash,
        firstName,
        lastName,
        phone
      }
    });

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await prisma.clientEmailVerificationToken.create({
      data: {
        clientId: newClient.id,
        token: verificationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });

    // Send welcome email with verification link
    try {
      await sendEmail({
        to: email,
        subject: `Welcome to ${salon.name}!`,
        html: clientWelcomeEmail({
          clientName: newClient.firstName,
          salonName: salon.name,
          verificationToken,
          portalUrl: PORTAL_URL
        })
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    const tokens = generateClientTokens({
      id: newClient.id,
      salonId: newClient.salonId,
      email
    });

    await prisma.clientRefreshToken.create({
      data: {
        clientId: newClient.id,
        token: tokens.refreshToken,
        expiresAt: tokens.refreshTokenExpiry
      }
    });

    return res.status(201).json({
      success: true,
      data: {
        message: 'Registration successful',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        client: {
          id: newClient.id,
          email,
          firstName: newClient.firstName,
          lastName: newClient.lastName,
          emailVerified: false
        }
      }
    });
  } catch (error) {
    console.error('Client registration error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'REGISTRATION_ERROR', message: 'Failed to register' }
    });
  }
}));

// POST /api/v1/client-auth/login
clientAuthRouter.post('/login', loginRateLimit, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { email, password, salonSlug } = req.body;

    if (!email || !password || !salonSlug) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Email, password, and salon are required' }
      });
    }

    // Find salon
    const salon = await prisma.salon.findUnique({
      where: { slug: salonSlug }
    });

    if (!salon) {
      return res.status(404).json({
        success: false,
        error: { code: 'SALON_NOT_FOUND', message: 'Salon not found' }
      });
    }

    // Find client
    const client = await prisma.client.findFirst({
      where: {
        email,
        salonId: salon.id
      }
    });

    if (!client || !client.passwordHash) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, client.passwordHash);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }

    if (!client.isActive) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_INACTIVE', message: 'Your account has been deactivated' }
      });
    }

    // Update last login
    await prisma.client.update({
      where: { id: client.id },
      data: { lastLogin: new Date() }
    });

    const tokens = generateClientTokens({
      id: client.id,
      salonId: client.salonId,
      email
    });

    await prisma.clientRefreshToken.create({
      data: {
        clientId: client.id,
        token: tokens.refreshToken,
        expiresAt: tokens.refreshTokenExpiry
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        client: {
          id: client.id,
          email,
          firstName: client.firstName,
          lastName: client.lastName,
          emailVerified: client.emailVerified,
          loyaltyPoints: client.loyaltyPoints
        }
      }
    });
  } catch (error) {
    console.error('Client login error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'LOGIN_ERROR', message: 'Failed to login' }
    });
  }
}));

// POST /api/v1/client-auth/refresh
clientAuthRouter.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_TOKEN', message: 'Refresh token is required' }
      });
    }

    const tokenRecord = await prisma.clientRefreshToken.findUnique({
      where: { token: refreshToken },
      include: { client: true }
    });

    if (!tokenRecord) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid refresh token' }
      });
    }

    if (tokenRecord.expiresAt < new Date()) {
      await prisma.clientRefreshToken.delete({ where: { id: tokenRecord.id } });
      return res.status(401).json({
        success: false,
        error: { code: 'TOKEN_EXPIRED', message: 'Refresh token has expired' }
      });
    }

    if (!tokenRecord.client.isActive) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_INACTIVE', message: 'Your account has been deactivated' }
      });
    }

    // Delete old refresh token
    await prisma.clientRefreshToken.delete({ where: { id: tokenRecord.id } });

    // Generate new tokens
    const tokens = generateClientTokens({
      id: tokenRecord.client.id,
      salonId: tokenRecord.client.salonId,
      email: tokenRecord.client.email || ''
    });

    await prisma.clientRefreshToken.create({
      data: {
        clientId: tokenRecord.client.id,
        token: tokens.refreshToken,
        expiresAt: tokens.refreshTokenExpiry
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'REFRESH_ERROR', message: 'Failed to refresh token' }
    });
  }
}));

// POST /api/v1/client-auth/logout
clientAuthRouter.post('/logout', authenticateClient, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await prisma.clientRefreshToken.deleteMany({
        where: { token: refreshToken }
      });
    }

    return res.status(200).json({
      success: true,
      data: { message: 'Logged out successfully' }
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'LOGOUT_ERROR', message: 'Failed to logout' }
    });
  }
}));

// POST /api/v1/client-auth/verify-email
clientAuthRouter.post('/verify-email', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_TOKEN', message: 'Verification token is required' }
      });
    }

    const verificationToken = await prisma.clientEmailVerificationToken.findUnique({
      where: { token },
      include: { client: true }
    });

    if (!verificationToken) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid verification token' }
      });
    }

    if (verificationToken.expiresAt < new Date()) {
      await prisma.clientEmailVerificationToken.delete({ where: { id: verificationToken.id } });
      return res.status(400).json({
        success: false,
        error: { code: 'TOKEN_EXPIRED', message: 'Verification token has expired' }
      });
    }

    await prisma.client.update({
      where: { id: verificationToken.clientId },
      data: { emailVerified: true }
    });

    await prisma.clientEmailVerificationToken.delete({ where: { id: verificationToken.id } });

    return res.status(200).json({
      success: true,
      data: { message: 'Email verified successfully' }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'VERIFICATION_ERROR', message: 'Failed to verify email' }
    });
  }
}));

// POST /api/v1/client-auth/forgot-password
clientAuthRouter.post('/forgot-password', passwordResetRateLimit, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { email, salonSlug } = req.body;

    if (!email || !salonSlug) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Email and salon are required' }
      });
    }

    const salon = await prisma.salon.findUnique({
      where: { slug: salonSlug }
    });

    if (!salon) {
      // Don't reveal if salon exists
      return res.status(200).json({
        success: true,
        data: { message: 'If an account exists, a password reset email will be sent' }
      });
    }

    const client = await prisma.client.findFirst({
      where: {
        email,
        salonId: salon.id
      }
    });

    if (!client || !client.passwordHash) {
      // Don't reveal if client exists
      return res.status(200).json({
        success: true,
        data: { message: 'If an account exists, a password reset email will be sent' }
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Delete any existing reset tokens for this client
    await prisma.clientPasswordResetToken.deleteMany({
      where: { clientId: client.id }
    });

    await prisma.clientPasswordResetToken.create({
      data: {
        clientId: client.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      }
    });

    try {
      await sendEmail({
        to: email,
        subject: `Reset your ${salon.name} password`,
        html: clientPasswordResetEmail({
          clientName: client.firstName,
          salonName: salon.name,
          resetToken,
          portalUrl: PORTAL_URL
        })
      });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
    }

    return res.status(200).json({
      success: true,
      data: { message: 'If an account exists, a password reset email will be sent' }
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'FORGOT_PASSWORD_ERROR', message: 'Failed to process request' }
    });
  }
}));

// POST /api/v1/client-auth/reset-password
clientAuthRouter.post('/reset-password', passwordResetRateLimit, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Token and new password are required' }
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters' }
      });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await prisma.clientPasswordResetToken.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: new Date() }
      }
    });

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid or expired reset token' }
      });
    }

    if (resetToken.used) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid or expired reset token' }
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    await prisma.$transaction([
      prisma.client.update({
        where: { id: resetToken.clientId },
        data: { passwordHash }
      }),
      prisma.clientPasswordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true }
      }),
      // Invalidate all refresh tokens for security
      prisma.clientRefreshToken.deleteMany({
        where: { clientId: resetToken.clientId }
      })
    ]);

    return res.status(200).json({
      success: true,
      data: { message: 'Password reset successfully' }
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'RESET_PASSWORD_ERROR', message: 'Failed to reset password' }
    });
  }
}));

// GET /api/v1/client-auth/me
clientAuthRouter.get('/me', authenticateClient, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { client } = req as AuthenticatedClientRequest;

    const fullClient = await prisma.client.findUnique({
      where: { id: client.id },
      include: {
        salon: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            phone: true,
            email: true,
            address: true,
            city: true,
            state: true,
            zip: true
          }
        }
      }
    });

    if (!fullClient) {
      return res.status(404).json({
        success: false,
        error: { code: 'CLIENT_NOT_FOUND', message: 'Client not found' }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: fullClient.id,
        email: fullClient.email,
        firstName: fullClient.firstName,
        lastName: fullClient.lastName,
        phone: fullClient.phone,
        birthday: fullClient.birthday,
        emailVerified: fullClient.emailVerified,
        loyaltyPoints: fullClient.loyaltyPoints,
        communicationPreference: fullClient.communicationPreference,
        optedInReminders: fullClient.optedInReminders,
        optedInMarketing: fullClient.optedInMarketing,
        salon: fullClient.salon
      }
    });
  } catch (error) {
    console.error('Get client error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'GET_CLIENT_ERROR', message: 'Failed to get client info' }
    });
  }
}));
