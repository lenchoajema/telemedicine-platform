import express from 'express';

console.log('Testing OPTIONS handler...');

const app = express();

try {
  console.log('1. Creating basic app...');
  
  console.log('2. Testing problematic OPTIONS handler...');
  // This is the potentially problematic line from app.js
  app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(200);
  });
  
  console.log('✅ OPTIONS handler added successfully!');
  
} catch (error) {
  console.error('❌ Error with OPTIONS handler:', error.message);
  console.error('Stack:', error.stack);
}
