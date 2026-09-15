import {
  BankState,
  District,
  DistrictState,
  GrowthStage,
  Season,
  Transaction,
  WorldSnapshot,
} from '@/types';

const DOLLARS_PER_FLOOR = 50;
const MAX_BANK_FLOORS = 8;

export function daysInMonth(monthISO: string): number {
  const [y, m] = monthISO.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

export function currentDayOfMonth(monthISO: string, todayISO?: string): number {
  const today = todayISO ? new Date(todayISO) : new Date();
  const [y, m] = monthISO.split('-').map(Number);
  if (today.getFullYear() === y && today.getMonth() + 1 === m) {
    return today.getDate();
  }
  const viewed = new Date(y, m - 1, 1);
  return viewed < today ? daysInMonth(monthISO) : 1;
}

export function healthForDistrict(
  spent: number,
  budget: number,
  monthISO: string,
  todayISO?: string
): number {
  if (budget <= 0) return spent > 0 ? 30 : 100;

  const dim = daysInMonth(monthISO);
  const dayNow = currentDayOfMonth(monthISO, todayISO);
  const expectedSpend = budget * (dayNow / dim);

  const paceDelta = spent - expectedSpend;
  const paceRatio = paceDelta / budget;

  let health = 100 - paceRatio * 140;
  health = Math.max(5, Math.min(100, health));
  return Math.round(health);
}

export function stageForHealth(healthPct: number): GrowthStage {
  if (healthPct >= 80) return 'thriving';
  if (healthPct >= 55) return 'stable';
  if (healthPct >= 30) return 'strained';
  return 'wilting';
}

export function seasonForMonth(monthISO: string): Season {
  const month = Number(monthISO.split('-')[1]);
  if ([3, 4, 5].includes(month)) return 'spring';
  if ([6, 7, 8].includes(month)) return 'summer';
  if ([9, 10, 11].includes(month)) return 'autumn';
  return 'winter';
}

export function buildWorldSnapshot(
  districts: District[],
  transactions: Transaction[],
  monthISO: string,
  todayISO?: string
): WorldSnapshot {
  const monthTx = transactions.filter(
    (t) => t.date.startsWith(monthISO) && t.kind === 'spend'
  );

  const districtStates: DistrictState[] = districts.map((d) => {
    const spent = monthTx
      .filter((t) => t.districtId === d.id)
      .reduce((sum, t) => sum + t.amount, 0);

    const healthPct = healthForDistrict(spent, d.monthlyBudget, monthISO, todayISO);

    return {
      districtId: d.id,
      spent,
      budget: d.monthlyBudget,
      healthPct,
      stage: stageForHealth(healthPct),
    };
  });

  const totalBudget = districts.reduce((s, d) => s + d.monthlyBudget, 0);
  const totalSpent = districtStates.reduce((s, d) => s + d.spent, 0);
  const overallHealthPct =
    districtStates.length > 0
      ? Math.round(districtStates.reduce((s, d) => s + d.healthPct, 0) / districtStates.length)
      : 100;

  return {
    month: monthISO,
    totalBudget,
    totalSpent,
    overallHealthPct,
    season: seasonForMonth(monthISO),
    districts: districtStates,
  };
}

export function buildBankState(transactions: Transaction[], monthISO: string): BankState {
  const totalSaved = transactions
    .filter((t) => t.date.startsWith(monthISO) && t.kind === 'save')
    .reduce((sum, t) => sum + t.amount, 0);

  const floors = Math.max(
    1,
    Math.min(MAX_BANK_FLOORS, 1 + Math.floor(totalSaved / DOLLARS_PER_FLOOR))
  );

  return { totalSaved, floors };
}

export function narratorLine(snapshot: WorldSnapshot): string {
  const worst = [...snapshot.districts].sort((a, b) => a.healthPct - b.healthPct)[0];
  const best = [...snapshot.districts].sort((a, b) => b.healthPct - a.healthPct)[0];

  if (snapshot.overallHealthPct >= 80) {
    return `Terra is thriving. Even ${worst?.districtId ?? 'every district'} is holding steady.`;
  }
  if (worst && worst.stage === 'wilting') {
    return `${capitalize(worst.districtId)} is wilting fast — it's outpacing its budget for the month.`;
  }
  if (best && best.stage === 'thriving') {
    return `${capitalize(best.districtId)} is flourishing. The rest of Terra could learn something.`;
  }
  return `Terra is holding its ground — nothing thriving, nothing dying.`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
