/**
 * Heuristic next-month spend forecast for one district.
 *
 * Not a model: the mean of recent complete months, plus a sample-deviation
 * band once three complete months exist. No seasonality and no cross-user data.
 * Rules: docs/forecast/FORECAST_API_AC.md.
 *
 * Money
 * -----
 * `Transaction.amount` is a dollar Float (same unit as `monthlyBudget`:
 * 12.34 means $12.34). Forecast money fields are integer cents. Each amount
 * is converted with `dollarsToCents` before it is added, so binary error is
 * not summed in dollars. `19.99 * 100` is 1998.9999999999998 in IEEE-754;
 * `toFixed(2)` recovers 1999 cents for two-decimal dollar amounts.
 *
 * The rolling average is rounded half-up (toward +∞, `Math.round`):
 * 1.5 → 2 and −1.5 → −1. This is not banker's rounding.
 *
 * Months and N
 * ------------
 * Months are UTC `YYYY-MM`, matching the transactions list. A month is
 * complete only when it is strictly before the current UTC month, so the
 * in-progress month and any future-dated rows are excluded from N and from
 * the average. There is no `kind` column, so every transaction counts as
 * spend. N is the number of complete months with at least one transaction.
 * Months with no rows are not filled in as zero. A month whose amounts net
 * to zero still counts, because it has a spend transaction.
 *
 * Horizon and window
 * ------------------
 * N = 0 → no forecast (`null`). N = 1 → horizon 1. N = 2 → horizon 2.
 * N ≥ 3 → horizon 3. The average uses the last `horizonMonths` complete
 * months (all N when N is smaller). `basedOnMonths` is how many were averaged.
 *
 * Band (only when N ≥ 3)
 * ----------------------
 * Sample standard deviation of those same month totals (divide by
 * `basedOnMonths − 1`, not by N). `bandLowCents` / `bandHighCents` are
 * mean ∓ σ, rounded half-up, then clamped so
 * `bandLowCents ≤ predictedNextMonthCents ≤ bandHighCents`.
 * The keys are omitted when N < 3.
 *
 * `GET /districts` sets `forecast` to that object or to JSON `null`.
 * It does not omit the key.
 */

export interface SpendPoint {
  amount: number;
  date: Date;
}

export interface MonthlySpend {
  month: string;
  totalCents: number;
}

export interface DistrictForecast {
  districtId: string;
  predictedNextMonthCents: number;
  horizonMonths: 1 | 2 | 3;
  /** How many complete months were averaged. Always ≤ horizonMonths. */
  basedOnMonths: number;
  /** Present only when N ≥ 3. */
  bandLowCents?: number;
  bandHighCents?: number;
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

/** Complete UTC months that have at least one transaction, oldest first. */
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

export function forecastFromMonthlyTotals(districtId: string, months: MonthlySpend[]): DistrictForecast | null {
  const ordered = [...months].sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0));
  const n = ordered.length;
  if (n === 0) return null;

  const horizonMonths = horizonFor(n);
  const basedOnMonths = Math.min(n, horizonMonths);
  const window = ordered.slice(ordered.length - basedOnMonths);
  const values = window.map((month) => month.totalCents);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const predictedNextMonthCents = roundHalfUp(mean);

  const forecast: DistrictForecast = {
    districtId,
    predictedNextMonthCents,
    horizonMonths,
    basedOnMonths,
  };

  if (n >= 3) {
    const deviation = sampleStdDev(values, mean);
    forecast.bandLowCents = roundHalfUp(mean - deviation);
    forecast.bandHighCents = roundHalfUp(mean + deviation);
    if (forecast.bandLowCents > forecast.bandHighCents) {
      const swap = forecast.bandLowCents;
      forecast.bandLowCents = forecast.bandHighCents;
      forecast.bandHighCents = swap;
    }
    if (forecast.bandLowCents > predictedNextMonthCents) forecast.bandLowCents = predictedNextMonthCents;
    if (forecast.bandHighCents < predictedNextMonthCents) forecast.bandHighCents = predictedNextMonthCents;
  }

  return forecast;
}

export function forecastDistrictSpend(
  districtId: string,
  points: SpendPoint[],
  now: Date = new Date(),
): DistrictForecast | null {
  return forecastFromMonthlyTotals(districtId, aggregateCompleteMonths(points, now));
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
    forecast: forecastDistrictSpend(district.id, byDistrict.get(district.id) ?? [], now),
  }));
}

function horizonFor(n: number): 1 | 2 | 3 {
  if (n <= 1) return 1;
  if (n === 2) return 2;
  return 3;
}

/** Sample standard deviation of the averaged months (denominator k − 1). */
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

/** Half-up toward +∞. Not banker's rounding. */
function roundHalfUp(value: number): number {
  return Math.round(value);
}
