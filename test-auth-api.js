import axios from 'axios';

async function testAuthAPI() {
    const baseURL = 'http://localhost:5000/api';
    
    console.log('🔍 Testing Authentication API...\n');
    
    try {
        // Test 1: Register a new user
        console.log('1️⃣ Testing user registration...');
        const registerData = {
            email: 'testuser@example.com',
            password: 'password123',
            profile: {
                firstName: 'Test',
                lastName: 'User'
            },
            role: 'patient'
        };
        
        const registerResponse = await axios.post(`${baseURL}/auth/register`, registerData);
        console.log('✅ Registration response format:', JSON.stringify(registerResponse.data, null, 2));
        
        // Test 2: Login with the user
        console.log('\n2️⃣ Testing user login...');
        const loginData = {
            email: 'testuser@example.com',
            password: 'password123'
        };
        
        const loginResponse = await axios.post(`${baseURL}/auth/login`, loginData);
        console.log('✅ Login response format:', JSON.stringify(loginResponse.data, null, 2));
        
        // Test 3: Verify the response structure
        const { success, data } = loginResponse.data;
        if (success && data && data.user && data.token) {
            console.log('\n🎉 Perfect! Backend returns the correct format:');
            console.log(`   - success: ${success}`);
            console.log(`   - data.user: ${JSON.stringify(data.user)}`);
            console.log(`   - data.token: ${data.token ? 'Present' : 'Missing'}`);
        } else {
            console.log('\n❌ Backend response format issue detected!');
            console.log('Expected: {success: true, data: {user: {...}, token: "..."}}');
            console.log('Received:', JSON.stringify(loginResponse.data, null, 2));
        }
        
    } catch (error) {
        console.error('❌ Error testing auth API:', error.response?.data || error.message);
    }
}

testAuthAPI();
