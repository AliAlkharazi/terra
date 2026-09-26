/**
 * Display helpers for the district spend estimate.
 * Cents from the API become euros (cents / 100). No FX conversion.
 */

export function formatEuroFromCents(cents: number): string {
  const negative = cents < 0;
  const abs = Math.abs(cents) / 100;
  return `${negative ? '-' : ''}€${abs.toFixed(2)}`;
}

export function isVisibleForecast<T>(forecast: T | null | undefined): forecast is T {
  return forecast != null;
}

export function forecastBasisLabel(forecast: { basedOnMonths: number; horizonMonths: number }): string {
  const monthWord = forecast.basedOnMonths === 1 ? 'month' : 'months';
  return `Based on ${forecast.basedOnMonths} ${monthWord} / horizon ${forecast.horizonMonths}`;
}

/** Null when either bound is missing — N < 3 omits the band entirely. */
export function forecastBandLabel(forecast: {
  bandLowCents?: number;
  bandHighCents?: number;
}): string | null {
  if (typeof forecast.bandLowCents !== 'number' || typeof forecast.bandHighCents !== 'number') {
    return null;
  }
  return `${formatEuroFromCents(forecast.bandLowCents)}–${formatEuroFromCents(forecast.bandHighCents)}`;
}

export function forecastChipLabel(cents: number): string {
  return `Est. ${formatEuroFromCents(cents)}`;
}
