import React, { useState, useEffect } from "react";
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../config';
import './ChatScreen.css';

// Message type definition
type MessageType = {
  id: string;
  text: string;
  sender: string;
  timestamp?: string;
  type?: 'text' | 'image' | 'location' | 'audio';
  uri?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
};

type UserData = {
  id: string;
  username: string;
  email: string;
};

const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [inputText, setInputText] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const initializeSocket = () => {
    try {
      // Get token and user data from localStorage
      const storedToken = localStorage.getItem('token');
      const userDataString = localStorage.getItem('user_data');

      console.log('Retrieved token:', storedToken ? 'Token exists' : 'No token');
      console.log('Retrieved user data:', userDataString);
      
      if (!storedToken || !userDataString) {
        console.error('No authentication token or user data found');
        setIsConnecting(false);
        return;
      }

      try {
        // Parse user data with validation
        const parsedUserData = JSON.parse(userDataString) as UserData;
        if (!parsedUserData.username) {
          throw new Error('Username is missing from user data');
        }
        console.log('Parsed user data:', parsedUserData);
        setUserData(parsedUserData);

        // Initialize socket connection
        const newSocket = io(API_CONFIG.SOCKET_URL, {
          transports: ['websocket'],
          autoConnect: true,
          auth: {
            token: storedToken
          }
        });

        // Set up socket event listeners
        newSocket.on('connect', () => {
          console.log('Socket connected');
          setIsConnected(true);
          setIsConnecting(false);
          
          // Join chat with user data
          newSocket.emit('join', {
            username: parsedUserData.username,
            userId: parsedUserData.id
          });
        });

        newSocket.on('message', (message: MessageType) => {
          console.log('Received message:', message);
          setMessages(prev => [...prev, message]);
        });

        newSocket.on('disconnect', () => {
          console.log('Socket disconnected');
          setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          setIsConnecting(false);
          setIsConnected(false);
        });

        setSocket(newSocket);

      } catch (error) {
        console.error('Error parsing user data:', error);
        setIsConnecting(false);
      }
    } catch (error) {
      console.error('Error initializing socket:', error);
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    initializeSocket();
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const sendMessage = (text: string) => {
    if (!text.trim() || !socket || !isConnected || !userData) return;

    const message: MessageType = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: userData.username,
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    try {
      socket.emit('message', message);
      setMessages(prev => [...prev, message]);
      setInputText('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  return (
    <div className="chat-screen">
      <div className="chat-header">
        <h2>Chat</h2>
        <div className="connection-status">
          {isConnecting ? (
            <span className="status-connecting">Connecting...</span>
          ) : (
            <span className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          )}
        </div>
      </div>

      <div className="messages-list">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.sender === userData?.username ? 'own' : 'other'}`}
          >
            <div className="message-sender">{message.sender}</div>
            <div className="message-text">{message.text}</div>
            <div className="message-timestamp">
              {new Date(message.timestamp || Date.now()).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="message-input">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          disabled={!isConnected}
        />
        <button
          type="submit"
          disabled={!isConnected || !inputText.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatScreen;