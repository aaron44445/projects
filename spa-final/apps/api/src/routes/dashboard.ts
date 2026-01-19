import { Router, Request, Response } from 'express';
import { prisma } from '@peacase/database';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// ============================================
// GET /api/v1/dashboard/stats
// Revenue stats, appointment counts, new clients with comparisons
// ============================================
router.get('/stats', authenticate, async (req: Request, res: Response) => {
  const salonId = req.user!.salonId;

  // Get date ranges
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  // Get current month payments (completed only)
  const currentMonthPayments = await prisma.payment.aggregate({
    where: {
      salonId,
      status: 'completed',
      createdAt: { gte: startOfThisMonth },
    },
    _sum: {
      totalAmount: true,
    },
  });

  // Get last month payments for comparison
  const lastMonthPayments = await prisma.payment.aggregate({
    where: {
      salonId,
      status: 'completed',
      createdAt: {
        gte: startOfLastMonth,
        lte: endOfLastMonth,
      },
    },
    _sum: {
      totalAmount: true,
    },
  });

  // Get appointments this month
  const [thisMonthAppointments, lastMonthAppointments] = await Promise.all([
    prisma.appointment.count({
      where: {
        salonId,
        startTime: { gte: startOfThisMonth },
        status: { notIn: ['cancelled'] },
      },
    }),
    prisma.appointment.count({
      where: {
        salonId,
        startTime: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
        status: { notIn: ['cancelled'] },
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
  const currentRevenue = currentMonthPayments._sum.totalAmount || 0;
  const lastRevenue = lastMonthPayments._sum.totalAmount || 0;
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
});

// ============================================
// GET /api/v1/dashboard/today
// Today's appointments
// ============================================
router.get('/today', authenticate, async (req: Request, res: Response) => {
  const salonId = req.user!.salonId;

  // Get today's date range
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const appointments = await prisma.appointment.findMany({
    where: {
      salonId,
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
});

// ============================================
// GET /api/v1/dashboard/recent-activity
// Recent activity feed (bookings, payments, cancellations)
// ============================================
router.get('/recent-activity', authenticate, async (req: Request, res: Response) => {
  const salonId = req.user!.salonId;

  // Get recent appointments (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentAppointments = await prisma.appointment.findMany({
    where: {
      salonId,
      createdAt: { gte: sevenDaysAgo },
    },
    include: {
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
});

export { router as dashboardRouter };
