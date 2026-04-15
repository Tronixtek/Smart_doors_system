import apiClient from './client';
import { ApiResponse } from '../types/api';

export interface DashboardStats {
  rooms: {
    total: number;
    occupied: number;
    available: number;
    maintenance: number;
    occupancyRate: number;
  };
  reservations: {
    active: number;
    todayCheckIns: number;
    todayCheckOuts: number;
    upcomingArrivals: number;
  };
  revenue: {
    today: number;
    monthly: number;
    monthlyPaid: number;
    monthlyPending: number;
  };
  recentReservations: Array<{
    id: string;
    confirmationNumber?: string;
    guestName: string;
    checkInDate: string;
    checkOutDate: string;
    status: string;
    totalAmount: number;
    roomId?: {
      roomNumber: string;
      roomType: string;
    };
  }>;
}

export const statsAPI = {
  /**
   * Get dashboard statistics
   */
  getDashboard: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<any, any>('/stats/dashboard');
    return response.data.data;
  },

  /**
   * Get occupancy statistics
   */
  getOccupancy: async (startDate: string, endDate: string): Promise<any> => {
    const response = await apiClient.get<any, any>('/stats/occupancy', {
      params: { startDate, endDate },
    });
    return response.data.data;
  },

  /**
   * Get revenue statistics
   */
  getRevenue: async (startDate: string, endDate: string, groupBy: 'day' | 'week' | 'month' = 'day'): Promise<any> => {
    const response = await apiClient.get<any, any>('/stats/revenue', {
      params: { startDate, endDate, groupBy },
    });
    return response.data.data;
  },
};

export default statsAPI;
