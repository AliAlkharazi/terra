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

  coral500: '#D96C5F',
  gold500: '#D4B25A',

  textOnMoss: '#F0EAD6',
  textOnMossDim: '#B9CBB9',
  textOnParchment: '#1B2E24',
  textOnParchmentDim: '#5A6B5D',
} as const;

export const type = {
  display: 'Baloo2_700Bold',
  displayMedium: 'Baloo2_600SemiBold',
  body: 'Manrope_500Medium',
  bodyBold: 'Manrope_700Bold',
  mono: 'Manrope_600SemiBold',

  size: { xs: 12, sm: 14, base: 16, lg: 20, xl: 26, xxl: 34, display: 44 },
} as const;

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { sm: 8, md: 16, lg: 24, pill: 999 } as const;

export function healthColor(healthPct: number): string {
  if (healthPct >= 70) return colors.sage500;
  if (healthPct >= 40) return colors.ember500;
  return colors.coral500;
}
