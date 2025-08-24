#!/usr/bin/env node
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import UserProfile from '../src/models/UserProfile.js';

dotenv.config();

async function run() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/telemedicine';
  await mongoose.connect(uri);
  console.log('Connected to Mongo');
  const users = await User.find({}).select('_id profile');
  let created = 0; let updated = 0; let skipped = 0;
  for (const u of users) {
    const existing = await UserProfile.findOne({ userId: u._id });
    if (!existing) {
      const p = u.profile || {};
      await UserProfile.create({
        userId: u._id,
        firstName: p.firstName,
        lastName: p.lastName,
        phone: p.phone,
        dateOfBirth: p.dateOfBirth,
        gender: p.gender,
        addressLine1: p.address || p.addressLine1,
        city: p.city,
        state: p.state,
        postalCode: p.zipCode,
      });
      created++;
    } else {
      skipped++;
    }
  }
  console.log(`Backfill complete. created=${created} skipped=${skipped} updated=${updated}`);
  await mongoose.disconnect();
}
run().catch(e => { console.log('Backfill error', e); process.exit(1); });
