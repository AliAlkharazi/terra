import { lockedTotal, unlockAtFromDays } from '../locks';
import { computeMonthPreview } from '../preview';
import type { AllocationState, District, MoneyLock } from '@/types';

describe('lockedTotal', () => {
  it('counts only locks that have not yet opened', () => {
    const locks: MoneyLock[] = [
      { id: 'a', amount: 40, days: 7, createdAt: '2026-09-01T00:00:00.000Z', unlockAt: '2026-09-24T00:00:00.000Z' },
      { id: 'b', amount: 10, days: 1, createdAt: '2026-09-01T00:00:00.000Z', unlockAt: '2026-09-02T00:00:00.000Z' },
    ];
    expect(lockedTotal(locks, Date.parse('2026-09-23T12:00:00.000Z'))).toBe(40);
  });
});

describe('unlockAtFromDays', () => {
  it('is at least one day ahead', () => {
    const start = Date.parse('2026-09-23T00:00:00.000Z');
    expect(unlockAtFromDays(7, start)).toBe(new Date(start + 7 * 86400000).toISOString());
  });
});

describe('computeMonthPreview', () => {
  const districts: District[] = [
    { id: 'bills', label: 'Bills', icon: '', monthlyBudget: 80 },
    { id: 'groceries', label: 'Food', icon: '', monthlyBudget: 350 },
  ];
  const states: AllocationState[] = [
    {
      districtId: 'bills',
      allocated: 80,
      rolloverFromPrevious: 0,
      spent: 20,
      available: 60,
      isOverspent: false,
      targetProgressPct: null,
      requiredMonthlyFunding: null,
    },
    {
      districtId: 'groceries',
      allocated: 350,
      rolloverFromPrevious: 0,
      spent: 100,
      available: 250,
      isOverspent: false,
      targetProgressPct: null,
      requiredMonthlyFunding: null,
    },
  ];

  it('shows a lock opening next month and adds it back to the end balance', () => {
    const now = Date.parse('2026-09-23T12:00:00.000Z');
    const lock: MoneyLock = {
      id: 'l1',
      amount: 50,
      days: 14,
      createdAt: '2026-09-23T12:00:00.000Z',
      unlockAt: '2026-10-07T12:00:00.000Z',
    };
    const without = computeMonthPreview({ districts, states, locks: [], transactions: [], vault: 40, month: '2026-09', now });
    const withLock = computeMonthPreview({ districts, states, locks: [lock], transactions: [], vault: 40, month: '2026-09', now });

    expect(withLock.payments.some((p) => p.kind === 'unlock' && p.amount === 50)).toBe(true);
    expect(withLock.endNext - without.endNext).toBe(50);
    expect(withLock.rollovers.find((r) => r.districtId === 'groceries')?.amount).toBe(250);
  });
});
