const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

class SocketManager {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: "*", // Be careful with this in production
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    // Store active users
    this.activeUsers = new Map(); // userId -> socketId
    this.initialize();
  }

  initialize() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          throw new Error('Authentication error');
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        next();
      } catch (err) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.userId);
      this.handleConnection(socket);
    });
  }

  handleConnection(socket) {
    // Store user connection
    this.activeUsers.set(socket.userId, socket.id);

    // Handle private messages
    socket.on('private_message', async (data) => {
      try {
        const { recipientId, message } = data;
        const recipientSocketId = this.activeUsers.get(recipientId);
        
        if (recipientSocketId) {
          this.io.to(recipientSocketId).emit('private_message', {
            senderId: socket.userId,
            message,
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.error('Error sending private message:', error);
      }
    });

    // Handle alerts
    socket.on('send_alert', async (data) => {
      try {
        const { recipientId, alertType, alertMessage } = data;
        const recipientSocketId = this.activeUsers.get(recipientId);
        
        if (recipientSocketId) {
          this.io.to(recipientSocketId).emit('receive_alert', {
            senderId: socket.userId,
            type: alertType,
            message: alertMessage,
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.error('Error sending alert:', error);
      }
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.userId);
      this.activeUsers.delete(socket.userId);
      this.io.emit('user_offline', socket.userId);
    });

    // Broadcast user's online status
    this.io.emit('user_online', socket.userId);
  }

  // Method to send alert to specific user
  sendAlert(userId, alertData) {
    const socketId = this.activeUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('receive_alert', alertData);
    }
  }

  // Method to broadcast message to all users
  broadcastMessage(message) {
    this.io.emit('broadcast', message);
  }
}

module.exports = SocketManager; 