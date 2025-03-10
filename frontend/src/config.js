const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://server-frontend-nc92-git-main-zjleees-projects.vercel.app'
  : 'http://localhost:5000';

export const API_CONFIG = {
  BASE_URL: API_URL,
  SOCKET_URL: API_URL,
  API_ENDPOINTS: {
    AUTH: '/api/auth',
    CHAT: '/api/chat'
  }
}; 