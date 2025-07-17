#!/usr/bin/env node

import axios from 'axios';

const baseURL = 'http://localhost:5000/api';

async function createFreshTestUsers() {
  console.log('🔧 Creating Fresh Test Users');
  console.log('='.repeat(40));
  
  const timestamp = Date.now();
  const users = [
    {
      email: `fresh.patient.${timestamp}@example.com`,
      password: 'testpass123',
      profile: {
        firstName: 'Fresh',
        lastName: 'Patient'
      },
      role: 'patient'
    },
    {
      email: `fresh.doctor.${timestamp}@example.com`,
      password: 'testpass123',
      profile: {
        firstName: 'Dr. Fresh',
        lastName: 'Doctor',
        licenseNumber: `MD${timestamp}`,
        specialization: 'General Medicine'
      },
      role: 'doctor'
    }
  ];

  const createdUsers = [];

  for (const user of users) {
    try {
      console.log(`\n📝 Creating ${user.role}: ${user.email}`);
      const response = await axios.post(`${baseURL}/auth/register`, user);
      console.log(`✅ ${user.role} created successfully`);
      
      // Test immediate login
      const loginResponse = await axios.post(`${baseURL}/auth/login`, {
        email: user.email,
        password: user.password
      });
      
      if (loginResponse.data.success) {
        console.log(`✅ ${user.role} login verified`);
        createdUsers.push({
          role: user.role,
          email: user.email,
          password: user.password,
          token: loginResponse.data.data.token
        });
      }
    } catch (error) {
      console.log(`❌ Failed with ${user.role}:`, error.response?.data?.error || error.message);
    }
  }
  
  // Add the existing admin
  try {
    const adminLogin = await axios.post(`${baseURL}/auth/login`, {
      email: 'test.admin@example.com',
      password: 'password123'
    });
    
    if (adminLogin.data.success) {
      createdUsers.push({
        role: 'admin',
        email: 'test.admin@example.com',
        password: 'password123',
        token: adminLogin.data.data.token
      });
      console.log('✅ Admin login verified');
    }
  } catch (error) {
    console.log('❌ Admin login failed:', error.response?.data || error.message);
  }
  
  console.log('\n🎯 RUNNING QUICK FUNCTIONALITY TEST');
  console.log('='.repeat(40));
  
  for (const user of createdUsers) {
    console.log(`\n🔍 Testing ${user.role.toUpperCase()} features:`);
    
    // Test appointments
    try {
      const appointments = await axios.get(`${baseURL}/appointments`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      console.log(`  ✅ Appointments: ${appointments.data.data?.length || 0} found`);
    } catch (error) {
      console.log(`  ❌ Appointments failed: ${error.response?.status}`);
    }
    
    // Test role-specific endpoints
    if (user.role === 'patient') {
      try {
        const doctors = await axios.get(`${baseURL}/doctors`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        console.log(`  ✅ Doctor listing: ${doctors.data.data?.length || 0} doctors`);
      } catch (error) {
        console.log(`  ❌ Doctor listing failed: ${error.response?.status}`);
      }
    }
    
    if (user.role === 'doctor') {
      try {
        const profile = await axios.get(`${baseURL}/doctors/profile`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        console.log(`  ✅ Doctor profile accessible`);
      } catch (error) {
        console.log(`  ❌ Doctor profile failed: ${error.response?.status}`);
      }
    }
    
    if (user.role === 'admin') {
      try {
        const users = await axios.get(`${baseURL}/admin/users`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        console.log(`  ✅ User management: ${users.data.length || 0} users`);
      } catch (error) {
        console.log(`  ❌ User management failed: ${error.response?.status}`);
      }
    }
  }
  
  console.log('\n📋 FRESH TEST CREDENTIALS:');
  console.log('='.repeat(40));
  createdUsers.forEach(user => {
    console.log(`${user.role.toUpperCase()}: ${user.email} / ${user.password}`);
  });
  
  console.log(`\n🎉 Created ${createdUsers.length}/3 working test accounts!`);
}

createFreshTestUsers().catch(console.error);
