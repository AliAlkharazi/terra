import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  dollarsToCents,
  forecastDistrictSpend,
  monthKeyUTC,
  withDistrictForecasts,
  type SpendPoint,
} from './forecast';

const NOW = new Date('2026-09-26T15:00:00.000Z');

function point(amount: number, iso: string): SpendPoint {
  return { amount, date: new Date(iso) };
}

function utc(year: number, month: number, day = 15): string {
  return new Date(Date.UTC(year, month - 1, day)).toISOString();
}

/** Consecutive complete months ending August 2026. totals[0] is the oldest. Amounts are dollars. */
function history(totals: number[]): SpendPoint[] {
  const last = { year: 2026, month: 8 };
  return totals.map((amount, index) => {
    const offset = totals.length - 1 - index;
    const date = new Date(Date.UTC(last.year, last.month - 1 - offset, 15));
    return { amount, date };
  });
}

describe('dollarsToCents', () => {
  it('rounds two-decimal dollar floats that are not exact in binary', () => {
    assert.equal(dollarsToCents(19.99), 1999);
    assert.equal(dollarsToCents(1.15), 115);
    assert.equal(dollarsToCents(10.2), 1020);
    assert.equal(dollarsToCents(0.29), 29);
    assert.equal(dollarsToCents(0.1 + 0.2), 30);
    assert.equal(dollarsToCents(250), 25000);
    assert.equal(dollarsToCents(0), 0);
  });

  it('rounds half away from zero for negative amounts', () => {
    assert.equal(dollarsToCents(-12.34), -1234);
    assert.equal(dollarsToCents(-0.01), -1);
  });

  it('rejects non-finite amounts', () => {
    assert.throws(() => dollarsToCents(Number.NaN), /non-finite/);
    assert.throws(() => dollarsToCents(Number.POSITIVE_INFINITY), /non-finite/);
  });
});

describe('month buckets', () => {
  it('labels months in UTC', () => {
    assert.equal(monthKeyUTC(new Date('2026-09-01T00:00:00.000Z')), '2026-09');
    assert.equal(monthKeyUTC(new Date('2026-08-31T23:59:59.999Z')), '2026-08');
  });

  it('drops the current UTC month and anything later', () => {
    const forecast = forecastDistrictSpend(
      [
        point(10, '2026-08-31T23:59:59.999Z'),
        point(50, '2026-09-01T00:00:00.000Z'),
        point(80, '2026-10-04T00:00:00.000Z'),
      ],
      NOW,
    );
    assert.ok(forecast);
    assert.equal(forecast.predictedNextMonthCents, 1000);
    assert.deepEqual(forecast.basedOnMonths, { months: ['2026-08'], k: 1, n: 1 });
    assert.equal(forecast.horizonMonths, 1);
    assert.equal('lowCents' in forecast, false);
    assert.equal('highCents' in forecast, false);
  });

  it('sums every transaction in a complete month in cents', () => {
    const forecast = forecastDistrictSpend(
      [point(10.1, utc(2026, 8, 2)), point(10.2, utc(2026, 8, 20))],
      NOW,
    );
    assert.equal(forecast?.predictedNextMonthCents, 2030);
  });

  it('does not zero-fill months that have no transactions', () => {
    const forecast = forecastDistrictSpend(
      [point(1, utc(2026, 1)), point(3, utc(2026, 3)), point(6, utc(2026, 6))],
      NOW,
    );
    assert.ok(forecast);
    assert.equal(forecast.basedOnMonths.n, 3);
    assert.deepEqual(forecast.basedOnMonths.months, ['2026-01', '2026-03', '2026-06']);
    assert.equal(forecast.predictedNextMonthCents, 333);
  });

  it('counts a complete month whose amounts net to zero', () => {
    const forecast = forecastDistrictSpend(
      [point(10, utc(2026, 7)), point(5, utc(2026, 8, 1)), point(-5, utc(2026, 8, 20))],
      NOW,
    );
    assert.ok(forecast);
    assert.deepEqual(forecast.basedOnMonths, { months: ['2026-07', '2026-08'], k: 2, n: 2 });
    assert.equal(forecast.predictedNextMonthCents, 500);
  });
});

describe('forecastDistrictSpend', () => {
  it('returns null when no complete month has data', () => {
    assert.equal(forecastDistrictSpend([], NOW), null);
    assert.equal(forecastDistrictSpend([point(40, utc(2026, 9))], NOW), null);
    assert.equal(forecastDistrictSpend([point(40, utc(2026, 11))], NOW), null);
  });

  it('averages the only complete month when N is 1', () => {
    const forecast = forecastDistrictSpend([point(42.5, utc(2026, 4))], NOW);
    assert.deepEqual(forecast, {
      predictedNextMonthCents: 4250,
      horizonMonths: 1,
      basedOnMonths: { months: ['2026-04'], k: 1, n: 1 },
    });
  });

  it('rounds the mean half away from zero', () => {
    const up = forecastDistrictSpend([point(0.01, utc(2026, 7)), point(0.02, utc(2026, 8))], NOW);
    const down = forecastDistrictSpend([point(-0.01, utc(2026, 7)), point(-0.02, utc(2026, 8))], NOW);
    assert.equal(up?.predictedNextMonthCents, 2);
    assert.equal(down?.predictedNextMonthCents, -2);
    assert.equal(forecastDistrictSpend(history([1, 1, 1.01]), NOW)?.predictedNextMonthCents, 100);
    assert.equal(forecastDistrictSpend(history([1, 1, 1.02]), NOW)?.predictedNextMonthCents, 101);
  });

  it('uses only the last k = min(3, N) complete months', () => {
    const forecast = forecastDistrictSpend(history([1, 1, 1, 4]), NOW);
    assert.ok(forecast);
    assert.equal(forecast.basedOnMonths.n, 4);
    assert.equal(forecast.basedOnMonths.k, 3);
    assert.equal(forecast.predictedNextMonthCents, 200);
    assert.deepEqual(forecast.basedOnMonths.months, ['2026-06', '2026-07', '2026-08']);
  });

  it('sets horizon from N, not from k', () => {
    assert.equal(forecastDistrictSpend(history([1]), NOW)?.horizonMonths, 1);
    assert.equal(forecastDistrictSpend(history([1, 2]), NOW)?.horizonMonths, 1);
    assert.equal(forecastDistrictSpend(history([1, 2, 3]), NOW)?.horizonMonths, 2);
    assert.equal(forecastDistrictSpend(history([1, 2, 3, 4, 5]), NOW)?.horizonMonths, 2);
    assert.equal(forecastDistrictSpend(history([1, 2, 3, 4, 5, 6]), NOW)?.horizonMonths, 3);
    assert.equal(forecastDistrictSpend(history([1, 2, 3, 4, 5, 6, 7, 8]), NOW)?.horizonMonths, 3);
  });

  it('omits the band until N is at least 3', () => {
    const forecast = forecastDistrictSpend(history([4, 9]), NOW);
    assert.ok(forecast);
    const json = JSON.parse(JSON.stringify(forecast)) as Record<string, unknown>;
    assert.equal(json.horizonMonths, 1);
    assert.equal(Object.hasOwn(json, 'lowCents'), false);
    assert.equal(Object.hasOwn(json, 'highCents'), false);
  });

  it('uses the sample standard deviation of the 3-month window', () => {
    // 100, 200, 300 cents. Mean 200. Sum of squared deviations 20000.
    // Sample variance 20000 / 2 = 10000, sample sd 100.
    // Population sd would be sqrt(20000 / 3) ≈ 81.65, which must not be used.
    const forecast = forecastDistrictSpend(history([1, 2, 3]), NOW);
    assert.ok(forecast);
    assert.equal(forecast.horizonMonths, 2);
    assert.equal(forecast.predictedNextMonthCents, 200);
    assert.equal(forecast.lowCents, 100);
    assert.equal(forecast.highCents, 300);
    assert.equal(forecast.basedOnMonths.k, 3);
    assert.equal(forecast.basedOnMonths.n, 3);
  });

  it('bands the last three months once N is at least 6', () => {
    const forecast = forecastDistrictSpend(history([1, 2, 3, 4, 5, 6]), NOW);
    assert.ok(forecast);
    assert.equal(forecast.horizonMonths, 3);
    assert.deepEqual(forecast.basedOnMonths.months, ['2026-06', '2026-07', '2026-08']);
    assert.equal(forecast.predictedNextMonthCents, 500);
    assert.equal(forecast.lowCents, 400);
    assert.equal(forecast.highCents, 600);
  });

  it('collapses the band when the window does not vary', () => {
    const forecast = forecastDistrictSpend(history([5, 5, 5]), NOW);
    assert.equal(forecast?.lowCents, 500);
    assert.equal(forecast?.highCents, 500);
    assert.equal(forecast?.predictedNextMonthCents, 500);
  });

  it('ignores an incomplete current month even when it is the largest', () => {
    const without = forecastDistrictSpend(history([4, 5, 6]), NOW);
    const withCurrent = forecastDistrictSpend([...history([4, 5, 6]), point(500, utc(2026, 9))], NOW);
    assert.deepEqual(withCurrent, without);
  });
});

describe('withDistrictForecasts', () => {
  it('attaches null when a district has no complete months and does not mix districts', () => {
    const districts = [
      { id: 'dining', key: 'dining', monthlyBudget: 250 },
      { id: 'transit', key: 'transport', monthlyBudget: 120 },
    ];
    const rows = withDistrictForecasts(
      districts,
      [
        { districtId: 'dining', amount: 12, date: new Date(utc(2026, 8)) },
        { districtId: 'dining', amount: 18, date: new Date(utc(2026, 7)) },
        { districtId: 'transit', amount: 99, date: new Date(utc(2026, 9)) },
      ],
      NOW,
    );

    assert.equal(rows[0].key, 'dining');
    assert.equal(rows[0].monthlyBudget, 250);
    assert.equal(rows[0].forecast?.predictedNextMonthCents, 1500);
    assert.equal(rows[0].forecast?.horizonMonths, 1);
    assert.equal(rows[1].forecast, null);
    assert.equal(JSON.parse(JSON.stringify(rows[1])).forecast, null);
  });
});
