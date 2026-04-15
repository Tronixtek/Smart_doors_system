import apiClient from './client';
import { Reservation, ApiResponse, PaginatedResponse } from '../types/api';

export const reservationsAPI = {
  /**
   * Get all reservations with optional filters
   */
  getAll: async (params?: {
    status?: string;
    checkInDate?: string;
    checkOutDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Reservation>> => {
    const response = await apiClient.get<any, any>('/reservations', {
      params,
    });
    return response.data;
  },

  /**
   * Get reservation by ID
   */
  getById: async (id: string): Promise<Reservation> => {
    const response = await apiClient.get<any, any>(`/reservations/${id}`);
    return response.data.data;
  },

  /**
   * Get today's check-ins
   */
  getTodayCheckIns: async (): Promise<Reservation[]> => {
    const response = await apiClient.get<any, any>('/reservations/today-checkins');
    return response.data.data;
  },

  /**
   * Get today's check-outs
   */
  getTodayCheckOuts: async (): Promise<Reservation[]> => {
    const response = await apiClient.get<any, any>('/reservations/today-checkouts');
    return response.data.data;
  },

  /**
   * Create new reservation
   */
  create: async (data: Partial<Reservation>): Promise<Reservation> => {
    const response = await apiClient.post<any, any>('/reservations', data);
    return response.data.data;
  },

  /**
   * Update reservation
   */
  update: async (id: string, data: Partial<Reservation>): Promise<Reservation> => {
    const response = await apiClient.patch<any, any>(`/reservations/${id}`, data);
    return response.data.data;
  },

  /**
   * Cancel reservation
   */
  cancel: async (id: string): Promise<Reservation> => {
    const response = await apiClient.patch<any, any>(`/reservations/${id}/cancel`);
    return response.data.data;
  },

  /**
   * Search reservations by confirmation number or guest name
   */
  search: async (query: string): Promise<Reservation[]> => {
    const response = await apiClient.get<any, any>('/reservations/search', {
      params: { q: query },
    });
    return response.data.data;
  },
};

export default reservationsAPI;
