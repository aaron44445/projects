'use client';

import { useState, useCallback } from 'react';

export interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'automation';
  status: 'draft' | 'scheduled' | 'sent' | 'active';
  audience: 'all' | 'new' | 'inactive' | 'vip';
  subject?: string;
  content: string;
  scheduledAt?: string;
  sentAt?: string;
  recipients?: number;
  recipientsCount?: number;
  opened?: number;
  openedCount: number;
  clicked?: number;
  clickedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignInput {
  name: string;
  type: 'email' | 'sms' | 'automation';
  audience: 'all' | 'new' | 'inactive' | 'vip';
  subject?: string;
  content: string;
  scheduledAt?: string;
}

export interface UpdateCampaignInput extends Partial<CreateCampaignInput> {
  status?: Campaign['status'];
}

interface UseMarketingReturn {
  campaigns: Campaign[];
  loading: boolean;
  isLoading: boolean;
  error: string | null;
  fetchCampaigns: () => Promise<void>;
  createCampaign: (data: CreateCampaignInput) => Promise<Campaign>;
  updateCampaign: (id: string, data: UpdateCampaignInput) => Promise<Campaign>;
  deleteCampaign: (id: string) => Promise<void>;
  sendCampaign: (id: string) => Promise<void>;
}

export function useMarketing(): UseMarketingReturn {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Stub - marketing feature not yet implemented
      setCampaigns([]);
    } catch (err) {
      setError('Failed to fetch campaigns');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createCampaign = useCallback(async (data: CreateCampaignInput): Promise<Campaign> => {
    const newCampaign: Campaign = {
      id: `temp-${Date.now()}`,
      ...data,
      status: 'draft',
      openedCount: 0,
      clickedCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCampaigns((prev) => [...prev, newCampaign]);
    return newCampaign;
  }, []);

  const updateCampaign = useCallback(async (id: string, data: UpdateCampaignInput): Promise<Campaign> => {
    let updated: Campaign | undefined;
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          updated = { ...c, ...data, updatedAt: new Date().toISOString() };
          return updated;
        }
        return c;
      })
    );
    if (!updated) throw new Error('Campaign not found');
    return updated;
  }, []);

  const deleteCampaign = useCallback(async (id: string): Promise<void> => {
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const sendCampaign = useCallback(async (id: string): Promise<void> => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: 'sent' as const, sentAt: new Date().toISOString() }
          : c
      )
    );
  }, []);

  return {
    campaigns,
    loading: isLoading,
    isLoading,
    error,
    fetchCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    sendCampaign,
  };
}
