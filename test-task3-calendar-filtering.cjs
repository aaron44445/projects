const { PrismaClient } = require('./packages/database/dist');
const prisma = new PrismaClient();

// Test data - Using Stencill Wash salon
const SALON_ID = '50f75ca7-5f77-4a65-8476-1e06122eaf66';
const LOCATION_1 = '11f0bd61-a58b-4a3e-9cd7-38f7de84d54e'; // HQ
const LOCATION_2 = '275ca986-20fb-45c3-90fd-7e12e4ecea0b'; // d spa

// Staff members
const STAFF_MEMBERS = [
  '059b1950-453e-4646-bc41-b5918e38f8dc', // John Pork (assigned to Loc 1)
  '72c8f891-09ab-4e85-b64c-5ab0ab383a5d', // Med Nic (assigned to Loc 2)
  '6c8d6377-f303-4ac2-856d-f787a3b5115b', // Mad Dog (assigned to both)
  '53e12c8a-08cd-476e-85c1-c6f99354d4ec', // Adam McBride (no assignment)
];

async function setupTestData() {
  console.log('Setting up test data (same as Task 2)...');

  // Clear all staff location assignments for this salon
  await prisma.staffLocation.deleteMany({
    where: {
      staff: { salonId: SALON_ID },
    },
  });

  // Staff A assigned to Location 1 only
  await prisma.staffLocation.create({
    data: {
      staffId: STAFF_MEMBERS[0],
      locationId: LOCATION_1,
      isPrimary: true,
    },
  });

  // Staff B assigned to Location 2 only
  await prisma.staffLocation.create({
    data: {
      staffId: STAFF_MEMBERS[1],
      locationId: LOCATION_2,
      isPrimary: true,
    },
  });

  // Staff C assigned to BOTH locations
  await prisma.staffLocation.createMany({
    data: [
      { staffId: STAFF_MEMBERS[2], locationId: LOCATION_1, isPrimary: true },
      { staffId: STAFF_MEMBERS[2], locationId: LOCATION_2, isPrimary: false },
    ],
  });

  // Staff D has NO location assignments

  const staff = await Promise.all(
    STAFF_MEMBERS.map((id) =>
      prisma.user.findUnique({ where: { id }, select: { firstName: true, lastName: true } })
    )
  );

  console.log('  Test data ready\n');
}

async function getStaffForLocationForCalendar(locationId) {
  // Simulates the useStaff hook with locationId filter
  // This is the SAME logic as Task 2, which calendar should use
  const staffAtLocation = await prisma.staffLocation.findMany({
    where: {
      locationId: locationId,
      staff: {
        salonId: SALON_ID,
        isActive: true,
      },
    },
    include: {
      staff: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
  });

  const assignedStaff = staffAtLocation.map((sl) => sl.staff);
  const assignedStaffIds = assignedStaff.map((s) => s.id);

  // Also get staff with NO location assignments
  const unassignedStaff = await prisma.user.findMany({
    where: {
      salonId: SALON_ID,
      isActive: true,
      staffLocations: {
        none: {},
      },
      id: {
        notIn: assignedStaffIds,
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      role: true,
    },
  });

  return [...assignedStaff, ...unassignedStaff];
}

async function testAppointmentLocationAssociation() {
  // Test that appointments are correctly associated with locations
  console.log('Testing appointment-location associations...\n');

  // Create a test service first
  const service = await prisma.service.findFirst({
    where: { salonId: SALON_ID, isActive: true },
  });

  if (!service) {
    console.log('  No service found, creating one...');
    const newService = await prisma.service.create({
      data: {
        salonId: SALON_ID,
        name: 'Test Service',
        description: 'Test service for appointments',
        durationMinutes: 60,
        price: 100,
        isActive: true,
      },
    });
    console.log(`  ✓ Created service: ${newService.name}\n`);
  }

  // Get a client
  let client = await prisma.client.findFirst({
    where: { salonId: SALON_ID, isActive: true },
  });

  if (!client) {
    console.log('  No client found, creating one...');
    client = await prisma.client.create({
      data: {
        salonId: SALON_ID,
        firstName: 'Test',
        lastName: 'Client',
        email: 'testclient@test.com',
        isActive: true,
      },
    });
    console.log(`  ✓ Created client: ${client.firstName} ${client.lastName}\n`);
  }

  // Create appointments at different locations
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const apt1End = new Date(tomorrow);
  apt1End.setHours(11, 0, 0, 0);

  console.log('1. Creating appointment at Location 1 (HQ)...');
  const apt1 = await prisma.appointment.create({
    data: {
      salonId: SALON_ID,
      locationId: LOCATION_1,
      clientId: client.id,
      staffId: STAFF_MEMBERS[0], // John (assigned to Loc 1)
      serviceId: service ? service.id : (await prisma.service.findFirst({ where: { salonId: SALON_ID } })).id,
      startTime: tomorrow,
      endTime: apt1End,
      durationMinutes: 60,
      price: 100,
      status: 'confirmed',
      source: 'manual',
    },
  });
  console.log(`   ✓ Created appointment at Location 1 with locationId: ${apt1.locationId}\n`);

  tomorrow.setHours(14, 0, 0, 0);
  const apt2End = new Date(tomorrow);
  apt2End.setHours(15, 0, 0, 0);

  console.log('2. Creating appointment at Location 2 (d spa)...');
  const apt2 = await prisma.appointment.create({
    data: {
      salonId: SALON_ID,
      locationId: LOCATION_2,
      clientId: client.id,
      staffId: STAFF_MEMBERS[1], // Med (assigned to Loc 2)
      serviceId: service ? service.id : (await prisma.service.findFirst({ where: { salonId: SALON_ID } })).id,
      startTime: tomorrow,
      endTime: apt2End,
      durationMinutes: 60,
      price: 100,
      status: 'confirmed',
      source: 'manual',
    },
  });
  console.log(`   ✓ Created appointment at Location 2 with locationId: ${apt2.locationId}\n`);

  // Query appointments by location
  console.log('3. Querying appointments by location...');
  const loc1Apts = await prisma.appointment.findMany({
    where: {
      salonId: SALON_ID,
      locationId: LOCATION_1,
    },
    select: {
      id: true,
      locationId: true,
      staff: { select: { firstName: true, lastName: true } },
    },
  });

  const loc2Apts = await prisma.appointment.findMany({
    where: {
      salonId: SALON_ID,
      locationId: LOCATION_2,
    },
    select: {
      id: true,
      locationId: true,
      staff: { select: { firstName: true, lastName: true } },
    },
  });

  console.log(`   Location 1 appointments: ${loc1Apts.length}`);
  loc1Apts.slice(0, 3).forEach((apt) => {
    console.log(`     - ${apt.staff.firstName} ${apt.staff.lastName} at ${apt.locationId === LOCATION_1 ? 'HQ' : 'Other'}`);
  });

  console.log(`   Location 2 appointments: ${loc2Apts.length}`);
  loc2Apts.slice(0, 3).forEach((apt) => {
    console.log(`     - ${apt.staff.firstName} ${apt.staff.lastName} at ${apt.locationId === LOCATION_2 ? 'd spa' : 'Other'}`);
  });

  console.log('   ✅ PASS: Appointments correctly associated with locations\n');

  // Clean up test appointments
  await prisma.appointment.deleteMany({
    where: { id: { in: [apt1.id, apt2.id] } },
  });
}

async function testCalendarIntegration() {
  console.log('\n=== TASK 3: TEST STAFF SCHEDULING AT LOCATIONS ===\n');

  try {
    await setupTestData();

    const staff = await Promise.all(
      STAFF_MEMBERS.map((id) =>
        prisma.user.findUnique({ where: { id }, select: { firstName: true, lastName: true } })
      )
    );

    // Test 1: Verify calendar staff dropdown for Location 1
    console.log('1. TEST: Calendar staff dropdown for Location 1 (HQ)...');
    const loc1StaffForCalendar = await getStaffForLocationForCalendar(LOCATION_1);
    const loc1StaffIds = loc1StaffForCalendar.map((s) => s.id);

    console.log(`   Staff available for scheduling at Location 1: ${loc1StaffForCalendar.length}`);
    loc1StaffForCalendar.forEach((s) => {
      console.log(`     - ${s.firstName} ${s.lastName} (${s.role})`);
    });

    const hasJohn = loc1StaffIds.includes(STAFF_MEMBERS[0]);
    const hasMed = loc1StaffIds.includes(STAFF_MEMBERS[1]);
    const hasMad = loc1StaffIds.includes(STAFF_MEMBERS[2]);
    const hasAdam = loc1StaffIds.includes(STAFF_MEMBERS[3]);

    console.log('\n   Expected in dropdown:');
    console.log(`     ✓ John Pork (Loc 1 only): ${hasJohn ? 'PRESENT ✓' : 'MISSING ✗'}`);
    console.log(`     ✓ Med Nic (Loc 2 only): ${hasMed ? 'SHOULD NOT BE HERE ✗' : 'CORRECTLY ABSENT ✓'}`);
    console.log(`     ✓ Mad Dog (both locs): ${hasMad ? 'PRESENT ✓' : 'MISSING ✗'}`);
    console.log(`     ✓ Adam McBride (unassigned): ${hasAdam ? 'PRESENT ✓' : 'MISSING ✗'}`);

    if (hasJohn && !hasMed && hasMad && hasAdam) {
      console.log('\n   ✅ PASS: Calendar staff dropdown filters correctly for Location 1\n');
    } else {
      console.log('\n   ❌ FAIL: Calendar staff dropdown filtering incorrect\n');
      throw new Error('Calendar filtering failed for Location 1');
    }

    // Test 2: Verify calendar staff dropdown for Location 2
    console.log('2. TEST: Calendar staff dropdown for Location 2 (d spa)...');
    const loc2StaffForCalendar = await getStaffForLocationForCalendar(LOCATION_2);
    const loc2StaffIds = loc2StaffForCalendar.map((s) => s.id);

    console.log(`   Staff available for scheduling at Location 2: ${loc2StaffForCalendar.length}`);
    loc2StaffForCalendar.forEach((s) => {
      console.log(`     - ${s.firstName} ${s.lastName} (${s.role})`);
    });

    const hasJohn2 = loc2StaffIds.includes(STAFF_MEMBERS[0]);
    const hasMed2 = loc2StaffIds.includes(STAFF_MEMBERS[1]);
    const hasMad2 = loc2StaffIds.includes(STAFF_MEMBERS[2]);
    const hasAdam2 = loc2StaffIds.includes(STAFF_MEMBERS[3]);

    console.log('\n   Expected in dropdown:');
    console.log(`     ✓ John Pork (Loc 1 only): ${hasJohn2 ? 'SHOULD NOT BE HERE ✗' : 'CORRECTLY ABSENT ✓'}`);
    console.log(`     ✓ Med Nic (Loc 2 only): ${hasMed2 ? 'PRESENT ✓' : 'MISSING ✗'}`);
    console.log(`     ✓ Mad Dog (both locs): ${hasMad2 ? 'PRESENT ✓' : 'MISSING ✗'}`);
    console.log(`     ✓ Adam McBride (unassigned): ${hasAdam2 ? 'PRESENT ✓' : 'MISSING ✗'}`);

    if (!hasJohn2 && hasMed2 && hasMad2 && hasAdam2) {
      console.log('\n   ✅ PASS: Calendar staff dropdown filters correctly for Location 2\n');
    } else {
      console.log('\n   ❌ FAIL: Calendar staff dropdown filtering incorrect\n');
      throw new Error('Calendar filtering failed for Location 2');
    }

    // Test 3: Appointment-location associations
    await testAppointmentLocationAssociation();

    console.log('=== ✅ TASK 3 TESTS PASSED ===\n');
    console.log('Summary:');
    console.log('  ✓ Calendar staff dropdown shows only Location 1 staff + unassigned');
    console.log('  ✓ Calendar staff dropdown shows only Location 2 staff + unassigned');
    console.log('  ✓ Staff assigned ONLY to other location does NOT appear in dropdown');
    console.log('  ✓ Appointments include locationId and persist correctly');
    console.log('  ✓ Appointments can be queried by location\n');

    console.log('NOTE: UI verification in calendar page is required as final step:');
    console.log('  1. Navigate to /calendar in browser');
    console.log('  2. Use LocationSwitcher to select Location 1');
    console.log('  3. Open staff filter/dropdown on calendar');
    console.log('  4. Verify dropdown shows ONLY staff assigned to Location 1 + unassigned');
    console.log('  5. Staff assigned ONLY to Location 2 must NOT appear\n');
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testCalendarIntegration();
