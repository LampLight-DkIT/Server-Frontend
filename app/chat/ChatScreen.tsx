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
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

// Add these type definitions for better message handling
type MessageContent = {
  uri?: string;
  duration?: number;
  latitude?: number;
  longitude?: number;
  address?: string;
};

type MessageType = {
  id: string;
  text: string;
  sender: string;
  timestamp?: string;
  type?: 'text' | 'image' | 'location' | 'audio';
  content?: MessageContent;
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
  const flatListRef = useRef<FlatList<MessageType>>(null);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    const initializeSocket = async () => {
      try {
        // Get both token and user data
        const [token, userDataString] = await Promise.all([
          AsyncStorage.getItem('@auth_token'),
          AsyncStorage.getItem('@user_data')
        ]);

        console.log('Retrieved token:', token ? 'Token exists' : 'No token');
        console.log('Retrieved user data:', userDataString);
        
        if (!token || !userDataString) {
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
            console.log('Initializing socket with user:', parsedUserData.username);
            
            // Create socket options with auth data matching backend structure
            const socketOptions = {
              transports: ['websocket'],
              autoConnect: true,
              auth: {
                token: {
                  id: parsedUserData.id,
                  username: parsedUserData.username,
                  email: parsedUserData.email
                }
              }
            };
            
            console.log('Socket connection options:', socketOptions);
            socket = io(API_CONFIG.SOCKET_URL, socketOptions);

            socket.on('connect', () => {
              console.log('Connected to chat server successfully as:', parsedUserData.username);
              setIsConnected(true);
              setIsConnecting(false);
              
              // Include username in join event
              socket?.emit('join', { 
                room: 'general',
                username: parsedUserData.username 
              });
            });

            socket.on('message', (message: MessageType) => {
              console.log('Received message:', message);
              
              // Handle different message types
              switch (message.type) {
                case 'image':
                  // Download and cache image if needed
                  if (message.content?.uri) {
                    cacheImage(message.content.uri);
                  }
                  break;
                  
                case 'audio':
                  // Download and prepare audio if needed
                  if (message.content?.uri) {
                    prepareAudio(message.content.uri);
                  }
                  break;
                  
                case 'location':
                  // Reverse geocode location if address is missing
                  if (message.content?.latitude && message.content?.longitude && !message.content?.address) {
                    reverseGeocode(message.content);
                  }
                  break;
              }
              
              setMessages(prev => [...prev, message]);
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
              Alert.alert('Connection Error', 'Failed to connect to chat server. Please check your connection.');
            });

            socket.on('error', (error: any) => {
              console.error('Socket error:', error);
              Alert.alert('Error', 'An error occurred in the chat connection');
            });
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
          Alert.alert('Error', 'Invalid user data format. Please log in again.');
          setIsConnecting(false);
          return;
        }
      } catch (error) {
        console.error('Socket initialization error:', error);
        setIsConnecting(false);
        Alert.alert('Error', 'Failed to initialize chat connection');
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

  const sendMessage = () => {
    if (!inputText.trim() || !socket?.connected || !userData) {
      console.log('Send message checks:', {
        hasText: !!inputText.trim(),
        isConnected: socket?.connected,
        hasUserData: !!userData,
        userData: userData
      });
      
      if (!socket?.connected) {
        Alert.alert('Error', 'Not connected to chat server');
      } else if (!userData) {
        Alert.alert('Error', 'User data not available');
      }
      return;
    }

    const message: MessageType = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: userData.username,
      timestamp: new Date().toISOString()
    };

    try {
      console.log('Sending message as:', userData.username, message);
      socket.emit('message', message);
      setMessages(prev => [...prev, message]);
      setInputText("");
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleImageSelection = async (imageUri: string) => {
    if (!userData) return;
    
    const message: MessageType = {
      id: Date.now().toString(),
      text: "Photo Message",
      sender: userData.username,
      type: 'image',
      content: { uri: imageUri },
      timestamp: new Date().toISOString()
    };

    try {
      socket?.emit('message', message);
      setMessages(prev => [...prev, message]);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error sending image:', error);
      Alert.alert('Error', 'Failed to send image');
    }
  };

  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera access to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await handleImageSelection(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const openGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant gallery access to select photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await handleImageSelection(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  const shareLocation = async () => {
    if (!userData) return;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant location access to share your location.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      let address = '';
      try {
        const [addressResult] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (addressResult) {
          address = [
            addressResult.street,
            addressResult.city,
            addressResult.region,
          ].filter(Boolean).join(', ');
        }
      } catch (error) {
        console.warn('Error getting address:', error);
      }

      const message: MessageType = {
        id: Date.now().toString(),
        text: address || '📍 Shared Location',
        sender: userData.username,
        type: 'location',
        timestamp: new Date().toISOString(),
        content: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address,
        },
      };

      socket?.emit('message', message);
      setMessages(prev => [...prev, message]);
      setShowAttachmentOptions(false);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone access to record audio.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await newRecording.startAsync();
      setRecording(newRecording);
      setIsRecording(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording || !userData) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (uri) {
        const message: MessageType = {
          id: Date.now().toString(),
          text: '🎤 Audio Message',
          sender: userData.username,
          type: 'audio',
          content: { uri },
          timestamp: new Date().toISOString()
        };

        socket?.emit('message', message);
        setMessages(prev => [...prev, message]);
      }

      setRecording(null);
      setIsRecording(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const handleImagePicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            openCamera();
          } else if (buttonIndex === 2) {
            openGallery();
          }
        }
      );
    } else {
      Alert.alert(
        'Select Photo',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: openCamera },
          { text: 'Choose from Library', onPress: openGallery },
        ],
        { cancelable: true }
      );
    }
  };

  // Add these utility functions
  const cacheImage = async (uri: string) => {
    try {
      const { exists } = await FileSystem.getInfoAsync(uri);
      if (!exists) {
        await FileSystem.downloadAsync(
          uri,
          FileSystem.cacheDirectory + 'images/' + Date.now()
        );
      }
    } catch (error) {
      console.error('Error caching image:', error);
    }
  };

  const prepareAudio = async (uri: string) => {
    try {
      const sound = new Audio.Sound();
      await sound.loadAsync({ uri });
      // Store the sound object if needed for playback
    } catch (error) {
      console.error('Error preparing audio:', error);
    }
  };

  const reverseGeocode = async (location: MessageContent) => {
    if (!location.latitude || !location.longitude) return;
    
    try {
      const [result] = await Location.reverseGeocodeAsync({
        latitude: location.latitude,
        longitude: location.longitude
      });
      
      if (result) {
        location.address = `${result.street}, ${result.city}`;
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  // Update the renderMessage function to handle media better
  const renderMessage = ({ item }: { item: MessageType }) => {
    const isCurrentUser = userData?.username === item.sender;
    
    return (
      <View style={[styles.messageBubble, isCurrentUser ? styles.sentMessage : styles.receivedMessage]}>
        <Text style={[styles.senderText, isCurrentUser ? styles.sentSenderText : styles.receivedSenderText]}>
          {item.sender}
        </Text>
        
        {item.type === 'image' && item.content?.uri && (
          <TouchableOpacity onPress={() => handleImagePress(item.content?.uri)}>
            <Image 
              source={{ uri: item.content.uri }} 
              style={styles.imageMessage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
        
        {item.type === 'location' && item.content && (
          <TouchableOpacity 
            onPress={() => handleLocationPress(item.content)}
            style={styles.locationContainer}
          >
            <MaterialIcons name="location-on" size={24} color={isCurrentUser ? "#fff" : "#000"} />
            <Text style={[styles.messageText, isCurrentUser ? styles.sentMessageText : styles.receivedMessageText]}>
              {item.content.address || 'Shared Location'}
            </Text>
          </TouchableOpacity>
        )}
        
        {item.type === 'audio' && item.content?.uri && (
          <AudioPlayer 
            uri={item.content.uri}
            duration={item.content.duration}
            isCurrentUser={isCurrentUser}
          />
        )}
        
        {(!item.type || item.type === 'text') && (
          <Text style={[styles.messageText, isCurrentUser ? styles.sentMessageText : styles.receivedMessageText]}>
            {item.text}
          </Text>
        )}
        
        {item.timestamp && (
          <Text style={[styles.timestampText, isCurrentUser ? styles.sentTimestampText : styles.receivedTimestampText]}>
            {new Date(item.timestamp).toLocaleTimeString()}
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {isConnecting ? (
        <View style={styles.connectionStatus}>
          <Text style={styles.connectionStatusText}>Connecting to chat server...</Text>
        </View>
      ) : !isConnected && (
        <View style={[styles.connectionStatus, styles.disconnectedStatus]}>
          <Text style={styles.connectionStatusText}>Disconnected from chat server</Text>
        </View>
      )}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={scrollToBottom}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={() => setShowAttachmentOptions(!showAttachmentOptions)}
            disabled={!isConnected}
          >
            <MaterialIcons 
              name="attach-file" 
              size={24} 
              color={!isConnected ? '#999' : '#007AFF'} 
            />
          </TouchableOpacity>

          {showAttachmentOptions && (
            <View style={styles.attachmentOptions}>
              <TouchableOpacity
                style={styles.attachmentOption}
                onPress={handleImagePicker}
              >
                <MaterialIcons name="photo-camera" size={24} color="#007AFF" />
                <Text style={styles.attachmentOptionText}>Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachmentOption}
                onPress={shareLocation}
              >
                <MaterialIcons name="location-on" size={24} color="#007AFF" />
                <Text style={styles.attachmentOptionText}>Location</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachmentOption}
                onPress={isRecording ? stopRecording : startRecording}
              >
                <Ionicons
                  name={isRecording ? "stop-circle" : "mic"}
                  size={24}
                  color="#007AFF"
                />
                <Text style={styles.attachmentOptionText}>
                  {isRecording ? "Stop" : "Audio"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TextInput
            style={[
              styles.input,
              !isConnected && styles.inputDisabled
            ]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor={!isConnected ? '#999' : '#666'}
            multiline
            maxLength={1000}
            editable={isConnected}
          />
          <TouchableOpacity 
            style={[
              styles.sendButton,
              (!inputText.trim() || !isConnected) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || !isConnected}
          >
            <Ionicons 
              name="send" 
              size={24} 
              color={(!inputText.trim() || !isConnected) ? '#999' : 'white'} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  connectionStatus: {
    backgroundColor: '#FFE58F',
    padding: 8,
    alignItems: 'center',
  },
  disconnectedStatus: {
    backgroundColor: '#FFA39E',
  },
  connectionStatusText: {
    color: '#8C6D1F',
    fontSize: 12,
  },
  messageList: {
    padding: 10,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 15,
    marginVertical: 5,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
  },
  senderText: {
    fontSize: 12,
    marginBottom: 2,
  },
  sentSenderText: {
    color: '#ffffff',
    opacity: 0.7,
  },
  receivedSenderText: {
    color: '#888',
  },
  messageText: {
    fontSize: 16,
  },
  sentMessageText: {
    color: '#ffffff',
  },
  receivedMessageText: {
    color: '#000000',
  },
  timestampText: {
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  sentTimestampText: {
    color: '#ffffff',
    opacity: 0.7,
  },
  receivedTimestampText: {
    color: '#888',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'white',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    maxHeight: 100,
    backgroundColor: '#ffffff',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#eee',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#B8B8B8',
  },
  imageMessage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginVertical: 5,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attachButton: {
    padding: 10,
  },
  attachmentOptions: {
    position: 'absolute',
    bottom: 70,
    left: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  attachmentOption: {
    alignItems: 'center',
    padding: 10,
  },
  attachmentOptionText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 5,
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  audioDuration: {
    fontSize: 12,
    marginLeft: 10,
  },
  audioProgress: {
    height: 3,
    backgroundColor: '#ddd',
    borderRadius: 3,
    overflow: 'hidden',
    flex: 1,
    marginHorizontal: 10,
  },
  audioProgressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  }
});

export default ChatScreen; 