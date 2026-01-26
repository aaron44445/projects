import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '@peacase/database';
import { env } from '../lib/env.js';
import { asyncHandler } from '../lib/errorUtils.js';
import { loginRateLimit } from '../middleware/rateLimit.js';
import { sendEmail } from '../services/email.js';

const router = Router();

// JWT token expiry
const ACCESS_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY = '30d';

// Validation schemas
const clientLoginSchema = z.object({
  email: z.string().email(),
  salonSlug: z.string().min(1),
});

const clientVerifyTokenSchema = z.object({
  token: z.string().min(1),
});

// Generate tokens for client
function generateClientTokens(clientId: string, salonId: string, email: string) {
  const accessToken = jwt.sign(
    { clientId, salonId, email, type: 'client' },
    env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { clientId, salonId, type: 'client_refresh' },
    env.JWT_REFRESH_SECRET || env.JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
}

// ============================================
// POST /api/v1/client-auth/request-link
// Request a magic link login email
// ============================================
router.post('/request-link', loginRateLimit, asyncHandler(async (req: Request, res: Response) => {
  const data = clientLoginSchema.parse(req.body);

  // Find salon by slug
  const salon = await prisma.salon.findUnique({
    where: { slug: data.salonSlug },
  });

  if (!salon) {
    return res.status(404).json({
      success: false,
      error: { code: 'SALON_NOT_FOUND', message: 'Salon not found' },
    });
  }

  // Find client by email in this salon
  const client = await prisma.client.findFirst({
    where: {
      email: data.email.toLowerCase().trim(),
      salonId: salon.id,
    },
  });

  if (!client) {
    // Don't reveal if client exists - return success anyway
    return res.json({
      success: true,
      message: 'If an account exists with this email, a login link will be sent.',
    });
  }

  // Generate magic link token using ClientEmailVerificationToken table
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Delete old tokens for this client
  await prisma.clientEmailVerificationToken.deleteMany({
    where: { clientId: client.id },
  });

  // Create new token
  await prisma.clientEmailVerificationToken.create({
    data: {
      clientId: client.id,
      token,
      expiresAt,
    },
  });

  // Build magic link URL
  const magicLink = `${env.FRONTEND_URL}/portal/login?token=${token}&salon=${data.salonSlug}`;

  // Send magic link email
  await sendEmail({
    to: client.email!,
    subject: `Your ${salon.name} login link`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Log In to ${salon.name}</h2>
        <p>Hi ${client.firstName},</p>
        <p>Click the button below to log in to your account:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${magicLink}" style="background: #6B9B76; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Log In
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">This link expires in 15 minutes.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this link, you can safely ignore this email.</p>
      </div>
    `,
  });

  res.json({
    success: true,
    message: 'If an account exists with this email, a login link will be sent.',
  });
}));

// ============================================
// POST /api/v1/client-auth/verify-token
// Verify magic link token and return JWT tokens
// ============================================
router.post('/verify-token', loginRateLimit, asyncHandler(async (req: Request, res: Response) => {
  const data = clientVerifyTokenSchema.parse(req.body);

  // Find token
  const tokenRecord = await prisma.clientEmailVerificationToken.findUnique({
    where: { token: data.token },
    include: {
      client: {
        include: {
          salon: true,
        },
      },
    },
  });

  if (!tokenRecord) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired login link' },
    });
  }

  // Check if expired
  if (tokenRecord.expiresAt < new Date()) {
    // Clean up expired token
    await prisma.clientEmailVerificationToken.delete({
      where: { id: tokenRecord.id },
    });

    return res.status(401).json({
      success: false,
      error: { code: 'TOKEN_EXPIRED', message: 'Login link has expired. Please request a new one.' },
    });
  }

  const client = tokenRecord.client;
  const salon = client.salon;

  // Delete the used token
  await prisma.clientEmailVerificationToken.delete({
    where: { id: tokenRecord.id },
  });

  // Generate JWT tokens
  const tokens = generateClientTokens(client.id, salon.id, client.email!);

  res.json({
    success: true,
    data: {
      client: {
        id: client.id,
        email: client.email,
        firstName: client.firstName,
        lastName: client.lastName,
      },
      salon: {
        id: salon.id,
        name: salon.name,
        slug: salon.slug,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
  });
}));

// ============================================
// POST /api/v1/client-auth/refresh
// Refresh access token
// ============================================
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      error: { code: 'NO_TOKEN', message: 'Refresh token required' },
    });
  }

  try {
    const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET || env.JWT_SECRET) as {
      clientId: string;
      salonId: string;
      type: string;
    };

    if (payload.type !== 'client_refresh') {
      throw new Error('Invalid token type');
    }

    // Verify client still exists
    const client = await prisma.client.findUnique({
      where: { id: payload.clientId },
    });

    if (!client) {
      return res.status(401).json({
        success: false,
        error: { code: 'CLIENT_NOT_FOUND', message: 'Client not found' },
      });
    }

    // Generate new tokens
    const tokens = generateClientTokens(client.id, payload.salonId, client.email!);

    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired refresh token' },
    });
  }
}));

export const clientAuthRouter = router;
