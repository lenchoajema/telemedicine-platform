import express from 'express';
import cors from 'cors';

const app = express();

// Test loading the full API configuration
const testAPI = async () => {
  try {
    console.log('Testing full API configuration...');
    
    // Basic middleware
    app.use(express.json());
    console.log('✅ Express JSON middleware loaded');
    
    // CORS - simplified version first
    app.use(cors({
      origin: true,
      credentials: true
    }));
    console.log('✅ CORS middleware loaded');
    
    // Test loading the API routes
    console.log('Loading API routes...');
    const apiRoutes = await import('./src/api/index.js');
    console.log('✅ API routes imported');
    
    app.use('/api', apiRoutes.default);
    console.log('✅ API routes mounted');
    
    console.log('API configuration test successful!');
    
  } catch (error) {
    console.log('❌ API configuration failed:', error.message);
    console.log('Error stack:', error.stack);
  }
};

testAPI();
