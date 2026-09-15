import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, ApiError } from '@/api/client';
import { useBudgetStore } from '@/store/budgetStore';
import { DistrictId } from '@/types';

export type AuthMode = 'offline' | 'synced';

interface AuthState {
  token: string | null;
  userId: string | null;
  email: string | null;
  mode: AuthMode;
  hasOnboarded: boolean; // false only before the user's very first choice (login/register/continue offline)
  remoteDistrictIds: Partial<Record<DistrictId, string>>;
  status: 'idle' | 'loading' | 'error';
  error: string | null;

  register: (email: string, password: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  continueOffline: () => void;
  clearError: () => void;
}

async function syncDistrictsFromBackend(token: string) {
  try {
    const remoteDistricts = await api.getDistricts(token);
    const idMap: Partial<Record<DistrictId, string>> = {};
    for (const rd of remoteDistricts) {
      idMap[rd.key as DistrictId] = rd.id;
      // Backend is the source of truth for budgets once synced.
      useBudgetStore.getState().updateDistrictBudget(rd.key as DistrictId, rd.monthlyBudget);
    }
    return idMap;
  } catch {
    // Sync is best-effort — if it fails, the app keeps working fully offline.
    return {};
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      userId: null,
      email: null,
      mode: 'offline',
      hasOnboarded: false,
      remoteDistrictIds: {},
      status: 'idle',
      error: null,

      register: async (email, password) => {
        set({ status: 'loading', error: null });
        try {
          const { token, userId } = await api.register(email, password);
          const remoteDistrictIds = await syncDistrictsFromBackend(token);
          set({ token, userId, email, mode: 'synced', hasOnboarded: true, remoteDistrictIds, status: 'idle' });
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
          const remoteDistrictIds = await syncDistrictsFromBackend(token);
          set({ token, userId, email, mode: 'synced', hasOnboarded: true, remoteDistrictIds, status: 'idle' });
          return true;
        } catch (e) {
          const message = e instanceof ApiError ? e.message : 'Could not reach the server.';
          set({ status: 'error', error: message });
          return false;
        }
      },

      logout: () => set({ token: null, userId: null, email: null, mode: 'offline', remoteDistrictIds: {} }),

      continueOffline: () => set({ mode: 'offline', hasOnboarded: true }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'terra-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
