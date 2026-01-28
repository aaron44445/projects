import { prisma } from '@peacase/database';

/**
 * Validate that a staff member belongs to a specific salon and is active
 */
export async function validateStaffBelongsToSalon(
  staffId: string,
  salonId: string
): Promise<boolean> {
  const staff = await prisma.user.findFirst({
    where: { id: staffId, salonId, isActive: true },
    select: { id: true }
  });
  return !!staff;
}

/**
 * Validate that a location belongs to a specific salon
 */
export async function validateLocationBelongsToSalon(
  locationId: string,
  salonId: string
): Promise<boolean> {
  const location = await prisma.location.findFirst({
    where: { id: locationId, salonId },
    select: { id: true }
  });
  return !!location;
}

/**
 * Validate that a service belongs to a specific salon and is active
 */
export async function validateServiceBelongsToSalon(
  serviceId: string,
  salonId: string
): Promise<boolean> {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, salonId, isActive: true },
    select: { id: true }
  });
  return !!service;
}

/**
 * Validate that a client belongs to a specific salon
 */
export async function validateClientBelongsToSalon(
  clientId: string,
  salonId: string
): Promise<boolean> {
  const client = await prisma.client.findFirst({
    where: { id: clientId, salonId },
    select: { id: true }
  });
  return !!client;
}
