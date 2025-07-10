import http from 'http';

console.log('🔐 Testing Password Encryption and Login...');
console.log('==========================================');

// Test user creation and login
async function testPasswordFunctionality() {
    console.log('\n1. Testing User Registration...');
    
    // Register a new test user
    const registrationData = {
        email: 'passwordtest@example.com',
        password: 'testpassword123',
        role: 'patient',
        profile: {
            firstName: 'Password',
            lastName: 'Test'
        }
    };
    
    const registerResponse = await makeRequest('POST', '/api/auth/register', registrationData);
    console.log('Registration result:', registerResponse.success ? '✅ SUCCESS' : '❌ FAILED');
    
    if (registerResponse.success) {
        console.log('\n2. Testing Login with Same Password...');
        
        // Try to login with the same credentials
        const loginData = {
            email: 'passwordtest@example.com',
            password: 'testpassword123'
        };
        
        const loginResponse = await makeRequest('POST', '/api/auth/login', loginData);
        console.log('Login result:', loginResponse.success ? '✅ SUCCESS' : '❌ FAILED');
        
        if (loginResponse.success) {
            console.log('🎉 Password encryption and login working correctly!');
        } else {
            console.log('❌ Password login failed - encryption issue detected');
        }
    }
    
    console.log('\n3. Testing Admin-Created User...');
    
    // First get admin token
    const adminLogin = await makeRequest('POST', '/api/auth/login', {
        email: 'admin@telemedicine.com',
        password: 'admin123'
    });
    
    if (adminLogin.success && adminLogin.data) {
        const token = JSON.parse(adminLogin.data).token;
        
        // Create user via admin
        const adminCreateData = {
            email: 'admincreated@example.com',
            password: 'adminpassword123',
            firstName: 'Admin',
            lastName: 'Created',
            role: 'patient'
        };
        
        const adminCreateResponse = await makeRequest('POST', '/api/admin/users', adminCreateData, {
            'Authorization': `Bearer ${token}`
        });
        
        console.log('Admin user creation:', adminCreateResponse.success ? '✅ SUCCESS' : '❌ FAILED');
        
        if (adminCreateResponse.success) {
            // Try to login as the admin-created user
            const adminCreatedLogin = await makeRequest('POST', '/api/auth/login', {
                email: 'admincreated@example.com',
                password: 'adminpassword123'
            });
            
            console.log('Admin-created user login:', adminCreatedLogin.success ? '✅ SUCCESS' : '❌ FAILED');
            
            if (!adminCreatedLogin.success) {
                console.log('⚠️  PASSWORD ENCRYPTION ISSUE CONFIRMED for admin-created users');
            }
        }
    }
}

// HTTP request helper
function makeRequest(method, path, data = null, extraHeaders = {}) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...extraHeaders
            },
            timeout: 5000
        };

        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                resolve({
                    success: res.statusCode >= 200 && res.statusCode < 300,
                    status: res.statusCode,
                    data: responseData
                });
            });
        });

        req.on('error', (err) => {
            resolve({ success: false, error: err.message });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({ success: false, error: 'Timeout' });
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

testPasswordFunctionality().catch(console.error);
