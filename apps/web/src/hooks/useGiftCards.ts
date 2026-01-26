'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface GiftCard {
  id: string;
  code: string;
  initialAmount: number;
  balance: number;
  status: string;
  expiresAt: string | null;
  purchasedAt: string;
  redeemedAt: string | null;
  purchaserEmail: string | null;
  recipientEmail: string | null;
  recipientName: string | null;
  message: string | null;
}

export function useGiftCards() {
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGiftCards = useCallback(async (status?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = status ? `?status=${status}` : '';
      const response = await api.get<GiftCard[]>(`/gift-cards${params}`);
      if (response.data) setGiftCards(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch gift cards');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGiftCards();
  }, [fetchGiftCards]);

  const createGiftCard = async (data: { amount: number; purchaserEmail?: string; recipientEmail?: string; recipientName?: string; message?: string; expiresAt?: string }) => {
    const response = await api.post<GiftCard>('/gift-cards', data);
    if (response.data) setGiftCards(prev => [response.data!, ...prev]);
    return response.data;
  };

  const checkBalance = async (code: string) => {
    const response = await api.get<{ balance: number; expiresAt: string | null }>(`/gift-cards/${code}/balance`);
    return response.data;
  };

  const redeemGiftCard = async (code: string, amount: number) => {
    const response = await api.post<GiftCard>(`/gift-cards/${code}/redeem`, { amount });
    if (response.data) setGiftCards(prev => prev.map(g => g.code === code ? response.data! : g));
    return response.data;
  };

  return { giftCards, loading, error, fetchGiftCards, createGiftCard, checkBalance, redeemGiftCard };
}
