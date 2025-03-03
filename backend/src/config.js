require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key', // Change this in production
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/chat',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  MOBILE_APP_URL: process.env.MOBILE_APP_URL || '*'
}; 