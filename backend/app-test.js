import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

console.log('Testing app.js imports step by step...');

dotenv.config();

const app = express();

console.log('1. Basic setup done');

try {
  console.log('2. Testing individual imports...');
  
  console.log('2a. Importing auth routes...');
  const authRoutes = await import('./src/modules/auth/auth.routes.js');
  console.log('✅ Auth routes imported');
  
  console.log('2b. Importing appointment routes...');
  const appointmentRoutes = await import('./src/modules/appointments/appointment.routes.js');
  console.log('✅ Appointment routes imported');
  
  console.log('2c. Importing doctor routes...');
  const doctorRoutes = await import('./src/modules/doctors/doctor.routes.js');
  console.log('✅ Doctor routes imported');
  
  console.log('2d. Importing API routes...');
  const apiRoutes = await import('./src/api/index.js');
  console.log('✅ API routes imported');
  
  console.log('2e. Importing admin routes...');
  const verificationRoutes = await import('./src/modules/admin/verification.routes.js');
  const statsRoutes = await import('./src/modules/admin/stats.routes.js');
  const reportsRoutes = await import('./src/modules/admin/reports.routes.js');
  const usersRoutes = await import('./src/modules/admin/users.routes.js');
  console.log('✅ Admin routes imported');
  
  console.log('2f. Importing patient routes...');
  const patientRoutes = await import('./src/modules/patients/patient.routes.js');
  console.log('✅ Patient routes imported');
  
  console.log('3. All imports successful! Now testing middleware setup...');
  
  // Setup CORS
  app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
  }));
  
  app.use(express.json());
  
  console.log('4. Testing route mounting...');
  
  if (process.env.USE_API_ROUTES === 'true') {
    console.log('4a. Using consolidated API routes...');
    app.use('/api', apiRoutes.default);
    console.log('✅ API routes mounted successfully');
  } else {
    console.log('4b. Using individual route mounting...');
    app.use('/api/auth', authRoutes.default);
    app.use('/api/appointments', appointmentRoutes.default);
    app.use('/api/doctors', doctorRoutes.default);
    console.log('✅ Individual routes mounted successfully');
  }
  
  console.log('5. All tests passed! The app.js configuration should work.');
  
} catch (error) {
  console.error('❌ Error during testing:', error.message);
  console.error('Stack:', error.stack);
}
