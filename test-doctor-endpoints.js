#!/usr/bin/env node

// Comprehensive test for doctor endpoints
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
let authToken = '';

// Test data
const testDoctor = {
  email: 'doctor@test.com',
  password: 'password123',
  role: 'doctor',
  profile: {
    firstName: 'Dr. John',
    lastName: 'Smith',
    specialization: 'Cardiology',
    licenseNumber: 'DOC123456'
  }
};

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken ? `Bearer ${authToken}` : '',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { status: response.status, data, ok: response.ok };
  } catch (error) {
    return { status: 0, data: { error: error.message }, ok: false };
  }
}

async function loginAsDoctor(attempts = 0) {
  try {
    // Limit to 3 attempts to avoid infinite loops
    if (attempts >= 3) {
      console.log('Maximum login attempts reached. Giving up.');
      return null;
    }
    
    // Try logging in with test user
    const loginResponse = await makeRequest(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ 
        email: "doctor@example.com", 
        password: "password123" 
      })
    });

    if (!loginResponse.ok) {
      console.log('Login failed - creating test doctor...');
      await createTestDoctor();
      return loginAsDoctor(attempts + 1); // Try again after creating the user
    }

    console.log('Login successful');
    authToken = loginResponse.data.token;
    return loginResponse.data.token;
  } catch (error) {
    console.error('Error during login:', error.message);
    return null;
  }
}

async function createTestDoctor() {
  try {
    console.log('Creating test doctor...');
    const result = await makeRequest(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      body: JSON.stringify({
        email: "doctor@example.com",
        password: "password123",
        profile: {
          firstName: "Test",
          lastName: "Doctor",
          specialization: "General Medicine",
          licenseNumber: "MD12345"
        },
        role: "doctor"
      })
    });
    
    console.log('Doctor registration result:', result.status, result.ok ? '✅' : '❌');
    if (result.data.error) console.log('Error:', result.data.error);
    return result;
  } catch (error) {
    console.error('Error creating test doctor:', error.message);
  }
}

async function testDoctorEndpoints() {
  console.log('\n🧪 Testing Doctor Endpoints');
  console.log('===========================');
  
  // Health check first
  console.log('Testing health endpoint...');
  const health = await makeRequest(`${BASE_URL}/api/health`);
  console.log(`Health: ${health.status}`, health.ok ? '✅' : '❌');
  
  if (!health.ok) {
    console.log('Backend not healthy, stopping tests');
    return;
  }
  
  // Try to login or create doctor
  const token = await loginAsDoctor();
  if (!token) {
    console.log('Failed to get authentication token');
    return;
  }
  
  // Test doctor stats
  console.log('\nTesting /api/doctors/stats endpoint...');
  const statsResult = await makeRequest(`${BASE_URL}/api/doctors/stats`);
  console.log(`Stats: ${statsResult.status}`, statsResult.ok ? '✅' : '❌');
  if (statsResult.data) console.log('Data:', statsResult.data);
  
  // Test get all doctors
  console.log('\nTesting /api/doctors endpoint...');
  const doctorsResult = await makeRequest(`${BASE_URL}/api/doctors`);
  console.log(`Doctors list: ${doctorsResult.status}`, doctorsResult.ok ? '✅' : '❌');
  if (doctorsResult.data) {
    console.log(`Found ${doctorsResult.data.length || 0} doctors`);
  }
  
  // Test doctor search
  console.log('\nTesting /api/doctors/search endpoint...');
  const searchResult = await makeRequest(`${BASE_URL}/api/doctors/search?specialization=General Medicine`);
  console.log(`Search: ${searchResult.status}`, searchResult.ok ? '✅' : '❌');
  
  // Test current user profile
  console.log('\nTesting /api/auth/me endpoint...');
  const meResult = await makeRequest(`${BASE_URL}/api/auth/me`);
  console.log(`Profile: ${meResult.status}`, meResult.ok ? '✅' : '❌');
  if (meResult.data?.user) {
    console.log(`User: ${meResult.data.user.profile?.firstName} ${meResult.data.user.profile?.lastName} (${meResult.data.user.role})`);
  }
  
  console.log('\n🏁 Doctor endpoints testing completed!');
}

testDoctorEndpoints().catch(console.error);
