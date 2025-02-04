import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../config';

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp?: string;
}

let socket: Socket | null = null;

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const initializeSocket = async () => {
      try {
        // Get the authentication token
        const token = localStorage.getItem('token');
        console.log('Retrieved token:', token ? 'Token exists' : 'No token');
        
        if (!token) {
          console.error('No authentication token found');
          setIsConnecting(false);
          return;
        }

        if (!socket) {
          console.log('Connecting to chat server at:', API_CONFIG.SOCKET_URL);
          socket = io(API_CONFIG.SOCKET_URL, {
            transports: ['websocket'],
            autoConnect: true,
            auth: {
              token: token
            }
          });

          socket.on('connect', () => {
            console.log('Connected to chat server successfully');
            setIsConnected(true);
            setIsConnecting(false);
            socket?.emit('join', { room: 'general' });
          });

          socket.on('message', (message: Message) => {
            console.log('Received message:', message);
            setMessages(prev => [...prev, {
              ...message,
              timestamp: message.timestamp || new Date().toISOString()
            }]);
            setTimeout(scrollToBottom, 100);
          });

          socket.on('disconnect', () => {
            console.log('Disconnected from chat server');
            setIsConnected(false);
          });

          socket.on('connect_error', (error) => {
            console.error('Connection error:', error.message);
            setIsConnected(false);
            setIsConnecting(false);
          });
        }
      } catch (error) {
        console.error('Socket initialization error:', error);
        setIsConnecting(false);
      }
    };

    initializeSocket();

    return () => {
      if (socket) {
        console.log('Cleaning up socket connection');
        socket.disconnect();
        socket = null;
        setIsConnected(false);
      }
    };
  }, []);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socket?.connected) return;

    const message: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'You',
      timestamp: new Date().toISOString()
    };

    try {
      socket.emit('message', message);
      console.log('Sent message:', message);
      setMessages(prev => [...prev, message]);
      setInputText('');
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Connection Status */}
      {isConnecting ? (
        <div className="bg-yellow-100 p-2 text-center">
          <span className="text-yellow-800 text-sm">Connecting to chat server...</span>
        </div>
      ) : !isConnected && (
        <div className="bg-red-100 p-2 text-center">
          <span className="text-red-800 text-sm">Disconnected from chat server</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'You' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.sender === 'You'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                <div className={`text-xs mb-1 ${
                  message.sender === 'You' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.sender}
                </div>
                <div className="text-sm">{message.text}</div>
                {message.timestamp && (
                  <div className={`text-xs mt-1 text-right ${
                    message.sender === 'You' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 bg-white border-t">
        <div className="flex space-x-4">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className={`flex-1 rounded-full border p-2 px-4 text-sm ${
              !isConnected
                ? 'bg-gray-100 text-gray-500 border-gray-200'
                : 'border-gray-300'
            }`}
            disabled={!isConnected}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || !isConnected}
            className={`rounded-full p-2 px-6 text-sm font-medium ${
              !inputText.trim() || !isConnected
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat; 