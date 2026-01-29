import { Router, Request, Response } from 'express';
import { prisma, Prisma } from '@peacase/database';
import { authenticate } from '../middleware/auth.js';
import { requireActiveSubscription, requireAddon } from '../middleware/subscription.js';
import { asyncHandler } from '../lib/errorUtils.js';
import { sendNotification, NotificationPayload } from '../services/notifications.js';
import logger from '../lib/logger.js';
import { withSalonId } from '../lib/prismaUtils.js';

const router = Router();

// All notification routes require active subscription
router.use(authenticate, requireActiveSubscription());

// GET /notifications - List notification history
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const salonId = req.user!.salonId;
  const {
    type,
    status,
    clientId,
    startDate,
    endDate,
    page = '1',
    limit = '50',
  } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = Math.min(parseInt(limit as string, 10), 100);  // Max 100 per page
  const skip = (pageNum - 1) * limitNum;

  // Build where clause
  const where: Prisma.NotificationLogWhereInput = { ...withSalonId(salonId) };

  if (type) where.type = type as string;
  if (status) where.status = status as string;
  if (clientId) where.clientId = clientId as string;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Prisma.DateTimeFilter).gte = new Date(startDate as string);
    if (endDate) (where.createdAt as Prisma.DateTimeFilter).lte = new Date(endDate as string);
  }

  const [notifications, total] = await Promise.all([
    prisma.notificationLog.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        appointment: {
          select: {
            id: true,
            startTime: true,
            service: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.notificationLog.count({ where }),
  ]);

  res.json({
    success: true,
    data: notifications,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
}));

// GET /notifications/stats - Get notification statistics
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const salonId = req.user!.salonId;
  const { startDate, endDate } = req.query;

  const where: Prisma.NotificationLogWhereInput = { ...withSalonId(salonId) };
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Prisma.DateTimeFilter).gte = new Date(startDate as string);
    if (endDate) (where.createdAt as Prisma.DateTimeFilter).lte = new Date(endDate as string);
  }

  // Get counts by status
  const [total, sent, delivered, failed] = await Promise.all([
    prisma.notificationLog.count({ where }),
    prisma.notificationLog.count({ where: { ...where, status: 'sent' } }),
    prisma.notificationLog.count({ where: { ...where, status: 'delivered' } }),
    prisma.notificationLog.count({ where: { ...where, status: 'failed' } }),
  ]);

  res.json({
    success: true,
    data: {
      total,
      sent,
      delivered,
      failed,
      successRate: total > 0 ? ((sent + delivered) / total * 100).toFixed(1) : '100',
    },
  });
}));

// GET /notifications/:id - Get single notification
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const notification = await prisma.notificationLog.findFirst({
    where: {
      id: req.params.id,
      ...withSalonId(req.user!.salonId),
    },
    include: {
      client: true,
      appointment: {
        include: {
          service: true,
          staff: true,
        },
      },
    },
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Notification not found' },
    });
  }

  res.json({ success: true, data: notification });
}));

// POST /notifications/:id/resend - Resend a failed notification
router.post('/:id/resend', asyncHandler(async (req: Request, res: Response) => {
  // Only owner/admin can resend
  if (!['owner', 'admin'].includes(req.user!.role)) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only owners and admins can resend notifications' },
    });
  }

  const notification = await prisma.notificationLog.findFirst({
    where: {
      id: req.params.id,
      ...withSalonId(req.user!.salonId),
    },
    include: {
      client: true,
      appointment: {
        include: {
          service: true,
          staff: true,
          salon: true,
          location: true,
        },
      },
    },
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Notification not found' },
    });
  }

  // Build address
  const loc = notification.appointment?.location;
  const salon = notification.appointment?.salon;
  const address = loc
    ? `${loc.address || ''}, ${loc.city || ''}, ${loc.state || ''} ${loc.zip || ''}`.trim()
    : salon
    ? `${salon.address || ''}, ${salon.city || ''}, ${salon.state || ''} ${salon.zip || ''}`.trim()
    : '';

  // Determine channels to use
  const channels: ('email' | 'sms')[] = [];
  if (notification.client.email) channels.push('email');
  if (notification.client.phone) channels.push('sms');

  if (channels.length === 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'NO_CONTACT', message: 'Client has no email or phone' },
    });
  }

  // Format datetime
  const dateTime = notification.appointment?.startTime
    ? new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: salon?.timezone || 'UTC',
      }).format(notification.appointment.startTime)
    : '';

  // Send new notification
  const newNotificationId = await sendNotification({
    salonId: notification.salonId,
    clientId: notification.clientId,
    appointmentId: notification.appointmentId || undefined,
    type: notification.type as any,
    channels,
    data: {
      clientName: notification.client.firstName,
      clientEmail: notification.client.email || undefined,
      clientPhone: notification.client.phone || undefined,
      serviceName: notification.appointment?.service?.name || 'Service',
      staffName: notification.appointment?.staff
        ? `${notification.appointment.staff.firstName} ${notification.appointment.staff.lastName}`
        : 'Staff',
      dateTime,
      salonName: salon?.name || '',
      salonAddress: address,
      startTime: notification.appointment?.startTime,
      endTime: notification.appointment?.endTime,
      salonTimezone: salon?.timezone,
    },
  });

  res.json({
    success: true,
    data: { notificationId: newNotificationId },
    message: 'Notification resent successfully',
  });
}));

export { router as notificationsRouter };
