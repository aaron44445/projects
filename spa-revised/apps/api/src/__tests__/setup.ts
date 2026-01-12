/**
 * Jest Setup File
 * Configure test environment variables before tests run
 * This file runs before all tests and jest modules are loaded
 */

import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.test first
const dotenvPath = path.resolve(__dirname, '../../../.env.test')
const result = dotenv.config({ path: dotenvPath })

// Fallback to default test values if .env.test doesn't exist
process.env.NODE_ENV = process.env.NODE_ENV || 'test'
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pecase_test'
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key_12345'
process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_mock_secret'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key'
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-key'
process.env.TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || 'ACtest'
process.env.TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || 'test-token'
process.env.TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '+1234567890'
process.env.SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || 'test-sendgrid-key'

// Increase test timeout for database operations
jest.setTimeout(30000)
