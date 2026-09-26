import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dollarsToCents, forecastDistrictSpend, withDistrictForecasts, type DistrictForecast, type SpendPoint } from './forecast';

/** September 2026 is the incomplete current month for every fixture. */
const AS_OF = new Date('2026-09-26T15:00:00.000Z');
const DISTRICT_ID = 'b7e1c2a0-4f3d-4a1e-9c2b-1a2b3c4d5e6f';

interface FixtureTx {
  amount: number;
  date: string;
}

const ONLY_CURRENT_MONTH: FixtureTx[] = [{ amount: 80, date: '2026-09-10T12:00:00.000Z' }];

const ONLY_FUTURE_MONTH: FixtureTx[] = [{ amount: 80, date: '2026-11-02T12:00:00.000Z' }];

/** One complete month, two spends. 10.10 + 10.20 dollars = 2030 cents. */
const N1: FixtureTx[] = [
  { amount: 10.1, date: '2026-08-02T12:00:00.000Z' },
  { amount: 10.2, date: '2026-08-20T12:00:00.000Z' },
];

/** July $10 + August $30 = 1000 and 3000 cents. Mean 2000. */
const N2: FixtureTx[] = [
  { amount: 10, date: '2026-07-15T12:00:00.000Z' },
  { amount: 30, date: '2026-08-15T12:00:00.000Z' },
];

/**
 * May is complete but outside the window.
 * Last three: June $20, July $30, August $40 → 2000, 3000, 4000 cents. Mean 3000.
 */
const N4: FixtureTx[] = [
  { amount: 10, date: '2026-05-15T12:00:00.000Z' },
  { amount: 20, date: '2026-06-15T12:00:00.000Z' },
  { amount: 30, date: '2026-07-15T12:00:00.000Z' },
  { amount: 40, date: '2026-08-15T12:00:00.000Z' },
];

/** 100, 200, 300 cents. Mean 200. Sample σ = 100. */
const N3_BAND: FixtureTx[] = [
  { amount: 1, date: '2026-06-15T12:00:00.000Z' },
  { amount: 2, date: '2026-07-15T12:00:00.000Z' },
  { amount: 3, date: '2026-08-15T12:00:00.000Z' },
];

/** Five complete months of $10 each. Horizon stays 3; older months stay out of the mean. */
const N5: FixtureTx[] = [
  { amount: 10, date: '2026-04-15T12:00:00.000Z' },
  { amount: 10, date: '2026-05-15T12:00:00.000Z' },
  { amount: 20, date: '2026-06-15T12:00:00.000Z' },
  { amount: 30, date: '2026-07-15T12:00:00.000Z' },
  { amount: 40, date: '2026-08-15T12:00:00.000Z' },
];

function spend(fixtures: FixtureTx[]): SpendPoint[] {
  return fixtures.map((tx) => ({ amount: tx.amount, date: new Date(tx.date) }));
}

function forecast(fixtures: FixtureTx[], districtId = DISTRICT_ID): DistrictForecast | null {
  return forecastDistrictSpend(districtId, spend(fixtures), AS_OF);
}

function assertIntegerCents(value: number) {
  assert.equal(Number.isInteger(value), true);
}

describe('dollarsToCents', () => {
  it('recovers cents from two-decimal dollar floats', () => {
    assert.equal(dollarsToCents(19.99), 1999);
    assert.equal(dollarsToCents(1.15), 115);
    assert.equal(dollarsToCents(10.2), 1020);
    assert.equal(dollarsToCents(0.29), 29);
    assert.equal(dollarsToCents(0.1 + 0.2), 30);
    assert.equal(dollarsToCents(0), 0);
    assert.equal(dollarsToCents(-12.34), -1234);
  });
});

describe('F1 N=0 omits the forecast', () => {
  it('returns null when there are no transactions', () => {
    assert.equal(forecast([]), null);
  });

  it('returns null when the only spend is in the incomplete current month', () => {
    assert.equal(forecast(ONLY_CURRENT_MONTH), null);
  });

  it('returns null when the only spend is in a future month', () => {
    assert.equal(forecast(ONLY_FUTURE_MONTH), null);
  });
});

describe('F2 N=1 uses that month', () => {
  it('sets horizon 1, basedOnMonths 1, and the month total in cents', () => {
    const result = forecast(N1);
    assert.deepEqual(result, {
      districtId: DISTRICT_ID,
      predictedNextMonthCents: 2030,
      horizonMonths: 1,
      basedOnMonths: 1,
    });
    assertIntegerCents(result!.predictedNextMonthCents);
  });
});

describe('F3 N=2 averages both complete months', () => {
  it('sets horizon 2 and basedOnMonths 2', () => {
    const result = forecast(N2);
    assert.ok(result);
    assert.equal(result.horizonMonths, 2);
    assert.equal(result.basedOnMonths, 2);
    assert.equal(result.predictedNextMonthCents, 2000);
    assert.equal(result.districtId, DISTRICT_ID);
    assertIntegerCents(result.predictedNextMonthCents);
    const json = JSON.parse(JSON.stringify(result)) as Record<string, unknown>;
    assert.equal(Object.hasOwn(json, 'bandLowCents'), false);
    assert.equal(Object.hasOwn(json, 'bandHighCents'), false);
  });

  it('rounds a .5 mean half-up toward +∞', () => {
    const up = forecast([
      { amount: 0.01, date: '2026-07-15T12:00:00.000Z' },
      { amount: 0.02, date: '2026-08-15T12:00:00.000Z' },
    ]);
    const down = forecast([
      { amount: -0.01, date: '2026-07-15T12:00:00.000Z' },
      { amount: -0.02, date: '2026-08-15T12:00:00.000Z' },
    ]);
    // +1.5 → 2. −1.5 → −1 (toward +∞). Half away from zero would make the negative case −2.
    assert.equal(up?.predictedNextMonthCents, 2);
    assert.equal(down?.predictedNextMonthCents, -1);
    assert.equal(up?.horizonMonths, 2);
    assert.equal(up?.basedOnMonths, 2);
  });
});

describe('F4 N>=3 averages the last 3 complete months', () => {
  it('uses horizon 3 and ignores complete months older than the window', () => {
    const result = forecast(N4);
    assert.ok(result);
    assert.equal(result.horizonMonths, 3);
    assert.equal(result.basedOnMonths, 3);
    assert.equal(result.predictedNextMonthCents, 3000);
    assert.equal(result.districtId, DISTRICT_ID);
    assertIntegerCents(result.predictedNextMonthCents);
  });

  it('keeps horizon 3 when N is greater than 3', () => {
    const result = forecast(N5);
    assert.ok(result);
    assert.equal(result.horizonMonths, 3);
    assert.equal(result.basedOnMonths, 3);
    assert.equal(result.predictedNextMonthCents, 3000);
  });

  it('does not treat gap months as zero-spend months', () => {
    // Jan, Mar, Jun, Aug. Last 3 totals are 300, 600, and 900 cents (mean 600).
    // Zero-filling July would pull the mean down to 500.
    const result = forecast([
      { amount: 1, date: '2026-01-15T12:00:00.000Z' },
      { amount: 3, date: '2026-03-15T12:00:00.000Z' },
      { amount: 6, date: '2026-06-15T12:00:00.000Z' },
      { amount: 9, date: '2026-08-15T12:00:00.000Z' },
    ]);
    assert.equal(result?.horizonMonths, 3);
    assert.equal(result?.basedOnMonths, 3);
    assert.equal(result?.predictedNextMonthCents, 600);
  });
});

describe('F5 incomplete current month does not change the prediction', () => {
  it('ignores spend on the first instant of the current month and later', () => {
    const closed = forecast([{ amount: 25, date: '2026-08-31T23:59:59.999Z' }]);
    const withOpenMonth = forecast([
      { amount: 25, date: '2026-08-31T23:59:59.999Z' },
      { amount: 400, date: '2026-09-01T00:00:00.000Z' },
      { amount: 900, date: '2026-09-26T15:00:00.000Z' },
    ]);
    assert.deepEqual(withOpenMonth, closed);
    assert.equal(closed?.predictedNextMonthCents, 2500);
  });

  it('keeps the N>=3 window stable when the current month is the largest', () => {
    const before = forecast(N4);
    const after = forecast([...N4, { amount: 500, date: '2026-09-12T12:00:00.000Z' }]);
    assert.deepEqual(after, before);
    assert.equal(after?.predictedNextMonthCents, 3000);
  });
});

describe('F6 band brackets the prediction only when N>=3', () => {
  it('omits band keys when N is 1 or 2', () => {
    for (const fixtures of [N1, N2]) {
      const json = JSON.parse(JSON.stringify(forecast(fixtures))) as Record<string, unknown>;
      assert.equal(Object.hasOwn(json, 'bandLowCents'), false);
      assert.equal(Object.hasOwn(json, 'bandHighCents'), false);
    }
  });

  it('sets mean ± sample σ for the last three months and brackets the prediction', () => {
    const result = forecast(N3_BAND);
    assert.ok(result);
    assert.equal(result.horizonMonths, 3);
    assert.equal(result.basedOnMonths, 3);
    assert.equal(result.predictedNextMonthCents, 200);
    // Squared deviations 10000 + 0 + 10000, sample variance 10000, σ = 100.
    // Population σ would be ~81.65 and must not be used.
    assert.equal(result.bandLowCents, 100);
    assert.equal(result.bandHighCents, 300);
    assert.ok(result.bandLowCents <= result.predictedNextMonthCents);
    assert.ok(result.predictedNextMonthCents <= result.bandHighCents);
    assertIntegerCents(result.bandLowCents);
    assertIntegerCents(result.bandHighCents);
  });

  it('bands the same last-three window when N is greater than 3', () => {
    const result = forecast(N4);
    assert.ok(result);
    assert.equal(result.bandLowCents, 2000);
    assert.equal(result.predictedNextMonthCents, 3000);
    assert.equal(result.bandHighCents, 4000);
    assert.ok(result.bandLowCents <= result.predictedNextMonthCents);
    assert.ok(result.predictedNextMonthCents <= result.bandHighCents);
  });

  it('collapses the band when the three months are equal', () => {
    const result = forecast([
      { amount: 5, date: '2026-06-15T12:00:00.000Z' },
      { amount: 5, date: '2026-07-15T12:00:00.000Z' },
      { amount: 5, date: '2026-08-15T12:00:00.000Z' },
    ]);
    assert.equal(result?.predictedNextMonthCents, 500);
    assert.equal(result?.bandLowCents, 500);
    assert.equal(result?.bandHighCents, 500);
  });
});

describe('months that count toward N', () => {
  it('counts a complete month whose spend nets to zero', () => {
    const result = forecast([
      { amount: 10, date: '2026-07-15T12:00:00.000Z' },
      { amount: 5, date: '2026-08-01T12:00:00.000Z' },
      { amount: -5, date: '2026-08-20T12:00:00.000Z' },
    ]);
    assert.equal(result?.horizonMonths, 2);
    assert.equal(result?.basedOnMonths, 2);
    assert.equal(result?.predictedNextMonthCents, 500);
  });
});

describe('withDistrictForecasts', () => {
  it('embeds null or a forecast per district without mixing transactions', () => {
    const dining = '11111111-1111-4111-8111-111111111111';
    const groceries = '22222222-2222-4222-8222-222222222222';
    const rows = withDistrictForecasts(
      [
        { id: dining, key: 'dining', monthlyBudget: 250 },
        { id: groceries, key: 'groceries', monthlyBudget: 350 },
      ],
      [
        { districtId: dining, amount: 10, date: new Date('2026-07-15T12:00:00.000Z') },
        { districtId: dining, amount: 30, date: new Date('2026-08-15T12:00:00.000Z') },
        { districtId: groceries, amount: 99, date: new Date('2026-09-02T12:00:00.000Z') },
      ],
      AS_OF,
    );

    assert.equal(rows[0].key, 'dining');
    assert.equal(rows[0].monthlyBudget, 250);
    assert.equal(rows[0].forecast?.districtId, dining);
    assert.equal(rows[0].forecast?.predictedNextMonthCents, 2000);
    assert.equal(rows[0].forecast?.horizonMonths, 2);
    assert.equal(rows[0].forecast?.basedOnMonths, 2);
    assert.equal(rows[1].forecast, null);
    assert.equal(JSON.parse(JSON.stringify(rows[1])).forecast, null);
  });
});
