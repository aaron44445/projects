'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface Campaign {
  id: string;
  name: string;
  type: string;
  subjectLine: string | null;
  message: string;
  audienceFilter: string | null;
  status: string;
  scheduledFor: string | null;
  sentAt: string | null;
  recipientsCount: number | null;
  openedCount: number;
  clickedCount: number;
  createdAt: string;
}

export function useMarketing() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async (status?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = status ? `?status=${status}` : '';
      const response = await api.get<Campaign[]>(`/marketing/campaigns${params}`);
      if (response.data) setCampaigns(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const createCampaign = async (data: Partial<Campaign>) => {
    const response = await api.post<Campaign>('/marketing/campaigns', data);
    if (response.data) setCampaigns(prev => [response.data!, ...prev]);
    return response.data;
  };

  const updateCampaign = async (id: string, data: Partial<Campaign>) => {
    const response = await api.patch<Campaign>(`/marketing/campaigns/${id}`, data);
    if (response.data) setCampaigns(prev => prev.map(c => c.id === id ? response.data! : c));
    return response.data;
  };

  const sendCampaign = async (id: string) => {
    const response = await api.post<Campaign & { sent: number; failed: number }>(`/marketing/campaigns/${id}/send`);
    if (response.data) setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: 'sent', sentAt: new Date().toISOString() } : c));
    return response.data;
  };

  const deleteCampaign = async (id: string) => {
    await api.delete(`/marketing/campaigns/${id}`);
    setCampaigns(prev => prev.filter(c => c.id !== id));
  };

  return { campaigns, loading, error, fetchCampaigns, createCampaign, updateCampaign, sendCampaign, deleteCampaign };
}
