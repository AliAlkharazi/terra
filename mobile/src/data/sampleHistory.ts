import type { ActivityItem, Allocation, District, DistrictId, Transaction } from '@/types';
import { shiftMonth } from '@/engine/ynabEngine';

type Row = [day: number, note: string, amount: number, target: DistrictId | 'income'];

const FIXED: Row[] = [
  [1, 'Salary', 1100, 'income'],
  [1, 'Rent share', 180, 'property'],
  [2, 'Deutschlandticket', 49, 'transport'],
  [3, 'Phone bill', 29, 'bills'],
  [12, 'Spotify', 11, 'bills'],
  [15, 'Gym', 25, 'bills'],
];

const VARIABLE: Row[][] = [
  [
    [4, 'Coffee', 3.2, 'dining'],
    [6, 'Lunch', 13.5, 'dining'],
    [9, 'Pizza', 16, 'dining'],
    [11, 'Sneakers', 79, 'dining'],
    [14, 'Coffee', 3.5, 'dining'],
    [17, 'Dinner', 26, 'dining'],
    [20, 'Lunch', 12, 'dining'],
    [23, 'Coffee', 3.8, 'dining'],
    [26, 'Takeaway', 18, 'dining'],
    [28, 'Coffee', 3.4, 'dining'],
    [3, 'Groceries', 42, 'groceries'],
    [7, 'Groceries', 38, 'groceries'],
    [10, 'Groceries', 51, 'groceries'],
    [14, 'Groceries', 47, 'groceries'],
    [18, 'Groceries', 36, 'groceries'],
    [21, 'Groceries', 44, 'groceries'],
    [25, 'Groceries', 39, 'groceries'],
    [28, 'Groceries', 30, 'groceries'],
    [8, 'Train', 9.4, 'transport'],
    [19, 'Uber', 12, 'transport'],
  ],
  [
    [3, 'Coffee', 3.5, 'dining'],
    [5, 'Lunch', 14, 'dining'],
    [8, 'Coffee', 3.9, 'dining'],
    [10, 'Dinner', 28, 'dining'],
    [12, 'Pizza', 17, 'dining'],
    [14, 'Jacket', 65, 'dining'],
    [17, 'Lunch', 13, 'dining'],
    [20, 'Takeaway', 19, 'dining'],
    [22, 'Coffee', 4, 'dining'],
    [25, 'Dinner', 31, 'dining'],
    [28, 'Lunch', 15, 'dining'],
    [2, 'Groceries', 45, 'groceries'],
    [6, 'Groceries', 40, 'groceries'],
    [9, 'Groceries', 52, 'groceries'],
    [13, 'Groceries', 49, 'groceries'],
    [17, 'Groceries', 38, 'groceries'],
    [21, 'Groceries', 46, 'groceries'],
    [24, 'Groceries', 41, 'groceries'],
    [28, 'Groceries', 29, 'groceries'],
    [9, 'Train', 11, 'transport'],
    [16, 'Uber', 14, 'transport'],
    [24, 'Train', 9.4, 'transport'],
    [18, 'Tutoring', 80, 'income'],
  ],
  [
    [2, 'Coffee', 3.8, 'dining'],
    [5, 'Lunch', 14.5, 'dining'],
    [8, 'Dinner', 32, 'dining'],
    [11, 'Pizza', 18, 'dining'],
    [13, 'Coffee', 4, 'dining'],
    [15, 'Running shoes', 99, 'dining'],
    [19, 'Takeaway', 21, 'dining'],
    [22, 'Lunch', 13.5, 'dining'],
    [25, 'Coffee', 4.2, 'dining'],
    [28, 'Dinner', 34, 'dining'],
    [3, 'Groceries', 47, 'groceries'],
    [6, 'Groceries', 36, 'groceries'],
    [10, 'Groceries', 55, 'groceries'],
    [14, 'Groceries', 44, 'groceries'],
    [17, 'Groceries', 40, 'groceries'],
    [21, 'Groceries', 48, 'groceries'],
    [24, 'Groceries', 43, 'groceries'],
    [28, 'Groceries', 33, 'groceries'],
    [7, 'Train', 11, 'transport'],
    [18, 'Uber', 16, 'transport'],
    [27, 'Bus', 3, 'transport'],
  ],
];

export const HISTORY_MONTHS = VARIABLE.length;

export function historyMonths(currentMonth: string): string[] {
  return VARIABLE.map((_, i) => shiftMonth(currentMonth, i - VARIABLE.length));
}

export function buildSampleHistory(currentMonth: string, districts: District[]) {
  const transactions: Transaction[] = [];
  const allocations: Allocation[] = [];
  const activity: ActivityItem[] = [];

  historyMonths(currentMonth).forEach((month, index) => {
    [...FIXED, ...VARIABLE[index]].forEach(([day, note, amount, target], row) => {
      const id = `hist-${month}-${row}`;
      const date = `${month}-${String(day).padStart(2, '0')}T10:00:00.000Z`;
      if (target === 'income') {
        transactions.push({ id, districtId: 'dining', amount, note, date, kind: 'income' });
        activity.push({ id: `${id}-dep`, date, kind: 'deposit', amount, toId: 'vault', note });
      } else {
        transactions.push({ id, districtId: target, amount, note, date, kind: 'spend', isCreditCard: false });
      }
    });

    // Only seed the classic five — newer shop buildings start empty on the map.
    const seedIds = new Set<DistrictId>(['dining', 'property', 'bills', 'transport', 'groceries']);
    districts
      .filter((d) => !d.isCreditCard && seedIds.has(d.id) && d.monthlyBudget > 0)
      .forEach((d) => allocations.push({ districtId: d.id, month, amount: d.monthlyBudget }));
  });

  return { transactions, allocations, activity };
}
