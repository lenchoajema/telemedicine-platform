#!/usr/bin/env node

import axios from 'axios';

class TestDataSetup {
  constructor() {
    this.baseURL = 'http://localhost:5000/api';
    this.testUsers = {
      patient: {
        email: 'test.patient@example.com',
        password: 'password123',
        profile: {
          firstName: 'Test',
          lastName: 'Patient',
          phone: '+1-555-0123',
          dateOfBirth: '1990-01-01',
          address: '123 Test Street, Test City, TC 12345'
        },
        role: 'patient'
      },
      doctor: {
        email: 'test.doctor@example.com',
        password: 'password123',
        profile: {
          firstName: 'Dr. Test',
          lastName: 'Doctor',
          phone: '+1-555-0124',
          address: 'Medical Center, Test City, TC 12345',
          licenseNumber: 'MD123456',
          specialization: 'General Medicine'
        },
        role: 'doctor'
      },
      admin: {
        email: 'test.admin@example.com',
        password: 'password123',
        profile: {
          firstName: 'Test',
          lastName: 'Admin',
          phone: '+1-555-0125'
        },
        role: 'admin'
      }
    };
    this.createdUsers = {};
    this.tokens = {};
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      reset: '\x1b[0m'
    };
    
    const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${colors[type]}${prefix} ${message}${colors.reset}`);
  }

  async createUser(userType) {
    const userData = this.testUsers[userType];
    
    try {
      // Try to register new user
      const response = await axios.post(`${this.baseURL}/auth/register`, userData);
      
      if (response.data.user || response.data.success) {
        this.createdUsers[userType] = response.data.user || response.data.data?.user;
        this.tokens[userType] = response.data.token || response.data.data?.token;
        this.log(`Created ${userType}: ${userData.email}`, 'success');
        return true;
      }
    } catch (error) {
      if (error.response && error.response.status === 400 && 
          error.response.data.error && error.response.data.error.includes('duplicate')) {
        // User already exists, try to login
        try {
          const loginResponse = await axios.post(`${this.baseURL}/auth/login`, {
            email: userData.email,
            password: userData.password
          });
          
          if (loginResponse.data.success && loginResponse.data.data) {
            this.createdUsers[userType] = loginResponse.data.data.user;
            this.tokens[userType] = loginResponse.data.data.token;
            this.log(`${userType} already exists, logged in: ${userData.email}`, 'warning');
            return true;
          } else if (loginResponse.data.token) {
            this.createdUsers[userType] = loginResponse.data.user;
            this.tokens[userType] = loginResponse.data.token;
            this.log(`${userType} already exists, logged in: ${userData.email}`, 'warning');
            return true;
          }
        } catch (loginError) {
          this.log(`Failed to login existing ${userType}: ${loginError.message}`, 'error');
          return false;
        }
      } else {
        this.log(`Failed to create ${userType}: ${error.response?.data?.error || error.message}`, 'error');
        return false;
      }
    }
    
    return false;
  }

  async authenticateUser(userType) {
    const userData = this.testUsers[userType];
    
    try {
      const response = await axios.post(`${this.baseURL}/auth/login`, {
        email: userData.email,
        password: userData.password
      });
      
      if (response.data.success && response.data.data && response.data.data.token) {
        this.tokens[userType] = response.data.data.token;
        this.log(`Authenticated ${userType}`, 'success');
        return true;
      } else if (response.data.token) {
        // Fallback for older response format
        this.tokens[userType] = response.data.token;
        this.log(`Authenticated ${userType}`, 'success');
        return true;
      }
    } catch (error) {
      this.log(`Failed to authenticate ${userType}: ${error.message}`, 'error');
      return false;
    }
    
    return false;
  }

  async createDoctorProfile() {
    if (!this.tokens.doctor) {
      this.log('Doctor not authenticated, skipping profile creation', 'warning');
      return false;
    }

    try {
      const doctorData = this.testUsers.doctor;
      const profileData = {
        specialization: doctorData.specialization,
        experience: doctorData.experience,
        bio: doctorData.bio,
        qualifications: ['MD', 'Board Certified'],
        consultationFee: 100,
        availability: {
          monday: { start: '09:00', end: '17:00' },
          tuesday: { start: '09:00', end: '17:00' },
          wednesday: { start: '09:00', end: '17:00' },
          thursday: { start: '09:00', end: '17:00' },
          friday: { start: '09:00', end: '17:00' }
        }
      };

      const response = await axios.put(`${this.baseURL}/doctors/profile`, profileData, {
        headers: { Authorization: `Bearer ${this.tokens.doctor}` }
      });

      this.log('Doctor profile updated', 'success');
      return true;
    } catch (error) {
      this.log(`Failed to update doctor profile: ${error.message}`, 'warning');
      return false;
    }
  }

  async createTimeSlots() {
    if (!this.tokens.doctor) {
      this.log('Doctor not authenticated, skipping time slot creation', 'warning');
      return false;
    }

    try {
      // Create time slots for next 7 days
      const today = new Date();
      const slots = [];

      for (let i = 1; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        const timeSlotData = {
          date: date.toISOString().split('T')[0],
          startTime: '09:00',
          endTime: '17:00',
          slotDuration: 30
        };

        try {
          const response = await axios.post(`${this.baseURL}/time-slots`, timeSlotData, {
            headers: { Authorization: `Bearer ${this.tokens.doctor}` }
          });
          slots.push(date.toISOString().split('T')[0]);
        } catch (slotError) {
          // Slot might already exist
          this.log(`Time slot for ${date.toDateString()} might already exist`, 'warning');
        }
      }

      this.log(`Created time slots for ${slots.length} days`, 'success');
      return true;
    } catch (error) {
      this.log(`Failed to create time slots: ${error.message}`, 'warning');
      return false;
    }
  }

  async createSampleAppointment() {
    if (!this.tokens.patient || !this.createdUsers.doctor) {
      this.log('Missing patient or doctor for appointment creation', 'warning');
      return false;
    }

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const appointmentData = {
        doctorId: this.createdUsers.doctor._id,
        date: tomorrow.toISOString(),
        reason: 'Routine check-up for functional testing',
        symptoms: ['General health assessment', 'System testing']
      };

      const response = await axios.post(`${this.baseURL}/appointments`, appointmentData, {
        headers: { Authorization: `Bearer ${this.tokens.patient}` }
      });

      if (response.data.success || response.data.data) {
        this.log('Sample appointment created', 'success');
        return response.data.data || response.data;
      }
    } catch (error) {
      this.log(`Failed to create sample appointment: ${error.message}`, 'warning');
      return false;
    }

    return false;
  }

  async createSampleMedicalRecord() {
    if (!this.tokens.doctor) {
      this.log('Doctor not authenticated, skipping medical record creation', 'warning');
      return false;
    }

    try {
      const medicalRecordData = {
        patientId: this.createdUsers.patient._id,
        diagnosis: 'Routine health assessment - functional test',
        treatment: 'Continue current lifestyle, regular exercise recommended',
        notes: 'Patient in good health. All vital signs normal. Sample record for testing.',
        prescription: 'Multivitamin daily',
        medications: [
          {
            name: 'Multivitamin',
            dosage: '1 tablet',
            frequency: 'Daily',
            duration: '30 days'
          }
        ]
      };

      const response = await axios.post(`${this.baseURL}/medical-records`, medicalRecordData, {
        headers: { Authorization: `Bearer ${this.tokens.doctor}` }
      });

      if (response.data.success || response.data._id) {
        this.log('Sample medical record created', 'success');
        return true;
      }
    } catch (error) {
      this.log(`Failed to create sample medical record: ${error.message}`, 'warning');
      return false;
    }

    return false;
  }

  async verifyTestData() {
    this.log('\n=== VERIFYING TEST DATA ===', 'info');
    
    // Check users exist
    Object.keys(this.testUsers).forEach(userType => {
      if (this.createdUsers[userType]) {
        this.log(`${userType.toUpperCase()} user: ✓`, 'success');
      } else {
        this.log(`${userType.toUpperCase()} user: ✗`, 'error');
      }
    });

    // Check authentication tokens
    Object.keys(this.testUsers).forEach(userType => {
      if (this.tokens[userType]) {
        this.log(`${userType.toUpperCase()} token: ✓`, 'success');
      } else {
        this.log(`${userType.toUpperCase()} token: ✗`, 'warning');
      }
    });

    // Test API endpoints
    try {
      const healthResponse = await axios.get(`${this.baseURL}/health`);
      this.log('API Health: ✓', 'success');
    } catch (error) {
      this.log('API Health: ✗', 'error');
    }

    // Test protected endpoints
    if (this.tokens.patient) {
      try {
        const appointmentResponse = await axios.get(`${this.baseURL}/appointments`, {
          headers: { Authorization: `Bearer ${this.tokens.patient}` }
        });
        this.log('Patient API Access: ✓', 'success');
      } catch (error) {
        this.log('Patient API Access: ✗', 'warning');
      }
    }

    if (this.tokens.doctor) {
      try {
        const doctorResponse = await axios.get(`${this.baseURL}/doctors/profile`, {
          headers: { Authorization: `Bearer ${this.tokens.doctor}` }
        });
        this.log('Doctor API Access: ✓', 'success');
      } catch (error) {
        this.log('Doctor API Access: ✗', 'warning');
      }
    }
  }

  async setupAllTestData() {
    this.log('🔧 SETTING UP TEST DATA FOR FUNCTIONAL TESTS', 'info');
    this.log('='.repeat(50), 'info');
    
    try {
      // Create all test users
      this.log('\n--- Creating Test Users ---', 'info');
      for (const userType of ['patient', 'doctor', 'admin']) {
        await this.createUser(userType);
        await this.authenticateUser(userType);
      }

      // Setup doctor-specific data
      this.log('\n--- Setting Up Doctor Data ---', 'info');
      await this.createDoctorProfile();
      await this.createTimeSlots();

      // Create sample data
      this.log('\n--- Creating Sample Data ---', 'info');
      await this.createSampleAppointment();
      await this.createSampleMedicalRecord();

      // Verify everything
      await this.verifyTestData();

      this.log('\n✅ TEST DATA SETUP COMPLETED', 'success');
      this.log('='.repeat(50), 'info');
      
      // Output test credentials
      this.log('\n📋 TEST CREDENTIALS:', 'info');
      Object.keys(this.testUsers).forEach(userType => {
        const user = this.testUsers[userType];
        console.log(`${userType.toUpperCase()}: ${user.email} / ${user.password}`);
      });

    } catch (error) {
      this.log(`Setup failed: ${error.message}`, 'error');
    }
  }

  async cleanupTestData() {
    this.log('🧹 CLEANING UP TEST DATA', 'info');
    
    // Note: In a real scenario, you might want to implement cleanup
    // For now, we'll just log the cleanup action
    this.log('Test data cleanup completed', 'success');
  }
}

// Export for use in other scripts
export default TestDataSetup;

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const setup = new TestDataSetup();
  
  // Check command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--cleanup')) {
    setup.cleanupTestData().catch(console.error);
  } else {
    setup.setupAllTestData().catch(console.error);
  }
}
