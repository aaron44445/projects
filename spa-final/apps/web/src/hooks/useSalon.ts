'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

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
      if (response.data) setSalon(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch salon');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSalon();
  }, [fetchSalon]);

  const updateSalon = async (data: Partial<Salon>) => {
    const response = await api.patch<Salon>('/salon', data);
    if (response.data) setSalon(response.data);
    return response.data;
  };

  return { salon, loading, error, fetchSalon, updateSalon };
}
