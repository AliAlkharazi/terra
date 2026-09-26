/**
 * Heuristic next-month spend forecast for a single district.
 *
 * Not a model: arithmetic mean of recent complete months, plus a sample
 * standard-deviation band once there is enough history. No seasonality,
 * no cross-user data.
 *
 * Money conversion
 * ---------------
 * `Transaction.amount` (and `District.monthlyBudget`) is a dollar Float:
 * 12.34 means twelve dollars and thirty-four cents. Forecast fields are
 * integer cents. Each amount is converted with `dollarsToCents` *before*
 * it is added to a month, so binary rounding error is not summed in dollars.
 *
 * `19.99 * 100` is 1998.9999999999998 in IEEE-754, which would drop a cent
 * if truncated. `dollarsToCents` first rounds to two decimal places with
 * `Number#toFixed(2)` (half away from zero), then reads the digits. That
 * recovers the cent for values that were two-decimal dollar amounts.
 * Inputs that are not finite throw. The mean and the ± band are rounded
 * half away from zero to the nearest cent.
 *
 * Months
 * ------
 * Months are UTC calendar months (`YYYY-MM`), matching the transactions
 * list filter. A month is complete only when it is strictly before the
 * current UTC month, so the in-progress month and any future-dated rows
 * are excluded. N is the number of complete months that contain at least
 * one transaction. A month with no rows is not filled in as zero; a month
 * whose amounts net to zero still counts, because it has data.
 *
 * The window is the last k = min(3, N) of those months (oldest first).
 * `predictedNextMonthCents` is their arithmetic mean.
 *
 * `horizonMonths` is 1 when N < 3, 2 when 3 ≤ N < 6, and 3 when N ≥ 6.
 * `lowCents` / `highCents` are mean ± sample standard deviation (divide by
 * k − 1, not k) of that same window, and are set only when N ≥ 3. When
 * the band is present, k is 3.
 *
 * N = 0
 * -----
 * No complete month has data, so there is no forecast. `forecastDistrictSpend`
 * returns null. `GET /districts` always includes the key and serializes
 * that as JSON `null` (it does not omit `forecast`).
 */

export interface SpendPoint {
  amount: number;
  date: Date;
}

export interface MonthlySpend {
  month: string;
  totalCents: number;
}

export interface BasedOnMonths {
  /** UTC `YYYY-MM` keys averaged, oldest first. Length is k. */
  months: string[];
  /** min(3, N). */
  k: number;
  /** Complete months with at least one transaction. */
  n: number;
}

export interface DistrictForecast {
  predictedNextMonthCents: number;
  horizonMonths: 1 | 2 | 3;
  basedOnMonths: BasedOnMonths;
  /** Present only when N ≥ 3. */
  lowCents?: number;
  highCents?: number;
}

export function dollarsToCents(amount: number): number {
  if (!Number.isFinite(amount)) {
    throw new Error(`Cannot convert non-finite amount to cents: ${amount}`);
  }
  const negative = amount < 0;
  const [whole, frac] = Math.abs(amount).toFixed(2).split('.');
  const cents = Number(whole) * 100 + Number(frac);
  return negative ? -cents : cents;
}

export function monthKeyUTC(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/** Complete UTC months that have transactions, oldest first. */
export function aggregateCompleteMonths(points: SpendPoint[], now: Date): MonthlySpend[] {
  const current = monthKeyUTC(now);
  const totals = new Map<string, number>();

  for (const point of points) {
    if (Number.isNaN(point.date.getTime())) continue;
    const month = monthKeyUTC(point.date);
    if (month >= current) continue;
    const cents = dollarsToCents(point.amount);
    totals.set(month, (totals.get(month) ?? 0) + cents);
  }

  return [...totals.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([month, totalCents]) => ({ month, totalCents }));
}

export function forecastFromMonthlyTotals(months: MonthlySpend[]): DistrictForecast | null {
  const ordered = [...months].sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0));
  const n = ordered.length;
  if (n === 0) return null;

  const k = Math.min(3, n);
  const window = ordered.slice(n - k);
  const values = window.map((month) => month.totalCents);
  const mean = values.reduce((sum, value) => sum + value, 0) / k;

  const forecast: DistrictForecast = {
    predictedNextMonthCents: roundHalfAwayFromZero(mean),
    horizonMonths: horizonFor(n),
    basedOnMonths: {
      months: window.map((month) => month.month),
      k,
      n,
    },
  };

  if (n >= 3) {
    const deviation = sampleStdDev(values, mean);
    forecast.lowCents = roundHalfAwayFromZero(mean - deviation);
    forecast.highCents = roundHalfAwayFromZero(mean + deviation);
  }

  return forecast;
}

export function forecastDistrictSpend(points: SpendPoint[], now: Date = new Date()): DistrictForecast | null {
  return forecastFromMonthlyTotals(aggregateCompleteMonths(points, now));
}

export function withDistrictForecasts<T extends { id: string }>(
  districts: T[],
  transactions: (SpendPoint & { districtId: string })[],
  now: Date = new Date(),
): (T & { forecast: DistrictForecast | null })[] {
  const byDistrict = new Map<string, SpendPoint[]>();
  for (const tx of transactions) {
    const points = byDistrict.get(tx.districtId);
    const point = { amount: tx.amount, date: tx.date };
    if (points) points.push(point);
    else byDistrict.set(tx.districtId, [point]);
  }

  return districts.map((district) => ({
    ...district,
    forecast: forecastDistrictSpend(byDistrict.get(district.id) ?? [], now),
  }));
}

function horizonFor(n: number): 1 | 2 | 3 {
  if (n < 3) return 1;
  if (n < 6) return 2;
  return 3;
}

/** Sample standard deviation (denominator k − 1). */
function sampleStdDev(values: number[], mean: number): number {
  if (values.length < 2) {
    throw new Error('Sample standard deviation needs at least two months');
  }
  let sumSq = 0;
  for (const value of values) {
    const delta = value - mean;
    sumSq += delta * delta;
  }
  return Math.sqrt(sumSq / (values.length - 1));
}

function roundHalfAwayFromZero(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value));
}
