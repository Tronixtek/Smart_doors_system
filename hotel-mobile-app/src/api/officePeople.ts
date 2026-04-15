import apiClient from './client';
import { OfficePerson } from '../types/api';

export const officePeopleAPI = {
  getAll: async (params?: {
    personType?: OfficePerson['personType'];
    status?: OfficePerson['status'];
    department?: string;
    company?: string;
    q?: string;
  }): Promise<OfficePerson[]> => {
    const response = await apiClient.get<any, any>('/office/people', { params });
    return response.data.data || [];
  },

  getById: async (id: string): Promise<OfficePerson> => {
    const response = await apiClient.get<any, any>(`/office/people/${id}`);
    return response.data.data;
  },

  create: async (data: {
    firstName: string;
    lastName: string;
    email?: string;
    phoneNumber?: string;
    personType: OfficePerson['personType'];
    status?: OfficePerson['status'];
    employeeId?: string;
    company?: string;
    department?: string;
    title?: string;
    hostUserId?: string;
    identityDocument?: string;
    notes?: string;
  }): Promise<OfficePerson> => {
    const response = await apiClient.post<any, any>('/office/people', data);
    return response.data.data;
  },
};

export default officePeopleAPI;
