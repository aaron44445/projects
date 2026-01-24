import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '@peacase/database';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../lib/errorUtils.js';
import { sendEmail } from '../services/email.js';
import { env } from '../lib/env.js';

const router = Router();

// ============================================
// GET /api/v1/staff
// List staff members with services and availability
// ============================================
router.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { locationId } = req.query;

  let users;

  if (locationId) {
    // Filter by location - get staff assigned to this location
    // ALSO include staff with NO location assignments (they work at all locations)
    const staffAtLocation = await prisma.staffLocation.findMany({
      where: {
        locationId: locationId as string,
        staff: {
          salonId: req.user!.salonId,
          isActive: true,
        },
      },
      include: {
        staff: {
          include: {
            staffServices: {
              include: { service: true },
            },
            staffAvailability: true,
            staffLocations: {
              include: {
                location: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    });

    const assignedStaff = staffAtLocation.map((sl) => sl.staff);
    const assignedStaffIds = assignedStaff.map((s) => s.id);

    // Also get staff with NO location assignments (treat them as available at all locations)
    const unassignedStaff = await prisma.user.findMany({
      where: {
        salonId: req.user!.salonId,
        isActive: true,
        staffLocations: {
          none: {},
        },
        id: {
          notIn: assignedStaffIds,
        },
      },
      include: {
        staffServices: {
          include: { service: true },
        },
        staffAvailability: true,
        staffLocations: {
          include: {
            location: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    users = [...assignedStaff, ...unassignedStaff];
  } else {
    // No location filter - return all staff
    users = await prisma.user.findMany({
      where: {
        salonId: req.user!.salonId,
        isActive: true,
      },
      include: {
        staffServices: {
          include: { service: true },
        },
        staffAvailability: true,
        staffLocations: {
          include: {
            location: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  res.json({
    success: true,
    data: users,
  });
}));

// ============================================
// GET /api/v1/staff/:id
// Get staff member details
// ============================================
router.get('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findFirst({
    where: {
      id: req.params.id,
      salonId: req.user!.salonId,
    },
    include: {
      staffAvailability: true,
      staffServices: {
        include: { service: true },
      },
    },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Staff member not found',
      },
    });
  }

  res.json({
    success: true,
    data: user,
  });
}));

// ============================================
// POST /api/v1/staff
// Create staff member (admin/owner only)
// ============================================
router.post(
  '/',
  authenticate,
  authorize('admin', 'owner'),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, firstName, lastName, phone, role, certifications, commissionRate } = req.body;

    if (!email || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Email, first name, and last name are required',
        },
      });
    }

    // Check if email exists in this salon (only check active staff)
    const existing = await prisma.user.findFirst({
      where: { salonId: req.user!.salonId, email, isActive: true },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'A staff member with this email already exists',
        },
      });
    }

    // Check if there's a deactivated user with this email - clear their email to allow reuse
    const deactivatedUser = await prisma.user.findFirst({
      where: { salonId: req.user!.salonId, email, isActive: false },
    });

    if (deactivatedUser) {
      // Anonymize the deactivated user's email to free up the address
      await prisma.user.update({
        where: { id: deactivatedUser.id },
        data: { email: `deleted_${Date.now()}_${email}` },
      });
    }

    // Generate invite token for password setup
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const user = await prisma.user.create({
      data: {
        salonId: req.user!.salonId,
        email,
        firstName,
        lastName,
        phone,
        role: role || 'staff',
        certifications,
        commissionRate: commissionRate ? parseFloat(commissionRate) : null,
        magicLinkToken: inviteToken,
        magicLinkExpires: tokenExpiry,
        isActive: true,
      },
      include: {
        staffServices: true,
        staffAvailability: true,
      },
    });

    // Get salon info for email
    const salon = await prisma.salon.findUnique({
      where: { id: req.user!.salonId },
    });

    // Send invitation email
    const inviteUrl = `${env.FRONTEND_URL}/staff/setup?token=${inviteToken}`;
    console.log(`[STAFF CREATE] Sending invite email to ${email}, inviteUrl: ${inviteUrl}`);

    try {
      const emailSent = await sendEmail({
        to: email,
        subject: `You're invited to join ${salon?.name || 'the team'} on Peacase`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #2C2C2C; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; }
              .header { background: linear-gradient(135deg, #7C9A82 0%, #9BB5A0 100%); padding: 40px 30px; text-align: center; }
              .header h1 { margin: 0; color: white; font-size: 28px; }
              .header p { margin: 10px 0 0 0; color: rgba(255,255,255,0.9); }
              .content { background: #FFFFFF; padding: 40px 30px; }
              .button { display: inline-block; background: #7C9A82; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; }
              .footer { background: #FAF8F3; padding: 30px; text-align: center; font-size: 13px; color: #666; }
              .info-box { background: #F5F9F6; border-left: 4px solid #7C9A82; padding: 15px 20px; margin: 25px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to the Team!</h1>
                <p>You've been invited to join ${salon?.name || 'the team'}</p>
              </div>
              <div class="content">
                <p>Hi ${firstName},</p>
                <p>Great news! You've been added as a <strong>${role || 'staff'}</strong> member at <strong>${salon?.name || 'our salon'}</strong>.</p>
                <p>To get started, click the button below to set up your password and access your staff portal:</p>
                <p style="text-align: center; margin: 30px 0;">
                  <a href="${inviteUrl}" class="button">Set Up Your Account</a>
                </p>
                <div class="info-box">
                  <p style="margin: 0;"><strong>What you can do in your staff portal:</strong></p>
                  <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                    <li>View your schedule and upcoming appointments</li>
                    <li>Track your earnings and commissions</li>
                    <li>Request time off</li>
                    <li>Update your profile and availability</li>
                  </ul>
                </div>
                <p style="color: #666; font-size: 14px;">This link will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.</p>
              </div>
              <div class="footer">
                <p><strong>${salon?.name || 'Our Salon'}</strong></p>
                <p>Powered by Peacase</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      console.log(`Staff invite email ${emailSent ? 'sent' : 'failed'} for ${email}`);
    } catch (emailError) {
      console.error('Failed to send staff invite email:', emailError);
      // Don't fail the request if email fails - staff is still created
    }

    res.status(201).json({
      success: true,
      data: user,
    });
  })
);

// ============================================
// PATCH /api/v1/staff/:id
// Update staff member
// ============================================
router.patch('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, phone, role, certifications, avatarUrl, commissionRate, isActive, onlineBookingEnabled } = req.body;

  // Check if user can update this staff member
  const targetUser = await prisma.user.findFirst({
    where: { id: req.params.id, salonId: req.user!.salonId },
  });

  if (!targetUser) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Staff member not found',
      },
    });
  }

  // Only admins/owners can change roles
  if (role && !['admin', 'owner'].includes(req.user!.role)) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Only admins can change user roles',
      },
    });
  }

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(phone !== undefined && { phone }),
      ...(role !== undefined && { role }),
      ...(certifications !== undefined && { certifications }),
      ...(avatarUrl !== undefined && { avatarUrl }),
      ...(commissionRate !== undefined && { commissionRate: parseFloat(commissionRate) }),
      ...(isActive !== undefined && { isActive }),
      ...(onlineBookingEnabled !== undefined && { onlineBookingEnabled }),
    },
    include: {
      staffServices: true,
      staffAvailability: true,
    },
  });

  res.json({
    success: true,
    data: user,
  });
}));

// ============================================
// DELETE /api/v1/staff/:id
// Deactivate staff member (admin only)
// ============================================
router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'owner'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = await prisma.user.findFirst({
      where: { id: req.params.id, salonId: req.user!.salonId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Staff member not found',
        },
      });
    }

    // Soft delete - also anonymize email to allow reuse
    await prisma.user.update({
      where: { id: req.params.id },
      data: {
        isActive: false,
        // Anonymize email so it can be reused for new staff
        email: `deleted_${Date.now()}_${user.email}`,
      },
    });

    res.json({
      success: true,
      data: { message: 'Staff member deactivated' },
    });
  })
);

// ============================================
// PUT /api/v1/staff/:id/availability
// Set staff availability schedule
// ============================================
router.put('/:id/availability', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { availability } = req.body;
  const staffId = req.params.id;

  // Verify staff belongs to salon
  const user = await prisma.user.findFirst({
    where: { id: staffId, salonId: req.user!.salonId },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Staff member not found',
      },
    });
  }

  if (!Array.isArray(availability)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Availability must be an array',
      },
    });
  }

  // Delete existing availability and create new
  await prisma.staffAvailability.deleteMany({
    where: { staffId },
  });

  if (availability.length > 0) {
    await prisma.staffAvailability.createMany({
      data: availability.map((a: { dayOfWeek: number; startTime: string; endTime: string; isAvailable?: boolean }) => ({
        staffId,
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
        isAvailable: a.isAvailable !== false,
      })),
    });
  }

  res.json({
    success: true,
    data: { message: 'Availability updated' },
  });
}));

// ============================================
// PUT /api/v1/staff/:id/services
// Set staff services (which services they can perform)
// ============================================
router.put('/:id/services', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { serviceIds } = req.body;
  const staffId = req.params.id;

  // Verify staff belongs to salon
  const user = await prisma.user.findFirst({
    where: { id: staffId, salonId: req.user!.salonId },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Staff member not found',
      },
    });
  }

  if (!Array.isArray(serviceIds)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'serviceIds must be an array',
      },
    });
  }

  // Verify all services belong to this salon
  if (serviceIds.length > 0) {
    const services = await prisma.service.findMany({
      where: {
        id: { in: serviceIds },
        salonId: req.user!.salonId,
      },
    });

    // Verify that all requested service IDs were found
    const foundServiceIds = services.map(s => s.id);
    const missingServiceIds = serviceIds.filter(id => !foundServiceIds.includes(id));

    if (missingServiceIds.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SERVICES',
          message: 'One or more services not found',
        },
      });
    }
  }

  // Delete existing staff services and create new
  await prisma.staffService.deleteMany({
    where: { staffId },
  });

  if (serviceIds.length > 0) {
    await prisma.staffService.createMany({
      data: serviceIds.map((serviceId: string) => ({
        staffId,
        serviceId,
        isAvailable: true,
      })),
    });
  }

  res.json({
    success: true,
    data: { message: 'Staff services updated' },
  });
}));

// ============================================
// POST /api/v1/staff/test-email
// Test email sending (owner only, for debugging)
// ============================================
router.post('/test-email', authenticate, authorize('owner'), asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: { code: 'EMAIL_REQUIRED', message: 'Email address is required' },
    });
  }

  console.log(`[TEST EMAIL] Attempting to send test email to: ${email}`);

  const salon = await prisma.salon.findUnique({
    where: { id: req.user!.salonId },
  });

  try {
    const emailSent = await sendEmail({
      to: email,
      subject: `Test Email from ${salon?.name || 'Peacase'}`,
      html: `
        <h2>Test Email</h2>
        <p>This is a test email to verify the email service is working.</p>
        <p>Sent at: ${new Date().toISOString()}</p>
        <p>Salon: ${salon?.name || 'Unknown'}</p>
      `,
    });

    console.log(`[TEST EMAIL] Result: ${emailSent ? 'SUCCESS' : 'FAILED'}`);

    res.json({
      success: true,
      data: {
        emailSent,
        sentTo: email,
        message: emailSent ? 'Test email sent successfully' : 'Email sending failed - check server logs',
      },
    });
  } catch (error: any) {
    console.error('[TEST EMAIL] Error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'EMAIL_ERROR', message: error.message || 'Failed to send test email' },
    });
  }
}));

export { router as staffRouter };
