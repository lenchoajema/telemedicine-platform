import axios from 'axios';

async function createFrontendTestUser() {
    const baseURL = 'http://localhost:5000/api';
    
    console.log('🌐 Creating Frontend Test User...\n');
    
    try {
        // Create a user with proper profile structure for frontend testing
        const timestamp = Date.now();
        const userData = {
            email: `frontend${timestamp}@example.com`,
            password: 'password123',
            profile: {
                firstName: 'Frontend',
                lastName: 'Tester',
            },
            role: 'patient'
        };
        
        console.log('1️⃣ Registering frontend test user...');
        const registerResponse = await axios.post(`${baseURL}/auth/register`, userData);
        
        if (registerResponse.status === 201 || registerResponse.status === 200) {
            console.log('✅ Frontend test user created successfully!');
            console.log('User details:', {
                email: userData.email,
                password: userData.password,
                role: userData.role,
                name: `${userData.profile.firstName} ${userData.profile.lastName}`
            });
            
            console.log('\n📝 Frontend Test Instructions:');
            console.log('1. Open http://localhost:3000 in browser');
            console.log('2. Click "Sign In" to go to login page');
            console.log('3. Use these credentials:');
            console.log(`   Email: ${userData.email}`);
            console.log(`   Password: ${userData.password}`);
            console.log('4. After login, should navigate to patient dashboard');
            console.log('5. Check browser console for debugging info');
            
            console.log('\n🎯 Expected Frontend Behavior:');
            console.log('- Login successful message');
            console.log('- Navigation to /dashboard');
            console.log('- PatientDashboardPage displays');
            console.log(`- Welcome message shows: "Welcome, ${userData.profile.firstName}!"`);
            
        } else {
            console.log('❌ Registration failed with status:', registerResponse.status);
        }
        
    } catch (error) {
        if (error.response) {
            console.error('❌ Registration error:', error.response.data);
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

createFrontendTestUser();
