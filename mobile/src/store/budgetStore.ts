import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BankState, District, DistrictId, Transaction, WorldSnapshot } from '@/types';
import { buildBankState, buildWorldSnapshot } from '@/engine/worldEngine';
import { api } from '@/api/client';
import { useAuthStore } from '@/store/authStore';

export interface LastEvent {
  kind: 'spend' | 'save';
  districtId?: DistrictId;
  nonce: number;
}

interface BudgetState {
  districts: District[];
  transactions: Transaction[];
  currentMonth: string;
  lastEvent: LastEvent | null;

  addTransaction: (tx: Omit<Transaction, 'id' | 'kind'>) => void;
  logSaving: (amount: number, note: string) => void;
  removeTransaction: (id: string) => void;
  updateDistrictBudget: (id: DistrictId, monthlyBudget: number) => void;
  setMonth: (monthISO: string) => void;
  getSnapshot: () => WorldSnapshot;
  getBankSnapshot: () => BankState;
}

const DEFAULT_DISTRICTS: District[] = [
  { id: 'dining', label: 'Dining', icon: '🍜', monthlyBudget: 250 },
  { id: 'groceries', label: 'Groceries', icon: '🥬', monthlyBudget: 350 },
  { id: 'transport', label: 'Transport', icon: '🚇', monthlyBudget: 120 },
  { id: 'entertainment', label: 'Entertainment', icon: '🎭', monthlyBudget: 100 },
  { id: 'shopping', label: 'Shopping', icon: '🛍️', monthlyBudget: 150 },
  { id: 'subscriptions', label: 'Subscriptions', icon: '📡', monthlyBudget: 60 },
  { id: 'other', label: 'Other', icon: '🌾', monthlyBudget: 100 },
];

function currentMonthISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

let eventCounter = 0;

/** Best-effort push to the backend. Never blocks or throws into the UI —
 *  the app is local-first, so a failed sync just means "stays local". */
function syncTransactionToBackend(districtId: DistrictId, amount: number, note: string, date: string) {
  const auth = useAuthStore.getState();
  if (auth.mode !== 'synced' || !auth.token) return;
  const remoteId = auth.remoteDistrictIds[districtId];
  if (!remoteId) return;

  api.createTransaction(auth.token, { districtId: remoteId, amount, note, date }).catch(() => {
    // silent — local state is already updated, this is just best-effort sync
  });
}

function syncBudgetToBackend(districtId: DistrictId, monthlyBudget: number) {
  const auth = useAuthStore.getState();
  if (auth.mode !== 'synced' || !auth.token) return;
  const remoteId = auth.remoteDistrictIds[districtId];
  if (!remoteId) return;

  api.updateDistrictBudget(auth.token, remoteId, monthlyBudget).catch(() => {});
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      districts: DEFAULT_DISTRICTS,
      transactions: [],
      currentMonth: currentMonthISO(),
      lastEvent: null,

      addTransaction: (tx) => {
        set((state) => ({
          transactions: [
            ...state.transactions,
            {
              ...tx,
              kind: 'spend',
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            },
          ],
          lastEvent: { kind: 'spend', districtId: tx.districtId, nonce: ++eventCounter },
        }));
        syncTransactionToBackend(tx.districtId, tx.amount, tx.note, tx.date);
      },

      logSaving: (amount, note) => {
        const date = new Date().toISOString();
        set((state) => ({
          transactions: [
            ...state.transactions,
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              districtId: 'other',
              amount,
              note,
              date,
              kind: 'save',
            },
          ],
          lastEvent: { kind: 'save', nonce: ++eventCounter },
        }));
        syncTransactionToBackend('other', amount, note, date);
      },

      removeTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),

      updateDistrictBudget: (id, monthlyBudget) => {
        set((state) => ({
          districts: state.districts.map((d) => (d.id === id ? { ...d, monthlyBudget } : d)),
        }));
        syncBudgetToBackend(id, monthlyBudget);
      },

      setMonth: (monthISO) => set({ currentMonth: monthISO }),

      getSnapshot: () => {
        const { districts, transactions, currentMonth } = get();
        return buildWorldSnapshot(districts, transactions, currentMonth);
      },

      getBankSnapshot: () => {
        const { transactions, currentMonth } = get();
        return buildBankState(transactions, currentMonth);
      },
    }),
    {
      name: 'terra-budget-storage-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
