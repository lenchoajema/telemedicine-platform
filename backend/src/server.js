<<<<<<< HEAD
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './modules/shared/db.js';
import authRoutes from './modules/auth/auth.routes.js';
import appointmentRoutes from './modules/appointments/appointment.routes.js';
import doctorRoutes from './modules/doctors/doctors.routes.js';
import path from 'path';
import apiRoutes from './api/index.js';
// Import and mount admin routes
import verificationRoutes from './modules/admin/verification.routes.js';
import statsRoutes from './modules/admin/stats.routes.js';
import reportsRoutes from './modules/admin/reports.routes.js';
import usersRoutes from './modules/admin/users.routes.js';
import patientRoutes from './modules/patients/patient.routes.js';
import { logRegisteredRoutes } from './modules/shared/api-monitor.js';
dotenv.config();

const app = express();

// Extract Codespace name for dynamic URL creation
const CODESPACE_NAME = process.env.CODESPACE_NAME || '';
console.log('Codespace name:', CODESPACE_NAME);

// Simple CORS setup - allow all origins for development
app.use(cors({ origin: '*' }));
// Log important info about environment
console.log('CORS enabled for all origins in development mode');
if (CODESPACE_NAME) {
  console.log(`Codespace URL: https://${CODESPACE_NAME}-5173.app.github.dev`);
}

// Body parsing middleware
app.use(express.json());

// Add static file middleware here
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Database
await connectDB();

// Routes - either use API routes or direct routes
if (process.env.USE_API_ROUTES === 'true') {
  // Use centralized API routes
  app.use('/api', apiRoutes);
  console.log('Using centralized API routes');
} else {
  // Direct route mounting
  console.log('Using direct route mounting');
  app.use('/api/auth', authRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/doctors', doctorRoutes);
  app.use('/api/admin/verifications', verificationRoutes);
  app.use('/api/admin/stats', statsRoutes);
  app.use('/api/admin/users', usersRoutes);
  app.use('/api/admin/reports', reportsRoutes);
  app.use('/api/patients', patientRoutes);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', environment: process.env.NODE_ENV });
});

// Generic error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Server error', 
    message: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// Log all registered routes to help debug missing endpoints
if (process.env.NODE_ENV === 'development' && process.env.LOG_ROUTES === 'true') {
  try {
    logRegisteredRoutes(app);
  } catch (error) {
    console.log('Could not log routes:', error.message);
    console.log('This is not critical and the server will continue to run.');
  }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Health check available at: http://localhost:${PORT}/api/health`);
});
=======
import app from './app.js';
import connectDB from './modules/shared/db.js';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
  await connectDB();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API Health check available at: http://localhost:${PORT}/api/health`);
  });
})();
>>>>>>> a67abca257d39517a26d636c680d417d5adda03f
