/** Group thousands with full stops: 1131120 → "1.131.120" */
export function formatDots(amount: number): string {
  const n = Math.round(Math.abs(amount));
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatEuro(amount: number, opts?: { cents?: boolean }): string {
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  if (opts?.cents === false) {
    return `${sign}€${formatDots(abs)}`;
  }
  const [whole, cents] = abs.toFixed(2).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}€${grouped},${cents}`;
}
