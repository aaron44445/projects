import { Router, Request, Response } from 'express';
import { prisma } from '@peacase/database';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../lib/errorUtils.js';

const router = Router();

/**
 * Get start and end of today in the salon's timezone, as UTC Date objects.
 * Handles DST correctly by using Intl.DateTimeFormat.formatToParts().
 */
function getTodayBoundariesInTimezone(timezone: string): { startOfToday: Date; endOfToday: Date } {
  const now = new Date();

  // Get current date/time parts in salon timezone using formatToParts
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(now);

  const getPart = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0', 10);
  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  const hour = getPart('hour');
  const minute = getPart('minute');
  const second = getPart('second');

  // Calculate offset: current time in salon timezone vs UTC
  // Using Date.UTC ensures we're working with UTC timestamps consistently
  const utcMs = Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
    now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()
  );
  const tzMs = Date.UTC(year, month - 1, day, hour, minute, second);
  const offsetMs = tzMs - utcMs;

  // Midnight in salon timezone converted to UTC
  const midnightInTzAsUTC = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  const startOfToday = new Date(midnightInTzAsUTC - offsetMs);

  // End of day in salon timezone converted to UTC
  const endOfDayInTzAsUTC = Date.UTC(year, month - 1, day, 23, 59, 59, 999);
  const endOfToday = new Date(endOfDayInTzAsUTC - offsetMs);

  return { startOfToday, endOfToday };
}

// ============================================
// GET /api/v1/dashboard/stats
// Revenue stats, appointment counts, new clients with comparisons
// PERF-02: Consolidated to single Promise.all (was 8+ sequential queries)
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

  // Run ALL queries in parallel (single Promise.all instead of 8+ sequential queries)
  // This reduces response time from ~500-1000ms to ~50-100ms
  const [
    currentMonthPayments,
    lastMonthPayments,
    thisMonthAppointments,
    lastMonthAppointments,
    thisMonthClients,
    lastMonthClients,
    totalClients,
    avgRating,
    salon,
  ] = await Promise.all([
    // Current month payments
    prisma.payment.aggregate({
      where: {
        salonId,
        ...locationFilter,
        status: 'completed',
        createdAt: { gte: startOfThisMonth },
      },
      _sum: { totalAmount: true, refundAmount: true },
    }),

    // Last month payments
    prisma.payment.aggregate({
      where: {
        salonId,
        ...locationFilter,
        status: 'completed',
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      _sum: { totalAmount: true, refundAmount: true },
    }),

    // This month appointments
    prisma.appointment.count({
      where: {
        salonId,
        ...locationFilter,
        startTime: { gte: startOfThisMonth },
        status: { notIn: ['cancelled', 'no_show'] },
      },
    }),

    // Last month appointments
    prisma.appointment.count({
      where: {
        salonId,
        ...locationFilter,
        startTime: { gte: startOfLastMonth, lte: endOfLastMonth },
        status: { notIn: ['cancelled', 'no_show'] },
      },
    }),

    // This month new clients
    prisma.client.count({
      where: {
        salonId,
        createdAt: { gte: startOfThisMonth },
      },
    }),

    // Last month new clients
    prisma.client.count({
      where: {
        salonId,
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
    }),

    // Total active clients
    prisma.client.count({
      where: { salonId, isActive: true },
    }),

    // Average rating from approved reviews
    prisma.review.aggregate({
      where: { salonId, isApproved: true },
      _avg: { rating: true },
      _count: { rating: true },
    }),

    // Salon timezone
    prisma.salon.findUnique({
      where: { id: salonId },
      select: { timezone: true },
    }),
  ]);

  // Calculate NET revenue (gross minus refunds)
  const currentGross = currentMonthPayments._sum.totalAmount || 0;
  const currentRefunds = currentMonthPayments._sum.refundAmount || 0;
  const currentRevenue = currentGross - currentRefunds;

  const lastGross = lastMonthPayments._sum.totalAmount || 0;
  const lastRefunds = lastMonthPayments._sum.refundAmount || 0;
  const lastRevenue = lastGross - lastRefunds;

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

  const salonTz = salon?.timezone || 'UTC';

  // VIP clients count: Requires 'tags' field on Client model (not yet in schema)
  // Returns 0 for now - see PERF-03 for VIP tagging feature
  const vipClients = 0;

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
      vipClients, // PERF-03: Placeholder until Client.tags field added
      rating: {
        average: avgRating._avg.rating ? Math.round(avgRating._avg.rating * 10) / 10 : null,
        count: avgRating._count.rating,
      },
      timezone: salonTz,
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
      timezone: salonTz,
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

  // Get salon timezone for frontend display
  const salon = await prisma.salon.findUnique({
    where: { id: salonId },
    select: { timezone: true },
  });
  const salonTz = salon?.timezone || 'UTC';

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
    data: {
      activity: recentAppointments,
      timezone: salonTz,
    },
  });
}));

export { router as dashboardRouter };
