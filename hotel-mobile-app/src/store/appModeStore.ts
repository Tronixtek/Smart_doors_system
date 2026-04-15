import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type AppMode = 'hotel' | 'office';

interface AppModeState {
  mode: AppMode;
  isReady: boolean;
  loadMode: () => Promise<void>;
  setMode: (mode: AppMode) => Promise<void>;
}

const APP_MODE_STORAGE_KEY = 'appMode';

export const useAppModeStore = create<AppModeState>((set) => ({
  mode: 'hotel',
  isReady: false,

  loadMode: async () => {
    try {
      const storedMode = await AsyncStorage.getItem(APP_MODE_STORAGE_KEY);
      const nextMode = storedMode === 'office' ? 'office' : 'hotel';
      set({ mode: nextMode, isReady: true });
    } catch (error) {
      console.error('Error loading app mode:', error);
      set({ mode: 'hotel', isReady: true });
    }
  },

  setMode: async (mode) => {
    await AsyncStorage.setItem(APP_MODE_STORAGE_KEY, mode);
    set({ mode });
  },
}));
