'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Interface definitions
interface DashboardStats {
  todayAppointments: number;
  todayRevenue: number;
  monthRevenue: number;
  revenueChange: string;
  newClients: number;
  clientsChange: number;
  timezone: string;
}

interface ApiStatsResponse {
  revenue: { current: number; previous: number; change: number };
  appointments: { current: number; previous: number; change: number };
  newClients: { current: number; previous: number; change: number };
  totalClients: number;
  vipClients: number; // PERF-02: VIP client count from database
  rating: { average: number | null; count: number };
  timezone: string;
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

// Helper to format relative time
function formatRelativeTime(dateString: string): string {
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
}

// Transform appointments to activity items
function transformToActivity(appointments: RecentAppointment[]): RecentActivityItem[] {
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
}

// Auto-refresh interval in milliseconds (60 seconds)
const REFRESH_INTERVAL_MS = 60 * 1000;

// Individual fetch functions
async function fetchStats(locationId?: string | null) {
  const locationParam = locationId ? `?locationId=${locationId}` : '';
  const response = await api.get<ApiStatsResponse>(`/dashboard/stats${locationParam}`);
  const apiData = response.data;

  return {
    todayAppointments: 0, // Will be filled from appointments query
    todayRevenue: 0,
    monthRevenue: apiData?.revenue?.current ?? 0,
    revenueChange: `${apiData?.revenue?.change ?? 0}%`,
    newClients: apiData?.newClients?.current ?? 0,
    clientsChange: apiData?.newClients?.change ?? 0,
    timezone: apiData?.timezone ?? 'UTC',
  };
}

async function fetchTodayAppointments(locationId?: string | null) {
  const locationParam = locationId ? `?locationId=${locationId}` : '';
  const response = await api.get<{ appointments: TodayAppointment[]; summary: { total: number } } | TodayAppointment[]>(
    `/dashboard/today${locationParam}`
  );
  const todayData = response.data;

  return Array.isArray(todayData)
    ? todayData
    : (todayData?.appointments ?? []);
}

interface RecentActivityResponse {
  activity: RecentAppointment[];
  timezone: string;
}

async function fetchRecentActivity(locationId?: string | null) {
  const locationParam = locationId ? `?locationId=${locationId}` : '';
  const response = await api.get<RecentActivityResponse | RecentAppointment[]>(`/dashboard/recent-activity${locationParam}`);
  // Handle both old (array) and new (object with activity) response formats
  const recentData = Array.isArray(response.data) ? response.data : (response.data?.activity ?? []);
  return transformToActivity(recentData);
}

// Format error messages to be user-friendly
function formatError(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof Error) {
    // Common error patterns -> user-friendly messages
    if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Network')) {
      return 'Unable to connect. Check your internet connection.';
    }
    if (error.message.includes('401') || error.message.includes('403') || error.message.includes('Unauthorized')) {
      return 'Session expired. Please refresh the page.';
    }
    if (error.message.includes('500') || error.message.includes('server') || error.message.includes('Server')) {
      return 'Server error. Please try again later.';
    }
    if (error.message.includes('timeout') || error.message.includes('Timeout')) {
      return 'Request timed out. Please try again.';
    }
    // Don't expose raw technical errors
    if (error.message.length > 100 || error.message.includes('Error:')) {
      return 'Something went wrong. Please try again.';
    }
    return error.message;
  }
  return 'An unexpected error occurred.';
}

/**
 * Main dashboard hook with independent queries for graceful degradation.
 * Each section (stats, appointments, activity) can fail independently.
 */
export function useDashboard(locationId?: string | null) {
  const queryClient = useQueryClient();

  // Stats query (revenue, new clients) - with 60-second auto-refresh
  const statsQuery = useQuery({
    queryKey: ['dashboard', 'stats', locationId],
    queryFn: () => fetchStats(locationId),
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: false, // Pause polling when tab is backgrounded
    refetchOnWindowFocus: true,          // Refresh immediately when tab returns
    staleTime: 30000,
    gcTime: 300000,
    retry: 3,
  });

  // Today's appointments query - with 60-second auto-refresh
  const appointmentsQuery = useQuery({
    queryKey: ['dashboard', 'appointments', locationId],
    queryFn: () => fetchTodayAppointments(locationId),
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: false, // Pause polling when tab is backgrounded
    refetchOnWindowFocus: true,          // Refresh immediately when tab returns
    staleTime: 30000,
    gcTime: 300000,
    retry: 3,
  });

  // Recent activity query - with 60-second auto-refresh
  const activityQuery = useQuery({
    queryKey: ['dashboard', 'activity', locationId],
    queryFn: () => fetchRecentActivity(locationId),
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: false, // Pause polling when tab is backgrounded
    refetchOnWindowFocus: true,          // Refresh immediately when tab returns
    staleTime: 30000,
    gcTime: 300000,
    retry: 3,
  });

  // Combine stats with appointment count
  const stats: DashboardStats | null = statsQuery.data
    ? {
        ...statsQuery.data,
        todayAppointments: appointmentsQuery.data?.length ?? 0,
      }
    : null;

  // Refetch all queries
  const refetch = () => {
    statsQuery.refetch();
    appointmentsQuery.refetch();
    activityQuery.refetch();
  };

  return {
    // Stats data and state
    stats,
    statsLoading: statsQuery.isLoading,
    statsError: formatError(statsQuery.error),
    refetchStats: () => statsQuery.refetch(),

    // Appointments data and state
    todayAppointments: appointmentsQuery.data ?? [],
    appointmentsLoading: appointmentsQuery.isLoading,
    appointmentsError: formatError(appointmentsQuery.error),
    refetchAppointments: () => appointmentsQuery.refetch(),

    // Activity data and state
    recentActivity: activityQuery.data ?? [],
    activityLoading: activityQuery.isLoading,
    activityError: formatError(activityQuery.error),
    refetchActivity: () => activityQuery.refetch(),

    // Legacy compatibility (overall loading/error state)
    loading: statsQuery.isLoading || appointmentsQuery.isLoading,
    isFetching: statsQuery.isFetching || appointmentsQuery.isFetching || activityQuery.isFetching,
    error: statsQuery.error || appointmentsQuery.error
      ? formatError(statsQuery.error || appointmentsQuery.error)
      : null,
    refetch,
  };
}
