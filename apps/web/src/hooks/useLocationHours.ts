'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';

interface LocationHour {
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function useLocationHours(locationId: string | null) {
  const [hours, setHours] = useState<LocationHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHours = useCallback(async () => {
    if (!locationId) {
      setHours([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.get<LocationHour[]>(`/locations/${locationId}/hours`);
      if (response.success && response.data) {
        setHours(response.data);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch hours';
      setError(message);
      console.error('[LocationHours] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    fetchHours();
  }, [fetchHours]);

  const updateHours = useCallback(async (newHours: LocationHour[]): Promise<boolean> => {
    if (!locationId) return false;

    setSaving(true);
    setError(null);

    // Optimistic update
    const previousHours = hours;
    setHours(newHours);

    try {
      const response = await api.put<LocationHour[]>(`/locations/${locationId}/hours`, { hours: newHours });
      if (response.success && response.data) {
        setHours(response.data);
        console.log('[LocationHours] Saved successfully');
        return true;
      } else {
        setHours(previousHours);
        return false;
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to save hours';
      setError(message);
      setHours(previousHours);
      console.error('[LocationHours] Save error:', err);
      return false;
    } finally {
      setSaving(false);
    }
  }, [locationId, hours]);

  // Helper to convert API format to UI format
  const getDisplayHours = useCallback(() => {
    return DAY_NAMES.map((day, index) => {
      const hourData = hours.find(h => h.dayOfWeek === index);
      return {
        day,
        dayOfWeek: index,
        open: hourData?.openTime || '09:00',
        close: hourData?.closeTime || '17:00',
        isOpen: hourData ? !hourData.isClosed : index !== 0, // Sunday closed by default
      };
    });
  }, [hours]);

  // Helper to convert UI format back to API format
  const setDisplayHours = useCallback(async (displayHours: Array<{ dayOfWeek: number; open: string; close: string; isOpen: boolean }>) => {
    const apiHours = displayHours.map(h => ({
      dayOfWeek: h.dayOfWeek,
      openTime: h.isOpen ? h.open : null,
      closeTime: h.isOpen ? h.close : null,
      isClosed: !h.isOpen,
    }));
    return updateHours(apiHours);
  }, [updateHours]);

  return {
    hours,
    loading,
    saving,
    error,
    fetchHours,
    updateHours,
    getDisplayHours,
    setDisplayHours,
  };
}
