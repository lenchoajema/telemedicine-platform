import http from 'http';

console.log('🩺 Telemedicine Platform - Quick Test Suite');
console.log('============================================');

// Test function
function testEndpoint(name, host, port, path) {
    return new Promise((resolve) => {
        const options = {
            hostname: host,
            port: port,
            path: path,
            method: 'GET',
            timeout: 5000
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log(`✅ ${name} - PASSED`);
                    resolve(true);
                } else {
                    console.log(`❌ ${name} - FAILED (Status: ${res.statusCode})`);
                    resolve(false);
                }
            });
        });

        req.on('error', (err) => {
            console.log(`❌ ${name} - FAILED (Error: ${err.message})`);
            resolve(false);
        });

        req.on('timeout', () => {
            console.log(`❌ ${name} - FAILED (Timeout)`);
            req.destroy();
            resolve(false);
        });

        req.end();
    });
}

// Run tests
async function runTests() {
    console.log('\n1. Infrastructure Tests');
    console.log('======================');
    
    const backendHealth = await testEndpoint('Backend Health', 'localhost', 5000, '/api/health');
    const frontendAccess = await testEndpoint('Frontend Access', 'localhost', 5173, '/');
    
    console.log('\n2. API Endpoint Tests');
    console.log('====================');
    
    const doctorsList = await testEndpoint('Doctors List', 'localhost', 5000, '/api/doctors');
    const specializations = await testEndpoint('Specializations', 'localhost', 5000, '/api/specializations');
    
    console.log('\n🎯 Test Results:');
    console.log('===============');
    
    const passed = [backendHealth, frontendAccess, doctorsList, specializations].filter(Boolean).length;
    const total = 4;
    
    console.log(`✅ Tests Passed: ${passed}/${total}`);
    if (passed === total) {
        console.log('🎉 All core services are working!');
    } else {
        console.log('⚠️  Some services need attention');
    }
    
    console.log('\n📊 Service URLs:');
    console.log('================');
    console.log('Frontend: http://localhost:5173');
    console.log('Backend:  http://localhost:5000');
    console.log('Database: mongodb://localhost:27017');
}

runTests().catch(console.error);
