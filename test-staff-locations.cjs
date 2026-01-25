const { PrismaClient } = require('./packages/database/dist');
const prisma = new PrismaClient();

async function checkData() {
  try {
    const salons = await prisma.salon.findMany({
      include: {
        locations: true,
        users: {
          where: { isActive: true },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    console.log('=== SALONS, LOCATIONS & STAFF ===');
    salons.forEach((salon) => {
      console.log(`\nSalon: ${salon.name} (${salon.id})`);
      console.log(`Locations (${salon.locations.length}):`);
      salon.locations.forEach((loc) => {
        console.log(`  - ${loc.name} (${loc.id}) ${loc.isPrimary ? '[PRIMARY]' : ''}`);
      });
      console.log(`Active Staff (${salon.users.length}):`);
      salon.users.forEach((user) => {
        console.log(`  - ${user.firstName} ${user.lastName} (${user.id}) - ${user.role}`);
      });
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkData();
