import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './Chat.css';

let socket = null;

function Chat({ user }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (!socket) {
      socket = io('http://localhost:5000', {
        transports: ['websocket'],
        auth: {
          token
        }
      });

      socket.on('connect', () => {
        console.log('Connected to chat server');
        setIsConnected(true);
        socket.emit('join', { room: 'general' });
      });

      socket.on('message', (message) => {
        if (message.sender !== 'System') {
          setMessages(prev => [...prev, {
            ...message,
            timestamp: message.timestamp || new Date().toISOString()
          }]);
          setTimeout(scrollToBottom, 100);
        }
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from chat server');
        setIsConnected(false);
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    }

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, []);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socket?.connected) return;

    const message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: user?.username || 'Anonymous',
      timestamp: new Date().toISOString()
    };

    socket.emit('message', message);
    setMessages(prev => [...prev, message]);
    setInputText('');
    setTimeout(scrollToBottom, 100);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>Chat Room</h3>
        <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      <div className="messages-container">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.sender === user?.username ? 'sent' : 'received'}`}
          >
            <div className="message-sender">{message.sender}</div>
            <div className="message-text">{message.text}</div>
            <div className="message-timestamp">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="message-input-form">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          disabled={!isConnected}
          className={!isConnected ? 'disabled' : ''}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || !isConnected}
          className={!inputText.trim() || !isConnected ? 'disabled' : ''}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default Chat; 