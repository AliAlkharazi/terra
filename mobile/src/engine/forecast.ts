import type { District, DistrictId, Transaction, TransactionKind } from '@/types';
import { shiftMonth } from './ynabEngine';

export type Trend = 'up' | 'down' | 'flat';

export type CategoryForecast = {
  districtId: DistrictId;
  history: number[];
  forecast: number;
  plan: number;
  trend: Trend;
};

export type RecurringItem = {
  key: string;
  match: string;
  label: string;
  kind: TransactionKind;
  districtId: DistrictId | null;
  amount: number;
  day: number;
  monthsSeen: number;
};

export type Forecast = {
  basisMonths: string[];
  hasHistory: boolean;
  expectedIncome: number;
  expectedSpend: number;
  categories: CategoryForecast[];
  recurring: RecurringItem[];
};

const WEIGHTS = [0.2, 0.3, 0.5];
const FIXED_TOLERANCE = 0.05;

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function normalizeNote(note: string): string {
  return note
    .toLowerCase()
    .replace(/[0-9€.,]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function weighted(values: number[], active: boolean[]): number {
  let sum = 0;
  let weight = 0;
  values.forEach((value, i) => {
    if (!active[i]) return;
    sum += value * WEIGHTS[i];
    weight += WEIGHTS[i];
  });
  return weight > 0 ? round(sum / weight) : 0;
}

function trendOf(values: number[], active: boolean[]): Trend {
  const seen = values.filter((_, i) => active[i]);
  if (seen.length < 2) return 'flat';
  const first = seen[0];
  const last = seen[seen.length - 1];
  if (last > first * 1.1) return 'up';
  if (last < first * 0.9) return 'down';
  return 'flat';
}

function detectRecurring(rows: Transaction[]): RecurringItem[] {
  const groups = new Map<string, Transaction[]>();
  rows.forEach((t) => {
    const match = normalizeNote(t.note);
    if (!match) return;
    const key = `${t.kind}|${t.kind === 'spend' ? t.districtId : 'in'}|${match}`;
    groups.set(key, [...(groups.get(key) ?? []), t]);
  });

  const items: RecurringItem[] = [];
  groups.forEach((group, key) => {
    const months = new Set(group.map((t) => t.date.slice(0, 7)));
    if (months.size < 2 || group.length / months.size > 1.5) return;
    const amount = median(group.map((t) => t.amount));
    if (group.some((t) => Math.abs(t.amount - amount) > amount * FIXED_TOLERANCE)) return;
    const latest = [...group].sort((a, b) => b.date.localeCompare(a.date))[0];
    items.push({
      key,
      match: normalizeNote(latest.note),
      label: latest.note.trim(),
      kind: latest.kind,
      districtId: latest.kind === 'spend' ? latest.districtId : null,
      amount: round(amount),
      day: Math.round(median(group.map((t) => Number(t.date.slice(8, 10))))),
      monthsSeen: months.size,
    });
  });

  return items.sort((a, b) => a.day - b.day || b.amount - a.amount);
}

export function computeForecast(input: { transactions: Transaction[]; districts: District[]; month: string }): Forecast {
  const basisMonths = WEIGHTS.map((_, i) => shiftMonth(input.month, i - WEIGHTS.length));
  const inBasis = input.transactions.filter((t) => basisMonths.includes(t.date.slice(0, 7)));
  const active = basisMonths.map((m) => inBasis.some((t) => t.date.startsWith(m)));
  const hasHistory = active.some(Boolean);

  const sumFor = (month: string, pick: (t: Transaction) => boolean) =>
    round(inBasis.filter((t) => t.date.startsWith(month) && pick(t)).reduce((sum, t) => sum + t.amount, 0));

  const categories: CategoryForecast[] = input.districts
    .filter((d) => !d.isCreditCard)
    .map((d) => {
      const history = basisMonths.map((m) => sumFor(m, (t) => t.kind === 'spend' && t.districtId === d.id));
      return {
        districtId: d.id,
        history,
        forecast: weighted(history, active),
        plan: d.monthlyBudget,
        trend: trendOf(history, active),
      };
    });

  const incomeHistory = basisMonths.map((m) => sumFor(m, (t) => t.kind === 'income'));

  return {
    basisMonths,
    hasHistory,
    expectedIncome: weighted(incomeHistory, active),
    expectedSpend: round(categories.reduce((sum, c) => sum + c.forecast, 0)),
    categories,
    recurring: detectRecurring(inBasis),
  };
}
