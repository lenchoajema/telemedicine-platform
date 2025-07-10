import http from 'http';

console.log('🔍 Debugging Registration and Admin User Creation');
console.log('================================================');

// Enhanced HTTP request function with detailed logging
function makeRequest(method, path, data = null, headers = {}) {
    return new Promise((resolve) => {
        console.log(`\n📡 Making ${method} request to ${path}`);
        if (data) console.log('📤 Data:', JSON.stringify(data, null, 2));
        
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            timeout: 10000
        };

        const req = http.request(options, (res) => {
            let responseData = '';
            console.log(`📥 Response status: ${res.statusCode}`);
            console.log(`📥 Response headers:`, res.headers);
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                console.log(`📥 Raw response: ${responseData}`);
                
                let parsedData = null;
                try {
                    parsedData = responseData ? JSON.parse(responseData) : null;
                } catch (e) {
                    console.log('⚠️  Failed to parse JSON response');
                }
                
                resolve({
                    success: res.statusCode >= 200 && res.statusCode < 300,
                    status: res.statusCode,
                    data: responseData,
                    parsed: parsedData,
                    headers: res.headers
                });
            });
        });

        req.on('error', (err) => {
            console.log(`❌ Request error: ${err.message}`);
            resolve({ success: false, error: err.message });
        });

        req.on('timeout', () => {
            console.log(`⏱️  Request timeout`);
            req.destroy();
            resolve({ success: false, error: 'Timeout' });
        });

        if (data) {
            const payload = JSON.stringify(data);
            console.log(`📤 Sending payload: ${payload}`);
            req.write(payload);
        }
        req.end();
    });
}

async function debugAuthentication() {
    console.log('\n1️⃣  Testing Backend Health');
    console.log('==========================');
    
    const health = await makeRequest('GET', '/api/health');
    if (!health.success) {
        console.log('❌ Backend is not responding. Aborting tests.');
        return;
    }
    console.log('✅ Backend is healthy');
    
    console.log('\n2️⃣  Testing User Registration');
    console.log('=============================');
    
    const registrationData = {
        email: 'debug-test@example.com',
        password: 'testpassword123',
        role: 'patient',
        profile: {
            firstName: 'Debug',
            lastName: 'Test'
        }
    };
    
    const registerResponse = await makeRequest('POST', '/api/auth/register', registrationData);
    console.log(`Registration result: ${registerResponse.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (!registerResponse.success) {
        console.log(`❌ Registration error details:`, registerResponse.parsed || registerResponse.data);
    }
    
    console.log('\n3️⃣  Testing Admin Login');
    console.log('======================');
    
    const adminLoginData = {
        email: 'admin@telemedicine.com',
        password: 'admin123'
    };
    
    const adminLogin = await makeRequest('POST', '/api/auth/login', adminLoginData);
    console.log(`Admin login result: ${adminLogin.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (!adminLogin.success) {
        console.log(`❌ Admin login error:`, adminLogin.parsed || adminLogin.data);
        return;
    }
    
    const adminToken = adminLogin.parsed?.token;
    if (!adminToken) {
        console.log('❌ No token received from admin login');
        return;
    }
    
    console.log(`✅ Admin token received: ${adminToken.substring(0, 20)}...`);
    
    console.log('\n4️⃣  Testing Admin User Creation');
    console.log('===============================');
    
    const adminCreateData = {
        email: 'admin-created-user@example.com',
        password: 'adminuserpass123',
        firstName: 'Admin',
        lastName: 'Created',
        role: 'patient'
    };
    
    const adminCreateResponse = await makeRequest('POST', '/api/admin/users', adminCreateData, {
        'Authorization': `Bearer ${adminToken}`
    });
    
    console.log(`Admin user creation: ${adminCreateResponse.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (!adminCreateResponse.success) {
        console.log(`❌ Admin user creation error:`, adminCreateResponse.parsed || adminCreateResponse.data);
        return;
    }
    
    console.log('\n5️⃣  Testing Admin-Created User Login');
    console.log('====================================');
    
    const adminCreatedLoginData = {
        email: 'admin-created-user@example.com',
        password: 'adminuserpass123'
    };
    
    const adminCreatedLogin = await makeRequest('POST', '/api/auth/login', adminCreatedLoginData);
    console.log(`Admin-created user login: ${adminCreatedLogin.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (!adminCreatedLogin.success) {
        console.log(`❌ Admin-created user login error:`, adminCreatedLogin.parsed || adminCreatedLogin.data);
        console.log('🔍 This confirms the password encryption issue for admin-created users');
    } else {
        console.log('🎉 Password encryption is working correctly!');
    }
    
    console.log('\n6️⃣  Testing Existing User Login');
    console.log('===============================');
    
    const existingUserLogin = await makeRequest('POST', '/api/auth/login', {
        email: 'patient1@example.com',
        password: 'password123'
    });
    
    console.log(`Existing user login: ${existingUserLogin.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    console.log('\n📊 Debug Summary');
    console.log('================');
    console.log('1. Backend Health:', health.success ? '✅' : '❌');
    console.log('2. User Registration:', registerResponse.success ? '✅' : '❌');
    console.log('3. Admin Login:', adminLogin.success ? '✅' : '❌');
    console.log('4. Admin User Creation:', adminCreateResponse.success ? '✅' : '❌');
    console.log('5. Admin-Created User Login:', adminCreatedLogin.success ? '✅' : '❌');
    console.log('6. Existing User Login:', existingUserLogin.success ? '✅' : '❌');
}

debugAuthentication().catch(console.error);
