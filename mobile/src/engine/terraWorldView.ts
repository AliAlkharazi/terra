import type {
  Allocation,
  District,
  MoneyLock,
  PocketId,
  Transaction,
} from '@/types';
import type {
  TerraWorldViewDTO,
  TerraWorldViewDistrict,
  TerraWorldViewStage,
} from '@/types/worldView';
import {
  computeAllocationStateChain,
  computeReadyToAssign,
  shiftMonth,
} from '@/engine/ynabEngine';
import { activeLocks, lockedTotal } from '@/engine/locks';

/** Plain input slices — no React hooks / stores. Money fields are euro amounts (village store units). */
export type TerraWorldViewInput = {
  districts: District[];
  transactions: Transaction[];
  allocations: Allocation[];
  currentMonth: string;
  locks?: MoneyLock[];
  goals?: Array<{ id: string; name: string; target: number; progress?: number }>;
  /** Epoch ms or ISO string; defaults to Date.now(). */
  now?: number | string;
  /** ISO timestamp for DTO.asOf; defaults from `now`. */
  asOf?: string;
};

function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}

function resolveNow(now?: number | string): number {
  if (now == null) return Date.now();
  if (typeof now === 'number') return now;
  return Date.parse(now);
}

function earliestKnownMonth(transactions: Transaction[], allocations: Allocation[], fallbackMonth: string): string {
  const dates = [...transactions.map((t) => t.date.slice(0, 7)), ...allocations.map((a) => a.month)];
  if (dates.length === 0) return fallbackMonth;
  return dates.reduce((min, d) => (d < min ? d : min), dates[0]);
}

/** Minimal pure health from remaining available vs assigned (no worldEngine on this branch). */
function healthPctForDistrict(available: number, assigned: number, spent: number): number {
  if (assigned > 0) {
    return Math.max(0, Math.min(100, Math.round((available / assigned) * 100)));
  }
  return spent > 0 ? 0 : 100;
}

function stageForHealth(healthPct: number): TerraWorldViewStage {
  if (healthPct >= 80) return 'thriving';
  if (healthPct >= 55) return 'stable';
  if (healthPct >= 30) return 'strained';
  return 'wilting';
}

/**
 * Pure WareTrack-style selector: village money state → TerraWorldViewDTO (integer cents).
 */
export function buildTerraWorldViewDTO(input: TerraWorldViewInput): TerraWorldViewDTO {
  const {
    districts,
    transactions,
    allocations,
    currentMonth,
    locks = [],
    goals = [],
  } = input;

  const nowMs = resolveNow(input.now);
  const asOf = input.asOf ?? new Date(nowMs).toISOString();

  const grossReady = computeReadyToAssign(transactions, allocations);
  const lockedEuros = lockedTotal(locks, nowMs);
  const readyEuros = Math.max(0, grossReady - lockedEuros);

  const earliest = shiftMonth(earliestKnownMonth(transactions, allocations, currentMonth), -1);
  const playable = districts.filter((d) => !d.isCreditCard);

  const viewDistricts: TerraWorldViewDistrict[] = playable.map((district) => {
    const state = computeAllocationStateChain(
      district,
      allocations,
      transactions,
      currentMonth,
      earliest
    );
    const healthPct = healthPctForDistrict(state.available, state.allocated, state.spent);
    return {
      id: district.id,
      label: district.label,
      availableCents: eurosToCents(state.available),
      assignedCents: eurosToCents(state.allocated),
      spentCents: eurosToCents(state.spent),
      // Village locks are vault-scoped today; per-district lock cents stay 0.
      lockedCents: 0,
      healthPct,
      stage: stageForHealth(healthPct),
    };
  });

  const onTrackDistrictCount = viewDistricts.filter((d) => d.healthPct >= 55).length;

  const active = activeLocks(locks, nowMs);
  const pocketId: PocketId = 'vault';

  return {
    monthKey: currentMonth,
    asOf,
    // Gross unallocated pool (income − allocations); assignable is after locks.
    vaultCents: eurosToCents(Math.max(0, grossReady)),
    readyToAssignCents: eurosToCents(readyEuros),
    lockedTotalCents: eurosToCents(lockedEuros),
    districts: viewDistricts,
    goals: goals.map((g) => ({
      id: g.id,
      name: g.name,
      targetCents: eurosToCents(g.target),
      progressCents: eurosToCents(g.progress ?? 0),
    })),
    locks: active.map((lock) => ({
      id: lock.id,
      amountCents: eurosToCents(lock.amount),
      unlockAt: lock.unlockAt,
      pocketId,
    })),
    meta: { onTrackDistrictCount },
  };
}
