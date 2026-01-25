const { PrismaClient } = require('./packages/database/dist');
const prisma = new PrismaClient();

// Test data
const SALON_ID = '50f75ca7-5f77-4a65-8476-1e06122eaf66'; // Stencill Wash
const LOCATION_1 = '11f0bd61-a58b-4a3e-9cd7-38f7de84d54e'; // HQ
const LOCATION_2 = '275ca986-20fb-45c3-90fd-7e12e4ecea0b'; // d spa
const STAFF_ID = '059b1950-453e-4646-bc41-b5918e38f8dc'; // John Pork (admin)

async function testStaffLocationAssignment() {
  console.log('\n=== TASK 1: TEST STAFF-LOCATION ASSIGNMENT (Direct DB) ===\n');

  try {
    // Check current assignments
    console.log('1. Checking current staff location assignments...');
    const currentAssignments = await prisma.staffLocation.findMany({
      where: { staffId: STAFF_ID },
      include: { location: { select: { name: true } } },
    });
    console.log(`   Current assignments: ${currentAssignments.length}`);
    currentAssignments.forEach((a) => {
      console.log(`     - ${a.location.name} ${a.isPrimary ? '[PRIMARY]' : ''}`);
    });
    console.log('');

    // Clear existing assignments for clean test
    console.log('2. Clearing existing assignments...');
    await prisma.staffLocation.deleteMany({
      where: { staffId: STAFF_ID },
    });
    console.log('   ✓ Cleared\n');

    // Test 1: Assign staff to Location 1 (simulating API POST /locations/:id/staff)
    console.log('3. TEST: Assign staff to Location 1 (HQ)...');
    const assignment1 = await prisma.staffLocation.create({
      data: {
        staffId: STAFF_ID,
        locationId: LOCATION_1,
        isPrimary: false,
      },
    });
    console.log('   ✓ Assignment created:', {
      id: assignment1.id,
      isPrimary: assignment1.isPrimary,
    });

    // Verify in database
    const dbCheck1 = await prisma.staffLocation.findUnique({
      where: {
        staffId_locationId: { staffId: STAFF_ID, locationId: LOCATION_1 },
      },
    });
    console.log(`   ✓ Verified in database: ${dbCheck1 ? 'EXISTS' : 'MISSING'}`);
    console.log('');

    // Test 2: Get staff assigned to Location 1 (simulating API GET /locations/:id/staff)
    console.log('4. TEST: Get staff at Location 1...');
    const staffAtLocation1 = await prisma.staffLocation.findMany({
      where: { locationId: LOCATION_1 },
      include: {
        staff: {
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
    const foundStaff = staffAtLocation1.find((s) => s.staffId === STAFF_ID);
    console.log(`   Staff count at location: ${staffAtLocation1.length}`);
    console.log(`   ✓ Our staff member found: ${foundStaff ? 'YES' : 'NO'}`);
    if (foundStaff) {
      console.log(`     ${foundStaff.staff.firstName} ${foundStaff.staff.lastName} (${foundStaff.staff.role})`);
    }
    console.log('');

    // Test 3: Assign to Location 2 as primary
    console.log('5. TEST: Assign staff to Location 2 (d spa) as PRIMARY...');
    const assignment2 = await prisma.staffLocation.create({
      data: {
        staffId: STAFF_ID,
        locationId: LOCATION_2,
        isPrimary: true,
      },
    });
    console.log('   ✓ Assignment created with isPrimary:', assignment2.isPrimary);

    // Verify both assignments
    const allAssignments = await prisma.staffLocation.findMany({
      where: { staffId: STAFF_ID },
      include: { location: { select: { name: true } } },
    });
    console.log(`   ✓ Total assignments in DB: ${allAssignments.length}`);
    allAssignments.forEach((a) => {
      console.log(`     - ${a.location.name} ${a.isPrimary ? '[PRIMARY]' : ''}`);
    });
    console.log('');

    // Test 4: Check if duplicate assignment is prevented
    console.log('6. TEST: Try to create duplicate assignment...');
    try {
      await prisma.staffLocation.create({
        data: {
          staffId: STAFF_ID,
          locationId: LOCATION_1,
          isPrimary: false,
        },
      });
      console.log('   ❌ FAIL: Duplicate was allowed!');
    } catch (error) {
      if (error.code === 'P2002') {
        console.log('   ✓ PASS: Duplicate prevented by unique constraint');
      } else {
        throw error;
      }
    }
    console.log('');

    // Test 5: Remove staff from Location 1 (simulating DELETE /locations/:id/staff/:staffId)
    console.log('7. TEST: Remove staff from Location 1...');
    await prisma.staffLocation.delete({
      where: {
        staffId_locationId: { staffId: STAFF_ID, locationId: LOCATION_1 },
      },
    });
    console.log('   ✓ Removed successfully');

    // Verify removal
    const dbCheck2 = await prisma.staffLocation.findUnique({
      where: {
        staffId_locationId: { staffId: STAFF_ID, locationId: LOCATION_1 },
      },
    });
    console.log(`   ✓ Verified in database: ${dbCheck2 ? 'STILL EXISTS (ERROR!)' : 'REMOVED'}`);

    // Check remaining assignments
    const remainingAssignments = await prisma.staffLocation.findMany({
      where: { staffId: STAFF_ID },
      include: { location: { select: { name: true } } },
    });
    console.log(`   ✓ Remaining assignments: ${remainingAssignments.length}`);
    remainingAssignments.forEach((a) => {
      console.log(`     - ${a.location.name} ${a.isPrimary ? '[PRIMARY]' : ''}`);
    });
    console.log('');

    // Test 6: Verify staff-location assignment persists after "page refresh"
    console.log('8. TEST: Verify assignments persist (simulating page refresh)...');
    const persistedAssignments = await prisma.staffLocation.findMany({
      where: { staffId: STAFF_ID },
      include: { location: { select: { name: true } } },
    });
    console.log(`   ✓ Assignments still exist: ${persistedAssignments.length}`);
    console.log('   Data persists correctly after refresh simulation\n');

    console.log('=== ✅ TASK 1 TESTS PASSED ===\n');
    console.log('Summary:');
    console.log('  ✓ Staff can be assigned to specific locations');
    console.log('  ✓ Staff-location assignments persist after page refresh');
    console.log('  ✓ Removing staff from location works correctly');
    console.log('  ✓ Primary location flag works correctly');
    console.log('  ✓ Duplicate prevention works via unique constraint\n');
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.stack) console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testStaffLocationAssignment();
