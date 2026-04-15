import apiClient from './client';
import { LockKey, LockKeyStats } from '../types/api';

export const lockKeysAPI = {
  /**
   * Create a new lock key
   */
  create: async (data: {
    lockId: string;
    roomId: string;
    reservationId: string;
    guestName: string;
    keyType: 'PASSCODE' | 'CARD' | 'FINGERPRINT' | 'EKEY';
    keyIdentifier: string;
    startDate: string;
    endDate: string;
    metadata?: any;
  }): Promise<LockKey> => {
    const response = await apiClient.post<any, any>('/lock-keys', data);
    return response.data.data;
  },

  /**
   * Get all lock keys with optional filters
   */
  getAll: async (params?: {
    status?: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'PENDING';
    lockId?: string;
    roomId?: string;
    keyType?: 'PASSCODE' | 'CARD' | 'FINGERPRINT' | 'EKEY';
    reservationId?: string;
    guestName?: string;
  }): Promise<LockKey[]> => {
    const response = await apiClient.get<any, any>('/lock-keys', { params });
    return response.data.data || [];
  },

  /**
   * Get lock key by ID
   */
  getById: async (id: string): Promise<LockKey> => {
    const response = await apiClient.get<any, any>(`/lock-keys/${id}`);
    return response.data.data;
  },

  /**
   * Get all lock keys for a reservation
   */
  getByReservationId: async (reservationId: string): Promise<LockKey[]> => {
    const response = await apiClient.get<any, any>(`/lock-keys/reservation/${reservationId}`);
    return response.data.data || [];
  },

  /**
   * Get all currently active lock keys
   */
  getActiveKeys: async (): Promise<LockKey[]> => {
    const response = await apiClient.get<any, any>('/lock-keys/active/list');
    return response.data.data || [];
  },

  /**
   * Revoke a lock key
   */
  revoke: async (id: string): Promise<LockKey> => {
    const response = await apiClient.patch<any, any>(`/lock-keys/${id}/revoke`, {});
    return response.data.data;
  },

  /**
   * Extend lock key validity period
   */
  extend: async (id: string, newEndDate: string): Promise<LockKey> => {
    const response = await apiClient.patch<any, any>(`/lock-keys/${id}/extend`, { newEndDate });
    return response.data.data;
  },

  /**
   * Delete a lock key (admin only)
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/lock-keys/${id}`);
  },

  /**
   * Get lock key statistics
   */
  getStats: async (): Promise<LockKeyStats> => {
    const response = await apiClient.get<any, any>('/lock-keys/stats/overview');
    return response.data.data;
  },

  /**
   * Update lock key status (e.g., from PENDING to ACTIVE after programming the lock)
   */
  updateStatus: async (id: string, status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'PENDING'): Promise<LockKey> => {
    const response = await apiClient.patch<any, any>(`/lock-keys/${id}`, { status });
    return response.data.data;
  },

  /**
   * Activate a pending lock key (mark as ACTIVE after programming into lock)
   */
  activate: async (id: string): Promise<LockKey> => {
    const response = await apiClient.patch<any, any>(`/lock-keys/${id}`, { status: 'ACTIVE' });
    return response.data.data;
  },
};

export default lockKeysAPI;
