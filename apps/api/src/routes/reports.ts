import { Router, Request, Response } from 'express';
import { Prisma, prisma } from '@peacase/database';
import { authenticate } from '../middleware/auth.js';
import { requireAddon } from '../middleware/subscription.js';
import { asyncHandler } from '../lib/errorUtils.js';
import logger from '../lib/logger.js';
import { withSalonId } from '../lib/prismaUtils.js';

const router = Router();

// All reports routes require the reports add-on
router.use(authenticate, requireAddon('reports'));

// Helper to parse date range from query params
function getDateRange(startDate?: string, endDate?: string) {
  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);

  const start = startDate
    ? new Date(startDate)
    : new Date(end.getFullYear(), end.getMonth(), 1); // Default to start of current month
  start.setHours(0, 0, 0, 0);

  // Also calculate previous period for comparison
  const periodLength = end.getTime() - start.getTime();
  const previousStart = new Date(start.getTime() - periodLength);
  const previousEnd = new Date(start.getTime() - 1);
  previousEnd.setHours(23, 59, 59, 999);

  return { start, end, previousStart, previousEnd };
}

// ============================================
// GET /api/v1/reports/revenue
// Revenue report with daily/weekly/monthly aggregations
// ============================================
router.get('/revenue', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const salonId = req.user!.salonId;
  const { startDate, endDate, groupBy = 'daily', locationId } = req.query;

  const { start, end, previousStart, previousEnd } = getDateRange(
    startDate as string,
    endDate as string
  );

  // Location filter for payments (via appointment relation)
  const locationFilter = locationId ? { appointment: { locationId: locationId as string } } : {};

  try {
    // Get total revenue for current period
    const currentRevenue = await prisma.payment.aggregate({
      where: {
        salonId,
        status: 'completed',
        createdAt: { gte: start, lte: end },
        ...locationFilter,
      },
      _sum: {
        totalAmount: true,
        tipAmount: true,
        amount: true,
      },
      _count: true,
    });

    // Get revenue for previous period (for comparison)
    const previousRevenue = await prisma.payment.aggregate({
      where: {
        salonId,
        status: 'completed',
        createdAt: { gte: previousStart, lte: previousEnd },
        ...locationFilter,
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Get all payments for breakdown by day/week
    const payments = await prisma.payment.findMany({
      where: {
        salonId,
        status: 'completed',
        createdAt: { gte: start, lte: end },
        ...locationFilter,
      },
      select: {
        createdAt: true,
        totalAmount: true,
        tipAmount: true,
        amount: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group payments by day
    const dailyData: Record<string, { revenue: number; tips: number; count: number }> = {};

    payments.forEach((payment) => {
      const dateKey = payment.createdAt.toISOString().split('T')[0];
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { revenue: 0, tips: 0, count: 0 };
      }
      dailyData[dateKey].revenue += payment.totalAmount || 0;
      dailyData[dateKey].tips += payment.tipAmount || 0;
      dailyData[dateKey].count += 1;
    });

    // Convert to array and fill missing dates
    const timeline: Array<{ date: string; revenue: number; tips: number; count: number }> = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dateKey = currentDate.toISOString().split('T')[0];
      timeline.push({
        date: dateKey,
        revenue: dailyData[dateKey]?.revenue || 0,
        tips: dailyData[dateKey]?.tips || 0,
        count: dailyData[dateKey]?.count || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Group by week if requested
    let groupedTimeline = timeline;
    if (groupBy === 'weekly') {
      const weeklyData: Record<string, { date: string; revenue: number; tips: number; count: number }> = {};
      timeline.forEach((day) => {
        const date = new Date(day.date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];

        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { date: weekKey, revenue: 0, tips: 0, count: 0 };
        }
        weeklyData[weekKey].revenue += day.revenue;
        weeklyData[weekKey].tips += day.tips;
        weeklyData[weekKey].count += day.count;
      });
      groupedTimeline = Object.values(weeklyData);
    } else if (groupBy === 'monthly') {
      const monthlyData: Record<string, { date: string; revenue: number; tips: number; count: number }> = {};
      timeline.forEach((day) => {
        const monthKey = day.date.substring(0, 7); // YYYY-MM
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { date: monthKey + '-01', revenue: 0, tips: 0, count: 0 };
        }
        monthlyData[monthKey].revenue += day.revenue;
        monthlyData[monthKey].tips += day.tips;
        monthlyData[monthKey].count += day.count;
      });
      groupedTimeline = Object.values(monthlyData);
    }

    // Calculate percentage change
    const currentTotal = currentRevenue._sum.totalAmount || 0;
    const previousTotal = previousRevenue._sum.totalAmount || 0;
    const percentageChange = previousTotal > 0
      ? Math.round(((currentTotal - previousTotal) / previousTotal) * 1000) / 10
      : currentTotal > 0 ? 100 : 0;

    // Get recent transactions
    const recentTransactions = await prisma.payment.findMany({
      where: {
        salonId,
        createdAt: { gte: start, lte: end },
        ...locationFilter,
      },
      include: {
        client: {
          select: { firstName: true, lastName: true },
        },
        appointment: {
          include: {
            service: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue: currentTotal,
          totalTips: currentRevenue._sum.tipAmount || 0,
          serviceRevenue: currentRevenue._sum.amount || 0,
          transactionCount: currentRevenue._count,
          previousPeriodRevenue: previousTotal,
          percentageChange,
        },
        timeline: groupedTimeline,
        recentTransactions: recentTransactions.map((t) => ({
          id: t.id,
          client: t.client ? `${t.client.firstName} ${t.client.lastName}` : 'Unknown',
          service: t.appointment?.service?.name || 'N/A',
          amount: t.totalAmount,
          status: t.status,
          date: t.createdAt,
        })),
      },
    });
  } catch (error) {
    logger.error({ err: error, salonId, reportType: 'revenue' }, 'Revenue report generation failed');
    res.status(500).json({
      success: false,
      error: { code: 'REPORT_ERROR', message: 'Failed to generate revenue report' },
    });
  }
}));

// ============================================
// GET /api/v1/reports/services
// Popular services report with usage counts and revenue by service
// ============================================
router.get('/services', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const salonId = req.user!.salonId;
  const { startDate, endDate, locationId } = req.query;

  const { start, end, previousStart, previousEnd } = getDateRange(
    startDate as string,
    endDate as string
  );

  // Location filter for appointments
  const locationFilter = locationId ? { locationId: locationId as string } : {};

  try {
    // Get all completed appointments in the period with their services
    const appointments = await prisma.appointment.findMany({
      where: {
        salonId,
        startTime: { gte: start, lte: end },
        status: { notIn: ['cancelled'] },
        ...locationFilter,
      },
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
        payments: {
          where: { status: 'completed' },
          select: { totalAmount: true },
        },
      },
    });

    // Aggregate by service
    const serviceStats: Record<string, {
      id: string;
      name: string;
      category: string;
      count: number;
      revenue: number;
      avgDuration: number;
      totalDuration: number;
    }> = {};

    appointments.forEach((apt) => {
      const serviceId = apt.service.id;
      if (!serviceStats[serviceId]) {
        serviceStats[serviceId] = {
          id: serviceId,
          name: apt.service.name,
          category: apt.service.category?.name || 'Uncategorized',
          count: 0,
          revenue: 0,
          avgDuration: apt.service.durationMinutes,
          totalDuration: 0,
        };
      }
      serviceStats[serviceId].count += 1;
      serviceStats[serviceId].revenue += apt.payments.reduce((sum: number, p: { totalAmount: number }) => sum + p.totalAmount, 0) || apt.price;
      serviceStats[serviceId].totalDuration += apt.durationMinutes;
    });

    // Calculate averages and sort by revenue
    const services = Object.values(serviceStats)
      .map((s) => ({
        ...s,
        avgDuration: Math.round(s.totalDuration / s.count),
        avgRevenue: Math.round((s.revenue / s.count) * 100) / 100,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Calculate totals
    const totalRevenue = services.reduce((sum, s) => sum + s.revenue, 0);
    const totalBookings = services.reduce((sum, s) => sum + s.count, 0);

    // Add percentage to each service
    const servicesWithPercentage = services.map((s) => ({
      ...s,
      percentage: totalRevenue > 0 ? Math.round((s.revenue / totalRevenue) * 1000) / 10 : 0,
    }));

    // Get category breakdown
    const categoryStats: Record<string, { name: string; revenue: number; count: number }> = {};
    services.forEach((s) => {
      if (!categoryStats[s.category]) {
        categoryStats[s.category] = { name: s.category, revenue: 0, count: 0 };
      }
      categoryStats[s.category].revenue += s.revenue;
      categoryStats[s.category].count += s.count;
    });

    const categories = Object.values(categoryStats)
      .map((c) => ({
        ...c,
        percentage: totalRevenue > 0 ? Math.round((c.revenue / totalRevenue) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalBookings,
          uniqueServices: services.length,
          avgRevenuePerBooking: totalBookings > 0 ? Math.round((totalRevenue / totalBookings) * 100) / 100 : 0,
        },
        services: servicesWithPercentage,
        categories,
      },
    });
  } catch (error) {
    logger.error({ err: error, salonId, reportType: 'services' }, 'Services report generation failed');
    res.status(500).json({
      success: false,
      error: { code: 'REPORT_ERROR', message: 'Failed to generate services report' },
    });
  }
}));

// ============================================
// GET /api/v1/reports/staff
// Staff performance report with appointments count and revenue generated
// ============================================
router.get('/staff', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const salonId = req.user!.salonId;
  const { startDate, endDate, locationId } = req.query;

  const { start, end } = getDateRange(
    startDate as string,
    endDate as string
  );

  // Location filter for appointments
  const locationFilter = locationId ? { locationId: locationId as string } : {};

  try {
    // Get all staff members for this salon
    const staff = await prisma.user.findMany({
      where: {
        salonId,
        isActive: true,
        role: { in: ['staff', 'admin', 'owner'] },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        commissionRate: true,
      },
    });

    // Get appointments and payments for each staff member
    const staffStats = await Promise.all(
      staff.map(async (s) => {
        // Get appointments
        const appointments = await prisma.appointment.findMany({
          where: {
            salonId,
            staffId: s.id,
            startTime: { gte: start, lte: end },
            status: { notIn: ['cancelled'] },
            ...locationFilter,
          },
          include: {
            payments: {
              where: { status: 'completed' },
              select: { totalAmount: true, tipAmount: true },
            },
          },
        });

        // Calculate metrics
        const completedAppointments = appointments.filter((a) => a.status === 'completed');
        const totalRevenue = appointments.reduce(
          (sum, a) => sum + a.payments.reduce((pSum, p) => pSum + p.totalAmount, 0),
          0
        );
        const totalTips = appointments.reduce(
          (sum, a) => sum + a.payments.reduce((pSum, p) => pSum + (p.tipAmount || 0), 0),
          0
        );

        return {
          id: s.id,
          name: `${s.firstName} ${s.lastName}`,
          role: s.role,
          avatarUrl: s.avatarUrl,
          appointments: appointments.length,
          completedAppointments: completedAppointments.length,
          revenue: totalRevenue,
          tips: totalTips,
          commissionRate: s.commissionRate || 0,
          commission: totalRevenue * ((s.commissionRate || 0) / 100),
        };
      })
    );

    // Sort by revenue
    const sortedStaff = staffStats.sort((a, b) => b.revenue - a.revenue);

    // Calculate totals
    const totalRevenue = sortedStaff.reduce((sum, s) => sum + s.revenue, 0);
    const totalAppointments = sortedStaff.reduce((sum, s) => sum + s.appointments, 0);
    const totalTips = sortedStaff.reduce((sum, s) => sum + s.tips, 0);

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalAppointments,
          totalTips,
          staffCount: sortedStaff.length,
          avgRevenuePerStaff: sortedStaff.length > 0 ? Math.round(totalRevenue / sortedStaff.length) : 0,
        },
        staff: sortedStaff,
      },
    });
  } catch (error) {
    logger.error({ err: error, salonId, reportType: 'staff' }, 'Staff report generation failed');
    res.status(500).json({
      success: false,
      error: { code: 'REPORT_ERROR', message: 'Failed to generate staff report' },
    });
  }
}));

// ============================================
// GET /api/v1/reports/clients
// Client analytics with new clients, retention, and visit frequency
// ============================================
router.get('/clients', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const salonId = req.user!.salonId;
  const { startDate, endDate, locationId } = req.query;

  const { start, end, previousStart, previousEnd } = getDateRange(
    startDate as string,
    endDate as string
  );

  // Location filter for appointments
  const locationFilter = locationId ? { locationId: locationId as string } : {};

  try {
    // New clients in period
    const newClients = await prisma.client.count({
      where: {
        salonId,
        createdAt: { gte: start, lte: end },
      },
    });

    // New clients in previous period
    const previousNewClients = await prisma.client.count({
      where: {
        salonId,
        createdAt: { gte: previousStart, lte: previousEnd },
      },
    });

    // Total active clients
    const totalClients = await prisma.client.count({
      where: {
        salonId,
        isActive: true,
      },
    });

    // Get all appointments in period
    const periodAppointments = await prisma.appointment.findMany({
      where: {
        salonId,
        startTime: { gte: start, lte: end },
        status: { notIn: ['cancelled'] },
        ...locationFilter,
      },
      select: {
        clientId: true,
        client: {
          select: {
            createdAt: true,
          },
        },
      },
    });

    // Unique clients who visited in the period
    const uniqueVisitors = new Set(periodAppointments.map((a) => a.clientId)).size;

    // Calculate retention (clients who had appointments and have visited before the period)
    const returningClients = periodAppointments.filter(
      (a) => a.client.createdAt < start
    );
    const uniqueReturningClients = new Set(returningClients.map((a) => a.clientId)).size;

    // Get clients who visited in previous period
    const previousPeriodClients = await prisma.appointment.findMany({
      where: {
        salonId,
        startTime: { gte: previousStart, lte: previousEnd },
        status: { notIn: ['cancelled'] },
        ...locationFilter,
      },
      select: { clientId: true },
      distinct: ['clientId'],
    });
    const previousClientIds = new Set(previousPeriodClients.map((a) => a.clientId));

    // How many of those returned in current period
    const retainedClients = periodAppointments.filter(
      (a) => previousClientIds.has(a.clientId)
    );
    const retentionCount = new Set(retainedClients.map((a) => a.clientId)).size;
    const retentionRate = previousClientIds.size > 0
      ? Math.round((retentionCount / previousClientIds.size) * 100)
      : 0;

    // Visit frequency - appointments per client
    const clientVisits: Record<string, number> = {};
    periodAppointments.forEach((a) => {
      clientVisits[a.clientId] = (clientVisits[a.clientId] || 0) + 1;
    });
    const visitCounts = Object.values(clientVisits);
    const avgVisitsPerClient = visitCounts.length > 0
      ? Math.round((visitCounts.reduce((a, b) => a + b, 0) / visitCounts.length) * 10) / 10
      : 0;

    // Frequency distribution
    const frequencyDistribution = {
      oneVisit: visitCounts.filter((v) => v === 1).length,
      twoToThree: visitCounts.filter((v) => v >= 2 && v <= 3).length,
      fourToSix: visitCounts.filter((v) => v >= 4 && v <= 6).length,
      sevenPlus: visitCounts.filter((v) => v >= 7).length,
    };

    // Top clients by visits
    const topClients = await prisma.client.findMany({
      where: {
        salonId,
        id: { in: Object.keys(clientVisits) },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
        appointments: {
          where: {
            startTime: { gte: start, lte: end },
            status: { notIn: ['cancelled'] },
            ...locationFilter,
          },
          include: {
            payments: {
              where: { status: 'completed' },
              select: { totalAmount: true },
            },
          },
        },
      },
    });

    const topClientStats = topClients
      .map((c) => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        email: c.email,
        visits: clientVisits[c.id] || 0,
        totalSpent: c.appointments.reduce(
          (sum, a) => sum + a.payments.reduce((pSum, p) => pSum + p.totalAmount, 0),
          0
        ),
        memberSince: c.createdAt,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // New vs returning breakdown
    const newClientAppointments = periodAppointments.filter(
      (a) => a.client.createdAt >= start
    ).length;

    res.json({
      success: true,
      data: {
        summary: {
          totalClients,
          newClients,
          previousNewClients,
          newClientsChange: previousNewClients > 0
            ? Math.round(((newClients - previousNewClients) / previousNewClients) * 100)
            : newClients > 0 ? 100 : 0,
          uniqueVisitors,
          returningClients: uniqueReturningClients,
          retentionRate,
          avgVisitsPerClient,
        },
        frequencyDistribution,
        topClients: topClientStats,
        appointmentBreakdown: {
          total: periodAppointments.length,
          fromNewClients: newClientAppointments,
          fromReturningClients: periodAppointments.length - newClientAppointments,
        },
      },
    });
  } catch (error) {
    logger.error({ err: error, salonId, reportType: 'clients' }, 'Clients report generation failed');
    res.status(500).json({
      success: false,
      error: { code: 'REPORT_ERROR', message: 'Failed to generate clients report' },
    });
  }
}));

// ============================================
// GET /api/v1/reports/overview
// Combined overview of all key metrics
// ============================================
router.get('/overview', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const salonId = req.user!.salonId;
  const { startDate, endDate, locationId } = req.query;

  const { start, end, previousStart, previousEnd } = getDateRange(
    startDate as string,
    endDate as string
  );

  // Location filters
  const paymentLocationFilter = locationId ? { appointment: { locationId: locationId as string } } : {};
  const appointmentLocationFilter = locationId ? { locationId: locationId as string } : {};

  try {
    // Revenue
    const [currentRevenue, previousRevenue] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          salonId,
          status: 'completed',
          createdAt: { gte: start, lte: end },
          ...paymentLocationFilter,
        },
        _sum: { totalAmount: true },
      }),
      prisma.payment.aggregate({
        where: {
          salonId,
          status: 'completed',
          createdAt: { gte: previousStart, lte: previousEnd },
          ...paymentLocationFilter,
        },
        _sum: { totalAmount: true },
      }),
    ]);

    // Appointments
    const [currentAppointments, previousAppointments] = await Promise.all([
      prisma.appointment.count({
        where: {
          salonId,
          startTime: { gte: start, lte: end },
          status: { notIn: ['cancelled'] },
          ...appointmentLocationFilter,
        },
      }),
      prisma.appointment.count({
        where: {
          salonId,
          startTime: { gte: previousStart, lte: previousEnd },
          status: { notIn: ['cancelled'] },
          ...appointmentLocationFilter,
        },
      }),
    ]);

    // New Clients
    const [currentNewClients, previousNewClients] = await Promise.all([
      prisma.client.count({
        where: {
          salonId,
          createdAt: { gte: start, lte: end },
        },
      }),
      prisma.client.count({
        where: {
          salonId,
          createdAt: { gte: previousStart, lte: previousEnd },
        },
      }),
    ]);

    // Average service duration
    const avgDuration = await prisma.appointment.aggregate({
      where: {
        salonId,
        startTime: { gte: start, lte: end },
        status: { notIn: ['cancelled'] },
        ...appointmentLocationFilter,
      },
      _avg: { durationMinutes: true },
    });

    // Calculate changes
    const revenueChange = (previousRevenue._sum.totalAmount || 0) > 0
      ? Math.round(((currentRevenue._sum.totalAmount || 0) - (previousRevenue._sum.totalAmount || 0)) / (previousRevenue._sum.totalAmount || 1) * 1000) / 10
      : (currentRevenue._sum.totalAmount || 0) > 0 ? 100 : 0;

    const appointmentsChange = previousAppointments > 0
      ? Math.round(((currentAppointments - previousAppointments) / previousAppointments) * 1000) / 10
      : currentAppointments > 0 ? 100 : 0;

    const clientsChange = previousNewClients > 0
      ? Math.round(((currentNewClients - previousNewClients) / previousNewClients) * 1000) / 10
      : currentNewClients > 0 ? 100 : 0;

    res.json({
      success: true,
      data: {
        revenue: {
          value: currentRevenue._sum.totalAmount || 0,
          change: revenueChange,
          previousValue: previousRevenue._sum.totalAmount || 0,
        },
        appointments: {
          value: currentAppointments,
          change: appointmentsChange,
          previousValue: previousAppointments,
        },
        newClients: {
          value: currentNewClients,
          change: clientsChange,
          previousValue: previousNewClients,
        },
        avgServiceDuration: {
          value: Math.round(avgDuration._avg.durationMinutes || 0),
          unit: 'min',
        },
      },
    });
  } catch (error) {
    logger.error({ err: error, salonId, reportType: 'overview' }, 'Overview report generation failed');
    res.status(500).json({
      success: false,
      error: { code: 'REPORT_ERROR', message: 'Failed to generate overview report' },
    });
  }
}));

// ============================================
// GET /api/v1/reports/by-location
// Compare metrics across all locations
// ============================================
router.get('/by-location', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const salonId = req.user!.salonId;
  const { startDate, endDate } = req.query;

  const { start, end } = getDateRange(startDate as string, endDate as string);

  try {
    // Get all locations
    const locations = await prisma.location.findMany({
      where: { salonId, isActive: true },
      select: { id: true, name: true, isPrimary: true },
    });

    // Get metrics per location
    const locationStats = await Promise.all(
      locations.map(async (loc) => {
        const [revenue, appointments, clients] = await Promise.all([
          prisma.payment.aggregate({
            where: {
              salonId,
              status: 'completed',
              createdAt: { gte: start, lte: end },
              appointment: { locationId: loc.id },
            },
            _sum: { totalAmount: true },
          }),
          prisma.appointment.count({
            where: {
              salonId,
              locationId: loc.id,
              startTime: { gte: start, lte: end },
              status: { notIn: ['cancelled'] },
            },
          }),
          prisma.appointment.findMany({
            where: {
              salonId,
              locationId: loc.id,
              startTime: { gte: start, lte: end },
              status: { notIn: ['cancelled'] },
            },
            select: { clientId: true },
            distinct: ['clientId'],
          }),
        ]);

        return {
          id: loc.id,
          name: loc.name,
          isPrimary: loc.isPrimary,
          revenue: revenue._sum.totalAmount || 0,
          appointments,
          uniqueClients: clients.length,
        };
      })
    );

    res.json({
      success: true,
      data: {
        locations: locationStats.sort((a, b) => b.revenue - a.revenue),
        totals: {
          revenue: locationStats.reduce((sum, l) => sum + l.revenue, 0),
          appointments: locationStats.reduce((sum, l) => sum + l.appointments, 0),
        },
      },
    });
  } catch (error) {
    logger.error({ err: error, salonId, reportType: 'by-location' }, 'By-location report generation failed');
    res.status(500).json({
      success: false,
      error: { code: 'REPORT_ERROR', message: 'Failed to generate by-location report' },
    });
  }
}));

export { router as reportsRouter };
