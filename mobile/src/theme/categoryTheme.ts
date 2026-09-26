import type { PocketId } from '@/types';

export type CategoryTheme = {
  accent: string;
  ink: string;
  pad: string;
  padShadow: string;
  top: string;
  left: string;
  right: string;
  roofL: string;
  roofR: string;
  bg: [string, string, string];
};

export const CATEGORY_THEME: Record<PocketId, CategoryTheme> = {
  vault: {
    accent: '#E8C45A',
    ink: '#FFE9A8',
    pad: '#D4B25A',
    padShadow: '#8A6A28',
    top: '#FBF3DC',
    left: '#E2C898',
    right: '#F6E7C2',
    roofL: '#C49232',
    roofR: '#E2B24A',
    bg: ['#2A2410', '#16120A', '#0C0A06'],
  },
  dining: {
    accent: '#E07A3A',
    ink: '#FFD2B0',
    pad: '#E08A4A',
    padShadow: '#8A4A22',
    top: '#F7E4C8',
    left: '#D4A070',
    right: '#F0C8A0',
    roofL: '#B84A28',
    roofR: '#E06A38',
    bg: ['#2A1610', '#1A100C', '#0E0A08'],
  },
  property: {
    accent: '#6BA3C9',
    ink: '#C8E4F4',
    pad: '#6B9AB8',
    padShadow: '#2A4A62',
    top: '#E4EEF4',
    left: '#A8BCC8',
    right: '#D4E2EA',
    roofL: '#4A6A82',
    roofR: '#7A9AB0',
    bg: ['#101820', '#0C141A', '#080C10'],
  },
  bills: {
    accent: '#C4A0E8',
    ink: '#EAD8FF',
    pad: '#A888D0',
    padShadow: '#4A3270',
    top: '#F0E8F8',
    left: '#C4B0D8',
    right: '#E4D8F0',
    roofL: '#7A58B0',
    roofR: '#B08AE0',
    bg: ['#1A1224', '#120C18', '#0A0810'],
  },
  transport: {
    accent: '#3DB8A0',
    ink: '#B8F4E8',
    pad: '#3AA090',
    padShadow: '#1A5A4E',
    top: '#D8EFE8',
    left: '#7AADA0',
    right: '#B4D8CC',
    roofL: '#2A6A5E',
    roofR: '#4A9A88',
    bg: ['#0C1A18', '#0A1412', '#06100E'],
  },
  groceries: {
    accent: '#8BC34A',
    ink: '#DCF0B4',
    pad: '#7AAA42',
    padShadow: '#3A5A18',
    top: '#E8F0C8',
    left: '#8AAA58',
    right: '#C4D890',
    roofL: '#5A7A30',
    roofR: '#8AAA48',
    bg: ['#141C0C', '#0E1408', '#0A0E06'],
  },
  credit_card_payment: {
    accent: '#C4B8A4',
    ink: '#EDE4D4',
    pad: '#B8A888',
    padShadow: '#5A5040',
    top: '#F0E8DC',
    left: '#C4B8A4',
    right: '#E4D8C8',
    roofL: '#7A6E5A',
    roofR: '#A89880',
    bg: ['#1A1814', '#12110E', '#0C0B09'],
  },
};

export function themeFor(id: PocketId): CategoryTheme {
  return CATEGORY_THEME[id] ?? CATEGORY_THEME.vault;
}
