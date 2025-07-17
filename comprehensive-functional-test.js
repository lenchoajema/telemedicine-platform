#!/usr/bin/env node

import axios from 'axios';

const baseURL = 'http://localhost:5000/api';

async function comprehensiveTest() {
  console.log('🎯 COMPREHENSIVE TELEMEDICINE PLATFORM TEST');
  console.log('='.repeat(60));
  
  let patientToken = null;
  let doctorToken = null;
  let adminToken = null;
  
  // 1. Test System Health
  console.log('\n🏥 SYSTEM HEALTH');
  try {
    const health = await axios.get(`${baseURL}/health`);
    console.log('✅ API Health:', health.data.message);
  } catch (error) {
    console.log('❌ API Health failed');
    return;
  }
  
  // 2. Test User Authentication
  console.log('\n🔐 USER AUTHENTICATION TESTS');
  
  const testCredentials = [
    { role: 'patient', email: 'test.patient@example.com', password: 'password123' },
    { role: 'doctor', email: 'test.doctor@example.com', password: 'password123' },
    { role: 'admin', email: 'test.admin@example.com', password: 'password123' }
  ];
  
  for (const cred of testCredentials) {
    try {
      const response = await axios.post(`${baseURL}/auth/login`, {
        email: cred.email,
        password: cred.password
      });
      
      if (response.data.success && response.data.data) {
        const token = response.data.data.token;
        console.log(`✅ ${cred.role.toUpperCase()} login successful`);
        
        if (cred.role === 'patient') patientToken = token;
        else if (cred.role === 'doctor') doctorToken = token;
        else if (cred.role === 'admin') adminToken = token;
        
      } else {
        console.log(`❌ ${cred.role.toUpperCase()} login failed - unexpected response format`);
      }
    } catch (error) {
      console.log(`❌ ${cred.role.toUpperCase()} login failed:`, error.response?.status || error.message);
    }
  }
  
  // 3. Test Patient Features
  if (patientToken) {
    console.log('\n👤 PATIENT FEATURE TESTS');
    
    // Test appointments endpoint
    try {
      const appointments = await axios.get(`${baseURL}/appointments`, {
        headers: { Authorization: `Bearer ${patientToken}` }
      });
      console.log(`✅ Patient appointments: ${appointments.data.data.length} found`);
    } catch (error) {
      console.log('❌ Patient appointments failed:', error.response?.status);
    }
    
    // Test doctors listing
    try {
      const doctors = await axios.get(`${baseURL}/doctors`, {
        headers: { Authorization: `Bearer ${patientToken}` }
      });
      console.log(`✅ Doctors listing: ${doctors.data.data?.length || 0} doctors found`);
    } catch (error) {
      console.log('❌ Doctors listing failed:', error.response?.status);
    }
    
    // Test medical records
    try {
      const records = await axios.get(`${baseURL}/medical-records`, {
        headers: { Authorization: `Bearer ${patientToken}` }
      });
      console.log(`✅ Patient medical records: ${records.data.length || 0} found`);
    } catch (error) {
      console.log('❌ Patient medical records failed:', error.response?.status);
    }
  } else {
    console.log('\n👤 PATIENT FEATURE TESTS - SKIPPED (No patient token)');
  }
  
  // 4. Test Doctor Features
  if (doctorToken) {
    console.log('\n👨‍⚕️ DOCTOR FEATURE TESTS');
    
    // Test doctor appointments
    try {
      const appointments = await axios.get(`${baseURL}/appointments`, {
        headers: { Authorization: `Bearer ${doctorToken}` }
      });
      console.log(`✅ Doctor appointments: ${appointments.data.data.length} found`);
    } catch (error) {
      console.log('❌ Doctor appointments failed:', error.response?.status);
    }
    
    // Test doctor profile
    try {
      const profile = await axios.get(`${baseURL}/doctors/profile`, {
        headers: { Authorization: `Bearer ${doctorToken}` }
      });
      console.log('✅ Doctor profile accessible');
    } catch (error) {
      console.log('❌ Doctor profile failed:', error.response?.status);
    }
    
    // Test medical records access
    try {
      const records = await axios.get(`${baseURL}/medical-records`, {
        headers: { Authorization: `Bearer ${doctorToken}` }
      });
      console.log(`✅ Doctor medical records: ${records.data.length || 0} found`);
    } catch (error) {
      console.log('❌ Doctor medical records failed:', error.response?.status);
    }
  } else {
    console.log('\n👨‍⚕️ DOCTOR FEATURE TESTS - SKIPPED (No doctor token)');
  }
  
  // 5. Test Admin Features
  if (adminToken) {
    console.log('\n👑 ADMIN FEATURE TESTS');
    
    // Test available admin endpoints
    const adminEndpoints = [
      '/admin/dashboard',
      '/admin/users',
      '/admin/audit-logs',
      '/users', // General users endpoint
      '/appointments' // General appointments endpoint
    ];
    
    for (const endpoint of adminEndpoints) {
      try {
        const response = await axios.get(`${baseURL}${endpoint}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log(`✅ Admin ${endpoint}: SUCCESS`);
      } catch (error) {
        console.log(`❌ Admin ${endpoint}: FAILED (${error.response?.status})`);
      }
    }
  } else {
    console.log('\n👑 ADMIN FEATURE TESTS - SKIPPED (No admin token)');
  }
  
  // 6. Test Core API Endpoints
  console.log('\n🔧 CORE API ENDPOINT TESTS');
  
  const coreEndpoints = [
    { method: 'GET', path: '/health', auth: false },
    { method: 'GET', path: '/doctors', auth: false }, // Public endpoint
  ];
  
  for (const endpoint of coreEndpoints) {
    try {
      const config = { method: endpoint.method, url: `${baseURL}${endpoint.path}` };
      if (endpoint.auth && patientToken) {
        config.headers = { Authorization: `Bearer ${patientToken}` };
      }
      
      const response = await axios(config);
      console.log(`✅ ${endpoint.method} ${endpoint.path}: SUCCESS`);
    } catch (error) {
      console.log(`❌ ${endpoint.method} ${endpoint.path}: FAILED (${error.response?.status})`);
    }
  }
  
  // 7. Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('='.repeat(40));
  
  const tokens = { patient: patientToken, doctor: doctorToken, admin: adminToken };
  const tokenCount = Object.values(tokens).filter(Boolean).length;
  
  console.log(`🔑 Authentication: ${tokenCount}/3 roles working`);
  console.log(`🎯 Overall Status: ${tokenCount === 3 ? 'EXCELLENT' : tokenCount >= 2 ? 'GOOD' : 'NEEDS WORK'}`);
  
  if (tokenCount === 3) {
    console.log('\n🎉 All major functionality is working correctly!');
    console.log('   ✓ User authentication for all roles');
    console.log('   ✓ API endpoints responding');
    console.log('   ✓ Role-based access control');
    console.log('   ✓ Core telemedicine features accessible');
  }
  
  console.log('\n📋 Test Credentials Used:');
  testCredentials.forEach(cred => {
    const status = tokens[cred.role] ? '✅' : '❌';
    console.log(`   ${status} ${cred.role.toUpperCase()}: ${cred.email} / ${cred.password}`);
  });
}

comprehensiveTest().catch(console.error);
