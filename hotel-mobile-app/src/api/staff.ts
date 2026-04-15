import apiClient from './client';
import { User } from '../types/api';

interface CreateStaffData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  phoneNumber?: string;
}

interface UpdateStaffData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
}

interface StaffStats {
  totalStaff: number;
  activeStaff: number;
  inactiveStaff: number;
  staffByRole: Record<string, number>;
}

export const staffAPI = {
  // Get all staff with optional filters
  getStaff: async (params?: {
    role?: string;
    status?: string;
    search?: string;
  }) => {
    const response = await apiClient.get<User[]>('/staff', { params });
    return response.data;
  },

  // Get staff by specific role
  getStaffByRole: async (role: string) => {
    const response = await apiClient.get<User[]>(`/staff/by-role/${role}`);
    return response.data;
  },

  // Get single staff member by ID
  getStaffById: async (id: string) => {
    const response = await apiClient.get<User>(`/staff/${id}`);
    return response.data;
  },

  // Create new staff member
  createStaff: async (data: CreateStaffData) => {
    const response = await apiClient.post<User>('/staff', data);
    return response.data;
  },

  // Update staff member
  updateStaff: async (id: string, data: UpdateStaffData) => {
    const response = await apiClient.patch<User>(`/staff/${id}`, data);
    return response.data;
  },

  // Change staff password
  changePassword: async (id: string, newPassword: string) => {
    const response = await apiClient.patch(`/staff/${id}/password`, { newPassword });
    return response.data;
  },

  // Activate/deactivate staff member
  updateStatus: async (id: string, status: string) => {
    const response = await apiClient.patch<User>(`/staff/${id}/status`, { status });
    return response.data;
  },

  // Delete staff member (soft delete)
  deleteStaff: async (id: string) => {
    const response = await apiClient.delete(`/staff/${id}`);
    return response.data;
  },

  // Get staff statistics
  getStats: async () => {
    const response = await apiClient.get<StaffStats>('/staff/stats/overview');
    return response.data;
  },
};
