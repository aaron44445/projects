/**
 * Service Types and Interfaces
 * Defines TypeScript interfaces for service operations
 */

export interface ServiceData {
  name: string
  description?: string
  durationMinutes: 30 | 60 | 90 | 120
  price: number
  category?: string
  color: string
  bufferTimeMinutes?: number
}

export interface Service extends ServiceData {
  id: string
  salonId: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateServiceInput extends ServiceData {
  salonId: string
}

export interface UpdateServiceInput extends Partial<ServiceData> {}

export interface ServiceResponse {
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
