#!/usr/bin/env node

import axios from 'axios';

const baseURL = 'http://localhost:5000/api';

async function testRegistration() {
  console.log('Testing user registration...');
  
  try {
    const response = await axios.post(`${baseURL}/auth/register`, {
      email: 'test.patient.new@example.com',
      password: 'password123',
      profile: {
        firstName: 'Test',
        lastName: 'Patient'
      },
      role: 'patient'
    });
    
    console.log('✅ Registration successful:', response.data);
  } catch (error) {
    console.log('❌ Registration failed:');
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
    console.log('Message:', error.message);
  }
}

async function testLogin() {
  console.log('\nTesting user login...');
  
  try {
    const response = await axios.post(`${baseURL}/auth/login`, {
      email: 'test.patient.new@example.com',
      password: 'password123'
    });
    
    console.log('✅ Login successful:', response.data);
  } catch (error) {
    console.log('❌ Login failed:');
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
    console.log('Message:', error.message);
  }
}

async function runQuickTest() {
  console.log('🔧 Quick Authentication Test');
  console.log('='.repeat(30));
  
  await testRegistration();
  await testLogin();
}

runQuickTest().catch(console.error);
