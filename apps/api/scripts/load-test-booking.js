/**
 * k6 Load Test Script - Double-Booking Prevention Verification
 *
 * This script tests that the booking system correctly prevents double-bookings
 * when 100 concurrent users attempt to book the exact same time slot.
 *
 * Expected results:
 * - Exactly 1 booking succeeds (status 201)
 * - 99 bookings receive TIME_CONFLICT error (status 400)
 * - 0 unexpected errors
 *
 * SETUP REQUIREMENTS:
 * 1. A test salon must exist with:
 *    - bookingEnabled: true
 *    - A valid slug (e.g., 'demo' or create a test salon)
 *
 * 2. A test service must exist with:
 *    - isActive: true
 *    - onlineBookingEnabled: true
 *
 * 3. A test staff member must exist with:
 *    - isActive: true
 *    - onlineBookingEnabled: true
 *    - Assigned to the test service (via StaffService)
 *    - Availability for the target time slot
 *
 * RUNNING THE TEST:
 *
 * Option 1: Using environment variables
 *   k6 run -e BASE_URL=http://localhost:3001 \
 *          -e TEST_SALON_SLUG=demo \
 *          -e TEST_SERVICE_ID=<service-id> \
 *          -e TEST_STAFF_ID=<staff-id> \
 *          -e TEST_LOCATION_ID=<location-id> \
 *          apps/api/scripts/load-test-booking.js
 *
 * Option 2: Modify the defaults in this file for local testing
 *
 * INTERPRETING RESULTS:
 * - If booking_successes > 1: CRITICAL BUG - double-booking occurred!
 * - If booking_errors > 0: Investigate unexpected errors
 * - booking_successes == 1 && booking_conflicts == 99: PASS
 *
 * TROUBLESHOOTING:
 * - "Service not found": Verify TEST_SERVICE_ID is correct and service is active
 * - "Staff not found": Verify TEST_STAFF_ID is correct and staff can perform service
 * - "No staff available": Staff doesn't have availability for the target time
 * - Connection errors: Verify BASE_URL and API is running
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

// Custom metrics for tracking booking outcomes
const bookingSuccesses = new Counter('booking_successes');
const bookingConflicts = new Counter('booking_conflicts');
const bookingErrors = new Counter('booking_errors');
const bookingDuration = new Trend('booking_duration');

// Test configuration
export const options = {
  scenarios: {
    // All 100 users hit the same endpoint at the same time
    double_booking_test: {
      executor: 'shared-iterations',
      vus: 100,           // 100 virtual users
      iterations: 100,    // 100 total requests (1 per VU)
      maxDuration: '60s', // Max test duration
    },
  },
  // These thresholds define pass/fail criteria
  thresholds: {
    'booking_successes': ['count==1'],    // EXACTLY 1 success
    'booking_conflicts': ['count==99'],   // EXACTLY 99 conflicts
    'booking_errors': ['count==0'],       // ZERO unexpected errors
    'http_req_failed': ['rate<0.01'],     // Less than 1% network failures
  },
};

// Configuration from environment variables with defaults
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const SALON_SLUG = __ENV.TEST_SALON_SLUG || 'demo';
const SERVICE_ID = __ENV.TEST_SERVICE_ID || '';      // Required - no sensible default
const STAFF_ID = __ENV.TEST_STAFF_ID || '';          // Required - no sensible default
const LOCATION_ID = __ENV.TEST_LOCATION_ID || '';    // Optional

// Calculate target time: tomorrow at 10:00 AM
// Using a fixed future time ensures all 100 requests target the same slot
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(10, 0, 0, 0);
const TARGET_TIME = tomorrow.toISOString();

// Validate configuration before test starts
export function setup() {
  console.log('=== Double-Booking Prevention Load Test ===');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Salon Slug: ${SALON_SLUG}`);
  console.log(`Service ID: ${SERVICE_ID || 'NOT SET (will likely fail)'}`);
  console.log(`Staff ID: ${STAFF_ID || 'NOT SET (will auto-assign)'}`);
  console.log(`Location ID: ${LOCATION_ID || 'NOT SET (optional)'}`);
  console.log(`Target Time: ${TARGET_TIME}`);
  console.log('');

  if (!SERVICE_ID) {
    console.warn('WARNING: TEST_SERVICE_ID not set. Test will likely fail.');
    console.warn('Create a test service and set the environment variable.');
  }

  // Verify salon exists
  const salonRes = http.get(`${BASE_URL}/api/v1/public/${SALON_SLUG}/salon`);
  if (salonRes.status !== 200) {
    console.error(`ERROR: Salon "${SALON_SLUG}" not found or not accessible.`);
    console.error(`Response: ${salonRes.status} - ${salonRes.body}`);
    return { abort: true };
  }

  const salonData = JSON.parse(salonRes.body);
  if (!salonData.data?.bookingEnabled) {
    console.warn('WARNING: Booking is disabled for this salon.');
  }

  console.log(`Salon found: ${salonData.data?.name}`);
  console.log('');

  return {
    abort: false,
    salonName: salonData.data?.name,
  };
}

// Main test function - executed by each virtual user
export default function (data) {
  // Skip if setup detected a problem
  if (data && data.abort) {
    console.log('Test aborted due to setup failure');
    return;
  }

  // Build booking payload
  // Each VU gets a unique email to simulate different customers
  const payload = JSON.stringify({
    serviceId: SERVICE_ID,
    staffId: STAFF_ID || undefined,
    locationId: LOCATION_ID || undefined,
    startTime: TARGET_TIME,
    firstName: 'LoadTest',
    lastName: `User${__VU}`,
    email: `loadtest-vu${__VU}-${Date.now()}@example.com`,
    phone: `555-${String(__VU).padStart(4, '0')}`,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'booking_attempt' },
  };

  // Execute booking request
  const startTime = new Date().getTime();
  const res = http.post(
    `${BASE_URL}/api/v1/public/${SALON_SLUG}/book`,
    payload,
    params
  );
  const endTime = new Date().getTime();

  // Track duration
  bookingDuration.add(endTime - startTime);

  // Analyze response
  let body;
  try {
    body = JSON.parse(res.body);
  } catch (e) {
    body = { error: { code: 'PARSE_ERROR', message: res.body } };
  }

  // Track outcomes based on response
  if (res.status === 201) {
    // Booking succeeded
    bookingSuccesses.add(1);
    console.log(`VU ${__VU}: SUCCESS - Booking created`);

    check(res, {
      'booking created': (r) => r.status === 201,
      'has appointment id': () => body.data?.id !== undefined,
    });
  } else if (res.status === 400 && body.error?.code === 'TIME_CONFLICT') {
    // Expected conflict
    bookingConflicts.add(1);

    check(res, {
      'conflict detected': (r) => r.status === 400,
      'has TIME_CONFLICT code': () => body.error?.code === 'TIME_CONFLICT',
      'has alternatives': () => Array.isArray(body.alternatives),
    });

    // Log alternative count (should have alternatives)
    const altCount = body.alternatives?.length || 0;
    if (altCount > 0) {
      console.log(`VU ${__VU}: CONFLICT - ${altCount} alternatives offered`);
    }
  } else {
    // Unexpected error
    bookingErrors.add(1);
    console.error(`VU ${__VU}: ERROR - Status ${res.status}`);
    console.error(`  Code: ${body.error?.code || 'N/A'}`);
    console.error(`  Message: ${body.error?.message || res.body}`);

    check(res, {
      'no unexpected errors': () => false,
    });
  }
}

// Summary after test completes
export function teardown(data) {
  console.log('');
  console.log('==============================================');
  console.log('    DOUBLE-BOOKING PREVENTION TEST RESULTS    ');
  console.log('==============================================');
  console.log('');
  console.log('Expected Results:');
  console.log('  - booking_successes: 1');
  console.log('  - booking_conflicts: 99');
  console.log('  - booking_errors: 0');
  console.log('');
  console.log('Check the metrics above to verify results.');
  console.log('');
  console.log('INTERPRETATION:');
  console.log('  - If booking_successes > 1: CRITICAL BUG - Double-booking occurred!');
  console.log('  - If booking_errors > 0: Investigate the unexpected errors.');
  console.log('  - booking_successes == 1 && booking_conflicts == 99: PASS');
  console.log('');
}

/**
 * QUICK SETUP GUIDE:
 *
 * 1. Create test data (run these SQL commands or use Prisma):
 *
 *    -- Or use the demo salon if it exists
 *    -- Get the salon ID first:
 *    SELECT id, slug FROM salons WHERE slug = 'demo';
 *
 *    -- Get a service ID:
 *    SELECT id, name FROM services WHERE salon_id = '<salon-id>' AND is_active = true;
 *
 *    -- Get a staff ID:
 *    SELECT id, first_name, last_name FROM users
 *    WHERE salon_id = '<salon-id>' AND is_active = true AND online_booking_enabled = true;
 *
 * 2. Run the test:
 *
 *    k6 run -e BASE_URL=http://localhost:3001 \
 *           -e TEST_SALON_SLUG=demo \
 *           -e TEST_SERVICE_ID=<service-id-from-step-1> \
 *           -e TEST_STAFF_ID=<staff-id-from-step-1> \
 *           apps/api/scripts/load-test-booking.js
 *
 * 3. Check results - look for:
 *    - booking_successes.........: 1
 *    - booking_conflicts.........: 99
 *    - booking_errors............: 0
 *
 *    If thresholds pass, the test passes!
 */
