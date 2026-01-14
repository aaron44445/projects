'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  isApproved: boolean;
  submittedAt: string;
  client: { firstName: string; lastName: string };
  appointment: { service: { name: string } };
  responses: Array<{
    id: string;
    responseText: string;
    respondedAt: string;
    respondedBy: { firstName: string; lastName: string };
  }>;
}

export function useReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  const fetchReviews = useCallback(async (status?: string, page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (status) params.set('status', status);
      const response = await api.get<{ items: Review[]; total: number; page: number; totalPages: number }>(`/reviews?${params}`);
      if (response.data) {
        setReviews(response.data.items);
        setPagination({ total: response.data.total, page: response.data.page, totalPages: response.data.totalPages });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const respondToReview = async (id: string, responseText: string) => {
    const response = await api.post<Review['responses'][0]>(`/reviews/${id}/respond`, { responseText });
    if (response.data) setReviews(prev => prev.map(r => r.id === id ? { ...r, responses: [...r.responses, response.data!] } : r));
    return response.data;
  };

  const approveReview = async (id: string) => {
    const response = await api.patch<Review>(`/reviews/${id}/approve`, {});
    if (response.data) setReviews(prev => prev.map(r => r.id === id ? { ...r, isApproved: true } : r));
    return response.data;
  };

  return { reviews, loading, error, pagination, fetchReviews, respondToReview, approveReview };
}
