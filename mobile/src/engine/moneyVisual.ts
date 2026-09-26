export type MoneyPiece = {
  kind: 'note' | 'coin';
  value: 1 | 2 | 5 | 10 | 20 | 50 | 100;
};

const NOTES: MoneyPiece['value'][] = [100, 50, 20, 10, 5];

export function visualPieces(amount: number, maxPieces = 5): MoneyPiece[] {
  let rest = Math.max(0, Math.round(amount));
  if (rest <= 0) return [];

  const pieces: MoneyPiece[] = [];
  for (const value of NOTES) {
    while (rest >= value && pieces.length < maxPieces) {
      pieces.push({ kind: 'note', value });
      rest -= value;
    }
  }

  if (rest > 0 && pieces.length < maxPieces) {
    if (rest >= 5) pieces.push({ kind: 'note', value: 5 });
    else pieces.push({ kind: 'coin', value: rest >= 2 ? 2 : 1 });
  }

  return pieces;
}

export function vaultFill(amount: number): number {
  const safe = Math.max(0, amount);
  if (safe <= 0) return 0;
  return Math.min(1, Math.log10(1 + safe) / Math.log10(1 + 5000));
}

export function heroPiece(amount: number): MoneyPiece {
  const pieces = visualPieces(amount, 1);
  return pieces[0] ?? { kind: 'note', value: 100 };
}
