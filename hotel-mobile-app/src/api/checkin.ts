import apiClient from './client';
import { CheckInRequest, CheckOutRequest, ApiResponse } from '../types/api';

export const checkInAPI = {
  /**
   * Perform check-in with optional key generation
   */
  checkInWithKey: async (data: CheckInRequest & { generateKey: boolean; notes?: string }): Promise<any> => {
    const response = await apiClient.post<any, any>('/checkin', data);
    return response.data;
  },
};

export const checkOutAPI = {
  /**
   * Perform check-out with optional key revocation
   */
  checkOutWithKeyRevoke: async (data: CheckOutRequest & { revokeKey: boolean; notes?: string }): Promise<any> => {
    const response = await apiClient.post<any, any>('/checkin/checkout', data);
    return response.data;
  },
};
