import React from 'react';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

interface Props {
  value: 1 | 2;
  size?: number;
}

export function EuroCoin({ value, size = 36 }: Props) {
  const gold = value === 2;
  const outer = gold ? '#E8C45A' : '#C9C4B8';
  const inner = gold ? '#F4E6A8' : '#E8E4D8';
  const ink = gold ? '#6A4A18' : '#4A4840';
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36">
      <Circle cx="18" cy="20" r="14" fill="#1A2818" opacity={0.2} />
      <Circle cx="18" cy="17" r="14" fill={outer} />
      <Circle cx="18" cy="17" r="11" fill={inner} />
      <Circle cx="18" cy="17" r="11" fill="none" stroke={ink} strokeWidth={0.6} opacity={0.35} />
      <SvgText x="18" y="21" fontSize="10" fontWeight="700" fill={ink} textAnchor="middle">
        {value}€
      </SvgText>
    </Svg>
  );
}
