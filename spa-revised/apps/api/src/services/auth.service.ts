/**
 * Authentication Service
 * Handles user registration, login, token management, and RBAC
 */

import { prisma } from '@pecase/database'
import { hashPassword, verifyPassword, generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/auth'
import { createClient } from 'redis'

// Redis client for storing refresh tokens
let redisClient: ReturnType<typeof createClient> | null = null

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    })
    await redisClient.connect()
  }
  return redisClient
}

export interface RegisterData {
  salon_name: string
  email: string
  phone: string
  password: string
  firstName?: string
  lastName?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

/**
 * Register a new salon with admin user
 */
export async function register(data: RegisterData): Promise<{
  user: any
  salon: any
  accessToken: string
  refreshToken: string
}> {
  try {
    // Check if email already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: data.email },
    })

    if (existingUser) {
      throw new Error('Email already in use')
    }

    // Create salon
    const salon = await prisma.salon.create({
      data: {
        name: data.salon_name,
        email: data.email,
        phone: data.phone,
        address: '', // Will be updated later
        city: '',
        state: '',
        zip: '',
      },
    })

    // Hash password
    const passwordHash = await hashPassword(data.password)

    // Create admin user
    const user = await prisma.user.create({
      data: {
        salonId: salon.id,
        email: data.email,
        passwordHash,
        firstName: data.firstName || 'Admin',
        lastName: data.lastName || 'User',
        role: 'admin',
      },
    })

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      salonId: salon.id,
      role: user.role,
      email: user.email,
    })

    const refreshToken = generateRefreshToken({
      userId: user.id,
      salonId: salon.id,
    })

    // Store refresh token in Redis
    const redis = await getRedisClient()
    await redis.setEx(
      `refresh_token:${user.id}`,
      7 * 24 * 60 * 60, // 7 days
      refreshToken
    )

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        salonId: salon.id,
      },
      salon: {
        id: salon.id,
        name: salon.name,
        email: salon.email,
        phone: salon.phone,
      },
      accessToken,
      refreshToken,
    }
  } catch (error) {
    throw error
  }
}

/**
 * Login with email and password
 */
export async function login(email: string, password: string): Promise<{
  user: any
  accessToken: string
  refreshToken: string
}> {
  try {
    // Find user by email
    const user = await prisma.user.findFirst({
      where: { email },
    })

    if (!user) {
      throw new Error('Invalid credentials')
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash)
    if (!isValidPassword) {
      throw new Error('Invalid credentials')
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      salonId: user.salonId,
      role: user.role,
      email: user.email,
    })

    const refreshToken = generateRefreshToken({
      userId: user.id,
      salonId: user.salonId,
    })

    // Store refresh token in Redis
    const redis = await getRedisClient()
    await redis.setEx(
      `refresh_token:${user.id}`,
      7 * 24 * 60 * 60, // 7 days
      refreshToken
    )

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        salonId: user.salonId,
      },
      accessToken,
      refreshToken,
    }
  } catch (error) {
    throw error
  }
}

/**
 * Logout user by removing refresh token from Redis
 */
export async function logout(userId: string): Promise<void> {
  try {
    const redis = await getRedisClient()
    await redis.del(`refresh_token:${userId}`)
  } catch (error) {
    throw error
  }
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string
}> {
  try {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken)

    // Check if token exists in Redis
    const redis = await getRedisClient()
    const storedToken = await redis.get(`refresh_token:${payload.userId}`)

    if (!storedToken || storedToken !== refreshToken) {
      throw new Error('Refresh token not found or invalid')
    }

    // Get fresh user data
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: user.id,
      salonId: user.salonId,
      role: user.role,
      email: user.email,
    })

    return {
      accessToken,
    }
  } catch (error) {
    throw error
  }
}

/**
 * Get current user from access token
 */
export async function getCurrentUser(accessToken: string): Promise<any> {
  try {
    // Verify and decode token
    const payload = require('../utils/auth').verifyAccessToken(accessToken)

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })

    if (!user) {
      throw new Error('User not found')
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      salonId: user.salonId,
    }
  } catch (error) {
    throw error
  }
}

/**
 * Check if user has permission for a given action
 * This is a simple RBAC implementation
 */
export function hasPermission(role: string, requiredPermissions: string[]): boolean {
  const permissionMatrix: { [key: string]: string[] } = {
    admin: ['*'], // Admin has all permissions
    manager: ['view_users', 'manage_staff', 'view_appointments', 'manage_appointments', 'view_clients', 'view_reports'],
    staff: ['view_appointments', 'update_own_appointments', 'view_clients', 'manage_own_schedule'],
    receptionist: ['view_appointments', 'create_appointments', 'view_clients', 'manage_clients'],
  }

  const userPermissions = permissionMatrix[role] || []

  // If user has admin, they have all permissions
  if (userPermissions.includes('*')) {
    return true
  }

  // Check if user has all required permissions
  return requiredPermissions.every((permission) => userPermissions.includes(permission))
}

/**
 * Create a new user (for salon staff)
 */
export async function createUser(data: {
  salonId: string
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  role: string
}): Promise<any> {
  try {
    // Check if email already exists in salon
    const existingUser = await prisma.user.findUnique({
      where: {
        salonId_email: {
          salonId: data.salonId,
          email: data.email,
        },
      },
    })

    if (existingUser) {
      throw new Error('Email already in use in this salon')
    }

    // Hash password
    const passwordHash = await hashPassword(data.password)

    // Create user
    const user = await prisma.user.create({
      data: {
        salonId: data.salonId,
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role,
      },
    })

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      salonId: user.salonId,
    }
  } catch (error) {
    throw error
  }
}
