#!/usr/bin/env node
// Ensures the sample doctor user exists (recreate if missing)
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../src/models/User.js';
import connectDB from '../src/modules/shared/db.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function run() {
  await connectDB();
  const email = 'samuel.jones@telemedicine.com';
  const password = 'doctorpassword123';
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Doctor user already exists:', existing._id.toString());
    await mongoose.disconnect();
    return;
  }
  const user = await User.create({
    username: 'drsamuel',
    email,
    password,
    role: 'doctor',
    profile: { firstName: 'Samuel', lastName: 'Jones', title: 'Dr.' },
    isVerified: true,
    verificationDetails: { licenseNumber: 'MD123456', specialty: 'Cardiology', yearsOfExperience: 15 }
  });
  console.log('Doctor user created:', user._id.toString());
  await mongoose.disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
