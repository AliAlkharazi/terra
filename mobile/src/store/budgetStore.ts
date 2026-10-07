import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Allocation,
  AllocationState,
  BankState,
  District,
  DistrictId,
  DistrictTarget,
  Transaction,
  ActivityItem,
  PocketId,
  MoneyLock,
  PlacedBuilding,
} from '@/types';
import type { ImportedBankTx } from '@/api/client';
import {
  computeAllocationStateChain,
  cappedAssignAmount,
  computeReadyToAssign,
  emptyAllocationState,
  readyToAssignToBankState,
  shiftMonth,
} from '@/engine/ynabEngine';
import { lockedTotal, unlockAtFromDays } from '@/engine/locks';
import { BUILD_COST_MIN } from '@/engine/buildings';
import { buildSampleHistory } from '@/data/sampleHistory';
import { api } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { rememberSpend } from '@/store/spendMemoryStore';

export interface LastEvent {
  kind: 'spend' | 'income';
  districtId?: DistrictId;
  amount?: number;
  nonce: number;
}

export type PlaceBuildingResult = { ok: true } | { ok: false; error: string };

interface BudgetState {
  districts: District[];
  transactions: Transaction[];
  allocations: Allocation[];
  currentMonth: string;
  lastEvent: LastEvent | null;
  lastBackupAt: string | null;
  activity: ActivityItem[];
  locks: MoneyLock[];
  historySeeded: boolean;
  /** Clash-style: only placed buildings render on the map. */
  placedBuildings: PlacedBuilding[];

  seedHistory: () => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'kind'> & { isCreditCard?: boolean }) => void;
  logIncome: (amount: number, note: string) => void;
  removeTransaction: (id: string) => void;
  updateDistrictBudget: (id: DistrictId, monthlyBudget: number) => void;
  setDistrictTarget: (id: DistrictId, target: DistrictTarget | undefined) => void;
  assignToDistrict: (id: DistrictId, month: string, amount: number) => void;
  addToDistrict: (id: DistrictId, month: string, delta: number) => void;
  moveMoney: (from: PocketId, to: PocketId, amount: number, note?: string) => void;
  coverOverspend: (fromDistrictId: DistrictId, toDistrictId: DistrictId, month: string, amount: number) => void;
  lockMoney: (amount: number, days: number) => void;
  setMonth: (monthISO: string) => void;

  /** Place a category building on the map for BUILD_COST_MIN from the vault. */
  placeBuilding: (districtId: DistrictId) => PlaceBuildingResult;
  isBuildingPlaced: (districtId: DistrictId) => boolean;
  getBuildingFunded: (districtId: DistrictId) => number;
  getUnplacedDistricts: () => District[];

  backupNow: () => Promise<{ success: boolean; error?: string }>;
  restoreFromBackup: () => Promise<{ success: boolean; error?: string }>;

  /** Merge bank sync rows by externalId. Income → vault; spend → uncategorized (or suggested district). */
  mergeImportedBankTxs: (rows: ImportedBankTx[]) => { added: number; skipped: number };
  categorizeImportedTx: (txId: string, districtId: DistrictId) => void;
  getUncategorizedTransactions: () => Transaction[];

  getReadyToAssign: () => number;
  getBankSnapshot: () => BankState;
  getAllocationState: (districtId: DistrictId, month?: string) => AllocationState;
  getAllAllocationStates: (month?: string) => AllocationState[];
}

function bumpBuildingFunded(placed: PlacedBuilding[], districtId: DistrictId, delta: number): PlacedBuilding[] {
  if (delta <= 0) return placed;
  return placed.map((b) =>
    b.districtId === districtId ? { ...b, funded: Math.round((b.funded + delta) * 100) / 100 } : b
  );
}

/** Infer placements from existing allocations (migration / sample history). */
function placementsFromAllocations(allocations: Allocation[]): PlacedBuilding[] {
  const fundedBy = new Map<DistrictId, number>();
  for (const a of allocations) {
    if (a.amount <= 0) continue;
    fundedBy.set(a.districtId, (fundedBy.get(a.districtId) ?? 0) + a.amount);
  }
  const now = new Date().toISOString();
  return [...fundedBy.entries()].map(([districtId, funded]) => ({
    districtId,
    placedAt: now,
    funded: Math.max(BUILD_COST_MIN, funded),
  }));
}

const DEFAULT_DISTRICTS: District[] = [
  { id: 'dining', label: 'Diner', icon: '', monthlyBudget: 250 },
  { id: 'property', label: 'Home', icon: '', monthlyBudget: 200 },
  { id: 'bills', label: 'Bills', icon: '', monthlyBudget: 80 },
  { id: 'transport', label: 'Travel', icon: '', monthlyBudget: 120 },
  { id: 'groceries', label: 'Food', icon: '', monthlyBudget: 350 },
];

function currentMonthISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

let eventCounter = 0;

function earliestKnownMonth(transactions: Transaction[], allocations: Allocation[]): string {
  const dates = [...transactions.map((t) => t.date.slice(0, 7)), ...allocations.map((a) => a.month)];
  if (dates.length === 0) return currentMonthISO();
  return dates.reduce((min, d) => (d < min ? d : min), dates[0]);
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      districts: DEFAULT_DISTRICTS,
      transactions: [],
      allocations: [],
      currentMonth: currentMonthISO(),
      lastEvent: null,
      lastBackupAt: null,
      activity: [],
      locks: [],
      historySeeded: false,
      placedBuildings: [],

      seedHistory: () => {
        const state = get();
        if (state.historySeeded) return;
        const history = buildSampleHistory(state.currentMonth, state.districts);
        const months = new Set(history.allocations.map((a) => a.month));
        if (state.transactions.some((t) => months.has(t.date.slice(0, 7)))) {
          set({ historySeeded: true });
          return;
        }
        const nextAllocations = [...history.allocations, ...state.allocations];
        // Leave a couple of plots empty so “Build” is discoverable in demos.
        const demoHeldBack = new Set<DistrictId>(['transport', 'bills']);
        const inferred = placementsFromAllocations(nextAllocations).filter(
          (b) => !demoHeldBack.has(b.districtId)
        );
        const existingIds = new Set((state.placedBuildings ?? []).map((b) => b.districtId));
        const mergedPlaced = [
          ...(state.placedBuildings ?? []),
          ...inferred.filter((b) => !existingIds.has(b.districtId)),
        ];
        set({
          transactions: [...history.transactions, ...state.transactions],
          allocations: nextAllocations,
          activity: [...(state.activity ?? []), ...history.activity].sort((a, b) => b.date.localeCompare(a.date)),
          historySeeded: true,
          placedBuildings: mergedPlaced,
        });
      },

      addTransaction: (tx) => {
        const isCreditCard = tx.isCreditCard ?? false;
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        set((state) => {
          const newTx: Transaction = {
            ...tx,
            kind: 'spend',
            isCreditCard,
            id,
          };

          let allocations = state.allocations;
          if (isCreditCard) {
            const month = tx.date.slice(0, 7);
            const existing = allocations.find((a) => a.districtId === 'credit_card_payment' && a.month === month);
            allocations = existing
              ? allocations.map((a) => (a === existing ? { ...a, amount: a.amount + tx.amount } : a))
              : [...allocations, { districtId: 'credit_card_payment' as DistrictId, month, amount: tx.amount }];
          }

          return {
            transactions: [...state.transactions, newTx],
            allocations,
            lastEvent: { kind: 'spend', districtId: tx.districtId, amount: tx.amount, nonce: ++eventCounter },
          };
        });
        rememberSpend(tx.districtId, tx.amount, tx.note, tx.date, id);
      },

      logIncome: (amount, note) => {
        const date = new Date().toISOString();
        set((state) => ({
          transactions: [
            ...state.transactions,
            { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, districtId: 'dining', amount, note, date, kind: 'income' },
          ],
          lastEvent: { kind: 'income', amount, nonce: ++eventCounter },
          activity: [
            {
              id: `${Date.now()}-dep`,
              date,
              kind: 'deposit',
              amount,
              toId: 'vault',
              note: note.trim(),
            },
            ...(state.activity ?? []),
          ],
        }));
      },

      removeTransaction: (id) =>
        set((state) => ({ transactions: state.transactions.filter((t) => t.id !== id) })),

      updateDistrictBudget: (id, monthlyBudget) =>
        set((state) => ({
          districts: state.districts.map((d) => (d.id === id ? { ...d, monthlyBudget } : d)),
        })),

      setDistrictTarget: (id, target) =>
        set((state) => ({
          districts: state.districts.map((d) => (d.id === id ? { ...d, target } : d)),
        })),

      assignToDistrict: (id, month, amount) =>
        set((state) => {
          const existing = state.allocations.find((a) => a.districtId === id && a.month === month);
          const current = existing?.amount ?? 0;
          const readyToAssign =
            computeReadyToAssign(state.transactions, state.allocations) - lockedTotal(state.locks);
          const nextAmount = cappedAssignAmount(amount, current, readyToAssign);
          const allocations = existing
            ? state.allocations.map((a) => (a === existing ? { ...a, amount: nextAmount } : a))
            : [...state.allocations, { districtId: id, month, amount: nextAmount }];
          return { allocations };
        }),

      addToDistrict: (id, month, delta) => {
        const { allocations, assignToDistrict } = get();
        const current = allocations.find((a) => a.districtId === id && a.month === month)?.amount ?? 0;
        assignToDistrict(id, month, current + delta);
      },

      moveMoney: (from, to, amount, note = '') => {
        if (from === to || amount <= 0) return;
        const { currentMonth, addToDistrict } = get();
        if (from === 'vault' && to !== 'vault') addToDistrict(to, currentMonth, amount);
        else if (to === 'vault' && from !== 'vault') addToDistrict(from, currentMonth, -amount);
        else if (from !== 'vault' && to !== 'vault') {
          addToDistrict(from, currentMonth, -amount);
          addToDistrict(to, currentMonth, amount);
        }
        set((state) => {
          let placedBuildings = state.placedBuildings ?? [];
          if (from === 'vault' && to !== 'vault') {
            placedBuildings = bumpBuildingFunded(placedBuildings, to, amount);
          } else if (from !== 'vault' && to !== 'vault') {
            placedBuildings = bumpBuildingFunded(placedBuildings, to, amount);
          }
          return {
            placedBuildings,
            activity: [
              {
                id: `${Date.now()}-mv`,
                date: new Date().toISOString(),
                kind: 'move',
                amount,
                fromId: from,
                toId: to,
                note: note.trim(),
              },
              ...(state.activity ?? []),
            ],
          };
        });
      },

      placeBuilding: (districtId) => {
        const state = get();
        const district = state.districts.find((d) => d.id === districtId && !d.isCreditCard);
        if (!district) return { ok: false, error: 'Unknown category.' };
        if ((state.placedBuildings ?? []).some((b) => b.districtId === districtId)) {
          return { ok: false, error: 'Already built.' };
        }
        const vault = state.getReadyToAssign();
        if (vault + 0.001 < BUILD_COST_MIN) {
          return { ok: false, error: `Need at least €${BUILD_COST_MIN} in the vault.` };
        }
        state.moveMoney('vault', districtId, BUILD_COST_MIN, `Build ${district.label}`);
        set((s) => {
          if ((s.placedBuildings ?? []).some((b) => b.districtId === districtId)) return s;
          return {
            placedBuildings: [
              ...(s.placedBuildings ?? []),
              {
                districtId,
                placedAt: new Date().toISOString(),
                funded: BUILD_COST_MIN,
              },
            ],
          };
        });
        return { ok: true };
      },

      isBuildingPlaced: (districtId) =>
        (get().placedBuildings ?? []).some((b) => b.districtId === districtId),

      getBuildingFunded: (districtId) =>
        (get().placedBuildings ?? []).find((b) => b.districtId === districtId)?.funded ?? 0,

      getUnplacedDistricts: () => {
        const placed = new Set((get().placedBuildings ?? []).map((b) => b.districtId));
        return get().districts.filter((d) => !d.isCreditCard && !placed.has(d.id));
      },

      coverOverspend: (fromDistrictId, toDistrictId, month, amount) => {
        const { districts, allocations, transactions } = get();
        const fromDistrict = districts.find((d) => d.id === fromDistrictId);
        if (!fromDistrict) return;

        const earliest = shiftMonth(earliestKnownMonth(transactions, allocations), -1);
        const fromState = computeAllocationStateChain(fromDistrict, allocations, transactions, month, earliest);
        const cappedAmount = Math.max(0, Math.min(amount, fromState.available));
        if (cappedAmount <= 0) return;

        set((state) => {
          const bump = (id: DistrictId, delta: number) => {
            const existing = state.allocations.find((a) => a.districtId === id && a.month === month);
            if (existing) {
              return state.allocations.map((a) => (a === existing ? { ...a, amount: a.amount + delta } : a));
            }
            return [...state.allocations, { districtId: id, month, amount: delta }];
          };
          const afterFrom = bump(fromDistrictId, -cappedAmount);
          const existingTo = afterFrom.find((a) => a.districtId === toDistrictId && a.month === month);
          const allocations = existingTo
            ? afterFrom.map((a) => (a === existingTo ? { ...a, amount: a.amount + cappedAmount } : a))
            : [...afterFrom, { districtId: toDistrictId, month, amount: cappedAmount }];
          return { allocations };
        });
      },

      setMonth: (monthISO) => set({ currentMonth: monthISO }),

      lockMoney: (amount, days) => {
        const vault = get().getReadyToAssign();
        const capped = Math.round(Math.min(Math.max(0, amount), vault) * 100) / 100;
        if (capped <= 0 || days < 1) return;
        const createdAt = new Date().toISOString();
        const lock: MoneyLock = {
          id: `${Date.now()}-lock`,
          amount: capped,
          days: Math.round(days),
          createdAt,
          unlockAt: unlockAtFromDays(days),
        };
        set((state) => ({ locks: [lock, ...(state.locks ?? [])] }));
      },

      backupNow: async () => {
        const auth = useAuthStore.getState();
        if (auth.mode !== 'synced' || !auth.token) {
          return { success: false, error: 'Log in to back up your data.' };
        }
        try {
          const { districts, transactions, allocations, currentMonth, locks } = get();
          await api.putBackup(auth.token, { districts, transactions, allocations, currentMonth, locks });
          set({ lastBackupAt: new Date().toISOString() });
          return { success: true };
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : 'Backup failed.' };
        }
      },

      restoreFromBackup: async () => {
        const auth = useAuthStore.getState();
        if (auth.mode !== 'synced' || !auth.token) {
          return { success: false, error: 'Log in to restore your data.' };
        }
        try {
          const result = await api.getBackup(auth.token);
          const data = result.data as {
            districts?: District[];
            transactions?: Transaction[];
            allocations?: Allocation[];
            currentMonth?: string;
            locks?: MoneyLock[];
          };
          set({
            districts: data.districts ?? DEFAULT_DISTRICTS,
            transactions: data.transactions ?? [],
            allocations: data.allocations ?? [],
            currentMonth: data.currentMonth ?? currentMonthISO(),
            locks: data.locks ?? [],
            lastBackupAt: result.updatedAt,
          });
          return { success: true };
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : 'No backup found.' };
        }
      },

      mergeImportedBankTxs: (rows) => {
        const existing = new Set(
          get()
            .transactions.filter((t) => t.externalId)
            .map((t) => t.externalId as string)
        );
        let added = 0;
        let skipped = 0;
        const toAdd: Transaction[] = [];
        const activityAdds: ActivityItem[] = [];

        for (const row of rows) {
          if (existing.has(row.externalId)) {
            skipped += 1;
            continue;
          }
          existing.add(row.externalId);
          const date = `${row.bookingDate}T12:00:00.000Z`;
          if (row.kind === 'income') {
            toAdd.push({
              id: `bank-${row.externalId}`,
              districtId: 'dining',
              amount: row.amount,
              note: row.remittance || 'Bank income',
              date,
              kind: 'income',
              externalId: row.externalId,
              importSource: 'sparkasse',
            });
            activityAdds.push({
              id: `bank-dep-${row.externalId}`,
              date,
              kind: 'deposit',
              amount: row.amount,
              toId: 'vault',
              note: row.remittance || 'Sparkasse',
            });
          } else {
            const suggested = row.suggestedDistrictId as DistrictId | null;
            const known = suggested && DEFAULT_DISTRICTS.some((d) => d.id === suggested);
            toAdd.push({
              id: `bank-${row.externalId}`,
              districtId: (known ? suggested : 'dining') as DistrictId,
              amount: row.amount,
              note: row.remittance || 'Bank spend',
              date,
              kind: 'spend',
              externalId: row.externalId,
              importSource: 'sparkasse',
              uncategorized: !known,
            });
          }
          added += 1;
        }

        if (toAdd.length) {
          set((state) => ({
            transactions: [...state.transactions, ...toAdd],
            activity: [...activityAdds, ...(state.activity ?? [])].sort((a, b) =>
              b.date.localeCompare(a.date)
            ),
          }));
        }
        return { added, skipped };
      },

      categorizeImportedTx: (txId, districtId) => {
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === txId ? { ...t, districtId, uncategorized: false } : t
          ),
        }));
      },

      getUncategorizedTransactions: () =>
        get()
          .transactions.filter((t) => t.uncategorized && t.kind === 'spend')
          .sort((a, b) => b.date.localeCompare(a.date)),

      getReadyToAssign: () => {
        const { transactions, allocations, locks } = get();
        return computeReadyToAssign(transactions, allocations) - lockedTotal(locks);
      },

      getBankSnapshot: () => {
        return readyToAssignToBankState(get().getReadyToAssign());
      },

      getAllocationState: (districtId, month) => {
        const { districts, allocations, transactions, currentMonth } = get();
        const targetMonth = month ?? currentMonth;
        const district = districts.find((d) => d.id === districtId);
        if (!district) return emptyAllocationState(districtId);
        const earliest = shiftMonth(earliestKnownMonth(transactions, allocations), -1);
        return computeAllocationStateChain(district, allocations, transactions, targetMonth, earliest);
      },

      getAllAllocationStates: (month) => {
        const { districts, allocations, transactions, currentMonth } = get();
        const targetMonth = month ?? currentMonth;
        const earliest = shiftMonth(earliestKnownMonth(transactions, allocations), -1);
        return districts
          .filter((d) => !d.isCreditCard)
          .map((d) => computeAllocationStateChain(d, allocations, transactions, targetMonth, earliest));
      },
    }),
    {
      name: 'terra-budget-storage-v6',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        districts: state.districts,
        transactions: state.transactions,
        allocations: state.allocations,
        currentMonth: state.currentMonth,
        lastBackupAt: state.lastBackupAt,
        activity: state.activity,
        locks: state.locks,
        historySeeded: state.historySeeded,
        placedBuildings: state.placedBuildings,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<BudgetState>;
        const placed =
          p.placedBuildings ??
          (p.allocations?.length ? placementsFromAllocations(p.allocations) : current.placedBuildings);
        return {
          ...current,
          ...p,
          placedBuildings: placed ?? [],
          locks: p.locks ?? [],
          activity: p.activity ?? [],
        };
      },
    }
  )
);
