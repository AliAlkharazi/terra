import { parseWant } from '../wantParse';
import { computeAffordability } from '../afford';
import { SEED_PURCHASES } from '@/data/seedPurchases';
import type { AllocationState, District } from '@/types';

const districts: District[] = [
  { id: 'dining', label: 'Diner', icon: '', monthlyBudget: 250 },
  { id: 'groceries', label: 'Food', icon: '', monthlyBudget: 350 },
  { id: 'transport', label: 'Travel', icon: '', monthlyBudget: 120 },
  { id: 'property', label: 'Home', icon: '', monthlyBudget: 200 },
  { id: 'bills', label: 'Bills', icon: '', monthlyBudget: 80 },
];

function st(id: AllocationState['districtId'], available: number, spent = 0, allocated = available + spent): AllocationState {
  return {
    districtId: id,
    allocated,
    rolloverFromPrevious: 0,
    spent,
    available,
    isOverspent: available < 0,
    targetProgressPct: null,
    requiredMonthlyFunding: null,
  };
}

describe('parseWant', () => {
  it('reads a simple want and a euro amount', () => {
    expect(parseWant('I want to buy new shoes for 80 euros')).toEqual({ item: 'shoes', amount: 80 });
  });

  it('reads 90€ without the word for', () => {
    expect(parseWant('new shoes 90€')).toEqual({ item: 'shoes', amount: 90 });
  });

  it('leaves amount empty when none is said', () => {
    expect(parseWant('can I get new shoes')).toEqual({ item: 'shoes', amount: null });
  });
});

describe('computeAffordability', () => {
  const states = [
    st('dining', 40, 80, 120),
    st('groceries', 120, 40, 160),
    st('transport', 30, 10, 40),
    st('property', 200, 0, 200),
    st('bills', 80, 0, 80),
  ];

  it('says yes when similar history and enough free cash', () => {
    const v = computeAffordability({
      sentence: 'I want to buy new shoes',
      memory: SEED_PURCHASES,
      transactions: [],
      districts,
      states,
      vault: 100,
      month: '2026-09',
      asOf: new Date(2026, 8, 23),
    });
    expect(v.answer).toBe('yes');
    expect(v.price).toBeGreaterThan(70);
    expect(v.similarCount).toBeGreaterThan(0);
    expect(v.line.startsWith('Yes')).toBe(true);
  });

  it('says no when the price is bigger than free cash', () => {
    const v = computeAffordability({
      sentence: 'I want shoes for 500€',
      memory: SEED_PURCHASES,
      transactions: [],
      districts,
      states,
      vault: 10,
      month: '2026-09',
      asOf: new Date(2026, 8, 23),
    });
    expect(v.answer).toBe('no');
    expect(v.line.startsWith('No')).toBe(true);
  });

  it('asks for a price when it has no idea what the thing costs', () => {
    const v = computeAffordability({
      sentence: 'can I buy a quantum flux capacitor',
      memory: [],
      transactions: [],
      districts,
      states,
      vault: 50,
      month: '2026-09',
      asOf: new Date(2026, 8, 23),
    });
    expect(v.answer).toBe('ask');
  });

  it('uses a market estimate for a G-Class and says no when cash is tiny', () => {
    const v = computeAffordability({
      sentence: 'I want a G class',
      memory: [],
      transactions: [],
      districts,
      states,
      vault: 400,
      month: '2026-09',
      asOf: new Date(2026, 8, 23),
      market: {
        label: 'Mercedes G-Class',
        price: 145000,
        low: 120000,
        high: 250000,
        note: 'new entry',
        source: 'catalog',
      },
    });
    expect(v.answer).toBe('no');
    expect(v.price).toBe(145000);
    expect(v.priceSource).toBe('market');
    expect(v.line).toContain('145.000');
    expect(v.line).toContain('Mercedes G-Class');
  });
});
