'use client';

import { useState, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';

export interface OwnerNotificationPreferences {
  newBookingEmail: boolean;
  cancellationEmail: boolean;
  dailySummaryEmail: boolean;
  weeklySummaryEmail: boolean;
  newReviewEmail: boolean;
  paymentReceivedEmail: boolean;
  notificationEmail: string | null;
}

export type UpdateNotificationPreferences = Partial<OwnerNotificationPreferences>;

export function useOwnerNotifications() {
  const [preferences, setPreferences] = useState<OwnerNotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch preferences
  const fetchPreferences = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<OwnerNotificationPreferences>('/owner-notifications');
      if (response.success && response.data) {
        setPreferences(response.data);
        return response.data;
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch notification preferences';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update preferences
  const updatePreferences = useCallback(async (data: UpdateNotificationPreferences): Promise<OwnerNotificationPreferences | null> => {
    setError(null);
    try {
      const response = await api.patch<OwnerNotificationPreferences>('/owner-notifications', data);
      if (response.success && response.data) {
        setPreferences(response.data);
        return response.data;
      }
      return null;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update preferences';
      setError(message);
      throw err;
    }
  }, []);

  // Toggle a single preference
  const togglePreference = useCallback(async (key: keyof Omit<OwnerNotificationPreferences, 'notificationEmail'>): Promise<boolean> => {
    if (!preferences) return false;

    const currentValue = preferences[key];
    try {
      await updatePreferences({ [key]: !currentValue });
      return true;
    } catch {
      return false;
    }
  }, [preferences, updatePreferences]);

  // Update notification email
  const setNotificationEmail = useCallback(async (email: string | null): Promise<boolean> => {
    try {
      await updatePreferences({ notificationEmail: email });
      return true;
    } catch {
      return false;
    }
  }, [updatePreferences]);

  // Send test notification
  const sendTestNotification = useCallback(async (type?: string): Promise<boolean> => {
    setError(null);
    try {
      const response = await api.post<{ message: string; sentTo: string }>('/owner-notifications/test', { type });
      return response.success;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to send test notification';
      setError(message);
      return false;
    }
  }, []);

  return {
    preferences,
    isLoading,
    error,
    fetchPreferences,
    updatePreferences,
    togglePreference,
    setNotificationEmail,
    sendTestNotification,
    setError,
  };
}
