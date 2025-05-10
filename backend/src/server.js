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

// Define allowed origins including explicit GitHub Codespaces URLs
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:5173',
  // Explicit Codespace URLs
  `https://${CODESPACE_NAME}-5173.app.github.dev`,
  `https://${CODESPACE_NAME}-3000.app.github.dev`,
  // Fallback regex pattern for any GitHub Codespaces URL
  /^https:\/\/.*\.app\.github\.dev$/
];

console.log('Allowed origins:', allowedOrigins);

// Pre-flight OPTIONS request handler - must come before other middleware
app.options('*', cors());

// CORS configuration - apply before any routes
app.use(cors({
  origin: function (origin, callback) {
    console.log('Request origin:', origin);
    
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) {
      console.log('No origin, allowing request');
      return callback(null, true);
    }
    
    // Check if origin is allowed
    const isAllowedOrigin = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin instanceof RegExp) {
        const matches = allowedOrigin.test(origin);
        console.log(`Testing ${allowedOrigin} against ${origin}: ${matches}`);
        return matches;
      }
      const matches = allowedOrigin === origin;
      console.log(`Comparing ${allowedOrigin} with ${origin}: ${matches}`);
      return matches;
    });
    
    if (isAllowedOrigin) {
      console.log(`CORS allowed for: ${origin}`);
      callback(null, true);
    } else {
      console.error(`CORS blocked for: ${origin}`);
      const corsError = new Error(`CORS not allowed for ${origin}`);
      callback(corsError);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

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
  console.log(`CORS is enabled for origins: ${allowedOrigins.map(o => typeof o === 'object' ? o.toString() : o).join(', ')}`);
});