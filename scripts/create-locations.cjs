const { PrismaClient } = require('../packages/database/node_modules/@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const primaryLoc = await prisma.location.create({
      data: {
        salonId: '7bab536f-abf0-449d-8016-7c24b3297fc9',
        name: 'Main Location',
        isPrimary: true,
        isActive: true,
        address: '123 Main Street',
        city: 'Manhattan',
        state: 'NY',
        zip: '10001',
        phone: '(555) 123-4567',
        timezone: 'America/New_York'
      }
    });
    console.log('✓ Created primary location:', primaryLoc.name);

    // Check all locations
    const locations = await prisma.location.findMany({
      where: { salonId: '7bab536f-abf0-449d-8016-7c24b3297fc9' },
      orderBy: { isPrimary: 'desc' }
    });
    console.log('\nTotal locations:', locations.length);
    locations.forEach(loc => {
      console.log(' -', loc.name, '| ID:', loc.id.substring(0, 8) + '... | Primary:', loc.isPrimary);
    });

    await prisma.$disconnect();
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

main();
