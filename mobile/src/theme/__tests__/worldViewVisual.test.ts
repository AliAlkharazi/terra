import { worldViewBuildingStressed, worldViewPadColor } from '../worldViewVisual';

describe('worldViewPadColor', () => {
  it('matches scene.html palette endpoints for healthy vs depleted', () => {
    expect(worldViewPadColor(100).toLowerCase()).toBe('#3f6b46');
    expect(worldViewPadColor(0).toLowerCase()).toBe('#4a4038');
  });

  it('mid-band health differs from thriving and wilting', () => {
    const mid = worldViewPadColor(50).toLowerCase();
    expect(mid).not.toBe('#3f6b46');
    expect(mid).not.toBe('#4a4038');
  });
});

describe('worldViewBuildingStressed', () => {
  it('flags wilting health or negative available cents', () => {
    expect(worldViewBuildingStressed(12, 1800)).toBe(true);
    expect(worldViewBuildingStressed(92, -100)).toBe(true);
    expect(worldViewBuildingStressed(92, 15000)).toBe(false);
  });
});
