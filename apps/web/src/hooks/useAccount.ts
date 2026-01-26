'use client';

import { useState, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  locale: string | null;
  role: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: string;
  lastLogin: string | null;
}

export interface UserSession {
  id: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  location: string | null;
  lastActive: string;
  createdAt: string;
}

export interface LoginHistoryEntry {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  location: string | null;
  success: boolean;
  failReason: string | null;
  createdAt: string;
}

export interface DeletionRequest {
  id: string;
  status: string;
  reason: string | null;
  scheduledDeletion: string;
  requestedAt: string;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  locale?: string | null;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export function useAccount() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [deletionRequest, setDeletionRequest] = useState<DeletionRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile
  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<UserProfile>('/account/profile');
      if (response.success && response.data) {
        setProfile(response.data);
        return response.data;
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch profile';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(async (data: UpdateProfileInput): Promise<UserProfile | null> => {
    setError(null);
    try {
      const response = await api.patch<UserProfile>('/account/profile', data);
      if (response.success && response.data) {
        setProfile(response.data);
        return response.data;
      }
      return null;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update profile';
      setError(message);
      throw err;
    }
  }, []);

  // Change password
  const changePassword = useCallback(async (data: ChangePasswordInput): Promise<boolean> => {
    setError(null);
    try {
      const response = await api.post<{ message: string }>('/account/change-password', data);
      return response.success;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to change password';
      setError(message);
      throw err;
    }
  }, []);

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<UserSession[]>('/account/sessions');
      if (response.success && response.data) {
        setSessions(response.data);
        return response.data;
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch sessions';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Revoke session
  const revokeSession = useCallback(async (sessionId: string): Promise<boolean> => {
    setError(null);
    try {
      const response = await api.delete<{ message: string }>(`/account/sessions/${sessionId}`);
      if (response.success) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        return true;
      }
      return false;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to revoke session';
      setError(message);
      throw err;
    }
  }, []);

  // Revoke all other sessions
  const revokeAllOtherSessions = useCallback(async (): Promise<boolean> => {
    setError(null);
    try {
      const response = await api.delete<{ message: string }>('/account/sessions');
      if (response.success) {
        await fetchSessions(); // Refresh the list
        return true;
      }
      return false;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to revoke sessions';
      setError(message);
      throw err;
    }
  }, [fetchSessions]);

  // Fetch login history
  const fetchLoginHistory = useCallback(async (limit: number = 20) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<LoginHistoryEntry[]>(`/account/login-history?limit=${limit}`);
      if (response.success && response.data) {
        setLoginHistory(response.data);
        return response.data;
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch login history';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Request data export
  const requestDataExport = useCallback(async () => {
    setError(null);
    try {
      const response = await api.post<Record<string, unknown>>('/account/data-export');
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to export data';
      setError(message);
      throw err;
    }
  }, []);

  // Fetch deletion request status
  const fetchDeletionRequest = useCallback(async () => {
    setError(null);
    try {
      const response = await api.get<DeletionRequest | null>('/account/delete-request');
      if (response.success) {
        setDeletionRequest(response.data || null);
        return response.data;
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch deletion status';
      setError(message);
    }
  }, []);

  // Request account deletion
  const requestAccountDeletion = useCallback(async (reason?: string): Promise<DeletionRequest | null> => {
    setError(null);
    try {
      const response = await api.post<DeletionRequest>('/account/delete-request', { reason });
      if (response.success && response.data) {
        setDeletionRequest(response.data);
        return response.data;
      }
      return null;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to request deletion';
      setError(message);
      throw err;
    }
  }, []);

  // Cancel account deletion
  const cancelAccountDeletion = useCallback(async (): Promise<boolean> => {
    setError(null);
    try {
      const response = await api.delete<{ message: string }>('/account/delete-request');
      if (response.success) {
        setDeletionRequest(null);
        return true;
      }
      return false;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to cancel deletion';
      setError(message);
      throw err;
    }
  }, []);

  return {
    profile,
    sessions,
    loginHistory,
    deletionRequest,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    changePassword,
    fetchSessions,
    revokeSession,
    revokeAllOtherSessions,
    fetchLoginHistory,
    requestDataExport,
    fetchDeletionRequest,
    requestAccountDeletion,
    cancelAccountDeletion,
    setError,
  };
}
