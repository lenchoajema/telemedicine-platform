import app from './app.js';
import connectDB from './modules/shared/db.js';
import WebRTCSignalingServer from './services/webrtc-signaling.service.js';
import { createServer } from 'http';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
  await connectDB();
  
  const PORT = process.env.PORT || 5000;
  
  // Create HTTP server
  const server = createServer(app);
  
  // Initialize WebRTC signaling server
  const webrtcServer = new WebRTCSignalingServer(server); // eslint-disable-line no-unused-vars
  console.log('✅ WebRTC Signaling Server initialized');
  
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 API Health check: http://localhost:${PORT}/api/health`);
    console.log(`🎥 WebRTC Signaling: ws://localhost:${PORT}`);
  });
})();
