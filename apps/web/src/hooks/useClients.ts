'use client';

import { useState, useCallback, useEffect } from 'react';
import { api, ApiError } from '@/lib/api';

// Types based on Prisma schema
export interface Client {
  id: string;
  salonId: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  birthday?: string | null;
  notes?: string | null;
  preferredStaffId?: string | null;
  communicationPreference: string;
  optedInReminders: boolean;
  optedInMarketing: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Computed fields from API (optional)
  lastVisit?: string | null;
  totalSpent?: number | null;
  visitCount?: number | null;
}

export interface CreateClientInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  birthday?: string;
  notes?: string;
  preferredStaffId?: string;
  communicationPreference?: string;
  optedInReminders?: boolean;
  optedInMarketing?: boolean;
}

export interface UpdateClientInput extends Partial<CreateClientInput> {
  isActive?: boolean;
}

interface UseClientsReturn {
  clients: Client[];
  isLoading: boolean;
  error: string | null;
  fetchClients: (search?: string) => Promise<void>;
  getClient: (id: string) => Promise<Client | null>;
  createClient: (data: CreateClientInput) => Promise<Client>;
  updateClient: (id: string, data: UpdateClientInput) => Promise<Client>;
  deleteClient: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useClients(): UseClientsReturn {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async (search?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const endpoint = search ? `/clients?search=${encodeURIComponent(search)}` : '/clients';
      const response = await api.get<{ items: Client[]; total: number } | Client[]>(endpoint);

      if (response.success && response.data) {
        // Handle both paginated response { items: [...] } and direct array response
        if (Array.isArray(response.data)) {
          setClients(response.data);
        } else if (response.data.items && Array.isArray(response.data.items)) {
          setClients(response.data.items);
        } else {
          setClients([]);
        }
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch clients';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getClient = useCallback(async (id: string): Promise<Client | null> => {
    try {
      const response = await api.get<Client>(`/clients/${id}`);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch client';
      setError(message);
      return null;
    }
  }, []);

  const createClient = useCallback(async (data: CreateClientInput): Promise<Client> => {
    setError(null);

    try {
      const response = await api.post<Client>('/clients', data);

      if (response.success && response.data) {
        setClients((prev) => [...prev, response.data!]);
        return response.data;
      }

      throw new ApiError('CREATE_FAILED', 'Failed to create client');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create client';
      setError(message);
      throw err;
    }
  }, []);

  const updateClient = useCallback(async (id: string, data: UpdateClientInput): Promise<Client> => {
    setError(null);

    try {
      const response = await api.patch<Client>(`/clients/${id}`, data);

      if (response.success && response.data) {
        setClients((prev) =>
          prev.map((client) => (client.id === id ? response.data! : client))
        );
        return response.data;
      }

      throw new ApiError('UPDATE_FAILED', 'Failed to update client');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update client';
      setError(message);
      throw err;
    }
  }, []);

  const deleteClient = useCallback(async (id: string): Promise<void> => {
    setError(null);

    try {
      const response = await api.delete(`/clients/${id}`);

      if (response.success) {
        setClients((prev) => prev.filter((client) => client.id !== id));
      } else {
        throw new ApiError('DELETE_FAILED', 'Failed to delete client');
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete client';
      setError(message);
      throw err;
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchClients();
  }, [fetchClients]);

  // Fetch clients on mount
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    isLoading,
    error,
    fetchClients,
    getClient,
    createClient,
    updateClient,
    deleteClient,
    refetch,
  };
}
