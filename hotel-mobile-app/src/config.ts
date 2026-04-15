/**
 * App Configuration
 */

export const config = {
  // API Configuration
  apiUrl: 'http://192.168.0.169:3000/api/v1',
  apiTimeout: 30000,

  // TTLock Configuration
  useMockTTLock: true, // Set to false when using real TTLock hardware (requires development build)

  // App Settings
  scanTimeout: 30000, // 30 seconds
  keyExpirationBuffer: 3600000, // 1 hour buffer before/after check-in/out
};

export default config;
