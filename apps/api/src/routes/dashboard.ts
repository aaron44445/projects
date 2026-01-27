import { Router, Request, Response } from 'express';
import { prisma } from '@peacase/database';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../lib/errorUtils.js';

const router = Router();

/**
 * Get start and end of today in the salon's timezone, as UTC Date objects.
 * Handles DST correctly by using Intl.DateTimeFormat.
 */
function getTodayBoundariesInTimezone(timezone: string): { startOfToday: Date; endOfToday: Date } {
  const now = new Date();

  // Format current date in salon timezone to get the date parts
  const options: Intl.DateTimeFormatOptions = { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' };
  const dateStr = new Intl.DateTimeFormat('en-CA', options).format(now); // en-CA gives YYYY-MM-DD format

  // Create midnight in salon timezone by parsing the date string
  // The Date constructor interprets this as local time, so we need to adjust
  const [year, month, day] = dateStr.split('-').map(Number);

  // Get the offset between UTC and salon timezone at this moment
  const utcNow = now.getTime();
  const tzNow = new Date(now.toLocaleString('en-US', { timeZone: timezone })).getTime();
  const offsetMs = tzNow - utcNow;

  // Midnight in salon timezone = midnight local - offset
  const localMidnight = new Date(year, month - 1, day, 0, 0, 0, 0);
  const startOfToday = new Date(localMidnight.getTime() - offsetMs);

  const localEndOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
  const endOfToday = new Date(localEndOfDay.getTime() - offsetMs);

  return { startOfToday, endOfToday };
}

// ============================================
// GET /api/v1/dashboard/stats
// Revenue stats, appointment counts, new clients with comparisons
// ============================================
router.get('/stats', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const salonId = req.user!.salonId;
  const { locationId } = req.query;
  const locationFilter = locationId ? { locationId: locationId as string } : {};

  // Get date ranges
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  // Get current month payments (filtered by location if specified)
  const currentMonthPayments = await prisma.payment.aggregate({
    where: {
      salonId,
      ...locationFilter,
      status: 'completed',
      createdAt: { gte: startOfThisMonth },
    },
    _sum: {
      totalAmount: true,
      refundAmount: true,
    },
  });

  // Get last month payments for comparison
  const lastMonthPayments = await prisma.payment.aggregate({
    where: {
      salonId,
      ...locationFilter,
      status: 'completed',
      createdAt: {
        gte: startOfLastMonth,
        lte: endOfLastMonth,
      },
    },
    _sum: {
      totalAmount: true,
      refundAmount: true,
    },
  });

  // Calculate NET revenue (gross minus refunds)
  const currentGross = currentMonthPayments._sum.totalAmount || 0;
  const currentRefunds = currentMonthPayments._sum.refundAmount || 0;
  const currentRevenue = currentGross - currentRefunds;

  const lastGross = lastMonthPayments._sum.totalAmount || 0;
  const lastRefunds = lastMonthPayments._sum.refundAmount || 0;
  const lastRevenue = lastGross - lastRefunds;

  // Get appointments this month (exclude cancelled and no-show)
  const [thisMonthAppointments, lastMonthAppointments] = await Promise.all([
    prisma.appointment.count({
      where: {
        salonId,
        ...locationFilter,
        startTime: { gte: startOfThisMonth },
        status: { notIn: ['cancelled', 'no_show'] },
      },
    }),
    prisma.appointment.count({
      where: {
        salonId,
        ...locationFilter,
        startTime: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
        status: { notIn: ['cancelled', 'no_show'] },
      },
    }),
  ]);

  // Get new clients this month vs last month
  const [thisMonthClients, lastMonthClients] = await Promise.all([
    prisma.client.count({
      where: {
        salonId,
        createdAt: { gte: startOfThisMonth },
      },
    }),
    prisma.client.count({
      where: {
        salonId,
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
    }),
  ]);

  // Calculate percentage changes
  const revenueChange = lastRevenue > 0
    ? Math.round(((currentRevenue - lastRevenue) / lastRevenue) * 100)
    : currentRevenue > 0 ? 100 : 0;

  const appointmentChange = lastMonthAppointments > 0
    ? Math.round(((thisMonthAppointments - lastMonthAppointments) / lastMonthAppointments) * 100)
    : thisMonthAppointments > 0 ? 100 : 0;

  const clientChange = lastMonthClients > 0
    ? Math.round(((thisMonthClients - lastMonthClients) / lastMonthClients) * 100)
    : thisMonthClients > 0 ? 100 : 0;

  // Get total active clients
  const totalClients = await prisma.client.count({
    where: {
      salonId,
      isActive: true,
    },
  });

  // Get average rating from approved reviews
  const avgRating = await prisma.review.aggregate({
    where: {
      salonId,
      isApproved: true,
    },
    _avg: {
      rating: true,
    },
    _count: {
      rating: true,
    },
  });

  res.json({
    success: true,
    data: {
      revenue: {
        current: currentRevenue,
        previous: lastRevenue,
        change: revenueChange,
      },
      appointments: {
        current: thisMonthAppointments,
        previous: lastMonthAppointments,
        change: appointmentChange,
      },
      newClients: {
        current: thisMonthClients,
        previous: lastMonthClients,
        change: clientChange,
      },
      totalClients,
      rating: {
        average: avgRating._avg.rating ? Math.round(avgRating._avg.rating * 10) / 10 : null,
        count: avgRating._count.rating,
      },
    },
  });
}));

// ============================================
// GET /api/v1/dashboard/today
// Today's appointments
// ============================================
router.get('/today', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const salonId = req.user!.salonId;
  const { locationId } = req.query;
  const locationFilter = locationId ? { locationId: locationId as string } : {};

  // Get salon timezone for accurate "today" calculation
  const salon = await prisma.salon.findUnique({
    where: { id: salonId },
    select: { timezone: true },
  });
  const salonTz = salon?.timezone || 'UTC';

  // Use timezone-aware today boundaries
  const { startOfToday, endOfToday } = getTodayBoundariesInTimezone(salonTz);

  const appointments = await prisma.appointment.findMany({
    where: {
      salonId,
      ...locationFilter,
      startTime: {
        gte: startOfToday,
        lte: endOfToday,
      },
    },
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
        },
      },
      staff: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      service: {
        select: {
          id: true,
          name: true,
          color: true,
          durationMinutes: true,
          price: true,
        },
      },
    },
    orderBy: { startTime: 'asc' },
  });

  // Get summary counts
  const summary = {
    total: appointments.length,
    confirmed: appointments.filter((a) => a.status === 'confirmed').length,
    completed: appointments.filter((a) => a.status === 'completed').length,
    cancelled: appointments.filter((a) => a.status === 'cancelled').length,
    noShow: appointments.filter((a) => a.status === 'no_show').length,
  };

  res.json({
    success: true,
    data: {
      appointments,
      summary,
    },
  });
}));

// ============================================
// GET /api/v1/dashboard/recent-activity
// Recent activity feed (bookings, payments, cancellations)
// ============================================
router.get('/recent-activity', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const salonId = req.user!.salonId;
  const { locationId } = req.query;
  const locationFilter = locationId ? { locationId: locationId as string } : {};

  // Get recent appointments (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentAppointments = await prisma.appointment.findMany({
    where: {
      salonId,
      ...locationFilter,
      createdAt: { gte: sevenDaysAgo },
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      price: true,
      client: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      service: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  res.json({
    success: true,
    data: recentAppointments,
  });
}));

export { router as dashboardRouter };
