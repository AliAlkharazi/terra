import type { AllocationState, District, DistrictId, Transaction } from '@/types';

export type PaceStatus = 'overspent' | 'hot' | 'on_track' | 'cold' | 'idle';

export type CategoryInsight = {
  districtId: DistrictId;
  spent: number;
  allocated: number;
  available: number;
  dailyRate: number;
  expectedByToday: number;
  daysToEmpty: number | null;
  pace: PaceStatus;
  suggestedAdd: number;
};

export type FundLine = {
  districtId: DistrictId;
  amount: number;
};

export type InsightsSnapshot = {
  month: string;
  dayOfMonth: number;
  daysInMonth: number;
  monthProgress: number;
  vault: number;
  inTown: number;
  spentThisMonth: number;
  health: number;
  healthLabel: 'Strong' | 'Watch' | 'Strain';
  ageOfMoneyDays: number | null;
  runwayDays: number | null;
  overspentCount: number;
  categories: CategoryInsight[];
  fundPlan: FundLine[];
  headline: string;
  detail: string;
};

const MS_DAY = 86_400_000;

export function daysInMonth(month: string): number {
  const [year, mon] = month.split('-').map(Number);
  return new Date(year, mon, 0).getDate();
}

export function dayOfMonthIn(asOf: Date, month: string): number {
  const stamp = `${asOf.getFullYear()}-${String(asOf.getMonth() + 1).padStart(2, '0')}`;
  if (stamp < month) return 1;
  if (stamp > month) return daysInMonth(month);
  return asOf.getDate();
}

function dayStamp(iso: string): number {
  return Date.parse(`${iso.slice(0, 10)}T00:00:00.000Z`);
}

function roundEuro(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeAgeOfMoney(transactions: Transaction[], asOf = new Date()): number | null {
  const income = transactions
    .filter((t) => t.kind === 'income' && t.amount > 0)
    .map((t) => ({ remaining: t.amount, at: dayStamp(t.date) }))
    .sort((a, b) => a.at - b.at);

  const spend = transactions
    .filter((t) => t.kind === 'spend' && t.amount > 0)
    .map((t) => ({ remaining: t.amount, at: dayStamp(t.date) }))
    .sort((a, b) => a.at - b.at);

  if (income.length === 0) return null;

  let aged = 0;
  let matched = 0;
  let i = 0;

  for (const out of spend) {
    let left = out.remaining;
    while (left > 0.0001 && i < income.length) {
      const take = Math.min(left, income[i].remaining);
      aged += ((out.at - income[i].at) / MS_DAY) * take;
      matched += take;
      income[i].remaining = roundEuro(income[i].remaining - take);
      left = roundEuro(left - take);
      if (income[i].remaining <= 0.0001) i += 1;
    }
  }

  if (matched > 0) return Math.max(0, Math.round(aged / matched));

  const oldest = income[0].at;
  return Math.max(0, Math.round((Date.UTC(asOf.getFullYear(), asOf.getMonth(), asOf.getDate()) - oldest) / MS_DAY));
}

export function computeFundPlan(vault: number, needs: { districtId: DistrictId; need: number }[]): FundLine[] {
  const cash = roundEuro(Math.max(0, vault));
  const eligible = needs.filter((n) => n.need > 0.009);
  if (cash < 0.01 || eligible.length === 0) return [];

  const totalNeed = eligible.reduce((sum, n) => sum + n.need, 0);
  const pool = Math.min(cash, totalNeed);
  let leftover = pool;

  return eligible
    .map((n, index) => {
      const share = index === eligible.length - 1 ? leftover : roundEuro(Math.min(n.need, (n.need / totalNeed) * pool));
      const amount = roundEuro(Math.max(0, Math.min(n.need, share, leftover)));
      leftover = roundEuro(leftover - amount);
      return { districtId: n.districtId, amount };
    })
    .filter((line) => line.amount > 0.009);
}

function paceFor(available: number, spent: number, expectedByToday: number, monthProgress: number): PaceStatus {
  if (available < -0.009) return 'overspent';
  if (spent <= 0.009) return 'idle';
  if (expectedByToday > 0 && spent > expectedByToday * 1.15) return 'hot';
  if (monthProgress > 0.2 && expectedByToday > 0 && spent < expectedByToday * 0.55) return 'cold';
  return 'on_track';
}

export function computeInsights(input: {
  districts: District[];
  states: AllocationState[];
  transactions: Transaction[];
  vault: number;
  month: string;
  asOf?: Date;
}): InsightsSnapshot {
  const asOf = input.asOf ?? new Date();
  const dim = daysInMonth(input.month);
  const day = dayOfMonthIn(asOf, input.month);
  const monthProgress = day / dim;
  const vault = Math.max(0, input.vault);
  const inTown = input.states.reduce((sum, s) => sum + Math.max(0, s.available), 0);
  const spentThisMonth = input.states.reduce((sum, s) => sum + s.spent, 0);
  const dailyBurn = day > 0 ? spentThisMonth / day : 0;
  const liquid = vault + inTown;
  const runwayDays = dailyBurn > 0.009 ? Math.round(liquid / dailyBurn) : null;
  const ageOfMoneyDays = computeAgeOfMoney(input.transactions, asOf);

  const categories: CategoryInsight[] = input.states
    .filter((s) => input.districts.some((d) => d.id === s.districtId && !d.isCreditCard))
    .map((s) => {
      const district = input.districts.find((d) => d.id === s.districtId);
      const expectedByToday = s.allocated * monthProgress;
      const dailyRate = day > 0 ? s.spent / day : 0;
      const projected = dailyRate * dim;
      const budgetFloor = district?.monthlyBudget ?? 0;
      const target = Math.max(projected, budgetFloor);
      const need = Math.max(0, roundEuro(target - Math.max(0, s.available)));
      const daysToEmpty = s.available > 0.009 && dailyRate > 0.009 ? Math.max(0, Math.round(s.available / dailyRate)) : null;
      return {
        districtId: s.districtId,
        spent: s.spent,
        allocated: s.allocated,
        available: s.available,
        dailyRate,
        expectedByToday,
        daysToEmpty,
        pace: paceFor(s.available, s.spent, expectedByToday, monthProgress),
        suggestedAdd: need,
      };
    });

  const overspentCount = categories.filter((c) => c.pace === 'overspent').length;
  const fundPlan = computeFundPlan(
    vault,
    categories.map((c) => ({ districtId: c.districtId, need: c.suggestedAdd }))
  );

  let health = 100;
  health -= overspentCount * 16;
  health -= categories.filter((c) => c.pace === 'hot').length * 7;
  if (fundPlan.length > 0) health -= Math.min(14, 6 + Math.round((vault / Math.max(liquid, 1)) * 10));
  if (ageOfMoneyDays != null && ageOfMoneyDays < 7) health -= 10;
  if (ageOfMoneyDays != null && ageOfMoneyDays >= 21) health += 6;
  if (runwayDays != null && runwayDays < 10) health -= 12;
  if (spentThisMonth === 0 && vault + inTown > 0) health = Math.min(health, 88);
  health = Math.max(8, Math.min(100, Math.round(health)));

  const healthLabel: InsightsSnapshot['healthLabel'] = health >= 80 ? 'Strong' : health >= 55 ? 'Watch' : 'Strain';

  const hottest = [...categories].sort((a, b) => {
    const rank = { overspent: 0, hot: 1, on_track: 2, idle: 3, cold: 4 };
    return rank[a.pace] - rank[b.pace] || b.spent - a.spent;
  })[0];

  let headline = 'Town is waiting for its first deposit.';
  let detail = 'Add income, then assign it into buildings. Insights grow from the ledger.';

  if (vault + inTown + spentThisMonth > 0) {
    if (overspentCount > 0) {
      headline = `${overspentCount} building${overspentCount === 1 ? '' : 's'} already overspent.`;
      detail = 'Cover the hole from another building or the vault before it rolls into next month.';
    } else if (hottest?.pace === 'hot' && hottest.daysToEmpty != null) {
      headline = `A building runs empty in ${hottest.daysToEmpty} day${hottest.daysToEmpty === 1 ? '' : 's'}.`;
      detail = 'At this month’s pace it will hit zero before the month ends. Fund it from the vault.';
    } else if (fundPlan.length > 0) {
      const total = fundPlan.reduce((sum, line) => sum + line.amount, 0);
      headline = `${roundEuro(total).toFixed(0)} € in the vault is still unassigned.`;
      detail = 'Suggested split follows burn rate and each building’s monthly plan.';
    } else if (ageOfMoneyDays != null) {
      headline = `Your money is ${ageOfMoneyDays} day${ageOfMoneyDays === 1 ? '' : 's'} old.`;
      detail =
        ageOfMoneyDays >= 21
          ? 'Cash is lasting. You are spending last month’s income, not today’s.'
          : 'Age of money is how long euros sit before they are spent — FIFO, like inventory.';
    } else if (runwayDays != null) {
      headline = `Runway is ${runwayDays} day${runwayDays === 1 ? '' : 's'} at this pace.`;
      detail = 'Vault plus buildings, divided by this month’s daily spend.';
    }
  }

  return {
    month: input.month,
    dayOfMonth: day,
    daysInMonth: dim,
    monthProgress,
    vault,
    inTown,
    spentThisMonth,
    health,
    healthLabel,
    ageOfMoneyDays,
    runwayDays,
    overspentCount,
    categories,
    fundPlan,
    headline,
    detail,
  };
}
