import express from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import doctorRoutes from '../modules/doctors/doctor.routes.js';
import doctorsRoutes from '../modules/doctors/doctors.routes.js';
import appointmentRoutes from '../modules/appointments/appointment.routes.js';
import verificationRoutes from '../modules/admin/verification.routes.js';
import statsRoutes from '../modules/admin/stats.routes.js';
import usersRoutes from '../modules/admin/users.routes.js';
import reportsRoutes from '../modules/admin/reports.routes.js';
import patientRoutes from '../modules/patients/patient.routes.js';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});

// Register all routes
router.use('/auth', authRoutes);
router.use('/doctors', doctorRoutes);
router.use('/doctors', doctorsRoutes); // Added doctors.routes.js routes
router.use('/appointments', appointmentRoutes);
router.use('/admin/verifications', verificationRoutes);
router.use('/admin/stats', statsRoutes);
router.use('/admin/users', usersRoutes);
router.use('/admin/reports', reportsRoutes);
router.use('/patients', patientRoutes);

// Import medical records routes
import medicalRecordsRoutes from '../modules/patients/medical-records.routes.js';

// Register medical records routes
router.use('/medical-records', medicalRecordsRoutes);

export default router;
