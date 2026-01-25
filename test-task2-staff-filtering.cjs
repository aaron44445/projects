const { PrismaClient } = require('./packages/database/dist');
const prisma = new PrismaClient();

// Test data - Using Stencill Wash salon
const SALON_ID = '50f75ca7-5f77-4a65-8476-1e06122eaf66';
const LOCATION_1 = '11f0bd61-a58b-4a3e-9cd7-38f7de84d54e'; // HQ
const LOCATION_2 = '275ca986-20fb-45c3-90fd-7e12e4ecea0b'; // d spa

// Staff members
const STAFF_MEMBERS = [
  '059b1950-453e-4646-bc41-b5918e38f8dc', // John Pork (admin)
  '72c8f891-09ab-4e85-b64c-5ab0ab383a5d', // Med Nic (staff)
  '6c8d6377-f303-4ac2-856d-f787a3b5115b', // Mad Dog (staff)
  '53e12c8a-08cd-476e-85c1-c6f99354d4ec', // Adam McBride (staff)
];

async function setupTestData() {
  console.log('Setting up test data...');

  // Clear all staff location assignments for this salon
  await prisma.staffLocation.deleteMany({
    where: {
      staff: { salonId: SALON_ID },
    },
  });

  // Staff A (STAFF_MEMBERS[0]) assigned to Location 1 only
  await prisma.staffLocation.create({
    data: {
      staffId: STAFF_MEMBERS[0],
      locationId: LOCATION_1,
      isPrimary: true,
    },
  });

  // Staff B (STAFF_MEMBERS[1]) assigned to Location 2 only
  await prisma.staffLocation.create({
    data: {
      staffId: STAFF_MEMBERS[1],
      locationId: LOCATION_2,
      isPrimary: true,
    },
  });

  // Staff C (STAFF_MEMBERS[2]) assigned to BOTH locations
  await prisma.staffLocation.createMany({
    data: [
      { staffId: STAFF_MEMBERS[2], locationId: LOCATION_1, isPrimary: true },
      { staffId: STAFF_MEMBERS[2], locationId: LOCATION_2, isPrimary: false },
    ],
  });

  // Staff D (STAFF_MEMBERS[3]) has NO location assignments

  const staff = await Promise.all(
    STAFF_MEMBERS.map((id) =>
      prisma.user.findUnique({ where: { id }, select: { firstName: true, lastName: true } })
    )
  );

  console.log('Test data setup complete:');
  console.log(`  Staff A (${staff[0].firstName} ${staff[0].lastName}): Location 1 only`);
  console.log(`  Staff B (${staff[1].firstName} ${staff[1].lastName}): Location 2 only`);
  console.log(`  Staff C (${staff[2].firstName} ${staff[2].lastName}): Both locations`);
  console.log(`  Staff D (${staff[3].firstName} ${staff[3].lastName}): No assignments`);
  console.log('');
}

async function getStaffForLocation(locationId) {
  // This simulates the logic in apps/api/src/routes/staff.ts (lines 20-80)
  // Get staff assigned to this location
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
    },
  });

  return [...assignedStaff, ...unassignedStaff];
}

async function getAllStaff() {
  // Simulating GET /api/v1/staff with no filter
  return await prisma.user.findMany({
    where: {
      salonId: SALON_ID,
      isActive: true,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  });
}

async function testStaffFiltering() {
  console.log('\n=== TASK 2: TEST STAFF FILTERING BY LOCATION ===\n');

  try {
    await setupTestData();

    const staff = await Promise.all(
      STAFF_MEMBERS.map((id) =>
        prisma.user.findUnique({ where: { id }, select: { firstName: true, lastName: true } })
      )
    );

    // Test 1: Get staff for Location 1
    console.log('1. TEST: Get staff for Location 1 (HQ)...');
    const loc1Staff = await getStaffForLocation(LOCATION_1);
    const loc1StaffIds = loc1Staff.map((s) => s.id);

    console.log(`   Found ${loc1Staff.length} staff members:`);
    loc1Staff.forEach((s) => {
      console.log(`     - ${s.firstName} ${s.lastName}`);
    });

    const hasStaffA = loc1StaffIds.includes(STAFF_MEMBERS[0]);
    const hasStaffB = loc1StaffIds.includes(STAFF_MEMBERS[1]);
    const hasStaffC = loc1StaffIds.includes(STAFF_MEMBERS[2]);
    const hasStaffD = loc1StaffIds.includes(STAFF_MEMBERS[3]);

    console.log('   Expected results:');
    console.log(`     ✓ Staff A (${staff[0].firstName}): ${hasStaffA ? 'PRESENT ✓' : 'MISSING ✗'}`);
    console.log(`     ✓ Staff B (${staff[1].firstName}): ${hasStaffB ? 'PRESENT ✗' : 'ABSENT ✓'}`);
    console.log(`     ✓ Staff C (${staff[2].firstName}): ${hasStaffC ? 'PRESENT ✓' : 'MISSING ✗'}`);
    console.log(`     ✓ Staff D (${staff[3].firstName}): ${hasStaffD ? 'PRESENT ✓' : 'MISSING ✗'}`);

    if (hasStaffA && !hasStaffB && hasStaffC && hasStaffD) {
      console.log('   ✅ PASS: Location 1 filtering correct\n');
    } else {
      console.log('   ❌ FAIL: Location 1 filtering incorrect\n');
      throw new Error('Location 1 filtering failed');
    }

    // Test 2: Get staff for Location 2
    console.log('2. TEST: Get staff for Location 2 (d spa)...');
    const loc2Staff = await getStaffForLocation(LOCATION_2);
    const loc2StaffIds = loc2Staff.map((s) => s.id);

    console.log(`   Found ${loc2Staff.length} staff members:`);
    loc2Staff.forEach((s) => {
      console.log(`     - ${s.firstName} ${s.lastName}`);
    });

    const hasStaffA2 = loc2StaffIds.includes(STAFF_MEMBERS[0]);
    const hasStaffB2 = loc2StaffIds.includes(STAFF_MEMBERS[1]);
    const hasStaffC2 = loc2StaffIds.includes(STAFF_MEMBERS[2]);
    const hasStaffD2 = loc2StaffIds.includes(STAFF_MEMBERS[3]);

    console.log('   Expected results:');
    console.log(`     ✓ Staff A (${staff[0].firstName}): ${hasStaffA2 ? 'PRESENT ✗' : 'ABSENT ✓'}`);
    console.log(`     ✓ Staff B (${staff[1].firstName}): ${hasStaffB2 ? 'PRESENT ✓' : 'MISSING ✗'}`);
    console.log(`     ✓ Staff C (${staff[2].firstName}): ${hasStaffC2 ? 'PRESENT ✓' : 'MISSING ✗'}`);
    console.log(`     ✓ Staff D (${staff[3].firstName}): ${hasStaffD2 ? 'PRESENT ✓' : 'MISSING ✗'}`);

    if (!hasStaffA2 && hasStaffB2 && hasStaffC2 && hasStaffD2) {
      console.log('   ✅ PASS: Location 2 filtering correct\n');
    } else {
      console.log('   ❌ FAIL: Location 2 filtering incorrect\n');
      throw new Error('Location 2 filtering failed');
    }

    // Test 3: Get all staff (no location filter)
    console.log('3. TEST: Get all staff (no location filter)...');
    const allStaff = await getAllStaff();
    console.log(`   Found ${allStaff.length} total staff members`);

    const allStaffIds = allStaff.map((s) => s.id);
    const hasAll = STAFF_MEMBERS.every((id) => allStaffIds.includes(id));

    if (hasAll) {
      console.log('   ✅ PASS: All staff returned when no filter applied\n');
    } else {
      console.log('   ❌ FAIL: Missing staff when no filter\n');
      throw new Error('All staff query failed');
    }

    console.log('=== ✅ TASK 2 TESTS PASSED ===\n');
    console.log('Summary:');
    console.log('  ✓ Staff A appears at Location 1 (assigned)');
    console.log('  ✓ Staff B does NOT appear at Location 1 (only assigned to Location 2)');
    console.log('  ✓ Staff C appears at Location 1 (assigned to both)');
    console.log('  ✓ Staff D appears at Location 1 (no assignments = all locations)');
    console.log('  ✓ Staff B appears at Location 2 (assigned)');
    console.log('  ✓ Staff C appears at Location 2 (assigned to both)');
    console.log('  ✓ Staff D appears at Location 2 (no assignments = all locations)');
    console.log('  ✓ All staff appear when no location filter applied\n');
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testStaffFiltering();
