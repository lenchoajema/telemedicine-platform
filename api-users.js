#!/usr/bin/env node

// Get users via API instead of direct MongoDB connection
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function getUsers() {
  try {
    console.log('🚀 Fetching users from API...');
    
    // First, check if the API is running
    console.log('🏥 Checking API health...');
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    
    if (!healthResponse.ok) {
      throw new Error(`API not responding: ${healthResponse.status}`);
    }
    
    const healthData = await healthResponse.json();
    console.log('✅ API is healthy:', healthData);
    
    // Try to get users through admin endpoint (this might require auth)
    console.log('\\n👥 Attempting to fetch users...');
    
    // First try without auth to see what happens
    const usersResponse = await fetch(`${BASE_URL}/api/admin/users`);
    
    if (usersResponse.status === 401) {
      console.log('🔐 Admin endpoint requires authentication');
      console.log('\\n💡 To get user list, you need to:');
      console.log('   1. Create an admin user');
      console.log('   2. Login as admin to get token');
      console.log('   3. Use token to access admin endpoints');
      
      // Let's try a different approach - check if there are any public endpoints
      console.log('\\n🔍 Checking for public user endpoints...');
      
      // Try doctors endpoint (might be public)
      const doctorsResponse = await fetch(`${BASE_URL}/api/doctors`);
      if (doctorsResponse.ok) {
        const doctors = await doctorsResponse.json();
        console.log('\\n👨‍⚕️ Found doctors:', doctors.length || 0);
        if (doctors.length > 0) {
          doctors.forEach((doctor, index) => {
            console.log(`   ${index + 1}. ${doctor.profile?.firstName || ''} ${doctor.profile?.lastName || ''} (${doctor.email})`);
            if (doctor.profile?.specialization) {
              console.log(`      Specialization: ${doctor.profile.specialization}`);
            }
          });
        }
      }
      
      return;
    }
    
    if (!usersResponse.ok) {
      throw new Error(`Failed to fetch users: ${usersResponse.status} ${usersResponse.statusText}`);
    }
    
    const users = await usersResponse.json();
    console.log('\\n' + '='.repeat(80));
    console.log('👥 USER LIST (' + users.length + ' users found)');
    console.log('='.repeat(80));
    
    if (users.length === 0) {
      console.log('No users found.');
    } else {
      console.log('EMAIL'.padEnd(30) + 'ROLE'.padEnd(15) + 'NAME'.padEnd(25) + 'STATUS');
      console.log('-'.repeat(80));
      
      users.forEach(user => {
        const email = user.email.padEnd(30);
        const role = (user.role || 'unknown').padEnd(15);
        const name = `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim().padEnd(25);
        const status = user.status || 'active';
        
        console.log(`${email}${role}${name}${status}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\\n🔧 Troubleshooting:');
    console.log('   1. Make sure the backend is running on port 5000');
    console.log('   2. Check if Docker containers are up');
    console.log('   3. Verify API endpoints are accessible');
  }
}

// Also create a simple test user registration
async function createTestUser() {
  try {
    console.log('\\n🧪 Creating test user...');
    
    const testUser = {
      email: 'test-patient@example.com',
      password: 'password123',
      role: 'patient',
      profile: {
        firstName: 'Test',
        lastName: 'Patient'
      }
    };
    
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Test user created successfully:', result.user?.email);
    } else {
      console.log('⚠️  Test user creation failed:', result.error);
      if (result.error?.includes('duplicate') || result.error?.includes('exists')) {
        console.log('   (User already exists - that\'s okay!)');
      }
    }
    
  } catch (error) {
    console.log('❌ Error creating test user:', error.message);
  }
}

console.log('🔍 Starting User Discovery...');
getUsers()
  .then(() => createTestUser())
  .catch(console.error);
