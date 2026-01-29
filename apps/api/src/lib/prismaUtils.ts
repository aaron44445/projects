/**
 * Prisma utility functions for type-safe queries.
 *
 * These utilities provide explicit typing for common query patterns,
 * replacing implicit `any` types in route handlers.
 */

/**
 * Creates a Prisma where clause that filters by salonId.
 * Use this in all multi-tenant queries to ensure tenant isolation.
 *
 * @param salonId - The salon ID to filter by
 * @returns Typed filter object for Prisma where clause
 *
 * @example
 * const where = {
 *   ...withSalonId(req.user!.salonId),
 *   status: 'confirmed',
 * } satisfies Prisma.AppointmentWhereInput;
 */
export function withSalonId(salonId: string): { salonId: string } {
  return { salonId };
}
