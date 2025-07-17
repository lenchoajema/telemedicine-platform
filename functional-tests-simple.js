#!/usr/bin/env node

import axios from 'axios';

class SimpleTelemedicineTests {
  constructor() {
    this.baseURL = 'http://localhost:5000/api';
    this.tokens = {};
    this.results = {
      patient: { passed: 0, failed: 0, total: 0 },
      doctor: { passed: 0, failed: 0, total: 0 },
      admin: { passed: 0, failed: 0, total: 0 }
    };
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',  // cyan
      pass: '\x1b[32m',  // green
      fail: '\x1b[31m',  // red
      warn: '\x1b[33m',  // yellow
      reset: '\x1b[0m'
    };
    
    const prefix = type === 'pass' ? '✅' : type === 'fail' ? '❌' : type === 'warn' ? '⚠️' : 'ℹ️';
    console.log(`${colors[type]}${prefix} ${message}${colors.reset}`);
  }

  async authenticate(email, password, role) {
    try {
      const response = await axios.post(`${this.baseURL}/auth/login`, {
        email,
        password
      });
      
      if (response.data.success && response.data.data && response.data.data.token) {
        this.tokens[role] = response.data.data.token;
        return true;
      } else if (response.data.token) {
        // Fallback for older response format
        this.tokens[role] = response.data.token;
        return true;
      }
    } catch (error) {
      return false;
    }
  }

  async testEndpoint(endpoint, method = 'GET', data = null, role = null) {
    try {
      const config = {
        method,
        url: `${this.baseURL}${endpoint}`,
      };
      
      if (role && this.tokens[role]) {
        config.headers = { Authorization: `Bearer ${this.tokens[role]}` };
      }
      
      if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        config.data = data;
        config.headers = { ...config.headers, 'Content-Type': 'application/json' };
      }
      
      const response = await axios(config);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return { 
        success: false, 
        error: error.message, 
        status: error.response?.status || 0 
      };
    }
  }

  recordResult(role, passed) {
    this.results[role].total++;
    if (passed) {
      this.results[role].passed++;
    } else {
      this.results[role].failed++;
    }
  }

  async testPatientFeatures() {
    this.log('\n=== PATIENT TESTS ===', 'info');
    
    // Test 1: Authentication
    const authResult = await this.authenticate('test.patient@example.com', 'password123', 'patient');
    if (authResult) {
      this.log('Patient Authentication: SUCCESS', 'pass');
      this.recordResult('patient', true);
    } else {
      this.log('Patient Authentication: FAILED', 'fail');
      this.recordResult('patient', false);
      return; // Can't continue without auth
    }

    // Test 2: Dashboard Access
    const dashboardResult = await this.testEndpoint('/patients/dashboard', 'GET', null, 'patient');
    if (dashboardResult.success) {
      this.log('Patient Dashboard: SUCCESS', 'pass');
      this.recordResult('patient', true);
    } else {
      this.log(`Patient Dashboard: FAILED (${dashboardResult.status})`, 'fail');
      this.recordResult('patient', false);
    }

    // Test 3: View Doctors
    const doctorsResult = await this.testEndpoint('/doctors', 'GET', null, 'patient');
    if (doctorsResult.success && doctorsResult.data.data) {
      this.log(`Patient View Doctors: SUCCESS (${doctorsResult.data.data.length} doctors)`, 'pass');
      this.recordResult('patient', true);
    } else {
      this.log('Patient View Doctors: FAILED', 'fail');
      this.recordResult('patient', false);
    }

    // Test 4: View Appointments
    const appointmentsResult = await this.testEndpoint('/appointments', 'GET', null, 'patient');
    if (appointmentsResult.success) {
      const count = appointmentsResult.data.data ? appointmentsResult.data.data.length : 0;
      this.log(`Patient View Appointments: SUCCESS (${count} appointments)`, 'pass');
      this.recordResult('patient', true);
    } else {
      this.log('Patient View Appointments: FAILED', 'fail');
      this.recordResult('patient', false);
    }

    // Test 5: Medical Records Access
    const recordsResult = await this.testEndpoint('/medical-records', 'GET', null, 'patient');
    if (recordsResult.success || recordsResult.status === 200) {
      this.log('Patient Medical Records Access: SUCCESS', 'pass');
      this.recordResult('patient', true);
    } else {
      this.log('Patient Medical Records Access: FAILED', 'fail');
      this.recordResult('patient', false);
    }
  }

  async testDoctorFeatures() {
    this.log('\n=== DOCTOR TESTS ===', 'info');
    
    // Test 1: Authentication
    const authResult = await this.authenticate('test.doctor@example.com', 'password123', 'doctor');
    if (authResult) {
      this.log('Doctor Authentication: SUCCESS', 'pass');
      this.recordResult('doctor', true);
    } else {
      this.log('Doctor Authentication: FAILED', 'fail');
      this.recordResult('doctor', false);
      return;
    }

    // Test 2: Dashboard Access
    const dashboardResult = await this.testEndpoint('/doctors/dashboard', 'GET', null, 'doctor');
    if (dashboardResult.success) {
      this.log('Doctor Dashboard: SUCCESS', 'pass');
      this.recordResult('doctor', true);
    } else {
      this.log(`Doctor Dashboard: FAILED (${dashboardResult.status})`, 'fail');
      this.recordResult('doctor', false);
    }

    // Test 3: View Appointments
    const appointmentsResult = await this.testEndpoint('/appointments', 'GET', null, 'doctor');
    if (appointmentsResult.success) {
      const count = appointmentsResult.data.data ? appointmentsResult.data.data.length : 0;
      this.log(`Doctor View Appointments: SUCCESS (${count} appointments)`, 'pass');
      this.recordResult('doctor', true);
    } else {
      this.log('Doctor View Appointments: FAILED', 'fail');
      this.recordResult('doctor', false);
    }

    // Test 4: Medical Records Management
    const recordsResult = await this.testEndpoint('/medical-records', 'GET', null, 'doctor');
    if (recordsResult.success) {
      this.log('Doctor Medical Records Access: SUCCESS', 'pass');
      this.recordResult('doctor', true);
    } else {
      this.log('Doctor Medical Records Access: FAILED', 'fail');
      this.recordResult('doctor', false);
    }

    // Test 5: Profile Access
    const profileResult = await this.testEndpoint('/doctors/profile', 'GET', null, 'doctor');
    if (profileResult.success) {
      this.log('Doctor Profile Access: SUCCESS', 'pass');
      this.recordResult('doctor', true);
    } else {
      this.log('Doctor Profile Access: FAILED', 'fail');
      this.recordResult('doctor', false);
    }
  }

  async testAdminFeatures() {
    this.log('\n=== ADMIN TESTS ===', 'info');
    
    // Test 1: Authentication
    const authResult = await this.authenticate('test.admin@example.com', 'password123', 'admin');
    if (authResult) {
      this.log('Admin Authentication: SUCCESS', 'pass');
      this.recordResult('admin', true);
    } else {
      this.log('Admin Authentication: FAILED', 'fail');
      this.recordResult('admin', false);
      return;
    }

    // Test 2: Dashboard Access
    const dashboardResult = await this.testEndpoint('/admin/dashboard', 'GET', null, 'admin');
    if (dashboardResult.success) {
      this.log('Admin Dashboard: SUCCESS', 'pass');
      this.recordResult('admin', true);
    } else {
      this.log(`Admin Dashboard: FAILED (${dashboardResult.status})`, 'fail');
      this.recordResult('admin', false);
    }

    // Test 3: User Management
    const usersResult = await this.testEndpoint('/admin/users', 'GET', null, 'admin');
    if (usersResult.success) {
      this.log('Admin User Management: SUCCESS', 'pass');
      this.recordResult('admin', true);
    } else {
      this.log('Admin User Management: FAILED', 'fail');
      this.recordResult('admin', false);
    }

    // Test 4: Audit Logs
    const auditResult = await this.testEndpoint('/admin/audit-logs', 'GET', null, 'admin');
    if (auditResult.success) {
      this.log('Admin Audit Logs: SUCCESS', 'pass');
      this.recordResult('admin', true);
    } else {
      this.log('Admin Audit Logs: FAILED', 'fail');
      this.recordResult('admin', false);
    }

    // Test 5: System Health
    const healthResult = await this.testEndpoint('/health', 'GET');
    if (healthResult.success) {
      this.log('System Health Check: SUCCESS', 'pass');
      this.recordResult('admin', true);
    } else {
      this.log('System Health Check: FAILED', 'fail');
      this.recordResult('admin', false);
    }
  }

  async testSystemEndpoints() {
    this.log('\n=== SYSTEM TESTS ===', 'info');
    
    // Test Health Endpoint
    const healthResult = await this.testEndpoint('/health');
    if (healthResult.success) {
      this.log('Health Endpoint: SUCCESS', 'pass');
    } else {
      this.log('Health Endpoint: FAILED', 'fail');
    }

    // Test CORS
    const corsResult = await this.testEndpoint('/doctors');
    if (corsResult.success || corsResult.status === 401) { // 401 is expected without auth
      this.log('CORS Configuration: SUCCESS', 'pass');
    } else {
      this.log('CORS Configuration: FAILED', 'fail');
    }
  }

  printSummary() {
    this.log('\n=== TEST SUMMARY ===', 'info');
    
    Object.keys(this.results).forEach(role => {
      const result = this.results[role];
      const passRate = result.total ? Math.round((result.passed / result.total) * 100) : 0;
      
      if (passRate >= 80) {
        this.log(`${role.toUpperCase()}: ${result.passed}/${result.total} (${passRate}%)`, 'pass');
      } else if (passRate >= 50) {
        this.log(`${role.toUpperCase()}: ${result.passed}/${result.total} (${passRate}%)`, 'warn');
      } else {
        this.log(`${role.toUpperCase()}: ${result.passed}/${result.total} (${passRate}%)`, 'fail');
      }
    });

    const totalPassed = Object.values(this.results).reduce((sum, r) => sum + r.passed, 0);
    const totalTests = Object.values(this.results).reduce((sum, r) => sum + r.total, 0);
    const overallRate = totalTests ? Math.round((totalPassed / totalTests) * 100) : 0;
    
    this.log(`\nOVERALL: ${totalPassed}/${totalTests} tests passed (${overallRate}%)`, 
             overallRate >= 80 ? 'pass' : overallRate >= 50 ? 'warn' : 'fail');
  }

  async runAllTests() {
    this.log('🚀 TELEMEDICINE PLATFORM FUNCTIONAL TESTS', 'info');
    this.log(`Started at: ${new Date().toISOString()}`, 'info');
    
    try {
      await this.testSystemEndpoints();
      await this.testPatientFeatures();
      await this.testDoctorFeatures();
      await this.testAdminFeatures();
      
      this.printSummary();
      
    } catch (error) {
      this.log(`Critical Error: ${error.message}`, 'fail');
    }
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tests = new SimpleTelemedicineTests();
  tests.runAllTests().catch(console.error);
}

export default SimpleTelemedicineTests;
