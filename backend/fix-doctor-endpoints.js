// Simple script to fix doctor routes for the missing endpoints
import fs from 'fs';
import path from 'path';

// Path to the files
const controllerPath = path.resolve('./src/modules/doctors/doctor.controller.js');
const routesPath = path.resolve('./src/modules/doctors/doctor.routes.js');

// Read the current files
const controllerContent = fs.readFileSync(controllerPath, 'utf8');
const routesContent = fs.readFileSync(routesPath, 'utf8');

// Check for issues in controller
console.log('Checking controller file...');

// Check for duplicate exports
const getDoctorProfileCount = (controllerContent.match(/export const getDoctorProfile/g) || []).length;
console.log(`Found ${getDoctorProfileCount} getDoctorProfile export declarations`);

// Check for imports in routes file
console.log('\nChecking routes file...');
const importLine = "import { \n  uploadDocument,\n  submitVerification,\n  getVerificationStatus,\n  getAllDoctors,\n  getSpecializations, \n  getDoctorById,\n  rateDoctorById,\n  getDoctorStats,\n  getDoctorProfile\n} from './doctor.controller.js';";

// Check if getDoctorProfile is already imported
const hasProfileImport = routesContent.includes('getDoctorProfile');
console.log(`Routes file ${hasProfileImport ? 'includes' : 'does not include'} getDoctorProfile import`);

// Check if the profile route exists
const hasProfileRoute = routesContent.includes('router.get(\'/profile\'');
console.log(`Routes file ${hasProfileRoute ? 'includes' : 'does not include'} profile route`);

// Export default check
const exportCheck = controllerContent.includes('export default');
console.log(`Controller has ${exportCheck ? 'default export' : 'no default export'}`);

console.log('\nFixes required:');
if (getDoctorProfileCount > 1) {
  console.log('- Remove duplicate getDoctorProfile declarations');
}
if (!hasProfileImport) {
  console.log('- Add getDoctorProfile to imports in routes file');
}
if (!hasProfileRoute) {
  console.log('- Add profile route to routes file');
}

console.log('\nReady to apply fixes? (Run with --apply to apply fixes)');
