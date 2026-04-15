import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (__DEV__ ? 'http://127.0.0.1:3000/api/v1' : 'https://api.smartdoor.example.com/api/v1');

const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error reading token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const transformResponse = (data: any): any => {
  if (!data) return data;

  if (Array.isArray(data)) {
    return data.map(transformResponse);
  }

  if (typeof data === 'object' && data !== null) {
    const transformed: any = {};
    for (const key in data) {
      if (key === '_id') {
        transformed.id = data._id;
      } else if (typeof data[key] === 'object') {
        transformed[key] = transformResponse(data[key]);
      } else {
        transformed[key] = data[key];
      }
    }
    return transformed;
  }

  return data;
};

apiClient.interceptors.response.use(
  (response) => {
    response.data = transformResponse(response.data);
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response) {
      const status = error.response.status;

      if (status === 401 && originalRequest && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve) => {
            subscribeTokenRefresh((token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(apiClient(originalRequest));
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = await AsyncStorage.getItem('refreshToken');

          if (!refreshToken) {
            await clearAuthAndRedirect();
            return Promise.reject(error);
          }

          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;

          await AsyncStorage.setItem('authToken', accessToken);
          await AsyncStorage.setItem('refreshToken', newRefreshToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          onTokenRefreshed(accessToken);
          isRefreshing = false;

          return apiClient(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          await clearAuthAndRedirect();
          return Promise.reject(refreshError);
        }
      }

      if (status === 403) {
        console.error('Forbidden: You do not have permission');
      }

      if (status >= 500) {
        console.error('Server error:', error.response.data);
      }
    } else if (error.request) {
      console.error('Network error - no response from server');
    } else {
      console.error('Request error:', error.message);
    }

    return Promise.reject(error);
  }
);

const clearAuthAndRedirect = async () => {
  await AsyncStorage.removeItem('authToken');
  await AsyncStorage.removeItem('refreshToken');
  await AsyncStorage.removeItem('user');
};

export default apiClient;
