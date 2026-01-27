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

// Default settings to use if fetch fails
const DEFAULT_SETTINGS: NotificationSettings = {
  reminders: {
    enabled: true,
    timings: [{ hours: 24, label: '24 hours before' }],
  },
  channels: {
    email: true,
    sms: true,
  },
};

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch settings on mount
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[NotificationSettings] Fetching settings...');
      const response = await api.get<NotificationSettings>('/salon/notification-settings');
      console.log('[NotificationSettings] Fetch response:', response);
      if (response.success && response.data) {
        setSettings(response.data);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch notification settings';
      setError(message);
      console.error('[NotificationSettings] Fetch error:', err);
      // Keep default settings on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Save settings to API with optimistic update
  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>): Promise<void> => {
    console.log('[NotificationSettings] updateSettings called with:', newSettings);
    console.log('[NotificationSettings] Current settings:', settings);

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

    console.log('[NotificationSettings] Merged settings to save:', mergedSettings);

    // Optimistic update - update UI immediately
    setSettings(mergedSettings);
    setSaving(true);
    setError(null);

    try {
      const response = await api.put<NotificationSettings>('/salon/notification-settings', mergedSettings);
      console.log('[NotificationSettings] Save response:', response);

      if (response.success && response.data) {
        setSettings(response.data);
        console.log('[NotificationSettings] Settings saved successfully');
      } else {
        // Revert on failure
        console.error('[NotificationSettings] Save failed - response not successful');
        await fetchSettings(); // Refetch to get correct state
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to save notification settings';
      setError(message);
      console.error('[NotificationSettings] Save error:', err);
      // Revert optimistic update by refetching
      await fetchSettings();
    } finally {
      setSaving(false);
    }
  }, [settings, fetchSettings]);

  // Helper: Update primary reminder timing
  const setReminderTiming = useCallback(async (hours: number) => {
    console.log('[NotificationSettings] setReminderTiming called with hours:', hours);

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
    console.log('[NotificationSettings] toggleChannel called with:', channel);

    await updateSettings({
      channels: {
        ...settings.channels,
        [channel]: !settings.channels[channel],
      },
    });
  }, [settings, updateSettings]);

  // Helper: Toggle reminders enabled/disabled
  const toggleReminders = useCallback(async () => {
    console.log('[NotificationSettings] toggleReminders called, current enabled:', settings.reminders.enabled);

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
