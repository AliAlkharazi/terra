import { useBudgetStore } from '../budgetStore';

const initialState = useBudgetStore.getState();

beforeEach(() => {
  useBudgetStore.setState(initialState, true);
});

describe('coverOverspend', () => {
  it('caps the transfer to what the source category actually has available', () => {
    const store = useBudgetStore.getState();
    const month = store.currentMonth;

    store.logIncome(50, 'seed');
    store.assignToDistrict('groceries', month, 30);
    store.assignToDistrict('bills', month, 20);
    store.addTransaction({ districtId: 'bills', amount: 100, note: 'concert', date: `${month}-15T00:00:00.000Z` });

    store.coverOverspend('groceries', 'bills', month, 80);

    const groceries = useBudgetStore.getState().getAllocationState('groceries');
    const bills = useBudgetStore.getState().getAllocationState('bills');

    expect(groceries.available).toBe(0);
    expect(groceries.isOverspent).toBe(false);
    expect(bills.available).toBe(-50); // improved by only the 30 that existed
  });

  it('does nothing if the source category has no funds available', () => {
    const store = useBudgetStore.getState();
    const month = store.currentMonth;

    store.addTransaction({ districtId: 'bills', amount: 50, note: '', date: `${month}-10T00:00:00.000Z` });
    const before = useBudgetStore.getState().getAllocationState('bills').available;

    store.coverOverspend('dining', 'bills', month, 50);

    const after = useBudgetStore.getState().getAllocationState('bills').available;
    expect(after).toBe(before);
  });

  it('moves the full amount when the source genuinely has enough', () => {
    const store = useBudgetStore.getState();
    const month = store.currentMonth;

    store.logIncome(210, 'seed');
    store.assignToDistrict('groceries', month, 200);
    store.assignToDistrict('property', month, 10);
    store.addTransaction({ districtId: 'property', amount: 40, note: '', date: `${month}-10T00:00:00.000Z` });

    store.coverOverspend('groceries', 'property', month, 30);

    const groceries = useBudgetStore.getState().getAllocationState('groceries');
    const property = useBudgetStore.getState().getAllocationState('property');
    expect(groceries.available).toBe(170);
    expect(property.available).toBe(0);
    expect(property.isOverspent).toBe(false);
  });
});

describe('assignToDistrict', () => {
  it('caps assignment so the vault cannot go negative', () => {
    const store = useBudgetStore.getState();
    const month = store.currentMonth;

    store.logIncome(100, 'salary');
    store.assignToDistrict('groceries', month, 150);

    expect(useBudgetStore.getState().getReadyToAssign()).toBe(0);
    expect(useBudgetStore.getState().getAllocationState('groceries').allocated).toBe(100);
  });

  it('addToDistrict adds only what the vault still holds', () => {
    const store = useBudgetStore.getState();
    const month = store.currentMonth;

    store.logIncome(40, 'tips');
    store.addToDistrict('dining', month, 10);
    store.addToDistrict('dining', month, 50);

    const dining = useBudgetStore.getState().getAllocationState('dining');
    expect(dining.allocated).toBe(40);
    expect(useBudgetStore.getState().getReadyToAssign()).toBe(0);
  });

  it('returns money to the vault when you lower a category', () => {
    const store = useBudgetStore.getState();
    const month = store.currentMonth;

    store.logIncome(80, 'pay');
    store.assignToDistrict('bills', month, 80);
    store.addToDistrict('bills', month, -30);

    expect(useBudgetStore.getState().getAllocationState('bills').allocated).toBe(50);
    expect(useBudgetStore.getState().getReadyToAssign()).toBe(30);
  });
});

describe('seedHistory', () => {
  it('adds three past months once, without leaving any building overspent', () => {
    const store = useBudgetStore.getState();
    store.seedHistory();
    const count = useBudgetStore.getState().transactions.length;
    useBudgetStore.getState().seedHistory();

    const after = useBudgetStore.getState();
    expect(count).toBeGreaterThan(60);
    expect(after.transactions).toHaveLength(count);
    expect(after.getAllAllocationStates().every((s) => !s.isOverspent)).toBe(true);
    expect(after.getReadyToAssign()).toBe(380);
  });
});

describe('lockMoney', () => {
  it('hides locked cash from the vault until the lock expires', () => {
    const store = useBudgetStore.getState();
    store.logIncome(100, 'pay');
    store.lockMoney(40, 7);

    const next = useBudgetStore.getState();
    expect(next.getReadyToAssign()).toBe(60);
    expect(next.locks).toHaveLength(1);
    expect(next.locks[0].days).toBe(7);
  });

  it('cannot lock more than the vault holds', () => {
    const store = useBudgetStore.getState();
    store.logIncome(20, 'pay');
    store.lockMoney(80, 1);
    expect(useBudgetStore.getState().getReadyToAssign()).toBe(0);
    expect(useBudgetStore.getState().locks[0].amount).toBe(20);
  });
});
