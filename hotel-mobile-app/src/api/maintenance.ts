import apiClient from './client';
import { MaintenanceTask, ApiResponse } from '../types/api';

export const maintenanceAPI = {
  /**
   * Create a new maintenance task
   */
  createTask: async (data: {
    roomId: string;
    assignedTo?: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    issueType: 'PLUMBING' | 'ELECTRICAL' | 'HVAC' | 'FURNITURE' | 'APPLIANCES' | 'STRUCTURAL' | 'GENERAL';
    description: string;
    scheduledDate?: string;
    estimatedDuration?: number;
  }): Promise<MaintenanceTask> => {
    const response = await apiClient.post<any, any>('/maintenance/tasks', data);
    return response.data.data;
  },

  /**
   * Get all maintenance tasks with filters
   */
  getTasks: async (params?: {
    status?: string;
    assignedTo?: string;
    priority?: string;
    issueType?: string;
    roomId?: string;
  }): Promise<MaintenanceTask[]> => {
    const response = await apiClient.get<any, any>('/maintenance/tasks', {
      params,
    });
    return response.data.data || [];
  },

  /**
   * Get scheduled maintenance tasks
   */
  getScheduledTasks: async (): Promise<MaintenanceTask[]> => {
    const response = await apiClient.get<any, any>('/maintenance/tasks/scheduled');
    return response.data.data || [];
  },

  /**
   * Get urgent maintenance tasks
   */
  getUrgentTasks: async (): Promise<MaintenanceTask[]> => {
    const response = await apiClient.get<any, any>('/maintenance/tasks/urgent');
    return response.data.data || [];
  },

  /**
   * Get a single task by ID
   */
  getTaskById: async (id: string): Promise<MaintenanceTask> => {
    const response = await apiClient.get<any, any>(`/maintenance/tasks/${id}`);
    return response.data.data;
  },

  /**
   * Update task status
   */
  updateTaskStatus: async (
    id: string,
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
    resolutionNotes?: string,
    actualDuration?: number
  ): Promise<MaintenanceTask> => {
    const response = await apiClient.patch<any, any>(`/maintenance/tasks/${id}/status`, {
      status,
      resolutionNotes,
      actualDuration,
    });
    return response.data.data;
  },

  /**
   * Assign task to a staff member
   */
  assignTask: async (id: string, assignedTo: string): Promise<MaintenanceTask> => {
    const response = await apiClient.patch<any, any>(`/maintenance/tasks/${id}/assign`, {
      assignedTo,
    });
    return response.data.data;
  },

  /**
   * Delete a task
   */
  deleteTask: async (id: string): Promise<void> => {
    await apiClient.delete(`/maintenance/tasks/${id}`);
  },

  /**
   * Get maintenance statistics
   */
  getStats: async (): Promise<{
    totalTasks: number;
    scheduledTasks: number;
    inProgressTasks: number;
    urgentTasks: number;
    completedToday: number;
  }> => {
    const response = await apiClient.get<any, any>('/maintenance/stats');
    return response.data.data;
  },
};

export default maintenanceAPI;
