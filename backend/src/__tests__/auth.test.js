import request from 'supertest';
import app from '../app.js';
import User from '../modules/auth/user.model.js';

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          profile: {
            firstName: 'Test',
            lastName: 'User'
          },
          role: 'patient'
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('should not register user with duplicate email', async () => {
      // First create a user
      await User.create({
        email: 'existing@example.com',
        password: 'password123',
        profile: {
          firstName: 'Existing',
          lastName: 'User'
        },
        role: 'patient'
      });

      // Try to create another with same email
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'password123',
          profile: {
            firstName: 'Test',
            lastName: 'User'
          },
          role: 'patient'
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });
});
