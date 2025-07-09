import http from 'http';
import https from 'https';

console.log('🩺 Telemedicine Platform - Comprehensive Test Suite');
console.log('===================================================');

// Test function for HTTP requests
function testEndpoint(name, host, port, path, method = 'GET', data = null, headers = {}) {
    return new Promise((resolve) => {
        const options = {
            hostname: host,
            port: port,
            path: path,
            method: method,
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log(`✅ ${name} - PASSED`);
                    resolve({ success: true, data: responseData, status: res.statusCode });
                } else {
                    console.log(`❌ ${name} - FAILED (Status: ${res.statusCode})`);
                    resolve({ success: false, status: res.statusCode });
                }
            });
        });

        req.on('error', (err) => {
            console.log(`❌ ${name} - FAILED (Error: ${err.message})`);
            resolve({ success: false, error: err.message });
        });

        req.on('timeout', () => {
            console.log(`❌ ${name} - FAILED (Timeout)`);
            req.destroy();
            resolve({ success: false, error: 'Timeout' });
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// Run comprehensive tests
async function runTests() {
    let passed = 0;
    let total = 0;
    
    console.log('\n1. Infrastructure Tests');
    console.log('======================');
    
    total++;
    const backendHealth = await testEndpoint('Backend Health', 'localhost', 5000, '/api/health');
    if (backendHealth.success) passed++;
    
    total++;
    const frontendAccess = await testEndpoint('Frontend Access', 'localhost', 5173, '/');
    if (frontendAccess.success) passed++;
    
    console.log('\n2. Authentication Tests');
    console.log('======================');
    
    // Test user registration
    total++;
    const registerUser = await testEndpoint('User Registration', 'localhost', 5000, '/api/auth/register', 'POST', {
        email: 'testuser@example.com',
        password: 'password123',
        role: 'patient',
        profile: {
            firstName: 'Test',
            lastName: 'User'
        }
    });
    if (registerUser.success) passed++;
    
    // Test admin login
    total++;
    const adminLogin = await testEndpoint('Admin Login', 'localhost', 5000, '/api/auth/login', 'POST', {
        email: 'admin@telemedicine.com',
        password: 'admin123'
    });
    if (adminLogin.success) passed++;
    
    console.log('\n3. API Endpoint Tests');
    console.log('====================');
    
    total++;
    const doctorsList = await testEndpoint('Doctors List', 'localhost', 5000, '/api/doctors');
    if (doctorsList.success) passed++;
    
    total++;
    const publicAPI = await testEndpoint('Public API Test', 'localhost', 5000, '/api/public/doctors');
    if (publicAPI.success) passed++;
    
    console.log('\n4. Protected Route Tests');
    console.log('========================');
    
    // Try to access protected route without token
    total++;
    const protectedWithoutToken = await testEndpoint('Protected Route (No Token)', 'localhost', 5000, '/api/admin/users');
    if (!protectedWithoutToken.success && protectedWithoutToken.status === 401) {
        console.log('✅ Protected Route (No Token) - PASSED (Correctly blocked)');
        passed++;
    } else {
        console.log('❌ Protected Route (No Token) - FAILED (Should be blocked)');
    }
    
    console.log('\n5. Database Connection Tests');
    console.log('============================');
    
    total++;
    const dbConnection = await testEndpoint('Database Health Check', 'localhost', 5000, '/api/health');
    if (dbConnection.success) passed++;
    
    console.log('\n🎯 Test Results Summary');
    console.log('======================');
    console.log(`✅ Tests Passed: ${passed}/${total}`);
    console.log(`❌ Tests Failed: ${total - passed}/${total}`);
    console.log(`📊 Success Rate: ${Math.round((passed / total) * 100)}%`);
    
    if (passed === total) {
        console.log('\n🎉 All tests passed! Platform is fully functional.');
    } else if (passed > total * 0.8) {
        console.log('\n🟡 Most tests passed. Minor issues detected.');
    } else {
        console.log('\n🔴 Multiple tests failed. Platform needs attention.');
    }
    
    console.log('\n📋 Next Steps:');
    console.log('==============');
    console.log('1. Open http://localhost:5173 in browser');
    console.log('2. Test user registration and login');
    console.log('3. Test appointment booking');
    console.log('4. Test admin dashboard');
    console.log('5. Test video call functionality');
    
    console.log('\n🔑 Test Credentials:');
    console.log('====================');
    console.log('Admin: admin@telemedicine.com / admin123');
    console.log('Doctor: test.doctor@example.com / password123');
    console.log('Patient: patient1@example.com / password123');
    
    console.log('\n🌐 Service URLs:');
    console.log('================');
    console.log('Frontend: http://localhost:5173');
    console.log('Backend:  http://localhost:5000');
    console.log('Database: mongodb://localhost:27017');
}

runTests().catch(console.error);
