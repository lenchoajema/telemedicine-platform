import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './shared/db.js';
import authRoutes from './modules/auth/auth.routes.js';
import appointmentRoutes from './modules/appointments/appointment.routes.js';


dotenv.config();
await connectDB();

const app = express();
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Basic Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'API healthy' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});