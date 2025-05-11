import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './modules/shared/db.js';
import authRoutes from './modules/auth/auth.routes.js';
import appointmentRoutes from './modules/appointments/appointment.routes.js';
import doctorRoutes from './modules/doctors/doctors.routes.js';
import path from 'path';
import apiRoutes from './api/index.js';

dotenv.config();

const app = express();

// Extract Codespace name for dynamic URL creation
const CODESPACE_NAME = process.env.CODESPACE_NAME || '';
console.log('Codespace name:', CODESPACE_NAME);

// Simple CORS setup - allow all origins for development
app.use(cors());

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
} else {
  // Direct route mounting
  app.use('/api/auth', authRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/doctors', doctorRoutes);
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});