import { lookupCatalogPrice } from '../marketPrice';

describe('lookupCatalogPrice', () => {
  it('knows a Mercedes G-Class', () => {
    const hit = lookupCatalogPrice('g class');
    expect(hit?.label).toBe('Mercedes G-Class');
    expect(hit?.price).toBe(145000);
  });

  it('knows an iPhone', () => {
    expect(lookupCatalogPrice('iphone')?.price).toBeGreaterThan(500);
  });

  it('returns null for nonsense', () => {
    expect(lookupCatalogPrice('quantum flux capacitor')).toBeNull();
  });
});
