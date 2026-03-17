const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding...');
  
  const hashedPassword = bcrypt.hashSync('cospec2024', 10);
  
  await prisma.usuario.upsert({
    where: { email: 'admin@cospec.com' },
    update: {},
    create: {
      nombre: 'Administrador',
      email: 'admin@cospec.com',
      password: hashedPassword,
      rol: 'ADMIN',
      activo: true,
    }
  });
  
  console.log('✅ Admin created: admin@cospec.com / cospec2024');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
