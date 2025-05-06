import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import Doctor from '../modules/doctors/doctor.model';
import User from '../modules/auth/user.model';
import jwt from 'jsonwebtoken';

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
    },
    role: 'doctor'
  });

  adminUser = await User.create({
    email: 'admin_test@example.com',
    password: 'password123',
    profile: {
      firstName: 'Test',
      lastName: 'Admin',
    },
    role: 'admin'
  });

  // Generate tokens
  doctorToken = jwt.sign(
    { id: doctorUser._id },
    process.env.JWT_SECRET || 'test_secret',
    { expiresIn: '1h' }
  );

  adminToken = jwt.sign(
    { id: adminUser._id },
    process.env.JWT_SECRET || 'test_secret',
    { expiresIn: '1h' }
  );
});

afterAll(async () => {
  // Clean up
  await Doctor.deleteMany({});
  await User.deleteMany({});
  await mongoose.connection.close();
});

describe('Doctor Verification Workflow', () => {
  test('Doctor submits verification', async () => {
    const res = await request(app)
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
    const res = await request(app)
      .get('/api/admin/verifications/pending')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('licenseNumber', 'TEST123456');
  });

  test('Admin gets verification details', async () => {
    const res = await request(app)
      .get(`/api/admin/verifications/${doctorId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('specialization', 'Cardiology');
    expect(res.body).toHaveProperty('licenseNumber', 'TEST123456');
    expect(res.body.verificationStatus).toBe('pending');
  });

  test('Admin approves verification', async () => {
    const res = await request(app)
      .put(`/api/admin/verifications/${doctorId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ notes: 'Documents verified successfully' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Doctor verification approved successfully');
    expect(res.body.doctor.verificationStatus).toBe('approved');
  });

  test('Doctor checks verification status', async () => {
    const res = await request(app)
      .get('/api/doctors/verification-status')
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'approved');
  });
});