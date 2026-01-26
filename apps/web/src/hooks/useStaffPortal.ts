import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';

// Types for Staff Portal

export interface StaffAppointment {
  id: string;
  clientId: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  price: number;
  tip?: number;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
  };
  service: {
    id: string;
    name: string;
    duration: number;
    price: number;
    category?: {
      id: string;
      name: string;
    };
  };
}

export interface StaffEarnings {
  totalCommission: number;
  totalTips: number;
  totalEarnings: number;
  appointmentCount: number;
  periodStart: string;
  periodEnd: string;
  breakdown: {
    date: string;
    commission: number;
    tips: number;
    appointments: number;
  }[];
}

export interface TimeOffRequest {
  id: string;
  staffId?: string;
  startDate: string;
  endDate: string;
  type: 'vacation' | 'sick' | 'personal' | 'other';
  reason?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

// Types for Staff Schedule
export interface StaffScheduleDay {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  locationId: string | null;
}

export interface StaffScheduleLocation {
  location: {
    id: string;
    name: string;
    isPrimary: boolean;
  };
  isPrimary: boolean;
  schedule: StaffScheduleDay[];
}

export interface StaffScheduleData {
  locations: Array<{ id: string; name: string; isPrimary: boolean }>;
  scheduleByLocation: Record<string, StaffScheduleLocation>;
  totalHoursPerWeek: number;
}

export interface StaffAssignments {
  locations: Array<{
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    isPrimary: boolean;
    isPrimaryForStaff: boolean;
  }>;
  services: Array<{
    id: string;
    name: string;
    price: number;
    durationMinutes: number;
    category: string;
  }>;
}

export interface ClockEntry {
  id: string;
  staffId: string;
  clockInTime: string;
  clockOutTime?: string;
  totalHours?: number;
  notes?: string;
}

// Hook: useStaffAppointments
export function useStaffAppointments() {
  const [appointments, setAppointments] = useState<StaffAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async (startDate?: string, endDate?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const queryString = params.toString();
      const endpoint = `/staff-portal/appointments${queryString ? `?${queryString}` : ''}`;

      const response = await api.get<StaffAppointment[]>(endpoint);
      if (response.success && response.data) {
        setAppointments(response.data);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load appointments');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTodayAppointments = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter((apt) => apt.startTime.startsWith(today));
  }, [appointments]);

  const getWeekAppointments = useCallback(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return appointments.filter((apt) => {
      const aptDate = new Date(apt.startTime);
      return aptDate >= startOfWeek && aptDate <= endOfWeek;
    });
  }, [appointments]);

  useEffect(() => {
    // Fetch current month's appointments by default
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    fetchAppointments(
      startOfMonth.toISOString().split('T')[0],
      endOfMonth.toISOString().split('T')[0]
    );
  }, [fetchAppointments]);

  return {
    appointments,
    isLoading,
    error,
    fetchAppointments,
    getTodayAppointments,
    getWeekAppointments,
    refetch: fetchAppointments,
  };
}

// Hook: useStaffEarnings
export function useStaffEarnings() {
  const [earnings, setEarnings] = useState<StaffEarnings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEarnings = useCallback(async (startDate?: string, endDate?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const queryString = params.toString();
      const endpoint = `/staff-portal/earnings${queryString ? `?${queryString}` : ''}`;

      const response = await api.get<StaffEarnings>(endpoint);
      if (response.success && response.data) {
        setEarnings(response.data);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load earnings');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch current month's earnings by default
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    fetchEarnings(
      startOfMonth.toISOString().split('T')[0],
      endOfMonth.toISOString().split('T')[0]
    );
  }, [fetchEarnings]);

  return {
    earnings,
    isLoading,
    error,
    fetchEarnings,
    refetch: fetchEarnings,
  };
}

// Hook: useTimeOff
export function useTimeOff() {
  const [timeOffs, setTimeOffs] = useState<TimeOffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<TimeOffRequest[]>('/staff-portal/time-off');
      if (response.success && response.data) {
        setTimeOffs(response.data);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load time-off requests');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const createTimeOff = useCallback(async (data: {
    startDate: string;
    endDate: string;
    type?: 'vacation' | 'sick' | 'personal' | 'other';
    reason?: string;
    notes?: string;
  }) => {
    const response = await api.post<TimeOffRequest>('/staff-portal/time-off', data);
    if (response.success && response.data) {
      setTimeOffs((prev) => [response.data!, ...prev]);
      return response.data;
    }
    throw new ApiError('CREATE_FAILED', 'Failed to create time-off request');
  }, []);

  const cancelTimeOff = useCallback(async (id: string) => {
    const response = await api.delete<void>(`/staff-portal/time-off/${id}`);
    if (response.success) {
      setTimeOffs((prev) => prev.filter((r) => r.id !== id));
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return {
    timeOffs,
    loading,
    error,
    createTimeOff,
    cancelTimeOff,
    refetch: fetchRequests,
  };
}

// Hook: useClockInOut
export function useClockInOut() {
  const [currentEntry, setCurrentEntry] = useState<ClockEntry | null>(null);
  const [history, setHistory] = useState<ClockEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<{ current: ClockEntry | null; history: ClockEntry[] }>(
        '/staff-portal/clock'
      );
      if (response.success && response.data) {
        setCurrentEntry(response.data.current);
        setHistory(response.data.history);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load clock status');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clockIn = useCallback(async (notes?: string) => {
    const response = await api.post<ClockEntry>('/staff-portal/clock/in', { notes });
    if (response.success && response.data) {
      setCurrentEntry(response.data);
      return response.data;
    }
    throw new ApiError('CLOCK_IN_FAILED', 'Failed to clock in');
  }, []);

  const clockOut = useCallback(async (notes?: string) => {
    const response = await api.post<ClockEntry>('/staff-portal/clock/out', { notes });
    if (response.success && response.data) {
      setHistory((prev) => [response.data!, ...prev]);
      setCurrentEntry(null);
      return response.data;
    }
    throw new ApiError('CLOCK_OUT_FAILED', 'Failed to clock out');
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    currentEntry,
    history,
    isLoading,
    error,
    isClockedIn: !!currentEntry && !currentEntry.clockOutTime,
    clockIn,
    clockOut,
    refetch: fetchStatus,
  };
}

// Hook: useStaffSchedule - schedule and assignments management
export function useStaffSchedule() {
  const [schedule, setSchedule] = useState<StaffScheduleData | null>(null);
  const [assignments, setAssignments] = useState<StaffAssignments | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<StaffScheduleData>('/staff-portal/my-schedule');
      if (response.success && response.data) {
        setSchedule(response.data);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to fetch schedule');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAssignments = useCallback(async () => {
    try {
      const response = await api.get<StaffAssignments>('/staff-portal/my-assignments');
      if (response.success && response.data) {
        setAssignments(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
    }
  }, []);

  const updateSchedule = useCallback(async (
    locationId: string | null,
    newSchedule: Array<{ dayOfWeek: number; startTime: string; endTime: string; isWorking: boolean }>
  ): Promise<{ success: boolean; pendingApproval?: boolean; message?: string }> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.put<{
        pendingApproval?: boolean;
        message?: string;
        schedule?: StaffScheduleDay[];
      }>('/staff-portal/my-schedule', {
        locationId,
        schedule: newSchedule,
      });
      if (response.success) {
        await fetchSchedule(); // Refresh
        return {
          success: true,
          pendingApproval: response.data?.pendingApproval,
          message: response.data?.message,
        };
      }
      return { success: false };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update schedule';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [fetchSchedule]);

  useEffect(() => {
    fetchSchedule();
    fetchAssignments();
  }, [fetchSchedule, fetchAssignments]);

  return {
    schedule,
    assignments,
    loading,
    error,
    fetchSchedule,
    fetchAssignments,
    updateSchedule,
  };
}

// Hook: useStaffDashboard - combines data for the dashboard
export function useStaffDashboard() {
  const {
    appointments,
    isLoading: appointmentsLoading,
    getTodayAppointments,
    getWeekAppointments,
  } = useStaffAppointments();

  const {
    earnings,
    isLoading: earningsLoading,
  } = useStaffEarnings();

  const {
    isClockedIn,
    currentEntry,
    clockIn,
    clockOut,
    isLoading: clockLoading,
  } = useClockInOut();

  const todayAppointments = getTodayAppointments();
  const weekAppointments = getWeekAppointments();

  // Calculate today's earnings from today's completed appointments
  const todayEarnings = todayAppointments
    .filter((apt) => apt.status === 'completed')
    .reduce((sum, apt) => sum + (apt.tip || 0), 0);

  const upcomingAppointments = todayAppointments
    .filter((apt) => {
      const now = new Date();
      const aptTime = new Date(apt.startTime);
      return aptTime > now && apt.status !== 'cancelled';
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return {
    todayAppointments,
    weekAppointments,
    upcomingAppointments,
    earnings,
    todayEarnings,
    isClockedIn,
    currentEntry,
    clockIn,
    clockOut,
    isLoading: appointmentsLoading || earningsLoading || clockLoading,
  };
}
