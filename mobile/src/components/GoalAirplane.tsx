import React from 'react';
import Svg, { Ellipse, Path, Polygon } from 'react-native-svg';
import { colors } from '@/theme/tokens';

/** Level side-view plane — keep parent transforms at 0° so "Goals" stays upright. */
export function GoalAirplane({ size = 56 }: { size?: number }) {
  const h = Math.round(size * 0.62);
  return (
    <Svg width={size} height={h} viewBox="0 0 72 40">
      <Ellipse cx="36" cy="34" rx="16" ry="4" fill={colors.moss900} opacity={0.28} />
      {/* fuselage — level */}
      <Path
        d="M8 20 C18 16 28 14 42 14 C52 14 60 16 66 20 C60 22 52 24 42 24 C28 24 18 22 8 20Z"
        fill={colors.vaultGold}
      />
      <Path
        d="M14 19 C26 16 40 15 54 18 C44 19 30 20 14 19Z"
        fill={colors.inkGoldBright}
        opacity={0.85}
      />
      {/* wings — flat */}
      <Polygon points="28,20 44,12 48,20 44,28" fill={colors.gold500} />
      <Polygon points="30,20 44,14 46,20" fill={colors.inkGold} opacity={0.9} />
      {/* tail */}
      <Polygon points="10,20 4,12 8,20 4,26" fill={colors.ember500} />
      {/* cockpit */}
      <Ellipse cx="56" cy="18" rx="3" ry="2.2" fill={colors.moss700} />
      <Ellipse cx="56.6" cy="17.4" rx="1.1" ry="0.8" fill={colors.inkGold} opacity={0.75} />
    </Svg>
  );
}
