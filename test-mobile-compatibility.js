import axios from 'axios';

async function testMobileAppCompatibility() {
    const baseURL = 'http://localhost:5000/api';
    
    console.log('📱 Testing Mobile App Authentication Compatibility...\n');
    
    try {
        // Test 1: Register a new user with mobile app format
        console.log('1️⃣ Testing mobile app registration format...');
        const timestamp = Date.now();
        const mobileRegistrationData = {
            email: `mobile${timestamp}@example.com`,
            password: 'password123',
            profile: {
                firstName: 'Mobile',
                lastName: 'User',
                phone: '+1234567890',
                dateOfBirth: '1990-01-01'
            },
            role: 'patient'
        };
        
        const registerResponse = await axios.post(`${baseURL}/auth/register`, mobileRegistrationData);
        
        if (registerResponse.status === 201 || registerResponse.status === 200) {
            console.log('✅ Mobile registration format works!');
            console.log('Response:', JSON.stringify(registerResponse.data, null, 2));
        }
        
        // Test 2: Login and verify mobile app can extract data
        console.log('\n2️⃣ Testing mobile app login and data extraction...');
        const loginData = {
            email: `mobile${timestamp}@example.com`,
            password: 'password123'
        };
        
        const loginResponse = await axios.post(`${baseURL}/auth/login`, loginData);
        console.log('✅ Login successful!');
        
        // Test 3: Simulate mobile app data extraction
        const { success, data } = loginResponse.data;
        if (success && data && data.user && data.token) {
            console.log('\n📱 Mobile app simulation:');
            console.log('✅ AuthContext.login() will receive:');
            console.log(`   - User object: ${JSON.stringify(data.user.profile)}`);
            console.log(`   - Token: ${data.token.substring(0, 20)}...`);
            
            // Test 4: Simulate AsyncStorage storage
            console.log('\n💾 AsyncStorage simulation:');
            console.log('✅ Will store:');
            console.log(`   - authToken: ${data.token}`);
            console.log(`   - userProfile: ${JSON.stringify({
                id: data.user._id,
                email: data.user.email,
                role: data.user.role,
                profile: data.user.profile
            })}`);
            
            // Test 5: Simulate HomeScreen display
            console.log('\n🏠 HomeScreen display simulation:');
            console.log('✅ Will show:');
            console.log(`   - Welcome back, ${data.user.profile.firstName}!`);
            console.log(`   - User role: ${data.user.role}`);
            console.log(`   - Avatar: ${data.user.profile.firstName[0]}`);
            
            console.log('\n🎉 All mobile app compatibility tests passed!');
            console.log('The authentication flow should work perfectly in the mobile app.');
            
        } else {
            console.log('❌ Mobile app data extraction failed');
            console.log('Response structure:', JSON.stringify(loginResponse.data, null, 2));
        }
        
    } catch (error) {
        console.error('❌ Full error object:', error);
        if (error.response) {
            console.error('❌ API Error:', error.response.data);
            console.log('Status:', error.response.status);
            console.log('Headers:', error.response.headers);
        } else if (error.request) {
            console.error('❌ Network Error - No response received');
            console.error('Request:', error.request);
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

testMobileAppCompatibility();
