import apiClient from './client';
import { HousekeepingTask, ApiResponse } from '../types/api';

export const housekeepingAPI = {
  /**
   * Create a new housekeeping task
   */
  createTask: async (data: {
    roomId: string;
    assignedTo?: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH';
    taskType?: 'CHECKOUT_CLEAN' | 'DAILY_CLEAN' | 'DEEP_CLEAN';
    notes?: string;
    estimatedDuration?: number;
  }): Promise<HousekeepingTask> => {
    const response = await apiClient.post<any, any>('/housekeeping/tasks', data);
    return response.data.data;
  },

  /**
   * Get all housekeeping tasks with filters
   */
  getTasks: async (params?: {
    status?: string;
    assignedTo?: string;
    priority?: string;
    roomId?: string;
  }): Promise<HousekeepingTask[]> => {
    const response = await apiClient.get<any, any>('/housekeeping/tasks', {
      params,
    });
    return response.data.data || [];
  },

  /**
   * Get today's housekeeping tasks
   */
  getTodayTasks: async (): Promise<HousekeepingTask[]> => {
    const response = await apiClient.get<any, any>('/housekeeping/tasks/today');
    return response.data.data || [];
  },

  /**
   * Get pending housekeeping tasks
   */
  getPendingTasks: async (): Promise<HousekeepingTask[]> => {
    const response = await apiClient.get<any, any>('/housekeeping/tasks/pending');
    return response.data.data || [];
  },

  /**
   * Get a single task by ID
   */
  getTaskById: async (id: string): Promise<HousekeepingTask> => {
    const response = await apiClient.get<any, any>(`/housekeeping/tasks/${id}`);
    return response.data.data;
  },

  /**
   * Update task status
   */
  updateTaskStatus: async (id: string, status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED', completionNotes?: string): Promise<HousekeepingTask> => {
    const response = await apiClient.patch<any, any>(`/housekeeping/tasks/${id}/status`, {
      status,
      completionNotes,
    });
    return response.data.data;
  },

  /**
   * Assign task to a staff member
   */
  assignTask: async (id: string, assignedTo: string): Promise<HousekeepingTask> => {
    const response = await apiClient.patch<any, any>(`/housekeeping/tasks/${id}/assign`, {
      assignedTo,
    });
    return response.data.data;
  },

  /**
   * Delete a task
   */
  deleteTask: async (id: string): Promise<void> => {
    await apiClient.delete(`/housekeeping/tasks/${id}`);
  },

  /**
   * Get housekeeping statistics
   */
  getStats: async (): Promise<{
    totalTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    completedToday: number;
  }> => {
    const response = await apiClient.get<any, any>('/housekeeping/stats');
    return response.data.data;
  },
};

export default housekeepingAPI;
