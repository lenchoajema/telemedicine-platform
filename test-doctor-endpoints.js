import fetch from 'node-fetch';

async function loginAsDoctor(attempts = 0) {
  try {
    // Limit to 3 attempts to avoid infinite loops
    if (attempts >= 3) {
      console.log('Maximum login attempts reached. Giving up.');
      return null;
    }
    
    // Try logging in with test user
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

    const loginData = await loginResponse.json();
    console.log('Login successful');
    return loginData.token;
  } catch (error) {
    console.error('Error during login:', error.message);
    return null;
  }
}

async function createTestDoctor() {
  try {
    // Register a test doctor
    const registerResponse = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: "doctor@example.com",
        password: "password123",
        confirmPassword: "password123",
        profile: {
          firstName: "Test",
          lastName: "Doctor",
          dateOfBirth: "1990-01-01",
          specialization: "General Medicine",
          licenseNumber: "MD12345"
        },
        role: "doctor"
      })
    });
    
    const registerData = await registerResponse.json();
    console.log('Doctor registration result:', registerData);
    return registerData;
  } catch (error) {
    console.error('Error creating test doctor:', error.message);
  }
}

async function testDoctorStats(token) {
  try {
    console.log('\nTesting /doctors/stats endpoint...');
    const response = await fetch('http://localhost:5000/api/doctors/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error testing doctor stats:', error.message);
  }
}

async function testDoctorProfile(token) {
  try {
    console.log('\nTesting /doctors/profile endpoint...');
    const response = await fetch('http://localhost:5000/api/doctors/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error testing doctor profile:', error.message);
  }
}

// Run the tests
async function runTests() {
  const token = await loginAsDoctor();
  if (!token) {
    console.error('Could not obtain authentication token. Tests aborted.');
    return;
  }
  
  await testDoctorStats(token);
  await testDoctorProfile(token);
}

runTests();
