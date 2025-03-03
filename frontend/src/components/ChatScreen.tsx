import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActionSheetIOS,
  Linking,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

let socket: Socket | null = null;

const ChatScreen = () => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [inputText, setInputText] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);

  const initializeSocket = async () => {
    try {
      // Get both token and user data
      const [storedToken, userDataString] = await Promise.all([
        AsyncStorage.getItem('@auth_token'),
        AsyncStorage.getItem('@user_data')
      ]);

const initializeSocket = async () => {
  try {
    // Get both token and user data
    const [storedToken, userDataString] = await Promise.all([
      AsyncStorage.getItem('@auth_token'),
      AsyncStorage.getItem('@user_data')
    ]);

    console.log('Retrieved token:', storedToken ? 'Token exists' : 'No token');
    console.log('Retrieved user data:', userDataString);
    
    if (!storedToken || !userDataString) {
      console.error('No authentication token or user data found');
      Alert.alert('Error', 'Please log in again');
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

      // Only initialize socket after user data is confirmed valid
      if (!socket) {
        console.log('Initializing socket with token');
        
        // Create socket options with auth token
        const socketOptions = {
          transports: ['websocket'],
          autoConnect: true,
          auth: {
            token: storedToken  // Use the JWT token string from AsyncStorage
          }
        };
        
        console.log('Socket connection options:', socketOptions);
        socket = io(API_CONFIG.SOCKET_URL, socketOptions);
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      Alert.alert('Error', 'An error occurred while parsing user data');
      setIsConnecting(false);
      return;
    }
  } catch (error) {
    console.error('Error initializing socket:', error);
    Alert.alert('Error', 'An error occurred while initializing socket');
    setIsConnecting(false);
  }
}; 