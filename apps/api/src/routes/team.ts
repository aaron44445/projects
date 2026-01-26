import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '@peacase/database';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../lib/errorUtils.js';
import { sendEmail } from '../services/email.js';
import { env } from '../lib/env.js';

const router = Router();

// Validation schemas
const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['admin', 'manager', 'staff']).default('staff'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const updateRoleSchema = z.object({
  role: z.enum(['admin', 'manager', 'staff']),
});

// ============================================
// GET /api/v1/team
// List team members
// ============================================
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const salonId = req.user!.salonId;

    const members = await prisma.user.findMany({
      where: { salonId, isActive: true },
      orderBy: [{ role: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        avatarUrl: true,
        emailVerified: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        staffLocations: {
          include: {
            location: { select: { id: true, name: true } },
          },
        },
      },
    });

    res.json({
      success: true,
      data: members,
    });
  })
);

// ============================================
// GET /api/v1/team/invites
// List pending invitations
// ============================================
router.get(
  '/invites',
  authenticate,
  authorize('admin', 'manager'),
  asyncHandler(async (req: Request, res: Response) => {
    const salonId = req.user!.salonId;

    const invites = await prisma.teamInvite.findMany({
      where: {
        salonId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        inviter: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    res.json({
      success: true,
      data: invites.map(invite => ({
        id: invite.id,
        email: invite.email,
        role: invite.role,
        invitedBy: {
          name: `${invite.inviter.firstName} ${invite.inviter.lastName}`.trim(),
          email: invite.inviter.email,
        },
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
      })),
    });
  })
);

// ============================================
// POST /api/v1/team/invite
// Send team invitation
// ============================================
router.post(
  '/invite',
  authenticate,
  authorize('admin', 'manager'),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const salonId = req.user!.salonId;
      const inviterId = req.user!.userId;
      const data = inviteSchema.parse(req.body);

      // Check if user already exists in this salon
      const existingUser = await prisma.user.findFirst({
        where: { salonId, email: data.email.toLowerCase(), isActive: true },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: { code: 'USER_EXISTS', message: 'This email is already a team member' },
        });
      }

      // Check for existing pending invite
      const existingInvite = await prisma.teamInvite.findFirst({
        where: {
          salonId,
          email: data.email.toLowerCase(),
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      if (existingInvite) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVITE_EXISTS', message: 'An invitation is already pending for this email' },
        });
      }

      // Generate invitation token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      // Create invite
      const invite = await prisma.teamInvite.create({
        data: {
          salonId,
          email: data.email.toLowerCase(),
          role: data.role,
          invitedBy: inviterId,
          token,
          expiresAt,
        },
        include: {
          salon: { select: { name: true } },
          inviter: { select: { firstName: true, lastName: true } },
        },
      });

      // Build invite URL
      const inviteUrl = `${env.FRONTEND_URL}/accept-invite?token=${token}`;

      // Send invitation email
      try {
        await sendEmail({
          to: data.email,
          subject: `You've been invited to join ${invite.salon.name} on Peacase`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>You're Invited!</h2>
              <p>${invite.inviter.firstName} ${invite.inviter.lastName} has invited you to join <strong>${invite.salon.name}</strong> as a ${data.role} on Peacase.</p>
              <p>Click the button below to accept the invitation and set up your account:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteUrl}" style="background-color: #7C9A82; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept Invitation</a>
              </div>
              <p style="color: #666; font-size: 14px;">This invitation expires in 7 days.</p>
              <p style="color: #666; font-size: 14px;">If you didn't expect this invitation, you can ignore this email.</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send invite email:', emailError);
        // Don't fail the request - invite is created, email just didn't send
      }

      res.status(201).json({
        success: true,
        data: {
          id: invite.id,
          email: invite.email,
          role: invite.role,
          expiresAt: invite.expiresAt,
          message: 'Invitation sent successfully',
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.flatten().fieldErrors;
        const firstField = Object.keys(fieldErrors)[0];
        const firstMessage = firstField && fieldErrors[firstField]?.[0]
          ? fieldErrors[firstField]![0]
          : 'Please check your input';

        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: firstMessage },
        });
      }
      throw error;
    }
  })
);

// ============================================
// POST /api/v1/team/invite/:id/resend
// Resend invitation email
// ============================================
router.post(
  '/invite/:id/resend',
  authenticate,
  authorize('admin', 'manager'),
  asyncHandler(async (req: Request, res: Response) => {
    const salonId = req.user!.salonId;
    const inviteId = req.params.id;

    const invite = await prisma.teamInvite.findFirst({
      where: { id: inviteId, salonId, acceptedAt: null },
      include: {
        salon: { select: { name: true } },
        inviter: { select: { firstName: true, lastName: true } },
      },
    });

    if (!invite) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Invitation not found' },
      });
    }

    // Generate new token and extend expiry
    const newToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.teamInvite.update({
      where: { id: inviteId },
      data: { token: newToken, expiresAt },
    });

    // Build invite URL
    const inviteUrl = `${env.FRONTEND_URL}/accept-invite?token=${newToken}`;

    // Resend email
    try {
      await sendEmail({
        to: invite.email,
        subject: `Reminder: You've been invited to join ${invite.salon.name} on Peacase`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Invitation Reminder</h2>
            <p>${invite.inviter.firstName} ${invite.inviter.lastName} invited you to join <strong>${invite.salon.name}</strong> as a ${invite.role} on Peacase.</p>
            <p>Click the button below to accept the invitation and set up your account:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" style="background-color: #7C9A82; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept Invitation</a>
            </div>
            <p style="color: #666; font-size: 14px;">This invitation expires in 7 days.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to resend invite email:', emailError);
    }

    res.json({
      success: true,
      data: { message: 'Invitation resent successfully' },
    });
  })
);

// ============================================
// DELETE /api/v1/team/invites/:id
// Cancel invitation
// ============================================
router.delete(
  '/invites/:id',
  authenticate,
  authorize('admin', 'manager'),
  asyncHandler(async (req: Request, res: Response) => {
    const salonId = req.user!.salonId;
    const inviteId = req.params.id;

    const invite = await prisma.teamInvite.findFirst({
      where: { id: inviteId, salonId },
    });

    if (!invite) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Invitation not found' },
      });
    }

    await prisma.teamInvite.delete({
      where: { id: inviteId },
    });

    res.json({
      success: true,
      data: { message: 'Invitation cancelled' },
    });
  })
);

// ============================================
// PATCH /api/v1/team/:userId/role
// Change team member role
// ============================================
router.patch(
  '/:userId/role',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const salonId = req.user!.salonId;
      const currentUserId = req.user!.userId;
      const targetUserId = req.params.userId;
      const data = updateRoleSchema.parse(req.body);

      // Can't change your own role
      if (targetUserId === currentUserId) {
        return res.status(400).json({
          success: false,
          error: { code: 'SELF_MODIFY', message: 'You cannot change your own role' },
        });
      }

      // Find target user
      const targetUser = await prisma.user.findFirst({
        where: { id: targetUserId, salonId, isActive: true },
      });

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Team member not found' },
        });
      }

      // Update role
      const updated = await prisma.user.update({
        where: { id: targetUserId },
        data: { role: data.role },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid role' },
        });
      }
      throw error;
    }
  })
);

// ============================================
// DELETE /api/v1/team/:userId
// Remove team member
// ============================================
router.delete(
  '/:userId',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const salonId = req.user!.salonId;
    const currentUserId = req.user!.userId;
    const targetUserId = req.params.userId;

    // Can't remove yourself
    if (targetUserId === currentUserId) {
      return res.status(400).json({
        success: false,
        error: { code: 'SELF_REMOVE', message: 'You cannot remove yourself from the team' },
      });
    }

    // Find target user
    const targetUser = await prisma.user.findFirst({
      where: { id: targetUserId, salonId },
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Team member not found' },
      });
    }

    // Soft delete - deactivate user
    await prisma.user.update({
      where: { id: targetUserId },
      data: { isActive: false },
    });

    // Revoke all sessions
    await prisma.userSession.updateMany({
      where: { userId: targetUserId },
      data: { isRevoked: true },
    });

    // Delete refresh tokens
    await prisma.refreshToken.deleteMany({
      where: { userId: targetUserId },
    });

    res.json({
      success: true,
      data: { message: 'Team member removed' },
    });
  })
);

// ============================================
// POST /api/v1/team/:userId/reactivate
// Reactivate a removed team member
// ============================================
router.post(
  '/:userId/reactivate',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const salonId = req.user!.salonId;
    const targetUserId = req.params.userId;

    // Find target user (including inactive)
    const targetUser = await prisma.user.findFirst({
      where: { id: targetUserId, salonId, isActive: false },
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Deactivated team member not found' },
      });
    }

    // Reactivate user
    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { isActive: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    res.json({
      success: true,
      data: updated,
    });
  })
);

export { router as teamRouter };
