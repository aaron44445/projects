/**
 * Authentication Routes
 * Handles user registration, login, logout, token refresh, and current user
 */

import { Router, Request, Response } from 'express'
import { authenticate, AuthenticatedRequest } from '../middleware/auth'
import * as authService from '../services/auth.service'

const router = Router()

/**
 * POST /auth/register
 * Register a new salon with admin user
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { salon_name, email, phone, password, firstName, lastName } = req.body

    // Validate required fields
    if (!salon_name || !email || !phone || !password) {
      res.status(400).json({
        error: 'Missing required fields: salon_name, email, phone, password',
      })
      return
    }

    const result = await authService.register({
      salon_name,
      email,
      phone,
      password,
      firstName,
      lastName,
    })

    res.status(201).json(result)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

/**
 * POST /auth/login
 * Login with email and password
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({
        error: 'Missing required fields: email, password',
      })
      return
    }

    const result = await authService.login(email, password)
    res.json(result)
  } catch (error: any) {
    res.status(401).json({ error: error.message })
  }
})

/**
 * POST /auth/logout
 * Logout user (requires authentication)
 */
router.post('/logout', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' })
      return
    }

    await authService.logout(req.user.userId)
    res.json({ message: 'Logged out successfully' })
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      res.status(400).json({
        error: 'Missing required field: refreshToken',
      })
      return
    }

    const result = await authService.refreshAccessToken(refreshToken)
    res.json(result)
  } catch (error: any) {
    res.status(401).json({ error: error.message })
  }
})

/**
 * GET /auth/me
 * Get current user information (requires authentication)
 */
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' })
      return
    }

    res.json({
      user: req.user,
    })
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

export default router
