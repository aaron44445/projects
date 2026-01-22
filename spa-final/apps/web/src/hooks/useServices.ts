'use client';

import { useState, useCallback, useEffect } from 'react';
import { api, ApiError } from '@/lib/api';

// Types based on Prisma schema
export interface ServiceCategory {
  id: string;
  salonId: string;
  name: string;
  description?: string | null;
  displayOrder: number;
  createdAt: string;
  services?: Service[];
}

export interface Service {
  id: string;
  salonId: string;
  categoryId?: string | null;
  name: string;
  description?: string | null;
  durationMinutes: number;
  bufferMinutes: number;
  price: number;
  memberPrice?: number | null;
  color: string;
  isActive: boolean;
  onlineBookingEnabled: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  category?: ServiceCategory | null;
}

export interface CreateServiceInput {
  categoryId?: string;
  name: string;
  description?: string;
  durationMinutes?: number;
  bufferMinutes?: number;
  price: number;
  memberPrice?: number;
  color?: string;
  displayOrder?: number;
}

export interface UpdateServiceInput extends Partial<CreateServiceInput> {
  isActive?: boolean;
  onlineBookingEnabled?: boolean;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  displayOrder?: number;
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> {}

interface UseServicesReturn {
  services: Service[];
  categories: ServiceCategory[];
  isLoading: boolean;
  error: string | null;
  fetchServices: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  getService: (id: string) => Promise<Service | null>;
  createService: (data: CreateServiceInput) => Promise<Service>;
  updateService: (id: string, data: UpdateServiceInput) => Promise<Service>;
  deleteService: (id: string) => Promise<void>;
  createCategory: (data: CreateCategoryInput) => Promise<ServiceCategory>;
  updateCategory: (id: string, data: UpdateCategoryInput) => Promise<ServiceCategory>;
  deleteCategory: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useServices(): UseServicesReturn {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<Service[]>('/services');

      if (response.success && response.data) {
        // Ensure data is an array to prevent .filter() errors
        setServices(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch services';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<ServiceCategory[]>('/services/categories');

      if (response.success && response.data) {
        // Ensure data is an array to prevent .filter() errors
        setCategories(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch categories';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getService = useCallback(async (id: string): Promise<Service | null> => {
    try {
      const response = await api.get<Service>(`/services/${id}`);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch service';
      setError(message);
      return null;
    }
  }, []);

  const createService = useCallback(async (data: CreateServiceInput): Promise<Service> => {
    setError(null);

    try {
      const response = await api.post<Service>('/services', data);

      if (response.success && response.data) {
        setServices((prev) => [...prev, response.data!]);
        return response.data;
      }

      throw new ApiError('CREATE_FAILED', 'Failed to create service');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create service';
      setError(message);
      throw err;
    }
  }, []);

  const updateService = useCallback(async (id: string, data: UpdateServiceInput): Promise<Service> => {
    setError(null);

    try {
      const response = await api.patch<Service>(`/services/${id}`, data);

      if (response.success && response.data) {
        setServices((prev) =>
          prev.map((service) => (service.id === id ? response.data! : service))
        );
        return response.data;
      }

      throw new ApiError('UPDATE_FAILED', 'Failed to update service');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update service';
      setError(message);
      throw err;
    }
  }, []);

  const deleteService = useCallback(async (id: string): Promise<void> => {
    setError(null);

    try {
      const response = await api.delete(`/services/${id}`);

      if (response.success) {
        setServices((prev) => prev.filter((service) => service.id !== id));
      } else {
        throw new ApiError('DELETE_FAILED', 'Failed to delete service');
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete service';
      setError(message);
      throw err;
    }
  }, []);

  const createCategory = useCallback(async (data: CreateCategoryInput): Promise<ServiceCategory> => {
    setError(null);

    try {
      const response = await api.post<ServiceCategory>('/services/categories', data);

      if (response.success && response.data) {
        setCategories((prev) => [...prev, response.data!]);
        return response.data;
      }

      throw new ApiError('CREATE_FAILED', 'Failed to create category');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create category';
      setError(message);
      throw err;
    }
  }, []);

  const updateCategory = useCallback(async (id: string, data: UpdateCategoryInput): Promise<ServiceCategory> => {
    setError(null);

    try {
      const response = await api.patch<ServiceCategory>(`/services/categories/${id}`, data);

      if (response.success && response.data) {
        setCategories((prev) =>
          prev.map((category) => (category.id === id ? response.data! : category))
        );
        return response.data;
      }

      throw new ApiError('UPDATE_FAILED', 'Failed to update category');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update category';
      setError(message);
      throw err;
    }
  }, []);

  const deleteCategory = useCallback(async (id: string): Promise<void> => {
    setError(null);

    try {
      const response = await api.delete(`/services/categories/${id}`);

      if (response.success) {
        setCategories((prev) => prev.filter((category) => category.id !== id));
      } else {
        throw new ApiError('DELETE_FAILED', 'Failed to delete category');
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete category';
      setError(message);
      throw err;
    }
  }, []);

  const refetch = useCallback(async () => {
    await Promise.all([fetchServices(), fetchCategories()]);
  }, [fetchServices, fetchCategories]);

  // Fetch services and categories on mount
  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, [fetchServices, fetchCategories]);

  return {
    services,
    categories,
    isLoading,
    error,
    fetchServices,
    fetchCategories,
    getService,
    createService,
    updateService,
    deleteService,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch,
  };
}
