import { listAspsps, MOCK_ASPSPS, isEnableBankingConfigured, isMockMode, type Aspsp } from './enableBanking';

/** Canonical institution for Ali’s Sparkasse Saarbrücken one-button connect. */
export const SPARKASSE_SAARBRUCKEN = {
  country: 'DE',
  /** Fallback ASPSP name if live list is unavailable */
  preferredName: 'Sparkasse Saarbrücken',
  searchTokens: ['saarbrücken', 'saarbruecken', 'saarbruck', 'saarbrück'],
  bicHints: ['SAKSDE55', 'SAKSDE55XXX'],
} as const;

function matchesSaarbrucken(a: Aspsp): boolean {
  const name = a.name.toLowerCase();
  const bic = (a.bic ?? '').toUpperCase();
  if (SPARKASSE_SAARBRUCKEN.bicHints.some((b) => bic.includes(b))) return true;
  if (!name.includes('sparkasse')) return false;
  return SPARKASSE_SAARBRUCKEN.searchTokens.some((t) => name.includes(t));
}

/**
 * Resolve the Enable Banking ASPSP entry for Sparkasse Saarbrücken.
 * Prefers live /aspsps; falls back to preferred name in mock mode.
 */
export async function resolveSparkasseSaarbrucken(): Promise<{
  institutionId: string;
  institutionName: string;
  country: string;
  bic: string | null;
  mock: boolean;
}> {
  const mockOnly = isMockMode() && !isEnableBankingConfigured();
  if (mockOnly) {
    const hit =
      MOCK_ASPSPS.find(matchesSaarbrucken) ??
      ({
        name: SPARKASSE_SAARBRUCKEN.preferredName,
        country: SPARKASSE_SAARBRUCKEN.country,
        bic: 'SAKSDE55XXX',
      } satisfies Aspsp);
    return {
      institutionId: `${hit.country}:${hit.name}`,
      institutionName: hit.name,
      country: hit.country,
      bic: hit.bic ?? null,
      mock: true,
    };
  }

  const aspsps = await listAspsps(SPARKASSE_SAARBRUCKEN.country);
  const hit =
    aspsps.find(matchesSaarbrucken) ??
    aspsps.find((a) => /sparkasse/i.test(a.name) && /saar/i.test(a.name));

  if (!hit) {
    // Still attempt with preferred name — Enable Banking auth will validate
    return {
      institutionId: `${SPARKASSE_SAARBRUCKEN.country}:${SPARKASSE_SAARBRUCKEN.preferredName}`,
      institutionName: SPARKASSE_SAARBRUCKEN.preferredName,
      country: SPARKASSE_SAARBRUCKEN.country,
      bic: 'SAKSDE55XXX',
      mock: false,
    };
  }

  return {
    institutionId: `${hit.country}:${hit.name}`,
    institutionName: hit.name,
    country: hit.country,
    bic: hit.bic ?? null,
    mock: false,
  };
}
