import http from 'http';

console.log('🔐 Testing Existing Users Login');
console.log('==============================');

// Test existing users
const existingUsers = [
    { email: 'test1@test.com', password: 'pass123' },
    { email: 'admin@telemedicine.com', password: 'admin123' },
    { email: 'test.doctor@example.com', password: 'password123' },
    { email: 'patient1@example.com', password: 'password123' },
    { email: 'doctor@test.com', password: 'password123' }
];

async function testLogin(email, password) {
    return new Promise((resolve) => {
        const data = JSON.stringify({ email, password });
        
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            },
            timeout: 5000
        };

        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                console.log(`Testing ${email}:`);
                console.log(`  Status: ${res.statusCode}`);
                if (res.statusCode === 200) {
                    console.log(`  ✅ LOGIN SUCCESS`);
                    try {
                        const parsed = JSON.parse(responseData);
                        console.log(`  Token: ${parsed.token ? parsed.token.substring(0, 20) + '...' : 'No token'}`);
                        console.log(`  User: ${parsed.user ? parsed.user.email : 'No user data'}`);
                    } catch (e) {
                        console.log(`  Response: ${responseData.substring(0, 100)}`);
                    }
                } else {
                    console.log(`  ❌ LOGIN FAILED`);
                    console.log(`  Response: ${responseData.substring(0, 200)}`);
                }
                console.log('');
                resolve(res.statusCode === 200);
            });
        });

        req.on('error', (err) => {
            console.log(`Testing ${email}:`);
            console.log(`  ❌ ERROR: ${err.message}`);
            console.log('');
            resolve(false);
        });

        req.on('timeout', () => {
            console.log(`Testing ${email}:`);
            console.log(`  ❌ TIMEOUT`);
            console.log('');
            req.destroy();
            resolve(false);
        });

        req.write(data);
        req.end();
    });
}

async function runTests() {
    console.log('Testing existing users from database...\n');
    
    let successCount = 0;
    let totalCount = existingUsers.length;
    
    for (const user of existingUsers) {
        const success = await testLogin(user.email, user.password);
        if (success) successCount++;
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('🎯 RESULTS:');
    console.log('===========');
    console.log(`✅ Successful logins: ${successCount}/${totalCount}`);
    console.log(`❌ Failed logins: ${totalCount - successCount}/${totalCount}`);
    
    if (successCount > 0) {
        console.log('\n✅ Authentication system is working for existing users!');
    } else {
        console.log('\n❌ Authentication system has issues - no users can login');
    }
}

runTests().catch(console.error);
