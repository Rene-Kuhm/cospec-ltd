const { PrismaClient } = require('./node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:1985@localhost:5432/cospec_db'
    }
  }
});

async function main() {
  console.log('🌱 Seeding...');
  
  const bcrypt = require('./node_modules/.pnpm/bcryptjs@2.4.3/node_modules/bcryptjs');
  const hashedPassword = await bcrypt.hashSync('cospec2024', 10);
  
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
