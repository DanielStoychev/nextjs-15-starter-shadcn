const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@footygames.co.uk';
  const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword'; // Use a strong password in production!

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      hashedPassword: hashedPassword,
      role: 'ADMIN',
    },
    create: {
      name: 'Admin User',
      email: adminEmail,
      hashedPassword: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log(`Admin user created/updated: ${adminUser.email} with role ${adminUser.role}`);
  console.log(`Password: ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
