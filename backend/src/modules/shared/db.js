import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      return;
    }
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/telemedicine';
    if (!process.env.MONGO_URI && !process.env.MONGODB_URI) {
      console.log('[db] MONGO_URI not set – using default', uri);
    }
    await mongoose.connect(uri, {
      // Use the database name from the connection string
      autoIndex: process.env.NODE_ENV !== 'production' // Better performance in prod
    });
    
    console.log('MongoDB connected');
    
    // Connection events
    mongoose.connection.on('error', (err) => {
      console.log('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
  } catch (err) {
  console.log('MongoDB connection failed:', err);
    process.exit(1);
  }
};

export default connectDB;