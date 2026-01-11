/**
 * Client Routes
 * Handles client search, profile management, and history
 */

import { Router, Request, Response } from 'express'
import { authenticate, AuthenticatedRequest } from '../middleware/auth'
import * as clientService from '../services/client.service'

const router = Router()

/**
 * GET /api/v1/clients
 * Search clients by query param
 */
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' })
      return
    }

    const { q, limit } = req.query
    const query = typeof q === 'string' ? q : ''
    const limitNum = typeof limit === 'string' ? parseInt(limit) : 20

    const results = await clientService.searchClients(req.user.salonId, query, limitNum)

    res.json({
      data: results,
      count: results.length,
    })
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

/**
 * GET /api/v1/clients/:id
 * Get client profile with details
 */
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' })
      return
    }

    const client = await clientService.getClientProfile(req.params.id)

    res.json(client)
  } catch (error: any) {
    if (error.message === 'Client not found') {
      res.status(404).json({ error: error.message })
    } else {
      res.status(400).json({ error: error.message })
    }
  }
})

/**
 * POST /api/v1/clients
 * Create a new client
 */
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' })
      return
    }

    const { firstName, lastName, phone, email, address, birthday, notes, preferredStaffId, preferredServiceId } = req.body

    // Validate required fields
    if (!firstName || !lastName || !phone) {
      res.status(400).json({
        error: 'Missing required fields: firstName, lastName, phone',
      })
      return
    }

    const client = await clientService.createClient(req.user.salonId, {
      firstName,
      lastName,
      phone,
      email,
      address,
      birthday: birthday ? new Date(birthday) : undefined,
      notes,
      preferredStaffId,
      preferredServiceId,
    })

    res.status(201).json(client)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

/**
 * PUT /api/v1/clients/:id
 * Update client information
 */
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' })
      return
    }

    const { firstName, lastName, phone, email, address, birthday, notes, preferredStaffId, preferredServiceId, isActive } = req.body

    const client = await clientService.updateClient(req.params.id, {
      firstName,
      lastName,
      phone,
      email,
      address,
      birthday: birthday ? new Date(birthday) : undefined,
      notes,
      preferredStaffId,
      preferredServiceId,
      isActive,
    })

    res.json(client)
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Client not found' })
    } else {
      res.status(400).json({ error: error.message })
    }
  }
})

/**
 * POST /api/v1/clients/:id/notes
 * Add a note to a client
 */
router.post('/:id/notes', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' })
      return
    }

    const { content } = req.body

    if (!content) {
      res.status(400).json({
        error: 'Missing required field: content',
      })
      return
    }

    const note = await clientService.addClientNote(req.params.id, req.user.userId, content)

    res.status(201).json(note)
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Client or staff not found' })
    } else {
      res.status(400).json({ error: error.message })
    }
  }
})

/**
 * GET /api/v1/clients/:id/history
 * Get client appointment history and notes
 */
router.get('/:id/history', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' })
      return
    }

    const history = await clientService.getClientHistory(req.params.id)

    res.json(history)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

export default router
