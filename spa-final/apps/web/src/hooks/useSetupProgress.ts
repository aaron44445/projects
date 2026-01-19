import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface SetupProgress {
  businessHours: boolean;
  firstService: boolean;
  firstStaff: boolean;
  bookingPage: boolean;
  paymentMethod: boolean;
  completedAt: string | null;
}

export function useSetupProgress() {
  const [progress, setProgress] = useState<SetupProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const response = await api.get<{ setupProgress: SetupProgress }>('/salon/setup-progress');
      if (response.success && response.data) {
        setProgress(response.data.setupProgress);
      }
    } catch {
      // If not set up yet, use defaults
      setProgress({
        businessHours: false,
        firstService: false,
        firstStaff: false,
        bookingPage: false,
        paymentMethod: false,
        completedAt: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const markComplete = async (field: keyof Omit<SetupProgress, 'completedAt'>) => {
    try {
      await api.patch('/salon/setup-progress', { [field]: true });
      setProgress((prev) => prev ? { ...prev, [field]: true } : null);
    } catch (error) {
      console.error('Failed to update setup progress:', error);
    }
  };

  const completedCount = progress
    ? Object.entries(progress)
        .filter(([key, value]) => key !== 'completedAt' && value === true)
        .length
    : 0;

  const totalSteps = 5;
  const percentComplete = Math.round((completedCount / totalSteps) * 100);

  return {
    progress,
    loading,
    markComplete,
    refetch: fetchProgress,
    completedCount,
    totalSteps,
    percentComplete,
    isComplete: completedCount === totalSteps,
  };
}
