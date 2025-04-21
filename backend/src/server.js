import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './modules/shared/db.js';
import authRoutes from './modules/auth/auth.routes.js';
import appointmentRoutes from './modules/appointments/appointment.routes.js';
import doctorRoutes from './modules/doctors/doctors.routes.js';

dotenv.config();

const app = express();

// Get the Codespace URL from the environment or use default values
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:5173',
  /^https:\/\/.*\.app\.github\.dev$/  // Allow any GitHub Codespace URL
];

// Updated CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);

    // Check if the origin is allowed
    const isAllowedOrigin = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return allowedOrigin === origin;
    });

    if (isAllowedOrigin) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Database
await connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/doctors', doctorRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});