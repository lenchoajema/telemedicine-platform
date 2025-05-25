import app from './app.js';
import connectDB from './modules/shared/db.js';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
  await connectDB();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API Health check available at: http://localhost:${PORT}/api/health`);
  });
})();