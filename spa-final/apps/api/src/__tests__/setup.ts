import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load test environment variables
config({ path: resolve(__dirname, '../../.env.test') });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-1234567890';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret-for-testing-1234567890';
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a'.repeat(64); // 32-byte test key

// Import prisma after env is loaded
import { prisma } from '@peacase/database';

// Store cleanup functions for each test
const cleanupFunctions: (() => Promise<void>)[] = [];

/**
 * Register a cleanup function to be run after each test
 */
export function registerCleanup(fn: () => Promise<void>) {
  cleanupFunctions.push(fn);
}

/**
 * Clean up test data in the correct order (respecting foreign key constraints)
 */
async function cleanDatabase() {
  // Delete in order that respects foreign key constraints
  const tablesToClean = [
    'ReminderLog',
    'CommissionRecord',
    'ReviewResponse',
    'Review',
    'FormResponse',
    'ConsultationForm',
    'MarketingCampaign',
    'GiftCard',
    'ClientPackage',
    'PackageService',
    'Package',
    'Payment',
    'Appointment',
    'ClientNote',
    'StaffAvailability',
    'StaffService',
    'TimeOff',
    'Service',
    'ServiceCategory',
    'Location',
    'Client',
    'RefreshToken',
    'PasswordResetToken',
    'User',
    'Salon',
  ];

  for (const table of tablesToClean) {
    try {
      // Use raw SQL to delete all records
      await prisma.$executeRawUnsafe(`DELETE FROM "${table.toLowerCase().replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')}s" WHERE 1=1`);
    } catch {
      // Table might not exist in the mapped name format, try alternative
      try {
        const mappedName = table
          .replace(/([A-Z])/g, '_$1')
          .toLowerCase()
          .replace(/^_/, '');
        await prisma.$executeRawUnsafe(`DELETE FROM "${mappedName}s" WHERE 1=1`);
      } catch {
        // Ignore errors for tables that don't exist
      }
    }
  }
}

beforeAll(async () => {
  // Skip database connection for unit tests that don't need it
  // Tests that need the database will fail on first query if not connected
  try {
    await prisma.$connect();
  } catch (error) {
    console.error('Failed to connect to test database:', error);
    console.warn('Database-dependent tests will be skipped or fail.');
    // Don't throw - allow unit tests that don't need the database to run
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clear cleanup functions from previous test
  cleanupFunctions.length = 0;
});

afterEach(async () => {
  // Run registered cleanup functions
  for (const cleanup of cleanupFunctions) {
    try {
      await cleanup();
    } catch {
      // Ignore cleanup errors
    }
  }
  cleanupFunctions.length = 0;
});

// Export prisma for use in tests
export { prisma };
