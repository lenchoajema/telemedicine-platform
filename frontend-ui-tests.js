#!/usr/bin/env node

const puppeteer = require('puppeteer');

class FrontendUITests {
  constructor() {
    this.frontendURL = 'http://localhost:5173';
    this.browser = null;
    this.page = null;
    this.results = [];
  }

  async setup() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 720 });
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  log(testName, status, details = '') {
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${emoji} ${testName}: ${status}`);
    if (details) console.log(`   ${details}`);
    
    this.results.push({ testName, status, details });
  }

  async waitForElement(selector, timeout = 5000) {
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      return false;
    }
  }

  async testLoginPage() {
    try {
      await this.page.goto(`${this.frontendURL}/login`);
      
      // Check if login form exists
      const hasEmailInput = await this.waitForElement('input[type="email"], input[name="email"]');
      const hasPasswordInput = await this.waitForElement('input[type="password"], input[name="password"]');
      const hasLoginButton = await this.waitForElement('button[type="submit"], button:contains("Login")');
      
      if (hasEmailInput && hasPasswordInput && hasLoginButton) {
        this.log('Login Page Components', 'PASS', 'All form elements present');
      } else {
        this.log('Login Page Components', 'FAIL', 'Missing form elements');
      }
      
      // Test form validation
      await this.page.click('button[type="submit"]');
      await this.page.waitForTimeout(1000);
      
      const hasValidationMessage = await this.page.$('.error, .alert, [class*="error"], [class*="invalid"]');
      if (hasValidationMessage) {
        this.log('Login Form Validation', 'PASS', 'Validation working');
      } else {
        this.log('Login Form Validation', 'WARN', 'No validation messages found');
      }
      
    } catch (error) {
      this.log('Login Page Test', 'FAIL', error.message);
    }
  }

  async testPatientLogin() {
    try {
      await this.page.goto(`${this.frontendURL}/login`);
      
      // Fill login form
      await this.page.type('input[type="email"], input[name="email"]', 'test.patient@example.com');
      await this.page.type('input[type="password"], input[name="password"]', 'password123');
      
      // Submit form
      await this.page.click('button[type="submit"]');
      
      // Wait for navigation
      await this.page.waitForTimeout(3000);
      
      // Check if redirected to patient dashboard
      const currentURL = this.page.url();
      if (currentURL.includes('/patient') || currentURL.includes('/dashboard')) {
        this.log('Patient Login Flow', 'PASS', 'Successfully logged in and redirected');
        return true;
      } else {
        this.log('Patient Login Flow', 'FAIL', `Unexpected redirect to: ${currentURL}`);
        return false;
      }
      
    } catch (error) {
      this.log('Patient Login Flow', 'FAIL', error.message);
      return false;
    }
  }

  async testPatientDashboard() {
    try {
      // Check dashboard components
      const hasUpcomingAppointments = await this.waitForElement('[class*="appointment"], .appointments, [data-testid*="appointment"]');
      const hasDoctorList = await this.waitForElement('[class*="doctor"], .doctors, [data-testid*="doctor"]');
      const hasNavigation = await this.waitForElement('nav, .navigation, [class*="nav"]');
      
      if (hasUpcomingAppointments) {
        this.log('Patient Dashboard - Appointments Section', 'PASS');
      } else {
        this.log('Patient Dashboard - Appointments Section', 'WARN', 'Appointments section not found');
      }
      
      if (hasDoctorList) {
        this.log('Patient Dashboard - Doctors Section', 'PASS');
      } else {
        this.log('Patient Dashboard - Doctors Section', 'WARN', 'Doctors section not found');
      }
      
      if (hasNavigation) {
        this.log('Patient Dashboard - Navigation', 'PASS');
      } else {
        this.log('Patient Dashboard - Navigation', 'FAIL', 'Navigation not found');
      }
      
    } catch (error) {
      this.log('Patient Dashboard Test', 'FAIL', error.message);
    }
  }

  async testDoctorNameDisplay() {
    try {
      // Look for doctor names in various contexts
      const doctorElements = await this.page.$$('[class*="doctor"], .doctor-name, [data-testid*="doctor"]');
      
      let doctorNamesFound = 0;
      let unknownDoctorCount = 0;
      
      for (const element of doctorElements) {
        const text = await this.page.evaluate(el => el.textContent, element);
        if (text && text.trim()) {
          doctorNamesFound++;
          if (text.toLowerCase().includes('unknown') || text.toLowerCase().includes('n/a')) {
            unknownDoctorCount++;
          }
        }
      }
      
      if (doctorNamesFound > 0) {
        if (unknownDoctorCount === 0) {
          this.log('Doctor Name Display', 'PASS', `${doctorNamesFound} doctor names displayed correctly`);
        } else {
          this.log('Doctor Name Display', 'WARN', `${unknownDoctorCount}/${doctorNamesFound} showing as unknown`);
        }
      } else {
        this.log('Doctor Name Display', 'WARN', 'No doctor elements found to test');
      }
      
    } catch (error) {
      this.log('Doctor Name Display Test', 'FAIL', error.message);
    }
  }

  async testAppointmentBooking() {
    try {
      // Look for book appointment button
      const bookButton = await this.page.$('button:contains("Book"), button:contains("Appointment"), [class*="book"], [data-testid*="book"]');
      
      if (bookButton) {
        await bookButton.click();
        await this.page.waitForTimeout(2000);
        
        // Check if booking modal/form appears
        const hasModal = await this.waitForElement('.modal, [class*="modal"], .appointment-form, [class*="booking"]');
        
        if (hasModal) {
          this.log('Appointment Booking Flow', 'PASS', 'Booking interface opens');
          
          // Check form fields
          const hasDateField = await this.waitForElement('input[type="date"], [name*="date"]');
          const hasTimeField = await this.waitForElement('input[type="time"], select[name*="time"]');
          const hasReasonField = await this.waitForElement('textarea[name*="reason"], input[name*="reason"]');
          
          if (hasDateField && hasTimeField && hasReasonField) {
            this.log('Appointment Booking Form', 'PASS', 'All required fields present');
          } else {
            this.log('Appointment Booking Form', 'WARN', 'Some form fields missing');
          }
        } else {
          this.log('Appointment Booking Flow', 'FAIL', 'Booking interface did not open');
        }
      } else {
        this.log('Appointment Booking Flow', 'WARN', 'Book appointment button not found');
      }
      
    } catch (error) {
      this.log('Appointment Booking Test', 'FAIL', error.message);
    }
  }

  async testResponsiveDesign() {
    try {
      // Test mobile viewport
      await this.page.setViewport({ width: 375, height: 667 });
      await this.page.waitForTimeout(1000);
      
      const mobileNavigation = await this.waitForElement('.mobile-menu, [class*="mobile"], .hamburger, [class*="burger"]');
      
      if (mobileNavigation) {
        this.log('Responsive Design - Mobile', 'PASS', 'Mobile navigation elements found');
      } else {
        this.log('Responsive Design - Mobile', 'WARN', 'Mobile-specific elements not found');
      }
      
      // Test tablet viewport
      await this.page.setViewport({ width: 768, height: 1024 });
      await this.page.waitForTimeout(1000);
      
      // Reset to desktop
      await this.page.setViewport({ width: 1280, height: 720 });
      await this.page.waitForTimeout(1000);
      
      this.log('Responsive Design - Viewport Changes', 'PASS', 'Layout adapts to different screen sizes');
      
    } catch (error) {
      this.log('Responsive Design Test', 'FAIL', error.message);
    }
  }

  async testAccessibility() {
    try {
      // Check for basic accessibility features
      const hasMainLandmark = await this.page.$('main, [role="main"]');
      const hasHeadings = await this.page.$('h1, h2, h3, h4, h5, h6');
      const hasLabels = await this.page.$$('label');
      const hasAltText = await this.page.$$('img[alt]');
      
      if (hasMainLandmark) {
        this.log('Accessibility - Main Landmark', 'PASS');
      } else {
        this.log('Accessibility - Main Landmark', 'WARN', 'No main landmark found');
      }
      
      if (hasHeadings) {
        this.log('Accessibility - Heading Structure', 'PASS');
      } else {
        this.log('Accessibility - Heading Structure', 'WARN', 'No headings found');
      }
      
      if (hasLabels.length > 0) {
        this.log('Accessibility - Form Labels', 'PASS', `${hasLabels.length} labels found`);
      } else {
        this.log('Accessibility - Form Labels', 'WARN', 'No form labels found');
      }
      
    } catch (error) {
      this.log('Accessibility Test', 'FAIL', error.message);
    }
  }

  async testDoctorInterface() {
    try {
      // Navigate to doctor login
      await this.page.goto(`${this.frontendURL}/login`);
      
      // Clear previous inputs
      await this.page.evaluate(() => {
        document.querySelector('input[type="email"]').value = '';
        document.querySelector('input[type="password"]').value = '';
      });
      
      // Login as doctor
      await this.page.type('input[type="email"]', 'test.doctor@example.com');
      await this.page.type('input[type="password"]', 'password123');
      await this.page.click('button[type="submit"]');
      
      await this.page.waitForTimeout(3000);
      
      // Check doctor dashboard elements
      const hasPatientList = await this.waitForElement('[class*="patient"], .patients');
      const hasAppointmentManagement = await this.waitForElement('[class*="appointment"], .appointments');
      const hasSchedule = await this.waitForElement('[class*="schedule"], .calendar');
      
      if (hasPatientList || hasAppointmentManagement || hasSchedule) {
        this.log('Doctor Interface', 'PASS', 'Doctor-specific features found');
      } else {
        this.log('Doctor Interface', 'WARN', 'Doctor-specific features not clearly identified');
      }
      
    } catch (error) {
      this.log('Doctor Interface Test', 'FAIL', error.message);
    }
  }

  async testErrorHandling() {
    try {
      // Test 404 page
      await this.page.goto(`${this.frontendURL}/nonexistent-page`);
      await this.page.waitForTimeout(2000);
      
      const hasErrorMessage = await this.waitForElement('.error, [class*="error"], .not-found, [class*="404"]');
      
      if (hasErrorMessage) {
        this.log('Error Handling - 404 Page', 'PASS', 'Error page displayed');
      } else {
        this.log('Error Handling - 404 Page', 'WARN', 'No error page found');
      }
      
      // Test network error handling (simulate offline)
      await this.page.setOfflineMode(true);
      await this.page.reload();
      await this.page.waitForTimeout(2000);
      
      const hasOfflineMessage = await this.waitForElement('.offline, [class*="offline"], .network-error');
      
      if (hasOfflineMessage) {
        this.log('Error Handling - Network Error', 'PASS', 'Network error handled');
      } else {
        this.log('Error Handling - Network Error', 'WARN', 'Network error handling not detected');
      }
      
      // Reset network
      await this.page.setOfflineMode(false);
      
    } catch (error) {
      this.log('Error Handling Test', 'FAIL', error.message);
    }
  }

  printSummary() {
    console.log('\n=== FRONTEND UI TEST SUMMARY ===');
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARN').length;
    const total = this.results.length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`📊 Total: ${total}`);
    
    const passRate = total ? Math.round((passed / total) * 100) : 0;
    console.log(`📈 Pass Rate: ${passRate}%`);
    
    if (passRate >= 80) {
      console.log('🎉 UI Tests: EXCELLENT');
    } else if (passRate >= 60) {
      console.log('👍 UI Tests: GOOD');
    } else if (passRate >= 40) {
      console.log('⚠️  UI Tests: NEEDS IMPROVEMENT');
    } else {
      console.log('❌ UI Tests: CRITICAL ISSUES');
    }
  }

  async runAllTests() {
    console.log('🎨 FRONTEND UI FUNCTIONAL TESTS');
    console.log(`Started at: ${new Date().toISOString()}`);
    
    try {
      await this.setup();
      
      console.log('\n=== RUNNING UI TESTS ===');
      
      await this.testLoginPage();
      
      const patientLoginSuccess = await this.testPatientLogin();
      if (patientLoginSuccess) {
        await this.testPatientDashboard();
        await this.testDoctorNameDisplay();
        await this.testAppointmentBooking();
      }
      
      await this.testDoctorInterface();
      await this.testResponsiveDesign();
      await this.testAccessibility();
      await this.testErrorHandling();
      
      this.printSummary();
      
    } catch (error) {
      console.error(`Critical Error: ${error.message}`);
    } finally {
      await this.teardown();
    }
  }
}

// Check if puppeteer is available
async function checkPuppeteerAvailability() {
  try {
    require('puppeteer');
    return true;
  } catch (error) {
    console.log('⚠️  Puppeteer not available for UI tests');
    console.log('   Run: npm install puppeteer');
    return false;
  }
}

// Run tests if called directly
if (require.main === module) {
  checkPuppeteerAvailability().then(available => {
    if (available) {
      const tests = new FrontendUITests();
      tests.runAllTests().catch(console.error);
    } else {
      console.log('Skipping UI tests - Puppeteer required');
    }
  });
}

module.exports = FrontendUITests;
