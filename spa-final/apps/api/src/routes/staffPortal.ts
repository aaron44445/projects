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
import { asyncHandler } from '../lib/errorUtils.js';
import { loginRateLimit } from '../middleware/rateLimit.js';

const router = Router();

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
  type: z.enum(['vacation', 'sick', 'personal', 'other']).default('vacation'),
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

// Token expiration constants
const ACCESS_TOKEN_EXPIRY = '7d';  // 7 days - long-lived for better UX
const REFRESH_TOKEN_EXPIRY = '30d'; // 30 days
const REFRESH_TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

// Generate tokens
function generateTokens(userId: string, salonId: string, role: string) {
  const accessToken = jwt.sign(
    { userId, salonId, role },
    env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { userId, salonId, role, type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
}

// ============================================
// AUTH ROUTES (for frontend compatibility)
// These mirror the main routes but at /auth/ path
// ============================================

// POST /api/v1/staff-portal/auth/login
// Staff login via /auth/ path (frontend expects this)
router.post('/auth/login', loginRateLimit, asyncHandler(async (req: Request, res: Response) => {
  const data = staffLoginSchema.parse(req.body);

  const user = await prisma.user.findFirst({
    where: { email: data.email.toLowerCase().trim(), isActive: true },
    include: { salon: true },
  });

  if (!user || !user.passwordHash) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
    });
  }

  // Verify this is a staff account (staff, admin, owner, manager are all valid)
  if (!['staff', 'admin', 'owner', 'manager', 'receptionist'].includes(user.role)) {
    return res.status(403).json({
      success: false,
      error: { code: 'NOT_STAFF', message: 'Invalid account type for staff portal' },
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
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
    },
  });

  // Get staff locations for multi-location support
  const staffLocations = await prisma.staffLocation.findMany({
    where: { staffId: user.id },
    include: { location: { select: { id: true, name: true } } },
  });

  res.json({
    success: true,
    data: {
      staff: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        salonId: user.salonId,
        salonName: user.salon.name,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        assignedLocations: staffLocations.map(sl => ({
          id: sl.location.id,
          name: sl.location.name,
          isPrimary: sl.isPrimary,
        })),
        primaryLocationId: staffLocations.find(sl => sl.isPrimary)?.location.id,
      },
      tokens,
    },
  });
}));

// POST /api/v1/staff-portal/auth/refresh
// Refresh staff tokens
router.post('/auth/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_TOKEN', message: 'Refresh token is required' },
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
        error: { code: 'INVALID_TOKEN', message: 'Invalid or expired refresh token' },
      });
    }

    // Generate new tokens
    const tokens = generateTokens(decoded.userId, decoded.salonId, decoded.role);

    // Update refresh token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
      },
    });

    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired refresh token' },
    });
  }
}));

// POST /api/v1/staff-portal/auth/logout
// Staff logout
router.post('/auth/logout', asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      // Try to decode to get userId
      const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
      // Delete all refresh tokens for this user (logout from all devices)
      await prisma.refreshToken.deleteMany({
        where: { userId: decoded.userId },
      });
    } catch {
      // Ignore errors - logout should always succeed
    }
  }

  res.json({
    success: true,
    data: { message: 'Logged out successfully' },
  });
}));

// GET /api/v1/staff-portal/me
// Get current staff user data
router.get('/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    include: { salon: true },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'User not found' },
    });
  }

  // Get staff locations for multi-location support
  const staffLocations = await prisma.staffLocation.findMany({
    where: { staffId: user.id },
    include: { location: { select: { id: true, name: true } } },
  });

  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      certifications: user.certifications,
      commissionRate: user.commissionRate,
      salonId: user.salonId,
      salonName: user.salon.name,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      assignedLocations: staffLocations.map(sl => ({
        id: sl.location.id,
        name: sl.location.name,
        isPrimary: sl.isPrimary,
      })),
      primaryLocationId: staffLocations.find(sl => sl.isPrimary)?.location.id,
    },
  });
}));

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
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
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
router.post('/login', loginRateLimit, asyncHandler(async (req: Request, res: Response) => {
  const data = staffLoginSchema.parse(req.body);

  const user = await prisma.user.findFirst({
    where: { email: data.email.toLowerCase().trim(), isActive: true },
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
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
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
  const salonId = req.user.salonId;

  // Check if staff can request time off
  const salon = await prisma.salon.findUnique({
    where: { id: salonId },
    select: { staffCanRequestTimeOff: true },
  });

  if (!salon?.staffCanRequestTimeOff) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Time off requests are disabled. Contact your manager.' },
    });
  }

  // Check for overlapping time off (excluding rejected)
  const overlap = await prisma.timeOff.findFirst({
    where: {
      staffId,
      status: { not: 'rejected' },
      startDate: { lte: data.endDate },
      endDate: { gte: data.startDate },
    },
  });

  if (overlap) {
    return res.status(400).json({
      success: false,
      error: { code: 'OVERLAP', message: 'You already have a time off request for these dates' },
    });
  }

  const timeOff = await prisma.timeOff.create({
    data: {
      staffId,
      startDate: data.startDate,
      endDate: data.endDate,
      type: data.type,
      reason: data.reason,
      notes: data.notes,
      status: 'pending',
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
  const { status } = req.query;

  const timeOffs = await prisma.timeOff.findMany({
    where: {
      staffId,
      ...(status ? { status: status as string } : {}),
    },
    orderBy: { startDate: 'desc' },
    include: {
      reviewer: {
        select: { firstName: true, lastName: true },
      },
    },
  });

  res.json({
    success: true,
    data: timeOffs.map(t => ({
      id: t.id,
      startDate: t.startDate,
      endDate: t.endDate,
      type: t.type,
      reason: t.reason,
      notes: t.notes,
      status: t.status,
      reviewedAt: t.reviewedAt,
      reviewedBy: t.reviewer ? `${t.reviewer.firstName} ${t.reviewer.lastName}` : null,
      reviewNotes: t.reviewNotes,
      createdAt: t.createdAt,
    })),
  });
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

  // Can only delete pending time off
  if (timeOff.status !== 'pending') {
    return res.status(400).json({
      success: false,
      error: { code: 'ALREADY_REVIEWED', message: 'Cannot cancel time off that has already been reviewed' },
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

// ============================================
// GET /api/v1/staff-portal/my-schedule
// Get current staff member's working hours
// ============================================
router.get('/my-schedule', authenticate, staffOnly, asyncHandler(async (req: Request, res: Response) => {
  const staffId = req.user!.userId;
  const { locationId } = req.query;

  // Get staff's location assignments
  const staffLocations = await prisma.staffLocation.findMany({
    where: { staffId },
    include: {
      location: {
        select: { id: true, name: true, isPrimary: true },
      },
    },
  });

  // Get availability for all locations or specific location
  const availability = await prisma.staffAvailability.findMany({
    where: {
      staffId,
      ...(locationId ? { locationId: locationId as string } : {}),
    },
    orderBy: [{ locationId: 'asc' }, { dayOfWeek: 'asc' }],
  });

  // Group by location
  const scheduleByLocation: Record<string, {
    location: { id: string; name: string; isPrimary: boolean };
    isPrimary: boolean;
    schedule: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      isAvailable: boolean;
      locationId: string | null;
    }>;
  }> = {};

  for (const loc of staffLocations) {
    const locationAvailability = availability.filter(a =>
      a.locationId === loc.locationId || (a.locationId === null && !locationId)
    );

    // Create 7-day schedule with defaults
    const days = [0, 1, 2, 3, 4, 5, 6].map(dayOfWeek => {
      const existing = locationAvailability.find(a => a.dayOfWeek === dayOfWeek);
      return existing ? {
        dayOfWeek: existing.dayOfWeek,
        startTime: existing.startTime,
        endTime: existing.endTime,
        isAvailable: existing.isAvailable,
        locationId: existing.locationId,
      } : {
        dayOfWeek,
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: false,
        locationId: loc.locationId,
      };
    });

    scheduleByLocation[loc.locationId] = {
      location: loc.location,
      isPrimary: loc.isPrimary,
      schedule: days,
    };
  }

  // Calculate total hours per week
  const totalHoursPerWeek = availability
    .filter(a => a.isAvailable)
    .reduce((total, a) => {
      const [startH, startM] = a.startTime.split(':').map(Number);
      const [endH, endM] = a.endTime.split(':').map(Number);
      const hours = (endH + endM / 60) - (startH + startM / 60);
      return total + hours;
    }, 0);

  res.json({
    success: true,
    data: {
      locations: staffLocations.map(sl => sl.location),
      scheduleByLocation,
      totalHoursPerWeek: Math.round(totalHoursPerWeek * 10) / 10,
    },
  });
}));

// ============================================
// PUT /api/v1/staff-portal/my-schedule
// Update staff member's working hours
// ============================================
router.put('/my-schedule', authenticate, staffOnly, asyncHandler(async (req: Request, res: Response) => {
  const staffId = req.user!.userId;
  const salonId = req.user!.salonId;
  const { locationId, schedule } = req.body;

  if (!Array.isArray(schedule) || schedule.length !== 7) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Schedule must be array of 7 days' },
    });
  }

  // Check salon settings
  const salon = await prisma.salon.findUnique({
    where: { id: salonId },
    select: {
      staffCanEditSchedule: true,
      staffScheduleNeedsApproval: true,
    },
  });

  if (!salon?.staffCanEditSchedule) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Schedule editing is disabled. Contact your manager.' },
    });
  }

  // Verify staff is assigned to this location (if locationId provided)
  if (locationId) {
    const staffLocation = await prisma.staffLocation.findUnique({
      where: { staffId_locationId: { staffId, locationId } },
    });
    if (!staffLocation) {
      return res.status(400).json({
        success: false,
        error: { code: 'NOT_ASSIGNED', message: 'You are not assigned to this location' },
      });
    }
  }

  // If approval required, create change requests instead
  if (salon.staffScheduleNeedsApproval) {
    const requests = await Promise.all(
      schedule.map((s: { dayOfWeek: number; startTime: string; endTime: string; isWorking: boolean }) =>
        prisma.scheduleChangeRequest.create({
          data: {
            staffId,
            locationId: locationId || null,
            dayOfWeek: s.dayOfWeek,
            newStartTime: s.isWorking ? s.startTime : null,
            newEndTime: s.isWorking ? s.endTime : null,
            newIsWorking: s.isWorking,
            status: 'pending',
          },
        })
      )
    );

    return res.json({
      success: true,
      data: {
        pendingApproval: true,
        message: 'Schedule changes submitted for approval',
        requests,
      },
    });
  }

  // Direct update (no approval needed)
  const updated = await Promise.all(
    schedule.map((s: { dayOfWeek: number; startTime: string; endTime: string; isWorking: boolean }) =>
      prisma.staffAvailability.upsert({
        where: {
          staffId_locationId_dayOfWeek: {
            staffId,
            locationId: locationId || null,
            dayOfWeek: s.dayOfWeek,
          },
        },
        create: {
          staffId,
          locationId: locationId || null,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          isAvailable: s.isWorking,
        },
        update: {
          startTime: s.startTime,
          endTime: s.endTime,
          isAvailable: s.isWorking,
        },
      })
    )
  );

  res.json({
    success: true,
    data: {
      pendingApproval: false,
      schedule: updated,
    },
  });
}));

// ============================================
// GET /api/v1/staff-portal/my-assignments
// Get staff's location and service assignments
// ============================================
router.get('/my-assignments', authenticate, staffOnly, asyncHandler(async (req: Request, res: Response) => {
  const staffId = req.user!.userId;

  // Get location assignments
  const locations = await prisma.staffLocation.findMany({
    where: { staffId },
    include: {
      location: {
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          state: true,
          isPrimary: true,
        },
      },
    },
    orderBy: { isPrimary: 'desc' },
  });

  // Get service assignments
  const services = await prisma.staffService.findMany({
    where: { staffId, isAvailable: true },
    include: {
      service: {
        select: {
          id: true,
          name: true,
          price: true,
          durationMinutes: true,
          category: {
            select: { name: true },
          },
        },
      },
    },
  });

  res.json({
    success: true,
    data: {
      locations: locations.map(l => ({
        ...l.location,
        isPrimaryForStaff: l.isPrimary,
      })),
      services: services.map(s => ({
        id: s.service.id,
        name: s.service.name,
        price: s.service.price,
        durationMinutes: s.service.durationMinutes,
        category: s.service.category?.name || 'Uncategorized',
      })),
    },
  });
}));

export { router as staffPortalRouter };
