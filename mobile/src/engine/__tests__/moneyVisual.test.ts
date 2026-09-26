import { visualPieces, vaultFill, heroPiece } from '../moneyVisual';

describe('visualPieces', () => {
  it('turns 100 into a single 100 note', () => {
    expect(visualPieces(100)).toEqual([{ kind: 'note', value: 100 }]);
  });

  it('caps the number of on-screen pieces', () => {
    expect(visualPieces(10000, 3).length).toBeLessThanOrEqual(3);
  });

  it('returns nothing for empty amounts', () => {
    expect(visualPieces(0)).toEqual([]);
  });
});

describe('vaultFill', () => {
  it('is 0 when empty and grows slowly', () => {
    expect(vaultFill(0)).toBe(0);
    expect(vaultFill(100)).toBeGreaterThan(0);
    expect(vaultFill(100)).toBeLessThan(vaultFill(1000));
    expect(vaultFill(1_000_000)).toBeLessThanOrEqual(1);
  });
});

describe('heroPiece', () => {
  it('picks a 100 note for a 100 euro add', () => {
    expect(heroPiece(100)).toEqual({ kind: 'note', value: 100 });
  });
});
