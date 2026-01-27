'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface DashboardStats {
  todayAppointments: number;
  todayRevenue: number;
  monthRevenue: number;
  revenueChange: string;
  newClients: number;
  clientsChange: number;
}

// API response structure (what the backend actually returns)
interface ApiStatsResponse {
  revenue: { current: number; previous: number; change: number };
  appointments: { current: number; previous: number; change: number };
  newClients: { current: number; previous: number; change: number };
  totalClients: number;
  rating: { average: number | null; count: number };
}

interface TodayAppointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  client: { firstName: string; lastName: string };
  staff: { firstName: string; lastName: string };
  service: { name: string; color: string };
}

export interface RecentActivityItem {
  id: string;
  action: string;
  detail: string;
  time: string;
  type: 'booking' | 'payment' | 'client' | 'review' | 'cancellation';
}

interface RecentAppointment {
  id: string;
  status: string;
  createdAt: string;
  price: number;
  client: { firstName: string; lastName: string };
  service: { name: string };
}

interface DashboardData {
  stats: DashboardStats;
  todayAppointments: TodayAppointment[];
  recentActivity: RecentActivityItem[];
}

// Helper to format relative time
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
};

// Transform appointments to activity items
const transformToActivity = (appointments: RecentAppointment[]): RecentActivityItem[] => {
  return appointments.map((apt) => {
    const clientName = `${apt.client.firstName} ${apt.client.lastName}`;

    if (apt.status === 'cancelled') {
      return {
        id: apt.id,
        action: 'Booking cancelled',
        detail: `${clientName} cancelled ${apt.service.name}`,
        time: formatRelativeTime(apt.createdAt),
        type: 'cancellation' as const,
      };
    }

    if (apt.status === 'completed') {
      return {
        id: apt.id,
        action: 'Payment received',
        detail: `$${apt.price} from ${clientName}`,
        time: formatRelativeTime(apt.createdAt),
        type: 'payment' as const,
      };
    }

    return {
      id: apt.id,
      action: 'New booking',
      detail: `${clientName} booked ${apt.service.name}`,
      time: formatRelativeTime(apt.createdAt),
      type: 'booking' as const,
    };
  });
};

// Fetch function for dashboard data
async function fetchDashboardData(locationId?: string | null): Promise<DashboardData> {
  const locationParam = locationId ? `?locationId=${locationId}` : '';
  const [statsRes, todayRes, recentRes] = await Promise.all([
    api.get<ApiStatsResponse>(`/dashboard/stats${locationParam}`),
    api.get<TodayAppointment[]>(`/dashboard/today${locationParam}`),
    api.get<RecentAppointment[]>(`/dashboard/recent-activity${locationParam}`),
  ]);

  // Transform API response to frontend format
  const apiData = statsRes.data;
  const todayData = todayRes.data as { appointments?: TodayAppointment[]; summary?: { total: number } } | TodayAppointment[];
  const todayCount = Array.isArray(todayData)
    ? todayData.length
    : (todayData.summary?.total ?? todayData.appointments?.length ?? 0);

  const stats: DashboardStats = {
    todayAppointments: todayCount,
    todayRevenue: 0, // Not tracked separately
    monthRevenue: apiData?.revenue?.current ?? 0,
    revenueChange: `${apiData?.revenue?.change ?? 0}%`,
    newClients: apiData?.newClients?.current ?? 0,
    clientsChange: apiData?.newClients?.change ?? 0,
  };

  // Ensure arrays to prevent .filter()/.map() errors
  const appointments = Array.isArray(todayData)
    ? todayData
    : (todayData.appointments && Array.isArray(todayData.appointments) ? todayData.appointments : []);

  const recentData = Array.isArray(recentRes.data) ? recentRes.data : [];
  const recentActivity = transformToActivity(recentData);

  return {
    stats,
    todayAppointments: appointments,
    recentActivity,
  };
}

export function useDashboard(locationId?: string | null) {
  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['dashboard', locationId],
    queryFn: () => fetchDashboardData(locationId),
    refetchInterval: 60000, // Auto-refresh every 60 seconds
    refetchIntervalInBackground: true, // Keep refreshing in background tabs
    refetchOnWindowFocus: true, // Refresh when user returns to tab
    staleTime: 30000, // Data considered fresh for 30 seconds (stale-while-revalidate)
    gcTime: 300000, // Keep cached data for 5 minutes
    retry: 3, // Retry failed requests up to 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  return {
    stats: data?.stats ?? null,
    todayAppointments: data?.todayAppointments ?? [],
    recentActivity: data?.recentActivity ?? [],
    loading: isLoading,
    isFetching, // True during background refresh (for subtle loading indicators)
    error: error instanceof Error ? error.message : error ? 'Failed to fetch dashboard' : null,
    refetch,
  };
}
