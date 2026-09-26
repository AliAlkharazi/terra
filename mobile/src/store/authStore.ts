import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, ApiDistrict, ApiError } from '@/api/client';
import { useBudgetStore } from '@/store/budgetStore';
import { DistrictForecast, DistrictId } from '@/types';

export type AuthMode = 'offline' | 'synced';

interface AuthState {
  token: string | null;
  userId: string | null;
  email: string | null;
  mode: AuthMode;
  hasOnboarded: boolean; // false only before the user's very first choice (login/register/continue offline)
  remoteDistrictIds: Partial<Record<DistrictId, string>>;
  /** Last `GET /districts` forecast per local key. Null means N = 0. */
  forecasts: Partial<Record<DistrictId, DistrictForecast | null>>;
  status: 'idle' | 'loading' | 'error';
  error: string | null;

  register: (email: string, password: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  continueOffline: () => void;
  clearError: () => void;
  /** Reload estimates from the district list. Does not call the per-district route. */
  refreshForecasts: () => Promise<void>;
}

function forecastsFromDistricts(
  remoteDistricts: ApiDistrict[]
): Partial<Record<DistrictId, DistrictForecast | null>> {
  const forecasts: Partial<Record<DistrictId, DistrictForecast | null>> = {};
  for (const rd of remoteDistricts) {
    forecasts[rd.key as DistrictId] = rd.forecast ?? null;
  }
  return forecasts;
}

async function syncDistrictsFromBackend(token: string): Promise<{
  remoteDistrictIds: Partial<Record<DistrictId, string>>;
  forecasts: Partial<Record<DistrictId, DistrictForecast | null>>;
}> {
  try {
    const remoteDistricts = await api.getDistricts(token);
    const idMap: Partial<Record<DistrictId, string>> = {};
    for (const rd of remoteDistricts) {
      idMap[rd.key as DistrictId] = rd.id;
      // Backend is the source of truth for budgets once synced.
      useBudgetStore.getState().updateDistrictBudget(rd.key as DistrictId, rd.monthlyBudget);
    }
    return { remoteDistrictIds: idMap, forecasts: forecastsFromDistricts(remoteDistricts) };
  } catch {
    // Sync is best-effort — if it fails, the app keeps working fully offline.
    return { remoteDistrictIds: {}, forecasts: {} };
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
      forecasts: {},
      status: 'idle',
      error: null,

      register: async (email, password) => {
        set({ status: 'loading', error: null });
        try {
          const { token, userId } = await api.register(email, password);
          const { remoteDistrictIds, forecasts } = await syncDistrictsFromBackend(token);
          set({ token, userId, email, mode: 'synced', hasOnboarded: true, remoteDistrictIds, forecasts, status: 'idle' });
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
          const { remoteDistrictIds, forecasts } = await syncDistrictsFromBackend(token);
          set({ token, userId, email, mode: 'synced', hasOnboarded: true, remoteDistrictIds, forecasts, status: 'idle' });
          return true;
        } catch (e) {
          const message = e instanceof ApiError ? e.message : 'Could not reach the server.';
          set({ status: 'error', error: message });
          return false;
        }
      },

      logout: () =>
        set({ token: null, userId: null, email: null, mode: 'offline', remoteDistrictIds: {}, forecasts: {} }),

      continueOffline: () => set({ mode: 'offline', hasOnboarded: true, forecasts: {} }),

      clearError: () => set({ error: null }),

      refreshForecasts: async () => {
        const { token, mode } = get();
        if (mode !== 'synced' || !token) return;
        try {
          const remoteDistricts = await api.getDistricts(token);
          const current = get();
          // Ignore a response that lands after logout or a token change.
          if (current.mode !== 'synced' || current.token !== token) return;
          set({ forecasts: forecastsFromDistricts(remoteDistricts) });
        } catch {
          // Keep the last list payload so a blip does not flash the estimate away.
        }
      },
    }),
    {
      name: 'terra-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
