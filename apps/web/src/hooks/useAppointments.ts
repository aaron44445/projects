'use client';

import { useState, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';
import type { Client } from './useClients';
import type { Service } from './useServices';

// Types based on Prisma schema
export interface Appointment {
  id: string;
  salonId: string;
  locationId?: string | null;
  clientId: string;
  staffId: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  price: number;
  priceOverride?: number | null;
  status: AppointmentStatus;
  cancellationReason?: string | null;
  notes?: string | null;
  source: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string | null;
  // Populated relations
  client?: Client;
  staff?: Staff;
  service?: Service;
}

export type AppointmentStatus =
  | 'confirmed'
  | 'pending'
  | 'cancelled'
  | 'completed'
  | 'no_show';

export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
}

export interface CreateAppointmentInput {
  clientId: string;
  staffId: string;
  serviceId: string;
  locationId?: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  price?: number;
  priceOverride?: number;
  notes?: string;
  status?: AppointmentStatus;
  source?: string;
}

export interface UpdateAppointmentInput {
  clientId?: string;
  staffId?: string;
  serviceId?: string;
  locationId?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  price?: number;
  priceOverride?: number;
  notes?: string;
  status?: AppointmentStatus;
}

export interface CancelAppointmentInput {
  cancellationReason?: string;
}

export interface DateRange {
  start: string;
  end: string;
}

interface UseAppointmentsReturn {
  appointments: Appointment[];
  isLoading: boolean;
  error: string | null;
  fetchAppointments: (dateRange?: DateRange, staffId?: string, locationId?: string | null) => Promise<void>;
  getAppointment: (id: string) => Promise<Appointment | null>;
  createAppointment: (data: CreateAppointmentInput) => Promise<Appointment>;
  updateAppointment: (id: string, data: UpdateAppointmentInput) => Promise<Appointment>;
  cancelAppointment: (id: string, data?: CancelAppointmentInput) => Promise<Appointment>;
  completeAppointment: (id: string) => Promise<Appointment>;
  markNoShow: (id: string) => Promise<Appointment>;
  refetch: () => Promise<void>;
}

export function useAppointments(initialDateRange?: DateRange): UseAppointmentsReturn {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDateRange, setCurrentDateRange] = useState<DateRange | undefined>(initialDateRange);

  const fetchAppointments = useCallback(async (dateRange?: DateRange, staffId?: string, locationId?: string | null) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (dateRange) {
        params.append('dateFrom', dateRange.start);
        params.append('dateTo', dateRange.end);
        setCurrentDateRange(dateRange);
      } else if (currentDateRange) {
        params.append('dateFrom', currentDateRange.start);
        params.append('dateTo', currentDateRange.end);
      }

      if (staffId) {
        params.append('staffId', staffId);
      }

      // Add location filter - locationId passed means filter by that location
      if (locationId) {
        params.append('locationId', locationId);
      }

      const queryString = params.toString();
      const endpoint = queryString ? `/appointments?${queryString}` : '/appointments';

      const response = await api.get<{ items: Appointment[]; total: number; page: number; pageSize: number; totalPages: number }>(endpoint);

      if (response.success && response.data) {
        // Backend returns paginated response with items array
        const items = response.data.items;
        setAppointments(Array.isArray(items) ? items : []);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch appointments';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [currentDateRange]);

  const getAppointment = useCallback(async (id: string): Promise<Appointment | null> => {
    try {
      const response = await api.get<Appointment>(`/appointments/${id}`);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch appointment';
      setError(message);
      return null;
    }
  }, []);

  const createAppointment = useCallback(async (data: CreateAppointmentInput): Promise<Appointment> => {
    setError(null);

    try {
      const response = await api.post<Appointment>('/appointments', data);

      if (response.success && response.data) {
        setAppointments((prev) => [...prev, response.data!]);
        return response.data;
      }

      throw new ApiError('CREATE_FAILED', 'Failed to create appointment');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create appointment';
      setError(message);
      throw err;
    }
  }, []);

  const updateAppointment = useCallback(async (id: string, data: UpdateAppointmentInput): Promise<Appointment> => {
    setError(null);

    try {
      const response = await api.patch<Appointment>(`/appointments/${id}`, data);

      if (response.success && response.data) {
        setAppointments((prev) =>
          prev.map((appointment) => (appointment.id === id ? response.data! : appointment))
        );
        return response.data;
      }

      throw new ApiError('UPDATE_FAILED', 'Failed to update appointment');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update appointment';
      setError(message);
      throw err;
    }
  }, []);

  const cancelAppointment = useCallback(async (id: string, data?: CancelAppointmentInput): Promise<Appointment> => {
    setError(null);

    try {
      const response = await api.post<Appointment>(`/appointments/${id}/cancel`, data || {});

      if (response.success && response.data) {
        setAppointments((prev) =>
          prev.map((appointment) => (appointment.id === id ? response.data! : appointment))
        );
        return response.data;
      }

      throw new ApiError('CANCEL_FAILED', 'Failed to cancel appointment');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to cancel appointment';
      setError(message);
      throw err;
    }
  }, []);

  const completeAppointment = useCallback(async (id: string): Promise<Appointment> => {
    return updateAppointment(id, { status: 'completed' });
  }, [updateAppointment]);

  const markNoShow = useCallback(async (id: string): Promise<Appointment> => {
    return updateAppointment(id, { status: 'no_show' });
  }, [updateAppointment]);

  const refetch = useCallback(async () => {
    await fetchAppointments();
  }, [fetchAppointments]);

  return {
    appointments,
    isLoading,
    error,
    fetchAppointments,
    getAppointment,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    completeAppointment,
    markNoShow,
    refetch,
  };
}
