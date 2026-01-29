'use client';

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';

interface TimeEntry {
  id: string;
  clockIn: string;
  clockOut: string | null;
  locationId: string;
  locationName: string;
  timezone: string;
  durationMinutes: number | null;
  isActive: boolean;
}

interface ClockStatus {
  isClockedIn: boolean;
  activeEntry: TimeEntry | null;
  canClockIn: boolean;
}

interface UseTimeClockReturn {
  status: ClockStatus | null;
  history: TimeEntry[];
  loading: boolean;
  historyLoading: boolean;
  error: string | null;
  clockIn: (locationId: string) => Promise<TimeEntry>;
  clockOut: () => Promise<TimeEntry>;
  refetchStatus: () => Promise<void>;
  fetchHistory: (startDate?: string, endDate?: string) => Promise<void>;
}

export function useTimeClock(): UseTimeClockReturn {
  const [status, setStatus] = useState<ClockStatus | null>(null);
  const [history, setHistory] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<ClockStatus>('/staff-portal/time-clock/status');
      if (response.success && response.data) {
        setStatus(response.data);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch clock status');
      console.error('Clock status error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async (startDate?: string, endDate?: string) => {
    try {
      setHistoryLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const url = `/staff-portal/time-clock/history${params.toString() ? '?' + params : ''}`;
      const response = await api.get<TimeEntry[]>(url);
      if (response.success && response.data) {
        setHistory(response.data);
      }
    } catch (err) {
      console.error('Clock history error:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const clockIn = useCallback(async (locationId: string): Promise<TimeEntry> => {
    const response = await api.post<TimeEntry>('/staff-portal/time-clock/clock-in', { locationId });
    if (response.success && response.data) {
      await fetchStatus();
      await fetchHistory();
      return response.data;
    }
    throw new Error(response.error?.message || 'Clock in failed');
  }, [fetchStatus, fetchHistory]);

  const clockOut = useCallback(async (): Promise<TimeEntry> => {
    if (!status?.activeEntry) {
      throw new Error('No active clock entry');
    }

    const response = await api.post<TimeEntry>(
      `/staff-portal/time-clock/clock-out/${status.activeEntry.id}`
    );
    if (response.success && response.data) {
      await fetchStatus();
      await fetchHistory();
      return response.data;
    }
    throw new Error(response.error?.message || 'Clock out failed');
  }, [status, fetchStatus, fetchHistory]);

  useEffect(() => {
    fetchStatus();
    fetchHistory();
  }, [fetchStatus, fetchHistory]);

  return {
    status,
    history,
    loading,
    historyLoading,
    error,
    clockIn,
    clockOut,
    refetchStatus: fetchStatus,
    fetchHistory,
  };
}
