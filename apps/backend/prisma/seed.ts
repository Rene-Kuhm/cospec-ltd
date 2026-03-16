import { PrismaClient, Rol } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const hashedPassword = await bcrypt.hash('cospec2024', 10);

  // Admin user (idempotent upsert)
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@cospec.com' },
    update: {},
    create: {
      nombre: 'Administrador',
      email: 'admin@cospec.com',
      password: hashedPassword,
      rol: Rol.ADMIN,
      activo: true,
    },
  });

  console.log(`✅ Admin user: ${admin.email}`);
  console.log('✅ Seed complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
