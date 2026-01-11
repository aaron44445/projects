/**
 * Service Routes
 * REST API endpoints for service management
 */

import { Router, Response } from 'express'
import { AuthenticatedRequest, authenticate } from '../middleware/auth'
import { requireManager } from '../middleware/authorize'
import * as serviceService from '../services/service.service'
import { ServiceData, ServiceResponse } from '../types/service.types'

const router = Router()

// All service routes require authentication
router.use(authenticate)

/**
 * GET /api/v1/services
 * List all active services for the authenticated user's salon
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' })
      return
    }

    const services = await serviceService.getServices(req.user.salonId)

    const response: ServiceResponse[] = services.map((service) => ({
      id: service.id,
      salonId: service.salonId,
      name: service.name,
      description: service.description,
      durationMinutes: service.durationMinutes,
      price: service.price,
      category: service.category,
      color: service.color,
      bufferTimeMinutes: service.bufferTimeMinutes,
      isActive: service.isActive,
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
    }))

    res.json(response)
  } catch (error: any) {
    console.error('Error fetching services:', error)
    res.status(500).json({ error: error.message || 'Failed to fetch services' })
  }
})

/**
 * POST /api/v1/services
 * Create a new service (admin/manager only)
 */
router.post(
  '/',
  requireManager,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' })
        return
      }

      const { name, description, durationMinutes, price, category, color, bufferTimeMinutes } =
        req.body

      // Validate required fields
      if (!name) {
        res.status(400).json({ error: 'Service name is required' })
        return
      }

      if (durationMinutes === undefined) {
        res.status(400).json({ error: 'Duration is required' })
        return
      }

      if (price === undefined) {
        res.status(400).json({ error: 'Price is required' })
        return
      }

      if (!color) {
        res.status(400).json({ error: 'Color is required' })
        return
      }

      const serviceData: ServiceData = {
        name,
        description,
        durationMinutes,
        price: parseFloat(price),
        category,
        color,
        bufferTimeMinutes: bufferTimeMinutes || 15,
      }

      const service = await serviceService.createService(req.user.salonId, serviceData)

      const response: ServiceResponse = {
        id: service.id,
        salonId: service.salonId,
        name: service.name,
        description: service.description,
        durationMinutes: service.durationMinutes,
        price: service.price,
        category: service.category,
        color: service.color,
        bufferTimeMinutes: service.bufferTimeMinutes,
        isActive: service.isActive,
        createdAt: service.createdAt.toISOString(),
        updatedAt: service.updatedAt.toISOString(),
      }

      res.status(201).json(response)
    } catch (error: any) {
      console.error('Error creating service:', error)
      res.status(400).json({ error: error.message || 'Failed to create service' })
    }
  }
)

/**
 * PUT /api/v1/services/:id
 * Update a service (admin/manager only)
 */
router.put(
  '/:id',
  requireManager,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' })
        return
      }

      const { id } = req.params
      const { name, description, durationMinutes, price, category, color, bufferTimeMinutes } =
        req.body

      const updateData: any = {}

      if (name !== undefined) updateData.name = name
      if (description !== undefined) updateData.description = description
      if (durationMinutes !== undefined) updateData.durationMinutes = durationMinutes
      if (price !== undefined) updateData.price = parseFloat(price)
      if (category !== undefined) updateData.category = category
      if (color !== undefined) updateData.color = color
      if (bufferTimeMinutes !== undefined) updateData.bufferTimeMinutes = bufferTimeMinutes

      const service = await serviceService.updateService(id, req.user.salonId, updateData)

      const response: ServiceResponse = {
        id: service.id,
        salonId: service.salonId,
        name: service.name,
        description: service.description,
        durationMinutes: service.durationMinutes,
        price: service.price,
        category: service.category,
        color: service.color,
        bufferTimeMinutes: service.bufferTimeMinutes,
        isActive: service.isActive,
        createdAt: service.createdAt.toISOString(),
        updatedAt: service.updatedAt.toISOString(),
      }

      res.json(response)
    } catch (error: any) {
      console.error('Error updating service:', error)
      if (error.message === 'Service not found') {
        res.status(404).json({ error: 'Service not found' })
      } else {
        res.status(400).json({ error: error.message || 'Failed to update service' })
      }
    }
  }
)

/**
 * DELETE /api/v1/services/:id
 * Soft delete a service (admin/manager only)
 */
router.delete(
  '/:id',
  requireManager,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' })
        return
      }

      const { id } = req.params
      await serviceService.deleteService(id, req.user.salonId)

      res.json({ success: true, message: 'Service deleted successfully' })
    } catch (error: any) {
      console.error('Error deleting service:', error)
      if (error.message === 'Service not found') {
        res.status(404).json({ error: 'Service not found' })
      } else {
        res.status(400).json({ error: error.message || 'Failed to delete service' })
      }
    }
  }
)

export default router
