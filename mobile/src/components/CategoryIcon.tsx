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
      ) : name === 'supermarket' ? (
        <>
          <Rect x="4" y="6" width="16" height="14" rx="1" stroke={stroke} strokeWidth={s} />
          <Path d="M4 10 h16 M8 6 V4 h8 v2" stroke={stroke} strokeWidth={s} strokeLinecap="round" />
        </>
      ) : name === 'cinema' ? (
        <>
          <Rect x="3" y="8" width="18" height="10" rx="2" stroke={stroke} strokeWidth={s} />
          <Path d="M7 8 V6 h10 v2" stroke={stroke} strokeWidth={s} />
          <Circle cx="8" cy="13" r="1.2" fill={stroke} />
          <Circle cx="12" cy="13" r="1.2" fill={stroke} />
          <Circle cx="16" cy="13" r="1.2" fill={stroke} />
        </>
      ) : name === 'library' ? (
        <>
          <Path d="M5 6 h5 v12 H5 Z M14 6 h5 v12 h-5 Z" stroke={stroke} strokeWidth={s} strokeLinejoin="round" />
          <Path d="M10 6 v12" stroke={stroke} strokeWidth={s} />
        </>
      ) : name === 'university' ? (
        <>
          <Path d="M12 4 L20 8 v8 H4 V8 Z" stroke={stroke} strokeWidth={s} strokeLinejoin="round" />
          <Path d="M9 16 v4 M15 16 v4" stroke={stroke} strokeWidth={s} strokeLinecap="round" />
        </>
      ) : name === 'hospital' ? (
        <>
          <Rect x="6" y="6" width="12" height="14" rx="1" stroke={stroke} strokeWidth={s} />
          <Path d="M12 9 v6 M9 12 h6" stroke={stroke} strokeWidth={s} strokeLinecap="round" />
        </>
      ) : name === 'school' ? (
        <>
          <Path d="M4 10 L12 6 L20 10 L12 14 Z" stroke={stroke} strokeWidth={s} strokeLinejoin="round" />
          <Path d="M8 14 v6 M16 14 v6" stroke={stroke} strokeWidth={s} strokeLinecap="round" />
        </>
      ) : name === 'factory' ? (
        <>
          <Rect x="5" y="10" width="10" height="10" stroke={stroke} strokeWidth={s} />
          <Path d="M15 8 v12 M15 8 l3-3 v3" stroke={stroke} strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : name === 'office' ? (
        <>
          <Rect x="7" y="5" width="10" height="15" stroke={stroke} strokeWidth={s} />
          <Path d="M10 9 h4 M10 12 h4 M10 15 h4" stroke={stroke} strokeWidth={s} strokeLinecap="round" />
        </>
      ) : name === 'mall' ? (
        <>
          <Path d="M6 8 h12 v10 H6 Z" stroke={stroke} strokeWidth={s} strokeLinejoin="round" />
          <Path d="M9 8 V6 h6 v2" stroke={stroke} strokeWidth={s} />
          <Circle cx="12" cy="13" r="2" stroke={stroke} strokeWidth={s} />
        </>
      ) : name === 'car_workshop' ? (
        <>
          <Path d="M5 14 h14 l-1-4 H6 Z" stroke={stroke} strokeWidth={s} strokeLinejoin="round" />
          <Circle cx="8" cy="15" r="1.5" fill={stroke} />
          <Circle cx="16" cy="15" r="1.5" fill={stroke} />
          <Path d="M8 10 h8" stroke={stroke} strokeWidth={s} />
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
