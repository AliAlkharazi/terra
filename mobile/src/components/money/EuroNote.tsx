import React from 'react';
import Svg, { Ellipse, G, Rect, Text as SvgText } from 'react-native-svg';

const PALETTE: Record<number, { face: string; edge: string; band: string; ink: string }> = {
  5: { face: '#D8CFC4', edge: '#B4A898', band: '#8A7A68', ink: '#3A2C22' },
  10: { face: '#E07A72', edge: '#B8504C', band: '#F4D4CE', ink: '#FFF8F4' },
  20: { face: '#5B9AD4', edge: '#2F6FA8', band: '#D4E8F8', ink: '#F4FBFF' },
  50: { face: '#E89A42', edge: '#C46E1E', band: '#F8E2C0', ink: '#FFF8F0' },
  100: { face: '#3F9A68', edge: '#2A704C', band: '#D4F0DC', ink: '#F4FFF8' },
};

interface Props {
  value: 5 | 10 | 20 | 50 | 100;
  width?: number;
}

export function EuroNote({ value, width = 118 }: Props) {
  const h = width * 0.54;
  const p = PALETTE[value];
  return (
    <Svg width={width} height={h} viewBox="0 0 118 64">
      <Ellipse cx="59" cy="58" rx="48" ry="5" fill="#1A2818" opacity={0.22} />
      <Rect x="4" y="8" width="110" height="46" rx="6" fill={p.edge} />
      <Rect x="6" y="6" width="106" height="44" rx="5" fill={p.face} />
      <Rect x="6" y="6" width="18" height="44" rx="5" fill={p.band} opacity={0.55} />
      <Rect x="94" y="6" width="18" height="44" rx="5" fill={p.band} opacity={0.4} />
      <G>
        <Ellipse cx="32" cy="28" rx="11" ry="11" fill={p.band} opacity={0.7} />
        <SvgText x="32" y="32" fontSize="9" fontWeight="700" fill={p.ink} textAnchor="middle">
          €
        </SvgText>
      </G>
      <SvgText x="72" y="30" fontSize="16" fontWeight="700" fill={p.ink} textAnchor="middle">
        {value}
      </SvgText>
      <SvgText x="72" y="42" fontSize="7" fontWeight="700" fill={p.ink} textAnchor="middle" opacity={0.8}>
        EURO
      </SvgText>
      <Rect x="10" y="10" width="98" height="36" rx="4" fill="none" stroke={p.ink} strokeWidth={0.6} opacity={0.25} />
    </Svg>
  );
}
