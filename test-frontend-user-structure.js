import axios from 'axios';

async function testFrontendUserStructure() {
    const baseURL = 'http://localhost:5000/api';
    
    console.log('🌐 Testing Frontend User Structure...\n');
    
    try {
        // Use the successful user from our previous test
        const loginData = {
            email: 'testuser1752501158654@example.com', // From our successful test
            password: 'password123'
        };
        
        const loginResponse = await axios.post(`${baseURL}/auth/login`, loginData);
        console.log('Backend response structure:', JSON.stringify(loginResponse.data, null, 2));
        
        // Extract what the frontend AuthContext will receive
        const backendResponse = loginResponse.data;
        const user = backendResponse.success ? backendResponse.data.user : backendResponse.user;
        const token = backendResponse.success ? backendResponse.data.token : backendResponse.token;
        
        console.log('\n🔍 What frontend AuthContext will extract:');
        console.log('User object:', JSON.stringify(user, null, 2));
        console.log('Token:', token ? 'Present' : 'Missing');
        console.log('User role:', user?.role);
        console.log('User profile:', user?.profile);
        
        // Check if user structure is compatible with dashboard
        if (user?.role) {
            console.log('\n✅ Dashboard routing will work for role:', user.role);
        } else {
            console.log('\n❌ Missing user.role - dashboard routing will fail');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testFrontendUserStructure();
