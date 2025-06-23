#!/usr/bin/env node

const API_BASE = 'http://localhost:5000/api';

const DOCTOR_CREDENTIALS = {
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

async function debugDoctorAppointments() {
  console.log('🔍 Debugging Doctor Appointment Filtering...\n');
  
  const loginResult = await login(DOCTOR_CREDENTIALS);
  if (!loginResult || !loginResult.token) {
    console.log('❌ Could not login as doctor');
    return;
  }

  console.log('✅ Successfully logged in as doctor');
  console.log('Doctor User ID:', loginResult.user._id);
  console.log('Doctor Email:', loginResult.user.email);
  console.log('Doctor Role:', loginResult.user.role);
  console.log('');

  try {
    // Test /appointments endpoint
    console.log('🔍 Testing /appointments endpoint...');
    const appointmentsResponse = await fetch(`${API_BASE}/appointments`, {
      headers: {
        'Authorization': `Bearer ${loginResult.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (appointmentsResponse.ok) {
      const appointments = await appointmentsResponse.json();
      console.log(`✅ API returned ${appointments.length} appointments`);
      
      if (appointments.length > 0) {
        console.log('\n📋 Appointment details:');
        appointments.forEach((apt, index) => {
          console.log(`  ${index + 1}. ID: ${apt._id}`);
          console.log(`     Doctor ID: ${apt.doctor}`);
          console.log(`     Patient ID: ${apt.patient}`);
          console.log(`     Status: ${apt.status}`);
          console.log(`     Date: ${apt.date}`);
          console.log('');
        });
      } else {
        console.log('❌ No appointments found - this is the problem!');
      }
    } else {
      console.log(`❌ API call failed: ${appointmentsResponse.status}`);
      const error = await appointmentsResponse.text();
      console.log('Error:', error);
    }

    // Test /appointments/upcoming endpoint
    console.log('🔍 Testing /appointments/upcoming endpoint...');
    const upcomingResponse = await fetch(`${API_BASE}/appointments/upcoming`, {
      headers: {
        'Authorization': `Bearer ${loginResult.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (upcomingResponse.ok) {
      const upcoming = await upcomingResponse.json();
      console.log(`✅ Upcoming API returned ${upcoming.length} appointments`);
    } else {
      console.log(`❌ Upcoming API call failed: ${upcomingResponse.status}`);
    }

  } catch (error) {
    console.error('❌ Debug error:', error.message);
  }

  console.log('\n=== Analysis ===');
  console.log('The issue is likely that:');
  console.log('1. Backend is filtering by user._id (from JWT token)');
  console.log('2. Database appointments.doctor field contains User IDs');
  console.log('3. There might be a mismatch between these IDs');
  console.log('');
  console.log('Expected Doctor User ID:', loginResult.user._id);
  console.log('We need to check if this matches the doctor field in appointments');
}

debugDoctorAppointments().catch(console.error);
