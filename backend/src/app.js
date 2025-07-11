// backend/src/app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
// import connectDB from './modules/shared/db.js';
import authRoutes from './modules/auth/auth.routes.js';
import appointmentRoutes from './modules/appointments/appointment.routes.js';
import doctorRoutes from './modules/doctors/doctor.routes.js';
import apiRoutes from './api/index.js';
import verificationRoutes from './modules/admin/verification.routes.js';
import statsRoutes from './modules/admin/stats.routes.js';
import reportsRoutes from './modules/admin/reports.routes.js';
import usersRoutes from './modules/admin/users.routes.js';
import settingsRoutes from './modules/admin/settings.routes.js';
import dashboardRoutes from './modules/admin/dashboard.routes.js';
import videoCallRoutes from './modules/video-calls/video-call.routes.js';
import patientRoutes from './modules/patients/patient.routes.js';
import { logRegisteredRoutes } from './modules/shared/api-monitor.js';

dotenv.config();

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5000',
  'https://scaling-xylophone-r4677j9j947g3594j-5173.app.github.dev',
  'https://stunning-journey-wv5pxxvw49xh565g-5173.app.github.dev',
  // Add your specific Codespace URL for mobile app
  'https://stunning-journey-wv5pxxvw49xh565g.github.dev',
  // Add pattern for any Codespace URL
  /^https:\/\/[a-z0-9-]+-5173\.app\.github\.dev$/,
  /^https:\/\/[a-z0-9-]+\.github\.dev$/
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or matches pattern
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      return callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

if (process.env.USE_API_ROUTES === 'true') {
  app.use('/api', apiRoutes);
} else {
  app.use('/api/auth', authRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/doctors', doctorRoutes);
  app.use('/api/admin/verifications', verificationRoutes);
  app.use('/api/admin/stats', statsRoutes);
  app.use('/api/admin/users', usersRoutes);
  app.use('/api/admin/reports', reportsRoutes);
  app.use('/api/admin/settings', settingsRoutes);
  app.use('/api/admin/dashboard', dashboardRoutes);
  app.use('/api/video-calls', videoCallRoutes);
  app.use('/api/patients', patientRoutes);
}

// Log all registered routes for debugging
logRegisteredRoutes(app);

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', environment: process.env.NODE_ENV });
});

// General 404 handler
app.use((req, res) => {
  if (req.originalUrl.startsWith('/api/')) {
    res.status(404).json({ 
      error: 'Endpoint not found',
      message: `The requested endpoint ${req.originalUrl} does not exist`,
      statusCode: 404
    });
  } else {
    res.status(404).json({ 
      error: 'Not found',
      message: 'The requested resource was not found',
      statusCode: 404
    });
  }
});

app.use((err, req, res, _next) => {
  console.log('Server error:', err);
  res.status(500).json({ 
    error: 'Server error', 
    message: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

export default app;
