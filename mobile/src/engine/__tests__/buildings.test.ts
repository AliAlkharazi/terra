import { BUILD_COST_MIN, buildingLevel, nextLevelThreshold, upgradeProgress } from '../buildings';

describe('buildings', () => {
  it('requires €10 to open', () => {
    expect(BUILD_COST_MIN).toBe(10);
    expect(buildingLevel(0)).toBe(0);
    expect(buildingLevel(9.99)).toBe(0);
    expect(buildingLevel(10)).toBe(1);
  });

  it('levels up at funding thresholds', () => {
    expect(buildingLevel(50)).toBe(2);
    expect(buildingLevel(149)).toBe(2);
    expect(buildingLevel(150)).toBe(3);
    expect(buildingLevel(1000)).toBe(5);
  });

  it('reports progress to the next upgrade', () => {
    const p = upgradeProgress(30);
    expect(p.level).toBe(1);
    expect(p.nextAt).toBe(50);
    expect(p.needed).toBe(20);
    expect(p.pct).toBeCloseTo(0.5, 2);
    expect(nextLevelThreshold(1000)).toBeNull();
  });
});
