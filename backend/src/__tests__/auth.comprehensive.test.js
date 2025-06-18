// Comprehensive Authentication Module Tests
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/modules/auth/user.model.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

describe('Authentication Module - Comprehensive Tests', () => {
  
  beforeAll(async () => {
    // Connect to test database
    const MONGO_TEST_URI = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/telemedicine_test';
    await mongoose.connect(MONGO_TEST_URI);
  });

  beforeEach(async () => {
    // Clean database before each test
    await User.deleteMany({});
  });

  afterAll(async () => {
    // Clean up and close connection
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  describe('User Registration', () => {
    
    test('should register a new patient successfully', async () => {
      const userData = {
        email: 'patient@test.com',
        password: 'Password123!',
        role: 'patient',
        profile: {
          firstName: 'John',
          lastName: 'Doe'
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.role).toBe(userData.role);
      expect(response.body.user).not.toHaveProperty('password');
    });

    test('should register a new doctor with required fields', async () => {
      const doctorData = {
        email: 'doctor@test.com',
        password: 'Password123!',
        role: 'doctor',
        profile: {
          firstName: 'Dr. Jane',
          lastName: 'Smith',
          specialization: 'Cardiology',
          licenseNumber: 'MD123456'
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(doctorData)
        .expect(201);

      expect(response.body.user.role).toBe('doctor');
      expect(response.body.user.profile.specialization).toBe(doctorData.profile.specialization);
      expect(response.body.user.profile.licenseNumber).toBe(doctorData.profile.licenseNumber);
    });

    test('should reject registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'Password123!',
        role: 'patient',
        profile: {
          firstName: 'John',
          lastName: 'Doe'
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should reject registration with missing required fields', async () => {
      const userData = {
        email: 'test@example.com',
        // Missing password
        role: 'patient'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should reject doctor registration without specialization', async () => {
      const doctorData = {
        email: 'doctor@test.com',
        password: 'Password123!',
        role: 'doctor',
        profile: {
          firstName: 'Dr. Jane',
          lastName: 'Smith'
          // Missing specialization and licenseNumber
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(doctorData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should reject duplicate email registration', async () => {
      const userData = {
        email: 'duplicate@test.com',
        password: 'Password123!',
        role: 'patient',
        profile: {
          firstName: 'John',
          lastName: 'Doe'
        }
      };

      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/duplicate|exists/i);
    });
  });

  describe('User Login', () => {
    
    beforeEach(async () => {
      // Create a test user before each login test
      const testUser = new User({
        email: 'logintest@example.com',
        password: 'Password123!',
        role: 'patient',
        profile: {
          firstName: 'Login',
          lastName: 'Test'
        }
      });
      await testUser.save();
    });

    test('should login with valid credentials', async () => {
      const loginData = {
        email: 'logintest@example.com',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    test('should reject login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/invalid credentials/i);
    });

    test('should reject login with invalid password', async () => {
      const loginData = {
        email: 'logintest@example.com',
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/invalid credentials/i);
    });

    test('should reject login with missing credentials', async () => {
      const loginData = {
        email: 'logintest@example.com'
        // Missing password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/required/i);
    });

    test('should reject login with malformed request body', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send('invalid-json')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Password Security', () => {
    
    test('should hash password before storing', async () => {
      const plainPassword = 'TestPassword123!';
      const user = new User({
        email: 'hashtest@example.com',
        password: plainPassword,
        role: 'patient',
        profile: {
          firstName: 'Hash',
          lastName: 'Test'
        }
      });

      await user.save();

      // Fetch user with password field
      const savedUser = await User.findOne({ email: 'hashtest@example.com' }).select('+password');
      
      expect(savedUser.password).not.toBe(plainPassword);
      expect(savedUser.password).toMatch(/^\$2[aby]\$.{56}$/); // bcrypt pattern
    });

    test('should verify password correctly', async () => {
      const plainPassword = 'TestPassword123!';
      const user = new User({
        email: 'verifytest@example.com',
        password: plainPassword,
        role: 'patient',
        profile: {
          firstName: 'Verify',
          lastName: 'Test'
        }
      });

      await user.save();

      // Test password comparison
      const savedUser = await User.findOne({ email: 'verifytest@example.com' }).select('+password');
      const isMatch = await savedUser.comparePassword(plainPassword);
      
      expect(isMatch).toBe(true);
      
      const isWrongMatch = await savedUser.comparePassword('WrongPassword');
      expect(isWrongMatch).toBe(false);
    });
  });

  describe('JWT Token Management', () => {
    
    test('should generate valid JWT token on login', async () => {
      const testUser = new User({
        email: 'jwttest@example.com',
        password: 'Password123!',
        role: 'patient',
        profile: {
          firstName: 'JWT',
          lastName: 'Test'
        }
      });
      await testUser.save();

      const loginData = {
        email: 'jwttest@example.com',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      const token = response.body.token;
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    test('should include user ID and role in token payload', async () => {
      const testUser = new User({
        email: 'payloadtest@example.com',
        password: 'Password123!',
        role: 'doctor',
        profile: {
          firstName: 'Payload',
          lastName: 'Test',
          specialization: 'Test Medicine',
          licenseNumber: 'TEST123'
        }
      });
      await testUser.save();

      const loginData = {
        email: 'payloadtest@example.com',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      const token = response.body.token;
      
      // Decode token payload (without verification for testing)
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      
      expect(payload).toHaveProperty('id');
      expect(payload).toHaveProperty('role');
      expect(payload.role).toBe('doctor');
      expect(payload).toHaveProperty('exp'); // Expiration time
    });
  });

  describe('Error Handling', () => {
    
    test('should handle database connection errors gracefully', async () => {
      // Mock database error
      const originalCreate = User.create;
      User.create = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const userData = {
        email: 'dbtest@example.com',
        password: 'Password123!',
        role: 'patient',
        profile: {
          firstName: 'DB',
          lastName: 'Test'
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      
      // Restore original method
      User.create = originalCreate;
    });

    test('should not expose sensitive information in errors', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' })
        .expect(401);

      // Error should not contain sensitive details like stack traces
      expect(response.body.error).not.toMatch(/stack|trace|internal/i);
      expect(response.body).not.toHaveProperty('stack');
    });
  });

  describe('Input Validation and Sanitization', () => {
    
    test('should sanitize user input to prevent XSS', async () => {
      const userData = {
        email: 'xsstest@example.com',
        password: 'Password123!',
        role: 'patient',
        profile: {
          firstName: '<script>alert("XSS")</script>',
          lastName: 'Test'
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Check that script tags are not stored
      expect(response.body.user.profile.firstName).not.toMatch(/<script>/);
    });

    test('should validate email format strictly', async () => {
      const invalidEmails = [
        'invalid.email',
        '@domain.com',
        'user@',
        'user@domain',
        'user@domain.',
        'user name@domain.com'
      ];

      for (const email of invalidEmails) {
        const userData = {
          email,
          password: 'Password123!',
          role: 'patient',
          profile: {
            firstName: 'Test',
            lastName: 'User'
          }
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      }
    });
  });
});
