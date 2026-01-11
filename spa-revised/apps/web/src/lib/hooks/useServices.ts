/**
 * useServices Hook
 * Custom React hook for managing services via the API
 */

import { useState, useCallback } from 'react'
import { apiClient } from '../api/client'

export interface Service {
  id: string
  salonId: string
  name: string
  description?: string
  durationMinutes: number
  price: number
  category?: string
  color: string
  bufferTimeMinutes?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateServiceInput {
  name: string
  description?: string
  durationMinutes: 30 | 60 | 90 | 120
  price: number
  category?: string
  color: string
  bufferTimeMinutes?: number
}

export interface UpdateServiceInput extends Partial<CreateServiceInput> {}

interface UseServicesState {
  services: Service[]
  loading: boolean
  error: string | null
}

export function useServices() {
  const [state, setState] = useState<UseServicesState>({
    services: [],
    loading: false,
    error: null,
  })

  /**
   * Fetch all services for the current salon
   */
  const fetchServices = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const response = await apiClient.get('/services')
      setState((prev) => ({
        ...prev,
        services: response.data as Service[],
        loading: false,
      }))
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error?.response?.data?.error || 'Failed to fetch services',
        loading: false,
      }))
    }
  }, [])

  /**
   * Create a new service
   */
  const createService = useCallback(async (data: CreateServiceInput) => {
    try {
      const response = await apiClient.post('/services', data)
      const newService = response.data as Service
      setState((prev) => ({
        ...prev,
        services: [newService, ...prev.services],
      }))
      return newService
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to create service'
      setState((prev) => ({ ...prev, error: errorMessage }))
      throw new Error(errorMessage)
    }
  }, [])

  /**
   * Update an existing service
   */
  const updateService = useCallback(async (id: string, data: UpdateServiceInput) => {
    try {
      const response = await apiClient.put(`/services/${id}`, data)
      const updatedService = response.data as Service
      setState((prev) => ({
        ...prev,
        services: prev.services.map((s) => (s.id === id ? updatedService : s)),
      }))
      return updatedService
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to update service'
      setState((prev) => ({ ...prev, error: errorMessage }))
      throw new Error(errorMessage)
    }
  }, [])

  /**
   * Delete a service (soft delete)
   */
  const deleteService = useCallback(async (id: string) => {
    try {
      await apiClient.delete(`/services/${id}`)
      setState((prev) => ({
        ...prev,
        services: prev.services.filter((s) => s.id !== id),
      }))
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to delete service'
      setState((prev) => ({ ...prev, error: errorMessage }))
      throw new Error(errorMessage)
    }
  }, [])

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  return {
    services: state.services,
    loading: state.loading,
    error: state.error,
    fetchServices,
    createService,
    updateService,
    deleteService,
    clearError,
  }
}
