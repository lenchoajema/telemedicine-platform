#!/usr/bin/env node

// Test script to verify backend functionality
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

// Test health endpoint
async function testHealth() {
  try {
    console.log('Testing health endpoint...');
    const response = await fetch(`${BASE_URL}/api/health`);
    const data = await response.json();
    console.log('Health check:', data);
    return true;
  } catch (error) {
    console.error('Health check failed:', error.message);
    return false;
  }
}

// Test registration
async function testRegistration() {
  try {
    console.log('\nTesting registration...');
    const testUser = {
      email: 'test@example.com',
      password: 'password123',
      role: 'patient',
      profile: {
        firstName: 'Test',
        lastName: 'User'
      }
    };
    
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });
    
    const data = await response.json();
    console.log('Registration response:', response.status, data);
    return { success: response.ok, data };
  } catch (error) {
    console.error('Registration failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Test login
async function testLogin() {
  try {
    console.log('\nTesting login...');
    const credentials = {
      email: 'test@example.com',
      password: 'password123'
    };
    
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    
    const data = await response.json();
    console.log('Login response:', response.status, data);
    return { success: response.ok, data };
  } catch (error) {
    console.error('Login failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Main test function
async function runTests() {
  console.log('Starting backend tests...\n');
  
  // Wait a moment for services to be ready
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const healthOk = await testHealth();
  if (!healthOk) {
    console.log('Backend not healthy, exiting...');
    process.exit(1);
  }
  
  const registration = await testRegistration();
  const login = await testLogin();
  
  console.log('\n=== Test Summary ===');
  console.log('Health:', healthOk ? 'PASS' : 'FAIL');
  console.log('Registration:', registration.success ? 'PASS' : 'FAIL');
  console.log('Login:', login.success ? 'PASS' : 'FAIL');
}

runTests().catch(console.error);
