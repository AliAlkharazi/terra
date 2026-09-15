export type DistrictId =
  | 'dining'
  | 'groceries'
  | 'transport'
  | 'entertainment'
  | 'shopping'
  | 'subscriptions'
  | 'other';

export interface District {
  id: DistrictId;
  label: string;
  icon: string;
  monthlyBudget: number;
}

export type TransactionKind = 'spend' | 'save';

export interface Transaction {
  id: string;
  districtId: DistrictId;
  amount: number;
  note: string;
  date: string;
  kind: TransactionKind;
}

export interface BankState {
  totalSaved: number;
  floors: number;
}

export interface DistrictState {
  districtId: DistrictId;
  spent: number;
  budget: number;
  healthPct: number;
  stage: GrowthStage;
}

export type GrowthStage = 'thriving' | 'stable' | 'strained' | 'wilting';

export interface WorldSnapshot {
  month: string;
  totalBudget: number;
  totalSpent: number;
  overallHealthPct: number;
  season: Season;
  districts: DistrictState[];
}

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
