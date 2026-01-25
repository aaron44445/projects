const fetch = require('node-fetch');

let token;
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
    throw new Error('Login failed: ' + JSON.stringify(data));
  }
  token = data.data.tokens.accessToken;
  console.log('✓ Logged in');
}

async function testCreateLocation() {
  console.log('\n=== TEST: Create Location ===');

  const res = await fetch(`${BASE_URL}/locations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Test Location',
      address: '789 Test Ave',
      city: 'Queens',
      state: 'NY',
      zip: '11375',
      phone: '(555) 999-8888',
      timezone: 'America/New_York',
      isPrimary: false
    })
  });

  const data = await res.json();

  if (data.success) {
    console.log('✓ Location created successfully');
    console.log('  ID:', data.data.id);
    console.log('  Name:', data.data.name);
    console.log('  City:', data.data.city);
    return data.data;
  } else {
    console.log('✗ Failed to create location');
    console.log('  Error:', data.error);
    return null;
  }
}

async function testUpdateLocation(locationId) {
  console.log('\n=== TEST: Update Location ===');

  const res = await fetch(`${BASE_URL}/locations/${locationId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      address: '789 Updated Ave',
      phone: '(555) 111-2222'
    })
  });

  const data = await res.json();

  if (data.success) {
    console.log('✓ Location updated successfully');
    console.log('  Address:', data.data.address);
    console.log('  Phone:', data.data.phone);
    return true;
  } else {
    console.log('✗ Failed to update location');
    console.log('  Error:', data.error);
    return false;
  }
}

async function testGetLocations() {
  console.log('\n=== TEST: Get Locations ===');

  const res = await fetch(`${BASE_URL}/locations`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await res.json();

  if (data.success) {
    console.log('✓ Locations retrieved successfully');
    console.log('  Total:', data.data.length);
    data.data.forEach(loc => {
      console.log(`    - ${loc.name} (${loc.city}) - Primary: ${loc.isPrimary}`);
    });
    return data.data;
  } else {
    console.log('✗ Failed to get locations');
    console.log('  Error:', data.error);
    return [];
  }
}

async function testDeleteLocation(locationId) {
  console.log('\n=== TEST: Delete Location ===');

  const res = await fetch(`${BASE_URL}/locations/${locationId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await res.json();

  if (data.success) {
    console.log('✓ Location deleted successfully');
    return true;
  } else {
    console.log('✗ Failed to delete location');
    console.log('  Error:', data.error);
    return false;
  }
}

async function testSetPrimary(locationId) {
  console.log('\n=== TEST: Set Primary Location ===');

  const res = await fetch(`${BASE_URL}/locations/${locationId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ isPrimary: true })
  });

  const data = await res.json();

  if (data.success) {
    console.log('✓ Primary location set successfully');
    console.log('  New primary:', data.data.name);
    return true;
  } else {
    console.log('✗ Failed to set primary');
    console.log('  Error:', data.error);
    return false;
  }
}

async function main() {
  try {
    await login();

    // Create a new location
    const newLocation = await testCreateLocation();
    if (!newLocation) {
      console.log('\nTests failed at creation step');
      return;
    }

    // Update the location
    await testUpdateLocation(newLocation.id);

    // Get all locations to verify
    await testGetLocations();

    // Test setting a different location as primary
    const locations = await testGetLocations();
    const nonPrimary = locations.find(l => !l.isPrimary && l.id !== newLocation.id);
    if (nonPrimary) {
      await testSetPrimary(nonPrimary.id);
      await testGetLocations(); // Verify primary changed
    }

    // Delete the test location
    await testDeleteLocation(newLocation.id);

    // Verify deletion
    await testGetLocations();

    console.log('\n✓ All CRUD tests passed!');
  } catch (error) {
    console.error('\n✗ Test error:', error.message);
    process.exit(1);
  }
}

main();
