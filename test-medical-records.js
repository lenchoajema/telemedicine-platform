// Test medical records endpoint
const apiUrl = 'http://localhost:5000/api';

async function testMedicalRecords() {
  try {
    // First, login to get a token
    const loginResponse = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'patient1@example.com',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error('Login failed');
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;

    console.log('Login successful, testing medical records...');

    // Test medical records endpoint
    const recordsResponse = await fetch(`${apiUrl}/medical-records`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!recordsResponse.ok) {
      throw new Error(`Medical records request failed: ${recordsResponse.status}`);
    }

    const recordsData = await recordsResponse.json();
    console.log('Medical records response:', JSON.stringify(recordsData, null, 2));
    
    // Check the structure
    if (recordsData.records) {
      console.log(`Found ${recordsData.records.length} medical records`);
    } else if (Array.isArray(recordsData)) {
      console.log(`Found ${recordsData.length} medical records (direct array)`);
    } else {
      console.log('Unexpected response format:', typeof recordsData);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testMedicalRecords();
