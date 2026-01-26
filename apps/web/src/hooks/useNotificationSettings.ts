'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';

interface ReminderTiming {
  hours: number;
  label: string;
}

export interface NotificationSettings {
  reminders: {
    enabled: boolean;
    timings: ReminderTiming[];
  };
  channels: {
    email: boolean;
    sms: boolean;
  };
}

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch settings on mount
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<NotificationSettings>('/salon/notification-settings');
      if (response.success && response.data) {
        setSettings(response.data);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch notification settings';
      setError(message);
      console.error('Failed to fetch notification settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Save settings to API
  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>): Promise<void> => {
    if (!settings) return;

    setSaving(true);
    setError(null);
    try {
      // Merge new settings with existing
      const mergedSettings: NotificationSettings = {
        reminders: {
          ...settings.reminders,
          ...newSettings.reminders,
        },
        channels: {
          ...settings.channels,
          ...newSettings.channels,
        },
      };

      const response = await api.put<NotificationSettings>('/salon/notification-settings', mergedSettings);
      if (response.success && response.data) {
        setSettings(response.data);
        console.log('Notification settings saved');
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to save notification settings';
      setError(message);
      console.error('Failed to save notification settings:', message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [settings]);

  // Helper: Update primary reminder timing
  const setReminderTiming = useCallback(async (hours: number) => {
    if (!settings) return;

    // Create label based on hours
    let label = `${hours} hours before`;
    if (hours === 24) label = '24 hours before';
    else if (hours === 48) label = '48 hours before';
    else if (hours === 2) label = '2 hours before';

    const newTimings = [{ hours, label }];

    // Keep existing non-primary timings if any (future-proofing)
    if (settings.reminders.timings.length > 1) {
      newTimings.push(...settings.reminders.timings.slice(1));
    }

    await updateSettings({
      reminders: {
        ...settings.reminders,
        timings: newTimings,
      },
    });
  }, [settings, updateSettings]);

  // Helper: Toggle email or SMS channel
  const toggleChannel = useCallback(async (channel: 'email' | 'sms') => {
    if (!settings) return;

    await updateSettings({
      channels: {
        ...settings.channels,
        [channel]: !settings.channels[channel],
      },
    });
  }, [settings, updateSettings]);

  // Helper: Toggle reminders enabled/disabled
  const toggleReminders = useCallback(async () => {
    if (!settings) return;

    await updateSettings({
      reminders: {
        ...settings.reminders,
        enabled: !settings.reminders.enabled,
      },
    });
  }, [settings, updateSettings]);

  return {
    settings,
    loading,
    error,
    saving,
    updateSettings,
    setReminderTiming,
    toggleChannel,
    toggleReminders,
  };
}
