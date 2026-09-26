import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, ApiError } from '@/api/client';

export type AuthMode = 'offline' | 'synced';

interface AuthState {
  token: string | null;
  userId: string | null;
  email: string | null;
  mode: AuthMode;
  hasOnboarded: boolean;
  status: 'idle' | 'loading' | 'error';
  error: string | null;

  register: (email: string, password: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  continueOffline: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      userId: null,
      email: null,
      mode: 'offline',
      hasOnboarded: false,
      status: 'idle',
      error: null,

      register: async (email, password) => {
        set({ status: 'loading', error: null });
        try {
          const { token, userId } = await api.register(email, password);
          set({ token, userId, email, mode: 'synced', hasOnboarded: true, status: 'idle' });
          return true;
        } catch (e) {
          const message = e instanceof ApiError ? e.message : 'Could not reach the server.';
          set({ status: 'error', error: message });
          return false;
        }
      },

      login: async (email, password) => {
        set({ status: 'loading', error: null });
        try {
          const { token, userId } = await api.login(email, password);
          set({ token, userId, email, mode: 'synced', hasOnboarded: true, status: 'idle' });
          return true;
        } catch (e) {
          const message = e instanceof ApiError ? e.message : 'Could not reach the server.';
          set({ status: 'error', error: message });
          return false;
        }
      },

      logout: () => set({ token: null, userId: null, email: null, mode: 'offline' }),

      continueOffline: () => set({ mode: 'offline', hasOnboarded: true }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'terra-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
