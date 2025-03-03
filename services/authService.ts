import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    createdAt: string;
  };
}

class AuthService {
  private async request(endpoint: string, method: string, data?: any): Promise<any> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/auth${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'An error occurred');
    }

    return result;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.request('/login', 'POST', credentials);
      
      // Store the token
      await AsyncStorage.setItem('token', response.token);
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await this.request('/register', 'POST', data);
      
      // Store the token
      await AsyncStorage.setItem('token', response.token);
      
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem('token');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('token');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }
}

export const authService = new AuthService(); 