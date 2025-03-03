// API Configuration
export const API_CONFIG = {
  // Replace with your local IP address when testing with a physical device
  // Use 10.0.2.2 for Android emulator to access localhost
  // Use localhost for iOS simulator
  BASE_URL: 'http://192.168.240.253:5000', // Your backend server URL
  SOCKET_URL: 'ws://192.168.240.253:5000', // WebSocket URL
  API_ENDPOINTS: {
    AUTH: '/api/auth',
    CHAT: '/api/chat'
  }
};

// Authentication header configuration
export const getAuthHeader = (token) => ({
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}); 