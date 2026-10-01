import { formatDots, formatEuro } from '../money';

describe('money formatting', () => {
  it('groups thousands with full stops', () => {
    expect(formatDots(1131120)).toBe('1.131.120');
    expect(formatDots(4251000)).toBe('4.251.000');
    expect(formatDots(42)).toBe('42');
  });

  it('formats euro amounts with dotted thousands', () => {
    expect(formatEuro(1131120, { cents: false })).toBe('€1.131.120');
    expect(formatEuro(1234.5)).toBe('€1.234,50');
    expect(formatEuro(-40, { cents: false })).toBe('-€40');
  });
});
