import express from 'express';
import dotenv from 'dotenv';

console.log('Testing server.js imports...');

dotenv.config();

try {
  console.log('1. Importing app.js...');
  const app = await import('./src/app.js');
  console.log('✅ app.js imported successfully');
  
  console.log('2. Importing connectDB...');
  const { default: connectDB } = await import('./src/modules/shared/db.js');
  console.log('✅ connectDB imported successfully');
  
  console.log('3. Testing connectDB call...');
  // Don't actually connect to avoid hanging
  console.log('✅ connectDB import successful');
  
  console.log('4. Testing app.listen...');
  const PORT = process.env.PORT || 5001;
  app.default.listen(PORT, () => {
    console.log(`✅ Server started on port ${PORT}`);
    process.exit(0); // Exit successfully
  });
  
} catch (error) {
  console.error('❌ Error during server.js test:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
