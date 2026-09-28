import {
  Allocation,
  AllocationState,
  District,
  DistrictId,
  DistrictTarget,
  Transaction,
} from '@/types';

export function computeReadyToAssign(transactions: Transaction[], allocations: Allocation[]): number {
  const totalIncome = transactions
    .filter((t) => t.kind === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);
  return totalIncome - totalAllocated;
}

export function computeMonthlySpent(transactions: Transaction[], districtId: DistrictId, month: string): number {
  return transactions
    .filter(
      (t) =>
        t.districtId === districtId &&
        t.kind === 'spend' &&
        !t.uncategorized &&
        t.date.startsWith(month)
    )
    .reduce((sum, t) => sum + t.amount, 0);
}

export function computeAllocationState(
  district: District,
  allocations: Allocation[],
  transactions: Transaction[],
  month: string,
  rolloverFromPrevious: number
): AllocationState {
  const allocated = allocations.find((a) => a.districtId === district.id && a.month === month)?.amount ?? 0;
  const spent = computeMonthlySpent(transactions, district.id, month);
  const available = allocated + rolloverFromPrevious - spent;

  const { targetProgressPct, requiredMonthlyFunding } = computeTargetProgress(district.target, available, allocated, month);

  return {
    districtId: district.id,
    allocated,
    rolloverFromPrevious,
    spent,
    available,
    isOverspent: available < 0,
    target: district.target,
    targetProgressPct,
    requiredMonthlyFunding,
  };
}

const MAX_ROLLOVER_MONTHS = 24;

export function computeAllocationStateChain(
  district: District,
  allocations: Allocation[],
  transactions: Transaction[],
  month: string,
  earliestMonth: string,
  depth = 0
): AllocationState {
  if (month <= earliestMonth || depth >= MAX_ROLLOVER_MONTHS) {
    return computeAllocationState(district, allocations, transactions, month, 0);
  }
  const prevMonth = shiftMonth(month, -1);
  const prevState = computeAllocationStateChain(district, allocations, transactions, prevMonth, earliestMonth, depth + 1);
  return computeAllocationState(district, allocations, transactions, month, prevState.available);
}

export function shiftMonth(monthISO: string, delta: number): string {
  const [y, m] = monthISO.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function computeTargetProgress(
  target: DistrictTarget | undefined,
  available: number,
  allocated: number,
  month: string
): { targetProgressPct: number | null; requiredMonthlyFunding: number | null } {
  if (!target) return { targetProgressPct: null, requiredMonthlyFunding: null };

  if (target.targetType === 'MONTHLY_NEEDED') {
    const pct = target.targetAmount > 0 ? Math.min(100, (allocated / target.targetAmount) * 100) : 100;
    return { targetProgressPct: Math.round(pct), requiredMonthlyFunding: target.targetAmount };
  }

  if (target.targetType === 'SAVINGS_BALANCE') {
    const pct = target.targetAmount > 0 ? Math.min(100, Math.max(0, (available / target.targetAmount) * 100)) : 100;
    const remaining = Math.max(0, target.targetAmount - available);
    return { targetProgressPct: Math.round(pct), requiredMonthlyFunding: remaining };
  }

  const pct = target.targetAmount > 0 ? Math.min(100, Math.max(0, (available / target.targetAmount) * 100)) : 100;
  const remaining = Math.max(0, target.targetAmount - available);
  const monthsLeft = target.targetDate ? Math.max(1, monthsBetween(month, target.targetDate)) : 1;
  return { targetProgressPct: Math.round(pct), requiredMonthlyFunding: remaining / monthsLeft };
}

function monthsBetween(monthISO: string, targetDateISO: string): number {
  const [y, m] = monthISO.split('-').map(Number);
  const target = new Date(targetDateISO);
  return (target.getFullYear() - y) * 12 + (target.getMonth() + 1 - m);
}

export function cappedAssignAmount(requested: number, currentAllocated: number, readyToAssign: number): number {
  const maxAmount = Math.max(0, currentAllocated + readyToAssign);
  if (!Number.isFinite(requested)) return currentAllocated;
  return Math.max(0, Math.min(requested, maxAmount));
}

export function emptyAllocationState(districtId: DistrictId): AllocationState {
  return {
    districtId,
    allocated: 0,
    rolloverFromPrevious: 0,
    spent: 0,
    available: 0,
    isOverspent: false,
    targetProgressPct: null,
    requiredMonthlyFunding: null,
  };
}

const DOLLARS_PER_FLOOR = 50;
const MAX_BANK_FLOORS = 8;

export function readyToAssignToBankState(readyToAssign: number) {
  const totalSaved = Math.max(0, readyToAssign);
  const floors = Math.max(1, Math.min(MAX_BANK_FLOORS, 1 + Math.floor(totalSaved / DOLLARS_PER_FLOOR)));
  return { totalSaved, floors };
}
