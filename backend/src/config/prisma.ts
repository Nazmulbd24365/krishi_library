import { PrismaClient } from '@prisma/client';
import { env } from './env';

/**
 * Prisma singleton. In development the client is cached on globalThis so that
 * hot reloads do not open a new connection pool on every change.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isDev ? ['warn', 'error'] : ['error'],
  });

if (env.isDev) globalForPrisma.prisma = prisma;
