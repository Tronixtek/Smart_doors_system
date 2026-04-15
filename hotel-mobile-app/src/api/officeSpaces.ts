import apiClient from './client';
import { OfficeSpace } from '../types/api';

export const officeSpacesAPI = {
  getAll: async (params?: {
    site?: string;
    floor?: number;
    type?: OfficeSpace['type'];
    status?: OfficeSpace['status'];
    department?: string;
    q?: string;
  }): Promise<OfficeSpace[]> => {
    const response = await apiClient.get<any, any>('/office/spaces', { params });
    return response.data.data || [];
  },

  getById: async (id: string): Promise<OfficeSpace> => {
    const response = await apiClient.get<any, any>(`/office/spaces/${id}`);
    return response.data.data;
  },

  getActive: async (): Promise<OfficeSpace[]> => {
    const response = await apiClient.get<any, any>('/office/spaces/active');
    return response.data.data || [];
  },
};

export default officeSpacesAPI;
