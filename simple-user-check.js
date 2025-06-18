// Simple MongoDB connection test - can be run with VS Code's built-in Node.js
const fs = require('fs');
const path = require('path');

// Read the .env file to get connection details
function readEnvFile() {
    try {
        const envPath = path.join(__dirname, 'backend', '.env');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const env = {};
        
        envContent.split('\n').forEach(line => {
            if (line.includes('=') && !line.startsWith('#')) {
                const [key, value] = line.split('=');
                env[key.trim()] = value.trim();
            }
        });
        
        return env;
    } catch (error) {
        console.log('Could not read .env file:', error.message);
        return {};
    }
}

// Check if MongoDB is accessible via fetch (if it has an HTTP interface)
async function checkMongoDB() {
    const env = readEnvFile();
    console.log('Environment variables found:');
    console.log('- MONGO_URI:', env.MONGO_URI || 'not set');
    console.log('- PORT:', env.PORT || 'not set');
    console.log('- NODE_ENV:', env.NODE_ENV || 'not set');
    
    // Try to check if backend API is running
    console.log('\n🔍 Checking if backend API is running...');
    try {
        // This is a simple way to check without using the problematic terminal
        const spawn = require('child_process').spawn;
        const curl = spawn('curl', ['-s', 'http://localhost:5000/api/health'], {
            stdio: 'pipe'
        });
        
        let output = '';
        curl.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        curl.on('close', (code) => {
            if (code === 0 && output.trim()) {
                console.log('✅ Backend API is responding:');
                console.log(output.trim());
                
                // Try to get doctors list
                checkDoctors();
            } else {
                console.log('❌ Backend API not responding');
                console.log('💡 Try starting the platform with: docker-compose up -d');
            }
        });
        
    } catch (error) {
        console.log('❌ Error checking backend:', error.message);
    }
}

function checkDoctors() {
    console.log('\n👨‍⚕️ Checking doctors endpoint...');
    const spawn = require('child_process').spawn;
    const curl = spawn('curl', ['-s', 'http://localhost:5000/api/doctors'], {
        stdio: 'pipe'
    });
    
    let output = '';
    curl.stdout.on('data', (data) => {
        output += data.toString();
    });
    
    curl.on('close', (code) => {
        if (code === 0 && output.trim()) {
            try {
                const doctors = JSON.parse(output.trim());
                if (Array.isArray(doctors)) {
                    console.log(`✅ Found ${doctors.length} doctors:`);
                    doctors.forEach((doctor, index) => {
                        console.log(`   ${index + 1}. ${doctor.email || 'no email'} (${doctor.role || 'unknown role'})`);
                        if (doctor.profile) {
                            console.log(`      Name: ${doctor.profile.firstName || ''} ${doctor.profile.lastName || ''}`);
                            if (doctor.profile.specialization) {
                                console.log(`      Specialization: ${doctor.profile.specialization}`);
                            }
                        }
                    });
                } else {
                    console.log('Response:', output.trim());
                }
            } catch (error) {
                console.log('Raw response:', output.trim());
            }
        } else {
            console.log('❌ Could not fetch doctors');
        }
        
        // Check if we can create a test user
        createTestUser();
    });
}

function createTestUser() {
    console.log('\n🧪 Attempting to create a test user...');
    const spawn = require('child_process').spawn;
    
    const testUser = {
        email: 'test-user@example.com',
        password: 'password123',
        role: 'patient',
        profile: {
            firstName: 'Test',
            lastName: 'User'
        }
    };
    
    const curl = spawn('curl', [
        '-s',
        '-X', 'POST',
        '-H', 'Content-Type: application/json',
        '-d', JSON.stringify(testUser),
        'http://localhost:5000/api/auth/register'
    ], { stdio: 'pipe' });
    
    let output = '';
    curl.stdout.on('data', (data) => {
        output += data.toString();
    });
    
    curl.on('close', (code) => {
        if (code === 0 && output.trim()) {
            try {
                const result = JSON.parse(output.trim());
                if (result.user) {
                    console.log('✅ Test user created successfully:');
                    console.log(`   Email: ${result.user.email}`);
                    console.log(`   Role: ${result.user.role}`);
                    console.log(`   ID: ${result.user._id || result.user.id}`);
                } else if (result.error) {
                    console.log('⚠️  Could not create test user:', result.error);
                    if (result.error.includes('duplicate') || result.error.includes('E11000')) {
                        console.log('   (User already exists - that\'s fine!)');
                    }
                }
            } catch (error) {
                console.log('Raw response:', output.trim());
            }
        } else {
            console.log('❌ Could not create test user');
        }
        
        console.log('\n🏁 User discovery completed!');
        console.log('\n💡 To see all users, you would typically need:');
        console.log('   1. Admin access to the database');
        console.log('   2. Admin API endpoints with authentication');
        console.log('   3. Direct MongoDB access (if containers are running)');
    });
}

console.log('🚀 Starting User Discovery (Alternative Method)');
console.log('='.repeat(50));
checkMongoDB();
