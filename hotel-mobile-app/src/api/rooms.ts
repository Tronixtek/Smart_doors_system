import apiClient from './client';
import { Room, ApiResponse } from '../types/api';

export const roomsAPI = {
  /**
   * Get all rooms with optional filters
   */
  getAll: async (params?: {
    status?: string;
    roomType?: string;
    floor?: number;
  }): Promise<Room[]> => {
    const response = await apiClient.get<any, any>('/rooms', {
      params,
    });
    return response.data.data || [];
  },

  /**
   * Get room by ID
   */
  getById: async (id: string): Promise<Room> => {
    const response = await apiClient.get<any, any>(`/rooms/${id}`);
    return response.data.data;
  },

  /**
   * Get available rooms for date range
   */
  getAvailable: async (checkIn: string, checkOut: string, roomType?: string): Promise<Room[]> => {
    const response = await apiClient.get<any, any>('/rooms/available', {
      params: {
        checkIn,
        checkOut,
        roomType,
      },
    });
    return response.data.data || [];
  },

  /**
   * Update room status
   */
  updateStatus: async (id: string, status: Room['status']): Promise<Room> => {
    const response = await apiClient.patch<any, any>(`/rooms/${id}/status`, {
      status,
    });
    return response.data.data;
  },

  /**
   * Get rooms that need cleaning (for housekeeping)
   */
  getCleaningRooms: async (): Promise<Room[]> => {
    const response = await apiClient.get<any, any>('/rooms', {
      params: { status: 'CLEANING' },
    });
    return response.data.data || [];
  },

  /**
   * Backward-compatible alias for housekeeping flows.
   */
  getDirtyRooms: async (): Promise<Room[]> => {
    const response = await apiClient.get<any, any>('/rooms', {
      params: { status: 'CLEANING' },
    });
    return response.data.data || [];
  },

  /**
   * Get rooms in maintenance
   */
  getMaintenanceRooms: async (): Promise<Room[]> => {
    const response = await apiClient.get<any, any>('/rooms', {
      params: { status: 'MAINTENANCE' },
    });
    return response.data.data || [];
  },
};

export default roomsAPI;
