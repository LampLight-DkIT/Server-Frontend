import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(token) {
    this.socket = io('http://your-server-ip:5000', {
      auth: { token },
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Handle incoming private messages
    this.socket.on('private_message', (data) => {
      // Handle incoming message
      console.log('Received private message:', data);
    });

    // Handle incoming alerts
    this.socket.on('receive_alert', (data) => {
      // Handle incoming alert
      console.log('Received alert:', data);
    });

    // Handle user online status
    this.socket.on('user_online', (userId) => {
      console.log('User online:', userId);
    });

    // Handle user offline status
    this.socket.on('user_offline', (userId) => {
      console.log('User offline:', userId);
    });
  }

  sendPrivateMessage(recipientId, message) {
    if (this.socket) {
      this.socket.emit('private_message', { recipientId, message });
    }
  }

  sendAlert(recipientId, alertType, alertMessage) {
    if (this.socket) {
      this.socket.emit('send_alert', {
        recipientId,
        alertType,
        alertMessage
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new SocketService(); 