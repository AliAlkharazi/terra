export type DistrictId =
  | 'dining'
  | 'groceries'
  | 'transport'
  | 'property'
  | 'bills'
  | 'credit_card_payment';

export type TargetType = 'MONTHLY_NEEDED' | 'SAVINGS_BALANCE' | 'TARGET_BY_DATE';

export interface DistrictTarget {
  targetAmount: number;
  targetType: TargetType;
  targetDate?: string; // ISO date, only used for TARGET_BY_DATE
}

export interface District {
  id: DistrictId;
  label: string;
  icon: string;
  monthlyBudget: number; // default/suggested assign amount when funding a new month
  isCreditCard?: boolean; // true only for the auto-created Credit Card Payment category
  target?: DistrictTarget;
}

export type TransactionKind = 'spend' | 'income';

export type PocketId = 'vault' | DistrictId;

export type ActivityKind = 'deposit' | 'move';

export interface ActivityItem {
  id: string;
  date: string;
  kind: ActivityKind;
  amount: number;
  fromId?: PocketId;
  toId?: PocketId;
  note: string;
}

export interface MoneyLock {
  id: string;
  amount: number;
  days: number;
  createdAt: string;
  unlockAt: string;
}

export interface Transaction {
  id: string;
  districtId: DistrictId;
  amount: number;
  note: string;
  date: string;
  kind: TransactionKind;
  isCreditCard?: boolean; // only meaningful when kind === 'spend'
}

export interface Allocation {
  districtId: DistrictId;
  month: string; // YYYY-MM
  amount: number;
}

export interface BankState {
  totalSaved: number;
  floors: number;
}

export interface AllocationState {
  districtId: DistrictId;
  allocated: number; // this month's assignment
  rolloverFromPrevious: number; // previous month's available (can be negative)
  spent: number;
  available: number; // allocated + rolloverFromPrevious - spent
  isOverspent: boolean;
  target?: DistrictTarget;
  targetProgressPct: number | null; // null if no target set
  requiredMonthlyFunding: number | null; // null if no target set
}
