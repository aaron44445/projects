const fetch = require('node-fetch');

let token;
let locationId;
const BASE_URL = 'http://localhost:3001/api/v1';

async function login() {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@peacase.com',
      password: 'test123'
    })
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error('Login failed');
  }
  token = data.data.tokens.accessToken;
  console.log('✓ Logged in');
}

async function getFirstLocation() {
  const res = await fetch(`${BASE_URL}/locations`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  if (data.success && data.data.length > 0) {
    locationId = data.data[0].id;
    console.log('✓ Using location:', data.data[0].name);
  } else {
    throw new Error('No locations found');
  }
}

async function testGetHours() {
  console.log('\n=== TEST: Get Location Hours ===');

  const res = await fetch(`${BASE_URL}/locations/${locationId}/hours`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await res.json();

  if (data.success) {
    console.log('✓ Hours retrieved successfully');
    console.log('  Days:', data.data.length);
    data.data.forEach(h => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      if (h.isClosed) {
        console.log(`    ${days[h.dayOfWeek]}: Closed`);
      } else {
        console.log(`    ${days[h.dayOfWeek]}: ${h.openTime} - ${h.closeTime}`);
      }
    });
    return data.data;
  } else {
    console.log('✗ Failed to get hours');
    console.log('  Error:', data.error);
    return null;
  }
}

async function testUpdateHours() {
  console.log('\n=== TEST: Update Location Hours ===');

  const customHours = [
    { dayOfWeek: 0, openTime: null, closeTime: null, isClosed: true }, // Sunday closed
    { dayOfWeek: 1, openTime: '09:00', closeTime: '18:00', isClosed: false }, // Mon
    { dayOfWeek: 2, openTime: '09:00', closeTime: '18:00', isClosed: false }, // Tue
    { dayOfWeek: 3, openTime: '09:00', closeTime: '18:00', isClosed: false }, // Wed
    { dayOfWeek: 4, openTime: '09:00', closeTime: '18:00', isClosed: false }, // Thu
    { dayOfWeek: 5, openTime: '09:00', closeTime: '18:00', isClosed: false }, // Fri
    { dayOfWeek: 6, openTime: '10:00', closeTime: '16:00', isClosed: false }, // Sat
  ];

  const res = await fetch(`${BASE_URL}/locations/${locationId}/hours`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ hours: customHours })
  });

  const data = await res.json();

  if (data.success) {
    console.log('✓ Hours updated successfully');
    return true;
  } else {
    console.log('✗ Failed to update hours');
    console.log('  Error:', data.error);
    return false;
  }
}

async function verifyHoursPersist() {
  console.log('\n=== TEST: Verify Hours Persist ===');

  const hours = await testGetHours();
  if (!hours) return false;

  // Check Sunday is closed
  const sunday = hours.find(h => h.dayOfWeek === 0);
  if (!sunday || !sunday.isClosed) {
    console.log('✗ Sunday should be closed');
    return false;
  }

  // Check Saturday has correct hours
  const saturday = hours.find(h => h.dayOfWeek === 6);
  if (!saturday || saturday.openTime !== '10:00' || saturday.closeTime !== '16:00') {
    console.log('✗ Saturday hours incorrect');
    console.log('  Expected: 10:00 - 16:00');
    console.log('  Got:', saturday?.openTime, '-', saturday?.closeTime);
    return false;
  }

  // Check Monday-Friday
  for (let day = 1; day <= 5; day++) {
    const dayHours = hours.find(h => h.dayOfWeek === day);
    if (!dayHours || dayHours.openTime !== '09:00' || dayHours.closeTime !== '18:00') {
      console.log(`✗ Weekday ${day} hours incorrect`);
      return false;
    }
  }

  console.log('✓ All hours verified correctly');
  return true;
}

async function main() {
  try {
    await login();
    await getFirstLocation();

    // Get default hours
    await testGetHours();

    // Update hours
    const updateSuccess = await testUpdateHours();
    if (!updateSuccess) {
      console.log('\nHours update failed');
      process.exit(1);
    }

    // Verify hours were saved
    const verifySuccess = await verifyHoursPersist();
    if (!verifySuccess) {
      console.log('\nHours verification failed');
      process.exit(1);
    }

    console.log('\n✓ All hours tests passed!');
  } catch (error) {
    console.error('\n✗ Test error:', error.message);
    process.exit(1);
  }
}

main();
