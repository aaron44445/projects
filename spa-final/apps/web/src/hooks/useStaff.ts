'use client';

import { useState, useCallback, useEffect } from 'react';
import { api, ApiError } from '@/lib/api';

// Role type matching backend
export type StaffRole = 'owner' | 'admin' | 'manager' | 'staff' | 'receptionist';

// Types based on Prisma schema
export interface StaffMember {
  id: string;
  salonId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: StaffRole;
  avatarUrl?: string | null;
  certifications?: string | null;
  commissionRate?: number | null;
  isActive: boolean;
  onlineBookingEnabled: boolean;
  lastLogin?: string | null;
  createdAt: string;
  updatedAt: string;
  // Populated relations
  staffServices?: StaffService[];
  staffAvailability?: StaffAvailability[];
  staffLocations?: Array<{
    location: { id: string; name: string };
    isPrimary: boolean;
  }>;
}

export interface StaffService {
  id: string;
  staffId: string;
  serviceId: string;
  isAvailable: boolean;
}

export interface StaffAvailability {
  id: string;
  staffId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface CreateStaffInput {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: StaffRole;
  certifications?: string;
  commissionRate?: number;
  locationIds?: string[];
}

export interface UpdateStaffInput extends Partial<CreateStaffInput> {
  isActive?: boolean;
  avatarUrl?: string;
  onlineBookingEnabled?: boolean;
}

export interface SetAvailabilityInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable?: boolean;
}

export interface SetStaffServicesInput {
  serviceIds: string[];
}

interface UseStaffReturn {
  staff: StaffMember[];
  isLoading: boolean;
  error: string | null;
  fetchStaff: () => Promise<void>;
  getStaffMember: (id: string) => Promise<StaffMember | null>;
  createStaff: (data: CreateStaffInput) => Promise<StaffMember>;
  updateStaff: (id: string, data: UpdateStaffInput) => Promise<StaffMember>;
  deleteStaff: (id: string) => Promise<void>;
  setAvailability: (staffId: string, availability: SetAvailabilityInput[]) => Promise<void>;
  setStaffServices: (staffId: string, data: SetStaffServicesInput) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useStaff(): UseStaffReturn {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<StaffMember[]>('/staff');

      if (response.success && response.data) {
        // Ensure data is an array to prevent .filter() errors
        setStaff(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch staff';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getStaffMember = useCallback(async (id: string): Promise<StaffMember | null> => {
    try {
      const response = await api.get<StaffMember>(`/staff/${id}`);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch staff member';
      setError(message);
      return null;
    }
  }, []);

  const createStaff = useCallback(async (data: CreateStaffInput): Promise<StaffMember> => {
    setError(null);

    try {
      const response = await api.post<StaffMember>('/staff', data);

      if (response.success && response.data) {
        setStaff((prev) => [...prev, response.data!]);
        return response.data;
      }

      throw new ApiError('CREATE_FAILED', 'Failed to create staff member');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create staff member';
      setError(message);
      throw err;
    }
  }, []);

  const updateStaff = useCallback(async (id: string, data: UpdateStaffInput): Promise<StaffMember> => {
    setError(null);

    try {
      const response = await api.patch<StaffMember>(`/staff/${id}`, data);

      if (response.success && response.data) {
        setStaff((prev) =>
          prev.map((member) => (member.id === id ? response.data! : member))
        );
        return response.data;
      }

      throw new ApiError('UPDATE_FAILED', 'Failed to update staff member');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update staff member';
      setError(message);
      throw err;
    }
  }, []);

  const deleteStaff = useCallback(async (id: string): Promise<void> => {
    setError(null);

    try {
      const response = await api.delete(`/staff/${id}`);

      if (response.success) {
        setStaff((prev) => prev.filter((member) => member.id !== id));
      } else {
        throw new ApiError('DELETE_FAILED', 'Failed to delete staff member');
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete staff member';
      setError(message);
      throw err;
    }
  }, []);

  const setAvailability = useCallback(async (staffId: string, availability: SetAvailabilityInput[]): Promise<void> => {
    setError(null);

    try {
      const response = await api.put(`/staff/${staffId}/availability`, { availability });

      if (!response.success) {
        throw new ApiError('SET_AVAILABILITY_FAILED', 'Failed to set staff availability');
      }

      // Refresh staff data to get updated availability
      await fetchStaff();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to set staff availability';
      setError(message);
      throw err;
    }
  }, [fetchStaff]);

  const setStaffServices = useCallback(async (staffId: string, data: SetStaffServicesInput): Promise<void> => {
    setError(null);

    try {
      const response = await api.put(`/staff/${staffId}/services`, data);

      if (!response.success) {
        throw new ApiError('SET_SERVICES_FAILED', 'Failed to set staff services');
      }

      // Refresh staff data to get updated services
      await fetchStaff();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to set staff services';
      setError(message);
      throw err;
    }
  }, [fetchStaff]);

  const refetch = useCallback(async () => {
    await fetchStaff();
  }, [fetchStaff]);

  // Fetch staff on mount
  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  return {
    staff,
    isLoading,
    error,
    fetchStaff,
    getStaffMember,
    createStaff,
    updateStaff,
    deleteStaff,
    setAvailability,
    setStaffServices,
    refetch,
  };
}
