/**
 * Clients API
 * Handles all client-related API calls
 */

import apiClient from './client'

export interface ClientSearchResult {
  id: string
  firstName: string
  lastName: string
  phone: string
  email?: string
  createdAt: string
  appointments?: Array<{
    startTime: string
  }>
}

export interface ClientProfile {
  id: string
  firstName: string
  lastName: string
  phone: string
  email?: string
  address?: string
  birthday?: string
  notes?: string
  preferredStaffId?: string
  preferredServiceId?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  preferredStaff?: {
    id: string
    firstName: string
    lastName: string
  }
  preferredService?: {
    id: string
    name: string
  }
}

export interface ClientHistoryResponse {
  appointments: Array<{
    id: string
    startTime: string
    endTime: string
    status: string
    durationMinutes: number
    price: string
    priceOverride?: string
    notes?: string
    service: {
      id: string
      name: string
    }
    staff: {
      id: string
      firstName: string
      lastName: string
    }
  }>
  notes: Array<{
    id: string
    content: string
    createdAt: string
    staff: {
      id: string
      firstName: string
      lastName: string
    }
  }>
}

/**
 * Search clients by query
 */
export async function searchClients(
  query: string = '',
  limit: number = 20
): Promise<ClientSearchResult[]> {
  try {
    const response = await apiClient.get('/clients', {
      params: {
        q: query,
        limit,
      },
    })
    return response.data.data
  } catch (error) {
    throw error
  }
}

/**
 * Get client profile
 */
export async function getClientProfile(clientId: string): Promise<ClientProfile> {
  try {
    const response = await apiClient.get(`/clients/${clientId}`)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Create a new client
 */
export async function createClient(data: {
  firstName: string
  lastName: string
  phone: string
  email?: string
  address?: string
  birthday?: string
  notes?: string
  preferredStaffId?: string
  preferredServiceId?: string
}): Promise<ClientProfile> {
  try {
    const response = await apiClient.post('/clients', data)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Update client information
 */
export async function updateClient(
  clientId: string,
  data: {
    firstName?: string
    lastName?: string
    phone?: string
    email?: string
    address?: string
    birthday?: string
    notes?: string
    preferredStaffId?: string
    preferredServiceId?: string
    isActive?: boolean
  }
): Promise<ClientProfile> {
  try {
    const response = await apiClient.put(`/clients/${clientId}`, data)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Add a note to a client
 */
export async function addClientNote(
  clientId: string,
  content: string
): Promise<{
  id: string
  clientId: string
  content: string
  createdAt: string
  staff: {
    id: string
    firstName: string
    lastName: string
  }
}> {
  try {
    const response = await apiClient.post(`/clients/${clientId}/notes`, {
      content,
    })
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Get client history (appointments and notes)
 */
export async function getClientHistory(clientId: string): Promise<ClientHistoryResponse> {
  try {
    const response = await apiClient.get(`/clients/${clientId}/history`)
    return response.data
  } catch (error) {
    throw error
  }
}
