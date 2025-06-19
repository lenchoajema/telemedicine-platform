import express from 'express';
import cors from 'cors';

console.log('Starting minimal app test...');

const app = express();

try {
  console.log('1. Setting up basic middleware...');
  
  app.use(express.json());
  
  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
  }));
  
  console.log('2. Adding health check route...');
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  
  console.log('3. Starting server...');
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`✅ Minimal server running on port ${PORT}`);
  });
  
} catch (error) {
  console.error('❌ Error starting minimal server:', error);
  console.error('Stack:', error.stack);
}
