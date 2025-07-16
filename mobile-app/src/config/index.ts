// Environment configuration for the mobile app
const isDevelopment = process.env.NODE_ENV === 'development';

// GitHub Codespace URL for testing on real devices
const CODESPACE_URL = 'https://stunning-journey-wv5pxxvw49xh565g-5000.app.github.dev';

export const config = {
  // API Configuration - Using Codespace URL for mobile testing
  API_BASE_URL: `${CODESPACE_URL}/api`,
  
  // Socket.IO Configuration - Using Codespace URL
  SOCKET_URL: CODESPACE_URL,
  
  // App Configuration
  APP_NAME: 'Telemedicine',
  APP_VERSION: '1.0.0',
  
  // Feature Flags
  ENABLE_PUSH_NOTIFICATIONS: true,
  ENABLE_BIOMETRIC_AUTH: true,
  ENABLE_OFFLINE_MODE: true,
  
  // WebRTC Configuration
  WEBRTC_CONFIG: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ],
  },
  
  // Storage Keys
  STORAGE_KEYS: {
    AUTH_TOKEN: 'authToken',
    USER_DATA: 'userData',
    APP_SETTINGS: 'appSettings',
    OFFLINE_DATA: 'offlineData',
  },
  
  // Timeouts
  TIMEOUTS: {
    API_REQUEST: 10000,
    VIDEO_CALL: 30000,
    FILE_UPLOAD: 60000,
  },
  
  // File Upload
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['image/*', 'application/pdf', 'text/*'],
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

export default config;
