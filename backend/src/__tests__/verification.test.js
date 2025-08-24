// ESM imports and global test setup
process.env.JWT_SECRET = 'test_secret';
import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
// import app from '../app.js'; // unused, using testApp
import Doctor from '../modules/doctors/doctor.model.js';
import User from '../modules/auth/user.model.js';
import jwt from 'jsonwebtoken';
import verificationRoutes from '../modules/admin/verification.routes.js';
import doctorRoutes from '../modules/doctors/doctor.routes.js';

// Create a test app with a mock authenticate middleware
const testApp = express();
testApp.use(express.json());
testApp.use((req, res, next) => {
  // Mock user role based on token
  req.user = {
    id: req.headers.authorization ? jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET).id : null,
    role: req.headers.authorization && req.headers.authorization.includes('admin') ? 'admin' : 'doctor',
  };
  next();
});
testApp.use('/api/admin/verifications', verificationRoutes);
testApp.use('/api/doctors', doctorRoutes);

// Mock users for testing
let doctorUser;
let adminUser;
let doctorToken;
let adminToken;
let doctorId;

beforeAll(async () => {
  // Create test users
  doctorUser = await User.create({
    email: 'doctor_test@example.com',
    password: 'password123',
    profile: {
      firstName: 'Test',
      lastName: 'Doctor',
      specialization: 'Cardiology',
      licenseNumber: 'TEST123456'
    },
    role: 'doctor'
  });
  await doctorUser.save();

  adminUser = await User.create({
    email: 'admin_test@example.com',
    password: 'password123',
    profile: {
      firstName: 'Test',
      lastName: 'Admin',
      specialization: 'General Medicine',
      licenseNumber: 'ADMIN123456'
    },
    role: 'admin'
  });
    await adminUser.save();

  // Generate JWT tokens for doctor and admin users
  doctorToken = jwt.sign(
    { id: doctorUser._id.toString(), role: doctorUser.role },
    process.env.JWT_SECRET || 'test_secret',
    { expiresIn: '1h' }
  );
  adminToken = jwt.sign(
    { id: adminUser._id.toString(), role: adminUser.role },
    process.env.JWT_SECRET || 'test_secret',
    { expiresIn: '1h' }
  );
});

afterAll(async () => {
  // Clean up test data
  await Doctor.deleteMany({});
  await User.deleteMany({});
  await mongoose.connection.close();
});

describe('Doctor Verification Workflow', () => {
  test('Doctor submits verification', async () => {
    const res = await request(testApp)
      .post('/api/doctors/verify')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        specialization: 'Cardiology',
        licenseNumber: 'TEST123456',
        education: [
          {
            institution: 'Test Medical School',
            degree: 'MD',
            year: 2010
          }
        ],
        experience: [
          {
            hospital: 'Test Hospital',
            position: 'Resident',
            startYear: 2010,
            endYear: 2015
          }
        ],
        verificationDocuments: [
          {
            type: 'license',
            fileUrl: 'test-url/license.pdf'
          }
        ]
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('doctor');
    expect(res.body.doctor.verificationStatus).toBe('pending');
    
    // Store doctor ID for later tests
    doctorId = res.body.doctor._id;
  });

  test('Admin sees pending verification', async () => {
    const res = await request(testApp)
      .get('/api/admin/verifications/pending')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('licenseNumber', 'TEST123456');
  });

  test('Admin gets verification details', async () => {
    const res = await request(testApp)
      .get(`/api/admin/verifications/${doctorId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('specialization', 'Cardiology');
    expect(res.body).toHaveProperty('licenseNumber', 'TEST123456');
    expect(res.body.verificationStatus).toBe('pending');
  });

  test('Admin approves verification', async () => {
    const res = await request(testApp)
      .put(`/api/admin/verifications/${doctorId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ notes: 'Documents verified successfully' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Doctor verification approved successfully');
    expect(res.body.doctor.verificationStatus).toBe('approved');
  });

  test('Doctor checks verification status', async () => {
    const res = await request(testApp)
      .get('/api/doctors/verification-status')
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'approved');
  });
});