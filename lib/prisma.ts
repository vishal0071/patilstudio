import { PrismaClient } from '@prisma/client';

/**
 * One client per process. Next's dev server re-evaluates modules on every edit, so
 * without the global stash each hot reload opens a fresh connection pool against
 * the shared Postgres — the engine GalleryFlow is also using. Exhausting its
 * connection slots from a marketing site would take the SaaS down with it.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
