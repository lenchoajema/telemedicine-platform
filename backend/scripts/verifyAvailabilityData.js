// Maintenance script: verify AppointmentSlot doctor references and basic availability template linkage.
// Usage (from project root): node backend/scripts/verifyAvailabilityData.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Doctor from '../src/modules/doctors/doctor.model.js';
import AppointmentSlot from '../src/modules/appointment-slots/appointment-slot.model.js';
import AvailabilityTemplate from '../src/modules/availability/availability-template.model.js';

dotenv.config();

async function run() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/telemedicine';
  await mongoose.connect(uri, { autoIndex: false });
  console.log('[verifyAvailabilityData] Connected');

  const doctorIds = (await Doctor.find({}).select('_id user').lean()).map(d => String(d._id));
  const doctorIdSet = new Set(doctorIds);
  console.log('[verifyAvailabilityData] Doctor docs:', doctorIds.length);

  const slots = await AppointmentSlot.find({}).limit(10000).lean();
  let mismatched = [];
  for (const s of slots) {
    if (!doctorIdSet.has(String(s.doctor))) {
      mismatched.push(s);
    }
  }
  console.log('[verifyAvailabilityData] Total slots scanned:', slots.length, 'mismatched doctor refs:', mismatched.length);
  if (mismatched.length) {
    console.log('Example mismatches (first 10):');
    mismatched.slice(0, 10).forEach(m => console.log({ id: m._id, doctor: m.doctor, date: m.date, start: m.startTime }));
  }

  // Template coverage: each Doctor should have an active template
  const templates = await AvailabilityTemplate.find({ isActive: true }).select('_id doctor version').lean();
  const templateDoctors = new Set(templates.map(t => String(t.doctor)));
  const missingTemplates = doctorIds.filter(id => !templateDoctors.has(id));
  console.log('[verifyAvailabilityData] Active templates:', templates.length, 'doctors missing template:', missingTemplates.length);
  if (missingTemplates.length) {
    console.log('Doctor IDs missing templates (first 10):', missingTemplates.slice(0, 10));
  }

  await mongoose.disconnect();
  console.log('[verifyAvailabilityData] Done');
}

run().catch(e => { console.error('verifyAvailabilityData error', e); process.exit(1); });
