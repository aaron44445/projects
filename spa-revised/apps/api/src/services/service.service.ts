/**
 * Service Service
 * Handles all service-related business logic
 */

import { prisma } from '@pecase/database'
import { Service, ServiceData, CreateServiceInput, UpdateServiceInput } from '../types/service.types'
import { Decimal } from '@prisma/client/runtime/library'

const VALID_DURATIONS = [30, 60, 90, 120] as const

/**
 * Validate duration is one of allowed values (30-minute grid)
 */
function validateDuration(duration: number): boolean {
  return VALID_DURATIONS.includes(duration as any)
}

/**
 * Create a new service for a salon
 */
export async function createService(
  salonId: string,
  data: ServiceData
): Promise<Service> {
  try {
    // Validate duration
    if (!validateDuration(data.durationMinutes)) {
      throw new Error(`Duration must be one of: ${VALID_DURATIONS.join(', ')} minutes`)
    }

    // Validate price is positive
    if (data.price <= 0) {
      throw new Error('Price must be greater than 0')
    }

    // Validate buffer time if provided
    if (data.bufferTimeMinutes && data.bufferTimeMinutes < 0) {
      throw new Error('Buffer time cannot be negative')
    }

    const service = await prisma.service.create({
      data: {
        salonId,
        name: data.name,
        description: data.description,
        durationMinutes: data.durationMinutes,
        price: new Decimal(data.price),
        category: data.category,
        color: data.color || '#C7DCC8',
        isActive: true,
      },
    })

    return mapServiceToResponse(service)
  } catch (error) {
    throw error
  }
}

/**
 * Get all active services for a salon
 */
export async function getServices(salonId: string): Promise<Service[]> {
  try {
    const services = await prisma.service.findMany({
      where: {
        salonId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return services.map(mapServiceToResponse)
  } catch (error) {
    throw error
  }
}

/**
 * Get a specific service by ID
 */
export async function getServiceById(id: string, salonId: string): Promise<Service | null> {
  try {
    const service = await prisma.service.findFirst({
      where: {
        id,
        salonId,
        isActive: true,
      },
    })

    return service ? mapServiceToResponse(service) : null
  } catch (error) {
    throw error
  }
}

/**
 * Update service details
 */
export async function updateService(
  id: string,
  salonId: string,
  data: UpdateServiceInput
): Promise<Service> {
  try {
    // Verify service exists and belongs to salon
    const existingService = await prisma.service.findFirst({
      where: {
        id,
        salonId,
      },
    })

    if (!existingService) {
      throw new Error('Service not found')
    }

    // Validate duration if provided
    if (data.durationMinutes !== undefined && !validateDuration(data.durationMinutes)) {
      throw new Error(`Duration must be one of: ${VALID_DURATIONS.join(', ')} minutes`)
    }

    // Validate price if provided
    if (data.price !== undefined && data.price <= 0) {
      throw new Error('Price must be greater than 0')
    }

    // Validate buffer time if provided
    if (data.bufferTimeMinutes !== undefined && data.bufferTimeMinutes < 0) {
      throw new Error('Buffer time cannot be negative')
    }

    const updateData: any = {
      name: data.name,
      description: data.description,
      durationMinutes: data.durationMinutes,
      category: data.category,
      color: data.color,
    }

    // Only include defined fields
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    )

    // Handle price conversion
    if (data.price !== undefined) {
      updateData.price = new Decimal(data.price)
    }

    const updatedService = await prisma.service.update({
      where: { id },
      data: updateData,
    })

    return mapServiceToResponse(updatedService)
  } catch (error) {
    throw error
  }
}

/**
 * Soft delete a service (set isActive to false)
 */
export async function deleteService(id: string, salonId: string): Promise<void> {
  try {
    // Verify service exists and belongs to salon
    const existingService = await prisma.service.findFirst({
      where: {
        id,
        salonId,
      },
    })

    if (!existingService) {
      throw new Error('Service not found')
    }

    await prisma.service.update({
      where: { id },
      data: { isActive: false },
    })
  } catch (error) {
    throw error
  }
}

/**
 * Helper function to map Prisma service to Service type
 */
function mapServiceToResponse(service: any): Service {
  return {
    id: service.id,
    salonId: service.salonId,
    name: service.name,
    description: service.description || undefined,
    durationMinutes: service.durationMinutes as 30 | 60 | 90 | 120,
    price: typeof service.price === 'object' ? service.price.toNumber() : service.price,
    category: service.category || undefined,
    color: service.color,
    isActive: service.isActive,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  }
}
