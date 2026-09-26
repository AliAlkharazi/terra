import { computeForecast } from '../forecast';
import { computeMonthPreview } from '../preview';
import { buildSampleHistory } from '@/data/sampleHistory';
import type { AllocationState, District } from '@/types';

const districts: District[] = [
  { id: 'dining', label: 'Diner', icon: '', monthlyBudget: 250 },
  { id: 'property', label: 'Home', icon: '', monthlyBudget: 200 },
  { id: 'bills', label: 'Bills', icon: '', monthlyBudget: 80 },
  { id: 'transport', label: 'Travel', icon: '', monthlyBudget: 120 },
  { id: 'groceries', label: 'Food', icon: '', monthlyBudget: 350 },
];

const history = buildSampleHistory('2026-09', districts);

describe('buildSampleHistory', () => {
  it('covers the three months before the current one, each funded at the usual plan', () => {
    const months = new Set(history.transactions.map((t) => t.date.slice(0, 7)));
    expect([...months].sort()).toEqual(['2026-06', '2026-07', '2026-08']);
    expect(history.allocations.filter((a) => a.month === '2026-08')).toHaveLength(5);
  });

  it('never spends more than a building was given in any month', () => {
    for (const a of history.allocations) {
      const spent = history.transactions
        .filter((t) => t.kind === 'spend' && t.districtId === a.districtId && t.date.startsWith(a.month))
        .reduce((sum, t) => sum + t.amount, 0);
      expect(spent).toBeLessThanOrEqual(a.amount);
    }
  });
});

describe('computeForecast', () => {
  const forecast = computeForecast({ transactions: history.transactions, districts, month: '2026-09' });

  it('weights recent months more for income', () => {
    // 0.2 × 1100 + 0.3 × 1180 + 0.5 × 1100
    expect(forecast.expectedIncome).toBe(1124);
  });

  it('sees dining rising month over month', () => {
    expect(forecast.categories.find((c) => c.districtId === 'dining')?.trend).toBe('up');
  });

  it('finds fixed monthly payments but not coffee or pizza', () => {
    const labels = forecast.recurring.map((r) => r.label);
    expect(labels).toEqual(expect.arrayContaining(['Salary', 'Rent share', 'Deutschlandticket', 'Phone bill', 'Spotify', 'Gym']));
    expect(labels).not.toContain('Coffee');
    expect(labels).not.toContain('Pizza');
    expect(labels).not.toContain('Tutoring');
    expect(forecast.recurring.find((r) => r.label === 'Rent share')).toMatchObject({ amount: 180, day: 1 });
  });

  it('reports no history when the past three months are empty', () => {
    const empty = computeForecast({ transactions: [], districts, month: '2026-09' });
    expect(empty.hasHistory).toBe(false);
    expect(empty.expectedSpend).toBe(0);
  });
});

describe('computeMonthPreview', () => {
  const states: AllocationState[] = districts.map((d) => ({
    districtId: d.id,
    allocated: 0,
    rolloverFromPrevious: 20,
    spent: 0,
    available: 20,
    isOverspent: false,
    targetProgressPct: null,
    requiredMonthlyFunding: null,
  }));

  const preview = computeMonthPreview({
    districts,
    states,
    locks: [],
    transactions: history.transactions,
    vault: 300,
    month: '2026-09',
    now: Date.parse('2026-09-23T12:00:00.000Z'),
  });

  it('dates next month’s bills and salary from the history', () => {
    const rent = preview.payments.find((p) => p.label === 'Rent share');
    const salary = preview.payments.find((p) => p.label === 'Salary');
    expect(rent).toMatchObject({ date: '2026-10-01T10:00:00.000Z', kind: 'bill', amount: 180 });
    expect(salary).toMatchObject({ kind: 'income', amount: 1100 });
  });

  it('projects the end of next month from start + income − spend', () => {
    expect(preview.nextMonth).toBe('2026-10');
    expect(preview.endNext).toBeCloseTo(preview.startNext + preview.expectedIncome - preview.expectedSpend, 1);
    expect(preview.startNext).toBeCloseTo(300 + 100 - preview.restOfMonth, 1);
  });
});
