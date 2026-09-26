import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DistrictId } from '@/types';
import { SEED_PURCHASES, type MemoryPurchase } from '@/data/seedPurchases';

interface SpendMemoryState {
  purchases: MemoryPurchase[];
  seeded: boolean;
  seedIfNeeded: () => void;
  remember: (entry: Omit<MemoryPurchase, 'id' | 'source'> & { id?: string }) => void;
}

export const useSpendMemoryStore = create<SpendMemoryState>()(
  persist(
    (set, get) => ({
      purchases: [],
      seeded: false,

      seedIfNeeded: () => {
        if (get().seeded) return;
        set({ purchases: SEED_PURCHASES, seeded: true });
      },

      remember: (entry) => {
        const row: MemoryPurchase = {
          id: entry.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          date: entry.date,
          item: entry.item,
          amount: entry.amount,
          districtId: entry.districtId,
          source: 'live',
        };
        set((state) => ({ purchases: [row, ...state.purchases] }));
      },
    }),
    {
      name: 'terra-spend-memory-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export function rememberSpend(districtId: DistrictId, amount: number, note: string, date: string, id?: string) {
  const item = note.trim() || districtId;
  useSpendMemoryStore.getState().remember({ id, districtId, amount, item, date });
}
