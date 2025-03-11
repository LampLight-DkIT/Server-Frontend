export const API_CONFIG = {
  BASE_URL: process.env.NODE_ENV === 'production'
    ? process.env.REACT_APP_API_URL
    : 'http://localhost:5000',
  SOCKET_URL: process.env.NODE_ENV === 'production'
    ? process.env.REACT_APP_SOCKET_URL
    : 'http://localhost:5000',
  API_ENDPOINTS: {
    AUTH: '/api/auth',
    CHAT: '/api/chat'
  }
}; 