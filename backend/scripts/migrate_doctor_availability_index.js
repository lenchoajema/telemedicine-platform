// Migration: adjust DoctorAvailability indices for multi-block per day support.
// Usage: node backend/scripts/migrate_doctor_availability_index.js [mongoUri]
// Safe to run multiple times (idempotent).
import mongoose from 'mongoose';
import 'dotenv/config';

const uri = process.argv[2] || process.env.MONGO_URI || 'mongodb://localhost:27017/telemedicine';

async function run() {
  console.log('[migrate] Connecting to', uri);
  await mongoose.connect(uri, { maxPoolSize: 5 });
  const coll = mongoose.connection.db.collection('doctoravailabilities');
  const indexes = await coll.indexes();
  const hasOld = indexes.find(i => i.name === 'doctor_1_day_1');
  if (hasOld) {
    console.log('[migrate] Dropping legacy unique index doctor_1_day_1');
    await coll.dropIndex('doctor_1_day_1');
  } else {
    console.log('[migrate] Legacy index not present (ok)');
  }
  // Refresh indexes list after drop
  const indexes2 = await coll.indexes();
  const hasNew = indexes2.find(i => i.name === 'doctor_1_day_1_startTime_1');
  if (!hasNew) {
    console.log('[migrate] Creating new unique index on (doctor, day, startTime)');
    await coll.createIndex({ doctor: 1, day: 1, startTime: 1 }, { unique: true, background: true });
  } else {
    console.log('[migrate] New index already exists (ok)');
  }
  console.log('[migrate] Done');
  await mongoose.disconnect();
}

run().catch(e => { console.log('[migrate] Failed', e && e.message ? e.message : e); process.exit(1); });
