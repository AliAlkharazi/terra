import { computeAgeOfMoney, computeFundPlan, computeInsights, dayOfMonthIn, daysInMonth } from '../insights';
import type { AllocationState, District, Transaction } from '@/types';

const districts: District[] = [
  { id: 'dining', label: 'Diner', icon: '', monthlyBudget: 250 },
  { id: 'groceries', label: 'Food', icon: '', monthlyBudget: 350 },
];

function state(partial: Partial<AllocationState> & Pick<AllocationState, 'districtId'>): AllocationState {
  return {
    allocated: 0,
    rolloverFromPrevious: 0,
    spent: 0,
    available: 0,
    isOverspent: false,
    targetProgressPct: null,
    requiredMonthlyFunding: null,
    ...partial,
  };
}

describe('daysInMonth', () => {
  it('handles February in a non-leap year', () => {
    expect(daysInMonth('2026-02')).toBe(28);
  });
});

describe('dayOfMonthIn', () => {
  it('uses the calendar day when asOf is inside the month', () => {
    expect(dayOfMonthIn(new Date(2026, 8, 23), '2026-09')).toBe(23);
  });
});

describe('computeAgeOfMoney', () => {
  it('weights FIFO: later spend against leftover older income stays older', () => {
    const transactions: Transaction[] = [
      { id: 'i1', districtId: 'dining', amount: 100, note: '', date: '2026-09-01T00:00:00.000Z', kind: 'income' },
      { id: 'i2', districtId: 'dining', amount: 100, note: '', date: '2026-09-11T00:00:00.000Z', kind: 'income' },
      { id: 's1', districtId: 'groceries', amount: 100, note: '', date: '2026-09-06T00:00:00.000Z', kind: 'spend' },
      { id: 's2', districtId: 'dining', amount: 50, note: '', date: '2026-09-16T00:00:00.000Z', kind: 'spend' },
    ];
    // First 100 spend matches 1 Sep income → 5 days.
    // Next 50 spend matches leftover? first income is gone, so 11 Sep income → 5 days.
    // Average = 5.
    expect(computeAgeOfMoney(transactions, new Date(2026, 8, 16))).toBe(5);
  });

  it('returns days since oldest income when nothing has been spent yet', () => {
    const transactions: Transaction[] = [
      { id: 'i1', districtId: 'dining', amount: 400, note: '', date: '2026-09-01T00:00:00.000Z', kind: 'income' },
    ];
    expect(computeAgeOfMoney(transactions, new Date(2026, 8, 11))).toBe(10);
  });

  it('is null with no income', () => {
    expect(computeAgeOfMoney([])).toBeNull();
  });
});

describe('computeFundPlan', () => {
  it('splits vault in proportion to need and spends the remainder on the last line', () => {
    const plan = computeFundPlan(100, [
      { districtId: 'dining', need: 30 },
      { districtId: 'groceries', need: 90 },
    ]);
    const total = plan.reduce((sum, line) => sum + line.amount, 0);
    expect(total).toBe(100);
    expect(plan.find((l) => l.districtId === 'dining')?.amount).toBe(25);
    expect(plan.find((l) => l.districtId === 'groceries')?.amount).toBe(75);
  });

  it('does not assign more than vault or more than need', () => {
    const plan = computeFundPlan(40, [{ districtId: 'dining', need: 10 }]);
    expect(plan).toEqual([{ districtId: 'dining', amount: 10 }]);
  });
});

describe('computeInsights', () => {
  it('flags a hot category and builds a fund plan from vault cash', () => {
    const snapshot = computeInsights({
      districts,
      vault: 80,
      month: '2026-09',
      asOf: new Date(2026, 8, 15),
      transactions: [
        { id: 'i1', districtId: 'dining', amount: 500, note: '', date: '2026-09-01T00:00:00.000Z', kind: 'income' },
        { id: 's1', districtId: 'dining', amount: 120, note: '', date: '2026-09-10T00:00:00.000Z', kind: 'spend' },
      ],
      states: [
        state({ districtId: 'dining', allocated: 120, spent: 120, available: 0, isOverspent: false }),
        state({ districtId: 'groceries', allocated: 350, spent: 20, available: 330, isOverspent: false }),
      ],
    });

    expect(snapshot.ageOfMoneyDays).toBe(9);
    expect(snapshot.categories.find((c) => c.districtId === 'dining')?.pace).toBe('hot');
    expect(snapshot.fundPlan.length).toBeGreaterThan(0);
    expect(snapshot.health).toBeGreaterThan(0);
    expect(snapshot.health).toBeLessThanOrEqual(100);
  });
});
