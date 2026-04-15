import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage keys for authentication
 */
export const AUTH_KEYS = {
  ACCESS_TOKEN: 'authToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
};

/**
 * Token management utilities
 */
export const tokenManager = {
  /**
   * Get access token from storage
   */
  getAccessToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(AUTH_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  },

  /**
   * Get refresh token from storage
   */
  getRefreshToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  },

  /**
   * Store tokens
   */
  setTokens: async (accessToken: string, refreshToken: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, accessToken);
      await AsyncStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, refreshToken);
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw error;
    }
  },

  /**
   * Clear all auth data
   */
  clearAuth: async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove([
        AUTH_KEYS.ACCESS_TOKEN,
        AUTH_KEYS.REFRESH_TOKEN,
        AUTH_KEYS.USER,
      ]);
    } catch (error) {
      console.error('Error clearing auth data:', error);
      throw error;
    }
  },

  /**
   * Check if tokens exist
   */
  hasTokens: async (): Promise<boolean> => {
    try {
      const accessToken = await AsyncStorage.getItem(AUTH_KEYS.ACCESS_TOKEN);
      const refreshToken = await AsyncStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);
      return !!(accessToken && refreshToken);
    } catch (error) {
      console.error('Error checking tokens:', error);
      return false;
    }
  },
};

/**
 * Decode JWT token payload (without verification)
 * Use only for reading non-sensitive data like expiry time
 */
export const decodeJWT = (token: string): any => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    // Check if expiry time has passed
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

/**
 * Get token expiry time in seconds from now
 */
export const getTokenExpiryTime = (token: string): number => {
  try {
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) {
      return 0;
    }
    
    const currentTime = Date.now() / 1000;
    return Math.max(0, decoded.exp - currentTime);
  } catch (error) {
    return 0;
  }
};
