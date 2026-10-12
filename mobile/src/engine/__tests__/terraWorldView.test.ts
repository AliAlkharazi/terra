import { buildTerraWorldViewDTO } from '../terraWorldView';
import type { Allocation, District, MoneyLock, Transaction } from '@/types';

const NOW = Date.parse('2026-09-15T12:00:00.000Z');
const MONTH = '2026-09';

const groceries: District = {
  id: 'groceries',
  label: 'Groceries',
  icon: '🥬',
  monthlyBudget: 300,
};

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
});
