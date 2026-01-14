import { prisma, registerCleanup } from './setup';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../app.js';

// Types for test data
export interface TestSalon {
  id: string;
  name: string;
  slug: string;
  email: string;
}

export interface TestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  salonId: string;
}

export interface TestClient {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  salonId: string;
}

export interface TestService {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  salonId: string;
}

export interface TestAppointment {
  id: string;
  clientId: string;
  staffId: string;
  serviceId: string;
  salonId: string;
  startTime: Date;
  endTime: Date;
  status: string;
}

// Counter for unique data generation
let counter = 0;

/**
 * Generate a unique ID suffix for test data
 */
export function uniqueId(): string {
  counter++;
  return `${Date.now()}-${counter}`;
}

/**
 * Create a test salon
 */
export async function createTestSalon(overrides: Partial<TestSalon> = {}): Promise<TestSalon> {
  const id = uniqueId();
  const salon = await prisma.salon.create({
    data: {
      name: overrides.name || `Test Salon ${id}`,
      slug: overrides.slug || `test-salon-${id}`,
      email: overrides.email || `salon-${id}@test.com`,
      timezone: 'America/Chicago',
    },
  });

  registerCleanup(async () => {
    try {
      await prisma.salon.delete({ where: { id: salon.id } });
    } catch {
      // Ignore errors
    }
  });

  return salon;
}

/**
 * Create a test user
 */
export async function createTestUser(
  salonId: string,
  overrides: Partial<{ email: string; password: string; role: string; firstName: string; lastName: string }> = {}
): Promise<TestUser & { password: string }> {
  const id = uniqueId();
  const password = overrides.password || 'TestPassword123!';
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      salonId,
      email: overrides.email || `user-${id}@test.com`,
      passwordHash,
      firstName: overrides.firstName || 'Test',
      lastName: overrides.lastName || 'User',
      role: overrides.role || 'admin',
    },
  });

  registerCleanup(async () => {
    try {
      await prisma.user.delete({ where: { id: user.id } });
    } catch {
      // Ignore errors
    }
  });

  return { ...user, password };
}

/**
 * Create a test client
 */
export async function createTestClient(
  salonId: string,
  overrides: Partial<{ firstName: string; lastName: string; email: string; phone: string }> = {}
): Promise<TestClient> {
  const id = uniqueId();

  const client = await prisma.client.create({
    data: {
      salonId,
      firstName: overrides.firstName || 'Test',
      lastName: overrides.lastName || `Client ${id}`,
      email: overrides.email || `client-${id}@test.com`,
      phone: overrides.phone || `555-${id.slice(-4).padStart(4, '0')}`,
    },
  });

  registerCleanup(async () => {
    try {
      await prisma.client.delete({ where: { id: client.id } });
    } catch {
      // Ignore errors
    }
  });

  return client;
}

/**
 * Create a test service
 */
export async function createTestService(
  salonId: string,
  overrides: Partial<{ name: string; price: number; durationMinutes: number }> = {}
): Promise<TestService> {
  const id = uniqueId();

  const service = await prisma.service.create({
    data: {
      salonId,
      name: overrides.name || `Test Service ${id}`,
      price: overrides.price ?? 50,
      durationMinutes: overrides.durationMinutes ?? 60,
      color: '#C7DCC8',
    },
  });

  registerCleanup(async () => {
    try {
      await prisma.service.delete({ where: { id: service.id } });
    } catch {
      // Ignore errors
    }
  });

  return service;
}

/**
 * Create a test appointment
 */
export async function createTestAppointment(
  salonId: string,
  clientId: string,
  staffId: string,
  serviceId: string,
  overrides: Partial<{ startTime: Date; endTime: Date; status: string }> = {}
): Promise<TestAppointment> {
  const startTime = overrides.startTime || new Date(Date.now() + 24 * 60 * 60 * 1000);
  const endTime = overrides.endTime || new Date(startTime.getTime() + 60 * 60 * 1000);

  const appointment = await prisma.appointment.create({
    data: {
      salonId,
      clientId,
      staffId,
      serviceId,
      startTime,
      endTime,
      durationMinutes: 60,
      price: 50,
      status: overrides.status || 'confirmed',
      source: 'test',
    },
  });

  registerCleanup(async () => {
    try {
      await prisma.appointment.delete({ where: { id: appointment.id } });
    } catch {
      // Ignore errors
    }
  });

  return appointment;
}

/**
 * Generate JWT tokens for testing
 */
export function generateTestTokens(userId: string, salonId: string, role: string = 'admin'): {
  accessToken: string;
  refreshToken: string;
} {
  const accessToken = jwt.sign(
    { userId, salonId, role },
    process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing',
    { expiresIn: '1h' }
  );

  const refreshToken = jwt.sign(
    { userId, salonId, role, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret-key-for-testing',
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
}

/**
 * Store a refresh token in the database
 */
export async function storeRefreshToken(userId: string, token: string): Promise<void> {
  await prisma.refreshToken.create({
    data: {
      userId,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  registerCleanup(async () => {
    try {
      await prisma.refreshToken.deleteMany({ where: { token } });
    } catch {
      // Ignore errors
    }
  });
}

/**
 * Create a full test context with salon, user, client, service
 */
export async function createTestContext(): Promise<{
  salon: TestSalon;
  user: TestUser & { password: string };
  client: TestClient;
  service: TestService;
  tokens: { accessToken: string; refreshToken: string };
}> {
  const salon = await createTestSalon();
  const user = await createTestUser(salon.id);
  const client = await createTestClient(salon.id);
  const service = await createTestService(salon.id);
  const tokens = generateTestTokens(user.id, salon.id, user.role);

  return { salon, user, client, service, tokens };
}

/**
 * Make authenticated request helper
 */
export function authenticatedRequest(token: string) {
  return {
    get: (url: string) => request(app).get(url).set('Authorization', `Bearer ${token}`),
    post: (url: string) => request(app).post(url).set('Authorization', `Bearer ${token}`),
    patch: (url: string) => request(app).patch(url).set('Authorization', `Bearer ${token}`),
    delete: (url: string) => request(app).delete(url).set('Authorization', `Bearer ${token}`),
  };
}

/**
 * Export supertest request for unauthenticated requests
 */
export { request, app };
