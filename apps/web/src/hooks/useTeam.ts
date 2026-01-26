'use client';

import { useState, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';

export interface TeamMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  staffLocations: Array<{
    location: { id: string; name: string };
  }>;
}

export interface TeamInvite {
  id: string;
  email: string;
  role: string;
  invitedBy: {
    name: string;
    email: string;
  };
  expiresAt: string;
  createdAt: string;
}

export interface InviteInput {
  email: string;
  role?: 'admin' | 'manager' | 'staff';
  firstName?: string;
  lastName?: string;
}

export function useTeam() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch team members
  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<TeamMember[]>('/team');
      if (response.success && response.data) {
        setMembers(response.data);
        return response.data;
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch team members';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch pending invites
  const fetchInvites = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<TeamInvite[]>('/team/invites');
      if (response.success && response.data) {
        setInvites(response.data);
        return response.data;
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch invitations';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send invitation
  const sendInvite = useCallback(async (data: InviteInput): Promise<TeamInvite | null> => {
    setError(null);
    try {
      const response = await api.post<TeamInvite>('/team/invite', data);
      if (response.success && response.data) {
        // Refresh invites list
        await fetchInvites();
        return response.data;
      }
      return null;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to send invitation';
      setError(message);
      throw err;
    }
  }, [fetchInvites]);

  // Resend invitation
  const resendInvite = useCallback(async (inviteId: string): Promise<boolean> => {
    setError(null);
    try {
      const response = await api.post<{ message: string }>(`/team/invite/${inviteId}/resend`);
      if (response.success) {
        await fetchInvites(); // Refresh to get new expiry
        return true;
      }
      return false;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to resend invitation';
      setError(message);
      throw err;
    }
  }, [fetchInvites]);

  // Cancel invitation
  const cancelInvite = useCallback(async (inviteId: string): Promise<boolean> => {
    setError(null);
    try {
      const response = await api.delete<{ message: string }>(`/team/invites/${inviteId}`);
      if (response.success) {
        setInvites(prev => prev.filter(i => i.id !== inviteId));
        return true;
      }
      return false;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to cancel invitation';
      setError(message);
      throw err;
    }
  }, []);

  // Change member role
  const changeRole = useCallback(async (userId: string, role: 'admin' | 'manager' | 'staff'): Promise<TeamMember | null> => {
    setError(null);
    try {
      const response = await api.patch<TeamMember>(`/team/${userId}/role`, { role });
      if (response.success && response.data) {
        setMembers(prev => prev.map(m =>
          m.id === userId ? { ...m, role } : m
        ));
        return response.data;
      }
      return null;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to change role';
      setError(message);
      throw err;
    }
  }, []);

  // Remove member
  const removeMember = useCallback(async (userId: string): Promise<boolean> => {
    setError(null);
    try {
      const response = await api.delete<{ message: string }>(`/team/${userId}`);
      if (response.success) {
        setMembers(prev => prev.filter(m => m.id !== userId));
        return true;
      }
      return false;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to remove team member';
      setError(message);
      throw err;
    }
  }, []);

  // Reactivate member
  const reactivateMember = useCallback(async (userId: string): Promise<TeamMember | null> => {
    setError(null);
    try {
      const response = await api.post<TeamMember>(`/team/${userId}/reactivate`);
      if (response.success && response.data) {
        await fetchMembers(); // Refresh the list
        return response.data;
      }
      return null;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to reactivate member';
      setError(message);
      throw err;
    }
  }, [fetchMembers]);

  return {
    members,
    invites,
    isLoading,
    error,
    fetchMembers,
    fetchInvites,
    sendInvite,
    resendInvite,
    cancelInvite,
    changeRole,
    removeMember,
    reactivateMember,
    setError,
  };
}
