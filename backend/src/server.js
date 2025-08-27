import app from './app.js';
import connectDB from './modules/shared/db.js';
import WebRTCSignalingServer from './services/webrtc-signaling.service.js';
import { initializeSocket } from './services/socket.service.js';
import { createServer } from 'http';
import dotenv from 'dotenv';
// Initialize the symptom-check worker to process AI inference jobs
import './modules/symptom-check/worker.js';
dotenv.config();

(async () => {
  await connectDB();
  
  const PORT = process.env.PORT || 5000;
  
  // Create HTTP server
  const server = createServer(app);
  
  // Initialize WebRTC signaling server
  const webrtcServer = new WebRTCSignalingServer(server); // eslint-disable-line no-unused-vars
  console.log('✅ WebRTC Signaling Server initialized');
  // Initialize Socket.IO for real-time messaging
  initializeSocket(server);
  console.log('🕸️  Socket.IO initialized');
  
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    // Prefer explicit API_BACKEND_URL in logs to avoid exposing localhost when deployed
    const logHost = process.env.API_BACKEND_URL || `http://localhost:${PORT}`;
    console.log(`📊 API Health check: ${logHost}/api/health`);
    console.log(`🎥 WebRTC Signaling: ${logHost.replace(/^http/, 'ws')}`);
    console.log(`�  Socket.IO endpoint: ${logHost.replace(/^http/, 'ws')}`);
  });
})();
