import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface NotificationLog {
  id: string;
  salonId: string;
  clientId: string;
  appointmentId: string | null;
  type: string;
  channels: string;
  status: string;
  emailStatus: string | null;
  emailSentAt: string | null;
  emailDeliveredAt: string | null;
  emailError: string | null;
  smsStatus: string | null;
  smsSentAt: string | null;
  smsDeliveredAt: string | null;
  smsError: string | null;
  smsErrorCode: string | null;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  };
  appointment: {
    id: string;
    startTime: string;
    service: { name: string };
  } | null;
}

export interface NotificationStats {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  successRate: string;
}

export interface NotificationFilters {
  type?: string;
  status?: string;
  clientId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export function useNotifications(filters: NotificationFilters = {}) {
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.type) params.set('type', filters.type);
      if (filters.status) params.set('status', filters.status);
      if (filters.clientId) params.set('clientId', filters.clientId);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      if (filters.page) params.set('page', filters.page.toString());
      if (filters.limit) params.set('limit', filters.limit.toString());

      const res = await api.get(`/notifications?${params.toString()}`) as any;

      if (res.success) {
        setNotifications(res.data as NotificationLog[]);
        setPagination(res.pagination);
      } else {
        setError(res.error?.message || 'Failed to load notifications');
      }
    } catch (err) {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchStats = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);

      const res = await api.get(`/notifications/stats?${params.toString()}`);
      if (res.success) {
        setStats(res.data as NotificationStats);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, [filters.startDate, filters.endDate]);

  const resendNotification = async (notificationId: string): Promise<boolean> => {
    try {
      const res = await api.post(`/notifications/${notificationId}/resend`, {});
      if (res.success) {
        // Refresh the list
        await fetchNotifications();
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, [fetchNotifications, fetchStats]);

  return {
    notifications,
    stats,
    loading,
    error,
    pagination,
    refresh: fetchNotifications,
    resendNotification,
  };
}
