interface ApiConfig {
  BASE_URL: string;
  SOCKET_URL: string;
  API_ENDPOINTS: {
    AUTH: string;
    CHAT: string;
  };
}

export const API_CONFIG: ApiConfig = {
  BASE_URL: process.env.REACT_APP_API_URL || 'https://your-backend-url.vercel.app',
  SOCKET_URL: process.env.REACT_APP_SOCKET_URL || 'https://your-backend-url.vercel.app',
  API_ENDPOINTS: {
    AUTH: '/api/auth',
    CHAT: '/api/chat'
  }
}; 