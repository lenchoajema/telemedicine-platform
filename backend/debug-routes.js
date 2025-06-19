import express from 'express';

const app = express();

// Test loading each route file individually to identify the problematic one
const testRoute = async (routePath, routeName) => {
  try {
    console.log(`Testing ${routeName}...`);
    const route = await import(routePath);
    app.use(`/test-${routeName}`, route.default);
    console.log(`✅ ${routeName} loaded successfully`);
  } catch (error) {
    console.log(`❌ ${routeName} failed:`, error.message);
    console.log(`Error stack:`, error.stack);
  }
};

async function main() {
  console.log('Testing individual route files...');
  
  await testRoute('./src/modules/auth/auth.routes.js', 'auth');
  await testRoute('./src/modules/doctors/doctor.routes.js', 'doctor');
  await testRoute('./src/modules/appointments/appointment.routes.js', 'appointments');
  await testRoute('./src/modules/admin/verification.routes.js', 'verification');
  await testRoute('./src/modules/admin/stats.routes.js', 'stats');
  await testRoute('./src/modules/admin/users.routes.js', 'users');
  await testRoute('./src/modules/admin/reports.routes.js', 'reports');
  await testRoute('./src/modules/patients/patient.routes.js', 'patients');
  await testRoute('./src/modules/patients/medical-records.routes.js', 'medical-records');
  
  console.log('Test complete');
}

main().catch(console.error);
