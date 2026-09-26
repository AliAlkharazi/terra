import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { DistrictId, PocketId } from '@/types';
import { themeFor } from '@/theme/categoryTheme';

type Name = DistrictId | 'vault' | 'more';

interface Props {
  name: Name;
  size?: number;
  color?: string;
}

export function CategoryIcon({ name, size = 22, color }: Props) {
  const stroke = color ?? (name === 'more' ? '#F0EAD6' : themeFor(name as PocketId).accent);
  const s = 2;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {name === 'vault' ? (
        <>
          <Rect x="5" y="8" width="14" height="12" rx="2" stroke={stroke} strokeWidth={s} />
          <Path d="M8 8 V6 a4 4 0 0 1 8 0 v2" stroke={stroke} strokeWidth={s} />
          <Circle cx="12" cy="14" r="1.6" fill={stroke} />
        </>
      ) : name === 'dining' ? (
        <>
          <Path d="M7 4 v9 M5 4 v5 a2 2 0 0 0 4 0 V4" stroke={stroke} strokeWidth={s} strokeLinecap="round" />
          <Path d="M17 4 v16 M15 4 h4 v4 h-4" stroke={stroke} strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : name === 'property' ? (
        <Path d="M4 11 L12 4 L20 11 V20 H4 Z" stroke={stroke} strokeWidth={s} strokeLinejoin="round" />
      ) : name === 'bills' ? (
        <>
          <Circle cx="12" cy="12" r="8" stroke={stroke} strokeWidth={s} />
          <Path d="M12 8 v5 l3 2" stroke={stroke} strokeWidth={s} strokeLinecap="round" />
        </>
      ) : name === 'transport' ? (
        <>
          <Rect x="4" y="7" width="16" height="9" rx="2" stroke={stroke} strokeWidth={s} />
          <Path d="M4 12 h16" stroke={stroke} strokeWidth={s} />
          <Circle cx="8" cy="18" r="1.6" fill={stroke} />
          <Circle cx="16" cy="18" r="1.6" fill={stroke} />
        </>
      ) : name === 'groceries' ? (
        <>
          <Path d="M5 8 h14 l-1.2 10 H6.2 Z" stroke={stroke} strokeWidth={s} strokeLinejoin="round" />
          <Path d="M9 8 V6 a3 3 0 0 1 6 0 v2" stroke={stroke} strokeWidth={s} />
        </>
      ) : name === 'credit_card_payment' ? (
        <>
          <Rect x="3" y="6" width="18" height="12" rx="2" stroke={stroke} strokeWidth={s} />
          <Path d="M3 10 h18" stroke={stroke} strokeWidth={s} />
        </>
      ) : (
        <>
          <Circle cx="6" cy="12" r="1.5" fill={stroke} />
          <Circle cx="12" cy="12" r="1.5" fill={stroke} />
          <Circle cx="18" cy="12" r="1.5" fill={stroke} />
        </>
      )}
    </Svg>
  );
}
