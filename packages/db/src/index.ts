import { PrismaClient } from '@prisma/client';

// Singleton pattern for PrismaClient
// Prevents multiple instances in development (hot reload)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env['NODE_ENV'] === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
}

export { PrismaClient } from '@prisma/client';
export type { Usuario, Reclamo, MaterialUsado } from '@prisma/client';
export { Rol, EstadoReclamo, ServicioAfectado } from '@prisma/client';
