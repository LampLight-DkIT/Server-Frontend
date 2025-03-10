const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');
const SocketManager = require('./socket/socketManager');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    env: process.env.NODE_ENV,
    mongoUri: process.env.MONGODB_URI ? 'Set' : 'Not set',
    frontendUrl: process.env.FRONTEND_URL
  });
});

// Database connection with retry logic
const connectDB = async (retries = 5) => {
  while (retries) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('Connected to MongoDB');
      return true;
    } catch (err) {
      console.error(`MongoDB connection attempt failed. Retries left: ${retries}`);
      console.error('Error:', err.message);
      retries -= 1;
      if (!retries) {
        console.error('Failed to connect to MongoDB after all retries');
        return false;
      }
      // Wait for 5 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  return false;
};

// Initialize Socket Manager only after DB connection
const initializeServer = async () => {
  const dbConnected = await connectDB();
  if (!dbConnected) {
    console.error('Could not initialize server due to database connection failure');
    return;
  }

  // Initialize Socket Manager
  const socketManager = new SocketManager(server);

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({ 
      message: 'Something went wrong!',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  // Start server if not in production (Vercel)
  if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
};

// Initialize server
initializeServer().catch(console.error);

// Export for Vercel
module.exports = server; 