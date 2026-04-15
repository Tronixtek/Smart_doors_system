import { create } from 'zustand';
import { Reservation } from '../types/api';
import reservationsAPI from '../api/reservations';

interface ReservationState {
  reservations: Reservation[];
  selectedReservation: Reservation | null;
  todayCheckIns: Reservation[];
  todayCheckOuts: Reservation[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchReservations: (params?: any) => Promise<void>;
  fetchTodayCheckIns: () => Promise<void>;
  fetchTodayCheckOuts: () => Promise<void>;
  selectReservation: (id: string) => Promise<void>;
  searchReservations: (query: string) => Promise<void>;
  createReservation: (data: Partial<Reservation>) => Promise<void>;
  updateReservation: (id: string, data: Partial<Reservation>) => Promise<void>;
  cancelReservation: (id: string) => Promise<void>;
  getReservationById: (id: string) => Promise<Reservation>;
  clearError: () => void;
}

export const useReservationStore = create<ReservationState>((set, get) => ({
  reservations: [],
  selectedReservation: null,
  todayCheckIns: [],
  todayCheckOuts: [],
  isLoading: false,
  error: null,

  fetchReservations: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await reservationsAPI.getAll(params);
      set({ reservations: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch reservations',
        isLoading: false,
      });
    }
  },

  fetchTodayCheckIns: async () => {
    set({ isLoading: true, error: null });
    try {
      const checkIns = await reservationsAPI.getTodayCheckIns();
      set({ todayCheckIns: checkIns, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch check-ins',
        isLoading: false,
      });
    }
  },

  fetchTodayCheckOuts: async () => {
    set({ isLoading: true, error: null });
    try {
      const checkOuts = await reservationsAPI.getTodayCheckOuts();
      set({ todayCheckOuts: checkOuts, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch check-outs',
        isLoading: false,
      });
    }
  },

  selectReservation: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const reservation = await reservationsAPI.getById(id);
      set({ selectedReservation: reservation, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch reservation',
        isLoading: false,
      });
    }
  },

  searchReservations: async (query: string) => {
    set({ isLoading: true, error: null });
    try {
      const results = await reservationsAPI.search(query);
      set({ reservations: results, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Search failed',
        isLoading: false,
      });
    }
  },

  createReservation: async (data: Partial<Reservation>) => {
    set({ isLoading: true, error: null });
    try {
      const newReservation = await reservationsAPI.create(data);
      set((state) => ({
        reservations: [newReservation, ...state.reservations],
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to create reservation',
        isLoading: false,
      });
      throw error;
    }
  },

  updateReservation: async (id: string, data: Partial<Reservation>) => {
    set({ isLoading: true, error: null });
    try {
      const updatedReservation = await reservationsAPI.update(id, data);
      set((state) => ({
        reservations: state.reservations.map((r) =>
          r.id === id ? updatedReservation : r
        ),
        selectedReservation:
          state.selectedReservation?.id === id
            ? updatedReservation
            : state.selectedReservation,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update reservation',
        isLoading: false,
      });
      throw error;
    }
  },

  cancelReservation: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const cancelledReservation = await reservationsAPI.cancel(id);
      set((state) => ({
        reservations: state.reservations.map((r) =>
          r.id === id ? cancelledReservation : r
        ),
        selectedReservation:
          state.selectedReservation?.id === id
            ? cancelledReservation
            : state.selectedReservation,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to cancel reservation',
        isLoading: false,
      });
      throw error;
    }
  },

  getReservationById: async (id: string): Promise<Reservation> => {
    const reservation = await reservationsAPI.getById(id);
    return reservation;
  },

  clearError: () => set({ error: null }),
}));
