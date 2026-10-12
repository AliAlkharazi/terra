import fs from 'fs';
import path from 'path';
import { buildTerraWorldViewDTO } from '../terraWorldView';
import { useAuthStore } from '@/store/authStore';
import { useBudgetStore } from '@/store/budgetStore';
import { useGoalsStore } from '@/store/goalsStore';
import type { Allocation, District, MoneyLock, Transaction } from '@/types';

const NOW = Date.parse('2026-09-15T12:00:00.000Z');
const MONTH = '2026-09';

const groceries: District = {
  id: 'groceries',
  label: 'Groceries',
  icon: '🥬',
  monthlyBudget: 300,
};

const budgetInitial = useBudgetStore.getState();
const goalsInitial = useGoalsStore.getState();
const authInitial = useAuthStore.getState();

describe('buildTerraWorldViewDTO', () => {
  it('empty budget → zero vault/ready/locked and empty or zeroed districts', () => {
    const dto = buildTerraWorldViewDTO({
      districts: [],
      transactions: [],
      allocations: [],
      currentMonth: MONTH,
      locks: [],
      goals: [],
      now: NOW,
      asOf: '2026-09-15T12:00:00.000Z',
    });

    expect(dto.monthKey).toBe(MONTH);
    expect(dto.asOf).toBe('2026-09-15T12:00:00.000Z');
    expect(dto.vaultCents).toBe(0);
    expect(dto.readyToAssignCents).toBe(0);
    expect(dto.lockedTotalCents).toBe(0);
    expect(dto.districts).toEqual([]);
    expect(dto.goals).toEqual([]);
    expect(dto.locks).toEqual([]);
    expect(dto.meta?.onTrackDistrictCount).toBe(0);
  });

  it('one district with spend maps allocated/spent/available to cents and health/stage', () => {
    const transactions: Transaction[] = [
      {
        id: 'inc',
        districtId: 'dining',
        amount: 500,
        note: 'pay',
        date: '2026-09-01T00:00:00.000Z',
        kind: 'income',
      },
      {
        id: 'sp',
        districtId: 'groceries',
        amount: 40,
        note: 'milk',
        date: '2026-09-05T00:00:00.000Z',
        kind: 'spend',
      },
    ];
    const allocations: Allocation[] = [{ districtId: 'groceries', month: MONTH, amount: 200 }];

    const dto = buildTerraWorldViewDTO({
      districts: [groceries],
      transactions,
      allocations,
      currentMonth: MONTH,
      now: NOW,
    });

    expect(dto.vaultCents).toBe(30000); // 500 − 200
    expect(dto.readyToAssignCents).toBe(30000);
    expect(dto.districts).toHaveLength(1);
    const d = dto.districts[0];
    expect(d.id).toBe('groceries');
    expect(d.assignedCents).toBe(20000);
    expect(d.spentCents).toBe(4000);
    expect(d.availableCents).toBe(16000); // 200 − 40
    expect(d.lockedCents).toBe(0);
    expect(d.healthPct).toBe(80); // 160/200
    expect(d.stage).toBe('thriving');
  });

  it('one active lock reduces ready-to-assign and appears in locks summary', () => {
    const transactions: Transaction[] = [
      {
        id: 'inc',
        districtId: 'dining',
        amount: 100,
        note: '',
        date: '2026-09-01T00:00:00.000Z',
        kind: 'income',
      },
    ];
    const lock: MoneyLock = {
      id: 'lock-1',
      amount: 25,
      days: 7,
      createdAt: '2026-09-10T00:00:00.000Z',
      unlockAt: '2026-09-22T00:00:00.000Z',
    };

    const dto = buildTerraWorldViewDTO({
      districts: [],
      transactions,
      allocations: [],
      currentMonth: MONTH,
      locks: [lock],
      now: NOW,
    });

    expect(dto.vaultCents).toBe(10000);
    expect(dto.lockedTotalCents).toBe(2500);
    expect(dto.readyToAssignCents).toBe(7500);
    expect(dto.locks).toEqual([
      {
        id: 'lock-1',
        amountCents: 2500,
        unlockAt: '2026-09-22T00:00:00.000Z',
        pocketId: 'vault',
      },
    ]);
  });

  it('one goal maps target/progress to cents', () => {
    const dto = buildTerraWorldViewDTO({
      districts: [],
      transactions: [],
      allocations: [],
      currentMonth: MONTH,
      goals: [{ id: 'g1', name: 'Vacation', target: 1200, progress: 300 }],
      now: NOW,
    });

    expect(dto.goals).toEqual([
      { id: 'g1', name: 'Vacation', targetCents: 120000, progressCents: 30000 },
    ]);
  });

  it('offline auth + local zustand slices still yield a complete DTO (no token / no API)', () => {
    useAuthStore.setState({ ...authInitial, token: null, mode: 'offline', hasOnboarded: true }, true);
    useBudgetStore.setState(budgetInitial, true);
    useGoalsStore.setState(goalsInitial, true);

    expect(useAuthStore.getState().mode).toBe('offline');
    expect(useAuthStore.getState().token).toBeNull();

    const budget = useBudgetStore.getState();
    budget.logIncome(400, 'offline pay');
    const month = useBudgetStore.getState().currentMonth;
    budget.addToDistrict('groceries', month, 120);
    budget.lockMoney(40, 7);
    useGoalsStore.getState().addGoal('Bike', 800);

    const offlineState = useBudgetStore.getState();
    const goals = useGoalsStore.getState().goals;
    // Use "now" at/after lock creation so the freeze is active (lockMoney uses Date.now()).
    const offlineNow = Date.now();

    const dto = buildTerraWorldViewDTO({
      districts: offlineState.districts,
      transactions: offlineState.transactions,
      allocations: offlineState.allocations,
      currentMonth: offlineState.currentMonth,
      locks: offlineState.locks ?? [],
      goals: goals.map((g) => ({ id: g.id, name: g.name, target: g.target })),
      now: offlineNow,
    });

    expect(dto.monthKey).toBe(offlineState.currentMonth);
    expect(dto.asOf).toBeTruthy();
    expect(dto.vaultCents).toBe(28000); // 400 income − 120 assigned
    expect(dto.lockedTotalCents).toBe(4000);
    expect(dto.readyToAssignCents).toBe(24000); // vault − locked
    expect(dto.districts.length).toBeGreaterThan(0);
    expect(dto.districts.every((d) => typeof d.healthPct === 'number' && d.stage)).toBe(true);
    expect(dto.goals).toHaveLength(1);
    expect(dto.goals[0].name).toBe('Bike');
    expect(dto.goals[0].targetCents).toBe(80000);
    expect(dto.locks).toHaveLength(1);
    expect(dto.meta?.onTrackDistrictCount).toBeGreaterThanOrEqual(0);

    // Builder must not depend on auth — still complete with offline store shape.
    expect(useAuthStore.getState().token).toBeNull();
  });
});

describe('world view offline path (source guard)', () => {
  it('DTO builder and WorldScreen world-loop modules do not import the API client', () => {
    const roots = [
      path.join(__dirname, '../terraWorldView.ts'),
      path.join(__dirname, '../../screens/WorldScreen.tsx'),
      path.join(__dirname, '../../components/WorldWebView.tsx'),
      path.join(__dirname, '../../components/WorldStatusStrip.tsx'),
      path.join(__dirname, '../../components/DistrictQuickSheet.tsx'),
      path.join(__dirname, '../../components/PreviewTimelineChip.tsx'),
    ];
    for (const file of roots) {
      const src = fs.readFileSync(file, 'utf8');
      expect(src).not.toMatch(/from ['"]@\/api(\/|['"])/);
      expect(src).not.toMatch(/from ['"]\.\.\/api(\/|['"])/);
    }
  });
});
