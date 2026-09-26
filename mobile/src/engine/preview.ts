import type { AllocationState, District, DistrictId, MoneyLock, Transaction } from '@/types';
import { shiftMonth } from './ynabEngine';
import { dayOfMonthIn, daysInMonth } from './insights';
import { computeForecast, normalizeNote, type CategoryForecast } from './forecast';

export type PaymentKind = 'bill' | 'income' | 'unlock';

export type UpcomingPayment = {
  id: string;
  date: string;
  label: string;
  amount: number;
  kind: PaymentKind;
  districtId: DistrictId | null;
};

export type Rollover = {
  districtId: DistrictId;
  label: string;
  amount: number;
};

export type MonthPreview = {
  nextMonth: string;
  nextLabel: string;
  basisMonths: string[];
  hasHistory: boolean;
  expectedIncome: number;
  expectedSpend: number;
  restOfMonth: number;
  startNext: number;
  endNext: number;
  payments: UpcomingPayment[];
  categories: CategoryForecast[];
  rollovers: Rollover[];
};

export function monthLabel(month: string): string {
  const [year, mon] = month.split('-').map(Number);
  return new Date(year, mon - 1, 1).toLocaleString('en-GB', { month: 'long', year: 'numeric' });
}

export function monthShort(month: string): string {
  const [year, mon] = month.split('-').map(Number);
  return new Date(year, mon - 1, 1).toLocaleString('en-GB', { month: 'short' });
}

function isoOn(month: string, day: number): string {
  const clamped = Math.min(Math.max(1, day), daysInMonth(month));
  return `${month}-${String(clamped).padStart(2, '0')}T10:00:00.000Z`;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeMonthPreview(input: {
  districts: District[];
  states: AllocationState[];
  locks: MoneyLock[];
  transactions: Transaction[];
  vault: number;
  month: string;
  now?: number;
}): MonthPreview {
  const now = input.now ?? Date.now();
  const nextMonth = shiftMonth(input.month, 1);
  const nextStart = Date.parse(`${nextMonth}-01T00:00:00.000Z`);
  const nextEnd = Date.parse(`${shiftMonth(input.month, 2)}-01T00:00:00.000Z`);
  const forecast = computeForecast({ transactions: input.transactions, districts: input.districts, month: input.month });

  const dim = daysInMonth(input.month);
  const today = dayOfMonthIn(new Date(now), input.month);
  const restOfMonth = round((forecast.expectedSpend / dim) * Math.max(0, dim - today));

  const inTown = input.states.reduce((sum, s) => sum + Math.max(0, s.available), 0);
  const pending = (input.locks ?? []).filter((lock) => Date.parse(lock.unlockAt) > now);
  const unlockSum = (from: number, to: number) =>
    pending
      .filter((lock) => Date.parse(lock.unlockAt) >= from && Date.parse(lock.unlockAt) < to)
      .reduce((sum, lock) => sum + lock.amount, 0);

  const startNext = round(Math.max(0, input.vault) + inTown - restOfMonth + unlockSum(now, nextStart));
  const endNext = round(startNext + forecast.expectedIncome - forecast.expectedSpend + unlockSum(nextStart, nextEnd));

  const paidThisMonth = new Set(
    input.transactions.filter((t) => t.date.startsWith(input.month)).map((t) => `${t.kind}|${normalizeNote(t.note)}`)
  );

  const payments: UpcomingPayment[] = [];
  forecast.recurring.forEach((item) => {
    const base = {
      label: item.label,
      amount: item.amount,
      kind: item.kind === 'income' ? ('income' as const) : ('bill' as const),
      districtId: item.districtId,
    };
    if (item.day > today && !paidThisMonth.has(`${item.kind}|${item.match}`)) {
      payments.push({ ...base, id: `${item.key}-now`, date: isoOn(input.month, item.day) });
    }
    payments.push({ ...base, id: `${item.key}-next`, date: isoOn(nextMonth, item.day) });
  });
  pending
    .filter((lock) => Date.parse(lock.unlockAt) < nextEnd)
    .forEach((lock) =>
      payments.push({ id: `unlock-${lock.id}`, date: lock.unlockAt, label: 'Freeze ends', amount: lock.amount, kind: 'unlock', districtId: null })
    );
  payments.sort((a, b) => a.date.localeCompare(b.date));

  const rollovers: Rollover[] = input.states
    .filter((s) => s.available > 0.009)
    .map((s) => ({
      districtId: s.districtId,
      label: input.districts.find((d) => d.id === s.districtId)?.label ?? s.districtId,
      amount: round(s.available),
    }));

  return {
    nextMonth,
    nextLabel: monthLabel(nextMonth),
    basisMonths: forecast.basisMonths,
    hasHistory: forecast.hasHistory,
    expectedIncome: forecast.expectedIncome,
    expectedSpend: forecast.expectedSpend,
    restOfMonth,
    startNext,
    endNext,
    payments,
    categories: forecast.categories,
    rollovers,
  };
}
