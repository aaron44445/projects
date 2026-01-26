import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Configure Prisma with enhanced logging and error handling
const createPrismaClient = (): PrismaClient => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? [
          { level: 'query', emit: 'event' },
          { level: 'error', emit: 'stdout' },
          { level: 'warn', emit: 'stdout' },
        ]
      : [{ level: 'error', emit: 'stdout' }],
  });

  // Log slow queries in development (> 200ms)
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any).$on('query', (e: { query: string; params: string; duration: number }) => {
      if (e.duration > 200) {
        console.warn(`[Prisma Slow Query] ${e.duration}ms: ${e.query}`);
      }
    });
  }

  return client;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown handler
const handleShutdown = async () => {
  console.log('[Prisma] Disconnecting...');
  await prisma.$disconnect();
  console.log('[Prisma] Disconnected');
};

// Handle process termination
if (typeof process !== 'undefined') {
  process.on('beforeExit', handleShutdown);
}

export * from '@prisma/client';
export default prisma;
