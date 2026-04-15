import { create } from 'zustand';
import { Room } from '../types/api';
import roomsAPI from '../api/rooms';

interface RoomState {
  rooms: Room[];
  availableRooms: Room[];
  dirtyRooms: Room[];
  selectedRoom: Room | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchRooms: (params?: any) => Promise<void>;
  fetchAvailableRooms: (checkIn: string, checkOut: string, roomType?: string) => Promise<void>;
  fetchDirtyRooms: () => Promise<void>;
  selectRoom: (id: string) => Promise<void>;
  updateRoomStatus: (id: string, status: Room['status']) => Promise<void>;
  clearError: () => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  rooms: [],
  availableRooms: [],
  dirtyRooms: [],
  selectedRoom: null,
  isLoading: false,
  error: null,

  fetchRooms: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const rooms = await roomsAPI.getAll(params);
      set({ rooms, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch rooms',
        isLoading: false,
      });
    }
  },

  fetchAvailableRooms: async (checkIn, checkOut, roomType) => {
    set({ isLoading: true, error: null });
    try {
      const rooms = await roomsAPI.getAvailable(checkIn, checkOut, roomType);
      set({ availableRooms: rooms, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch available rooms',
        isLoading: false,
      });
    }
  },

  fetchDirtyRooms: async () => {
    set({ isLoading: true, error: null });
    try {
      const rooms = await roomsAPI.getDirtyRooms();
      set({ dirtyRooms: rooms, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch dirty rooms',
        isLoading: false,
      });
    }
  },

  selectRoom: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const room = await roomsAPI.getById(id);
      set({ selectedRoom: room, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch room',
        isLoading: false,
      });
    }
  },

  updateRoomStatus: async (id: string, status: Room['status']) => {
    set({ isLoading: true, error: null });
    try {
      const updatedRoom = await roomsAPI.updateStatus(id, status);
      set((state) => ({
        rooms: state.rooms.map((r) => (r.id === id ? updatedRoom : r)),
        selectedRoom: state.selectedRoom?.id === id ? updatedRoom : state.selectedRoom,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update room status',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
