import { PrismaClient } from '@prisma/client';

/**
 * Prisma client shared across warm Lambda invocations. Creating a client per
 * request would exhaust Neon's connection pool quickly, so it is cached on
 * globalThis and reused while the container lives.
 */
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__isibayaPrisma ?? new PrismaClient({ log: ['warn', 'error'] });

globalForPrisma.__isibayaPrisma = prisma;
