import bcrypt from 'bcryptjs';
import User from '../backend/src/modules/auth/user.model.js';

describe('Authentication Unit Tests', () => {
  test('Password should be hashed before saving', async () => {
    const plainPassword = 'testPassword123';
    const user = new User({
      email: 'test@example.com',
      password: plainPassword,
      role: 'patient',
      profile: { firstName: 'Test', lastName: 'User' }
    });
    
    await user.save();
    expect(user.password).not.toBe(plainPassword);
    expect(await bcrypt.compare(plainPassword, user.password)).toBe(true);
  });
  
  test('Email validation should work correctly', () => {
    const validEmails = ['test@example.com', 'user.name@domain.co.uk'];
    const invalidEmails = ['invalid-email', '@domain.com', 'user@'];
    
    validEmails.forEach(email => {
      expect(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)).toBe(true);
    });
    
    invalidEmails.forEach(email => {
      expect(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)).toBe(false);
    });
  });
});
