#!/usr/bin/env node

import axios from 'axios';

async function testAPI() {
  const baseURL = 'http://localhost:5000/api';
  
  console.log('🔧 Testing API Endpoints');
  console.log('='.repeat(30));
  
  // Test health endpoint
  try {
    const health = await axios.get(`${baseURL}/health`);
    console.log('✅ Health endpoint:', health.data);
  } catch (error) {
    console.log('❌ Health endpoint failed:', error.message);
    return;
  }
  
  // Test patient registration
  try {
    const patientData = {
      email: `test.patient.${Date.now()}@example.com`,
      password: 'password123',
      profile: {
        firstName: 'Test',
        lastName: 'Patient'
      },
      role: 'patient'
    };
    
    console.log('\n📝 Registering patient:', patientData.email);
    const regResponse = await axios.post(`${baseURL}/auth/register`, patientData);
    console.log('✅ Patient registration successful');
    console.log('Response:', regResponse.data);
    
    // Test login
    console.log('\n🔑 Testing login...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: patientData.email,
      password: patientData.password
    });
    console.log('✅ Login successful');
    console.log('Response:', loginResponse.data);
    
    // Test protected endpoint
    const token = loginResponse.data.data?.token || loginResponse.data.token;
    if (token) {
      console.log('\n🔒 Testing protected endpoint...');
      const protectedResponse = await axios.get(`${baseURL}/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Protected endpoint accessible');
      console.log('Appointments:', protectedResponse.data);
    }
    
  } catch (error) {
    console.log('❌ Registration/Login failed:');
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
    console.log('Message:', error.message);
  }
}

testAPI().catch(console.error);
