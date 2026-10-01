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

const make = (
  accent: string,
  ink: string,
  pad: string,
  padShadow: string,
  top: string,
  left: string,
  right: string,
  roofL: string,
  roofR: string,
  bg: [string, string, string]
): CategoryTheme => ({ accent, ink, pad, padShadow, top, left, right, roofL, roofR, bg });

export const CATEGORY_THEME: Record<PocketId, CategoryTheme> = {
  vault: make('#E8C45A', '#FFE9A8', '#D4B25A', '#8A6A28', '#FBF3DC', '#E2C898', '#F6E7C2', '#C49232', '#E2B24A', ['#2A2410', '#16120A', '#0C0A06']),
  dining: make('#E07A3A', '#FFD2B0', '#E08A4A', '#8A4A22', '#F7E4C8', '#D4A070', '#F0C8A0', '#B84A28', '#E06A38', ['#2A1610', '#1A100C', '#0E0A08']),
  property: make('#6BA3C9', '#C8E4F4', '#6B9AB8', '#2A4A62', '#E4EEF4', '#A8BCC8', '#D4E2EA', '#4A6A82', '#7A9AB0', ['#101820', '#0C141A', '#080C10']),
  bills: make('#C4A0E8', '#EAD8FF', '#A888D0', '#4A3270', '#F0E8F8', '#C4B0D8', '#E4D8F0', '#7A58B0', '#B08AE0', ['#1A1224', '#120C18', '#0A0810']),
  transport: make('#3DB8A0', '#B8F4E8', '#3AA090', '#1A5A4E', '#D8EFE8', '#7AADA0', '#B4D8CC', '#2A6A5E', '#4A9A88', ['#0C1A18', '#0A1412', '#06100E']),
  groceries: make('#8BC34A', '#DCF0B4', '#7AAA42', '#3A5A18', '#E8F0C8', '#8AAA58', '#C4D890', '#5A7A30', '#8AAA48', ['#141C0C', '#0E1408', '#0A0E06']),
  supermarket: make('#66BB6A', '#D4F0D6', '#5A9E5E', '#2A5A2E', '#E0F0E2', '#7AAA7E', '#C0DCC2', '#3A7A40', '#6AAA6E', ['#101810', '#0C140C', '#081008']),
  cinema: make('#EF5350', '#FFD0D0', '#D45A58', '#7A2828', '#F8E0E0', '#C88888', '#E8C0C0', '#A03030', '#D05050', ['#241010', '#180C0C', '#100808']),
  library: make('#8D6E63', '#E8D8D0', '#8A6E60', '#4A382E', '#F0E6E0', '#B09890', '#D8C8C0', '#6A4E42', '#9A7A6A', ['#1A1410', '#120E0C', '#0C0A08']),
  university: make('#5C6BC0', '#D0D6F4', '#5A68B0', '#2A3268', '#E0E4F4', '#9098C8', '#C4C8E4', '#3A4288', '#6A72B8', ['#121428', '#0C0E1A', '#080A12']),
  hospital: make('#42A5F5', '#D0EAFB', '#4A96D0', '#1A4A72', '#E0F0FA', '#88B4D8', '#C0DCEC', '#2A6A9A', '#5A9AD0', ['#0E1824', '#0A121A', '#060C12']),
  school: make('#FFA726', '#FFE4C0', '#E09840', '#8A5820', '#F8E8D0', '#D0A870', '#F0D0A0', '#B07020', '#E09030', ['#24180C', '#181208', '#100C06']),
  factory: make('#78909C', '#D8E0E4', '#6A808C', '#2A3840', '#E4EAEC', '#98A8B0', '#C8D4D8', '#4A5A62', '#7A8A94', ['#14181A', '#0E1214', '#080C0E']),
  office: make('#26A69A', '#C8F0EC', '#2A9088', '#14504C', '#D8F0EC', '#70B0A8', '#B0D8D0', '#1A6A62', '#3A9A90', ['#0C1A18', '#081412', '#06100E']),
  mall: make('#AB47BC', '#F0D4F4', '#9A48A8', '#4A2058', '#F4E0F6', '#C090C8', '#E4C0E8', '#7A3088', '#B050C0', ['#1A1020', '#120C18', '#0C0810']),
  car_workshop: make('#FF7043', '#FFD8C8', '#E06840', '#8A3820', '#F8E0D4', '#D09070', '#F0C8B0', '#B04828', '#E06840', ['#24140C', '#180E08', '#100A06']),
  credit_card_payment: make('#C4B8A4', '#EDE4D4', '#B8A888', '#5A5040', '#F0E8DC', '#C4B8A4', '#E4D8C8', '#7A6E5A', '#A89880', ['#1A1814', '#12110E', '#0C0B09']),
};

export function themeFor(id: PocketId): CategoryTheme {
  return CATEGORY_THEME[id] ?? CATEGORY_THEME.vault;
}
