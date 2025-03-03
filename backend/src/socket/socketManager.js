const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

class SocketManager {
  constructor(server) {
    this.io = socketIo(server, {
      cors: {
        origin: "*", // Be careful with this in production
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["Authorization"]
      }
    });

    this.connectedClients = new Map();
    this.dashboardSockets = new Set();
    this.mobileClients = new Set();

    // Add authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || 
                     socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
          console.error('No token provided for socket connection');
          throw new Error('Authentication error');
        }

        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          socket.userId = decoded.id;
          console.log('Socket authenticated for user:', decoded.id);
          next();
        } catch (err) {
          console.error('Token verification failed:', err.message);
          throw new Error('Authentication error');
        }
      } catch (err) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log('New client connected:', socket.id, 'User ID:', socket.userId);

      // Handle client type identification
      socket.on('register', (data) => {
        try {
          console.log('Client registration:', { socketId: socket.id, ...data });
          
          if (data.type === 'dashboard') {
            this.dashboardSockets.add(socket.id);
            console.log('Dashboard client registered:', socket.id);
            console.log('Total dashboard clients:', this.dashboardSockets.size);
          } else if (data.type === 'mobile') {
            this.mobileClients.add(socket.id);
            console.log('Mobile client registered:', socket.id);
          }

          this.connectedClients.set(socket.id, { 
            type: data.type, 
            socket,
            userId: socket.userId 
          });

          // Send registration confirmation
          socket.emit('register-success', {
            type: data.type,
            socketId: socket.id
          });
        } catch (error) {
          console.error('Registration error:', error);
          socket.emit('error', { message: 'Registration failed' });
        }
      });

      // Handle regular messages
      socket.on('message', (message) => {
        console.log('Received message:', message);
        // Broadcast message to relevant clients
        this.io.emit('message', {
          ...message,
          userId: socket.userId
        });
      });

      // Handle alerts
      socket.on('alert', (alertData) => {
        console.log('Received alert from client:', socket.id);
        console.log('Alert data:', alertData);
        console.log('Connected dashboard sockets:', Array.from(this.dashboardSockets));
        
        let alertSent = false;
        // Send alert to all dashboard clients
        this.dashboardSockets.forEach(dashboardId => {
          const client = this.connectedClients.get(dashboardId);
          console.log('Checking dashboard client:', dashboardId);
          
          if (client && client.socket) {
            console.log('Sending alert to dashboard:', dashboardId);
            const enhancedAlertData = {
              ...alertData,
              type: 'emergency',
              userId: socket.userId,
              receivedAt: new Date().toISOString()
            };
            
            client.socket.emit('dashboard-alert', enhancedAlertData);
            alertSent = true;
          } else {
            console.log('Dashboard client not found or invalid:', dashboardId);
          }
        });

        // Send confirmation back to sender
        socket.emit('alert-received', {
          success: alertSent,
          message: alertSent ? 'Alert sent to dashboard' : 'No dashboard clients available',
          timestamp: new Date().toISOString()
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        if (this.dashboardSockets.has(socket.id)) {
          this.dashboardSockets.delete(socket.id);
          console.log('Dashboard client removed. Remaining:', this.dashboardSockets.size);
        }
        if (this.mobileClients.has(socket.id)) {
          this.mobileClients.delete(socket.id);
        }
        this.connectedClients.delete(socket.id);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error('Socket error for client:', socket.id, error);
      });
    });
  }

  // Method to broadcast to all connected clients
  broadcast(event, data) {
    this.io.emit(event, data);
  }

  // Method to send to specific client
  sendToClient(clientId, event, data) {
    const client = this.connectedClients.get(clientId);
    if (client && client.socket) {
      client.socket.emit(event, data);
    }
  }

  // Method to send to all dashboard clients
  sendToDashboard(event, data) {
    this.dashboardSockets.forEach(dashboardId => {
      const client = this.connectedClients.get(dashboardId);
      if (client && client.socket) {
        client.socket.emit(event, data);
      }
    });
  }
}

module.exports = SocketManager; 