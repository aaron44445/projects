import { PrismaClient } from "@prisma/client";

/**
 * Instantiate Prisma Client
 * This is a singleton instance used throughout the application
 * In development, we use a global to prevent multiple instances
 * In production, a single instance is created on startup
 */

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Optional: Add middleware for logging queries in development
 * This helps with debugging database operations
 */
if (process.env.NODE_ENV === "development") {
  prisma.$use(async (params, next) => {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();

    console.log(`Query ${params.model}.${params.action} took ${after - before}ms`);

    return result;
  });
}

export * from "@prisma/client";
