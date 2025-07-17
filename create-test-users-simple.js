#!/usr/bin/env node

import axios from 'axios';

const baseURL = 'http://localhost:5000/api';

async function createTestUsers() {
  console.log('🔧 Creating Test Users for Functional Tests');
  console.log('='.repeat(50));
  
  const users = [
    {
      email: 'test.patient@example.com',
      password: 'password123',
      profile: {
        firstName: 'Test',
        lastName: 'Patient'
      },
      role: 'patient'
    },
    {
      email: 'test.doctor@example.com',
      password: 'password123',
      profile: {
        firstName: 'Dr. Test',
        lastName: 'Doctor',
        licenseNumber: 'MD123456',
        specialization: 'General Medicine'
      },
      role: 'doctor'
    },
    {
      email: 'test.admin@example.com',
      password: 'password123',
      profile: {
        firstName: 'Test',
        lastName: 'Admin'
      },
      role: 'admin'
    }
  ];

  for (const user of users) {
    try {
      console.log(`\n📝 Creating ${user.role}: ${user.email}`);
      const response = await axios.post(`${baseURL}/auth/register`, user);
      console.log(`✅ ${user.role} created successfully`);
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('duplicate')) {
        console.log(`⚠️ ${user.role} already exists: ${user.email}`);
        
        // Test login
        try {
          const loginResponse = await axios.post(`${baseURL}/auth/login`, {
            email: user.email,
            password: user.password
          });
          console.log(`✅ ${user.role} login verified`);
        } catch (loginError) {
          console.log(`❌ ${user.role} login failed:`, loginError.response?.data || loginError.message);
        }
      } else {
        console.log(`❌ Failed to create ${user.role}:`, error.response?.data || error.message);
      }
    }
  }
  
  console.log('\n✅ Test user creation completed!');
  console.log('\n📋 Test Credentials:');
  users.forEach(user => {
    console.log(`${user.role.toUpperCase()}: ${user.email} / ${user.password}`);
  });
}

createTestUsers().catch(console.error);
