import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '@peacase/database';
import { authenticate } from '../middleware/auth.js';
import { staffOnly, ownDataOnly } from '../middleware/staffAuth.js';
import { sendEmail } from '../services/email.js';
import { env } from '../lib/env.js';

const router = Router();

// Async error wrapper
function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Validation schemas
const inviteStaffSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  serviceIds: z.array(z.string()).optional(),
});

const setPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

const staffLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const timeOffRequestSchema = z.object({
  startDate: z.string().transform(s => new Date(s)),
  endDate: z.string().transform(s => new Date(s)),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

const profileUpdateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional().nullable(),
  certifications: z.string().optional(),
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

// ============================================
// POST /api/v1/staff-portal/invite
// Owner/Admin invites a staff member
// ============================================
router.post('/invite', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'owner')) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only owners and admins can invite staff' },
    });
  }

  const data = inviteStaffSchema.parse(req.body);

  // Check if email already exists in this salon
  const existingUser = await prisma.user.findFirst({
    where: { salonId: req.user.salonId, email: data.email },
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: { code: 'EMAIL_EXISTS', message: 'A staff member with this email already exists' },
    });
  }

  // Generate invite token
  const inviteToken = crypto.randomBytes(32).toString('hex');
  const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Create staff user without password
  const staff = await prisma.user.create({
    data: {
      salonId: req.user.salonId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: 'staff',
      commissionRate: data.commissionRate,
      magicLinkToken: inviteToken,
      magicLinkExpires: tokenExpiry,
      isActive: true,
    },
  });

  // Assign services if provided
  if (data.serviceIds && data.serviceIds.length > 0) {
    await prisma.staffService.createMany({
      data: data.serviceIds.map(serviceId => ({
        staffId: staff.id,
        serviceId,
        isAvailable: true,
      })),
    });
  }

  // Get salon info for email
  const salon = await prisma.salon.findUnique({
    where: { id: req.user.salonId },
  });

  // Send invite email
  const inviteUrl = `${env.FRONTEND_URL}/staff/setup?token=${inviteToken}`;

  try {
    await sendEmail({
      to: data.email,
      subject: `You're invited to join ${salon?.name || 'the team'} on Peacase`,
      html: `
        <h2>Welcome to the team!</h2>
        <p>You've been invited to join <strong>${salon?.name || 'the team'}</strong> as a staff member.</p>
        <p>Click the link below to set up your account and password:</p>
        <p><a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background-color: #7C9A82; color: white; text-decoration: none; border-radius: 6px;">Set Up Your Account</a></p>
        <p>This link will expire in 7 days.</p>
        <p>If you didn't expect this invitation, you can safely ignore this email.</p>
      `,
    });
  } catch (emailError) {
    console.error('Failed to send invite email:', emailError);
  }

  res.status(201).json({
    success: true,
    data: {
      staff: {
        id: staff.id,
        email: staff.email,
        firstName: staff.firstName,
        lastName: staff.lastName,
      },
      inviteUrl, // Include for development/testing
    },
  });
}));

// ============================================
// POST /api/v1/staff-portal/setup
// Staff sets their password via invite token
// ============================================
router.post('/setup', asyncHandler(async (req: Request, res: Response) => {
  const data = setPasswordSchema.parse(req.body);

  // Find staff by invite token
  const staff = await prisma.user.findFirst({
    where: {
      magicLinkToken: data.token,
      magicLinkExpires: { gt: new Date() },
      role: 'staff',
    },
    include: { salon: true },
  });

  if (!staff) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired invite link' },
    });
  }

  // Hash password and update user
  const passwordHash = await bcrypt.hash(data.password, 12);

  const updatedStaff = await prisma.user.update({
    where: { id: staff.id },
    data: {
      passwordHash,
      magicLinkToken: null,
      magicLinkExpires: null,
      emailVerified: true,
    },
    include: { salon: true },
  });

  // Generate tokens
  const tokens = generateTokens(staff.id, staff.salonId, staff.role);

  // Store refresh token
  await prisma.refreshToken.create({
    data: {
      userId: staff.id,
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  res.json({
    success: true,
    data: {
      user: {
        id: updatedStaff.id,
        email: updatedStaff.email,
        firstName: updatedStaff.firstName,
        lastName: updatedStaff.lastName,
        role: updatedStaff.role,
      },
      salon: {
        id: updatedStaff.salon.id,
        name: updatedStaff.salon.name,
      },
      tokens,
    },
  });
}));

// ============================================
// POST /api/v1/staff-portal/login
// Staff-specific login (validates role)
// ============================================
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const data = staffLoginSchema.parse(req.body);

  const user = await prisma.user.findFirst({
    where: { email: data.email, isActive: true },
    include: { salon: true },
  });

  if (!user || !user.passwordHash) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
    });
  }

  // Verify this is a staff account
  if (user.role !== 'staff') {
    return res.status(403).json({
      success: false,
      error: { code: 'NOT_STAFF', message: 'Please use the owner login portal' },
    });
  }

  const isValid = await bcrypt.compare(data.password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
    });
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  const tokens = generateTokens(user.id, user.salonId, user.role);

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
        avatarUrl: user.avatarUrl,
      },
      salon: {
        id: user.salon.id,
        name: user.salon.name,
      },
      tokens,
    },
  });
}));

// ============================================
// GET /api/v1/staff-portal/dashboard
// Staff's dashboard data (today's appointments, earnings)
// ============================================
router.get('/dashboard', authenticate, staffOnly, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
  }

  const staffId = req.user.userId;
  const salonId = req.user.salonId;

  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get this week's date range
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  // Today's appointments
  const todayAppointments = await prisma.appointment.findMany({
    where: {
      staffId,
      salonId,
      startTime: { gte: today, lt: tomorrow },
      status: { notIn: ['cancelled'] },
    },
    include: {
      client: { select: { id: true, firstName: true, lastName: true, phone: true } },
      service: { select: { id: true, name: true, durationMinutes: true, color: true } },
    },
    orderBy: { startTime: 'asc' },
  });

  // Upcoming appointments (next 7 days, excluding today)
  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      staffId,
      salonId,
      startTime: { gte: tomorrow, lt: weekEnd },
      status: { notIn: ['cancelled'] },
    },
    include: {
      client: { select: { id: true, firstName: true, lastName: true } },
      service: { select: { id: true, name: true, durationMinutes: true, color: true } },
    },
    orderBy: { startTime: 'asc' },
    take: 10,
  });

  // This month's earnings (commission + tips)
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const commissionRecords = await prisma.commissionRecord.findMany({
    where: {
      staffId,
      salonId,
      createdAt: { gte: monthStart, lte: monthEnd },
    },
  });

  const earnings = {
    commission: commissionRecords.reduce((sum, r) => sum + r.commissionAmount, 0),
    tips: commissionRecords.reduce((sum, r) => sum + r.tipAmount, 0),
    total: commissionRecords.reduce((sum, r) => sum + r.commissionAmount + r.tipAmount, 0),
    period: {
      start: monthStart.toISOString(),
      end: monthEnd.toISOString(),
    },
  };

  // Time off requests
  const timeOffRequests = await prisma.timeOff.findMany({
    where: { staffId },
    orderBy: { startDate: 'desc' },
    take: 5,
  });

  // Staff's availability
  const availability = await prisma.staffAvailability.findMany({
    where: { staffId },
    orderBy: { dayOfWeek: 'asc' },
  });

  res.json({
    success: true,
    data: {
      todayAppointments,
      upcomingAppointments,
      earnings,
      timeOffRequests,
      availability,
      stats: {
        todayCount: todayAppointments.length,
        weekCount: todayAppointments.length + upcomingAppointments.length,
      },
    },
  });
}));

// ============================================
// GET /api/v1/staff-portal/schedule
// Staff's schedule for a date range
// ============================================
router.get('/schedule', authenticate, staffOnly, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
  }

  const staffId = req.user.userId;
  const salonId = req.user.salonId;

  // Parse date range from query
  const startDate = req.query.start ? new Date(req.query.start as string) : new Date();
  const endDate = req.query.end ? new Date(req.query.end as string) : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

  const appointments = await prisma.appointment.findMany({
    where: {
      staffId,
      salonId,
      startTime: { gte: startDate, lte: endDate },
    },
    include: {
      client: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
      service: { select: { id: true, name: true, durationMinutes: true, price: true, color: true } },
    },
    orderBy: { startTime: 'asc' },
  });

  // Get time off in this range
  const timeOff = await prisma.timeOff.findMany({
    where: {
      staffId,
      OR: [
        { startDate: { gte: startDate, lte: endDate } },
        { endDate: { gte: startDate, lte: endDate } },
        { AND: [{ startDate: { lte: startDate } }, { endDate: { gte: endDate } }] },
      ],
    },
  });

  // Get availability
  const availability = await prisma.staffAvailability.findMany({
    where: { staffId },
    orderBy: { dayOfWeek: 'asc' },
  });

  res.json({
    success: true,
    data: {
      appointments,
      timeOff,
      availability,
      dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
    },
  });
}));

// ============================================
// PATCH /api/v1/staff-portal/appointments/:id/complete
// Mark an appointment as completed
// ============================================
router.patch('/appointments/:id/complete', authenticate, staffOnly, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
  }

  const appointmentId = req.params.id;
  const staffId = req.user.userId;

  // Verify the appointment belongs to this staff
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, staffId },
  });

  if (!appointment) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Appointment not found' },
    });
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: 'completed' },
    include: {
      client: { select: { id: true, firstName: true, lastName: true } },
      service: { select: { id: true, name: true } },
    },
  });

  res.json({ success: true, data: updated });
}));

// ============================================
// GET /api/v1/staff-portal/earnings
// Staff's detailed earnings
// ============================================
router.get('/earnings', authenticate, staffOnly, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
  }

  const staffId = req.user.userId;
  const salonId = req.user.salonId;

  // Parse date range
  const startDate = req.query.start ? new Date(req.query.start as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endDate = req.query.end ? new Date(req.query.end as string) : new Date();

  const records = await prisma.commissionRecord.findMany({
    where: {
      staffId,
      salonId,
      createdAt: { gte: startDate, lte: endDate },
    },
    include: {
      appointment: {
        include: {
          service: { select: { name: true } },
          client: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const summary = {
    totalCommission: records.reduce((sum, r) => sum + r.commissionAmount, 0),
    totalTips: records.reduce((sum, r) => sum + r.tipAmount, 0),
    totalServices: records.reduce((sum, r) => sum + r.serviceAmount, 0),
    appointmentCount: records.length,
    paidOut: records.filter(r => r.isPaid).reduce((sum, r) => sum + r.commissionAmount + r.tipAmount, 0),
    pending: records.filter(r => !r.isPaid).reduce((sum, r) => sum + r.commissionAmount + r.tipAmount, 0),
  };

  res.json({
    success: true,
    data: {
      records,
      summary,
      dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
    },
  });
}));

// ============================================
// POST /api/v1/staff-portal/time-off
// Request time off
// ============================================
router.post('/time-off', authenticate, staffOnly, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
  }

  const data = timeOffRequestSchema.parse(req.body);
  const staffId = req.user.userId;

  // Check for overlapping time off
  const overlap = await prisma.timeOff.findFirst({
    where: {
      staffId,
      startDate: { lte: data.endDate },
      endDate: { gte: data.startDate },
    },
  });

  if (overlap) {
    return res.status(400).json({
      success: false,
      error: { code: 'OVERLAP', message: 'You already have time off scheduled during this period' },
    });
  }

  const timeOff = await prisma.timeOff.create({
    data: {
      staffId,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
      notes: data.notes,
    },
  });

  res.status(201).json({ success: true, data: timeOff });
}));

// ============================================
// GET /api/v1/staff-portal/time-off
// Get staff's time off requests
// ============================================
router.get('/time-off', authenticate, staffOnly, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
  }

  const staffId = req.user.userId;

  const timeOff = await prisma.timeOff.findMany({
    where: { staffId },
    orderBy: { startDate: 'desc' },
  });

  res.json({ success: true, data: timeOff });
}));

// ============================================
// DELETE /api/v1/staff-portal/time-off/:id
// Cancel a time off request
// ============================================
router.delete('/time-off/:id', authenticate, staffOnly, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
  }

  const id = req.params.id;
  const staffId = req.user.userId;

  // Verify ownership
  const timeOff = await prisma.timeOff.findFirst({
    where: { id, staffId },
  });

  if (!timeOff) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Time off request not found' },
    });
  }

  // Can only delete future time off
  if (timeOff.startDate < new Date()) {
    return res.status(400).json({
      success: false,
      error: { code: 'PAST_DATE', message: 'Cannot cancel time off that has already started' },
    });
  }

  await prisma.timeOff.delete({ where: { id } });

  res.json({ success: true, data: { message: 'Time off request cancelled' } });
}));

// ============================================
// GET /api/v1/staff-portal/profile
// Get staff profile
// ============================================
router.get('/profile', authenticate, staffOnly, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
  }

  const staff = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatarUrl: true,
      certifications: true,
      commissionRate: true,
      role: true,
      createdAt: true,
      staffServices: {
        include: { service: { select: { id: true, name: true, color: true } } },
      },
      staffAvailability: true,
    },
  });

  if (!staff) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Staff not found' },
    });
  }

  res.json({ success: true, data: staff });
}));

// ============================================
// PATCH /api/v1/staff-portal/profile
// Update staff profile
// ============================================
router.patch('/profile', authenticate, staffOnly, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
  }

  const data = profileUpdateSchema.parse(req.body);

  const updated = await prisma.user.update({
    where: { id: req.user.userId },
    data,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatarUrl: true,
      certifications: true,
    },
  });

  res.json({ success: true, data: updated });
}));

// ============================================
// GET /api/v1/staff-portal/services
// Get services assigned to this staff member
// ============================================
router.get('/services', authenticate, staffOnly, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
  }

  const staffServices = await prisma.staffService.findMany({
    where: { staffId: req.user.userId, isAvailable: true },
    include: {
      service: {
        select: {
          id: true,
          name: true,
          description: true,
          durationMinutes: true,
          price: true,
          color: true,
          category: { select: { id: true, name: true } },
        },
      },
    },
  });

  res.json({
    success: true,
    data: staffServices.map(ss => ss.service),
  });
}));

// ============================================
// GET /api/v1/staff-portal/clients
// Get clients that have had appointments with this staff
// ============================================
router.get('/clients', authenticate, staffOnly, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
  }

  const staffId = req.user.userId;
  const salonId = req.user.salonId;

  // Get unique clients from appointments
  const appointments = await prisma.appointment.findMany({
    where: { staffId, salonId },
    select: { clientId: true },
    distinct: ['clientId'],
  });

  const clientIds = appointments.map(a => a.clientId);

  const clients = await prisma.client.findMany({
    where: { id: { in: clientIds }, isActive: true },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      notes: true,
    },
    orderBy: { lastName: 'asc' },
  });

  res.json({ success: true, data: clients });
}));

export { router as staffPortalRouter };
