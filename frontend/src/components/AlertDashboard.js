import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { API_CONFIG } from '../config';

const AlertDashboard = () => {
  const [alerts, setAlerts] = useState([]);
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      return;
    }

    console.log('Initializing socket connection...');
    
    // Connect to socket server with auth token
    const newSocket = io(API_CONFIG.SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
      auth: {
        token: token
      },
      extraHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    
    // Register as dashboard with auth
    newSocket.on('connect', () => {
      console.log('Socket connected successfully');
      setConnectionStatus('connected');
      
      console.log('Registering as dashboard client...');
      newSocket.emit('register', {
        type: 'dashboard',
        token: token
      });
    });

    // Listen for registration confirmation
    newSocket.on('register-success', (data) => {
      console.log('Dashboard registration successful:', data);
    });

    // Listen for alerts
    newSocket.on('dashboard-alert', (alertData) => {
      console.log('Received dashboard alert:', alertData);
      setAlerts(prev => {
        const newAlerts = [...prev, alertData];
        console.log('Updated alerts:', newAlerts);
        return newAlerts;
      });
      
      // Also show browser notification
      if (Notification.permission === 'granted') {
        new Notification('Emergency Alert!', {
          body: `Alert from ${alertData.sender} - ${alertData.message}`,
        });
      }
    });

    // Handle connection events
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionStatus('error');
      
      // Attempt to reconnect with new token if authentication fails
      if (error.message === 'Authentication error') {
        const newToken = localStorage.getItem('token');
        if (newToken && newToken !== token) {
          console.log('Attempting reconnection with new token...');
          newSocket.auth = { token: newToken };
          newSocket.connect();
        }
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnectionStatus('disconnected');
    });

    setSocket(newSocket);

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      if (newSocket) {
        console.log('Cleaning up socket connection...');
        newSocket.disconnect();
      }
    };
  }, []); // Empty dependency array to run only once

  return (
    <div className="alert-dashboard">
      <h2>Alert Dashboard</h2>
      <div className="connection-status">
        Status: {connectionStatus}
      </div>
      <div className="alerts-container">
        {alerts.map((alert, index) => (
          <div key={index} className="alert-item">
            <div className="alert-header">
              <span className="alert-type">Emergency Alert</span>
              <span className="alert-time">
                {new Date(alert.timestamp || alert.receivedAt).toLocaleString()}
              </span>
            </div>
            <div className="alert-message">{alert.message}</div>
            <div className="alert-sender">From: {alert.sender}</div>
          </div>
        ))}
        {alerts.length === 0 && (
          <div className="no-alerts">No alerts received yet</div>
        )}
      </div>
      <style jsx>{`
        .alert-dashboard {
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        .connection-status {
          text-align: center;
          margin-bottom: 10px;
          padding: 5px;
          background-color: #f5f5f5;
          border-radius: 4px;
        }
        .alerts-container {
          margin-top: 20px;
        }
        .alert-item {
          background-color: #fff3f3;
          border: 1px solid #ffcdd2;
          border-radius: 4px;
          padding: 15px;
          margin-bottom: 10px;
        }
        .alert-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .alert-type {
          color: #d32f2f;
          font-weight: bold;
        }
        .alert-time {
          color: #666;
          font-size: 0.9em;
        }
        .alert-message {
          font-size: 1.1em;
          margin-bottom: 10px;
        }
        .alert-sender {
          color: #666;
          font-size: 0.9em;
        }
        .no-alerts {
          text-align: center;
          color: #666;
          padding: 20px;
        }
      `}</style>
    </div>
  );
};

export default AlertDashboard; 