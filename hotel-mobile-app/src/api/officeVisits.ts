import apiClient from './client';
import { OfficeVisit } from '../types/api';

export const officeVisitsAPI = {
  getAll: async (params?: {
    status?: OfficeVisit['status'];
    personId?: string;
    spaceId?: string;
    hostUserId?: string;
    from?: string;
    to?: string;
  }): Promise<OfficeVisit[]> => {
    const response = await apiClient.get<any, any>('/office/visits', { params });
    return response.data.data || [];
  },

  getToday: async (): Promise<OfficeVisit[]> => {
    const response = await apiClient.get<any, any>('/office/visits/today');
    return response.data.data || [];
  },

  getById: async (id: string): Promise<OfficeVisit> => {
    const response = await apiClient.get<any, any>(`/office/visits/${id}`);
    return response.data.data;
  },

  create: async (data: {
    personId: string;
    spaceId: string;
    hostUserId?: string;
    title: string;
    purpose: OfficeVisit['purpose'];
    startAt: string;
    endAt: string;
    visitorCount?: number;
    credentialRequested?: boolean;
    credentialType?: OfficeVisit['credentialType'];
    notes?: string;
  }): Promise<OfficeVisit> => {
    const response = await apiClient.post<any, any>('/office/visits', data);
    return response.data.data;
  },

  checkIn: async (id: string): Promise<OfficeVisit> => {
    const response = await apiClient.patch<any, any>(`/office/visits/${id}/check-in`, {});
    return response.data.data;
  },

  checkOut: async (id: string): Promise<OfficeVisit> => {
    const response = await apiClient.patch<any, any>(`/office/visits/${id}/check-out`, {});
    return response.data.data;
  },

  cancel: async (id: string): Promise<OfficeVisit> => {
    const response = await apiClient.patch<any, any>(`/office/visits/${id}/cancel`, {});
    return response.data.data;
  },
};

export default officeVisitsAPI;
