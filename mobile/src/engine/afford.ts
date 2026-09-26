import type { AllocationState, District, DistrictId, Transaction } from '@/types';
import type { MemoryPurchase } from '@/data/seedPurchases';
import { guessFamily, parseWant } from './wantParse';
import { computeInsights } from './insights';
import type { MarketEstimate } from './marketPrice';

export type AffordAnswer = 'yes' | 'no' | 'ask';

export type AffordVerdict = {
  answer: AffordAnswer;
  line: string;
  item: string;
  price: number | null;
  similarCount: number;
  typical: number | null;
  freeCash: number;
  priceSource: 'spoken' | 'history' | 'market' | 'family' | null;
  marketLabel: string | null;
};

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round(((s[mid - 1] + s[mid]) / 2) * 100) / 100;
}

function tokens(item: string): string[] {
  return item
    .toLowerCase()
    .split(/[^a-zäöüß0-9]+/)
    .filter((w) => w.length > 2);
}

export function similarPurchases(item: string, memory: MemoryPurchase[]): MemoryPurchase[] {
  const family = guessFamily(item);
  const itemTok = new Set(tokens(item));
  return memory.filter((row) => {
    if (family && guessFamily(row.item)?.key === family.key) return true;
    const rowTok = tokens(row.item);
    return rowTok.some((t) => itemTok.has(t));
  });
}

function monthlySpend(memory: MemoryPurchase[], month: string): number {
  return memory.filter((p) => p.date.startsWith(month)).reduce((sum, p) => sum + p.amount, 0);
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function euro(n: number): string {
  return `€${Math.round(n).toLocaleString('de-DE')}`;
}

export function liveToMemory(transactions: Transaction[]): MemoryPurchase[] {
  return transactions
    .filter((t) => t.kind === 'spend' && t.amount > 0)
    .map((t) => ({
      id: t.id,
      date: t.date,
      item: t.note.trim() || t.districtId,
      amount: t.amount,
      districtId: t.districtId,
      source: 'live' as const,
    }));
}

export function computeAffordability(input: {
  sentence: string;
  memory: MemoryPurchase[];
  transactions: Transaction[];
  districts: District[];
  states: AllocationState[];
  vault: number;
  month: string;
  asOf?: Date;
  market?: MarketEstimate | null;
}): AffordVerdict {
  const { item, amount: spokenPrice } = parseWant(input.sentence);
  const ledger = liveToMemory(input.transactions);
  const ledgerIds = new Set(ledger.map((row) => row.id));
  const ledgerHasHistory = ledger.some((row) => row.date.slice(0, 7) < input.month);
  const corpus = [
    ...input.memory.filter((row) => !ledgerIds.has(row.id) && !(ledgerHasHistory && row.source === 'seed')),
    ...ledger,
  ];
  const matches = item ? similarPurchases(item, corpus) : [];
  const typical = median(matches.map((m) => m.amount));
  const family = guessFamily(item);
  const market = input.market ?? null;

  let price: number | null = null;
  let priceSource: AffordVerdict['priceSource'] = null;
  if (spokenPrice != null) {
    price = spokenPrice;
    priceSource = 'spoken';
  } else if (typical != null) {
    price = typical;
    priceSource = 'history';
  } else if (market != null) {
    price = market.price;
    priceSource = 'market';
  } else if (family != null) {
    price = family.prior;
    priceSource = 'family';
  }

  const insights = computeInsights({
    districts: input.districts,
    states: input.states,
    transactions: input.transactions,
    vault: input.vault,
    month: input.month,
    asOf: input.asOf,
  });

  const mapped = family?.districtId;
  const mappedAvail = mapped ? Math.max(0, input.states.find((s) => s.districtId === mapped)?.available ?? 0) : 0;
  const wantsIds: DistrictId[] = ['dining', 'groceries', 'transport'];
  const wantsCash = input.states
    .filter((s) => wantsIds.includes(s.districtId))
    .reduce((sum, s) => sum + Math.max(0, s.available), 0);
  // Do not count rent / bills money as free cash for large market buys.
  const freeCash =
    priceSource === 'market' && (market?.price ?? 0) >= 500
      ? Math.max(0, input.vault)
      : Math.max(0, input.vault) + (mapped ? mappedAvail : wantsCash);

  const empty = (line: string, answer: AffordAnswer = 'ask'): AffordVerdict => ({
    answer,
    line,
    item: item === 'this' ? '' : item,
    price,
    similarCount: matches.length,
    typical,
    freeCash,
    priceSource,
    marketLabel: market?.label ?? null,
  });

  if (!item || item === 'this') {
    return empty('Tell me what you want to buy.');
  }

  if (price == null) {
    return empty(`I don’t know what ${item} costs yet.`);
  }

  const prev = shiftMonth(input.month, -1);
  const prev2 = shiftMonth(input.month, -2);
  const spendNow = monthlySpend(corpus, input.month);
  const spendPrev = monthlySpend(corpus, prev);
  const spendPrev2 = monthlySpend(corpus, prev2);
  const rising = spendPrev > 0 && spendNow > spendPrev * 1.15 && spendPrev >= spendPrev2;

  const remainingDays = Math.max(0, insights.daysInMonth - insights.dayOfMonth);
  const liquid = insights.vault + insights.inTown;
  const dailyBurn = insights.dayOfMonth > 0 ? insights.spentThisMonth / insights.dayOfMonth : 0;
  const runwayAfter = dailyBurn > 0.01 ? (liquid - price) / dailyBurn : null;
  const tightRunway = runwayAfter != null && remainingDays > 0 && runwayAfter < remainingDays * 0.45;
  const richerThanUsual = typical != null && price > typical * 1.75;
  const overspent = insights.overspentCount > 0;
  const name = market?.label ?? item;

  let answer: AffordAnswer = 'yes';
  if (price > freeCash + 0.001) answer = 'no';
  else if (overspent && price > insights.vault + 0.001) answer = 'no';
  else if (tightRunway) answer = 'no';
  else if (rising && richerThanUsual) answer = 'no';
  else if (richerThanUsual && freeCash - price < 25) answer = 'no';

  let line: string;
  if (answer === 'yes') {
    line =
      priceSource === 'market'
        ? `Yes. ${name} is about ${euro(price)}. You have ${euro(freeCash)} free, so it fits.`
        : matches.length > 0
          ? `Yes. ${name} around ${euro(price)} is fine. You still have ${euro(freeCash - price)} free.`
          : `Yes. You have ${euro(freeCash)} free, so ${euro(price)} works.`;
  } else if (price > freeCash + 0.001) {
    line =
      priceSource === 'market'
        ? `No. ${name} is about ${euro(price)}, and you only have ${euro(freeCash)} free.`
        : `No. ${name} is ${euro(price)} and you only have ${euro(freeCash)} free.`;
  } else if (tightRunway) {
    line = `No. After ${name}, the town would run out before month-end.`;
  } else if (overspent) {
    line = `No. Cover the overspend first, then buy ${name}.`;
  } else if (richerThanUsual) {
    line = `No. You usually pay ${euro(typical ?? price)} for this. ${euro(price)} is too high right now.`;
  } else {
    line = `No. Skip ${name} this month.`;
  }

  return {
    answer,
    line,
    item,
    price,
    similarCount: matches.length,
    typical,
    freeCash,
    priceSource,
    marketLabel: market?.label ?? null,
  };
}
