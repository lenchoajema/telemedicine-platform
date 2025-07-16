import axios from 'axios';

async function testLoginFlow() {
    const baseURL = 'http://localhost:5000/api';
    
    console.log('🔍 Testing Login Flow...\n');
    
    try {
        // Clean up any existing test user first
        console.log('🧹 Cleaning up test user...');
        try {
            await axios.delete(`${baseURL}/auth/user/testuser@example.com`);
        } catch (cleanupError) {
            // Ignore cleanup errors - user might not exist
        }
        
        // Test 1: Register a new user with correct profile structure
        console.log('1️⃣ Creating test user...');
        const timestamp = Date.now();
        const registerData = {
            email: `testuser${timestamp}@example.com`,
            password: 'password123',
            profile: {
                firstName: 'Test',
                lastName: 'User'
            },
            role: 'patient'
        };
        
        const registerResponse = await axios.post(`${baseURL}/auth/register`, registerData);
        
        if (registerResponse.status === 201 || registerResponse.status === 200) {
            console.log('✅ User registered successfully');
            console.log('Response format:', JSON.stringify(registerResponse.data, null, 2));
        } else {
            console.log('❌ Registration failed with status:', registerResponse.status);
            return;
        }
        
        // Test 2: Login with the user
        console.log('\n2️⃣ Testing login...');
        const loginData = {
            email: `testuser${timestamp}@example.com`,
            password: 'password123'
        };
        
        const loginResponse = await axios.post(`${baseURL}/auth/login`, loginData);
        console.log('✅ Login successful!');
        console.log('Login response format:', JSON.stringify(loginResponse.data, null, 2));
        
        // Test 3: Verify the response structure for mobile app compatibility
        const { success, data } = loginResponse.data;
        if (success && data && data.user && data.token) {
            console.log('\n🎉 Perfect! Backend returns the correct format for mobile app:');
            console.log(`   - success: ${success}`);
            console.log(`   - data.user.profile.firstName: ${data.user.profile?.firstName}`);
            console.log(`   - data.user.profile.lastName: ${data.user.profile?.lastName}`);
            console.log(`   - data.user.email: ${data.user.email}`);
            console.log(`   - data.user.role: ${data.user.role}`);
            console.log(`   - data.token: ${data.token ? 'Present ✅' : 'Missing ❌'}`);
            
            // Test 4: Verify mobile app can extract the data correctly
            console.log('\n📱 Mobile app data extraction test:');
            const { user, token } = data;
            if (user && token) {
                console.log('✅ Mobile app will successfully extract:');
                console.log(`   - User: ${user.profile?.firstName} ${user.profile?.lastName}`);
                console.log(`   - Token: ${token.substring(0, 20)}...`);
            } else {
                console.log('❌ Mobile app will fail - missing user or token data');
            }
        } else {
            console.log('\n❌ Backend response format issue detected!');
            console.log('Expected: {success: true, data: {user: {...}, token: "..."}}');
            console.log('Received:', JSON.stringify(loginResponse.data, null, 2));
        }
        
    } catch (error) {
        if (error.response) {
            console.error('❌ Registration error:', error.response.data);
            console.log('Status:', error.response.status);
            console.log('Headers:', error.response.headers);
        } else {
            console.error('❌ Error during login flow test:', error.message);
        }
    }
}

testLoginFlow();
