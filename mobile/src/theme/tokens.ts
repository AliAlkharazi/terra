/**
 * Terra design tokens — single source for spacing, type, color, radius.
 * Prefer these over raw numbers in StyleSheets.
 */
export const colors = {
  moss900: '#12201A',
  moss800: '#1B2E24',
  moss700: '#26402F',
  moss600: '#33543E',

  ember600: '#C97F2E',
  ember500: '#E8A24B',
  ember400: '#EDB16B',

  sage500: '#8FA891',
  sage300: '#B9CBB9',

  parchment: '#F0EAD6',
  parchmentDim: '#E4DCC4',
  /** Light list / card surface on parchment screens */
  cream: '#EDE8DC',
  /** Slightly lifted cream for inputs / chips */
  creamLift: '#F4F1EA',

  coral500: '#D96C5F',
  gold500: '#D4B25A',
  inkGold: '#F4E6A8',

  textOnMoss: '#F0EAD6',
  textOnMossDim: '#B9CBB9',
  textOnParchment: '#1B2E24',
  textOnParchmentDim: '#5A6B5D',

  /** Sparkasse brand accent (bank screens only) */
  sparkasse: '#E30613',

  glass: 'rgba(240,234,214,0.08)',
  glassStrong: 'rgba(240,234,214,0.12)',
  glassInk: 'rgba(18,40,26,0.55)',
  /** Soft gold wash for highlight cards (insights / freeze chips) */
  goldWash: 'rgba(232,196,90,0.12)',
  goldBorder: 'rgba(232,196,90,0.32)',
  dimOnMoss: 'rgba(240,234,214,0.35)',
  dockBg: 'rgba(12, 18, 14, 0.72)',
  backdrop: 'rgba(12,18,14,0.45)',
  hairline: 'rgba(240,234,214,0.14)',
  sunGlow: 'rgba(232, 176, 72, 0.18)',
} as const;

export const type = {
  display: 'Baloo2_700Bold',
  displayMedium: 'Baloo2_600SemiBold',
  body: 'Manrope_500Medium',
  bodyBold: 'Manrope_700Bold',
  mono: 'Manrope_600SemiBold',

  size: {
    xs: 12,
    sm: 14,
    base: 16,
    md: 18,
    lg: 20,
    xl: 26,
    xxl: 34,
    display: 44,
  },
  line: {
    tight: 1.15,
    snug: 1.3,
    normal: 1.45,
  },
} as const;

/**
 * Spacing scale (4px base).
 * md stays 16 for backward compatibility with existing screens.
 */
export const space = {
  xs: 4,
  sm: 8,
  /** 12 — tight grouping between related items */
  group: 12,
  /** 10 — dock / compact control padding */
  tight: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
  /** Cards / list rows */
  card: 18,
  /** Dock / large panels */
  panel: 22,
  pill: 999,
} as const;

export const layout = {
  screenPad: space.md,
  screenPadLg: space.lg,
  backSize: 36,
  listBottom: 40,
  dockPad: space.sm,
  hitTarget: 44,
  sceneInset: 8,
} as const;

export const shadow = {
  soft: {
    shadowColor: '#0A120E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  dock: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
} as const;

export function healthColor(healthPct: number): string {
  if (healthPct >= 70) return colors.sage500;
  if (healthPct >= 40) return colors.ember500;
  return colors.coral500;
}
