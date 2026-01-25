const { PrismaClient } = require('../packages/database/node_modules/@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://postgres.ubvgvbobnmlzsedtupuw:Lambo57Bears@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
      }
    }
  });

  try {
    // Hash passwordHash
    const hashedPassword = await bcrypt.hash('test123', 10);

    // Check if salon exists
    let salon = await prisma.salon.findFirst();

    if (!salon) {
      // Create a salon first
      salon = await prisma.salon.create({
        data: {
          name: 'Test Salon',
          slug: 'test-salon-' + Date.now(),
          email: 'test@testsalon.com',
          multiLocationEnabled: true
        }
      });
      console.log('Created salon:', salon.name);

      // Create primary location
      await prisma.location.create({
        data: {
          salonId: salon.id,
          name: 'Main Location',
          isPrimary: true,
          isActive: true,
          city: 'New York',
          state: 'NY',
          timezone: 'America/New_York'
        }
      });
      console.log('Created primary location');
    }

    // Update or create test user
    const user = await prisma.user.upsert({
      where: {
        salonId_email: {
          salonId: salon.id,
          email: 'test@peacase.com'
        }
      },
      update: {
        passwordHash: hashedPassword,
        role: 'owner',
        firstName: 'Test',
        lastName: 'Owner'
      },
      create: {
        email: 'test@peacase.com',
        passwordHash: hashedPassword,
        role: 'owner',
        firstName: 'Test',
        lastName: 'Owner',
        salonId: salon.id
      }
    });

    console.log('\n✓ Test user ready');
    console.log('  Email: test@peacase.com');
    console.log('  Password: test123');
    console.log('  Role:', user.role);
    console.log('  Salon:', salon.name);
    console.log('  Salon ID:', salon.id);
    console.log('  Multi-location enabled:', salon.multiLocationEnabled);

    await prisma.$disconnect();
  } catch (e) {
    console.error('Error:', e.message);
    console.error(e);
    process.exit(1);
  }
}

main();
