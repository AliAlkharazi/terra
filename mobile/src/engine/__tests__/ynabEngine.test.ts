import {
  cappedAssignAmount,
  computeAllocationState,
  computeAllocationStateChain,
  computeReadyToAssign,
  readyToAssignToBankState,
  shiftMonth,
} from '../ynabEngine';
import { District, Transaction, Allocation } from '@/types';

const district: District = { id: 'groceries', label: 'Groceries', icon: '🥬', monthlyBudget: 300 };

describe('computeReadyToAssign', () => {
  it('is income minus allocations, as a running total across all months', () => {
    const transactions: Transaction[] = [
      { id: '1', districtId: 'dining', amount: 2000, note: 'salary', date: '2026-01-01T00:00:00.000Z', kind: 'income' },
      { id: '2', districtId: 'dining', amount: 500, note: 'bonus', date: '2026-03-01T00:00:00.000Z', kind: 'income' },
    ];
    const allocations: Allocation[] = [
      { districtId: 'groceries', month: '2026-01', amount: 300 },
      { districtId: 'dining', month: '2026-02', amount: 100 },
    ];
    // 2000 + 500 income, 300 + 100 allocated -> 2100 remaining, regardless of month
    expect(computeReadyToAssign(transactions, allocations)).toBe(2100);
  });

  it('ignores spend transactions entirely — only income and allocations move the needle', () => {
    const transactions: Transaction[] = [
      { id: '1', districtId: 'dining', amount: 1000, note: '', date: '2026-01-01T00:00:00.000Z', kind: 'income' },
      { id: '2', districtId: 'groceries', amount: 50, note: '', date: '2026-01-05T00:00:00.000Z', kind: 'spend' },
    ];
    expect(computeReadyToAssign(transactions, [])).toBe(1000);
  });
});

describe('computeAllocationState', () => {
  it('available = allocated + rollover - spent', () => {
    const transactions: Transaction[] = [
      { id: '1', districtId: 'groceries', amount: 120, note: '', date: '2026-03-05T00:00:00.000Z', kind: 'spend' },
    ];
    const allocations: Allocation[] = [{ districtId: 'groceries', month: '2026-03', amount: 300 }];
    const state = computeAllocationState(district, allocations, transactions, '2026-03', 50);
    expect(state.allocated).toBe(300);
    expect(state.spent).toBe(120);
    expect(state.rolloverFromPrevious).toBe(50);
    expect(state.available).toBe(230); // 300 + 50 - 120
    expect(state.isOverspent).toBe(false);
  });

  it('flags overspending when spend exceeds allocated + rollover', () => {
    const transactions: Transaction[] = [
      { id: '1', districtId: 'groceries', amount: 400, note: '', date: '2026-03-05T00:00:00.000Z', kind: 'spend' },
    ];
    const allocations: Allocation[] = [{ districtId: 'groceries', month: '2026-03', amount: 300 }];
    const state = computeAllocationState(district, allocations, transactions, '2026-03', 0);
    expect(state.available).toBe(-100);
    expect(state.isOverspent).toBe(true);
  });
});

describe('computeAllocationStateChain (rollover propagation)', () => {
  it('carries a positive leftover forward into the next month', () => {
    const allocations: Allocation[] = [{ districtId: 'groceries', month: '2026-01', amount: 300 }];
    const transactions: Transaction[] = [
      { id: '1', districtId: 'groceries', amount: 200, note: '', date: '2026-01-10T00:00:00.000Z', kind: 'spend' },
    ];
    // Jan: 300 - 200 = 100 leftover. Feb has no allocation/spend of its own.
    const febState = computeAllocationStateChain(district, allocations, transactions, '2026-02', '2025-12');
    expect(febState.rolloverFromPrevious).toBe(100);
    expect(febState.available).toBe(100);
  });

  it('carries an UNCOVERED negative balance forward too — this is the real YNAB behavior', () => {
    const allocations: Allocation[] = [{ districtId: 'groceries', month: '2026-01', amount: 100 }];
    const transactions: Transaction[] = [
      { id: '1', districtId: 'groceries', amount: 250, note: '', date: '2026-01-10T00:00:00.000Z', kind: 'spend' },
    ];
    // Jan: 100 - 250 = -150, never covered. Feb inherits the hole.
    const febState = computeAllocationStateChain(district, allocations, transactions, '2026-02', '2025-12');
    expect(febState.rolloverFromPrevious).toBe(-150);
    expect(febState.available).toBe(-150);
    expect(febState.isOverspent).toBe(true);
  });

  it('does not recurse indefinitely even with a pathologically old earliestMonth', () => {
    const state = computeAllocationStateChain(district, [], [], '2026-09', '1970-01');
    expect(state).toBeDefined();
    expect(state.available).toBe(0);
  });
});

describe('shiftMonth', () => {
  it('handles year boundaries correctly', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2025-12', 1)).toBe('2026-01');
  });
});

describe('cappedAssignAmount', () => {
  it('cannot spend more vault money than exists', () => {
    expect(cappedAssignAmount(150, 0, 100)).toBe(100);
  });

  it('lets you raise a category by the remaining vault', () => {
    expect(cappedAssignAmount(80, 50, 20)).toBe(70);
  });

  it('lets you lower a category even if the vault is empty', () => {
    expect(cappedAssignAmount(20, 80, 0)).toBe(20);
  });
});

describe('readyToAssignToBankState (3D bridge payload)', () => {
  it('never shows a negative amount in the 3D vault, even when overassigned', () => {
    expect(readyToAssignToBankState(-50).totalSaved).toBe(0);
  });

  it('adds one floor per $50, capped at 8', () => {
    expect(readyToAssignToBankState(0).floors).toBe(1);
    expect(readyToAssignToBankState(120).floors).toBe(3);
    expect(readyToAssignToBankState(10000).floors).toBe(8);
  });
});
