'use client';

import { useState, useCallback, useEffect, createContext, useContext } from 'react';
import { api, ApiError } from '@/lib/api';

// Types based on Prisma schema
export interface Location {
  id: string;
  salonId: string;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  phone?: string | null;
  timezone?: string | null;
  hours?: string | null;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    staffLocations: number;
    serviceLocations: number;
    appointments: number;
  };
}

export interface StaffAtLocation {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role: string;
  avatarUrl?: string | null;
  isActive: boolean;
  isPrimaryLocation: boolean;
}

export interface ServiceAtLocation {
  id: string;
  name: string;
  description?: string | null;
  basePrice: number;
  baseDuration: number;
  effectivePrice: number;
  effectiveDuration: number;
  isEnabled: boolean;
  hasOverride: boolean;
  color: string;
}

export interface CreateLocationInput {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  timezone?: string;
  hours?: string;
  isPrimary?: boolean;
}

export interface UpdateLocationInput extends Partial<CreateLocationInput> {
  isActive?: boolean;
}

export interface ServiceLocationSettings {
  isEnabled?: boolean;
  priceOverride?: number | null;
  durationOverride?: number | null;
}

export interface LocationHours {
  id?: string;
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
}

interface UseLocationsReturn {
  locations: Location[];
  selectedLocationId: string | null;
  selectedLocation: Location | null;
  isLoading: boolean;
  error: string | null;
  fetchLocations: () => Promise<void>;
  getLocation: (id: string) => Promise<Location | null>;
  createLocation: (data: CreateLocationInput) => Promise<Location>;
  updateLocation: (id: string, data: UpdateLocationInput) => Promise<Location>;
  deleteLocation: (id: string) => Promise<void>;
  selectLocation: (id: string | null) => void;
  // Staff at location
  getStaffAtLocation: (locationId: string) => Promise<StaffAtLocation[]>;
  assignStaffToLocation: (locationId: string, staffId: string, isPrimary?: boolean) => Promise<void>;
  removeStaffFromLocation: (locationId: string, staffId: string) => Promise<void>;
  // Services at location
  getServicesAtLocation: (locationId: string) => Promise<ServiceAtLocation[]>;
  updateServiceAtLocation: (locationId: string, serviceId: string, settings: ServiceLocationSettings) => Promise<void>;
  resetServiceAtLocation: (locationId: string, serviceId: string) => Promise<void>;
  // Hours management
  getLocationHours: (locationId: string) => Promise<LocationHours[]>;
  updateLocationHours: (locationId: string, hours: LocationHours[]) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useLocations(): UseLocationsReturn {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedLocation = locations.find((l) => l.id === selectedLocationId) || null;

  const fetchLocations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<Location[]>('/locations');

      if (response.success && response.data) {
        const locationsData = Array.isArray(response.data) ? response.data : [];
        setLocations(locationsData);

        // Auto-select primary location if none selected
        if (!selectedLocationId && locationsData.length > 0) {
          const primary = locationsData.find((l) => l.isPrimary);
          if (primary) {
            setSelectedLocationId(primary.id);
          }
        }
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch locations';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedLocationId]);

  const getLocation = useCallback(async (id: string): Promise<Location | null> => {
    try {
      const response = await api.get<Location>(`/locations/${id}`);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch location';
      setError(message);
      return null;
    }
  }, []);

  const createLocation = useCallback(async (data: CreateLocationInput): Promise<Location> => {
    setError(null);

    try {
      const response = await api.post<Location>('/locations', data);

      if (response.success && response.data) {
        setLocations((prev) => [...prev, response.data!]);
        return response.data;
      }

      throw new ApiError('CREATE_FAILED', 'Failed to create location');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create location';
      setError(message);
      throw err;
    }
  }, []);

  const updateLocation = useCallback(async (id: string, data: UpdateLocationInput): Promise<Location> => {
    setError(null);

    try {
      const response = await api.patch<Location>(`/locations/${id}`, data);

      if (response.success && response.data) {
        setLocations((prev) =>
          prev.map((location) => (location.id === id ? response.data! : location))
        );
        return response.data;
      }

      throw new ApiError('UPDATE_FAILED', 'Failed to update location');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update location';
      setError(message);
      throw err;
    }
  }, []);

  const deleteLocation = useCallback(async (id: string): Promise<void> => {
    setError(null);

    try {
      const response = await api.delete(`/locations/${id}`);

      if (response.success) {
        setLocations((prev) => {
          const filtered = prev.filter((location) => location.id !== id);
          return filtered;
        });
        // Update selected location if we deleted the currently selected one
        if (selectedLocationId === id) {
          // Use setTimeout to ensure this runs after the setLocations update
          setTimeout(() => {
            setLocations((prev) => {
              setSelectedLocationId(prev[0]?.id || null);
              return prev;
            });
          }, 0);
        }
      } else {
        throw new ApiError('DELETE_FAILED', 'Failed to delete location');
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete location';
      setError(message);
      throw err;
    }
  }, [selectedLocationId]);

  const selectLocation = useCallback((id: string | null) => {
    setSelectedLocationId(id);
    // Persist to localStorage for page reloads
    if (typeof window !== 'undefined') {
      if (id) {
        localStorage.setItem('selectedLocationId', id);
      } else {
        localStorage.removeItem('selectedLocationId');
      }
    }
  }, []);

  // Staff management
  const getStaffAtLocation = useCallback(async (locationId: string): Promise<StaffAtLocation[]> => {
    try {
      const response = await api.get<StaffAtLocation[]>(`/locations/${locationId}/staff`);
      if (response.success && response.data) {
        return Array.isArray(response.data) ? response.data : [];
      }
      return [];
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch staff';
      setError(message);
      return [];
    }
  }, []);

  const assignStaffToLocation = useCallback(async (locationId: string, staffId: string, isPrimary = false): Promise<void> => {
    try {
      await api.post(`/locations/${locationId}/staff`, { staffId, isPrimary });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to assign staff';
      setError(message);
      throw err;
    }
  }, []);

  const removeStaffFromLocation = useCallback(async (locationId: string, staffId: string): Promise<void> => {
    try {
      await api.delete(`/locations/${locationId}/staff/${staffId}`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to remove staff';
      setError(message);
      throw err;
    }
  }, []);

  // Service management
  const getServicesAtLocation = useCallback(async (locationId: string): Promise<ServiceAtLocation[]> => {
    try {
      const response = await api.get<ServiceAtLocation[]>(`/locations/${locationId}/services`);
      if (response.success && response.data) {
        return Array.isArray(response.data) ? response.data : [];
      }
      return [];
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch services';
      setError(message);
      return [];
    }
  }, []);

  const updateServiceAtLocation = useCallback(async (locationId: string, serviceId: string, settings: ServiceLocationSettings): Promise<void> => {
    try {
      await api.put(`/locations/${locationId}/services/${serviceId}`, settings);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update service settings';
      setError(message);
      throw err;
    }
  }, []);

  const resetServiceAtLocation = useCallback(async (locationId: string, serviceId: string): Promise<void> => {
    try {
      await api.delete(`/locations/${locationId}/services/${serviceId}`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to reset service settings';
      setError(message);
      throw err;
    }
  }, []);

  // Hours management
  const getLocationHours = useCallback(async (locationId: string): Promise<LocationHours[]> => {
    try {
      const response = await api.get<LocationHours[]>(`/locations/${locationId}/hours`);
      if (response.success && response.data) {
        return Array.isArray(response.data) ? response.data : [];
      }
      return [];
    } catch (err) {
      console.error('Failed to fetch location hours:', err);
      return [];
    }
  }, []);

  const updateLocationHours = useCallback(async (locationId: string, hours: LocationHours[]): Promise<boolean> => {
    try {
      setIsLoading(true);
      await api.put(`/locations/${locationId}/hours`, { hours });
      return true;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update hours';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchLocations();
  }, [fetchLocations]);

  // Fetch locations on mount and restore selected location from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem('selectedLocationId');
      if (savedId) {
        setSelectedLocationId(savedId);
      }
    }
    fetchLocations();
  }, [fetchLocations]);

  return {
    locations,
    selectedLocationId,
    selectedLocation,
    isLoading,
    error,
    fetchLocations,
    getLocation,
    createLocation,
    updateLocation,
    deleteLocation,
    selectLocation,
    getStaffAtLocation,
    assignStaffToLocation,
    removeStaffFromLocation,
    getServicesAtLocation,
    updateServiceAtLocation,
    resetServiceAtLocation,
    getLocationHours,
    updateLocationHours,
    refetch,
  };
}

// Context for sharing location state across components
interface LocationContextType extends UseLocationsReturn {}

const LocationContext = createContext<LocationContextType | null>(null);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const locationsState = useLocations();
  return (
    <LocationContext.Provider value={locationsState}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
}
