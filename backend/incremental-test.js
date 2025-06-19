import express from 'express';
import cors from 'cors';

console.log('Testing incremental route loading...');

const app = express();

app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

const testRouteImport = async (routePath, routeName) => {
  try {
    console.log(`Loading ${routeName}...`);
    const route = await import(routePath);
    app.use(`/api/${routeName}`, route.default);
    console.log(`✅ ${routeName} loaded and mounted successfully`);
    return true;
  } catch (error) {
    console.log(`❌ ${routeName} failed:`, error.message);
    if (error.message.includes('path-to-regexp')) {
      console.log('This is the problematic route!');
    }
    return false;
  }
};

async function main() {
  console.log('Starting incremental route test...');
  
  const routes = [
    ['./src/modules/auth/auth.routes.js', 'auth'],
    ['./src/modules/appointments/appointment.routes.js', 'appointments'],
    ['./src/modules/doctors/doctor.routes.js', 'doctors'],
    ['./src/modules/patients/patient.routes.js', 'patients'],
    ['./src/modules/admin/verification.routes.js', 'verification'],
    ['./src/modules/admin/stats.routes.js', 'stats'],
    ['./src/modules/admin/users.routes.js', 'users'],
    ['./src/modules/admin/reports.routes.js', 'reports'],
    ['./src/modules/patients/medical-records.routes.js', 'medical-records'],
  ];
  
  for (const [path, name] of routes) {
    const success = await testRouteImport(path, name);
    if (!success) {
      console.log(`Stopping at failed route: ${name}`);
      break;
    }
  }
  
  console.log('Test complete. If all routes loaded, the issue might be in app.js itself.');
}

main().catch(console.error);
