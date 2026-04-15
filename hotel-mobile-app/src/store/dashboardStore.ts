import { create } from 'zustand';
import statsAPI, { DashboardStats } from '../api/stats';

interface DashboardState {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  
  // Actions
  fetchDashboard: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  clearError: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  stats: null,
  isLoading: false,
  error: null,
  lastUpdated: null,

  fetchDashboard: async () => {
    // Don't fetch if already loading
    if (get().isLoading) return;

    set({ isLoading: true, error: null });
    try {
      const stats = await statsAPI.getDashboard();
      set({ 
        stats, 
        isLoading: false,
        lastUpdated: new Date(),
        error: null
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to fetch dashboard statistics',
        isLoading: false,
      });
      console.error('Dashboard fetch error:', error);
    }
  },

  refreshDashboard: async () => {
    set({ isLoading: true, error: null });
    try {
      const stats = await statsAPI.getDashboard();
      set({ 
        stats, 
        isLoading: false,
        lastUpdated: new Date(),
        error: null
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to refresh dashboard',
        isLoading: false,
      });
      console.error('Dashboard refresh error:', error);
    }
  },

  clearError: () => set({ error: null }),
}));
