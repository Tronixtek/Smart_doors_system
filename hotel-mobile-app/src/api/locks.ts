import apiClient from './client';
import { Lock, LockStats } from '../types/api';

export const locksAPI = {
  /**
   * Register a new lock (pair lock with room)
   */
  register: async (data: {
    lockMac: string;
    lockName: string;
    lockData: string;
    lockVersion: string;
    roomId: string;
    batteryLevel?: number;
    features?: {
      supportsPasscode: boolean;
      supportsCard: boolean;
      supportsFingerprint: boolean;
      supportsRemoteUnlock: boolean;
    };
    metadata?: any;
  }): Promise<Lock> => {
    const response = await apiClient.post<any, any>('/locks', data);
    return response.data.data;
  },

  /**
   * Get all locks with optional filters
   */
  getAll: async (params?: {
    status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'LOW_BATTERY';
    roomId?: string;
    lowBattery?: boolean;
  }): Promise<Lock[]> => {
    const response = await apiClient.get<any, any>('/locks', { params });
    return response.data.data || [];
  },

  /**
   * Get lock by ID
   */
  getById: async (id: string): Promise<Lock> => {
    const response = await apiClient.get<any, any>(`/locks/${id}`);
    return response.data.data;
  },

  /**
   * Get lock by room ID
   */
  getByRoomId: async (roomId: string): Promise<Lock> => {
    const response = await apiClient.get<any, any>(`/locks/room/${roomId}`);
    return response.data.data;
  },

  /**
   * Update lock information
   */
  update: async (
    id: string,
    data: {
      lockName?: string;
      status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'LOW_BATTERY';
      batteryLevel?: number;
      features?: any;
      metadata?: any;
      lastConnected?: string;
    }
  ): Promise<Lock> => {
    const response = await apiClient.patch<any, any>(`/locks/${id}`, data);
    return response.data.data;
  },

  /**
   * Update lock status
   */
  updateStatus: async (
    id: string,
    status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'LOW_BATTERY'
  ): Promise<Lock> => {
    const response = await apiClient.patch<any, any>(`/locks/${id}/status`, { status });
    return response.data.data;
  },

  /**
   * Delete lock
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/locks/${id}`);
  },

  /**
   * Get lock statistics
   */
  getStats: async (): Promise<LockStats> => {
    const response = await apiClient.get<any, any>('/locks/stats/overview');
    return response.data.data;
  },

  /**
   * Get locks with low battery
   */
  getLowBattery: async (threshold: number = 20): Promise<Lock[]> => {
    const response = await apiClient.get<any, any>('/locks', {
      params: { lowBattery: true },
    });
    return response.data.data || [];
  },
};

export default locksAPI;
