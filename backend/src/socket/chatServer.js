const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config');

let io;

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const auth = socket.handshake.auth;
      console.log('Received socket auth data:', {
        hasToken: !!auth.token,
        username: auth.username,
        userId: auth.userId
      });
      
      if (!auth || !auth.token) {
        console.log('Authentication failed: No token provided');
        return next(new Error('Authentication error: No token provided'));
      }

      try {
        const decoded = jwt.verify(auth.token, config.JWT_SECRET);
        console.log('Decoded token:', decoded);

        // Store user information in socket
        socket.userId = auth.userId || decoded.id || decoded.userId;
        socket.username = auth.username || decoded.username;
        
        if (!socket.username || !socket.userId) {
          console.log('Authentication failed: Missing user information', {
            username: socket.username,
            userId: socket.userId
          });
          return next(new Error('Authentication error: Missing user information'));
        }

        console.log('Authentication successful for user:', {
          userId: socket.userId,
          username: socket.username,
          source: auth.username ? 'auth data' : 'token'
        });

        next();
      } catch (err) {
        console.log('Token verification failed:', err.message);
        return next(new Error('Authentication error: Invalid token'));
      }
    } catch (error) {
      console.error('Unexpected error during socket authentication:', error);
      return next(new Error('Internal server error during authentication'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', {
      username: socket.username,
      userId: socket.userId
    });

    socket.on('join', ({ room, username, userId }) => {
      if (!room) return;
      
      socket.join(room);
      console.log('User joined room:', {
        room,
        username: username || socket.username,
        userId: userId || socket.userId
      });
      
      socket.to(room).emit('message', {
        id: Date.now().toString(),
        text: `${username || socket.username} joined the chat`,
        sender: 'System',
        timestamp: new Date().toISOString()
      });
    });

    socket.on('message', (message) => {
      console.log('Received message:', {
        message,
        from: {
          username: socket.username,
          userId: socket.userId
        }
      });
      
      const room = Array.from(socket.rooms)[1];
      if (room) {
        const enhancedMessage = {
          ...message,
          sender: socket.username,
          userId: socket.userId,
          timestamp: new Date().toISOString()
        };

        socket.to(room).emit('message', enhancedMessage);
        console.log('Message broadcast to room:', {
          room,
          message: enhancedMessage
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', {
        username: socket.username,
        userId: socket.userId
      });
    });
  });

  return io;
};

module.exports = {
  initializeSocket,
  getIo: () => io
}; 