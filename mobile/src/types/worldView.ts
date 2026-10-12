import type { DistrictId, PocketId } from './index';

/** Visual growth stage for a district in the strategy-game world view. */
export type TerraWorldViewStage =
  | 'thriving'
  | 'stable'
  | 'strained'
  | 'wilting'
  | (string & {});

export interface TerraWorldViewDistrict {
  id: DistrictId;
  label: string;
  availableCents: number;
  assignedCents: number;
  spentCents: number;
  lockedCents: number;
  /** 0–100; computed upstream by the selector, not in the scene. */
  healthPct: number;
  stage: TerraWorldViewStage;
}

export interface TerraWorldViewGoal {
  id: string;
  name: string;
  targetCents: number;
  progressCents: number;
}

export interface TerraWorldViewLock {
  id: string;
  amountCents: number;
  unlockAt: string;
  pocketId: PocketId;
}

export type TerraWorldViewMeta = {
  onTrackDistrictCount: number;
};

/**
 * WareTrack-style view-model for Terra’s strategy-game world.
 * Money amounts are integer cents. Pure data — no React / Three.js.
 */
export type TerraWorldViewDTO = {
  monthKey: string;
  asOf: string;
  vaultCents: number;
  readyToAssignCents: number;
  lockedTotalCents: number;
  districts: TerraWorldViewDistrict[];
  goals: TerraWorldViewGoal[];
  locks: TerraWorldViewLock[];
  meta?: TerraWorldViewMeta;
};
