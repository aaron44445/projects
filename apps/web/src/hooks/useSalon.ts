'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';

export interface Salon {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string;
  timezone: string;
  // Internationalization settings
  currency: string;
  locale: string;
  timeFormat: string;
  dateFormat: string;
  weekStartsOn: number;
  // VAT/Tax settings
  vatNumber: string | null;
  taxEnabled: boolean;
  taxRate: number | null;
  taxName: string;
  taxIncluded: boolean;
  // Branding settings
  brand_primary_color: string;
  brand_background_color: string;
  // Other settings
  logoUrl: string | null;
  website: string | null;
  description: string | null;
  subscriptionPlan: string;
  featuresEnabled: string;
  multiLocationEnabled: boolean;
  // Staff policies
  requireTimeOffApproval?: boolean;
}

export interface TimeOffRequestWithStaff {
  id: string;
  staffId: string;
  startDate: string;
  endDate: string;
  type: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt: string | null;
  reviewNotes: string | null;
  createdAt: string;
  staff: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export function useSalon() {
  const [salon, setSalon] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequestWithStaff[]>([]);
  const [timeOffLoading, setTimeOffLoading] = useState(false);

  const fetchSalon = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Salon>('/salon');
      if (response.success && response.data) {
        setSalon(response.data);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch salon';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSalon();
  }, [fetchSalon]);

  const updateSalon = useCallback(async (data: Partial<Salon>): Promise<Salon> => {
    setError(null);
    try {
      const response = await api.patch<Salon>('/salon', data);
      if (response.success && response.data) {
        setSalon(response.data);
        return response.data;
      }
      throw new ApiError('UPDATE_FAILED', 'Failed to update salon');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update salon';
      setError(message);
      throw err;
    }
  }, []);

  const fetchTimeOffRequests = useCallback(async (status?: string) => {
    setTimeOffLoading(true);
    try {
      const url = status ? `/salon/time-off-requests?status=${status}` : '/salon/time-off-requests';
      const response = await api.get<TimeOffRequestWithStaff[]>(url);
      if (response.success && response.data) {
        setTimeOffRequests(response.data);
      }
    } finally {
      setTimeOffLoading(false);
    }
  }, []);

  const reviewTimeOff = useCallback(async (id: string, status: 'approved' | 'rejected', reviewNotes?: string) => {
    const response = await api.patch<TimeOffRequestWithStaff>(`/salon/time-off-requests/${id}`, {
      status,
      reviewNotes,
    });
    if (response.success && response.data) {
      setTimeOffRequests(prev => prev.map(r => r.id === id ? response.data! : r));
    }
    return response;
  }, []);

  return {
    salon,
    loading,
    error,
    fetchSalon,
    updateSalon,
    setError,
    timeOffRequests,
    timeOffLoading,
    fetchTimeOffRequests,
    reviewTimeOff,
  };
}
