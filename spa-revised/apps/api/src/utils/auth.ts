/**
 * Authentication Utilities
 * Password hashing and JWT token management
 */

import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production'

/**
 * Hash a password using bcrypt
 * @param password Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

/**
 * Verify a password against a hash
 * @param password Plain text password
 * @param hash Hashed password
 * @returns True if password matches hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Generate an access token (1 hour expiration)
 * @param payload Token payload
 * @returns Signed JWT token
 */
export function generateAccessToken(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '1h',
  })
}

/**
 * Generate a refresh token (7 days expiration)
 * @param payload Token payload
 * @returns Signed JWT token
 */
export function generateRefreshToken(payload: any): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  })
}

/**
 * Verify an access token
 * @param token JWT token
 * @returns Decoded payload
 */
export function verifyAccessToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    throw new Error('Invalid or expired access token')
  }
}

/**
 * Verify a refresh token
 * @param token JWT token
 * @returns Decoded payload
 */
export function verifyRefreshToken(token: string): any {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET)
  } catch (error) {
    throw new Error('Invalid or expired refresh token')
  }
}

/**
 * Extract token from Authorization header
 * @param authHeader Authorization header value
 * @returns Token or null
 */
export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null
  return parts[1]
}
