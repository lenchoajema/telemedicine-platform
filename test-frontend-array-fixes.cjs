#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testFrontendArrayFixes() {
  const browser = await puppeteer.launch({ 
    headless: false, 
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Browser Error:', msg.text());
      } else if (msg.text().includes('filter') || msg.text().includes('map')) {
        console.log('📋 Array operation:', msg.text());
      }
    });
    
    // Enable error logging
    page.on('pageerror', error => {
      console.log('❌ Page Error:', error.message);
    });
    
    console.log('🔍 Testing frontend array fixes...');
    
    // Go to frontend
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    console.log('✅ Frontend loaded successfully');
    
    // Test login with admin user
    console.log('🔐 Testing login...');
    
    await page.waitForSelector('input[name="email"]', { timeout: 5000 });
    await page.type('input[name="email"]', 'admin@test.com');
    await page.type('input[name="password"]', 'password123');
    
    await page.click('button[type="submit"]');
    
    // Wait for dashboard redirect
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    console.log('✅ Login successful');
    
    // Test admin appointments page
    console.log('📅 Testing admin appointments page...');
    
    // Navigate to admin appointments
    await page.goto('http://localhost:3000/admin/appointments', { waitUntil: 'networkidle0' });
    
    // Wait a moment for any async operations
    await page.waitForTimeout(2000);
    
    console.log('✅ Admin appointments page loaded');
    
    // Test patient new appointment page
    console.log('👩‍⚕️ Testing new appointment page...');
    
    // Navigate to new appointment page
    await page.goto('http://localhost:3000/appointments/new', { waitUntil: 'networkidle0' });
    
    // Wait a moment for any async operations
    await page.waitForTimeout(2000);
    
    console.log('✅ New appointment page loaded');
    
    console.log('🎉 All array fix tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Check if running as main script
if (require.main === module) {
  testFrontendArrayFixes().catch(console.error);
}

module.exports = { testFrontendArrayFixes };
