export function formatEuro(amount: number, opts?: { cents?: boolean }): string {
  const abs = Math.abs(amount);
  const body = opts?.cents === false ? abs.toFixed(0) : abs.toFixed(2);
  return `${amount < 0 ? '-' : ''}€${body}`;
}
