/**
 * Clash-style village buildings: place for a minimum cost, then level up by funding.
 */

/** Minimum euros from the vault to place (open) a building. */
export const BUILD_COST_MIN = 10;

/**
 * Funded amount thresholds for levels 1…n.
 * Level 0 = not placed / empty plot.
 */
export const LEVEL_THRESHOLDS = [10, 50, 150, 400, 1000] as const;

export function buildingLevel(funded: number): number {
  const amount = Math.max(0, funded);
  let level = 0;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (amount >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return level;
}

export function nextLevelThreshold(funded: number): number | null {
  const level = buildingLevel(funded);
  if (level >= LEVEL_THRESHOLDS.length) return null;
  return LEVEL_THRESHOLDS[level];
}

export function upgradeProgress(funded: number): {
  level: number;
  nextAt: number | null;
  towardNext: number;
  needed: number;
  pct: number;
} {
  const level = buildingLevel(funded);
  const nextAt = nextLevelThreshold(funded);
  if (nextAt == null) {
    return { level, nextAt: null, towardNext: 0, needed: 0, pct: 1 };
  }
  const prev = level === 0 ? 0 : LEVEL_THRESHOLDS[level - 1];
  const span = nextAt - prev;
  const towardNext = Math.max(0, funded - prev);
  const needed = Math.max(0, nextAt - funded);
  const pct = span <= 0 ? 1 : Math.min(1, towardNext / span);
  return { level, nextAt, towardNext, needed, pct };
}
