'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface Package {
  id: string;
  name: string;
  description: string | null;
  price: number;
  type: string;
  durationDays: number | null;
  renewalPrice: number | null;
  isActive: boolean;
  packageServices: Array<{ id: string; quantity: number; service: { id: string; name: string; price: number } }>;
}

export interface PackageMember {
  id: string;
  purchaseDate: string;
  expirationDate: string | null;
  servicesRemaining: number;
  totalServices: number;
  isActive: boolean;
  client: { id: string; firstName: string; lastName: string; email: string | null; phone: string | null };
  package: { name: string; type: string; price: number };
}

export function usePackages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [members, setMembers] = useState<PackageMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Package[]>('/packages');
      if (response.data) setPackages(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch packages');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      const response = await api.get<PackageMember[]>('/packages/members');
      if (response.data) setMembers(response.data);
    } catch (err) {
      console.error('Failed to fetch members:', err);
    }
  }, []);

  useEffect(() => {
    fetchPackages();
    fetchMembers();
  }, [fetchPackages, fetchMembers]);

  const createPackage = async (data: { name: string; description?: string; price: number; type?: string; durationDays?: number; renewalPrice?: number; serviceIds?: string[] }) => {
    const response = await api.post<Package>('/packages', data);
    if (response.data) setPackages(prev => [...prev, response.data!]);
    return response.data;
  };

  const purchasePackage = async (packageId: string, clientId: string) => {
    const response = await api.post<PackageMember>(`/packages/${packageId}/purchase`, { clientId });
    if (response.data) setMembers(prev => [response.data!, ...prev]);
    return response.data;
  };

  const getCheckoutUrl = async (packageId: string, clientId: string) => {
    const response = await api.post<{ checkoutUrl: string; sessionId: string }>(`/packages/${packageId}/checkout`, { clientId });
    return response.data;
  };

  const updatePackage = async (id: string, data: Partial<{ name: string; description?: string; price: number; type?: string; durationDays?: number; renewalPrice?: number; isActive?: boolean }>) => {
    const response = await api.patch<Package>(`/packages/${id}`, data);
    if (response.data) {
      setPackages(prev => prev.map(p => p.id === id ? response.data! : p));
    }
    return response.data;
  };

  const deletePackage = async (id: string) => {
    await api.delete(`/packages/${id}`);
    setPackages(prev => prev.filter(p => p.id !== id));
  };

  const updateMember = async (memberId: string, data: { isActive?: boolean }) => {
    const response = await api.patch<PackageMember>(`/packages/members/${memberId}`, data);
    if (response.data) {
      setMembers(prev => prev.map(m => m.id === memberId ? response.data! : m));
    }
    return response.data;
  };

  const cancelMembership = async (memberId: string) => {
    const response = await api.delete<PackageMember>(`/packages/members/${memberId}`);
    setMembers(prev => prev.filter(m => m.id !== memberId));
    return response.data;
  };

  return { packages, members, loading, error, fetchPackages, fetchMembers, createPackage, updatePackage, purchasePackage, getCheckoutUrl, deletePackage, updateMember, cancelMembership };
}
