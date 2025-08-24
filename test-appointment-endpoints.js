#!/usr/bin/env node

const API_BASE = 'http://localhost:5000/api';

// Sample user credentials for testing (from AUTHENTICATION-FIX-REPORT.md)
const PATIENT_OPTIONS = [
  { email: 'patient1@example.com', password: 'password123' },
  { email: 'patient2@example.com', password: 'password123' },
  { email: 'patient@test.com', password: 'password123' },
  { email: 'patient@example.com', password: 'password123' }
];

const DOCTOR_OPTIONS = [
  { email: 'test.doctor@example.com', password: 'password123' },
  { email: 'dr.test@example.com', password: 'password123' },
  { email: 'doctor@test.com', password: 'password123' },
  { email: 'doctor@example.com', password: 'password123' },
  { email: 'lenchoajema@gmail.com', password: 'password123' }
];

async function login(credentials) {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });
    
    if (!response.ok) {
      throw new Error(`Login failed: ${response.status} ${response.statusText}`);
    }
    
  const data = await response.json();
  return data?.data?.token || data?.token || null;
  } catch (error) {
    console.error('Login error:', error.message);
    return null;
  }
}

async function testAppointmentEndpoint(token, userType) {
  console.log(`\n=== Testing Appointments API for ${userType} ===`);
  
  try {
    // Test /appointments endpoint
    console.log('\n1. Testing /appointments endpoint...');
    const appointmentsResponse = await fetch(`${API_BASE}/appointments`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (appointmentsResponse.ok) {
      const appointments = await appointmentsResponse.json();
      console.log(`✓ /appointments: Found ${appointments.length} appointments`);
      if (appointments.length > 0) {
        console.log('  Sample appointment:', JSON.stringify(appointments[0], null, 2));
      }
    } else {
      console.log(`✗ /appointments failed: ${appointmentsResponse.status} ${appointmentsResponse.statusText}`);
      const error = await appointmentsResponse.text();
      console.log('  Error:', error);
    }

    // Test /appointments/upcoming endpoint
    console.log('\n2. Testing /appointments/upcoming endpoint...');
    const upcomingResponse = await fetch(`${API_BASE}/appointments/upcoming`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (upcomingResponse.ok) {
      const upcoming = await upcomingResponse.json();
      console.log(`✓ /appointments/upcoming: Found ${upcoming.length} upcoming appointments`);
      if (upcoming.length > 0) {
        console.log('  Sample upcoming appointment:', JSON.stringify(upcoming[0], null, 2));
      }
    } else {
      console.log(`✗ /appointments/upcoming failed: ${upcomingResponse.status} ${upcomingResponse.statusText}`);
      const error = await upcomingResponse.text();
      console.log('  Error:', error);
    }

    // Test /appointments/stats endpoint
    console.log('\n3. Testing /appointments/stats endpoint...');
    const statsResponse = await fetch(`${API_BASE}/appointments/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log('✓ /appointments/stats:', JSON.stringify(stats, null, 2));
    } else {
      console.log(`✗ /appointments/stats failed: ${statsResponse.status} ${statsResponse.statusText}`);
      const error = await statsResponse.text();
      console.log('  Error:', error);
    }

  } catch (error) {
    console.error(`Error testing ${userType} appointments:`, error.message);
  }
}

async function tryLoginOptions(options, userType) {
  for (const credentials of options) {
    console.log(`Trying ${userType} login with: ${credentials.email}`);
    const token = await login(credentials);
    if (token) {
      console.log(`✓ Successfully logged in as ${userType}: ${credentials.email}`);
      return token;
    }
  }
  console.log(`❌ Could not login as any ${userType}`);
  return null;
}

async function main() {
  console.log('Testing Appointment Endpoints...');
  console.log('API Base:', API_BASE);

  // Test patient appointments
  const patientToken = await tryLoginOptions(PATIENT_OPTIONS, 'patient');
  if (patientToken) {
    await testAppointmentEndpoint(patientToken, 'PATIENT');
  }

  // Test doctor appointments  
  const doctorToken = await tryLoginOptions(DOCTOR_OPTIONS, 'doctor');
  if (doctorToken) {
    await testAppointmentEndpoint(doctorToken, 'DOCTOR');
  }
}

main().catch(console.error);
