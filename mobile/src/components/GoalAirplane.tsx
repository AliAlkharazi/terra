import React from 'react';
import Svg, { Ellipse, Path, Polygon } from 'react-native-svg';

export function GoalAirplane({ size = 56 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 72 56">
      <Ellipse cx="36" cy="48" rx="18" ry="5" fill="#0E1A12" opacity={0.28} />
      <Polygon points="10,30 36,22 62,30 36,34" fill="#C9A24A" />
      <Polygon points="10,30 36,22 36,34" fill="#E8C45A" />
      <Path d="M18 28 C28 16 44 12 58 22 C48 24 36 26 18 28Z" fill="#F4E6C0" />
      <Path d="M22 27 C30 20 46 16 56 22 C46 23 34 26 22 27Z" fill="#FFF6DC" opacity={0.7} />
      <Polygon points="52,22 66,18 58,26" fill="#E8A24B" />
      <Polygon points="34,26 38,40 42,26" fill="#D4B25A" />
      <Ellipse cx="50" cy="22" rx="3.2" ry="2.4" fill="#3A4A22" />
      <Ellipse cx="50.8" cy="21.4" rx="1.2" ry="0.9" fill="#F4E6A8" opacity={0.8} />
    </Svg>
  );
}
