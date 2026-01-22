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
  logoUrl: string | null;
  website: string | null;
  description: string | null;
  subscriptionPlan: string;
  featuresEnabled: string;
  multiLocationEnabled: boolean;
}

export function useSalon() {
  const [salon, setSalon] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return { salon, loading, error, fetchSalon, updateSalon, setError };
}
