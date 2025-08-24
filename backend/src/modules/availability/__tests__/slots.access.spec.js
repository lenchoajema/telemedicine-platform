import request from 'supertest';
import app from '../../../app.js';
import mongoose from 'mongoose';
import Doctor from '../../doctors/doctor.model.js';
import AvailabilityTemplate from '../availability-template.model.js';
import AppointmentSlot from '../../appointment-slots/appointment-slot.model.js';
import jwt from 'jsonwebtoken';

// Lightweight integration focusing on auth access to /api/doctors/:id/slots
// Assumes JWT secret present; if not, falls back to test secret.

const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

function makeToken(user){
  return jwt.sign({ _id: user._id, role: user.role, email: user.email, profile: user.profile }, JWT_SECRET, { expiresIn: '1h'});
}

describe('Patient access to doctor slots endpoint', () => {
  let server;
  let doctorDoc;
  let patient;
  let doctorUser;

  beforeAll(async () => {
    // Use real connection (points to dev DB). In production you'd isolate using mongodb-memory-server.
    // Here we guard to avoid running against production accidentally.
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Refusing to run tests in production environment');
    }
  });

  beforeEach(async () => {
    // Create minimal user + doctor docs directly in collections to bypass registration flows
    const User = mongoose.model('User');
    doctorUser = await User.create({ email: 'doc-slots@example.com', password: 'x', role: 'doctor', status: 'Active', profile: { firstName: 'Slot', lastName: 'Doctor' } });
    doctorDoc = await Doctor.create({ user: doctorUser._id, specialization: 'General Medicine', licenseNumber: 'LIC-SLOTS', verificationStatus: 'approved' });
    patient = await User.create({ email: 'patient-slots@example.com', password: 'x', role: 'patient', status: 'Active', profile: { firstName: 'Patient', lastName: 'Slots' } });

    // Create one published slot (simulate availability publish)
    const date = new Date(); date.setDate(date.getDate()+1); date.setHours(0,0,0,0);
    await AvailabilityTemplate.create({ doctor: doctorDoc._id, version:1, rulesJSON: { days:[{ day: date.getDay(), slots:[{ start:'09:00', end:'09:30'}]}]}, isActive:true });
    await AppointmentSlot.create({ doctor: doctorDoc._id, date, startTime: '09:00', endTime:'09:30', isAvailable:true, slotHash: 'testhash' });
  });

  afterEach(async () => {
    await mongoose.connection.db.collection('appointmentslots').deleteMany({});
    await mongoose.connection.db.collection('availabilitytemplates').deleteMany({});
    await mongoose.connection.db.collection('doctors').deleteMany({});
    await mongoose.connection.db.collection('users').deleteMany({});
  });

  it('allows patient to fetch slots (200) and includes slotHash', async () => {
    const token = makeToken({ _id: patient._id, role: 'patient', email: patient.email, profile: patient.profile });
    const dateStr = new Date(Date.now()+86400000).toISOString().split('T')[0];
    const res = await request(app)
      .get(`/api/doctors/${doctorDoc._id}/slots`)
      .set('Authorization', `Bearer ${token}`)
      .query({ from: dateStr, to: dateStr })
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0]).toHaveProperty('slotHash');
  });

  it('rejects unauthenticated request with 401', async () => {
    const dateStr = new Date(Date.now()+86400000).toISOString().split('T')[0];
    const res = await request(app)
      .get(`/api/doctors/${doctorDoc._id}/slots`)
      .query({ from: dateStr, to: dateStr })
      .expect(401);
    expect(res.body.message || res.body.error).toMatch(/auth/i);
  });
});
