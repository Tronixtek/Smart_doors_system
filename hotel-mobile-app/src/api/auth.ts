import apiClient from './client';
import { LoginRequest, LoginResponse, User, ApiResponse } from '../types/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authAPI = {
  /**
   * Login with email and password
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<any, any>('/auth/login', credentials);
    
    // Store tokens and user in AsyncStorage
    if (response.data.accessToken && response.data.refreshToken) {
      await AsyncStorage.setItem('authToken', response.data.accessToken);
      await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  /**
   * Logout - revoke refresh token and clear local storage
   */
  logout: async (refreshToken: string): Promise<void> => {
    try {
      await apiClient.post('/auth/logout', { refreshToken });
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
    }
  },

  /**
   * Get current user profile
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<any, any>('/auth/me');
    return response.data.data;
  },

  /**
   * Refresh access token using refresh token
   */
  refreshToken: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const response = await apiClient.post<any, any>('/auth/refresh', {
      refreshToken,
    });
    
    // Store new tokens
    if (response.data.accessToken && response.data.refreshToken) {
      await AsyncStorage.setItem('authToken', response.data.accessToken);
      await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
    }
    
    return response.data;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: async (): Promise<boolean> => {
    const token = await AsyncStorage.getItem('authToken');
    return !!token;
  },
};

export default authAPI;
