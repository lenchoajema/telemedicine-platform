#!/usr/bin/env node

const API_BASE = 'http://localhost:5000/api';

const LENCHO_CREDENTIALS = {
  email: 'lenchoajema@gmail.com',
  password: 'password123'
};

const TEST_DOCTOR_CREDENTIALS = {
  email: 'test.doctor@example.com',
  password: 'password123'
};

async function login(credentials) {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Login error:', error.message);
    return null;
  }
}

async function testDoctorAppointments(credentials, doctorName) {
  console.log(`\n=== Testing Appointments for ${doctorName} ===`);
  
  const loginResult = await login(credentials);
  if (!loginResult || !loginResult.token) {
    console.log(`❌ Could not login as ${doctorName}`);
    return;
  }

  console.log(`✅ Successfully logged in as ${doctorName}`);
  console.log(`Doctor User ID: ${loginResult.user._id}`);

  try {
    // Test /appointments endpoint
    console.log('\n🔍 Testing /appointments endpoint...');
    const appointmentsResponse = await fetch(`${API_BASE}/appointments`, {
      headers: {
        'Authorization': `Bearer ${loginResult.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (appointmentsResponse.ok) {
      const appointments = await appointmentsResponse.json();
      console.log(`✅ Found ${appointments.length} appointments`);
      
      if (appointments.length > 0) {
        console.log('📋 Appointment breakdown:');
        const statusCounts = {};
        const dateCounts = {};
        
        appointments.forEach(apt => {
          statusCounts[apt.status] = (statusCounts[apt.status] || 0) + 1;
          const dateStr = new Date(apt.date).toDateString();
          dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
        });
        
        console.log('   By status:', statusCounts);
        console.log('   By date:', dateCounts);
      }
    } else {
      console.log(`❌ /appointments failed: ${appointmentsResponse.status}`);
    }

    // Test /appointments/upcoming endpoint
    console.log('\n🔍 Testing /appointments/upcoming endpoint...');
    const upcomingResponse = await fetch(`${API_BASE}/appointments/upcoming`, {
      headers: {
        'Authorization': `Bearer ${loginResult.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (upcomingResponse.ok) {
      const upcoming = await upcomingResponse.json();
      console.log(`✅ Found ${upcoming.length} upcoming appointments`);
    } else {
      console.log(`❌ /appointments/upcoming failed: ${upcomingResponse.status}`);
    }

    // Test /appointments/stats endpoint
    console.log('\n🔍 Testing /appointments/stats endpoint...');
    const statsResponse = await fetch(`${API_BASE}/appointments/stats`, {
      headers: {
        'Authorization': `Bearer ${loginResult.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log('✅ Stats:', JSON.stringify(stats, null, 2));
    } else {
      console.log(`❌ /appointments/stats failed: ${statsResponse.status}`);
    }

  } catch (error) {
    console.error(`❌ Test error for ${doctorName}:`, error.message);
  }
}

async function main() {
  console.log('🩺 Testing Doctor Appointment Fix...');
  console.log('After updating the backend to handle both User ID and Doctor document ID references');

  // Test Lencho doctor (should have 9 appointments with Doctor document IDs)
  await testDoctorAppointments(LENCHO_CREDENTIALS, 'Lencho (should have 9 appointments)');

  // Test original test doctor (should have 1 appointment with User ID)
  await testDoctorAppointments(TEST_DOCTOR_CREDENTIALS, 'Test Doctor (should have 1 appointment)');

  console.log('\n=== EXPECTED RESULTS ===');
  console.log('✅ Lencho should now see 9 appointments (was 0 before fix)');
  console.log('✅ Test Doctor should still see 1 appointment');
  console.log('✅ Both doctors should have correct stats');
  console.log('');
  console.log('If this works, the frontend doctor dashboard should now show appointments!');
}

main().catch(console.error);
