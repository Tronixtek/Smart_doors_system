import { create } from 'zustand';
import { User, LoginRequest } from '../types/api';
import authAPI from '../api/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials: LoginRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login(credentials);
      set({
        user: response.user,
        token: response.accessToken,
        refreshToken: response.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || error.response?.data?.message || 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local state even if logout API fails
      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        error: null,
      });
    }
  },

  loadUser: async () => {
    set({ isLoading: true });
    try {
      const token = await AsyncStorage.getItem('authToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      const userString = await AsyncStorage.getItem('user');
      
      if (token && refreshToken && userString) {
        const user = JSON.parse(userString);
        set({
          token,
          refreshToken,
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error loading user:', error);
      set({ isLoading: false });
    }
  },

  setTokens: async (accessToken: string, refreshToken: string) => {
    await AsyncStorage.setItem('authToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    set({ token: accessToken, refreshToken });
  },

  clearError: () => set({ error: null }),
}));
