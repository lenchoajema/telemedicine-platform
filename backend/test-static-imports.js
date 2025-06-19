// Testing static imports like in app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import connectDB from './src/modules/shared/db.js';
import authRoutes from './src/modules/auth/auth.routes.js';
import appointmentRoutes from './src/modules/appointments/appointment.routes.js';
import doctorRoutes from './src/modules/doctors/doctor.routes.js';
import apiRoutes from './src/api/index.js';
import verificationRoutes from './src/modules/admin/verification.routes.js';
import statsRoutes from './src/modules/admin/stats.routes.js';
import reportsRoutes from './src/modules/admin/reports.routes.js';
import usersRoutes from './src/modules/admin/users.routes.js';
import patientRoutes from './src/modules/patients/patient.routes.js';
import { logRegisteredRoutes } from './src/modules/shared/api-monitor.js';

console.log('✅ All static imports successful!');

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));

if (process.env.USE_API_ROUTES === 'true') {
  app.use('/api', apiRoutes);
} else {
  app.use('/api/auth', authRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/doctors', doctorRoutes);
}

console.log('✅ Routes mounted successfully!');
