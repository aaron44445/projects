import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../lib/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
} from '../lib/jwt.js';
import { generateSecureToken, getExpiryDate } from '../utils/token.js';
import { sendInvitationEmail } from '../lib/email.js';
import {
  CreateInvitationInput,
  AcceptInvitationInput,
} from '../schemas/auth.schema.js';
import { AuthenticatedRequest } from '../types/index.js';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from '../middleware/errorHandler.js';

/**
 * Create a team invitation
 */
export async function createInvitation(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, role } = req.body as CreateInvitationInput;
    const user = req.user;

    // Managers can only invite staff
    if (user.role === 'MANAGER' && role === 'MANAGER') {
      throw new ForbiddenError('Managers can only invite staff members');
    }

    // Check if email already exists in organization
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        organizationId: user.organizationId,
      },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists in your organization');
    }

    // Check for existing pending invitation
    const existingInvite = await prisma.invitation.findFirst({
      where: {
        email,
        organizationId: user.organizationId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      throw new ConflictError('An invitation has already been sent to this email');
    }

    // Get organization and inviter info
    const [organization, inviter] = await Promise.all([
      prisma.organization.findUnique({ where: { id: user.organizationId } }),
      prisma.user.findUnique({ where: { id: user.userId } }),
    ]);

    if (!organization || !inviter) {
      throw new NotFoundError('Organization');
    }

    // Create invitation
    const token = generateSecureToken();
    const invitation = await prisma.invitation.create({
      data: {
        email,
        role: role as any,
        token,
        organizationId: user.organizationId,
        invitedById: user.userId,
        expiresAt: getExpiryDate(168), // 7 days
      },
    });

    // Send invitation email
    await sendInvitationEmail(email, token, organization.name, inviter.name);

    res.status(201).json({
      data: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List pending invitations for organization
 */
export async function listInvitations(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const invitations = await prisma.invitation.findMany({
      where: {
        organizationId: req.user.organizationId,
        acceptedAt: null,
      },
      include: {
        invitedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      data: invitations.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        invitedBy: inv.invitedBy,
        expiresAt: inv.expiresAt,
        expired: inv.expiresAt < new Date(),
        createdAt: inv.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cancel/delete an invitation
 */
export async function deleteInvitation(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const invitation = await prisma.invitation.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId,
      },
    });

    if (!invitation) {
      throw new NotFoundError('Invitation');
    }

    if (invitation.acceptedAt) {
      throw new ValidationError([
        { field: 'id', message: 'Cannot delete an accepted invitation' },
      ]);
    }

    await prisma.invitation.delete({ where: { id } });

    res.json({ data: { message: 'Invitation deleted' } });
  } catch (error) {
    next(error);
  }
}

/**
 * Get invitation details by token (public endpoint)
 */
export async function getInvitation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token } = req.params;

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        organization: {
          select: { id: true, name: true, slug: true },
        },
        invitedBy: {
          select: { name: true },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundError('Invitation');
    }

    if (invitation.acceptedAt) {
      throw new ValidationError([
        { field: 'token', message: 'Invitation has already been accepted' },
      ]);
    }

    if (invitation.expiresAt < new Date()) {
      throw new ValidationError([
        { field: 'token', message: 'Invitation has expired' },
      ]);
    }

    res.json({
      data: {
        email: invitation.email,
        role: invitation.role,
        organization: invitation.organization,
        invitedBy: invitation.invitedBy.name,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Accept invitation and create account
 */
export async function acceptInvitation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token, name, password } = req.body as AcceptInvitationInput;

    // Find invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { organization: true },
    });

    if (!invitation) {
      throw new NotFoundError('Invitation');
    }

    if (invitation.acceptedAt) {
      throw new ValidationError([
        { field: 'token', message: 'Invitation has already been accepted' },
      ]);
    }

    if (invitation.expiresAt < new Date()) {
      throw new ValidationError([
        { field: 'token', message: 'Invitation has expired' },
      ]);
    }

    // Check if email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      throw new ConflictError('Email is already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user and mark invitation as accepted
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: invitation.email,
          passwordHash,
          name,
          role: invitation.role,
          organizationId: invitation.organizationId,
          emailVerifiedAt: new Date(), // Email verified via invitation
        },
      });

      // Mark invitation as accepted
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });

      // Create refresh token
      const refreshTokenRecord = await tx.refreshToken.create({
        data: {
          userId: user.id,
          token: generateSecureToken(),
          expiresAt: getRefreshTokenExpiry(),
        },
      });

      return { user, refreshToken: refreshTokenRecord.token };
    });

    // Generate access token
    const accessToken = generateAccessToken({
      userId: result.user.id,
      email: result.user.email,
      organizationId: invitation.organizationId,
      role: result.user.role,
    });

    res.status(201).json({
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          emailVerified: true,
        },
        organization: {
          id: invitation.organization.id,
          name: invitation.organization.name,
          slug: invitation.organization.slug,
        },
        accessToken,
        refreshToken: result.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
}
