/**
 * Peacase Database Seed Script
 *
 * Creates demo data for development and testing.
 * Run with: pnpm db:seed
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data (in reverse dependency order)
  await prisma.reminderLog.deleteMany();
  await prisma.commissionRecord.deleteMany();
  await prisma.formResponse.deleteMany();
  await prisma.consultationForm.deleteMany();
  await prisma.marketingCampaign.deleteMany();
  await prisma.reviewResponse.deleteMany();
  await prisma.review.deleteMany();
  await prisma.giftCard.deleteMany();
  await prisma.clientPackage.deleteMany();
  await prisma.packageService.deleteMany();
  await prisma.package.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.clientNote.deleteMany();
  await prisma.client.deleteMany();
  await prisma.timeOff.deleteMany();
  await prisma.staffAvailability.deleteMany();
  await prisma.staffService.deleteMany();
  await prisma.service.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.location.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.salon.deleteMany();

  console.log('Cleared existing data');

  // Create demo salon
  const salon = await prisma.salon.create({
    data: {
      name: 'Serenity Spa & Wellness',
      slug: 'serenity-spa',
      email: 'hello@serenityspa.com',
      phone: '+1 (555) 123-4567',
      address: '123 Wellness Avenue',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90210',
      country: 'US',
      timezone: 'America/Los_Angeles',
      description: 'Your sanctuary for relaxation and rejuvenation',
      subscriptionPlan: 'professional',
      featuresEnabled: JSON.stringify(['reviews', 'marketing', 'giftCards', 'packages']),
    },
  });

  console.log('Created salon:', salon.name);

  // Create primary location
  const location = await prisma.location.create({
    data: {
      salonId: salon.id,
      name: 'Main Location',
      address: '123 Wellness Avenue',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90210',
      phone: '+1 (555) 123-4567',
      timezone: 'America/Los_Angeles',
      hours: JSON.stringify({
        monday: { open: '09:00', close: '19:00' },
        tuesday: { open: '09:00', close: '19:00' },
        wednesday: { open: '09:00', close: '19:00' },
        thursday: { open: '09:00', close: '21:00' },
        friday: { open: '09:00', close: '21:00' },
        saturday: { open: '10:00', close: '18:00' },
        sunday: { open: '10:00', close: '16:00' },
      }),
      isPrimary: true,
    },
  });

  // Create admin user
  const hashedPassword = await bcrypt.hash('demo123', 10);

  const adminUser = await prisma.user.create({
    data: {
      salonId: salon.id,
      email: 'admin@serenityspa.com',
      passwordHash: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '+1 (555) 123-4567',
      role: 'owner',
      isActive: true,
    },
  });

  console.log('Created admin user:', adminUser.email);

  // Create staff members
  const staffMembers = await Promise.all([
    prisma.user.create({
      data: {
        salonId: salon.id,
        email: 'emma@serenityspa.com',
        passwordHash: hashedPassword,
        firstName: 'Emma',
        lastName: 'Davis',
        role: 'staff',
        commissionRate: 0.45,
        certifications: 'Licensed Esthetician, Certified Massage Therapist',
      },
    }),
    prisma.user.create({
      data: {
        salonId: salon.id,
        email: 'michael@serenityspa.com',
        passwordHash: hashedPassword,
        firstName: 'Michael',
        lastName: 'Chen',
        role: 'staff',
        commissionRate: 0.50,
        certifications: 'Master Hair Stylist, Color Specialist',
      },
    }),
    prisma.user.create({
      data: {
        salonId: salon.id,
        email: 'jessica@serenityspa.com',
        passwordHash: hashedPassword,
        firstName: 'Jessica',
        lastName: 'Martinez',
        role: 'staff',
        commissionRate: 0.40,
        certifications: 'Nail Technician, Lash Artist',
      },
    }),
  ]);

  console.log(`Created ${staffMembers.length} staff members`);

  // Create service categories
  const categories = await Promise.all([
    prisma.serviceCategory.create({
      data: {
        salonId: salon.id,
        name: 'Massage Therapy',
        description: 'Relaxation and therapeutic massage services',
        displayOrder: 1,
      },
    }),
    prisma.serviceCategory.create({
      data: {
        salonId: salon.id,
        name: 'Facial Treatments',
        description: 'Professional skincare and facial services',
        displayOrder: 2,
      },
    }),
    prisma.serviceCategory.create({
      data: {
        salonId: salon.id,
        name: 'Hair Services',
        description: 'Cuts, color, and styling',
        displayOrder: 3,
      },
    }),
    prisma.serviceCategory.create({
      data: {
        salonId: salon.id,
        name: 'Nail Services',
        description: 'Manicures, pedicures, and nail art',
        displayOrder: 4,
      },
    }),
  ]);

  // Create services
  const services = await Promise.all([
    // Massage services
    prisma.service.create({
      data: {
        salonId: salon.id,
        categoryId: categories[0].id,
        name: 'Swedish Massage',
        description: 'Classic relaxation massage with long, flowing strokes',
        durationMinutes: 60,
        bufferMinutes: 15,
        price: 95,
        memberPrice: 80,
        color: '#C7DCC8',
      },
    }),
    prisma.service.create({
      data: {
        salonId: salon.id,
        categoryId: categories[0].id,
        name: 'Deep Tissue Massage',
        description: 'Therapeutic massage targeting muscle tension',
        durationMinutes: 60,
        bufferMinutes: 15,
        price: 115,
        memberPrice: 95,
        color: '#A8C5A8',
      },
    }),
    prisma.service.create({
      data: {
        salonId: salon.id,
        categoryId: categories[0].id,
        name: 'Hot Stone Massage',
        description: 'Heated stones for ultimate relaxation',
        durationMinutes: 90,
        bufferMinutes: 15,
        price: 145,
        memberPrice: 125,
        color: '#8FB88F',
      },
    }),
    // Facial services
    prisma.service.create({
      data: {
        salonId: salon.id,
        categoryId: categories[1].id,
        name: 'Express Facial',
        description: 'Quick refresh for busy schedules',
        durationMinutes: 30,
        price: 55,
        memberPrice: 45,
        color: '#E8D4C4',
      },
    }),
    prisma.service.create({
      data: {
        salonId: salon.id,
        categoryId: categories[1].id,
        name: 'Signature Facial',
        description: 'Our complete facial experience',
        durationMinutes: 60,
        bufferMinutes: 10,
        price: 95,
        memberPrice: 80,
        color: '#D4C4B4',
      },
    }),
    prisma.service.create({
      data: {
        salonId: salon.id,
        categoryId: categories[1].id,
        name: 'Anti-Aging Facial',
        description: 'Advanced treatments for youthful skin',
        durationMinutes: 75,
        bufferMinutes: 10,
        price: 135,
        memberPrice: 115,
        color: '#C4B4A4',
      },
    }),
    // Hair services
    prisma.service.create({
      data: {
        salonId: salon.id,
        categoryId: categories[2].id,
        name: 'Haircut',
        description: 'Precision cut and style',
        durationMinutes: 45,
        price: 65,
        memberPrice: 55,
        color: '#D4C8E8',
      },
    }),
    prisma.service.create({
      data: {
        salonId: salon.id,
        categoryId: categories[2].id,
        name: 'Color Service',
        description: 'Single process color',
        durationMinutes: 90,
        bufferMinutes: 15,
        price: 125,
        memberPrice: 105,
        color: '#C4B8D8',
      },
    }),
    prisma.service.create({
      data: {
        salonId: salon.id,
        categoryId: categories[2].id,
        name: 'Highlights',
        description: 'Partial or full highlights',
        durationMinutes: 120,
        bufferMinutes: 15,
        price: 175,
        memberPrice: 150,
        color: '#B4A8C8',
      },
    }),
    // Nail services
    prisma.service.create({
      data: {
        salonId: salon.id,
        categoryId: categories[3].id,
        name: 'Classic Manicure',
        description: 'Essential nail care',
        durationMinutes: 30,
        price: 35,
        memberPrice: 30,
        color: '#F4D4D4',
      },
    }),
    prisma.service.create({
      data: {
        salonId: salon.id,
        categoryId: categories[3].id,
        name: 'Gel Manicure',
        description: 'Long-lasting gel polish',
        durationMinutes: 45,
        price: 55,
        memberPrice: 45,
        color: '#E4C4C4',
      },
    }),
    prisma.service.create({
      data: {
        salonId: salon.id,
        categoryId: categories[3].id,
        name: 'Spa Pedicure',
        description: 'Complete foot care with massage',
        durationMinutes: 60,
        price: 65,
        memberPrice: 55,
        color: '#D4B4B4',
      },
    }),
  ]);

  console.log(`Created ${services.length} services in ${categories.length} categories`);

  // Create clients
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        salonId: salon.id,
        firstName: 'Jennifer',
        lastName: 'Wilson',
        email: 'jennifer.wilson@email.com',
        phone: '+1 (555) 234-5678',
        birthday: new Date('1985-06-15'),
        notes: 'Prefers early morning appointments. Allergic to lavender.',
      },
    }),
    prisma.client.create({
      data: {
        salonId: salon.id,
        firstName: 'Robert',
        lastName: 'Taylor',
        email: 'robert.taylor@email.com',
        phone: '+1 (555) 345-6789',
      },
    }),
    prisma.client.create({
      data: {
        salonId: salon.id,
        firstName: 'Amanda',
        lastName: 'Brown',
        email: 'amanda.brown@email.com',
        phone: '+1 (555) 456-7890',
        notes: 'VIP client - member since 2020',
      },
    }),
    prisma.client.create({
      data: {
        salonId: salon.id,
        firstName: 'David',
        lastName: 'Miller',
        email: 'david.miller@email.com',
        phone: '+1 (555) 567-8901',
      },
    }),
    prisma.client.create({
      data: {
        salonId: salon.id,
        firstName: 'Lisa',
        lastName: 'Anderson',
        email: 'lisa.anderson@email.com',
        phone: '+1 (555) 678-9012',
        birthday: new Date('1992-03-22'),
      },
    }),
  ]);

  console.log(`Created ${clients.length} clients`);

  // Create some appointments (past and future)
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const appointments = await Promise.all([
    // Tomorrow's appointments
    prisma.appointment.create({
      data: {
        salonId: salon.id,
        locationId: location.id,
        clientId: clients[0].id,
        staffId: staffMembers[0].id,
        serviceId: services[0].id, // Swedish Massage
        startTime: new Date(tomorrow.setHours(10, 0, 0, 0)),
        endTime: new Date(tomorrow.setHours(11, 0, 0, 0)),
        durationMinutes: 60,
        price: 95,
        status: 'confirmed',
      },
    }),
    prisma.appointment.create({
      data: {
        salonId: salon.id,
        locationId: location.id,
        clientId: clients[2].id,
        staffId: staffMembers[1].id,
        serviceId: services[6].id, // Haircut
        startTime: new Date(tomorrow.setHours(11, 30, 0, 0)),
        endTime: new Date(tomorrow.setHours(12, 15, 0, 0)),
        durationMinutes: 45,
        price: 65,
        status: 'confirmed',
      },
    }),
    prisma.appointment.create({
      data: {
        salonId: salon.id,
        locationId: location.id,
        clientId: clients[4].id,
        staffId: staffMembers[2].id,
        serviceId: services[10].id, // Gel Manicure
        startTime: new Date(tomorrow.setHours(14, 0, 0, 0)),
        endTime: new Date(tomorrow.setHours(14, 45, 0, 0)),
        durationMinutes: 45,
        price: 55,
        status: 'confirmed',
      },
    }),
  ]);

  console.log(`Created ${appointments.length} appointments`);

  // Create a package
  const spaPackage = await prisma.package.create({
    data: {
      salonId: salon.id,
      name: 'Monthly Wellness Package',
      description: 'One massage and one facial per month',
      price: 150,
      type: 'recurring',
      durationDays: 30,
      renewalPrice: 140,
    },
  });

  // Add services to package
  await prisma.packageService.createMany({
    data: [
      { packageId: spaPackage.id, serviceId: services[0].id, quantity: 1 },
      { packageId: spaPackage.id, serviceId: services[4].id, quantity: 1 },
    ],
  });

  console.log('Created wellness package');

  // Create a gift card
  await prisma.giftCard.create({
    data: {
      salonId: salon.id,
      code: 'GIFT-DEMO-2024',
      initialAmount: 100,
      balance: 75,
      status: 'active',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      purchaserEmail: 'gift.buyer@email.com',
      recipientEmail: clients[0].email,
      recipientName: `${clients[0].firstName} ${clients[0].lastName}`,
      message: 'Enjoy some relaxation!',
    },
  });

  console.log('Created demo gift card');

  console.log('\n========================================');
  console.log('Database seeded successfully!');
  console.log('========================================');
  console.log('\nDemo login credentials:');
  console.log('  Email: admin@serenityspa.com');
  console.log('  Password: demo123');
  console.log('\nStaff accounts (same password):');
  console.log('  - emma@serenityspa.com');
  console.log('  - michael@serenityspa.com');
  console.log('  - jessica@serenityspa.com');
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
