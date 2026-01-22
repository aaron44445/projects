'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

// ============================================
// Types
// ============================================

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface RevenueTimelineItem {
  date: string;
  revenue: number;
  tips: number;
  count: number;
}

export interface RecentTransaction {
  id: string;
  client: string;
  service: string;
  amount: number;
  status: string;
  date: string;
}

export interface RevenueReport {
  summary: {
    totalRevenue: number;
    totalTips: number;
    serviceRevenue: number;
    transactionCount: number;
    previousPeriodRevenue: number;
    percentageChange: number;
  };
  timeline: RevenueTimelineItem[];
  recentTransactions: RecentTransaction[];
}

export interface ServiceReportItem {
  id: string;
  name: string;
  category: string;
  count: number;
  revenue: number;
  avgDuration: number;
  avgRevenue: number;
  percentage: number;
}

export interface CategoryReportItem {
  name: string;
  revenue: number;
  count: number;
  bookings?: number;
  percentage: number;
}

export interface ServicesReport {
  summary: {
    totalRevenue: number;
    totalBookings: number;
    uniqueServices: number;
    avgRevenuePerBooking: number;
  };
  services: ServiceReportItem[];
  categories: CategoryReportItem[];
}

export interface StaffReportItem {
  id: string;
  name: string;
  role: string;
  avatarUrl: string | null;
  appointments: number;
  completedAppointments: number;
  revenue: number;
  tips: number;
  commissionRate: number;
  commission: number;
  rating: number | null;
  reviewCount: number;
}

export interface StaffReport {
  summary: {
    totalRevenue: number;
    totalAppointments: number;
    totalTips: number;
    staffCount: number;
    avgRevenuePerStaff: number;
  };
  staff: StaffReportItem[];
}

export interface TopClient {
  id: string;
  name: string;
  email: string | null;
  visits: number;
  totalSpent: number;
  memberSince: string;
}

export interface ClientsReport {
  summary: {
    totalClients: number;
    newClients: number;
    previousNewClients: number;
    newClientsChange: number;
    uniqueVisitors: number;
    returningClients: number;
    retentionRate: number;
    avgVisitsPerClient: number;
  };
  frequencyDistribution: {
    oneVisit: number;
    twoToThree: number;
    fourToSix: number;
    sevenPlus: number;
  };
  topClients: TopClient[];
  appointmentBreakdown: {
    total: number;
    fromNewClients: number;
    fromReturningClients: number;
  };
}

export interface OverviewReport {
  revenue: {
    value: number;
    change: number;
    previousValue: number;
  };
  appointments: {
    value: number;
    change: number;
    previousValue: number;
  };
  newClients: {
    value: number;
    change: number;
    previousValue: number;
  };
  avgServiceDuration: {
    value: number;
    unit: string;
  };
}

// ============================================
// Hook
// ============================================

export function useReports() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Overview Report
  const [overview, setOverview] = useState<OverviewReport | null>(null);

  // Revenue Report
  const [revenueReport, setRevenueReport] = useState<RevenueReport | null>(null);

  // Services Report
  const [servicesReport, setServicesReport] = useState<ServicesReport | null>(null);

  // Staff Report
  const [staffReport, setStaffReport] = useState<StaffReport | null>(null);

  // Clients Report
  const [clientsReport, setClientsReport] = useState<ClientsReport | null>(null);

  // Fetch overview report
  const fetchOverview = useCallback(async (startDate?: string, endDate?: string, locationId?: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (locationId) params.append('locationId', locationId);

      const queryString = params.toString();
      const endpoint = `/reports/overview${queryString ? `?${queryString}` : ''}`;

      const response = await api.get<OverviewReport>(endpoint);
      if (response.data) {
        setOverview(response.data);
      }
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch overview report';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch revenue report
  const fetchRevenueReport = useCallback(async (
    startDate?: string,
    endDate?: string,
    groupBy: 'daily' | 'weekly' | 'monthly' = 'daily',
    locationId?: string | null
  ) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('groupBy', groupBy);
      if (locationId) params.append('locationId', locationId);

      const response = await api.get<RevenueReport>(`/reports/revenue?${params.toString()}`);
      if (response.data) {
        setRevenueReport(response.data);
      }
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch revenue report';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch services report
  const fetchServicesReport = useCallback(async (startDate?: string, endDate?: string, locationId?: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (locationId) params.append('locationId', locationId);

      const queryString = params.toString();
      const endpoint = `/reports/services${queryString ? `?${queryString}` : ''}`;

      const response = await api.get<ServicesReport>(endpoint);
      if (response.data) {
        setServicesReport(response.data);
      }
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch services report';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch staff report
  const fetchStaffReport = useCallback(async (startDate?: string, endDate?: string, locationId?: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (locationId) params.append('locationId', locationId);

      const queryString = params.toString();
      const endpoint = `/reports/staff${queryString ? `?${queryString}` : ''}`;

      const response = await api.get<StaffReport>(endpoint);
      if (response.data) {
        setStaffReport(response.data);
      }
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch staff report';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch clients report
  const fetchClientsReport = useCallback(async (startDate?: string, endDate?: string, locationId?: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (locationId) params.append('locationId', locationId);

      const queryString = params.toString();
      const endpoint = `/reports/clients${queryString ? `?${queryString}` : ''}`;

      const response = await api.get<ClientsReport>(endpoint);
      if (response.data) {
        setClientsReport(response.data);
      }
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch clients report';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all reports at once
  const fetchAllReports = useCallback(async (
    startDate?: string,
    endDate?: string,
    groupBy: 'daily' | 'weekly' | 'monthly' = 'daily',
    locationId?: string | null
  ) => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchOverview(startDate, endDate, locationId),
        fetchRevenueReport(startDate, endDate, groupBy, locationId),
        fetchServicesReport(startDate, endDate, locationId),
        fetchStaffReport(startDate, endDate, locationId),
        fetchClientsReport(startDate, endDate, locationId),
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch reports';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [fetchOverview, fetchRevenueReport, fetchServicesReport, fetchStaffReport, fetchClientsReport]);

  return {
    // State
    loading,
    error,
    overview,
    revenueReport,
    servicesReport,
    staffReport,
    clientsReport,

    // Actions
    fetchOverview,
    fetchRevenueReport,
    fetchServicesReport,
    fetchStaffReport,
    fetchClientsReport,
    fetchAllReports,
  };
}
